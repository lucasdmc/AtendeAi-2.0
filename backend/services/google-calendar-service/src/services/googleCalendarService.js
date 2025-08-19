const { google } = require('googleapis');
const moment = require('moment-timezone');
const config = require('../config');
const logger = require('../utils/logger');
const CalendarEvent = require('../models/calendarEvent');
const redis = require('../config/redis');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    this.calendarId = config.google.calendarId;
    this.timezone = config.google.timezone;
    this.maxResults = config.google.maxResults;
    this.retryAttempts = config.google.retryAttempts;
    this.retryDelay = config.google.retryDelay;
  }

  async setCredentials(accessToken, refreshToken = null) {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      logger.info('Google Calendar credentials set successfully');
      return true;
    } catch (error) {
      logger.error('Error setting Google Calendar credentials', { error: error.message });
      throw error;
    }
  }

  async createEvent(eventData) {
    try {
      const { 
        clinic_id, 
        appointment_id,
        title, 
        description, 
        start_time, 
        end_time, 
        attendees = [],
        location = '',
        metadata = {}
      } = eventData;

      const event = {
        summary: title,
        description: description,
        start: {
          dateTime: moment(start_time).tz(this.timezone).format(),
          timeZone: this.timezone
        },
        end: {
          dateTime: moment(end_time).tz(this.timezone).format(),
          timeZone: this.timezone
        },
        attendees: attendees.map(email => ({ email })),
        location: location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 60 } // 1 hora antes
          ]
        },
        extendedProperties: {
          private: {
            clinic_id: clinic_id,
            appointment_id: appointment_id,
            ...metadata
          }
        }
      };

      const response = await this.makeCalendarRequest('insert', {
        calendarId: this.calendarId,
        resource: event,
        sendUpdates: 'all'
      });

      if (response.data && response.data.id) {
        const googleEventId = response.data.id;
        
        const savedEvent = await CalendarEvent.create({
          clinic_id,
          appointment_id,
          google_event_id: googleEventId,
          title,
          description,
          start_time,
          end_time,
          timezone: this.timezone,
          attendees,
          location,
          status: 'confirmed',
          metadata: {
            google_response: response.data,
            ...metadata
          }
        });

        logger.info('Google Calendar event created successfully', {
          event_id: savedEvent.id,
          google_event_id: googleEventId,
          clinic_id,
          title
        });

        return {
          success: true,
          event_id: savedEvent.id,
          google_event_id: googleEventId,
          status: 'created'
        };
      }

      throw new Error('Invalid response from Google Calendar API');
    } catch (error) {
      logger.error('Error creating Google Calendar event', {
        error: error.message,
        eventData
      });
      throw error;
    }
  }

  async updateEvent(googleEventId, updateData) {
    try {
      const { 
        title, 
        description, 
        start_time, 
        end_time, 
        attendees = [],
        location = '',
        metadata = {}
      } = updateData;

      const event = {
        summary: title,
        description: description,
        start: {
          dateTime: moment(start_time).tz(this.timezone).format(),
          timeZone: this.timezone
        },
        end: {
          dateTime: moment(end_time).tz(this.timezone).format(),
          timeZone: this.timezone
        },
        attendees: attendees.map(email => ({ email })),
        location: location
      };

      const response = await this.makeCalendarRequest('update', {
        calendarId: this.calendarId,
        eventId: googleEventId,
        resource: event,
        sendUpdates: 'all'
      });

      if (response.data && response.data.id) {
        const localEvent = await CalendarEvent.findByGoogleEventId(googleEventId);
        if (localEvent) {
          await CalendarEvent.update(localEvent.id, {
            title,
            description,
            start_time,
            end_time,
            attendees,
            location,
            metadata: {
              ...localEvent.metadata,
              last_update: new Date().toISOString(),
              ...metadata
            }
          });
        }

        logger.info('Google Calendar event updated successfully', {
          google_event_id: googleEventId,
          title
        });

        return {
          success: true,
          google_event_id: googleEventId,
          status: 'updated'
        };
      }

      throw new Error('Invalid response from Google Calendar API');
    } catch (error) {
      logger.error('Error updating Google Calendar event', {
        error: error.message,
        googleEventId,
        updateData
      });
      throw error;
    }
  }

  async deleteEvent(googleEventId) {
    try {
      await this.makeCalendarRequest('delete', {
        calendarId: this.calendarId,
        eventId: googleEventId,
        sendUpdates: 'all'
      });

      const localEvent = await CalendarEvent.findByGoogleEventId(googleEventId);
      if (localEvent) {
        await CalendarEvent.updateStatus(localEvent.id, 'cancelled', {
          deleted_at: new Date().toISOString(),
          deletion_reason: 'deleted_from_google_calendar'
        });
      }

      logger.info('Google Calendar event deleted successfully', {
        google_event_id: googleEventId
      });

      return {
        success: true,
        google_event_id: googleEventId,
        status: 'deleted'
      };
    } catch (error) {
      logger.error('Error deleting Google Calendar event', {
        error: error.message,
        googleEventId
      });
      throw error;
    }
  }

  async getEvent(googleEventId) {
    try {
      const response = await this.makeCalendarRequest('get', {
        calendarId: this.calendarId,
        eventId: googleEventId
      });

      if (response.data) {
        logger.info('Google Calendar event retrieved successfully', {
          google_event_id: googleEventId
        });

        return response.data;
      }

      throw new Error('Invalid response from Google Calendar API');
    } catch (error) {
      logger.error('Error getting Google Calendar event', {
        error: error.message,
        googleEventId
      });
      throw error;
    }
  }

  async listEvents(clinic_id, startDate = null, endDate = null, maxResults = null) {
    try {
      const timeMin = startDate ? moment(startDate).tz(this.timezone).format() : moment().tz(this.timezone).format();
      const timeMax = endDate ? moment(endDate).tz(this.timezone).format() : moment().add(30, 'days').tz(this.timezone).format();

      const response = await this.makeCalendarRequest('list', {
        calendarId: this.calendarId,
        timeMin,
        timeMax,
        maxResults: maxResults || this.maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      if (response.data && response.data.items) {
        const events = response.data.items;
        
        // Filtrar eventos da clínica específica
        const clinicEvents = events.filter(event => {
          const clinicId = event.extendedProperties?.private?.clinic_id;
          return clinicId === clinic_id;
        });

        logger.info('Google Calendar events listed successfully', {
          clinic_id,
          total_events: events.length,
          clinic_events: clinicEvents.length,
          start_date: timeMin,
          end_date: timeMax
        });

        return clinicEvents;
      }

      throw new Error('Invalid response from Google Calendar API');
    } catch (error) {
      logger.error('Error listing Google Calendar events', {
        error: error.message,
        clinic_id,
        startDate,
        endDate
      });
      throw error;
    }
  }

  async syncEvents(clinic_id, startDate = null, endDate = null) {
    try {
      logger.info('Starting Google Calendar sync', { clinic_id, startDate, endDate });

      const googleEvents = await this.listEvents(clinic_id, startDate, endDate);
      const localEvents = await CalendarEvent.findByClinic(clinic_id, startDate, endDate);
      
      const syncResults = {
        created: 0,
        updated: 0,
        deleted: 0,
        errors: 0
      };

      // Sincronizar eventos do Google para local
      for (const googleEvent of googleEvents) {
        try {
          const existingEvent = localEvents.find(event => 
            event.google_event_id === googleEvent.id
          );

          if (existingEvent) {
            // Atualizar evento existente
            await CalendarEvent.update(existingEvent.id, {
              title: googleEvent.summary,
              description: googleEvent.description,
              start_time: googleEvent.start.dateTime || googleEvent.start.date,
              end_time: googleEvent.end.dateTime || googleEvent.end.date,
              attendees: googleEvent.attendees?.map(a => a.email) || [],
              location: googleEvent.location || '',
              metadata: {
                ...existingEvent.metadata,
                last_sync: new Date().toISOString(),
                google_data: googleEvent
              }
            });
            syncResults.updated++;
          } else {
            // Criar novo evento
            await CalendarEvent.create({
              clinic_id,
              appointment_id: googleEvent.extendedProperties?.private?.appointment_id,
              google_event_id: googleEvent.id,
              title: googleEvent.summary,
              description: googleEvent.description,
              start_time: googleEvent.start.dateTime || googleEvent.start.date,
              end_time: googleEvent.end.dateTime || googleEvent.end.date,
              timezone: this.timezone,
              attendees: googleEvent.attendees?.map(a => a.email) || [],
              location: googleEvent.location || '',
              status: googleEvent.status || 'confirmed',
              metadata: {
                google_data: googleEvent,
                sync_source: 'google_calendar'
              }
            });
            syncResults.created++;
          }
        } catch (error) {
          logger.error('Error syncing individual event', {
            error: error.message,
            google_event_id: googleEvent.id
          });
          syncResults.errors++;
        }
      }

      // Verificar eventos locais que não existem mais no Google
      if (config.synchronization.bidirectional) {
        for (const localEvent of localEvents) {
          if (localEvent.google_event_id && !googleEvents.find(e => e.id === localEvent.google_event_id)) {
            try {
              await CalendarEvent.updateStatus(localEvent.id, 'deleted', {
                sync_status: 'deleted_from_google',
                deleted_at: new Date().toISOString()
              });
              syncResults.deleted++;
            } catch (error) {
              logger.error('Error marking local event as deleted', {
                error: error.message,
                event_id: localEvent.id
              });
              syncResults.errors++;
            }
          }
        }
      }

      logger.info('Google Calendar sync completed', {
        clinic_id,
        sync_results: syncResults
      });

      return syncResults;
    } catch (error) {
      logger.error('Error during Google Calendar sync', {
        error: error.message,
        clinic_id
      });
      throw error;
    }
  }

  async getAvailableSlots(clinic_id, date, durationMinutes = 30) {
    try {
      const startOfDay = moment(date).tz(this.timezone).startOf('day');
      const endOfDay = moment(date).tz(this.timezone).endOf('day');
      
      const events = await this.listEvents(clinic_id, startOfDay.format(), endOfDay.format());
      
      const workingStart = moment(date).tz(this.timezone).set('hour', 8).set('minute', 0);
      const workingEnd = moment(date).tz(this.timezone).set('hour', 18).set('minute', 0);
      
      const slots = [];
      let currentTime = workingStart.clone();
      
      while (currentTime.isBefore(workingEnd)) {
        const slotEnd = currentTime.clone().add(durationMinutes, 'minutes');
        
        if (slotEnd.isAfter(workingEnd)) break;
        
        const hasConflict = events.some(event => {
          const eventStart = moment(event.start.dateTime || event.start.date);
          const eventEnd = moment(event.end.dateTime || event.end.date);
          
          return (
            (currentTime.isBefore(eventEnd) && slotEnd.isAfter(eventStart)) ||
            (eventStart.isBefore(slotEnd) && eventEnd.isAfter(currentTime))
          );
        });
        
        if (!hasConflict) {
          slots.push({
            start: currentTime.format(),
            end: slotEnd.format(),
            duration: durationMinutes
          });
        }
        
        currentTime.add(30, 'minutes');
      }

      logger.info('Available slots calculated', {
        clinic_id,
        date,
        total_slots: slots.length
      });

      return slots;
    } catch (error) {
      logger.error('Error calculating available slots', {
        error: error.message,
        clinic_id,
        date
      });
      throw error;
    }
  }

  async makeCalendarRequest(method, params) {
    let attempts = 0;
    
    while (attempts < this.retryAttempts) {
      try {
        const response = await this.calendar.events[method](params);
        return response;
      } catch (error) {
        attempts++;
        
        if (attempts >= this.retryAttempts) {
          logger.error('Max retries reached for Google Calendar request', {
            method,
            params,
            attempts,
            error: error.message
          });
          throw error;
        }

        if (error.code >= 500 || error.code === 429) {
          logger.warn(`Retrying Google Calendar request (${attempts}/${this.retryAttempts})`, {
            method,
            code: error.code
          });
          
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempts));
        } else {
          throw error;
        }
      }
    }
  }

  async testConnection() {
    try {
      const response = await this.makeCalendarRequest('list', {
        calendarId: this.calendarId,
        maxResults: 1
      });

      logger.info('Google Calendar connection test successful');
      
      return {
        connected: true,
        calendar_id: this.calendarId,
        timezone: this.timezone,
        api_working: true
      };
    } catch (error) {
      logger.error('Google Calendar connection test failed', { error: error.message });
      
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async getCalendarInfo() {
    try {
      const response = await this.calendar.calendars.get({
        calendarId: this.calendarId
      });

      if (response.data) {
        logger.info('Google Calendar info retrieved successfully');
        return response.data;
      }

      throw new Error('Invalid response from Google Calendar API');
    } catch (error) {
      logger.error('Error getting Google Calendar info', { error: error.message });
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      this.oauth2Client.setCredentials(credentials);
      
      logger.info('Google Calendar access token refreshed successfully');
      
      return credentials;
    } catch (error) {
      logger.error('Error refreshing Google Calendar access token', { error: error.message });
      throw error;
    }
  }
}

module.exports = GoogleCalendarService;
