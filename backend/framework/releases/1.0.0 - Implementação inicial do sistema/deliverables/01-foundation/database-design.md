# 🗄️ DATABASE DESIGN - ATENDEAI 2.0

---

## 🎯 **VISÃO GERAL DO DESIGN**

O banco de dados do AtendeAI 2.0 foi projetado seguindo princípios de **multi-tenancy**, **escalabilidade** e **segurança**. O design implementa isolamento completo entre clínicas usando **Row Level Security (RLS)** e uma arquitetura normalizada para performance e manutenibilidade.

---

## 🏗️ **ARQUITETURA DO BANCO**

### **Princípios de Design**
1. **Multi-tenancy**: Isolamento completo por clínica
2. **Row Level Security (RLS)**: Controle de acesso no nível do banco
3. **Normalização**: Estrutura 3NF para integridade dos dados
4. **Performance**: Índices otimizados para consultas frequentes
5. **Auditoria**: Log completo de todas as mudanças
6. **Escalabilidade**: Preparado para crescimento horizontal

### **Estratégia de Multi-tenancy**
- **Isolamento**: Cada clínica vê apenas seus próprios dados
- **Segurança**: RLS garante isolamento mesmo com queries SQL diretas
- **Performance**: Índices otimizados por clínica
- **Flexibilidade**: Configurações específicas por clínica

---

## 📊 **SCHEMAS DO BANCO**

### **1. Schema `atendeai` (Principal)**
Schema base do sistema com tabelas fundamentais para multi-tenancy.

### **2. Schema `conversation`**
Sistema de conversação e IA com memória conversacional.

### **3. Schema `appointment`**
Sistema de agendamentos com máquina de estados.

### **4. Schema `clinic`**
Configurações específicas de cada clínica.

### **5. Schema `whatsapp`**
Integração com WhatsApp Business API.

### **6. Schema `google_calendar`**
Integração com Google Calendar.

---

## 🏥 **SCHEMA: ATENDEAI (PRINCIPAL)**

### **Tabela: `clinics`**
```sql
CREATE TABLE atendeai.clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    specialty VARCHAR(100),
    description TEXT,
    mission TEXT,
    values TEXT,
    differentials TEXT,
    
    -- Endereço
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zipcode VARCHAR(20),
    
    -- Contatos
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Configurações
    department_emails JSONB DEFAULT '{}',
    working_hours JSONB DEFAULT '{}',
    ai_personality JSONB DEFAULT '{}',
    ai_behavior JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos JSONB:**
- `department_emails`: Emails por departamento
- `working_hours`: Horários de funcionamento por dia
- `ai_personality`: Personalidade da IA da clínica
- `ai_behavior`: Comportamento da IA da clínica

### **Tabela: `users`**
```sql
CREATE TABLE atendeai.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: `sessions`**
```sql
CREATE TABLE atendeai.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES atendeai.users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: `audit_logs`**
```sql
CREATE TABLE atendeai.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES atendeai.users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 💬 **SCHEMA: CONVERSATION**

### **Tabela: `conversations`**
```sql
CREATE TABLE conversation.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    whatsapp_number VARCHAR(20) NOT NULL,
    user_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
    context JSONB DEFAULT '{}',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos JSONB:**
- `context`: Contexto da conversa (intenções, dados coletados, etc.)

### **Tabela: `messages`**
```sql
CREATE TABLE conversation.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('incoming', 'outgoing')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT false,
    intent_detected VARCHAR(100),
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos JSONB:**
- `metadata`: Metadados da mensagem (tipo de mídia, status, etc.)

### **Tabela: `conversation_memory`**
```sql
CREATE TABLE conversation.conversation_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    memory_key VARCHAR(100) NOT NULL,
    memory_value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(conversation_id, memory_key)
);
```

**Campos JSONB:**
- `memory_value`: Valor da memória (pode ser qualquer tipo de dado)

---

## 📅 **SCHEMA: APPOINTMENT**

