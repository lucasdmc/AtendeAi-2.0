# 🏗️ ARCHITECTURE - ATENDEAI 2.0

---

## 🎯 **VISÃO GERAL DA ARQUITETURA**

O AtendeAI 2.0 é um sistema de **microserviços distribuídos** projetado para alta disponibilidade, escalabilidade e manutenibilidade. A arquitetura segue princípios de **Domain-Driven Design (DDD)** com isolamento completo entre clínicas.

---

## 🏛️ **ARQUITETURA GERAL**

### **Diagrama de Alto Nível**
```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│   React App     │   WhatsApp      │   Mobile App    │  Admin  │
│   (Port 8080)   │   Business API  │   (Future)      │  Panel  │
└─────────────────┴─────────────────┴─────────────────┴─────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GATEWAY LAYER                               │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│   HAProxy       │   Kong Gateway  │   Rate Limiter  │  CORS   │
│   (Load Bal.)   │   (API Gateway) │   (Global)      │  (API)  │
└─────────────────┴─────────────────┴─────────────────┴─────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MICROSERVICES LAYER                          │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│  Auth Service   │  User Service   │  Clinic Service │  ...   │
│  (Port 3001)    │  (Port 3002)    │  (Port 3003)    │        │
├─────────────────┼─────────────────┼─────────────────┼─────────┤
│ Conversation    │ Appointment     │ WhatsApp        │ Google  │
│ Service         │ Service         │ Service         │ Calendar│
│ (Port 3005)     │ (Port 3006)     │ (Port 3007)     │ (3008)  │
└─────────────────┴─────────────────┴─────────────────┴─────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                          │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│   PostgreSQL    │     Redis       │   Monitoring    │ Logging │
│   (Database)    │    (Cache)      │ (Prometheus)    │ (ELK)   │
└─────────────────┴─────────────────┴─────────────────┴─────────┘
```

---

## 🔐 **AUTH SERVICE (Porta 3001)**

### **Responsabilidades**
- Autenticação JWT com refresh tokens
- Autorização baseada em roles (RBAC)
- Gestão de sessões e tokens
- Auditoria de ações de usuário

### **Endpoints Principais**
```
POST   /api/auth/login          # Login de usuário
POST   /api/auth/refresh        # Renovar token
POST   /api/auth/logout         # Logout
POST   /api/auth/register       # Registro de usuário
GET    /api/auth/profile        # Perfil do usuário
PUT    /api/auth/profile        # Atualizar perfil
POST   /api/auth/forgot-password # Recuperar senha
POST   /api/auth/reset-password  # Resetar senha
```

### **Modelos de Dados**
```sql
-- Usuários
users (
  id, clinic_id, name, email, password_hash, 
  role, status, last_login, created_at, updated_at
)

-- Sessões
sessions (
  id, user_id, clinic_id, token_hash, 
  refresh_token_hash, expires_at, created_at
)

-- Auditoria
audit_logs (
  id, clinic_id, user_id, action, table_name, 
  record_id, old_values, new_values, ip_address, user_agent
)
```

---

## 👥 **USER SERVICE (Porta 3002)**

### **Responsabilidades**
- Gestão de usuários por clínica
- Perfis e preferências
- Histórico de atividades
- Gestão de permissões

### **Endpoints Principais**
```
GET    /api/users               # Listar usuários
POST   /api/users               # Criar usuário
GET    /api/users/:id           # Buscar usuário
PUT    /api/users/:id           # Atualizar usuário
DELETE /api/users/:id           # Deletar usuário
GET    /api/users/:id/activity  # Histórico de atividades
PUT    /api/users/:id/status    # Alterar status
```

---

## 🏥 **CLINIC SERVICE (Porta 3003)**

### **Responsabilidades**
- Gestão de clínicas multi-tenant
- Configurações por clínica
- Sistema de contextualização JSON
- Horários de funcionamento
- Políticas de agendamento

