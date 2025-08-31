---
title: System Specification - AtendeAI 2.0
version: 1.2.0
mode: incremental
scope: "Sistema multiclínicas completo com IA conversacional, agendamentos inteligentes, integração WhatsApp Business e Google Calendar"
out_of_scope: "Sistemas de prontuário eletrônico, faturamento/cobrança, telemedicina, integração com equipamentos médicos"
tech_stack_file: ".tech_stack.yaml"
---

# 1. Overview

## Elevator Pitch
AtendeAI 2.0 é um sistema multiclínicas que automatiza o atendimento médico através de IA conversacional via WhatsApp, com agendamentos inteligentes integrados ao Google Calendar. Substitui atendimento humano por automações efetivas, potencializando o trabalho de clínicas médicas com experiência "WhatsApp first".

## High-Level Goals
- **G001**: Substituir atendimento humano por automações com experiência humana efetiva
- **G002**: Automatizar ações manuais repetitivas, potencializando trabalho de atendimento
- **G003**: Criar sistema multiclínicas escalável e efetivo
- **G004**: Proporcionar experiência completa e funcional via WhatsApp

# 2. Domain Model

## Core Entities

### Clinic (Clínica)
- **id**: UUID único
- **name**: Nome da clínica
- **whatsapp_number**: Número WhatsApp Business
- **meta_webhook_url**: URL webhook Meta
- **whatsapp_id**: ID WhatsApp Business
- **context_json**: JSON de contextualização completo
- **simulation_mode**: Toggle simulação ativo/inativo
- **status**: active | inactive
- **created_at, updated_at**: Timestamps auditoria

### User (Usuário)
- **id**: UUID único
- **name**: Nome completo (máx 30 chars)
- **login**: Login acesso (máx 25 chars)
- **password_hash**: Senha hasheada (máx 25 chars original)
- **role**: admin_lify | suporte_lify | atendente | gestor | administrador
- **clinic_id**: Referência à clínica
- **status**: active | inactive
- **created_at, updated_at**: Timestamps auditoria

### Conversation (Conversa)
- **id**: UUID único
- **clinic_id**: Referência à clínica
- **customer_phone**: Telefone do cliente
- **conversation_type**: chatbot | human | mixed
- **status**: active | paused | closed
- **bot_active**: Boolean controle chatbot
- **assigned_user_id**: Usuário que assumiu conversa
- **tags**: Array de etiquetas
- **created_at, updated_at**: Timestamps

### Message (Mensagem)
- **id**: UUID único
- **conversation_id**: Referência à conversa
- **sender_type**: customer | bot | human
- **content**: Conteúdo da mensagem
- **message_type**: text | image | audio | video | document
- **whatsapp_message_id**: ID original WhatsApp
- **timestamp**: Timestamp da mensagem

### Appointment (Agendamento)
- **id**: UUID único
- **clinic_id**: Referência à clínica
- **customer_info**: Dados do cliente
- **google_event_id**: ID evento Google Calendar
- **appointment_type**: Tipo conforme JSON contextualização
- **datetime**: Data/hora agendamento
- **duration**: Duração em minutos
- **status**: scheduled | confirmed | cancelled | completed
- **priority**: Nível prioridade
- **confirmation_sent**: Boolean confirmação enviada
- **confirmation_received**: Boolean confirmação recebida

### GoogleIntegration (Integração Google)
- **id**: UUID único
- **clinic_id**: Referência à clínica
- **access_token**: Token OAuth criptografado
- **refresh_token**: Refresh token criptografado
- **calendar_id**: ID calendário Google
- **expires_at**: Expiração token
- **status**: active | expired | revoked

# 3. API Surface (high-level)

## Core Endpoints

### Authentication
- `POST /auth/login` - Login usuário (email, password)
- `POST /auth/logout` - Logout usuário
- `POST /auth/refresh` - Refresh token
- `GET /auth/profile` - Dados perfil usuário

### Clinics Management
- `GET /clinics` - Listar clínicas (Admin Lify/Suporte only)
- `POST /clinics` - Criar clínica (Admin Lify only)
- `PUT /clinics/:id` - Editar clínica (Admin Lify only)
- `DELETE /clinics/:id` - Remover clínica (Admin Lify only)
- `GET /clinics/:id/context` - Relatório contextualização

### Users Management
- `GET /users` - Listar usuários da clínica
- `POST /users` - Criar usuário
- `PUT /users/:id` - Editar usuário
- `DELETE /users/:id` - Remover usuário

