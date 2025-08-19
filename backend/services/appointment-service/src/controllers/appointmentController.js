const Appointment = require('../models/appointment');
const Service = require('../models/service');
const Professional = require('../models/professional');
const AppointmentFlowManager = require('../services/appointmentFlowManager');
const GoogleCalendarService = require('../services/googleCalendarService');
const logger = require('../utils/logger');

class AppointmentController {
  constructor() {
    this.flowManager = new AppointmentFlowManager();
    this.googleCalendar = new GoogleCalendarService();
  }

  async startAppointmentFlow(req, res) {
    try {
      const { clinic_id, patient_phone, patient_name } = req.body;

      if (!clinic_id || !patient_phone || !patient_name) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone, patient_name'
        });
      }

      const flow = await this.flowManager.startFlow(clinic_id, patient_phone, patient_name);

      res.json({
        success: true,
        data: flow
      });

    } catch (error) {
      logger.error('Error starting appointment flow', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error starting appointment flow',
        details: error.message
      });
    }
  }

  async getCurrentFlow(req, res) {
    try {
      const { clinic_id, patient_phone } = req.query;

      if (!clinic_id || !patient_phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone'
        });
      }

      const flow = await this.flowManager.getCurrentFlow(clinic_id, patient_phone);

      if (!flow) {
        return res.status(404).json({
          success: false,
          error: 'No active appointment flow found'
        });
      }

      res.json({
        success: true,
        data: flow
      });

    } catch (error) {
      logger.error('Error getting current flow', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting current flow',
        details: error.message
      });
    }
  }

  async getAvailableServices(req, res) {
    try {
      const { clinic_id, category } = req.query;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const services = await this.flowManager.getAvailableServices(clinic_id, category);

      res.json({
        success: true,
        data: {
          services,
          count: services.length,
          category: category || 'all'
        }
      });

    } catch (error) {
      logger.error('Error getting available services', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting available services',
        details: error.message
      });
    }
  }

  async selectService(req, res) {
    try {
      const { clinic_id, patient_phone, service_id } = req.body;

      if (!clinic_id || !patient_phone || !service_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone, service_id'
        });
      }

      const service = await Service.findById(service_id);
      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      const flow = await this.flowManager.transitionToState(
        clinic_id, 
        patient_phone, 
        this.flowManager.states.SERVICE_SELECTION,
        { service_id, service_name: service.name, service_duration: service.duration }
      );

      res.json({
        success: true,
        data: flow
      });

    } catch (error) {
      logger.error('Error selecting service', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error selecting service',
        details: error.message
      });
    }
  }

  async getAvailableProfessionals(req, res) {
    try {
      const { clinic_id, service_id } = req.query;

      if (!clinic_id || !service_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, service_id'
        });
      }

      const professionals = await this.flowManager.getAvailableProfessionals(clinic_id, service_id);

      res.json({
        success: true,
        data: {
          professionals,
          count: professionals.length
        }
      });

    } catch (error) {
      logger.error('Error getting available professionals', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting available professionals',
        details: error.message
      });
    }
  }

  async selectProfessional(req, res) {
    try {
      const { clinic_id, patient_phone, professional_id } = req.body;

      if (!clinic_id || !patient_phone || !professional_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone, professional_id'
        });
      }

      const professional = await Professional.findById(professional_id);
      if (!professional) {
        return res.status(404).json({
          success: false,
          error: 'Professional not found'
        });
      }

      const flow = await this.flowManager.transitionToState(
        clinic_id, 
        patient_phone, 
        this.flowManager.states.PROFESSIONAL_SELECTION,
        { professional_id, professional_name: professional.name }
      );

      res.json({
        success: true,
        data: flow
      });

    } catch (error) {
      logger.error('Error selecting professional', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error selecting professional',
        details: error.message
      });
    }
  }

  async getAvailableDates(req, res) {
    try {
      const { clinic_id, service_id, professional_id } = req.query;

      if (!clinic_id || !service_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, service_id'
        });
      }

      const dates = await this.flowManager.getAvailableDates(clinic_id, service_id, professional_id);

      res.json({
        success: true,
        data: {
          dates,
          count: dates.length
        }
      });

    } catch (error) {
      logger.error('Error getting available dates', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting available dates',
        details: error.message
      });
    }
  }

  async selectDate(req, res) {
    try {
      const { clinic_id, patient_phone, date } = req.body;

      if (!clinic_id || !patient_phone || !date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone, date'
        });
      }

      const flow = await this.flowManager.transitionToState(
        clinic_id, 
        patient_phone, 
        this.flowManager.states.DATE_SELECTION,
        { selected_date: date }
      );

      res.json({
        success: true,
        data: flow
      });

    } catch (error) {
      logger.error('Error selecting date', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error selecting date',
        details: error.message
      });
    }
  }

  async getAvailableTimes(req, res) {
    try {
      const { clinic_id, service_id, professional_id, date } = req.query;

      if (!clinic_id || !service_id || !date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, service_id, date'
        });
      }

      const times = await this.flowManager.getAvailableTimes(clinic_id, service_id, professional_id, date);

      res.json({
        success: true,
        data: {
          times,
          count: times.length,
          date
        }
      });

    } catch (error) {
      logger.error('Error getting available times', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting available times',
        details: error.message
      });
    }
  }

  async selectTime(req, res) {
    try {
      const { clinic_id, patient_phone, time } = req.body;

      if (!clinic_id || !patient_phone || !time) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone, time'
        });
      }

      const flow = await this.flowManager.transitionToState(
        clinic_id, 
        patient_phone, 
        this.flowManager.states.TIME_SELECTION,
        { selected_time: time }
      );

      res.json({
        success: true,
        data: flow
      });

    } catch (error) {
      logger.error('Error selecting time', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error selecting time',
        details: error.message
      });
    }
  }

  async confirmAppointment(req, res) {
    try {
      const { clinic_id, patient_phone, patient_email, notes } = req.body;

      if (!clinic_id || !patient_phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone'
        });
      }

      const currentFlow = await this.flowManager.getCurrentFlow(clinic_id, patient_phone);
      if (!currentFlow) {
        return res.status(404).json({
          success: false,
          error: 'No active appointment flow found'
        });
      }

      if (currentFlow.state !== this.flowManager.states.TIME_SELECTION) {
        return res.status(400).json({
          success: false,
          error: `Cannot confirm appointment from state: ${currentFlow.state}`
        });
      }

      const appointmentData = {
        ...currentFlow.data,
        patient_email,
        notes,
        scheduled_date: currentFlow.data.selected_date,
        scheduled_time: currentFlow.data.selected_time
      };

      const appointment = await this.flowManager.confirmAppointment(clinic_id, patient_phone, appointmentData);

      res.json({
        success: true,
        data: {
          appointment,
          flow_summary: await this.flowManager.getFlowSummary(clinic_id, patient_phone)
        }
      });

    } catch (error) {
      logger.error('Error confirming appointment', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error confirming appointment',
        details: error.message
      });
    }
  }

  async cancelFlow(req, res) {
    try {
      const { clinic_id, patient_phone, reason } = req.body;

      if (!clinic_id || !patient_phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone'
        });
      }

      const result = await this.flowManager.cancelFlow(clinic_id, patient_phone, reason);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error cancelling flow', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error cancelling flow',
        details: error.message
      });
    }
  }

  async getAppointments(req, res) {
    try {
      const { clinic_id, status, limit = 50, offset = 0 } = req.query;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const appointments = await Appointment.findByClinic(clinic_id, limit, offset, status);

      res.json({
        success: true,
        data: {
          appointments,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: appointments.length
          }
        }
      });

    } catch (error) {
      logger.error('Error getting appointments', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting appointments',
        details: error.message
      });
    }
  }

  async getAppointmentById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: id'
        });
      }

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }

      res.json({
        success: true,
        data: appointment
      });

    } catch (error) {
      logger.error('Error getting appointment by id', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting appointment',
        details: error.message
      });
    }
  }

  async updateAppointment(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: id'
        });
      }

      const appointment = await Appointment.update(id, updateData);

      res.json({
        success: true,
        data: appointment
      });

    } catch (error) {
      logger.error('Error updating appointment', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error updating appointment',
        details: error.message
      });
    }
  }

  async updateAppointmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!id || !status) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: id, status'
        });
      }

      const appointment = await Appointment.updateStatus(id, status, notes);

      res.json({
        success: true,
        data: appointment
      });

    } catch (error) {
      logger.error('Error updating appointment status', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error updating appointment status',
        details: error.message
      });
    }
  }

  async deleteAppointment(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: id'
        });
      }

      const appointment = await Appointment.delete(id);

      res.json({
        success: true,
        data: {
          appointment,
          message: 'Appointment deleted successfully'
        }
      });

    } catch (error) {
      logger.error('Error deleting appointment', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error deleting appointment',
        details: error.message
      });
    }
  }

  async getAppointmentStats(req, res) {
    try {
      const { clinic_id, start_date, end_date } = req.query;

      if (!clinic_id || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, start_date, end_date'
        });
      }

      const stats = await Appointment.getAppointmentStats(clinic_id, start_date, end_date);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting appointment stats', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting appointment stats',
        details: error.message
      });
    }
  }

  async syncWithGoogleCalendar(req, res) {
    try {
      const { clinic_id, start_date, end_date } = req.body;

      if (!clinic_id || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, start_date, end_date'
        });
      }

      const appointments = await Appointment.findByDateRange(clinic_id, start_date, end_date);
      const clinicContext = await this.getClinicContext(clinic_id);

      const syncResults = await this.googleCalendar.syncAppointmentsToCalendar(appointments, clinicContext);

      res.json({
        success: true,
        data: syncResults
      });

    } catch (error) {
      logger.error('Error syncing with Google Calendar', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error syncing with Google Calendar',
        details: error.message
      });
    }
  }

  async getClinicContext(clinic_id) {
    try {
      // Implementar chamada para o Clinic Service
      // Por enquanto, retornar contexto básico
      return {
        name: 'Clínica',
        email: 'clinic@example.com',
        address: 'Endereço da clínica'
      };
    } catch (error) {
      logger.error('Error getting clinic context', { error: error.message, clinic_id });
      return {};
    }
  }
}

module.exports = AppointmentController;