### **Endpoints Principais**
```
GET    /api/clinics                    # Listar clínicas
POST   /api/clinics                    # Criar clínica
GET    /api/clinics/:id                # Buscar clínica
PUT    /api/clinics/:id                # Atualizar clínica
DELETE /api/clinics/:id                # Deletar clínica
GET    /api/clinics/:id/context       # Contextualização
PUT    /api/clinics/:id/context       # Atualizar contexto
GET    /api/clinics/:id/working-hours # Horários
PUT    /api/clinics/:id/working-hours # Atualizar horários
```

### **Sistema de Contextualização**
```json
{
  "clinic_id": "uuid",
  "ai_personality": {
    "name": "Dr. AtendeAI",
    "tone": "professional_friendly",
    "formality_level": "medium",
    "languages": ["pt-BR", "en"],
    "greeting": "Olá! Sou o assistente virtual da clínica.",
    "farewell": "Obrigado por escolher nossa clínica!"
  },
  "ai_behavior": {
    "proactivity": true,
    "suggestions": true,
    "feedback": true,
    "auto_escalation": true,
    "escalation_threshold": 3
  },
  "working_hours": {
    "monday": [
      {"start": "08:00", "end": "12:00"},
      {"start": "14:00", "end": "18:00"}
    ],
    "tuesday": [
      {"start": "08:00", "end": "12:00"},
      {"start": "14:00", "end": "18:00"}
    ]
  },
  "scheduling_policies": {
    "min_advance_hours": 24,
    "max_advance_days": 30,
    "slot_duration_minutes": 60,
    "max_daily_appointments": 50
  }
}
```

---

## 💬 **CONVERSATION SERVICE (Porta 3005)**

### **Responsabilidades**
- Processamento de mensagens WhatsApp
- Detecção de intenções com IA
- Memória conversacional
- Roteamento inteligente
- Humanização de respostas

### **Endpoints Principais**
```
POST   /api/conversation/process     # Processar mensagem
GET    /api/conversation/:id         # Buscar conversa
GET    /api/conversation/:id/history # Histórico
POST   /api/conversation/:id/message # Enviar mensagem
PUT    /api/conversation/:id/status  # Alterar status
GET    /api/conversation/active      # Conversas ativas
```

### **Fluxo de Processamento**
```
1. Receber mensagem WhatsApp
2. Extrair contexto da clínica
3. Detectar intenção com IA
4. Aplicar personalidade da clínica
5. Rotear para serviço apropriado
6. Gerar resposta humanizada
7. Enviar via WhatsApp
8. Atualizar memória conversacional
```

### **Modelos de Dados**
```sql
-- Conversas
conversations (
  id, clinic_id, whatsapp_number, user_name, 
  status, context, last_message_at, created_at, updated_at
)

-- Mensagens
messages (
  id, conversation_id, clinic_id, message_type, 
  content, metadata, processed, intent_detected, 
  confidence_score, created_at
)

-- Memória conversacional
conversation_memory (
  id, conversation_id, clinic_id, memory_key, 
  memory_value, expires_at, created_at
)
```

---

## 📅 **APPOINTMENT SERVICE (Porta 3006)**

### **Responsabilidades**
- Gestão de fluxo de agendamento
- Máquina de estados
- Integração com Google Calendar
- Validações de negócio
- Notificações automáticas

### **Máquina de Estados**
```
ESTADO 1: INÍCIO
├── Receber solicitação de agendamento
├── Extrair informações básicas
└── Transição para ESTADO 2

ESTADO 2: SELEÇÃO DE SERVIÇO
├── Apresentar serviços disponíveis
├── Processar seleção do usuário
└── Transição para ESTADO 3

ESTADO 3: DATA E HORÁRIO
├── Verificar disponibilidade
├── Apresentar slots livres
└── Transição para ESTADO 4

ESTADO 4: CONFIRMAÇÃO
├── Resumir agendamento
├── Solicitar confirmação
└── Transição para ESTADO 5

ESTADO 5: FINALIZAÇÃO
├── Criar agendamento
├── Integrar com Google Calendar
└── Enviar confirmação
```