### **Tabela: `services`**
```sql
CREATE TABLE appointment.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price DECIMAL(10,2),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    google_calendar_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: `professionals`**
```sql
CREATE TABLE appointment.professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    crm VARCHAR(20),
    specialties TEXT[],
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    accepts_new_patients BOOLEAN DEFAULT true,
    default_duration_minutes INTEGER DEFAULT 60,
    google_calendar_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: `appointments`**
```sql
CREATE TABLE appointment.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversation.conversations(id),
    service_id UUID NOT NULL REFERENCES appointment.services(id),
    professional_id UUID REFERENCES appointment.professionals(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    google_calendar_event_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: `appointment_flow`**
```sql
CREATE TABLE appointment.appointment_flow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id),
    current_state VARCHAR(50) NOT NULL,
    flow_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos JSONB:**
- `flow_data`: Dados do fluxo de agendamento (estado atual, dados coletados, etc.)

---

## 🏥 **SCHEMA: CLINIC**

### **Tabela: `clinic_configurations`**
```sql
CREATE TABLE clinic.clinic_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    config_type VARCHAR(100) NOT NULL,
    config_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, config_type)
);
```

**Campos JSONB:**
- `config_data`: Dados de configuração específicos do tipo

### **Tabela: `contextualization`**
```sql
CREATE TABLE clinic.contextualization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    context_name VARCHAR(100) NOT NULL,
    context_data JSONB NOT NULL,
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, context_name)
);
```

**Campos JSONB:**
- `context_data`: Dados de contextualização da clínica (personalidade da IA, respostas, etc.)

### **Tabela: `working_hours`**
```sql
CREATE TABLE clinic.working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_working_day BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, day_of_week)
);
```

### **Tabela: `scheduling_policies`**
```sql
CREATE TABLE clinic.scheduling_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    policy_name VARCHAR(100) NOT NULL,
    policy_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, policy_name)
);
```

**Campos JSONB:**
- `policy_data`: Dados da política de agendamento

---

## 📱 **SCHEMA: WHATSAPP**

### **Tabela: `messages`**
```sql
CREATE TABLE whatsapp.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversation.conversations(id),
    whatsapp_message_id VARCHAR(255) UNIQUE,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location')),
    content TEXT,
    media_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos JSONB:**
- `metadata`: Metadados da mensagem WhatsApp

### **Tabela: `webhooks`**
```sql
CREATE TABLE whatsapp.webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    webhook_url VARCHAR(500) NOT NULL,
    verify_token VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: `configurations`**
```sql
CREATE TABLE whatsapp.configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    phone_number_id VARCHAR(255) NOT NULL,
    access_token VARCHAR(500) NOT NULL,
    business_account_id VARCHAR(255),
    app_id VARCHAR(255),
    app_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, phone_number_id)
);
```

---

## 📅 **SCHEMA: GOOGLE_CALENDAR**

### **Tabela: `calendar_events`**
```sql
CREATE TABLE google_calendar.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointment.appointments(id),
    google_calendar_id VARCHAR(255) UNIQUE,
    event_summary VARCHAR(255) NOT NULL,
    event_description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    attendees JSONB DEFAULT '[]',
    location VARCHAR(500),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos JSONB:**
- `attendees`: Lista de participantes do evento

### **Tabela: `calendar_mappings`**
```sql
CREATE TABLE google_calendar.calendar_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    mapping_type VARCHAR(50) NOT NULL CHECK (mapping_type IN ('service', 'professional', 'clinic')),
    entity_id UUID,
    google_calendar_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: `google_configurations`**
