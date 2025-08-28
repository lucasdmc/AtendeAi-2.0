import { get, post } from '@/lib/http';

export type ConversationSummary = {
  id: string;
  clinic_id: string;
  wa_contact_id?: string;
  status: 'open' | 'closed';
  mode: 'on' | 'off';
  last_message_at?: string;
};

export type ProcessMessagePayload = {
  clinic_id: string;
  patient_phone: string;
  message_content: string;
  patient_name?: string;
  message_type?: 'text' | 'image' | 'audio' | 'video' | 'document';
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const conversationService = {
  async health(): Promise<any> {
    return get(`${API_BASE}/api/conversation/health`);
  },
  async listByClinic(clinicId: string): Promise<ConversationSummary[]> {
    const data = await get<{ data: ConversationSummary[] }>(`${API_BASE}/api/conversation/clinic/${clinicId}`);
    return data.data || [];
  },
  async processMessage(payload: ProcessMessagePayload): Promise<any> {
    return post(`${API_BASE}/api/conversation/process`, payload);
  },
  async transitionToHuman(conversationId: string, attendantId: string, reason?: string): Promise<any> {
    return post(`${API_BASE}/api/conversation/${conversationId}/transition/human`, { attendant_id: attendantId, reason });
  },
  async transitionToBot(conversationId: string, reason?: string): Promise<any> {
    return post(`${API_BASE}/api/conversation/${conversationId}/transition/bot`, { reason });
  },
};

export default conversationService;