### Conversations
- `GET /conversations` - Listar conversas da clínica
- `GET /conversations/:id/messages` - Mensagens da conversa
- `POST /conversations/:id/messages` - Enviar mensagem
- `PUT /conversations/:id/bot-control` - Controlar chatbot ON/OFF
- `PUT /conversations/:id/tags` - Gerenciar etiquetas
- `POST /conversations/broadcast` - Mensagem em massa

### Appointments & Calendar
- `GET /appointments` - Listar agendamentos
- `POST /appointments` - Criar agendamento
- `PUT /appointments/:id` - Editar agendamento
- `DELETE /appointments/:id` - Cancelar agendamento
- `POST /google/auth` - Autenticação OAuth Google
- `GET /google/calendars` - Listar calendários integrados
- `GET /google/events` - Eventos do calendário

### Dashboard & Metrics
- `GET /dashboard/metrics` - Métricas dashboard
- `GET /dashboard/conversations-stats` - Estatísticas conversas
- `GET /dashboard/appointments-stats` - Estatísticas agendamentos

### WhatsApp Integration
- `POST /whatsapp/webhook` - Webhook Meta WhatsApp
- `GET /whatsapp/conversations` - Conversas WhatsApp
- `POST /whatsapp/send-message` - Enviar mensagem WhatsApp

**Auth Required**: Todos endpoints exceto webhook WhatsApp
**RLS Applied**: Todos endpoints respeitam isolamento por clínica

# 4. Database (high-level)

## Core Tables

### atendeai schema
- **clinics**: Dados clínicas, contexto JSON, configurações
- **users**: Usuários sistema, roles, referência clínica
- **audit_logs**: Logs auditoria, mudanças sistema

### conversation schema  
- **conversations**: Conversas WhatsApp, status, atribuições
- **messages**: Mensagens individuais, tipos, conteúdo
- **conversation_tags**: Sistema etiquetas, classificação

### appointment schema
- **appointments**: Agendamentos, integração Google Calendar
- **appointment_types**: Tipos agendamento por clínica
- **google_integrations**: Tokens OAuth, calendários integrados

### whatsapp schema
- **webhook_events**: Eventos webhook Meta
- **message_processing_logs**: Logs processamento mensagens
- **conversation_sessions**: Sessões conversa ativas

**RLS**: Todas tabelas implementam Row Level Security para isolamento clínicas
**Indexes**: Índices otimizados para queries por clinic_id
**Triggers**: Auditoria automática mudanças críticas

# 5. Non-Functional Requirements

## Performance (RNF01)
- **Latency**: Páginas principais carregam em ≤ 3 segundos
- **Search**: Operações busca retornam em ≤ 2 segundos  
- **Concurrency**: Suporte mínimo 100 usuários simultâneos
- **API Response**: APIs respondem em ≤ 500ms (95th percentile)

## Security (RNF02)
- **Passwords**: Senhas salvas com hash bcrypt
- **Sessions**: Expiram após 2 horas inatividade
- **RLS**: Isolamento completo entre clínicas
- **Auth**: JWT tokens com refresh automático
- **HTTPS**: Toda comunicação criptografada

## Usability (RNF03)
- **Browsers**: Chrome, Safari, Firefox, Brave, Opera, Edge
- **Responsive**: Desktop, tablets, mobile
- **Interface**: Familiar (WhatsApp Web like)
- **Accessibility**: WCAG 2.1 AA compliance

## Maintainability (RNF05)
- **Documentation**: Código documentado, APIs OpenAPI
- **Logs**: Debug logs estruturados
- **Monitoring**: Prometheus + Grafana
- **Testing**: Cobertura ≥ 80%

## Scalability
- **Architecture**: Microserviços horizontalmente escaláveis
- **Database**: PostgreSQL com read replicas
- **Cache**: Redis para sessões e dados frequentes
- **Load Balancing**: HAProxy para distribuição carga

# 6. Acceptance Criteria

## R-001: CRUD Clínicas (RF01)
**Como** Admin Lify  
**Quero** criar, editar, visualizar e remover clínicas  
**Para** gerenciar múltiplas clínicas no sistema

**Critérios**:
- [ ] R-001.1: Criar clínica com campos obrigatórios (nome, WhatsApp, JSON contextualização)
- [ ] R-001.2: Listar todas clínicas com filtros
- [ ] R-001.3: Editar dados clínica incluindo JSON contextualização
- [ ] R-001.4: Remover clínica com confirmação
- [ ] R-001.5: Combobox seleção clínicas para Admin Lify/Suporte
- [ ] R-001.6: Toggle simulação configurável por clínica

## R-002: Contextualização Clínicas (RF02)
**Como** usuário configurador  
**Quero** chatbot absorva contextos JSON  
**Para** respostas personalizadas por clínica

