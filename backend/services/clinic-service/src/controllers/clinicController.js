const Clinic = require('../models/clinic');
const Professional = require('../models/professional');
const Service = require('../models/service');
const ContextualizationService = require('../services/contextualization');
const logger = require('../utils/logger');

class ClinicController {
  async createClinic(req, res) {
    try {
      const clinicData = req.body;
      
      const clinic = await Clinic.create(clinicData);
      
      logger.info('Clinic created successfully', { 
        clinicId: clinic.id,
        clinicName: clinic.name
      });
      
      res.status(201).json({
        success: true,
        message: 'Clinic created successfully',
        data: clinic.toJSON()
      });
    } catch (error) {
      logger.error('Error creating clinic:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating clinic',
        error: error.message
      });
    }
  }

  async getClinic(req, res) {
    try {
      const { id } = req.params;
      
      const clinic = await Clinic.findById(id);
      if (!clinic) {
        return res.status(404).json({
          success: false,
          message: 'Clinic not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: clinic.toJSON()
      });
    } catch (error) {
      logger.error('Error getting clinic:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting clinic',
        error: error.message
      });
    }
  }

  async getAllClinics(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      
      const clinics = await Clinic.findAll(parseInt(limit), parseInt(offset));
      
      res.status(200).json({
        success: true,
        data: clinics.map(clinic => clinic.toJSON()),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: clinics.length
        }
      });
    } catch (error) {
      logger.error('Error getting all clinics:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting clinics',
        error: error.message
      });
    }
  }

  async updateClinic(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const clinic = await Clinic.update(id, updateData);
      
      logger.info('Clinic updated successfully', { 
        clinicId: id,
        updatedFields: Object.keys(updateData)
      });
      
      res.status(200).json({
        success: true,
        message: 'Clinic updated successfully',
        data: clinic.toJSON()
      });
    } catch (error) {
      logger.error('Error updating clinic:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Clinic not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error updating clinic',
        error: error.message
      });
    }
  }

  async deleteClinic(req, res) {
    try {
      const { id } = req.params;
      
      const clinic = await Clinic.delete(id);
      
      logger.info('Clinic deleted successfully', { clinicId: id });
      
      res.status(200).json({
        success: true,
        message: 'Clinic deleted successfully',
        data: clinic.toJSON()
      });
    } catch (error) {
      logger.error('Error deleting clinic:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Clinic not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error deleting clinic',
        error: error.message
      });
    }
  }

  async getClinicByWhatsAppPhone(req, res) {
    try {
      const { phone } = req.params;
      
      const clinic = await Clinic.findByWhatsAppPhone(phone);
      if (!clinic) {
        return res.status(404).json({
          success: false,
          message: 'Clinic not found for this WhatsApp number'
        });
      }
      
      res.status(200).json({
        success: true,
        data: clinic.toJSON()
      });
    } catch (error) {
      logger.error('Error getting clinic by WhatsApp phone:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting clinic',
        error: error.message
      });
    }
  }

  async getClinicContextualization(req, res) {
    try {
      const { id } = req.params;
      const { forceRefresh = false } = req.query;
      
      const contextualization = await ContextualizationService.getClinicContextualization(
        id, 
        forceRefresh === 'true'
      );
      
      if (!contextualization) {
        return res.status(404).json({
          success: false,
          message: 'Contextualization not found for this clinic'
        });
      }
      
      res.status(200).json({
        success: true,
        data: contextualization
      });
    } catch (error) {
      logger.error('Error getting clinic contextualization:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting contextualization',
        error: error.message
      });
    }
  }

  async updateClinicContextualization(req, res) {
    try {
      const { id } = req.params;
      const contextualizationData = req.body;
      
      const validation = await ContextualizationService.validateContextualization(contextualizationData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid contextualization data',
          errors: validation.missingFields
        });
      }
      
      const updated = await ContextualizationService.updateClinicContextualization(
        id, 
        contextualizationData
      );
      
      logger.info('Clinic contextualization updated successfully', { clinicId: id });
      
      res.status(200).json({
        success: true,
        message: 'Contextualization updated successfully',
        data: updated
      });
    } catch (error) {
      logger.error('Error updating clinic contextualization:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating contextualization',
        error: error.message
      });
    }
  }

  async getClinicIntentions(req, res) {
    try {
      const { id } = req.params;
      
      const contextualization = await ContextualizationService.getClinicContextualization(id);
      if (!contextualization) {
        return res.status(404).json({
          success: false,
          message: 'Contextualization not found for this clinic'
        });
      }
      
      const intentions = await ContextualizationService.extractIntentions(contextualization);
      
      res.status(200).json({
        success: true,
        data: {
          clinicId: id,
          intentions: intentions,
          totalIntentions: intentions.length
        }
      });
    } catch (error) {
      logger.error('Error getting clinic intentions:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting intentions',
        error: error.message
      });
    }
  }

  async getClinicPersonality(req, res) {
    try {
      const { id } = req.params;
      
      const personality = await ContextualizationService.getClinicPersonality(id);
      
      res.status(200).json({
        success: true,
        data: personality
      });
    } catch (error) {
      logger.error('Error getting clinic personality:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting personality',
        error: error.message
      });
    }
  }

  async getClinicBehavior(req, res) {
    try {
      const { id } = req.params;
      
      const behavior = await ContextualizationService.getClinicBehavior(id);
      
      res.status(200).json({
        success: true,
        data: behavior
      });
    } catch (error) {
      logger.error('Error getting clinic behavior:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting behavior',
        error: error.message
      });
    }
  }

  async getClinicWorkingHours(req, res) {
    try {
      const { id } = req.params;
      
      const workingHours = await ContextualizationService.getWorkingHours(id);
      
      res.status(200).json({
        success: true,
        data: workingHours
      });
    } catch (error) {
      logger.error('Error getting clinic working hours:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting working hours',
        error: error.message
      });
    }
  }

  async getClinicAppointmentPolicies(req, res) {
    try {
      const { id } = req.params;
      
      const policies = await ContextualizationService.getAppointmentPolicies(id);
      
      res.status(200).json({
        success: true,
        data: policies
      });
    } catch (error) {
      logger.error('Error getting clinic appointment policies:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting appointment policies',
        error: error.message
      });
    }
  }

  async getClinicCalendarMappings(req, res) {
    try {
      const { id } = req.params;
      
      const mappings = await ContextualizationService.getCalendarMappings(id);
      
      res.status(200).json({
        success: true,
        data: mappings
      });
    } catch (error) {
      logger.error('Error getting clinic calendar mappings:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting calendar mappings',
        error: error.message
      });
    }
  }

  async getClinicServices(req, res) {
    try {
      const { id } = req.params;
      
      const services = await ContextualizationService.getClinicServices(id);
      
      res.status(200).json({
        success: true,
        data: services
      });
    } catch (error) {
      logger.error('Error getting clinic services:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting services',
        error: error.message
      });
    }
  }

  async getClinicProfessionals(req, res) {
    try {
      const { id } = req.params;
      
      const professionals = await ContextualizationService.getClinicProfessionals(id);
      
      res.status(200).json({
        success: true,
        data: professionals
      });
    } catch (error) {
      logger.error('Error getting clinic professionals:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting professionals',
        error: error.message
      });
    }
  }

  async clearContextualizationCache(req, res) {
    try {
      const { id } = req.params;
      
      const cleared = await ContextualizationService.clearCache(id);
      
      if (cleared) {
        logger.info('Contextualization cache cleared successfully', { clinicId: id });
        res.status(200).json({
          success: true,
          message: 'Cache cleared successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to clear cache'
        });
      }
    } catch (error) {
      logger.error('Error clearing contextualization cache:', error);
      res.status(500).json({
        success: false,
        message: 'Error clearing cache',
        error: error.message
      });
    }
  }

  async getContextualizationCacheStats(req, res) {
    try {
      const stats = await ContextualizationService.getCacheStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting cache stats',
        error: error.message
      });
    }
  }
}

module.exports = new ClinicController();
