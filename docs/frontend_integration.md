# Frontend Integration (MVP)

Status: MVP | Agent: frontend_integrator

- Telas com impacto: `Conversations.tsx` (conversas), `Context.tsx` (contextualização)
- SDKs gerados:
  - `src/sdk/context.ts`: leitura/atualização de contextualização
  - `src/sdk/whatsapp.ts`: envio de mensagens de texto

## Uso do Context SDK
```ts
import { contextSDK } from "@/sdk/context";

const ctx = await contextSDK.getContext(clinicId);
await contextSDK.updateContext(clinicId, { ai_personality: { tone: 'professional', language: 'pt-BR', empathy_level: 'high', formality_level: 'medium' } });
```

## Uso do WhatsApp SDK
```ts
import { whatsappSDK } from "@/sdk/whatsapp";

await whatsappSDK.sendText({
  patient_phone: "+5547999997777",
  message: "Olá! Como posso ajudar?",
  clinic_id: clinicId,
});
```

Notas:
- Autenticação: atualmente depende do `authService` (JWT). Unificação com Supabase em próxima etapa.
- Endpoints (local): clinic-service `:3003`, whatsapp-service `:3007`.