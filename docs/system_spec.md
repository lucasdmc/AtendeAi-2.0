# System Specification - AtendeAí 2.0 (MVP Focus)

Status: Draft (MVP) | Owner: context_manager | Quality Profile: v1.0

1. Objetivo do MVP
- Garantir a conversação com o chatbot integrada ao backend existente
- Habilitar contextualização via JSON por clínica (CRUD e cache)
- Manter UI atual (sem mudanças visuais), adicionando SDKs/hooks mínimos

2. Estado atual validado (código)
- Frontend
  - `Auth.tsx` usa Supabase Auth (login/cadastro/session listener)
  - `useAuth.tsx` usa `authService` (JWT custom) para `Layout` e rotas → conflito de auth
  - `Conversations.tsx` exibe dados mockados; não consome backend
  - `Context.tsx` exibe JSON mock; sem persistência
- Backend
  - Microserviços Node/Express (auth, clinic, appointment, conversation, whatsapp, google-calendar)
  - `clinic-service` expõe rotas de contextualização JSON
  - `whatsapp-service` expõe endpoints de envio de mensagens WhatsApp

3. Escopo MVP desta fase
- Criar SDK FE:
  - `src/sdk/context.ts`: get/update contextualização consumindo `clinic-service`
  - `src/sdk/whatsapp.ts`: enviar mensagem de texto via `whatsapp-service`
- Documentação de integração (`docs/frontend_integration.md`)
- Sem alterações de UI nesta etapa; wire-up pode ser ativado depois

4. Requisitos funcionais do MVP
- RF-CTX-01: Ler contextualização JSON da clínica atual
- RF-CTX-02: Atualizar contextualização JSON (validação server-side)
- RF-WA-01: Enviar mensagens de texto pelo WhatsApp Service
- RF-AUTH-OBS: Registrar conflito atual (Supabase vs JWT); unificação futura

5. Critérios de aceitação
- SDKs disponíveis e utilizáveis pelas telas sem breaking changes
- Documentação com exemplos de uso (código) e endpoints
- Build do frontend verde

6. Riscos e próximos passos
- Conflito de autenticação: unificar para Supabase ou bridge tokens
- Conversas: mapear listagem/histórico (conversation-service) em próxima iteração

7. Fases de Desenvolvimento (Planejamento)

- Fase 1 (MVP Core):
  - Itens:
    - Conexão com WhatsApp (envio texto via whatsapp-service)
    - Chatbot funcional consumindo contextualização por clínica (via clinic-service)
    - Contextualização JSON (CRUD)
    - Integração FE↔BE via SDKs mínimos
  - Entregáveis:
    - `src/sdk/whatsapp.ts`, `src/sdk/context.ts`
    - `docs/frontend_integration.md`
  - Critérios de Aceitação:
    - RF-CTX-01/02 e RF-WA-01 atendidos
    - Build/lint/typecheck verdes

- Fase 2: Autenticação Unificada
  - Itens: migrar `useAuth` para Supabase (ou bridge), proteger rotas, RBAC, remover `authService` custom
  - Entregáveis: contexto de Auth único, rotas protegidas, documentação
  - Critérios: login/logout/refresh funcionais; roles respeitadas no FE

- Fase 3: Conversas Reais
  - Itens: listagem/histórico/status via conversation-service; persistir modo manual/automático
  - Entregáveis: serviços/SDK e integração na tela; doc
  - Critérios: carregamento real de conversas e troca de mensagens persistidas

- Fase 4: Combobox de Clínicas e Multi-tenant
  - Itens: combobox dinâmico por perfil; persistência da seleção; isolamento por clínica
  - Entregáveis: integração com clinic-service; políticas de exibição por role
  - Critérios: RBAC em combobox; alteração de contexto efetiva

- Fase 5: Google Calendar
  - Itens: OAuth + iframe embed + sincronização de eventos
  - Entregáveis: integração e doc
  - Critérios: calendário visível; sync básico ok

- Fase 6: Qualidade e Observabilidade
  - Itens: testes (unit/integration/smoke FE), métricas leves, auditoria deps
  - Entregáveis: `reports/coverage.xml` (meta a definir), configuração CI local
  - Critérios: testes verdes; alertas básicos operacionais

