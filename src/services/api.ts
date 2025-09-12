// API Service Layer - AtendeAI 2.0
// Centralized API integration for all backend microservices

import { z } from 'zod';

// Microservices URLs - Configuração para desenvolvimento e produção
const MICROSERVICES_URLS = {
  // URLs locais para desenvolvimento
  auth: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001',
  clinics: import.meta.env.VITE_CLINIC_SERVICE_URL || 'http://localhost:3003',
  conversations: import.meta.env.VITE_CONVERSATION_SERVICE_URL || 'http://localhost:3005',
  appointments: import.meta.env.VITE_APPOINTMENT_SERVICE_URL || 'http://localhost:3006',
  whatsapp: import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'http://localhost:3007',
};

// API Configuration
const apiConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Zod schemas for validation
export const ClinicSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório'),
  whatsapp_number: z.string().min(1, 'Número do WhatsApp é obrigatório'),
  meta_webhook_url: z.string().url().optional(),
  whatsapp_id: z.string().optional(),
  context_json: z.any().default({}),
  simulation_mode: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório'),
  login: z.string().email('Email inválido'),
  role: z.enum(['admin_lify', 'suporte_lify', 'atendente', 'gestor', 'administrador']),
  clinic_id: z.string().uuid(),
  status: z.enum(['active', 'inactive']).default('active'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  clinic_id: z.string().uuid(),
  customer_phone: z.string().min(1, 'Telefone é obrigatório'),
  conversation_type: z.enum(['chatbot', 'human', 'mixed']),
  status: z.enum(['active', 'paused', 'closed']),
  bot_active: z.boolean().default(true),
  assigned_user_id: z.string().uuid().optional(),
  tags: z.array(z.any()).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_type: z.enum(['customer', 'bot', 'human']),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  message_type: z.enum(['text', 'image', 'audio', 'video', 'document']),
  whatsapp_message_id: z.string().optional(),
  timestamp: z.string().datetime(),
});

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  clinic_id: z.string().uuid(),
  customer_info: z.any(),
  google_event_id: z.string().optional(),
  google_calendar_id: z.string().optional(),
  appointment_type: z.string().min(1, 'Tipo de agendamento é obrigatório'),
  datetime: z.string().datetime(),
  duration: z.number().positive('Duração deve ser positiva'),
  status: z.enum(['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show']),
  priority: z.number().int().min(1).max(5).default(3),
  confirmation_sent: z.boolean().default(false),
  confirmation_received: z.boolean().default(false),
  notes: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Generic API client for microservices
