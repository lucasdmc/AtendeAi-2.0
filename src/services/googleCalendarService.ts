import { supabase } from '@/integrations/supabase/client';

export interface GoogleIntegration {
  id: string;
  user_id: string;
  clinic_id: string;
  google_calendar_id: string;
  access_token: string;
  refresh_token: string;
  scope: string;
  token_expiry: string;
  calendar_name?: string;
  calendar_description?: string;
  sync_enabled: boolean;
  last_sync: string;
  status: 'active' | 'expired' | 'error';
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  google_event_id: string;
  integration_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location?: string;
  attendees: string[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string;
  attendees?: string[];
}

class GoogleCalendarService {
  private readonly integrationsTable = 'google_integrations';
  private readonly eventsTable = 'calendar_events';
  private readonly baseApiUrl = process.env.GOOGLE_CALENDAR_SERVICE_URL || 'http://localhost:3008';

  async getAuthUrl(): Promise<string> {
    try {
      const response = await fetch(`${this.baseApiUrl}/auth/google/url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao obter URL de autenticação');
      }

      const data = await response.json();
      return data.auth_url;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw error;
    }
  }

  async handleCallback(code: string, state?: string): Promise<GoogleIntegration> {
    try {
      const response = await fetch(`${this.baseApiUrl}/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, state })
      });

      if (!response.ok) {
        throw new Error('Erro ao processar callback de autenticação');
      }

