# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-08-28

### Added
- Fase 1 (Core): Integração WhatsApp (webhook + processamento), tela de Conversas integrada ao backend
- OpenAPI (api/openapi.yaml) e catálogo de erros (RFC7807)
- Serviço de frontend `conversationService` e integração em `src/pages/Conversations.tsx`
- Fase 2 (Segurança): Supabase Auth, `ProtectedRoute`, `ProfileRestriction`, RBAC aplicado no menu e rotas
- Fase 3 (Calendar): Iframe do Google Calendar em `src/pages/Calendar.tsx` e `calendarSyncService`
- Fase 4 (CRUDs): Integrações reais de `Clinics.tsx` e `Users.tsx` com serviços REST
- Fase 5 (Observabilidade/Testes): HTTP wrapper com `x-correlation-id`; Vitest configurado; teste básico de http

### Changed
- `docker-compose.yml`: remoção do AuthService e ajuste de mount do HAProxy para `backend/haproxy/haproxy.cfg`
- `monitoring/prometheus.yml` e `backend/haproxy/haproxy.cfg`: remoção de referências ao AuthService
- `src/hooks/useAuth.tsx`: refatorado para usar Supabase Auth e roles via metadata
- `src/components/AppSidebar.tsx` e `src/components/Layout.tsx`: RBAC e visibilidade de combobox por perfil

### Fixed
- Build do frontend com dependência ausente `@radix-ui/react-tooltip`
- Test runner (Vitest) com `jsdom` instalado e teste de http executando
- Lint verde (apenas warnings de fast-refresh em componentes UI)

### Removed
- Serviço `auth-service` como fonte de autenticação (unificado em Supabase Auth)

---

Tag sugerida: `v1.2.0`