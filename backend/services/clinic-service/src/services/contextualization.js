const redis = require('../config/redis');
const Clinic = require('../models/clinic');
const logger = require('../utils/logger');

class ContextualizationService {
  constructor() {
    this.cachePrefix = 'context:';
    this.defaultTTL = 3600; // 1 hora
  }

  async getClinicContextualization(clinicId, forceRefresh = false) {
    try {
      const cacheKey = `${this.cachePrefix}${clinicId}`;
      
      if (!forceRefresh) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Contextualization retrieved from cache', { clinicId });
          return cached;
        }
      }

      const contextualization = await Clinic.getContextualization(clinicId);
      if (!contextualization) {
        logger.warn('No contextualization found for clinic', { clinicId });
        return null;
      }

      await redis.set(cacheKey, contextualization, this.defaultTTL);
      logger.info('Contextualization cached successfully', { clinicId });
      
      return contextualization;
    } catch (error) {
      logger.error('Error getting clinic contextualization:', error);
      throw error;
    }
  }

  async updateClinicContextualization(clinicId, contextualizationData) {
    try {
      const updated = await Clinic.updateContextualization(clinicId, contextualizationData);
      
      if (updated) {
        const cacheKey = `${this.cachePrefix}${clinicId}`;
        await redis.del(cacheKey);
        logger.info('Contextualization cache invalidated', { clinicId });
      }
      
      return updated;
    } catch (error) {
      logger.error('Error updating clinic contextualization:', error);
      throw error;
    }
  }

  async extractIntentions(contextualization) {
    try {
      if (!contextualization) {
        return [];
      }

      const intentions = [];
      
      this.extractIntentionsRecursive(contextualization, intentions);
      
      logger.debug('Intentions extracted successfully', { 
        count: intentions.length,
        intentions: intentions.map(i => i.path)
      });
      
      return intentions;
    } catch (error) {
      logger.error('Error extracting intentions:', error);
      throw error;
    }
  }

  extractIntentionsRecursive(obj, intentions, path = '') {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (this.shouldExtractAsIntention(key, value)) {
        intentions.push({
          path: currentPath,
          value: value,
          type: typeof value,
          isArray: Array.isArray(value)
        });
      }
      
      if (typeof value === 'object' && value !== null) {
        this.extractIntentionsRecursive(value, intentions, currentPath);
      }
    }
  }

  shouldExtractAsIntention(key, value) {
    if (key.startsWith('_') || key.startsWith('config_')) {
      return false;
    }
    
    if (key === 'agent_config' || key === 'system_config') {
      return false;
    }
    
    if (typeof value === 'string' && value.trim().length > 0) {
      return true;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return true;
    }
    
    if (Array.isArray(value) && value.length > 0) {
      return true;
    }
    
    if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
      return true;
    }
    
    return false;
  }

  async getClinicPersonality(clinicId) {
    try {
      const contextualization = await this.getClinicContextualization(clinicId);
      if (!contextualization || !contextualization.ai_personality) {
        return this.getDefaultPersonality();
      }
      
      return contextualization.ai_personality;
    } catch (error) {
      logger.error('Error getting clinic personality:', error);
      return this.getDefaultPersonality();
    }
  }

  async getClinicBehavior(clinicId) {
    try {
      const contextualization = await this.getClinicContextualization(clinicId);
      if (!contextualization || !contextualization.ai_behavior) {
        return this.getDefaultBehavior();
      }
      
      return contextualization.ai_behavior;
    } catch (error) {
      logger.error('Error getting clinic behavior:', error);
      return this.getDefaultBehavior();
    }
  }

  async getWorkingHours(clinicId) {
    try {
      const contextualization = await this.getClinicContextualization(clinicId);
      if (!contextualization || !contextualization.working_hours) {
        return null;
      }
      
      return this.formatWorkingHours(contextualization.working_hours);
    } catch (error) {
      logger.error('Error getting working hours:', error);
      return null;
    }
  }

  formatWorkingHours(workingHours) {
    if (!workingHours || typeof workingHours !== 'object') {
      return null;
    }

    const formatted = {};
    const dayMapping = {
      'segunda': 'monday',
      'terca': 'tuesday',
      'quarta': 'wednesday',
      'quinta': 'thursday',
      'sexta': 'friday',
      'sabado': 'saturday',
      'domingo': 'sunday'
    };

    for (const [day, hours] of Object.entries(workingHours)) {
      const englishDay = dayMapping[day] || day;
      formatted[englishDay] = hours;
    }

    return formatted;
  }

  async getAppointmentPolicies(clinicId) {
    try {
      const contextualization = await this.getClinicContextualization(clinicId);
      if (!contextualization || !contextualization.appointment_policies) {
        return this.getDefaultAppointmentPolicies();
      }
      
      return contextualization.appointment_policies;
    } catch (error) {
      logger.error('Error getting appointment policies:', error);
      return this.getDefaultAppointmentPolicies();
    }
  }

  async getCalendarMappings(clinicId) {
    try {
      const contextualization = await this.getClinicContextualization(clinicId);
      if (!contextualization || !contextualization.calendar_mappings) {
        return {};
      }
      
      return contextualization.calendar_mappings;
    } catch (error) {
      logger.error('Error getting calendar mappings:', error);
      return {};
    }
  }

  async getClinicServices(clinicId) {
    try {
      const contextualization = await this.getClinicContextualization(clinicId);
      if (!contextualization || !contextualization.services) {
        return [];
      }
      
      return contextualization.services;
    } catch (error) {
      logger.error('Error getting clinic services:', error);
      return [];
    }
  }

  async getClinicProfessionals(clinicId) {
    try {
      const contextualization = await this.getClinicContextualization(clinicId);
      if (!contextualization || !contextualization.professionals) {
        return [];
      }
      
      return contextualization.professionals;
    } catch (error) {
      logger.error('Error getting clinic professionals:', error);
      return [];
    }
  }

  async getFallbackResponse(clinicId, fieldPath) {
    try {
      const contextualization = await this.getClinicContextualization(clinicId);
      if (!contextualization) {
        return this.getDefaultFallbackResponse(fieldPath);
      }
      
      const fallbacks = contextualization.fallbacks || {};
      return fallbacks[fieldPath] || this.getDefaultFallbackResponse(fieldPath);
    } catch (error) {
      logger.error('Error getting fallback response:', error);
      return this.getDefaultFallbackResponse(fieldPath);
    }
  }

  async validateContextualization(contextualizationData) {
    try {
      const requiredFields = [
        'clinic_info',
        'ai_personality',
        'ai_behavior',
        'working_hours',
        'services',
        'professionals'
      ];

      const missingFields = requiredFields.filter(field => !contextualizationData[field]);
      
      if (missingFields.length > 0) {
        return {
          valid: false,
          missingFields,
          message: `Missing required fields: ${missingFields.join(', ')}`
        };
      }

      return {
        valid: true,
        message: 'Contextualization is valid'
      };
    } catch (error) {
      logger.error('Error validating contextualization:', error);
      return {
        valid: false,
        message: 'Error validating contextualization'
      };
    }
  }

  getDefaultPersonality() {
    return {
      name: 'Assistente Virtual',
      tone: 'friendly',
      formality: 'medium',
      languages: ['pt-BR'],
      greeting: 'Olá! Como posso ajudá-lo hoje?',
      farewell: 'Obrigado por entrar em contato. Tenha um ótimo dia!',
      out_of_hours: 'Desculpe, estamos fora do horário de funcionamento. Entre em contato durante nosso horário comercial.'
    };
  }

  getDefaultBehavior() {
    return {
      proactivity: 'medium',
      suggestions: true,
      feedback: true,
      auto_escalation: true,
      escalation_threshold: 3,
      memory_enabled: true,
      context_window: 10
    };
  }

  getDefaultAppointmentPolicies() {
    return {
      min_advance_notice: 24, // horas
      max_advance_notice: 30, // dias
      default_slot_duration: 30, // minutos
      max_daily_appointments: 50,
      cancellation_policy: '24h',
      rescheduling_policy: '2h'
    };
  }

  getDefaultFallbackResponse(fieldPath) {
    const fallbackResponses = {
      'services': 'Desculpe, não consegui encontrar informações sobre os serviços. Entre em contato conosco para mais detalhes.',
      'professionals': 'Desculpe, não consegui encontrar informações sobre os profissionais. Entre em contato conosco para mais detalhes.',
      'working_hours': 'Desculpe, não consegui encontrar informações sobre os horários de funcionamento. Entre em contato conosco para mais detalhes.',
      'appointment': 'Desculpe, não consegui processar sua solicitação de agendamento. Entre em contato conosco para mais detalhes.',
      'default': 'Desculpe, não consegui entender sua solicitação. Pode reformular ou entrar em contato conosco para mais ajuda?'
    };

    return fallbackResponses[fieldPath] || fallbackResponses.default;
  }

  async clearCache(clinicId) {
    try {
      const cacheKey = `${this.cachePrefix}${clinicId}`;
      await redis.del(cacheKey);
      logger.info('Contextualization cache cleared', { clinicId });
      return true;
    } catch (error) {
      logger.error('Error clearing contextualization cache:', error);
      return false;
    }
  }

  async getCacheStats() {
    try {
      const stats = {
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0
      };

      return stats;
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return null;
    }
  }
}

module.exports = new ContextualizationService();
