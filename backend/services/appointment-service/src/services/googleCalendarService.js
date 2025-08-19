const { google } = require('googleapis');
const config = require('../config');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

class GoogleCalendarService {
  constructor() {
    this.auth = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    if (config.google.refreshToken) {
      this.auth.setCredentials({
        refresh_token: config.google.refreshToken
      });
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  async createAppointmentEvent(appointment, clinicContext) {
    try {
      const event = {
        summary: `${appointment.service_name} - ${appointment.patient_name}`,
        description: this.buildEventDescription(appointment, clinicContext),
        start: {
          dateTime: this.formatDateTime(appointment.scheduled_date, appointment.scheduled_time),
          timeZone: config.appointment.timezone
        },
        end: {
          dateTime: this.formatDateTime(
            appointment.scheduled_date, 
            appointment.scheduled_time, 
            appointment.duration
          ),
          timeZone: config.appointment.timezone
        },
        attendees: [
          { email: appointment.patient_email || 'patient@example.com' },
          { email: clinicContext.email || 'clinic@example.com' }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 60 } // 1 hora antes
          ]
        },
        metadata: {
          appointment_id: appointment.id,
          clinic_id: appointment.clinic_id,
          patient_phone: appointment.patient_phone,
          source: 'atendeai'
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: config.google.calendarId,
        resource: event,
        sendUpdates: 'all'
      });

      logger.info('Google Calendar event created', { 
        event_id: response.data.id,
        appointment_id: appointment.id,
        calendar_id: config.google.calendarId
      });

      return {
        event_id: response.data.id,
        html_link: response.data.htmlLink,
        created: response.data.created
      };
    } catch (error) {
      logger.error('Error creating Google Calendar event', { 
        error: error.message, 
        appointment_id: appointment.id 
      });
      throw error;
    }
  }

  async updateAppointmentEvent(googleEventId, appointment, clinicContext) {
    try {
      const event = {
        summary: `${appointment.service_name} - ${appointment.patient_name}`,
        description: this.buildEventDescription(appointment, clinicContext),
        start: {
          dateTime: this.formatDateTime(appointment.scheduled_date, appointment.scheduled_time),
          timeZone: config.appointment.timezone
        },
        end: {
          dateTime: this.formatDateTime(
            appointment.scheduled_date, 
            appointment.scheduled_time, 
            appointment.duration
          ),
          timeZone: config.appointment.timezone
        },
        attendees: [
          { email: appointment.patient_email || 'patient@example.com' },
          { email: clinicContext.email || 'clinic@example.com' }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 }
          ]
        }
      };

      const response = await this.calendar.events.update({
        calendarId: config.google.calendarId,
        eventId: googleEventId,
        resource: event,
        sendUpdates: 'all'
      });

      logger.info('Google Calendar event updated', { 
        event_id: response.data.id,
        appointment_id: appointment.id
      });