**Critérios**:
- [ ] R-002.1: Chatbot respeita configurações JSON contextualização
- [ ] R-002.2: Chatbot não inventa informações fora do JSON
- [ ] R-002.3: Respostas consistentes independente temperatura/personalidade
- [ ] R-002.4: Validação JSON contextualização na entrada

## R-003: Simulação Conversas (RF03)
**Como** configurador clínicas  
**Quero** toggle simulação respostas  
**Para** homologar configurações sem envio real

**Critérios**:
- [ ] R-003.1: Toggle ON: conversas simuladas sem envio WhatsApp
- [ ] R-003.2: Toggle OFF: conversas reais enviadas WhatsApp
- [ ] R-003.3: Interface clara indicando modo simulação
- [ ] R-003.4: Configuração persistida por clínica

## R-004: CRUD Usuários (RF04)
**Como** usuário com permissão  
**Quero** gerenciar usuários sistema  
**Para** controlar acesso e perfis

**Critérios**:
- [ ] R-004.1: Criar usuário com campos obrigatórios
- [ ] R-004.2: Configurar perfil e clínica usuário
- [ ] R-004.3: Editar dados usuário mantendo integridade
- [ ] R-004.4: Remover usuário com validações
- [ ] R-004.5: Senhas hasheadas (bcrypt)
- [ ] R-004.6: Isolamento usuários por clínica

## R-005: Tela Conversas (RF05)
**Como** atendente/recepcionista  
**Quero** visualizar todas interações WhatsApp  
**Para** gerenciar atendimento clínica

**Critérios**:
- [ ] R-005.1: Listar todas conversas clínica
- [ ] R-005.2: Indicador modo simulação ativo
- [ ] R-005.3: Assumir/devolver controle chatbot
- [ ] R-005.4: Enviar arquivos anexos
- [ ] R-005.5: Interface similar WhatsApp Web
- [ ] R-005.6: Sistema etiquetas conversas
- [ ] R-005.7: Envio mensagens padrão em massa

## R-006: Agendamentos Tela (RF06)
**Como** usuário sistema  
**Quero** visualizar Google Calendar integrado  
**Para** gerenciar agendamentos clínica

**Critérios**:
- [ ] R-006.1: Integração OAuth Google múltiplos calendários
- [ ] R-006.2: Embed Google Calendar mantendo features
- [ ] R-006.3: Performance navegação calendário
- [ ] R-006.4: Múltiplos calendários por clínica
- [ ] R-006.5: Tipos agendamento configuráveis via JSON

## R-007: Agendamento Chatbot (RF07)
**Como** cliente  
**Quero** agendar via WhatsApp  
**Para** marcar consulta facilmente

**Critérios**:
- [ ] R-007.1: Consultar espaços livres calendários integrados
- [ ] R-007.2: Coletar dados necessários cliente
- [ ] R-007.3: Criar evento Google Calendar automaticamente
- [ ] R-007.4: Sistema priorização eventos (cores/etiquetas)

## R-008: Priorização Agendamentos (RF08)
**Como** chatbot  
**Quero** reconhecer prioridades agendamentos  
**Para** realocar eventos conforme importância

**Critérios**:
- [ ] R-008.1: Sistema configuração prioridades tipos evento
- [ ] R-008.2: Lógica priorização eventos Google Calendar
- [ ] R-008.3: Realocação automática eventos menor prioridade
- [ ] R-008.4: Reconhecimento tipo consulta solicitada

## R-009: Confirmação Agendamentos (RF09)
**Como** chatbot  
**Quero** enviar confirmações agendamento  
**Para** garantir presença cliente

**Critérios**:
- [ ] R-009.1: Envio confirmação conforme JSON contextualização
- [ ] R-009.2: Flag/marcador sem resposta confirmação
- [ ] R-009.3: Marcação vermelha Google Calendar sem confirmação
- [ ] R-009.4: Configuração timing envio confirmação

## R-010: Tela Contextualização (RF10)
**Como** usuário com permissão  
**Quero** relatório configurações clínica  
**Para** visualizar contexto inserido via JSON

**Critérios**:
- [ ] R-010.1: Relatório executivo informações JSON
- [ ] R-010.2: Visualização estruturada configurações
- [ ] R-010.3: Acesso baseado permissões usuário

## R-011: Dashboard Métricas
**Como** usuário sistema  
**Quero** visualizar métricas operacionais  
**Para** acompanhar performance clínica

