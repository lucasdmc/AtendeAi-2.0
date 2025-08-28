import { z } from "zod";

const VITE_WHATSAPP_BASE = import.meta.env.VITE_WHATSAPP_BASE || "http://localhost:3007";

const SendTextSchema = z.object({
  clinic_id: z.string().uuid(),
  patient_phone: z.string().min(8),
  message: z.string().min(1).max(4096),
  conversation_id: z.string().uuid().optional(),
});

export type SendTextPayload = z.infer<typeof SendTextSchema>;

export async function sendTextMessage(payload: SendTextPayload) {
  const data = SendTextSchema.parse(payload);
  const res = await fetch(`${VITE_WHATSAPP_BASE}/api/whatsapp/send/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Falha ao enviar mensagem: ${res.status}`);
  return res.json();
}

