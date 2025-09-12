const Clinic = require('../models/clinic');
const Professional = require('../models/professional');
const Service = require('../models/service');
const ContextualizationService = require('../services/contextualization');
const logger = require('../utils/logger');

class ClinicController {
  async createClinic(req, res) {
    try {
      const clinicData = req.body;
      
      // Verificar se o usuário tem permissão para criar clínicas
      if (!req.user.roles.includes('admin_lify')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create clinics'
        });
      }
      
      const clinic = await Clinic.create(clinicData);
      
      logger.info('Clinic created successfully', { 
        clinicId: clinic.id,
        clinicName: clinic.name,
        createdBy: req.user.id
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
      const clinicId = req.clinicId; // Do middleware withTenant
      
      // Verificar se o ID da clínica na URL corresponde ao tenant
      if (id !== clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this clinic'
        });
      }
      
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
      
      // Verificar isolamento multi-tenant
      if (req.user.roles.includes('admin_lify')) {
        // Admin Lify pode ver todas as clínicas
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
      } else {
        // Usuários normais só podem ver sua própria clínica
        const clinic = await Clinic.findById(req.user.clinicId);
        if (!clinic) {
          return res.status(404).json({
            success: false,
            message: 'Clinic not found'
          });
        }
        
        res.status(200).json({
          success: true,
          data: [clinic.toJSON()],
          pagination: {
            limit: 1,
            offset: 0,
            total: 1
          }
        });
      }
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
      const clinicId = req.clinicId; // Do middleware withTenant
      
      // Verificar se o ID da clínica na URL corresponde ao tenant
      if (id !== clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this clinic'
        });
      }
      
      // Verificar se o usuário tem permissão para atualizar
      if (!req.user.roles.includes('admin_lify') && !req.user.roles.includes('admin_clinic')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update clinic'
        });
      }
      
      const clinic = await Clinic.update(id, updateData);
      
      logger.info('Clinic updated successfully', { 
        clinicId: id,
        updatedFields: Object.keys(updateData),
        updatedBy: req.user.id
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
      
      // Verificar isolamento multi-tenant
      if (req.user.roles.includes('admin_lify')) {
        // Admin Lify pode deletar qualquer clínica
        const clinic = await Clinic.delete(id);
        
        logger.info('Clinic deleted successfully', { 
          clinicId: id,
          deletedBy: req.user.id
        });
        
        res.status(200).json({
          success: true,
          message: 'Clinic deleted successfully',
          data: clinic.toJSON()
        });
      } else {
        // Usuários normais não podem deletar clínicas
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete clinic'
        });
      }
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
      
      // Verificar isolamento multi-tenant
      if (req.user.roles.includes('admin_lify')) {
        // Admin Lify pode buscar por qualquer telefone
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
      } else {
        // Usuários normais só podem buscar na sua própria clínica
        const clinic = await Clinic.findById(req.user.clinicId);
        if (!clinic) {
          return res.status(404).json({
            success: false,
            message: 'Clinic not found'
          });
        }
        
        // Verificar se o telefone corresponde à clínica do usuário
        if (clinic.whatsapp_id_number !== phone) {
          return res.status(404).json({
            success: false,
            message: 'Clinic not found for this WhatsApp number'
          });
        }
        
        res.status(200).json({
          success: true,
          data: clinic.toJSON()
        });
      }
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
      const clinicId = req.clinicId; // Do middleware withTenant
      
      // Verificar se o ID da clínica na URL corresponde ao tenant
      if (id !== clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this clinic'
        });
      }
      
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
      const clinicId = req.clinicId; // Do middleware withTenant
      
      // Verificar se o ID da clínica na URL corresponde ao tenant
      if (id !== clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this clinic'
        });
      }
      
      // Verificar permissões
      if (!req.user.roles.includes('admin_lify') && !req.user.roles.includes('admin_clinic')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update contextualization'
        });
      }
      
      const contextualization = await ContextualizationService.updateClinicContextualization(
        id, 
        contextualizationData
      );
      
      logger.info('Clinic contextualization updated successfully', { 
        clinicId: id,
        updatedBy: req.user.id
      });
      
      res.status(200).json({
        success: true,
        message: 'Contextualization updated successfully',
        data: contextualization
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
      
      // Verificar isolamento multi-tenant
      if (!req.user.roles.includes('admin_lify') && id !== req.user.clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to clinic'
        });
      }
      
      const intentions = await ContextualizationService.getClinicIntentions(id);
      
      res.status(200).json({
        success: true,
        data: intentions
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
      
      // Verificar isolamento multi-tenant
      if (!req.user.roles.includes('admin_lify') && id !== req.user.clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to clinic'
        });
      }
      
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
      
      // Verificar isolamento multi-tenant
      if (!req.user.roles.includes('admin_lify') && id !== req.user.clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to clinic'
        });
      }
      
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
      
      // Verificar isolamento multi-tenant
      if (!req.user.roles.includes('admin_lify') && id !== req.user.clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to clinic'
        });
      }
      
      const workingHours = await Clinic.getWorkingHours(id);
      
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
      
      // Verificar isolamento multi-tenant
      if (!req.user.roles.includes('admin_lify') && id !== req.user.clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to clinic'
        });
      }
      
      const policies = await Clinic.getAppointmentPolicies(id);
      
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
      
      // Verificar isolamento multi-tenant
      if (!req.user.roles.includes('admin_lify') && id !== req.user.clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to clinic'
        });
      }
      
      const mappings = await Clinic.getCalendarMappings(id);
      
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
      
      // Verificar isolamento multi-tenant
      if (!req.user.roles.includes('admin_lify') && id !== req.user.clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to clinic'
        });
      }
      
      const services = await Service.findByClinicId(id);
      
      res.status(200).json({
        success: true,
        data: services.map(service => service.toJSON())
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
      
      // Verificar isolamento multi-tenant
      if (!req.user.roles.includes('admin_lify') && id !== req.user.clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to clinic'
        });
      }
      
      const professionals = await Professional.findByClinicId(id);
      
      res.status(200).json({
        success: true,
        data: professionals.map(professional => professional.toJSON())
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
      
      // Verificar isolamento multi-tenant
      if (!req.user.roles.includes('admin_lify') && id !== req.user.clinicId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to clinic'
        });
      }
      
      // Verificar permissões
      if (!req.user.roles.includes('admin_lify') && !req.user.roles.includes('admin_clinic')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to clear cache'
        });
      }
      
      await ContextualizationService.clearCache(id);
      
      logger.info('Contextualization cache cleared successfully', { 
        clinicId: id,
        clearedBy: req.user.id
      });
      
      res.status(200).json({
        success: true,
        message: 'Cache cleared successfully'
      });
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
      // Verificar permissões
      if (!req.user.roles.includes('admin_lify')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view cache stats'
        });
      }
      
      const stats = await ContextualizationService.getCacheStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting contextualization cache stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting cache stats',
        error: error.message
      });
    }
  }
}

module.exports = new ClinicController();
