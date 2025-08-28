// =====================================================
// SERVIÇO DE SINCRONIZAÇÃO DE CALENDÁRIO - ATENDEAÍ 2.0
// =====================================================

import { supabase } from '@/integrations/supabase/client';
import { googleOAuthService } from './googleOAuthService';

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_name: string;
  patient_email?: string;
  patient_phone?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  google_calendar_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
  message: string;
}

class CalendarSyncService {
  private readonly GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

  // Sincronizar agendamentos do sistema para Google Calendar
  async syncToGoogleCalendar(clinicId: string): Promise<SyncResult> {
    try {
      // Verificar se a integração está ativa
      const isActive = await googleOAuthService.isIntegrationActive(clinicId);
      if (!isActive) {
        return {
          success: false,
          syncedCount: 0,
          errors: ['Integração Google Calendar não está ativa'],
          message: 'Configure a integração Google OAuth primeiro'
        };
      }

      // Obter token de acesso válido
      const accessToken = await googleOAuthService.getValidAccessToken(clinicId);

      // Obter agendamentos não sincronizados
      const appointments = await this.getUnsyncedAppointments(clinicId);
      
      if (appointments.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          errors: [],
          message: 'Todos os agendamentos já estão sincronizados'
        };
      }

      let syncedCount = 0;
      const errors: string[] = [];

      // Sincronizar cada agendamento
      for (const appointment of appointments) {
        try {
          const eventId = await this.createGoogleCalendarEvent(
            clinicId, 
            appointment, 
            accessToken
          );

          // Atualizar agendamento com ID do evento Google
          await this.updateAppointmentWithGoogleEventId(
            appointment.id, 
            eventId
          );

          syncedCount++;
        } catch (error) {
          const errorMessage = `Erro ao sincronizar agendamento ${appointment.id}: ${error}`;
          console.error(errorMessage);
          errors.push(errorMessage);
        }
      }

      return {
        success: errors.length === 0,
        syncedCount,
        errors,
        message: `Sincronizados ${syncedCount} de ${appointments.length} agendamentos`
      };
    } catch (error) {
      console.error('Error in syncToGoogleCalendar:', error);
      return {
        success: false,
        syncedCount: 0,
        errors: [`Erro geral: ${error}`],
        message: 'Erro durante a sincronização'
      };
    }
  }

  // Sincronizar eventos do Google Calendar para o sistema
  async syncFromGoogleCalendar(clinicId: string): Promise<SyncResult> {
    try {
      // Verificar se a integração está ativa
      const isActive = await googleOAuthService.isIntegrationActive(clinicId);
      if (!isActive) {
        return {
          success: false,
          syncedCount: 0,
          errors: ['Integração Google Calendar não está ativa'],
          message: 'Configure a integração Google OAuth primeiro'
        };
      }

      // Obter token de acesso válido
      const accessToken = await googleOAuthService.getValidAccessToken(clinicId);

      // Obter eventos do Google Calendar
      const events = await this.getGoogleCalendarEvents(clinicId, accessToken);
      
      if (events.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          errors: [],
          message: 'Nenhum evento encontrado no Google Calendar'
        };
      }

      let syncedCount = 0;
      const errors: string[] = [];

      // Sincronizar cada evento
      for (const event of events) {
        try {
          // Verificar se o evento já existe no sistema
          const existingAppointment = await this.findAppointmentByGoogleEventId(
            event.id
          );

          if (!existingAppointment) {
            // Criar novo agendamento
            await this.createAppointmentFromGoogleEvent(clinicId, event);
            syncedCount++;
          } else {
            // Atualizar agendamento existente
            await this.updateAppointmentFromGoogleEvent(
              existingAppointment.id, 
              event
            );
            syncedCount++;
          }
        } catch (error) {
          const errorMessage = `Erro ao sincronizar evento ${event.id}: ${error}`;
          console.error(errorMessage);
          errors.push(errorMessage);
        }
      }

      return {
        success: errors.length === 0,
        syncedCount,
        errors,
        message: `Sincronizados ${syncedCount} de ${events.length} eventos`
      };
    } catch (error) {
      console.error('Error in syncFromGoogleCalendar:', error);
      return {
        success: false,
        syncedCount: 0,
        errors: [`Erro geral: ${error}`],
        message: 'Erro durante a sincronização'
      };
    }
  }

  // Obter agendamentos não sincronizados
  private async getUnsyncedAppointments(clinicId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinicId)
        .is('google_calendar_event_id', null)
        .eq('status', 'scheduled')
        .order('start_time');

      if (error) {
        throw new Error(`Error fetching unsynced appointments: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUnsyncedAppointments:', error);
      throw error;
    }
  }

  // Criar evento no Google Calendar
  private async createGoogleCalendarEvent(
    clinicId: string, 
    appointment: Appointment, 
    accessToken: string
  ): Promise<string> {
    try {
      const eventData = {
        summary: `Consulta: ${appointment.patient_name}`,
        description: appointment.notes || 'Consulta médica',
        start: {
          dateTime: appointment.start_time,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: appointment.end_time,
          timeZone: 'America/Sao_Paulo'
        },
        attendees: appointment.patient_email ? [
          {
            email: appointment.patient_email,
            displayName: appointment.patient_name
          }
        ] : undefined
      };

      const response = await fetch(
        `${this.GOOGLE_CALENDAR_API}/calendars/primary/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
      }

      const event = await response.json();
      return event.id;
    } catch (error) {
      console.error('Error in createGoogleCalendarEvent:', error);
      throw error;
    }
  }

  // Atualizar agendamento com ID do evento Google
  private async updateAppointmentWithGoogleEventId(
    appointmentId: string, 
    googleEventId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          google_calendar_event_id: googleEventId,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        throw new Error(`Error updating appointment: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateAppointmentWithGoogleEventId:', error);
      throw error;
    }
  }

  // Obter eventos do Google Calendar
  private async getGoogleCalendarEvents(
    clinicId: string, 
    accessToken: string
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const now = new Date();
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const params = new URLSearchParams({
        timeMin: now.toISOString(),
        timeMax: oneMonthFromNow.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime'
      });

      const response = await fetch(
        `${this.GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error in getGoogleCalendarEvents:', error);
      throw error;
    }
  }

  // Encontrar agendamento por ID do evento Google
  private async findAppointmentByGoogleEventId(googleEventId: string): Promise<Appointment | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('google_calendar_event_id', googleEventId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw new Error(`Error finding appointment: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in findAppointmentByGoogleEventId:', error);
      throw error;
    }
  }

  // Criar agendamento a partir de evento Google
  private async createAppointmentFromGoogleEvent(
    clinicId: string, 
    event: GoogleCalendarEvent
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          clinic_id: clinicId,
          patient_name: event.summary.replace('Consulta: ', ''),
          patient_email: event.attendees?.[0]?.email,
          start_time: event.start.dateTime,
          end_time: event.end.dateTime,
          status: 'scheduled',
          notes: event.description,
          google_calendar_event_id: event.id
        });

      if (error) {
        throw new Error(`Error creating appointment: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in createAppointmentFromGoogleEvent:', error);
      throw error;
    }
  }

  // Atualizar agendamento a partir de evento Google
  private async updateAppointmentFromGoogleEvent(
    appointmentId: string, 
    event: GoogleCalendarEvent
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          patient_name: event.summary.replace('Consulta: ', ''),
          patient_email: event.attendees?.[0]?.email,
          start_time: event.start.dateTime,
          end_time: event.end.dateTime,
          notes: event.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        throw new Error(`Error updating appointment: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateAppointmentFromGoogleEvent:', error);
      throw error;
    }
  }

  // Sincronização bidirecional completa
  async fullSync(clinicId: string): Promise<SyncResult> {
    try {
      // Primeiro sincronizar do sistema para Google
      const toGoogleResult = await this.syncToGoogleCalendar(clinicId);
      
      // Depois sincronizar do Google para sistema
      const fromGoogleResult = await this.syncFromGoogleCalendar(clinicId);

      const totalSynced = toGoogleResult.syncedCount + fromGoogleResult.syncedCount;
      const allErrors = [...toGoogleResult.errors, ...fromGoogleResult.errors];
      const overallSuccess = toGoogleResult.success && fromGoogleResult.success;

      return {
        success: overallSuccess,
        syncedCount: totalSynced,
        errors: allErrors,
        message: `Sincronização completa: ${totalSynced} itens processados`
      };
    } catch (error) {
      console.error('Error in fullSync:', error);
      return {
        success: false,
        syncedCount: 0,
        errors: [`Erro na sincronização completa: ${error}`],
        message: 'Erro durante a sincronização completa'
      };
    }
  }
}

// Instância singleton
export const calendarSyncService = new CalendarSyncService();
export default calendarSyncService;
