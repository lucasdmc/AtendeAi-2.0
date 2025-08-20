const GoogleCalendarService = require('../services/googleCalendarService');
const CalendarEvent = require('../models/calendarEvent');
const logger = require('../utils/logger');

class GoogleCalendarController {
  constructor() {
    this.googleCalendarService = new GoogleCalendarService();
  }

  // =====================================================
  // ROTAS DE OAUTH2
  // =====================================================

  // GET /api/v1/calendar/oauth/authorize
  // Inicia o fluxo de autorização OAuth2
  async authorize(req, res) {
    try {
      const { clinic_id, redirect_uri } = req.query;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const authUrl = await this.googleCalendarService.getAuthorizationUrl(clinic_id, redirect_uri);

      res.json({
        success: true,
        data: {
          auth_url: authUrl,
          clinic_id
        }
      });

    } catch (error) {
      logger.error('Error getting authorization URL', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting authorization URL',
        details: error.message
      });
    }
  }

  // GET /api/v1/calendar/oauth/callback
  // Callback do OAuth2
  async oauthCallback(req, res) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'OAuth authorization failed',
          details: error
        });
      }

      if (!code || !state) {
        return res.status(400).json({
          success: false,
          error: 'Missing required OAuth parameters'
        });
      }

      const result = await this.googleCalendarService.handleOAuthCallback(code, state);

      res.json({
        success: true,
        data: result,
        message: 'OAuth authorization completed successfully'
      });

    } catch (error) {
      logger.error('Error handling OAuth callback', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error handling OAuth callback',
        details: error.message
      });
    }
  }

  // =====================================================
  // CONFIGURAÇÃO DE CLÍNICAS
  // =====================================================

  // GET /api/v1/calendar/clinics/:clinic_id/config
  // Obtém configuração do Google Calendar de uma clínica
  async getClinicConfig(req, res) {
    try {
      const { clinic_id } = req.params;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: clinic_id'
        });
      }

      const config = await this.googleCalendarService.getClinicConfig(clinic_id);

      res.json({
        success: true,
        data: config
      });

    } catch (error) {
      logger.error('Error getting clinic config', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting clinic config',
        details: error.message
      });
    }
  }

  // PUT /api/v1/calendar/clinics/:clinic_id/config
  // Atualiza configuração do Google Calendar de uma clínica
  async updateClinicConfig(req, res) {
    try {
      const { clinic_id } = req.params;
      const configData = req.body;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: clinic_id'
        });
      }

      const config = await this.googleCalendarService.updateClinicConfig(clinic_id, configData);

      res.json({
        success: true,
        data: config,
        message: 'Clinic configuration updated successfully'
      });

    } catch (error) {
      logger.error('Error updating clinic config', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error updating clinic config',
        details: error.message
      });
    }
  }

  // DELETE /api/v1/calendar/clinics/:clinic_id/config
  // Remove configuração do Google Calendar de uma clínica
  async deleteClinicConfig(req, res) {
    try {
      const { clinic_id } = req.params;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: clinic_id'
        });
      }

      await this.googleCalendarService.deleteClinicConfig(clinic_id);

      res.json({
        success: true,
        message: 'Clinic configuration deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting clinic config', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error deleting clinic config',
        details: error.message
      });
    }
  }

  // =====================================================
  // GESTÃO DE EVENTOS
  // =====================================================

  async createEvent(req, res) {
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
      } = req.body;

      if (!clinic_id || !title || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, title, start_time, end_time'
        });
      }

      const result = await this.googleCalendarService.createEvent({
        clinic_id,
        appointment_id,
        title,
        description,
        start_time,
        end_time,
        attendees,
        location,
        metadata
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error creating Google Calendar event', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error creating event',
        details: error.message
      });
    }
  }

  async updateEvent(req, res) {
    try {
      const { google_event_id } = req.params;
      const updateData = req.body;

      if (!google_event_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: google_event_id'
        });
      }

      const result = await this.googleCalendarService.updateEvent(google_event_id, updateData);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error updating Google Calendar event', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error updating event',
        details: error.message
      });
    }
  }

  async deleteEvent(req, res) {
    try {
      const { google_event_id } = req.params;

      if (!google_event_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: google_event_id'
        });
      }

      const result = await this.googleCalendarService.deleteEvent(google_event_id);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error deleting Google Calendar event', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error deleting event',
        details: error.message
      });
    }
  }

  async getEvent(req, res) {
    try {
      const { google_event_id } = req.params;

      if (!google_event_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: google_event_id'
        });
      }

      const result = await this.googleCalendarService.getEvent(google_event_id);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error getting Google Calendar event', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting event',
        details: error.message
      });
    }
  }

  async listEvents(req, res) {
    try {
      const { clinic_id, start_date, end_date, max_results } = req.query;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const result = await this.googleCalendarService.listEvents(
        clinic_id, 
        start_date, 
        end_date, 
        max_results ? parseInt(max_results) : null
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error listing Google Calendar events', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error listing events',
        details: error.message
      });
    }
  }

  async syncEvents(req, res) {
    try {
      const { clinic_id, start_date, end_date } = req.body;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const result = await this.googleCalendarService.syncEvents(clinic_id, start_date, end_date);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error syncing Google Calendar events', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error syncing events',
        details: error.message
      });
    }
  }

  async getAvailableSlots(req, res) {
    try {
      const { clinic_id, date, duration_minutes = 30 } = req.query;

      if (!clinic_id || !date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, date'
        });
      }

      const result = await this.googleCalendarService.getAvailableSlots(
        clinic_id, 
        date, 
        parseInt(duration_minutes)
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error getting available slots', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting available slots',
        details: error.message
      });
    }
  }

  async testConnection(req, res) {
    try {
      const result = await this.googleCalendarService.testConnection();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error testing Google Calendar connection', { error: error.message });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error testing connection',
        details: error.message
      });
    }
  }

  async getCalendarInfo(req, res) {
    try {
      const result = await this.googleCalendarService.getCalendarInfo();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error getting Google Calendar info', { error: error.message });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting calendar info',
        details: error.message
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const result = await this.googleCalendarService.refreshAccessToken();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error refreshing Google Calendar token', { error: error.message });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error refreshing token',
        details: error.message
      });
    }
  }

  async getEventStats(req, res) {
    try {
      const { clinic_id, start_date, end_date } = req.query;

      if (!clinic_id || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, start_date, end_date'
        });
      }

      const stats = await CalendarEvent.getEventStats(clinic_id, start_date, end_date);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting event stats', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting event stats',
        details: error.message
      });
    }
  }

  async getUpcomingEvents(req, res) {
    try {
      const { clinic_id, hours = 24 } = req.query;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const events = await CalendarEvent.findUpcoming(clinic_id, parseInt(hours));

      res.json({
        success: true,
        data: {
          events,
          hours: parseInt(hours),
          count: events.length
        }
      });

    } catch (error) {
      logger.error('Error getting upcoming events', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting upcoming events',
        details: error.message
      });
    }
  }

  async getConflicts(req, res) {
    try {
      const { clinic_id, start_time, end_time, exclude_event_id } = req.query;

      if (!clinic_id || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, start_time, end_time'
        });
      }

      const conflicts = await CalendarEvent.getConflicts(
        clinic_id, 
        start_time, 
        end_time, 
        exclude_event_id
      );

      res.json({
        success: true,
        data: {
          conflicts,
          count: conflicts.length
        }
      });

    } catch (error) {
      logger.error('Error getting event conflicts', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting event conflicts',
        details: error.message
      });
    }
  }
}

module.exports = GoogleCalendarController;