```sql
CREATE TABLE google_calendar.google_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    client_id VARCHAR(255) NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    redirect_uri VARCHAR(500),
    scopes TEXT[],
    refresh_token TEXT,
    access_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔒 **SEGURANÇA E RLS**

### **Row Level Security (RLS)**
Todas as tabelas têm RLS habilitado com políticas de isolamento por clínica:

```sql
-- Exemplo de política RLS
CREATE POLICY clinics_isolation ON atendeai.clinics
    FOR ALL USING (id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY users_clinic_isolation ON atendeai.users
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);
```

### **Função de Contexto**
```sql
CREATE OR REPLACE FUNCTION set_clinic_context(clinic_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_clinic_id', clinic_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql;
```

### **Políticas de Segurança**
- **Isolamento**: Cada clínica vê apenas seus dados
- **Auditoria**: Todas as ações são logadas
- **Validação**: Constraints no nível do banco
- **Integridade**: Foreign keys com CASCADE

---

## 📊 **ÍNDICES E PERFORMANCE**

### **Índices Principais**
```sql
-- Clínicas
CREATE INDEX idx_clinics_status ON atendeai.clinics(status);

-- Usuários
CREATE INDEX idx_users_clinic_email ON atendeai.users(clinic_id, email);
CREATE INDEX idx_users_role ON atendeai.users(role);

-- Sessões
CREATE INDEX idx_sessions_user_token ON atendeai.sessions(user_id, token_hash);
CREATE INDEX idx_sessions_expires ON atendeai.sessions(expires_at);

-- Conversas
CREATE INDEX idx_conversations_clinic_whatsapp ON conversation.conversations(clinic_id, whatsapp_number);
CREATE INDEX idx_conversations_status ON conversation.conversations(status);

-- Mensagens
CREATE INDEX idx_messages_conversation_created ON conversation.messages(conversation_id, created_at);
CREATE INDEX idx_messages_clinic_processed ON conversation.messages(clinic_id, processed);

-- Agendamentos
CREATE INDEX idx_appointments_clinic_date ON appointment.appointments(clinic_id, appointment_date);
CREATE INDEX idx_appointments_conversation ON appointment.appointments(conversation_id);
CREATE INDEX idx_appointments_google_calendar ON appointment.appointments(google_calendar_event_id);
```

### **Otimizações de Performance**
- **Índices compostos** para consultas frequentes
- **Índices parciais** para dados ativos
- **Partitioning** preparado para crescimento
- **Connection pooling** configurado

---

## 🔄 **MIGRAÇÕES E VERSIONAMENTO**

### **Estratégia de Migração**
1. **Versionamento**: Cada mudança tem uma versão
2. **Rollback**: Migrações reversíveis
3. **Dependências**: Ordem correta de execução
4. **Validação**: Verificação após cada migração

### **Arquivos de Migração**
- `01-foundation/database-migration.sql` - Schema base
- `02-clinic-service/migrations.sql` - Tabelas de clínica
- `03-conversation-service/migrations.sql` - Sistema de conversação
- `04-appointment-service/migrations.sql` - Sistema de agendamento
- `05-integrations/migrations.sql` - Integrações externas

---

## 📈 **ESCALABILIDADE**

### **Preparação para Crescimento**
- **Particionamento**: Preparado para grandes volumes
- **Sharding**: Estratégia para múltiplas instâncias
- **Read Replicas**: Para consultas de leitura
- **Connection Pooling**: Gerenciamento de conexões

### **Monitoramento de Performance**
- **Query Performance**: Análise de queries lentas
- **Index Usage**: Uso dos índices
- **Connection Count**: Número de conexões ativas
- **Lock Monitoring**: Detecção de deadlocks

---

## 🎯 **CONCLUSÃO**

O design do banco de dados do AtendeAI 2.0 foi projetado para:

- ✅ **Multi-tenancy**: Isolamento completo entre clínicas
- ✅ **Segurança**: RLS e auditoria em todas as tabelas
- ✅ **Performance**: Índices otimizados e consultas eficientes
- ✅ **Escalabilidade**: Preparado para crescimento futuro
- ✅ **Manutenibilidade**: Estrutura clara e documentada
- ✅ **Flexibilidade**: Suporte a configurações por clínica

---

**Status**: 🟢 DESIGN COMPLETO  
**Última atualização**: 2024-01-15  
**Versão**: 1.0.0  
**Próxima revisão**: Após implementação dos serviços core
