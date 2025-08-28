# System Specification (MVP) - AtendeAI 2.0

Status: draft
Owner: context_manager
Mode: MVP

1. Scope
- Goal: Conversação no WhatsApp com chatbot, com opção de assumir conversa por humano e contextualização por clínica.
- Out-of-scope (MVP): bots avançados com múltiplos canais; relatórios avançados; billing.

2. Core User Stories
- Como Admin Lify, quero configurar o webhook do WhatsApp e validar health do serviço para operar conversas.
- Como Atendente, quero visualizar conversas e alternar entre chatbot/humano por conversa.
- Como Sistema, quero processar mensagens recebidas do WhatsApp e registrar no Conversation Service.

3. Architecture Overview
- Frontend (React + TS, Vite) na porta 8080.
- Microserviços Node/Express: whatsapp-service (3007), conversation-service (3005), clinic-service (3003).
- Supabase Postgres (remoto) como DB; Redis para cache/filas.
- Gateway: Kong; LB: HAProxy; Observabilidade: Prometheus + Grafana.

4. MVP Functional Requirements
- RF1 Auth básica via Supabase (login/logout, proteção mínima de rotas no frontend).
- RF2 Conversas WhatsApp: receber mensagens via webhook, listar no frontend, enviar mensagens de texto.
- RF3 Alternância chatbot/humano por conversa (endpoints transition human/bot já existentes).
- RF4 Contextualização por clínica (usar clinic_id em todas as operações e restringir listas).

5. Non-Functional Requirements
- Segurança: sem segredos no repositório; variáveis via .env; CORS restrito para 8080 em desenvolvimento.
- Observabilidade: health endpoints expostos; targets Prometheus vivos.
- Desempenho: resposta de UI < 500ms p95 com dados locais.

6. API Contracts (resumo)
- WhatsApp Service
  - GET /api/whatsapp/health
  - POST /api/whatsapp/webhook
  - POST /api/whatsapp/send/text {clinic_id, patient_phone, message}
- Conversation Service
  - POST /api/conversation/process {clinic_id, patient_phone, message_content}
  - POST /api/conversation/:conversation_id/transition/human {attendant_id}
  - POST /api/conversation/:conversation_id/transition/bot

7. Data
- Identificadores: UUID v4 para clinic_id, conversation_id.
- Tópicos de privacidade: mascarar PII em logs (telefone do paciente).

8. Risks
- Duplicidade de diretórios (services vs backend/services) gerando confusão de compose.
- Chaves sensíveis hardcoded em arquivos de exemplo.

9. Definition of Done (MVP)
- Frontend em 8080 protegido por login mínimo; rota /conversations consumindo APIs reais.
- Webhook do WhatsApp funcional, mensagens entrando no Conversation Service.
- Botões de Assumir ON/OFF operacionais acionando endpoints de transition.
- Documentação atualizada em docs/ e ledger em reports/.

10. Rollout
- Usar docker-compose.improved.yml como canonical para backends (contexts em backend/services).
- Preservar docker-compose.yml até migração completa.