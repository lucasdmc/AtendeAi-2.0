-- =====================================================
-- MIGRATION: 001_core_schema.sql
-- Description: Criação do schema principal multiclínicas
-- Author: database_architect
-- Date: 2025-01-20
-- Forward: Criar schemas e tabelas core
-- Backward: DROP schemas (ver rollback)
-- =====================================================

-- Criar schemas organizacionais
CREATE SCHEMA IF NOT EXISTS atendeai;
CREATE SCHEMA IF NOT EXISTS conversation;
CREATE SCHEMA IF NOT EXISTS appointment;
CREATE SCHEMA IF NOT EXISTS whatsapp;

-- =====================================================
-- ATENDEAI SCHEMA - CORE ENTITIES
-- =====================================================

-- Tabela principal de clínicas
CREATE TABLE atendeai.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados básicos
    name VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
    meta_webhook_url TEXT,
    whatsapp_id VARCHAR(100),
    
    -- Configuração JSON
    context_json JSONB NOT NULL DEFAULT '{}',
    
    -- Configurações operacionais
    simulation_mode BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive')),
    CONSTRAINT valid_whatsapp_format CHECK (whatsapp_number ~ '^\+[1-9]\d{1,14}$')
);

-- Tabela de usuários do sistema
CREATE TABLE atendeai.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados do usuário
    name VARCHAR(30) NOT NULL,
    login VARCHAR(25) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Perfil e permissões
    role VARCHAR(20) NOT NULL,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_role CHECK (role IN ('admin_lify', 'suporte_lify', 'atendente', 'gestor', 'administrador')),
    CONSTRAINT valid_user_status CHECK (status IN ('active', 'inactive'))
);

-- Tabela de logs de auditoria
CREATE TABLE atendeai.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contexto
    clinic_id UUID REFERENCES atendeai.clinics(id) ON DELETE SET NULL,
    user_id UUID REFERENCES atendeai.users(id) ON DELETE SET NULL,
    
    -- Ação realizada
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    
    -- Dados da mudança
    old_values JSONB,
    new_values JSONB,
    
    -- Metadados técnicos
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'MIGRATION'))
);

-- =====================================================
-- CONVERSATION SCHEMA - CHAT & MESSAGING
-- =====================================================

-- Tabela principal de conversas
CREATE TABLE conversation.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    customer_phone VARCHAR(20) NOT NULL,
    
    -- Status e controle
    conversation_type VARCHAR(20) NOT NULL DEFAULT 'chatbot',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    bot_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Atribuição humana
    assigned_user_id UUID REFERENCES atendeai.users(id) ON DELETE SET NULL,
    
    -- Classificação
    tags JSONB DEFAULT '[]',
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_conversation_type CHECK (conversation_type IN ('chatbot', 'human', 'mixed')),
    CONSTRAINT valid_conversation_status CHECK (status IN ('active', 'paused', 'closed')),
    CONSTRAINT valid_phone_format CHECK (customer_phone ~ '^\+[1-9]\d{1,14}$')
);

-- Tabela de mensagens individuais
CREATE TABLE conversation.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referências
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id) ON DELETE CASCADE,
    
    -- Origem da mensagem
    sender_type VARCHAR(20) NOT NULL,
    
    -- Conteúdo
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    
    -- Integração WhatsApp
    whatsapp_message_id VARCHAR(255) UNIQUE,
    
    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_sender_type CHECK (sender_type IN ('customer', 'bot', 'human')),
    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document'))
);

-- Tabela de etiquetas de conversas
CREATE TABLE conversation.conversation_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados da etiqueta
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#808080',
    description TEXT,
    
    -- Status
    active BOOLEAN NOT NULL DEFAULT true,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_tag_per_clinic UNIQUE (clinic_id, name),
    CONSTRAINT valid_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- =====================================================
-- APPOINTMENT SCHEMA - AGENDAMENTOS
-- =====================================================

-- Tabela principal de agendamentos
CREATE TABLE appointment.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    
    -- Dados do cliente
    customer_info JSONB NOT NULL,
    
    -- Integração Google Calendar
    google_event_id VARCHAR(255),
    google_calendar_id VARCHAR(255),
    
    -- Configuração do agendamento
    appointment_type VARCHAR(100) NOT NULL,
    datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30, -- minutos
    
    -- Status e prioridade
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    priority INTEGER NOT NULL DEFAULT 1,
    
    -- Confirmação
    confirmation_sent BOOLEAN NOT NULL DEFAULT false,
    confirmation_received BOOLEAN NOT NULL DEFAULT false,
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    confirmation_received_at TIMESTAMP WITH TIME ZONE,
    
    -- Observações
    notes TEXT,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_appointment_status CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
    CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10),
    CONSTRAINT valid_duration CHECK (duration > 0)
);

-- Tabela de tipos de agendamento por clínica
CREATE TABLE appointment.appointment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    
    -- Dados do tipo
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_duration INTEGER NOT NULL DEFAULT 30,
    color VARCHAR(7) NOT NULL DEFAULT '#4285f4',
    
    -- Configurações
    priority INTEGER NOT NULL DEFAULT 1,
    requires_confirmation BOOLEAN NOT NULL DEFAULT true,
    auto_confirmation_hours INTEGER DEFAULT 24,
    
    -- Status
    active BOOLEAN NOT NULL DEFAULT true,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_type_per_clinic UNIQUE (clinic_id, name),
    CONSTRAINT valid_type_priority CHECK (priority BETWEEN 1 AND 10),
    CONSTRAINT valid_color_format_appointment CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Tabela de integrações Google
CREATE TABLE appointment.google_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    
    -- Tokens OAuth (criptografados)
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    
    -- Configuração do calendário
    calendar_id VARCHAR(255) NOT NULL,
    calendar_name VARCHAR(255),
    
    -- Validade
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_integration_status CHECK (status IN ('active', 'expired', 'revoked', 'error'))
);