### **Endpoints Principais**
```
POST   /api/appointment/flow          # Iniciar fluxo
PUT    /api/appointment/flow/:id      # Atualizar fluxo
GET    /api/appointment/flow/:id      # Status do fluxo
POST   /api/appointment               # Criar agendamento
GET    /api/appointment/:id           # Buscar agendamento
PUT    /api/appointment/:id           # Atualizar agendamento
DELETE /api/appointment/:id           # Cancelar agendamento
GET    /api/appointment/available     # Slots disponíveis
```

### **Modelos de Dados**
```sql
-- Serviços
services (
  id, clinic_id, name, description, duration_minutes, 
  price, category, status, google_calendar_id
)

-- Profissionais
professionals (
  id, clinic_id, name, crm, specialties, email, 
  phone, status, accepts_new_patients, default_duration_minutes
)

-- Agendamentos
appointments (
  id, clinic_id, conversation_id, service_id, 
  professional_id, patient_name, patient_phone, 
  appointment_date, start_time, end_time, status, 
  notes, google_calendar_event_id
)

-- Fluxo de agendamento
appointment_flow (
  id, clinic_id, conversation_id, current_state, 
  flow_data, created_at, updated_at
)
```

---

## 📱 **WHATSAPP SERVICE (Porta 3007)**

### **Responsabilidades**
- Integração com WhatsApp Business API
- Recebimento de webhooks
- Envio de mensagens
- Gestão de mídia
- Status de entrega

### **Endpoints Principais**
```
POST   /webhook/whatsapp              # Webhook do WhatsApp
POST   /api/whatsapp/send             # Enviar mensagem
GET    /api/whatsapp/message/:id      # Status da mensagem
GET    /api/whatsapp/webhooks         # Listar webhooks
POST   /api/whatsapp/webhooks         # Criar webhook
PUT    /api/whatsapp/webhooks/:id     # Atualizar webhook
```

### **Tipos de Mensagem Suportados**
- **Texto**: Mensagens simples
- **Imagem**: Fotos e imagens
- **Áudio**: Mensagens de voz
- **Vídeo**: Vídeos curtos
- **Documento**: PDFs e arquivos
- **Localização**: Coordenadas GPS

---

## 📅 **GOOGLE CALENDAR SERVICE (Porta 3008)**

### **Responsabilidades**
- Integração com Google Calendar API
- Sincronização bidirecional
- Mapeamento de calendários
- Gestão de eventos
- Notificações automáticas

### **Endpoints Principais**
```
POST   /api/google-calendar/events    # Criar evento
GET    /api/google-calendar/events    # Listar eventos
PUT    /api/google-calendar/events/:id # Atualizar evento
DELETE /api/google-calendar/events/:id # Deletar evento
GET    /api/google-calendar/calendars  # Listar calendários
POST   /api/google-calendar/sync      # Sincronizar
```

---

## 🗄️ **ARQUITETURA DE DADOS**

### **Princípios de Design**
1. **Multi-tenancy**: Isolamento completo por clínica
2. **Row Level Security (RLS)**: Controle de acesso no banco
3. **Particionamento**: Performance para grandes volumes
4. **Normalização**: Estrutura 3NF para integridade
5. **Índices**: Otimização para consultas frequentes

### **Schema de Banco**
```
atendeai/           # Schema principal
├── clinics         # Clínicas
├── users           # Usuários
├── sessions        # Sessões
└── audit_logs      # Auditoria

conversation/       # Sistema de conversação
├── conversations   # Conversas
├── messages        # Mensagens
└── conversation_memory # Memória

appointment/        # Sistema de agendamento
├── services        # Serviços
├── professionals   # Profissionais
├── appointments    # Agendamentos
└── appointment_flow # Fluxo

clinic/             # Configurações de clínica
├── clinic_configurations # Configurações
├── contextualization     # Contextualização
├── working_hours         # Horários
└── scheduling_policies   # Políticas

whatsapp/           # Integração WhatsApp
├── messages        # Mensagens
├── webhooks        # Webhooks
└── configurations  # Configurações

google_calendar/    # Integração Google
├── calendar_events # Eventos
├── calendar_mappings # Mapeamentos
└── google_configurations # Configurações
```

---

## 🔒 **SEGURANÇA E AUTORIZAÇÃO**

