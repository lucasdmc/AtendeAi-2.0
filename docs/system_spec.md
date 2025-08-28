# System Specification - AtendeAI 2.0 (MVP)

---

## Objective
Deliver a secure, multi-tenant clinic assistant with unified authentication (Supabase), WhatsApp chatbot integrated per clinic, and frontend↔backend integration.

## Scope (MVP mode)
- Auth: Supabase Auth only. No custom AuthService.
- Core: WhatsApp integration (Meta Webhooks + sending), chatbot engine with clinic context, store and retrieve conversation state per clinic/user.
- Backend: Node.js microservices already present (clinic, conversation, appointment, whatsapp, google-calendar, health).
- Frontend: React + TS, protected routes, role-aware UI, conversations UI integrated to WhatsApp backend.
- Observability: Prometheus + Grafana minimal.

## Architecture
- API Gateway: Kong (DB-less) in front of services.
- Load Balancer: HAProxy for external ingress when needed.
- Cache: Redis for rate-limit, sessions, bot context.
- Database: Supabase PostgreSQL with RLS and per-clinic isolation.

## Security
- Supabase JWT for user session; propagate `user_id`, `clinic_id`, and `roles` via headers/claims.
- No secrets committed. All tokens/keys via environment variables.
- Input validation on all inbound endpoints; structured logging with `correlation_id`.

## Data model (high-level)
- clinics(id, name, whatsapp_number_id, meta_webhook_url, config_json)
- users(id, email, role, clinic_id)
- conversations(id, clinic_id, user_id, wa_contact_id, status, mode, last_message_at)
- messages(id, conversation_id, direction, type, payload_json, status, created_at)

## MVP Definition of Done
- Auth routes protected in frontend; unauthenticated redirect to `/auth`.
- Conversations page lists WhatsApp conversations from backend and streams messages.
- Toggle chatbot mode per conversation (ASSUME ON/OFF) reflected in backend state.
- Clinic context applied to chatbot prompts and flows.
- All compose and monitoring free of AuthService references.

## Integrations
- WhatsApp: Webhook endpoint `POST /webhook/whatsapp` in `whatsapp-service` with signature verification; sending via Meta Graph API.
- Google Calendar: OAuth and iframe embed present; appointments pull when integrated.

## Non-functional (MVP)
- Latency p95 < 500ms for chat actions.
- Error rate < 2% on chat endpoints under light load.

## Open Questions (post-MVP)
- Bot fallback rules per clinic.
- Conversation assignment flows for attendants.