class MicroserviceClient {
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: typeof apiConfig) {
    this.timeout = config.timeout;
    this.headers = config.headers;
  }

  private getClinicId(): string | null {
    // Try to get from localStorage first (for admin_lify)
    const selectedClinic = localStorage.getItem('selectedClinic');
    if (selectedClinic) {
      try {
        const clinic = JSON.parse(selectedClinic);
        return clinic.id;
      } catch (error) {
        console.warn('Failed to parse selectedClinic from localStorage:', error);
      }
    }

    // Try to get from user context
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.clinic_id;
      } catch (error) {
        console.warn('Failed to parse user from localStorage:', error);
      }
    }

    return null;
  }

  private async request<T>(
    service: keyof typeof MICROSERVICES_URLS,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseURL = MICROSERVICES_URLS[service];
    const url = `${baseURL}${endpoint}`;
    const token = localStorage.getItem('auth_token');
    const clinicId = this.getClinicId();

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(clinicId && { 'x-clinic-id': clinicId }),
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - servidor não respondeu a tempo');
      }
      console.error(`API Request failed for ${service}${endpoint}:`, error);
      throw error;
    }
  }

  async get<T>(service: keyof typeof MICROSERVICES_URLS, endpoint: string): Promise<T> {
    return this.request<T>(service, endpoint, { method: 'GET' });
  }

  async post<T>(service: keyof typeof MICROSERVICES_URLS, endpoint: string, data?: any): Promise<T> {
    return this.request<T>(service, endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(service: keyof typeof MICROSERVICES_URLS, endpoint: string, data?: any): Promise<T> {
    return this.request<T>(service, endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(service: keyof typeof MICROSERVICES_URLS, endpoint: string): Promise<T> {
    return this.request<T>(service, endpoint, { method: 'DELETE' });
  }
}

const apiClient = new MicroserviceClient(apiConfig);

// Types
export interface Clinic {
  id: string;
  name: string;
  whatsapp_number: string;
  meta_webhook_url?: string;
  whatsapp_id?: string;
  context_json: {
    clinica: {
      informacoes_basicas: {
        nome: string;
        descricao: string;
      };
      localizacao: {
        endereco_principal: string;
      };
      contatos: {
        telefone_principal: string;
        email_principal: string;
      };
    };
    servicos?: any[];
    profissionais?: any[];
    politicas?: any;
  };
  simulation_mode: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  login: string;
  role: 'admin_lify' | 'suporte_lify' | 'atendente' | 'gestor' | 'administrador';
  clinic_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  clinic_id: string;
  customer_phone: string;
  conversation_type: 'chatbot' | 'human' | 'mixed';
  status: 'active' | 'paused' | 'closed';
  bot_active: boolean;
  assigned_user_id?: string;
  tags: any[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'bot' | 'human';
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  whatsapp_message_id?: string;
  timestamp: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  customer_info: any;
  google_event_id?: string;
  google_calendar_id?: string;
  appointment_type: string;
  datetime: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  priority: number;
  confirmation_sent: boolean;
  confirmation_received: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Auth Service API - Conectando com o microserviço real
export const authApi = {
  async login(email: string, password: string, clinicId: string) {
    return apiClient.post<{
      success: boolean;
      data: {
        accessToken: string;
        refreshToken: string;
        user: User;
      };
    }>('auth', '/api/v1/auth/login', { email, password, clinicId });
  },

  async refreshToken(refreshToken: string, clinicId: string) {
    return apiClient.post<{
      success: boolean;
      data: {
        accessToken: string;
        refreshToken: string;
      };
    }>('auth', '/api/v1/auth/refresh', { refreshToken, clinicId });
  },

  async validateToken() {
    return apiClient.get<{
      success: boolean;
      data: {
        valid: boolean;
        user: User;
      };
    }>('auth', '/api/v1/auth/validate');
  },

  async logout(refreshToken: string, clinicId: string) {
    return apiClient.post('auth', '/api/v1/auth/logout', { refreshToken, clinicId });
  },
};

// Clinic Service API - Conectando com o microserviço real
export const clinicApi = {
  async getClinics() {
    try {
      const response = await apiClient.get<{ success: boolean; data: Clinic[] }>('clinics', '/api/clinics');
      if (response.success) {
        // Validate each clinic with Zod
        const validatedClinics = response.data.map(clinic => ClinicSchema.parse(clinic));
        return validatedClinics;
      }
      throw new Error('Failed to fetch clinics');
    } catch (error) {
      console.error('Error fetching clinics:', error);
      throw error;
    }
  },

  async getClinic(id: string) {
    try {
      const response = await apiClient.get<{ success: boolean; data: Clinic }>('clinics', `/api/clinics/${id}`);
      if (response.success) {
        return ClinicSchema.parse(response.data);
      }
      throw new Error('Failed to fetch clinic');
    } catch (error) {
      console.error('Error fetching clinic:', error);
      throw error;
    }
  },

  async createClinic(clinic: Partial<Clinic>) {
    try {
      // Validate input data
      const validatedData = ClinicSchema.partial().parse(clinic);
      const response = await apiClient.post<{ success: boolean; data: Clinic }>('clinics', '/api/clinics', validatedData);
      if (response.success) {
        return ClinicSchema.parse(response.data);
      }
      throw new Error('Failed to create clinic');
    } catch (error) {
      console.error('Error creating clinic:', error);
      throw error;
    }
  },

  async updateClinic(id: string, clinic: Partial<Clinic>) {
    try {
      // Validate input data
      const validatedData = ClinicSchema.partial().parse(clinic);
      const response = await apiClient.put<{ success: boolean; data: Clinic }>('clinics', `/api/clinics/${id}`, validatedData);
      if (response.success) {
        return ClinicSchema.parse(response.data);
      }
      throw new Error('Failed to update clinic');
    } catch (error) {
      console.error('Error updating clinic:', error);
      throw error;
    }
  },

  async deleteClinic(id: string) {
    try {
      const response = await apiClient.delete<{ success: boolean }>('clinics', `/api/clinics/${id}`);
      if (!response.success) {
        throw new Error('Failed to delete clinic');
      }
      return response;
    } catch (error) {
      console.error('Error deleting clinic:', error);
      throw error;
    }
  },

  async getClinicProfessionals(clinicId: string) {
    return apiClient.get<any[]>('clinics', `/api/clinics/${clinicId}/professionals`);
  },

  async getClinicServices(clinicId: string) {
    return apiClient.get<any[]>('clinics', `/api/clinics/${clinicId}/services`);
  },

  async getClinicByWhatsAppPhone(phone: string) {
    return apiClient.get<Clinic>('clinics', `/api/clinics/whatsapp/${phone}`);
  },

  async getClinicContextualization(clinicId: string) {
    return apiClient.get<any>('clinics', `/api/clinics/${clinicId}/contextualization`);
  },

  async updateClinicContextualization(clinicId: string, data: any) {
    return apiClient.put<any>('clinics', `/api/clinics/${clinicId}/contextualization`, data);
  },
};

// User Service API - Conectando com o microserviço real
export const userApi = {
  async getUsers(clinicId?: string) {
    try {
      const endpoint = clinicId ? `/api/users?clinic_id=${clinicId}` : '/api/users';
      const response = await apiClient.get<{ success: boolean; data: User[] }>('auth', endpoint);
      if (response.success) {
        // Validate each user with Zod
        const validatedUsers = response.data.map(user => UserSchema.parse(user));
        return validatedUsers;
      }
      throw new Error('Failed to fetch users');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getUser(id: string) {
    try {
      const response = await apiClient.get<{ success: boolean; data: User }>('auth', `/api/users/${id}`);
      if (response.success) {
        return UserSchema.parse(response.data);
      }
      throw new Error('Failed to fetch user');
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  async createUser(user: Partial<User>) {
    try {
      // Validate input data
      const validatedData = UserSchema.partial().parse(user);
      const response = await apiClient.post<{ success: boolean; data: User }>('auth', '/api/users', validatedData);
      if (response.success) {
        return UserSchema.parse(response.data);
      }
      throw new Error('Failed to create user');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id: string, user: Partial<User>) {
    try {
      // Validate input data
      const validatedData = UserSchema.partial().parse(user);
      const response = await apiClient.put<{ success: boolean; data: User }>('auth', `/api/users/${id}`, validatedData);
      if (response.success) {
        return UserSchema.parse(response.data);
      }
      throw new Error('Failed to update user');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(id: string) {
    try {
      const response = await apiClient.delete<{ success: boolean }>('auth', `/api/users/${id}`);
      if (!response.success) {
        throw new Error('Failed to delete user');
      }
      return response;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
};

// Conversation Service API - Conectando com o microserviço real
export const conversationApi = {
  async getConversations(clinicId: string, limit = 50, offset = 0) {
    return apiClient.get<{
      success: boolean;
      data: Conversation[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
      };
    }>('conversations', `/api/conversation/clinic/${clinicId}?limit=${limit}&offset=${offset}`);
  },

  async getActiveConversations(clinicId: string) {
    return apiClient.get<{
      success: boolean;
      data: Conversation[];
    }>('conversations', `/api/conversation/clinic/${clinicId}/active`);
  },

  async getPendingHumanConversations(clinicId: string) {
    return apiClient.get<{
      success: boolean;
      data: Conversation[];
    }>('conversations', `/api/conversation/clinic/${clinicId}/pending`);
  },

  async getConversationHistory(clinicId: string, patientPhone: string, limit = 50, offset = 0) {
    return apiClient.get<{
      success: boolean;
      data: {
        conversation: Conversation;
        messages: Message[];
      };
    }>('conversations', `/api/conversation/history?clinic_id=${clinicId}&patient_phone=${patientPhone}&limit=${limit}&offset=${offset}`);
  },

  async getConversationById(conversationId: string) {
    return apiClient.get<{
      success: boolean;
      data: Conversation;
    }>('conversations', `/api/conversation/${conversationId}`);
  },

  async closeConversation(conversationId: string, reason?: string) {
    return apiClient.put<{
      success: boolean;
    }>('conversations', `/api/conversation/${conversationId}/close`, { reason });
  },

  async assignConversation(conversationId: string, attendantId: string) {
    return apiClient.put<{
      success: boolean;
    }>('conversations', `/api/conversation/${conversationId}/assign`, { attendant_id: attendantId });
  },

  async setConversationPriority(conversationId: string, priority: 'low' | 'medium' | 'high' | 'urgent') {
    return apiClient.put<{
      success: boolean;
    }>('conversations', `/api/conversation/${conversationId}/priority`, { priority });
  },

  async transitionToHuman(conversationId: string, attendantId: string, reason?: string) {
    return apiClient.post<{
      success: boolean;
    }>('conversations', `/api/conversation/${conversationId}/transition/human`, { 
      attendant_id: attendantId, 
      reason 
    });
  },

  async transitionToBot(conversationId: string, reason?: string) {
    return apiClient.post<{
      success: boolean;
    }>('conversations', `/api/conversation/${conversationId}/transition/bot`, { reason });
  },

  async processMessage(data: {
    clinic_id: string;
    patient_phone: string;
    patient_name?: string;
    message_content: string;
    message_type: string;
  }) {
    return apiClient.post<{
      success: boolean;
      response: string;
    }>('conversations', '/api/conversation/process', data);
  },

  async getMemoryStats(clinicId: string, patientPhone: string) {
    return apiClient.get<{
      success: boolean;
      data: any;
    }>('conversations', `/api/conversation/memory/stats?clinic_id=${clinicId}&patient_phone=${patientPhone}`);
  },

  async clearUserMemory(clinicId: string, patientPhone: string) {
    return apiClient.delete<{
      success: boolean;
    }>('conversations', '/api/conversation/memory/clear', { 
      clinic_id: clinicId, 
      patient_phone: patientPhone 
    });
  },
};

// Appointment Service API - Conectando com o microserviço real
export const appointmentApi = {
  async getAppointments(clinicId?: string, limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (clinicId) params.append('clinic_id', clinicId);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return apiClient.get<{
      success: boolean;
      data: Appointment[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
      };
    }>('appointments', `/api/appointment/list?${params.toString()}`);
  },

  async getAppointment(id: string) {
    return apiClient.get<{
      success: boolean;
      data: Appointment;
    }>('appointments', `/api/appointment/${id}`);
  },

  async createAppointment(appointment: Partial<Appointment>) {
    return apiClient.post<{
      success: boolean;
      data: Appointment;
    }>('appointments', '/api/appointment', appointment);
  },

  async updateAppointment(id: string, appointment: Partial<Appointment>) {
    return apiClient.put<{
      success: boolean;
      data: Appointment;
    }>('appointments', `/api/appointment/${id}`, appointment);
  },

  async updateAppointmentStatus(id: string, status: string, notes?: string) {
    return apiClient.put<{
      success: boolean;
    }>('appointments', `/api/appointment/${id}/status`, { status, notes });
  },

  async deleteAppointment(id: string) {
    return apiClient.delete<{
      success: boolean;
    }>('appointments', `/api/appointment/${id}`);
  },

  // Fluxo de agendamento
  async startAppointmentFlow(clinicId: string, patientPhone: string, patientName: string) {
    return apiClient.post<{
      success: boolean;
      data: any;
    }>('appointments', '/api/appointment/flow/start', {
      clinic_id: clinicId,
      patient_phone: patientPhone,
      patient_name: patientName
    });
  },

  async getCurrentFlow(clinicId: string, patientPhone: string) {
    return apiClient.get<{
      success: boolean;
      data: any;
    }>('appointments', `/api/appointment/flow/current?clinic_id=${clinicId}&patient_phone=${patientPhone}`);
  },

  async getAvailableServices(clinicId: string, category?: string) {
    const params = new URLSearchParams();
    params.append('clinic_id', clinicId);
    if (category) params.append('category', category);

    return apiClient.get<{
      success: boolean;
      data: any[];
    }>('appointments', `/api/appointment/services?${params.toString()}`);
  },

  async getAvailableProfessionals(clinicId: string, serviceId: string) {
    return apiClient.get<{
      success: boolean;
      data: any[];
    }>('appointments', `/api/appointment/professionals?clinic_id=${clinicId}&service_id=${serviceId}`);
  },

  async getAvailableDates(clinicId: string, serviceId: string, professionalId?: string) {
    const params = new URLSearchParams();
    params.append('clinic_id', clinicId);
    params.append('service_id', serviceId);
    if (professionalId) params.append('professional_id', professionalId);

    return apiClient.get<{
      success: boolean;
      data: string[];
    }>('appointments', `/api/appointment/dates?${params.toString()}`);
  },

  async getAvailableTimes(clinicId: string, serviceId: string, date: string, professionalId?: string) {
    const params = new URLSearchParams();
    params.append('clinic_id', clinicId);
    params.append('service_id', serviceId);
    params.append('date', date);
    if (professionalId) params.append('professional_id', professionalId);

    return apiClient.get<{
      success: boolean;
      data: string[];
    }>('appointments', `/api/appointment/times?${params.toString()}`);
  },

  async confirmAppointment(clinicId: string, patientPhone: string, patientEmail?: string, notes?: string) {
    return apiClient.post<{
      success: boolean;
      data: Appointment;
    }>('appointments', '/api/appointment/flow/confirm', {
      clinic_id: clinicId,
      patient_phone: patientPhone,
      patient_email: patientEmail,
      notes
    });
  },

  async getAppointmentStats(clinicId: string, startDate: string, endDate: string) {
    return apiClient.get<{
      success: boolean;
      data: any;
    }>('appointments', `/api/appointment/stats?clinic_id=${clinicId}&start_date=${startDate}&end_date=${endDate}`);
  },

  async syncWithGoogleCalendar(clinicId: string, startDate: string, endDate: string) {
    return apiClient.post<{
      success: boolean;
      data: any;
    }>('appointments', '/api/appointment/sync/calendar', {
      clinic_id: clinicId,
      start_date: startDate,
      end_date: endDate
    });
  },
};

// WhatsApp Service API - Conectando com o microserviço real
export const whatsappApi = {
  async sendMessage(data: {
    clinic_id: string;
    to: string;
    message: string;
    type?: string;
  }) {
    return apiClient.post<{
      success: boolean;
      message_id: string;
    }>('whatsapp', '/api/whatsapp/send', data);
  },

  async getMessageStatus(messageId: string) {
    return apiClient.get<{
      success: boolean;
      status: string;
    }>('whatsapp', `/api/whatsapp/message/${messageId}/status`);
  },

  async getClinicContext(clinicId: string) {
    return apiClient.get<{
      success: boolean;
      context: any;
    }>('whatsapp', `/api/whatsapp/clinic/${clinicId}/context`);
  },

  async getClinicConfig(clinicId: string) {
    return apiClient.get<{
      success: boolean;
      config: any;
    }>('whatsapp', `/api/whatsapp/clinic/${clinicId}/config`);
  },

  async verifyWebhook(mode: string, token: string, challenge: string) {
    return apiClient.get<{
      success: boolean;
      challenge?: string;
    }>('whatsapp', `/webhook/whatsapp?hub.mode=${mode}&hub.verify_token=${token}&hub.challenge=${challenge}`);
  },

  async handleWebhook(data: any) {
    return apiClient.post<{
      success: boolean;
    }>('whatsapp', '/webhook/whatsapp', data);
  },
};

// Error handling utility
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.message?.includes('401')) {
    // Unauthorized - redirect to login
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    return;
  }

  if (error.message?.includes('403')) {
    // Forbidden
    return 'Você não tem permissão para realizar esta ação.';
  }

  if (error.message?.includes('404')) {
    return 'Recurso não encontrado.';
  }

  if (error.message?.includes('500')) {
    return 'Erro interno do servidor. Tente novamente mais tarde.';
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
};

export default apiClient;
