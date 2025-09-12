// API Service Layer - AtendeAI 2.0
// Centralized API integration for all backend microservices

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

// Generic API client for microservices
class MicroserviceClient {
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: typeof apiConfig) {
    this.timeout = config.timeout;
    this.headers = config.headers;
  }

  private async request<T>(
    service: keyof typeof MICROSERVICES_URLS,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseURL = MICROSERVICES_URLS[service];
    const url = `${baseURL}${endpoint}`;
    const token = localStorage.getItem('auth_token');

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
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
  context_json: any;
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
    return apiClient.get<Clinic[]>('clinics', '/api/clinics');
  },

  async getClinic(id: string) {
    return apiClient.get<Clinic>('clinics', `/api/clinics/${id}`);
  },

  async createClinic(clinic: Partial<Clinic>) {
    return apiClient.post<Clinic>('clinics', '/api/clinics', clinic);
  },

  async updateClinic(id: string, clinic: Partial<Clinic>) {
    return apiClient.put<Clinic>('clinics', `/api/clinics/${id}`, clinic);
  },

  async deleteClinic(id: string) {
    return apiClient.delete<{ success: boolean }>('clinics', `/api/clinics/${id}`);
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
