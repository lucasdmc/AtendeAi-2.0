// =====================================================
// GOOGLE CALENDAR SDK - ATENDEAÍ 2.0
// =====================================================

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

export interface GoogleEvent {
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

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string;
  attendees?: string[];
}

class GoogleCalendarSDK {
  private readonly baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  private readonly integrationsTable = 'google_integrations';

  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Usuário não autenticado');
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  // =====================================================
  // OAUTH2 FLOW
  // =====================================================

  async getAuthUrl(redirectUri: string): Promise<string> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/auth/google/url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ redirect_uri: redirectUri })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao obter URL de autenticação');
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
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/auth/google/callback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, state })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao processar callback');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error handling callback:', error);
      throw error;
    }
  }

  // =====================================================
  // INTEGRATIONS MANAGEMENT
  // =====================================================

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
      console.error('Error in getUserIntegrations:', error);
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
      console.error('Error in getIntegrationById:', error);
      throw error;
    }
  }

  async disconnect(integrationId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Revoke Google tokens
      await fetch(`${this.baseUrl}/auth/google/revoke/${integrationId}`, {
        method: 'POST',
        headers
      });

      // Delete integration from database
      const { error } = await supabase
        .from(this.integrationsTable)
        .delete()
        .eq('id', integrationId);

      if (error) {
        throw new Error(`Error disconnecting integration: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in disconnect:', error);
      throw error;
    }
  }

  // =====================================================
  // CALENDAR OPERATIONS
  // =====================================================

  async syncCalendar(integrationId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/google/events/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ integration_id: integrationId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao sincronizar calendário');
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
      console.error('Error in syncCalendar:', error);
      throw error;
    }
  }

  async getEvents(integrationId: string, params?: {
    start_date?: string;
    end_date?: string;
    max_results?: number;
  }): Promise<GoogleEvent[]> {
    try {
      const headers = await this.getAuthHeaders();
      const queryParams = new URLSearchParams({
        integration_id: integrationId,
        ...(params?.start_date && { start_date: params.start_date }),
        ...(params?.end_date && { end_date: params.end_date }),
        ...(params?.max_results && { max_results: params.max_results.toString() })
      });

      const response = await fetch(`${this.baseUrl}/google/events?${queryParams}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar eventos');
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error in getEvents:', error);
      throw error;
    }
  }

  async createEvent(integrationId: string, eventData: CreateEventRequest): Promise<GoogleEvent> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/google/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          integration_id: integrationId,
          ...eventData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar evento');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in createEvent:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, eventData: Partial<CreateEventRequest>): Promise<GoogleEvent> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/google/events/${eventId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar evento');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in updateEvent:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/google/events/${eventId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir evento');
      }
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      throw error;
    }
  }

  async refreshToken(integrationId: string): Promise<GoogleIntegration> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/auth/google/refresh/${integrationId}`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao renovar token');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in refreshToken:', error);
      throw error;
    }
  }

  async checkIntegrationStatus(integrationId: string): Promise<{
    status: 'active' | 'expired' | 'error';
    last_sync: string;
    error_message?: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/google/status/${integrationId}`, {
        method: 'GET',
        headers
      });

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
      console.error('Error in checkIntegrationStatus:', error);
      return {
        status: 'error',
        last_sync: new Date().toISOString(),
        error_message: 'Erro de conectividade'
      };
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  generateCalendarEmbedUrl(calendarId: string): string {
    const baseUrl = 'https://calendar.google.com/calendar/embed';
    const params = new URLSearchParams({
      src: calendarId,
      ctz: 'America/Sao_Paulo',
      mode: 'AGENDA',
      showTitle: '1',
      showNav: '1',
      showDate: '1',
      showPrint: '0',
      showTabs: '1',
      showCalendars: '0',
      showTz: '0',
      height: '600',
      wkst: '1',
      bgcolor: '%23ffffff'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  formatEventForDisplay(event: GoogleEvent): {
    title: string;
    time: string;
    date: string;
    duration: string;
  } {
    const startDate = new Date(event.start.dateTime);
    const endDate = new Date(event.end.dateTime);

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
      title: event.summary,
      time: `${startTime} - ${endTime}`,
      date,
      duration
    };
  }
}

// Instância singleton
export const googleCalendarSDK = new GoogleCalendarSDK();
export default googleCalendarSDK;