-- =====================================================
-- INDEXES PARA PERFORMANCE
-- =====================================================

-- Índices para clínicas
CREATE INDEX idx_clinics_status ON atendeai.clinics(status);
CREATE INDEX idx_clinics_whatsapp ON atendeai.clinics(whatsapp_number);

-- Índices para usuários
CREATE INDEX idx_users_clinic_id ON atendeai.users(clinic_id);
CREATE INDEX idx_users_role ON atendeai.users(role);
CREATE INDEX idx_users_login ON atendeai.users(login);

-- Índices para audit logs
CREATE INDEX idx_audit_clinic_id ON atendeai.audit_logs(clinic_id);
CREATE INDEX idx_audit_created_at ON atendeai.audit_logs(created_at);
CREATE INDEX idx_audit_action ON atendeai.audit_logs(action);

-- Índices para conversas
CREATE INDEX idx_conversations_clinic_id ON conversation.conversations(clinic_id);
CREATE INDEX idx_conversations_customer_phone ON conversation.conversations(customer_phone);
CREATE INDEX idx_conversations_status ON conversation.conversations(status);
CREATE INDEX idx_conversations_assigned_user ON conversation.conversations(assigned_user_id);

-- Índices para mensagens
CREATE INDEX idx_messages_conversation_id ON conversation.messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON conversation.messages(timestamp);
CREATE INDEX idx_messages_whatsapp_id ON conversation.messages(whatsapp_message_id);

-- Índices para agendamentos
CREATE INDEX idx_appointments_clinic_id ON appointment.appointments(clinic_id);
CREATE INDEX idx_appointments_datetime ON appointment.appointments(datetime);
CREATE INDEX idx_appointments_status ON appointment.appointments(status);
CREATE INDEX idx_appointments_google_event ON appointment.appointments(google_event_id);

-- Índices para integrações Google
CREATE INDEX idx_google_integrations_clinic_id ON appointment.google_integrations(clinic_id);
CREATE INDEX idx_google_integrations_status ON appointment.google_integrations(status);
CREATE INDEX idx_google_integrations_expires_at ON appointment.google_integrations(expires_at);

-- =====================================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- =====================================================

-- Função para trigger de auditoria
CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO atendeai.audit_logs (
            clinic_id, user_id, action, table_name, record_id, 
            new_values, ip_address, user_agent
        ) VALUES (
            COALESCE(NEW.clinic_id, NULL),
            NULLIF(current_setting('app.user_id', true), '')::UUID,
            TG_OP,
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW),
            NULLIF(current_setting('app.ip_address', true), '')::INET,
            NULLIF(current_setting('app.user_agent', true), '')
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO atendeai.audit_logs (
            clinic_id, user_id, action, table_name, record_id, 
            old_values, new_values, ip_address, user_agent
        ) VALUES (
            COALESCE(NEW.clinic_id, OLD.clinic_id),
            NULLIF(current_setting('app.user_id', true), '')::UUID,
            TG_OP,
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            NULLIF(current_setting('app.ip_address', true), '')::INET,
            NULLIF(current_setting('app.user_agent', true), '')
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO atendeai.audit_logs (
            clinic_id, user_id, action, table_name, record_id, 
            old_values, ip_address, user_agent
        ) VALUES (
            OLD.clinic_id,
            NULLIF(current_setting('app.user_id', true), '')::UUID,
            TG_OP,
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD),
            NULLIF(current_setting('app.ip_address', true), '')::INET,
            NULLIF(current_setting('app.user_agent', true), '')
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoria em tabelas críticas
CREATE TRIGGER audit_clinics
    AFTER INSERT OR UPDATE OR DELETE ON atendeai.clinics
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON atendeai.users
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

CREATE TRIGGER audit_appointments
    AFTER INSERT OR UPDATE OR DELETE ON appointment.appointments
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

-- Schema comments
COMMENT ON SCHEMA atendeai IS 'Schema principal do sistema - clínicas, usuários, auditoria';
COMMENT ON SCHEMA conversation IS 'Schema de conversas WhatsApp e mensagens';
COMMENT ON SCHEMA appointment IS 'Schema de agendamentos e integração Google Calendar';

-- Table comments
COMMENT ON TABLE atendeai.clinics IS 'Clínicas cadastradas no sistema multiclínicas';
COMMENT ON TABLE atendeai.users IS 'Usuários do sistema com diferentes perfis de acesso';
COMMENT ON TABLE atendeai.audit_logs IS 'Logs de auditoria para rastreabilidade de mudanças';

COMMENT ON TABLE conversation.conversations IS 'Conversas WhatsApp entre clínicas e clientes';
COMMENT ON TABLE conversation.messages IS 'Mensagens individuais das conversas';
COMMENT ON TABLE conversation.conversation_tags IS 'Sistema de etiquetas para classificação de conversas';

COMMENT ON TABLE appointment.appointments IS 'Agendamentos integrados com Google Calendar';
COMMENT ON TABLE appointment.appointment_types IS 'Tipos de agendamento configuráveis por clínica';
COMMENT ON TABLE appointment.google_integrations IS 'Integrações OAuth com Google Calendar por clínica';

-- Log da migração
INSERT INTO atendeai.audit_logs (
    clinic_id, user_id, action, table_name, record_id, 
    new_values, ip_address, user_agent
) VALUES (
    NULL, NULL, 'MIGRATION', 'schema', 'core_schema_001', 
    '{"migration": "001_core_schema.sql", "status": "completed", "timestamp": "2025-01-20T15:00:00Z"}'::jsonb,
    '127.0.0.1', 'database-architect'
);