### **Autenticação**
- **JWT**: Tokens de acesso com expiração
- **Refresh Tokens**: Renovação automática
- **Bcrypt**: Hash seguro de senhas
- **Rate Limiting**: Proteção contra ataques

### **Autorização**
- **RBAC**: Controle baseado em roles
- **Multi-tenancy**: Isolamento por clínica
- **RLS**: Segurança no nível do banco
- **Auditoria**: Log de todas as ações

### **Proteções**
- **CORS**: Configuração adequada
- **Input Validation**: Validação de entrada
- **SQL Injection**: Prepared statements
- **XSS**: Sanitização de dados

---

## 📊 **MONITORAMENTO E OBSERVABILIDADE**

### **Métricas**
- **Prometheus**: Coleta de métricas
- **Grafana**: Visualização e dashboards
- **Custom Metrics**: Métricas de negócio
- **Health Checks**: Status dos serviços

### **Logs**
- **Structured Logging**: JSON formatado
- **Correlation IDs**: Rastreamento de requisições
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Centralized Logging**: Agregação central

### **Tracing**
- **Request Tracing**: Rastreamento de requisições
- **Performance Monitoring**: Tempo de resposta
- **Dependency Mapping**: Mapeamento de dependências
- **Error Tracking**: Rastreamento de erros

---

## 🚀 **ESCALABILIDADE E PERFORMANCE**

### **Estratégias de Escala**
1. **Horizontal**: Múltiplas instâncias dos serviços
2. **Vertical**: Aumentar recursos dos containers
3. **Database**: Read replicas e sharding
4. **Cache**: Redis cluster distribuído

### **Otimizações**
- **Connection Pooling**: Pool de conexões
- **Query Optimization**: Índices e consultas otimizadas
- **Caching Strategy**: Cache em múltiplas camadas
- **Async Processing**: Processamento assíncrono

### **Performance Targets**
- **Response Time**: < 200ms para 95% das requisições
- **Throughput**: 1000+ usuários simultâneos
- **Uptime**: > 99.9%
- **Recovery Time**: < 2 minutos

---

## 🔄 **DEPLOYMENT E DEVOPS**

### **Containerização**
- **Docker**: Containers para todos os serviços
- **Docker Compose**: Orquestração local
- **Multi-stage Builds**: Otimização de imagens
- **Health Checks**: Verificação de saúde

### **Orquestração**
- **Kubernetes**: Para produção (futuro)
- **Service Discovery**: Descoberta automática
- **Load Balancing**: Distribuição de carga
- **Auto-scaling**: Escala automática

### **CI/CD**
- **Automated Testing**: Testes automatizados
- **Code Quality**: Análise estática
- **Security Scanning**: Verificação de segurança
- **Deployment Pipeline**: Pipeline de deploy

---

## 🎯 **ROADMAP TÉCNICO**

### **Fase 1: Fundação** ✅ COMPLETA
- Infraestrutura Docker
- Banco de dados PostgreSQL
- Sistema de autenticação
- Monitoramento básico

### **Fase 2: Serviços Core** 🔄 EM ANDAMENTO
- Clinic Service
- Conversation Service
- Appointment Service
- User Service

### **Fase 3: Integrações** 📋 PLANEJADO
- WhatsApp Business API
- Google Calendar
- Sistema de notificações
- Webhooks externos

### **Fase 4: Avançado** 🔮 FUTURO
- Machine Learning
- Analytics avançados
- Mobile apps
- API pública

---

## 🎉 **CONCLUSÃO**

A arquitetura do AtendeAI 2.0 foi projetada para:

- ✅ **Alta Disponibilidade**: Sistema resiliente e confiável
- ✅ **Escalabilidade**: Crescimento horizontal e vertical
- ✅ **Manutenibilidade**: Código limpo e bem estruturado
- ✅ **Segurança**: Proteções em múltiplas camadas
- ✅ **Observabilidade**: Monitoramento completo
- ✅ **Performance**: Otimizações em todas as camadas

---

**Status**: 🟢 ARQUITETURA COMPLETA  
**Última atualização**: 2024-01-15  
**Versão**: 1.0.0  
**Próxima revisão**: Após implementação dos serviços core
