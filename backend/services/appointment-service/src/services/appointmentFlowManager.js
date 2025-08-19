const Appointment = require('../models/appointment');
const Service = require('../models/service');
const Professional = require('../models/professional');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const moment = require('moment-timezone');
const config = require('../config');

class AppointmentFlowManager {
  constructor() {
    this.states = {
      INIT: 'init',
      SERVICE_SELECTION: 'service_selection',
      PROFESSIONAL_SELECTION: 'professional_selection',
      DATE_SELECTION: 'date_selection',
      TIME_SELECTION: 'time_selection',
      CONFIRMATION: 'confirmation',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled'
    };

    this.validTransitions = {
      [this.states.INIT]: [this.states.SERVICE_SELECTION],
      [this.states.SERVICE_SELECTION]: [this.states.PROFESSIONAL_SELECTION, this.states.DATE_SELECTION],
      [this.states.PROFESSIONAL_SELECTION]: [this.states.DATE_SELECTION],
      [this.states.DATE_SELECTION]: [this.states.TIME_SELECTION],
      [this.states.TIME_SELECTION]: [this.states.CONFIRMATION],
      [this.states.CONFIRMATION]: [this.states.COMPLETED, this.states.CANCELLED],
      [this.states.COMPLETED]: [],
      [this.states.CANCELLED]: []
    };
  }