      return {
        event_id: response.data.id,
        html_link: response.data.htmlLink,
        updated: response.data.updated
      };
    } catch (error) {
      logger.error('Error updating Google Calendar event', { 
        error: error.message, 
        event_id: googleEventId,
        appointment_id: appointment.id 
      });
      throw error;
    }
  }

  async deleteAppointmentEvent(googleEventId) {
    try {
      await this.calendar.events.delete({
        calendarId: config.google.calendarId,
        eventId: googleEventId,
        sendUpdates: 'all'
      });

      logger.info('Google Calendar event deleted', { event_id: googleEventId });

      return { deleted: true };
    } catch (error) {
      logger.error('Error deleting Google Calendar event', { 
        error: error.message, 
        event_id: googleEventId 
      });
      throw error;
    }
  }

  async getCalendarEvents(startDate, endDate, maxResults = 100) {
    try {
      const response = await this.calendar.events.list({
        calendarId: config.google.calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      
      logger.info('Google Calendar events retrieved', { 
        count: events.length,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      return events;
    } catch (error) {
      logger.error('Error getting Google Calendar events', { 
        error: error.message, 
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      throw error;
    }
  }

  async syncAppointmentsToCalendar(appointments, clinicContext) {
    try {
      const syncResults = {
        created: 0,
        updated: 0,
        deleted: 0,
        errors: 0,
        details: []
      };

      for (const appointment of appointments) {
        try {
          if (appointment.google_event_id) {
            // Atualizar evento existente
            await this.updateAppointmentEvent(appointment.google_event_id, appointment, clinicContext);
            syncResults.updated++;
            syncResults.details.push({
              appointment_id: appointment.id,
              action: 'updated',
              status: 'success'
            });
          } else {
            // Criar novo evento
            const eventResult = await this.createAppointmentEvent(appointment, clinicContext);
            syncResults.created++;
            syncResults.details.push({
              appointment_id: appointment.id,
              action: 'created',
              status: 'success',
              google_event_id: eventResult.event_id
            });
          }
        } catch (error) {
          syncResults.errors++;
          syncResults.details.push({
            appointment_id: appointment.id,
            action: 'failed',
            status: 'error',
            error: error.message
          });
          
          logger.error('Error syncing appointment to calendar', { 
            error: error.message, 
            appointment_id: appointment.id 
          });
        }
      }

      logger.info('Calendar sync completed', { 
        total_appointments: appointments.length,
        sync_results: syncResults
      });

      return syncResults;
    } catch (error) {
      logger.error('Error during calendar sync', { error: error.message });
      throw error;
    }
  }

  async handleWebhookNotification(notification) {
    try {
      // Processar notificações do Google Calendar
      if (notification.type === 'sync') {
        await this.syncFromCalendar();
      }

      logger.info('Google Calendar webhook processed', { 
        notification_type: notification.type 
      });

      return { processed: true };
    } catch (error) {
      logger.error('Error processing Google Calendar webhook', { 
        error: error.message, 
        notification 
      });
      throw error;
    }
  }

  async syncFromCalendar() {
    try {
      const now = moment().tz(config.appointment.timezone);
      const endDate = moment().add(30, 'days').tz(config.appointment.timezone);

      const events = await this.getCalendarEvents(now, endDate);

      logger.info('Calendar sync from Google initiated', { 
        events_count: events.length,
        sync_period: '30 days'
      });

      // Implementar lógica para sincronizar eventos do Google Calendar
      // com os agendamentos locais
      
      return { synced_events: events.length };
    } catch (error) {
      logger.error('Error syncing from Google Calendar', { error: error.message });
      throw error;
    }
  }

  async getCalendarAvailability(startDate, endDate, professionalId = null) {
    try {
      const events = await this.getCalendarEvents(startDate, endDate);
      
      // Filtrar eventos por profissional se especificado
      const filteredEvents = professionalId 
        ? events.filter(event => 
            event.attendees?.some(attendee => 
              attendee.email === professionalId || 
              event.summary?.includes(professionalId)
            )
          )
        : events;

      const availability = this.calculateAvailability(startDate, endDate, filteredEvents);

      logger.info('Calendar availability calculated', { 
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        professional_id: professionalId,
        available_slots: availability.available_slots.length
      });

      return availability;
    } catch (error) {
      logger.error('Error getting calendar availability', { 
        error: error.message, 
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        professional_id: professionalId
      });
      throw error;
    }
  }

  calculateAvailability(startDate, endDate, events) {
    const availability = {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      total_slots: 0,
      booked_slots: events.length,
      available_slots: []
    };

    // Implementar lógica para calcular slots disponíveis
    // baseado nos horários de funcionamento e eventos existentes

    return availability;
  }

  buildEventDescription(appointment, clinicContext) {
    let description = `Agendamento via AtendeAI\n\n`;
    description += `Paciente: ${appointment.patient_name}\n`;
    description += `Telefone: ${appointment.patient_phone}\n`;
    description += `Serviço: ${appointment.service_name}\n`;
    
    if (appointment.professional_name) {
      description += `Profissional: ${appointment.professional_name}\n`;
    }
    
    if (clinicContext.name) {
      description += `Clínica: ${clinicContext.name}\n`;
    }
    
    if (clinicContext.address) {
      description += `Endereço: ${clinicContext.address}\n`;
    }
    
    description += `\nPara reagendar ou cancelar, entre em contato via WhatsApp.`;
    
    return description;
  }

  formatDateTime(date, time, durationMinutes = 0) {
    const dateTime = moment.tz(`${date} ${time}`, config.appointment.timezone);
    
    if (durationMinutes > 0) {
      dateTime.add(durationMinutes, 'minutes');
    }
    
    return dateTime.toISOString();
  }

  async testConnection() {
    try {
      const response = await this.calendar.calendarList.list();
      
      logger.info('Google Calendar connection test successful', { 
        calendars_count: response.data.items?.length || 0 
      });
      
      return { 
        connected: true, 
        calendars: response.data.items || [],
        primary_calendar: config.google.calendarId
      };
    } catch (error) {
      logger.error('Google Calendar connection test failed', { error: error.message });
      
      return { 
        connected: false, 
        error: error.message 
      };
    }
  }

  async refreshAccessToken() {
    try {
      const { credentials } = await this.auth.refreshAccessToken();
      
      logger.info('Google Calendar access token refreshed');
      
      return { 
        refreshed: true, 
        expires_in: credentials.expires_in 
      };
    } catch (error) {
      logger.error('Error refreshing Google Calendar access token', { error: error.message });
      throw error;
    }
  }
}

module.exports = GoogleCalendarService;
