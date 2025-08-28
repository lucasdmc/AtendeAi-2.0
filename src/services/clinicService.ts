// =====================================================
// SERVIÇO DE GESTÃO DE CLÍNICAS - ATENDEAÍ 2.0
// =====================================================

import { get, post, put, del } from '@/lib/http';

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

const BASE_URL = import.meta.env.VITE_CLINIC_API_BASE_URL || 'http://localhost:3003/api/v1';

class ClinicService {
  private baseURL = BASE_URL;

  async getClinics(limit: number = 100, offset: number = 0): Promise<Clinic[]> {
    const data = await get<{ data: Clinic[] }>(`${this.baseURL}/clinics?limit=${limit}&offset=${offset}`);
    return data.data || [];
  }

  async getClinic(id: string): Promise<Clinic> {
    const data = await get<{ data: Clinic }>(`${this.baseURL}/clinics/${id}`);
    return data.data;
  }

  async createClinic(clinicData: Partial<Clinic>): Promise<Clinic> {
    const data = await post<{ data: Clinic }>(`${this.baseURL}/clinics`, clinicData);
    return data.data;
  }

  async updateClinic(id: string, clinicData: Partial<Clinic>): Promise<Clinic> {
    const data = await put<{ data: Clinic }>(`${this.baseURL}/clinics/${id}`, clinicData);
    return data.data;
  }

  async deleteClinic(id: string): Promise<void> {
    await del(`${this.baseURL}/clinics/${id}`);
  }

  async getClinicContextualization(id: string, forceRefresh: boolean = false): Promise<ClinicContextualization> {
    const data = await get<{ data: ClinicContextualization }>(`${this.baseURL}/clinics/${id}/contextualization?forceRefresh=${forceRefresh}`);
    return data.data;
  }

  async updateClinicContextualization(id: string, contextualizationData: Partial<ClinicContextualization>): Promise<ClinicContextualization> {
    const data = await put<{ data: ClinicContextualization }>(`${this.baseURL}/clinics/${id}/contextualization`, contextualizationData);
    return data.data;
  }

  async getClinicIntentions(id: string): Promise<string[]> {
    const data = await get<{ data: string[] }>(`${this.baseURL}/clinics/${id}/intentions`);
    return data.data || [];
  }

  async getClinicPersonality(id: string): Promise<AIPersonality> {
    const data = await get<{ data: AIPersonality }>(`${this.baseURL}/clinics/${id}/personality`);
    return data.data;
  }

  async getClinicBehavior(id: string): Promise<AIBehavior> {
    const data = await get<{ data: AIBehavior }>(`${this.baseURL}/clinics/${id}/behavior`);
    return data.data;
  }

  async getClinicWorkingHours(id: string): Promise<WorkingHours> {
    const data = await get<{ data: WorkingHours }>(`${this.baseURL}/clinics/${id}/working-hours`);
    return data.data;
  }

  async getClinicAppointmentPolicies(id: string): Promise<AppointmentPolicy[]> {
    const data = await get<{ data: AppointmentPolicy[] }>(`${this.baseURL}/clinics/${id}/appointment-policies`);
    return data.data || [];
  }

  async getClinicCalendarMappings(id: string): Promise<any[]> {
    const data = await get<{ data: any[] }>(`${this.baseURL}/clinics/${id}/calendar-mappings`);
    return data.data || [];
  }

  async getClinicServices(id: string): Promise<any[]> {
    const data = await get<{ data: any[] }>(`${this.baseURL}/clinics/${id}/services`);
    return data.data || [];
  }

  async getClinicProfessionals(id: string): Promise<any[]> {
    const data = await get<{ data: any[] }>(`${this.baseURL}/clinics/${id}/professionals`);
    return data.data || [];
  }

  async clearContextualizationCache(id: string): Promise<void> {
    await del(`${this.baseURL}/clinics/${id}/contextualization/cache`);
  }

  async getContextualizationCacheStats(): Promise<any> {
    const data = await get<{ data: any }>(`${this.baseURL}/clinics/contextualization/cache/stats`);
    return data.data;
  }

  async getClinicByWhatsAppPhone(phone: string): Promise<Clinic> {
    const data = await get<{ data: Clinic }>(`${this.baseURL}/clinics/whatsapp/${phone}`);
    return data.data;
  }
}

export const clinicService = new ClinicService();
export default clinicService;
