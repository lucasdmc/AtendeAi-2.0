import authService from "@/services/authService";

interface SendTextPayload {
  patient_phone: string;
  message: string;
  clinic_id: string;
  conversation_id?: string | null;
}

export class WhatsAppSDK {
  private baseURL = "http://localhost:3007/api/whatsapp";

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = authService.getAccessToken();
    if (!token) throw new Error("No authentication token available");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async sendText(payload: SendTextPayload): Promise<{ success: boolean; id?: string }>
  {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/send/text`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`WhatsApp send failed (${response.status}): ${text}`);
    }
    return response.json();
  }
}

export const whatsappSDK = new WhatsAppSDK();