**Critérios**:
- [ ] R-011.1: Métricas conversas (novas, andamento, assumidas)
- [ ] R-011.2: Métricas agendamentos (hoje, semana, mês)
- [ ] R-011.3: Filtros período (últimos 3 meses max)
- [ ] R-011.4: Gráficos distribuição (etiquetas, tipos)
- [ ] R-011.5: Tempo médio resposta chatbot
- [ ] R-011.6: Taxa resolução automática

## R-012: Sistema Perfis Usuários
**Como** sistema  
**Quero** controlar acesso por perfil  
**Para** garantir segurança e permissões

**Critérios**:
- [ ] R-012.1: Admin Lify: acesso total sistema
- [ ] R-012.2: Suporte Lify: acesso total exceto criar clínicas
- [ ] R-012.3: Atendente: Dashboard, Conversas, Agendamentos
- [ ] R-012.4: Gestor: + Contextualização
- [ ] R-012.5: Administrador: + Gestão usuários
- [ ] R-012.6: Isolamento dados por clínica (exceto Admin/Suporte Lify)

# 7. Test Plan

## Unit Tests
- **Services**: Lógica negócio, validações, transformações
- **Components**: Componentes React isolados
- **Utilities**: Funções helper, formatação, validação
- **Coverage**: ≥ 80% linhas código

## Integration Tests  
- **API Endpoints**: Autenticação, autorização, dados
- **Database**: Operações CRUD, RLS, triggers
- **WhatsApp Integration**: Webhook processing, message flow
- **Google Calendar**: OAuth flow, event synchronization

## Contract Tests
- **Frontend-Backend**: APIs specs, request/response schemas
- **WhatsApp API**: Webhook contract validation
- **Google Calendar API**: Integration contract compliance

## E2E Tests
- **User Journeys**: Login → Dashboard → Conversas → Agendamentos
- **Multi-clinic**: Isolamento dados, troca clínicas (Admin Lify)
- **Chatbot Flow**: Simulação → Real mode → Assumir conversa
- **Calendar Integration**: OAuth → Embed → Agendamento via bot

## Performance Tests
- **Load**: 100 usuários simultâneos
- **Stress**: Degradação graceful alta carga
- **API Response**: ≤ 500ms (95th percentile)
- **Page Load**: ≤ 3 segundos páginas principais

## Security Tests
- **Authentication**: JWT validation, session expiry
- **Authorization**: RLS enforcement, role permissions
- **Input Validation**: SQL injection, XSS prevention
- **Data Isolation**: Multi-tenant security verification

# 8. Release Plan

## Version Strategy: SemVer (Major.Minor.Patch)

### v1.2.0 - Current Baseline (Sistema Funcional Completo)
- ✅ Microserviços backend implementados
- ✅ Supabase Auth integrado
- ✅ WhatsApp Business API funcional
- ✅ Google Calendar service disponível
- ✅ Frontend React + TypeScript base

### v1.3.0 - Sistema Multiclínicas Básico (Q1 2024)
- CRUD Clínicas funcional
- CRUD Usuários com perfis
- Sistema permissões por perfil
- Combobox seleção clínicas (Admin Lify)

### v1.4.0 - Conversas Avançadas (Q1 2024)
- Tela conversas WhatsApp integrada
- Controles chatbot ON/OFF
- Sistema etiquetas conversas
- Mensagens padrão e broadcast

### v1.5.0 - Agendamentos Inteligentes (Q2 2024)
- Integração OAuth Google Calendar completa
- Agendamento via chatbot funcional
- Sistema priorização automática
- Confirmações agendamento

### v1.6.0 - Contextualização e Simulação (Q2 2024)
- JSON contextualização implementado
- Modo simulação funcional
- Tela contextualização (relatórios)
- Validação configurações IA

### v1.7.0 - Dashboard e Métricas (Q3 2024)
- Dashboard métricas completo
- Gráficos distribuição
- Filtros período avançados
- Exportação relatórios

### v2.0.0 - Otimizações e Escalabilidade (Q4 2024)
- Performance otimizada
- Escalabilidade melhorada
- Features avançadas IA
- API pública para integrações

## Tagging Rules
- **Major**: Breaking changes, arquitetura
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, security updates

## Changelog Format
```markdown
## [X.Y.Z] - YYYY-MM-DD
### Added
- New features

### Changed  
- Existing functionality changes

### Fixed
- Bug fixes

### Security
- Security updates
```

# 9. Notes & Assumptions

Ver: [docs/assumptions.md](./assumptions.md)

**Status**: 📋 Especificação completa pronta para implementação  
**Mode**: incremental - expandindo sistema base funcional  
**Agent**: specification_agent  
**Date**: $(date +%Y-%m-%d)