import { z } from "zod";

const VITE_CONVERSATION_BASE =
  import.meta.env.VITE_CONVERSATION_BASE || "http://localhost:3005";

export const ConversationSchemas = {
  conversationId: z.string().uuid(),
  clinicId: z.string().uuid(),
  phone: z.string().min(8),
};

export type Conversation = {
  id: string;
  status: "active" | "closed" | "pending";
  patient_phone: string;
  clinic_id: string;
  last_message?: string;
  last_activity?: string;
};

export async function listActiveConversations(clinicId: string): Promise<Conversation[]> {
  ConversationSchemas.clinicId.parse(clinicId);
  const res = await fetch(
    `${VITE_CONVERSATION_BASE}/api/conversation/clinic/${clinicId}/active`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`Falha ao listar conversas ativas: ${res.status}`);
  return res.json();
}

export async function transitionToHuman(conversationId: string, attendantId: string, reason?: string) {
  ConversationSchemas.conversationId.parse(conversationId);
  const res = await fetch(
    `${VITE_CONVERSATION_BASE}/api/conversation/${conversationId}/transition/human`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendant_id: attendantId, reason }),
      credentials: "include",
    }
  );
  if (!res.ok) throw new Error(`Falha ao assumir conversa (humano): ${res.status}`);
  return res.json();
}

export async function transitionToBot(conversationId: string, reason?: string) {
  ConversationSchemas.conversationId.parse(conversationId);
  const res = await fetch(
    `${VITE_CONVERSATION_BASE}/api/conversation/${conversationId}/transition/bot`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
      credentials: "include",
    }
  );
  if (!res.ok) throw new Error(`Falha ao retornar conversa ao bot: ${res.status}`);
  return res.json();
}

