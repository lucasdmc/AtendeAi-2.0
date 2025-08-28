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

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export const conversationService = {
  async health(): Promise<any> {
    return http('/api/conversation/health');
  },
  async listByClinic(clinicId: string): Promise<ConversationSummary[]> {
    const data = await http<{ data: ConversationSummary[] }>(`/api/conversation/clinic/${clinicId}`);
    return data.data || [];
  },
  async processMessage(payload: ProcessMessagePayload): Promise<any> {
    return http('/api/conversation/process', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async transitionToHuman(conversationId: string, attendantId: string, reason?: string): Promise<any> {
    return http(`/api/conversation/${conversationId}/transition/human`, {
      method: 'POST',
      body: JSON.stringify({ attendant_id: attendantId, reason }),
    });
  },
  async transitionToBot(conversationId: string, reason?: string): Promise<any> {
    return http(`/api/conversation/${conversationId}/transition/bot`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

export default conversationService;