  async startFlow(clinic_id, patient_phone, patient_name) {
    try {
      const flowId = `flow:${clinic_id}:${patient_phone}`;
      const flowData = {
        state: this.states.INIT,
        clinic_id,
        patient_phone,
        patient_name,
        data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await redis.set(flowId, flowData, 3600); // 1 hora de TTL

      logger.info('Appointment flow started', { 
        flow_id: flowId, 
        clinic_id, 
        patient_phone,
        state: this.states.INIT
      });

      return {
        flow_id: flowId,
        state: this.states.INIT,
        next_steps: this.getNextSteps(this.states.INIT),
        data: flowData.data
      };
    } catch (error) {
      logger.error('Error starting appointment flow', { error: error.message, clinic_id, patient_phone });
      throw error;
    }
  }

  async getCurrentFlow(clinic_id, patient_phone) {
    try {
      const flowId = `flow:${clinic_id}:${patient_phone}`;
      const flowData = await redis.get(flowId);

      if (!flowData) {
        return null;
      }

      return {
        flow_id: flowId,
        state: flowData.state,
        next_steps: this.getNextSteps(flowData.state),
        data: flowData.data
      };
    } catch (error) {
      logger.error('Error getting current flow', { error: error.message, clinic_id, patient_phone });
      throw error;
    }
  }

  async transitionToState(clinic_id, patient_phone, newState, data = {}) {
    try {
      const flowId = `flow:${clinic_id}:${patient_phone}`;
      const currentFlow = await redis.get(flowId);

      if (!currentFlow) {
        throw new Error('No active flow found');
      }

      if (!this.isValidTransition(currentFlow.state, newState)) {
        throw new Error(`Invalid transition from ${currentFlow.state} to ${newState}`);
      }

      const updatedFlow = {
        ...currentFlow,
        state: newState,
        data: { ...currentFlow.data, ...data },
        updated_at: new Date().toISOString()
      };

      await redis.set(flowId, updatedFlow, 3600);

      logger.info('Appointment flow state transitioned', { 
        flow_id: flowId, 
        from_state: currentFlow.state, 
        to_state: newState,
        clinic_id,
        patient_phone
      });

      return {
        flow_id: flowId,
        state: newState,
        next_steps: this.getNextSteps(newState),
        data: updatedFlow.data
      };
    } catch (error) {
      logger.error('Error transitioning flow state', { error: error.message, clinic_id, patient_phone, newState });
      throw error;
    }
  }

  async getAvailableServices(clinic_id, category = null) {
    try {
      const services = await Service.findByClinic(clinic_id, category);
      
      logger.info('Available services retrieved', { 
        clinic_id, 
        category, 
        count: services.length 
      });

      return services;
    } catch (error) {
      logger.error('Error getting available services', { error: error.message, clinic_id, category });
      throw error;
    }
  }

  async getAvailableProfessionals(clinic_id, service_id) {
    try {
      const professionals = await Professional.findByClinic(clinic_id);
      
      const availableProfessionals = professionals.filter(prof => 
        prof.accepts_new_patients && prof.is_active
      );

      logger.info('Available professionals retrieved', { 
        clinic_id, 
        service_id, 
        count: availableProfessionals.length 
      });

      return availableProfessionals;
    } catch (error) {
      logger.error('Error getting available professionals', { error: error.message, clinic_id, service_id });
      throw error;
    }
  }

  async getAvailableDates(clinic_id, service_id, professional_id) {
    try {
      const today = moment().tz(config.appointment.timezone);
      const maxDate = moment().add(config.appointment.maxAdvanceNotice, 'days');
      const minDate = moment().add(config.appointment.minAdvanceNotice, 'hours');

      const availableDates = [];
      let currentDate = minDate.clone();

      while (currentDate.isSameOrBefore(maxDate, 'day')) {
        if (currentDate.isAfter(today, 'day')) {
          const dayOfWeek = currentDate.format('dddd').toLowerCase();
          
          // Verificar se a clínica funciona neste dia
          const isWorkingDay = await this.isWorkingDay(clinic_id, dayOfWeek);
          
          if (isWorkingDay) {
            const dailyCount = await Appointment.getDailyCount(clinic_id, currentDate.format('YYYY-MM-DD'));
            
            if (dailyCount < config.appointment.maxDailyAppointments) {
              availableDates.push({
                date: currentDate.format('YYYY-MM-DD'),
                day_name: currentDate.format('dddd'),
                available_slots: config.appointment.maxDailyAppointments - dailyCount
              });
            }
          }
        }
        
        currentDate.add(1, 'day');
      }

      logger.info('Available dates retrieved', { 
        clinic_id, 
        service_id, 
        professional_id, 
        count: availableDates.length 
      });

      return availableDates;
    } catch (error) {
      logger.error('Error getting available dates', { error: error.message, clinic_id, service_id, professional_id });
      throw error;
    }
  }

  async getAvailableTimes(clinic_id, service_id, professional_id, date) {
    try {
      const availableSlots = await Appointment.getAvailableSlots(clinic_id, service_id, professional_id, date);
      
      // Filtrar horários baseado nas políticas da clínica
      const filteredSlots = availableSlots.filter(time => {
        const appointmentTime = moment.tz(`${date} ${time}`, config.appointment.timezone);
        const now = moment().tz(config.appointment.timezone);
        
        // Verificar antecedência mínima
        const hoursUntilAppointment = appointmentTime.diff(now, 'hours', true);
        return hoursUntilAppointment >= config.appointment.minAdvanceNotice;
      });

      logger.info('Available times retrieved', { 
        clinic_id, 
        service_id, 
        professional_id, 
        date, 
        count: filteredSlots.length 
      });

      return filteredSlots;
    } catch (error) {
      logger.error('Error getting available times', { error: error.message, clinic_id, service_id, professional_id, date });
      throw error;
    }
  }

  async confirmAppointment(clinic_id, patient_phone, appointmentData) {
    try {
      const flowId = `flow:${clinic_id}:${patient_phone}`;
      const currentFlow = await redis.get(flowId);

      if (!currentFlow) {
        throw new Error('No active flow found');
      }

      if (currentFlow.state !== this.states.CONFIRMATION) {
        throw new Error(`Cannot confirm appointment from state: ${currentFlow.state}`);
      }

      // Criar o agendamento
      const appointment = await Appointment.create({
        ...appointmentData,
        clinic_id,
        patient_phone,
        status: 'confirmed'
      });

      // Atualizar o fluxo para completado
      await this.transitionToState(clinic_id, patient_phone, this.states.COMPLETED, {
        appointment_id: appointment.id
      });

      // Limpar o fluxo após um tempo
      setTimeout(async () => {
        await redis.del(flowId);
      }, 300000); // 5 minutos

      logger.info('Appointment confirmed and created', { 
        appointment_id: appointment.id,
        clinic_id,
        patient_phone
      });

      return appointment;
    } catch (error) {
      logger.error('Error confirming appointment', { error: error.message, clinic_id, patient_phone, appointmentData });
      throw error;
    }
  }

  async cancelFlow(clinic_id, patient_phone, reason = '') {
    try {
      const flowId = `flow:${clinic_id}:${patient_phone}`;
      const currentFlow = await redis.get(flowId);

      if (!currentFlow) {
        throw new Error('No active flow found');
      }

      // Atualizar o fluxo para cancelado
      await this.transitionToState(clinic_id, patient_phone, this.states.CANCELLED, {
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      });

      // Limpar o fluxo após um tempo
      setTimeout(async () => {
        await redis.del(flowId);
      }, 300000); // 5 minutos

      logger.info('Appointment flow cancelled', { 
        flow_id: flowId,
        clinic_id,
        patient_phone,
        reason
      });

      return { status: 'cancelled', reason };
    } catch (error) {
      logger.error('Error cancelling flow', { error: error.message, clinic_id, patient_phone, reason });
      throw error;
    }
  }

  async getFlowSummary(clinic_id, patient_phone) {
    try {
      const flowId = `flow:${clinic_id}:${patient_phone}`;
      const currentFlow = await redis.get(flowId);

      if (!currentFlow) {
        return null;
      }

      const summary = {
        flow_id: flowId,
        state: currentFlow.state,
        progress: this.getProgressPercentage(currentFlow.state),
        data: currentFlow.data,
        next_steps: this.getNextSteps(currentFlow.state),
        created_at: currentFlow.created_at,
        updated_at: currentFlow.updated_at
      };

      return summary;
    } catch (error) {
      logger.error('Error getting flow summary', { error: error.message, clinic_id, patient_phone });
      throw error;
    }
  }

  isValidTransition(fromState, toState) {
    return this.validTransitions[fromState]?.includes(toState) || false;
  }

  getNextSteps(state) {
    const nextStepsMap = {
      [this.states.INIT]: ['Selecionar serviço'],
      [this.states.SERVICE_SELECTION]: ['Selecionar profissional', 'Selecionar data'],
      [this.states.PROFESSIONAL_SELECTION]: ['Selecionar data'],
      [this.states.DATE_SELECTION]: ['Selecionar horário'],
      [this.states.TIME_SELECTION]: ['Confirmar agendamento'],
      [this.states.CONFIRMATION]: ['Confirmar', 'Cancelar'],
      [this.states.COMPLETED]: ['Agendamento finalizado'],
      [this.states.CANCELLED]: ['Fluxo cancelado']
    };

    return nextStepsMap[state] || [];
  }

  getProgressPercentage(state) {
    const progressMap = {
      [this.states.INIT]: 0,
      [this.states.SERVICE_SELECTION]: 20,
      [this.states.PROFESSIONAL_SELECTION]: 40,
      [this.states.DATE_SELECTION]: 60,
      [this.states.TIME_SELECTION]: 80,
      [this.states.CONFIRMATION]: 90,
      [this.states.COMPLETED]: 100,
      [this.states.CANCELLED]: 0
    };

    return progressMap[state] || 0;
  }

  async isWorkingDay(clinic_id, dayOfWeek) {
    try {
      // Por padrão, considerar dias úteis como funcionando
      const workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      return workingDays.includes(dayOfWeek);
    } catch (error) {
      logger.error('Error checking working day', { error: error.message, clinic_id, dayOfWeek });
      return true; // Fallback para funcionar
    }
  }

  async cleanupExpiredFlows() {
    try {
      // Esta função seria chamada por um cron job para limpar fluxos expirados
      logger.info('Starting cleanup of expired appointment flows');
      
      // Implementar lógica de limpeza baseada em TTL do Redis
      // Por enquanto, o Redis já gerencia o TTL automaticamente
      
      logger.info('Cleanup of expired appointment flows completed');
    } catch (error) {
      logger.error('Error during flow cleanup', { error: error.message });
    }
  }
}

module.exports = AppointmentFlowManager;