      const data = await response.json();
      return data.integration;
    } catch (error) {
      console.error('Error handling callback:', error);
      throw error;
    }
  }

  async getUserIntegrations(userId: string): Promise<GoogleIntegration[]> {
    try {
      const { data, error } = await supabase
        .from(this.integrationsTable)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error fetching integrations: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in googleCalendarService.getUserIntegrations:', error);
      throw error;
    }
  }

  async getIntegrationById(id: string): Promise<GoogleIntegration> {
    try {
      const { data, error } = await supabase
        .from(this.integrationsTable)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Integração não encontrada');
        }
        throw new Error(`Error fetching integration: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in googleCalendarService.getIntegrationById:', error);
      throw error;
    }
  }

  async syncCalendar(integrationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseApiUrl}/calendar/sync/${integrationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao sincronizar calendário');
      }

      // Update last sync timestamp
      await supabase
        .from(this.integrationsTable)
        .update({
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId);

    } catch (error) {
      console.error('Error in googleCalendarService.syncCalendar:', error);
      throw error;
    }
  }

  async getEvents(integrationId: string, params?: {
    start_date?: string;
    end_date?: string;
    max_results?: number;
  }): Promise<CalendarEvent[]> {
    try {
      const { start_date, end_date, max_results = 50 } = params || {};
      
      let query = supabase
        .from(this.eventsTable)
        .select('*')
        .eq('integration_id', integrationId)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true })
        .limit(max_results);

      if (start_date) {
        query = query.gte('start_time', start_date);
      }

      if (end_date) {
        query = query.lte('start_time', end_date);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error fetching events: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in googleCalendarService.getEvents:', error);
      throw error;
    }
  }

  async createEvent(integrationId: string, eventData: CreateEventRequest): Promise<CalendarEvent> {
    try {
      const response = await fetch(`${this.baseApiUrl}/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          integration_id: integrationId,
          ...eventData
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar evento');
      }

      const data = await response.json();
      return data.event;
    } catch (error) {
      console.error('Error in googleCalendarService.createEvent:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, eventData: Partial<CreateEventRequest>): Promise<CalendarEvent> {
    try {
      const response = await fetch(`${this.baseApiUrl}/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar evento');
      }

      const data = await response.json();
      return data.event;
    } catch (error) {
      console.error('Error in googleCalendarService.updateEvent:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseApiUrl}/calendar/events/${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir evento');
      }
    } catch (error) {
      console.error('Error in googleCalendarService.deleteEvent:', error);
      throw error;
    }
  }

  async disconnect(integrationId: string): Promise<void> {
    try {
      // Revoke Google tokens
      const response = await fetch(`${this.baseApiUrl}/auth/google/revoke/${integrationId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        console.warn('Warning: Failed to revoke Google tokens');
      }

      // Delete integration from database
      const { error } = await supabase
        .from(this.integrationsTable)
        .delete()
        .eq('id', integrationId);

      if (error) {
        throw new Error(`Error disconnecting integration: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in googleCalendarService.disconnect:', error);
      throw error;
    }
  }

  async refreshToken(integrationId: string): Promise<GoogleIntegration> {
    try {
      const response = await fetch(`${this.baseApiUrl}/auth/google/refresh/${integrationId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Erro ao renovar token');
      }

      const data = await response.json();
      return data.integration;
    } catch (error) {
      console.error('Error in googleCalendarService.refreshToken:', error);
      throw error;
    }
  }

  async getUpcomingEvents(integrationId: string, limit = 10): Promise<CalendarEvent[]> {
    try {
      const now = new Date().toISOString();
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      return await this.getEvents(integrationId, {
        start_date: now,
        end_date: endOfWeek.toISOString(),
        max_results: limit
      });
    } catch (error) {
      console.error('Error in googleCalendarService.getUpcomingEvents:', error);
      throw error;
    }
  }

  async getAvailableSlots(integrationId: string, date: string, duration = 30): Promise<{
    start_time: string;
    end_time: string;
  }[]> {
    try {
      const response = await fetch(`${this.baseApiUrl}/calendar/availability/${integrationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          duration_minutes: duration
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar horários disponíveis');
      }

      const data = await response.json();
      return data.available_slots || [];
    } catch (error) {
      console.error('Error in googleCalendarService.getAvailableSlots:', error);
      throw error;
    }
  }

  async checkIntegrationStatus(integrationId: string): Promise<{
    status: 'active' | 'expired' | 'error';
    last_sync: string;
    error_message?: string;
  }> {
    try {
      const response = await fetch(`${this.baseApiUrl}/calendar/status/${integrationId}`);

      if (!response.ok) {
        return {
          status: 'error',
          last_sync: new Date().toISOString(),
          error_message: 'Erro ao verificar status'
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in googleCalendarService.checkIntegrationStatus:', error);
      return {
        status: 'error',
        last_sync: new Date().toISOString(),
        error_message: 'Erro de conectividade'
      };
    }
  }

  async toggleSync(integrationId: string, enabled: boolean): Promise<GoogleIntegration> {
    try {
      const { data, error } = await supabase
        .from(this.integrationsTable)
        .update({
          sync_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId)
        .select()
        .single();

      if (error) {
        throw new Error(`Error toggling sync: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in googleCalendarService.toggleSync:', error);
      throw error;
    }
  }

  async getCalendarInfo(integrationId: string): Promise<{
    id: string;
    summary: string;
    description?: string;
    timezone: string;
    access_role: string;
  }> {
    try {
      const response = await fetch(`${this.baseApiUrl}/calendar/info/${integrationId}`);

      if (!response.ok) {
        throw new Error('Erro ao obter informações do calendário');
      }

      const data = await response.json();
      return data.calendar;
    } catch (error) {
      console.error('Error in googleCalendarService.getCalendarInfo:', error);
      throw error;
    }
  }

  formatEventForDisplay(event: CalendarEvent): {
    title: string;
    time: string;
    date: string;
    duration: string;
  } {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    const date = startDate.toLocaleDateString('pt-BR');
    const startTime = startDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = endDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    const duration = durationMinutes >= 60 
      ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}min`
      : `${durationMinutes}min`;

    return {
      title: event.title,
      time: event.all_day ? 'Dia todo' : `${startTime} - ${endTime}`,
      date,
      duration: event.all_day ? 'Dia todo' : duration
    };
  }
}

export const googleCalendarService = new GoogleCalendarService();
