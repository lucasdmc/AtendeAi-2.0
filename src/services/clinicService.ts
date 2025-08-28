// =====================================================
// SERVIÇO DE GESTÃO DE CLÍNICAS - ATENDEAÍ 2.0
// =====================================================

import { supabase } from '@/integrations/supabase/client';

export interface Clinic {
  id: string;
  name: string;
  cnpj?: string;
  status: 'active' | 'inactive' | 'suspended';
  whatsapp_webhook_url?: string;
  whatsapp_id_number?: string;
  whatsapp_verify_token?: string;
  google_client_id?: string;
  google_client_secret?: string;
  google_refresh_token?: string;
  google_access_token?: string;
  google_token_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicContextualization {
  id: string;
  clinic_id: string;
  mission: string;
  values: string[];
  differentials: string[];
  specialties: string[];
  working_hours: WorkingHours;
  appointment_policies: AppointmentPolicy[];
  ai_personality: AIPersonality;
  ai_behavior: AIBehavior;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  is_open: boolean;
  open_time?: string;
  close_time?: string;
  break_start?: string;
  break_end?: string;
}

export interface AppointmentPolicy {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  buffer_before: number;
  buffer_after: number;
  max_advance_days: number;
  cancellation_hours: number;
}

export interface AIPersonality {
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  language: 'pt-BR' | 'en-US' | 'es-ES';
  empathy_level: 'low' | 'medium' | 'high';
  formality_level: 'low' | 'medium' | 'high';
}

export interface AIBehavior {
  response_time: 'immediate' | 'fast' | 'normal' | 'slow';
  follow_up_frequency: 'never' | 'rarely' | 'sometimes' | 'always';
  proactive_suggestions: boolean;
  emotional_intelligence: boolean;
}

class ClinicService {
  // Usando Supabase diretamente para operações CRUD

  // Método getAuthHeaders removido - usando Supabase diretamente

  // Obter todas as clínicas (ou apenas a clínica do usuário)
  async getClinics(limit: number = 100, offset: number = 0): Promise<Clinic[]> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('status', 'active')
        .limit(limit)
        .range(offset, offset + limit - 1)
        .order('name');

      if (error) {
        throw new Error(`Error fetching clinics: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching clinics:', error);
      throw error;
    }
  }

  // Obter clínica específica
  async getClinic(id: string): Promise<Clinic> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single();

      if (error) {
        throw new Error(`Error fetching clinic: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching clinic:', error);
      throw error;
    }
  }

  // Criar nova clínica (apenas admin_lify)
  async createClinic(clinicData: Partial<Clinic>): Promise<Clinic> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .insert({
          ...clinicData,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating clinic: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating clinic:', error);
      throw error;
    }
  }

  // Atualizar clínica
  async updateClinic(id: string, clinicData: Partial<Clinic>): Promise<Clinic> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .update({
          ...clinicData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating clinic: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating clinic:', error);
      throw error;
    }
  }

  // Deletar clínica (apenas admin_lify)
  async deleteClinic(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting clinic:', error);
      throw error;
    }
  }

  // Obter contextualização da clínica
  async getClinicContextualization(id: string, forceRefresh: boolean = false): Promise<ClinicContextualization> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}/contextualization?forceRefresh=${forceRefresh}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching clinic contextualization:', error);
      throw error;
    }
  }

  // Atualizar contextualização da clínica
  async updateClinicContextualization(id: string, contextualizationData: Partial<ClinicContextualization>): Promise<ClinicContextualization> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}/contextualization`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(contextualizationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating clinic contextualization:', error);
      throw error;
    }
  }

  // Obter intenções da clínica
  async getClinicIntentions(id: string): Promise<string[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}/intentions`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching clinic intentions:', error);
      throw error;
    }
  }

  // Obter personalidade da IA da clínica
  async getClinicPersonality(id: string): Promise<AIPersonality> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}/personality`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching clinic personality:', error);
      throw error;
    }
  }

  // Obter comportamento da IA da clínica
  async getClinicBehavior(id: string): Promise<AIBehavior> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}/behavior`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching clinic behavior:', error);
      throw error;
    }
  }

  // Obter horários de funcionamento
  async getClinicWorkingHours(id: string): Promise<WorkingHours> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}/working-hours`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching clinic working hours:', error);
      throw error;
    }
  }

  // Obter políticas de agendamento
  async getClinicAppointmentPolicies(id: string): Promise<AppointmentPolicy[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}/appointment-policies`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching clinic appointment policies:', error);
      throw error;
    }
  }

  // Obter mapeamentos de calendário
  async getClinicCalendarMappings(id: string): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}/calendar-mappings`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching clinic calendar mappings:', error);
      throw error;
    }
  }

  // Obter serviços da clínica
  async getClinicServices(id: string): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}/services`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching clinic services:', error);
      throw error;
    }
  }

  // Obter profissionais da clínica
  async getClinicProfessionals(id: string): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}/professionals`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching clinic professionals:', error);
      throw error;
    }
  }

  // Limpar cache de contextualização
  async clearContextualizationCache(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/${id}/contextualization/cache`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error clearing contextualization cache:', error);
      throw error;
    }
  }

  // Obter estatísticas do cache de contextualização
  async getContextualizationCacheStats(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/contextualization/cache/stats`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching contextualization cache stats:', error);
      throw error;
    }
  }

  // Buscar clínica por número do WhatsApp
  async getClinicByWhatsAppPhone(phone: string): Promise<Clinic> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/clinics/whatsapp/${phone}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching clinic by WhatsApp phone:', error);
      throw error;
    }
  }
}

// Instância singleton
export const clinicService = new ClinicService();
export default clinicService;
