const GoogleCalendarService = require('../services/googleCalendarService');
const CalendarEvent = require('../models/calendarEvent');
const logger = require('../utils/logger');

class GoogleCalendarController {
  constructor() {
    this.googleCalendarService = new GoogleCalendarService();
  }

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
