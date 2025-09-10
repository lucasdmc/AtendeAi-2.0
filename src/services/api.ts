// API Service Layer - AtendeAI 2.0
// Centralized API integration for all backend services

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// API Configuration
const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Generic API client
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: typeof apiConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.headers = config.headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
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
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient(apiConfig);

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

// Auth Service API
export const authApi = {
  async login(email: string, password: string) {
    return apiClient.post<{
      success: boolean;
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login', { email, password });
  },

  async refreshToken(refreshToken: string) {
    return apiClient.post<{
      success: boolean;
      accessToken: string;
    }>('/auth/refresh', { refreshToken });
  },

  async getMe() {
    return apiClient.get<{
      success: boolean;
      user: User;
    }>('/auth/me');
  },

  async logout() {
    return apiClient.post('/auth/logout');
  },
};

// Clinic Service API
export const clinicApi = {
  async getClinics() {
    return apiClient.get<{
      success: boolean;
      data: Clinic[];
    }>('/api/clinics');
  },

  async getClinic(id: string) {
    return apiClient.get<{
      success: boolean;
      data: Clinic;
    }>(`/api/clinics/${id}`);
  },

  async createClinic(clinic: Partial<Clinic>) {
    return apiClient.post<{
      success: boolean;
      data: Clinic;
    }>('/api/clinics', clinic);
  },

  async updateClinic(id: string, clinic: Partial<Clinic>) {
    return apiClient.put<{
      success: boolean;
      data: Clinic;
    }>(`/api/clinics/${id}`, clinic);
  },

  async deleteClinic(id: string) {
    return apiClient.delete<{
      success: boolean;
    }>(`/api/clinics/${id}`);
  },

  async getClinicProfessionals(clinicId: string) {
    return apiClient.get<{
      success: boolean;
      data: any[];
    }>(`/api/clinics/${clinicId}/professionals`);
  },

  async getClinicServices(clinicId: string) {
    return apiClient.get<{
      success: boolean;
      data: any[];
    }>(`/api/clinics/${clinicId}/services`);
  },
};

// Conversation Service API
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
    }>(`/api/conversation/clinic/${clinicId}?limit=${limit}&offset=${offset}`);
  },

  async getActiveConversations(clinicId: string) {
    return apiClient.get<{
      success: boolean;
      data: Conversation[];
    }>(`/api/conversation/clinic/${clinicId}/active`);
  },

  async getConversationHistory(clinicId: string, patientPhone: string, limit = 50, offset = 0) {
    return apiClient.get<{
      success: boolean;
      data: {
        conversation: Conversation;
        messages: Message[];
      };
    }>(`/api/conversation/history?clinic_id=${clinicId}&patient_phone=${patientPhone}&limit=${limit}&offset=${offset}`);
  },

  async closeConversation(conversationId: string) {
    return apiClient.put<{
      success: boolean;
    }>(`/api/conversation/${conversationId}/close`);
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
    }>('/api/conversation/process', data);
  },
};

// Appointment Service API
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
    }>(`/api/appointments?${params.toString()}`);
  },

  async getAppointment(id: string) {
    return apiClient.get<{
      success: boolean;
      data: Appointment;
    }>(`/api/appointments/${id}`);
  },

  async createAppointment(appointment: Partial<Appointment>) {
    return apiClient.post<{
      success: boolean;
      data: Appointment;
    }>('/api/appointments', appointment);
  },

  async updateAppointment(id: string, appointment: Partial<Appointment>) {
    return apiClient.put<{
      success: boolean;
      data: Appointment;
    }>(`/api/appointments/${id}`, appointment);
  },

  async deleteAppointment(id: string) {
    return apiClient.delete<{
      success: boolean;
    }>(`/api/appointments/${id}`);
  },
};

// WhatsApp Service API
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
    }>('/api/whatsapp/send', data);
  },

  async getMessageStatus(messageId: string) {
    return apiClient.get<{
      success: boolean;
      status: string;
    }>(`/api/whatsapp/message/${messageId}/status`);
  },

  async getClinicContext(clinicId: string) {
    return apiClient.get<{
      success: boolean;
      context: any;
    }>(`/api/whatsapp/clinic/${clinicId}/context`);
  },

  async getClinicConfig(clinicId: string) {
    return apiClient.get<{
      success: boolean;
      config: any;
    }>(`/api/whatsapp/clinic/${clinicId}/config`);
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
