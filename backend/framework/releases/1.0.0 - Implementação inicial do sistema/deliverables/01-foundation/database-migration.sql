-- =====================================================
-- MIGRAÇÃO BASE DO BANCO DE DADOS - ATENDEAI 2.0
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- SCHEMA: ATENDEAI (PRINCIPAL)
-- =====================================================

-- Criar schema principal
CREATE SCHEMA IF NOT EXISTS atendeai;

-- Tabela de clínicas
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

-- Tabela de usuários
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

-- Tabela de sessões
CREATE TABLE atendeai.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES atendeai.users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de auditoria
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

-- =====================================================
-- SCHEMA: CONVERSATION
-- =====================================================

-- Criar schema de conversação
CREATE SCHEMA IF NOT EXISTS conversation;

-- Tabela de conversas
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

-- Tabela de mensagens
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

-- Tabela de memória conversacional
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

-- =====================================================
-- SCHEMA: APPOINTMENT
-- =====================================================

-- Criar schema de agendamentos
CREATE SCHEMA IF NOT EXISTS appointment;

-- Tabela de serviços
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

-- Tabela de profissionais
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

-- Tabela de agendamentos
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

-- Tabela de fluxo de agendamento
CREATE TABLE appointment.appointment_flow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id),
    current_state VARCHAR(50) NOT NULL,
    flow_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SCHEMA: CLINIC
-- =====================================================

-- Criar schema de clínica
CREATE SCHEMA IF NOT EXISTS clinic;

-- Tabela de configurações da clínica
CREATE TABLE clinic.clinic_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    config_type VARCHAR(100) NOT NULL,
    config_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, config_type)
);

-- Tabela de contextualização JSON
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

-- Tabela de horários de funcionamento
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

-- Tabela de políticas de agendamento
CREATE TABLE clinic.scheduling_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    policy_name VARCHAR(100) NOT NULL,
    policy_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, policy_name)
);

-- =====================================================
-- SCHEMA: WHATSAPP
-- =====================================================

-- Criar schema do WhatsApp
CREATE SCHEMA IF NOT EXISTS whatsapp;

-- Tabela de mensagens WhatsApp
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

-- Tabela de webhooks
CREATE TABLE whatsapp.webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    webhook_url VARCHAR(500) NOT NULL,
    verify_token VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações WhatsApp
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

-- =====================================================
-- SCHEMA: GOOGLE_CALENDAR
-- =====================================================

-- Criar schema do Google Calendar
CREATE SCHEMA IF NOT EXISTS google_calendar;

-- Tabela de eventos do calendário
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

-- Tabela de mapeamentos de calendário
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

-- Tabela de configurações do Google
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

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices do schema atendeai
CREATE INDEX idx_clinics_status ON atendeai.clinics(status);
CREATE INDEX idx_users_clinic_email ON atendeai.users(clinic_id, email);
CREATE INDEX idx_users_role ON atendeai.users(role);
CREATE INDEX idx_sessions_user_token ON atendeai.sessions(user_id, token_hash);
CREATE INDEX idx_sessions_expires ON atendeai.sessions(expires_at);
CREATE INDEX idx_audit_logs_clinic_created ON atendeai.audit_logs(clinic_id, created_at);

-- Índices do schema conversation
CREATE INDEX idx_conversations_clinic_whatsapp ON conversation.conversations(clinic_id, whatsapp_number);
CREATE INDEX idx_conversations_status ON conversation.conversations(status);
CREATE INDEX idx_messages_conversation_created ON conversation.messages(conversation_id, created_at);
CREATE INDEX idx_messages_clinic_processed ON conversation.messages(clinic_id, processed);
CREATE INDEX idx_memory_conversation_key ON conversation.conversation_memory(conversation_id, memory_key);

-- Índices do schema appointment
CREATE INDEX idx_services_clinic_status ON appointment.services(clinic_id, status);
CREATE INDEX idx_professionals_clinic_status ON appointment.professionals(clinic_id, status);
CREATE INDEX idx_appointments_clinic_date ON appointment.appointments(clinic_id, appointment_date);
CREATE INDEX idx_appointments_conversation ON appointment.appointments(conversation_id);
CREATE INDEX idx_appointments_google_calendar ON appointment.appointments(google_calendar_event_id);
CREATE INDEX idx_flow_conversation ON appointment.appointment_flow(conversation_id);

-- Índices do schema clinic
CREATE INDEX idx_clinic_config_clinic_type ON clinic.clinic_configurations(clinic_id, config_type);
CREATE INDEX idx_contextualization_clinic_active ON clinic.contextualization(clinic_id, is_active);
CREATE INDEX idx_working_hours_clinic_day ON clinic.working_hours(clinic_id, day_of_week);
CREATE INDEX idx_scheduling_policies_clinic ON clinic.scheduling_policies(clinic_id);

-- Índices do schema whatsapp
CREATE INDEX idx_whatsapp_messages_clinic_created ON whatsapp.messages(clinic_id, created_at);
CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp.messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp.messages(status);
CREATE INDEX idx_whatsapp_messages_whatsapp_id ON whatsapp.messages(whatsapp_message_id);
CREATE INDEX idx_whatsapp_config_clinic_active ON whatsapp.configurations(clinic_id, is_active);

-- Índices do schema google_calendar
CREATE INDEX idx_calendar_events_clinic_date ON google_calendar.calendar_events(clinic_id, start_time);
CREATE INDEX idx_calendar_events_appointment ON google_calendar.calendar_events(appointment_id);
CREATE INDEX idx_calendar_events_google_id ON google_calendar.calendar_events(google_calendar_id);
CREATE INDEX idx_calendar_mappings_clinic_type ON google_calendar.calendar_mappings(clinic_id, mapping_type);
CREATE INDEX idx_google_config_clinic_active ON google_calendar.google_configurations(clinic_id, is_active);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE atendeai.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE conversation.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation.conversation_memory ENABLE ROW LEVEL SECURITY;

ALTER TABLE appointment.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment.appointment_flow ENABLE ROW LEVEL SECURITY;

ALTER TABLE clinic.clinic_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic.contextualization ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic.scheduling_policies ENABLE ROW LEVEL SECURITY;

ALTER TABLE whatsapp.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp.configurations ENABLE ROW LEVEL SECURITY;

ALTER TABLE google_calendar.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar.calendar_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar.google_configurations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNÇÕES DE CONTEXTO E SEGURANÇA
-- =====================================================

-- Função para definir contexto da clínica
CREATE OR REPLACE FUNCTION set_clinic_context(clinic_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_clinic_id', clinic_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- Função para obter contexto da clínica
CREATE OR REPLACE FUNCTION get_clinic_context()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_clinic_id')::UUID;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Políticas para schema atendeai
CREATE POLICY clinics_isolation ON atendeai.clinics
    FOR ALL USING (id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY users_clinic_isolation ON atendeai.users
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY sessions_clinic_isolation ON atendeai.sessions
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY audit_logs_clinic_isolation ON atendeai.audit_logs
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

-- Políticas para schema conversation
CREATE POLICY conversations_clinic_isolation ON conversation.conversations
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY messages_clinic_isolation ON conversation.messages
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY memory_clinic_isolation ON conversation.conversation_memory
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

-- Políticas para schema appointment
CREATE POLICY services_clinic_isolation ON appointment.services
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY professionals_clinic_isolation ON appointment.professionals
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY appointments_clinic_isolation ON appointment.appointments
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY flow_clinic_isolation ON appointment.appointment_flow
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

-- Políticas para schema clinic
CREATE POLICY clinic_config_isolation ON clinic.clinic_configurations
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY contextualization_isolation ON clinic.contextualization
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY working_hours_isolation ON clinic.working_hours
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY scheduling_policies_isolation ON clinic.scheduling_policies
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

-- Políticas para schema whatsapp
CREATE POLICY whatsapp_messages_isolation ON whatsapp.messages
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY whatsapp_webhooks_isolation ON whatsapp.webhooks
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY whatsapp_config_isolation ON whatsapp.configurations
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

-- Políticas para schema google_calendar
CREATE POLICY calendar_events_isolation ON google_calendar.calendar_events
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY calendar_mappings_isolation ON google_calendar.calendar_mappings
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY google_config_isolation ON google_calendar.google_configurations
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

-- =====================================================
-- TRIGGERS PARA AUDITORIA
-- =====================================================

-- Função para auditoria automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO atendeai.audit_logs (
            clinic_id,
            user_id,
            action,
            table_name,
            record_id,
            new_values
        ) VALUES (
            COALESCE(NEW.clinic_id, get_clinic_context()),
            current_setting('app.current_user_id', true)::UUID,
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO atendeai.audit_logs (
            clinic_id,
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values
        ) VALUES (
            COALESCE(NEW.clinic_id, get_clinic_context()),
            current_setting('app.current_user_id', true)::UUID,
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO atendeai.audit_logs (
            clinic_id,
            user_id,
            action,
            table_name,
            record_id,
            old_values
        ) VALUES (
            COALESCE(OLD.clinic_id, get_clinic_context()),
            current_setting('app.current_user_id', true)::UUID,
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir clínica de exemplo
INSERT INTO atendeai.clinics (
    id,
    name,
    type,
    specialty,
    description,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Clínica Exemplo AtendeAI',
    'Clínica Médica',
    'Clínica Geral',
    'Clínica de exemplo para demonstração do sistema AtendeAI 2.0',
    'active'
) ON CONFLICT DO NOTHING;

-- Inserir usuário admin de exemplo
INSERT INTO atendeai.users (
    id,
    clinic_id,
    name,
    email,
    password_hash,
    role,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'Administrador Sistema',
    'admin@exemplo.com',
    crypt('admin123', gen_salt('bf')),
    'admin',
    'active'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'atendeai.clinics',
        'atendeai.users',
        'atendeai.sessions',
        'atendeai.audit_logs',
        'conversation.conversations',
        'conversation.messages',
        'conversation.conversation_memory',
        'appointment.services',
        'appointment.professionals',
        'appointment.appointments',
        'appointment.appointment_flow',
        'clinic.clinic_configurations',
        'clinic.contextualization',
        'clinic.working_hours',
        'clinic.scheduling_policies',
        'whatsapp.messages',
        'whatsapp.webhooks',
        'whatsapp.configurations',
        'google_calendar.calendar_events',
        'google_calendar.calendar_mappings',
        'google_calendar.google_configurations'
    ];
    table_name TEXT;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Verificando criação das tabelas...';
    
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema || '.' || table_name = table_name
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '✅ % criada com sucesso', table_name;
        ELSE
            RAISE NOTICE '❌ % não foi criada', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Verificação concluída!';
END $$;

-- =====================================================
-- MIGRAÇÃO CONCLUÍDA
-- =====================================================

COMMENT ON SCHEMA atendeai IS 'Schema principal do sistema AtendeAI 2.0';
COMMENT ON SCHEMA conversation IS 'Sistema de conversação e IA com memória conversacional';
COMMENT ON SCHEMA appointment IS 'Sistema de agendamentos com máquina de estados';
COMMENT ON SCHEMA clinic IS 'Configurações específicas de cada clínica';
COMMENT ON SCHEMA whatsapp IS 'Integração com WhatsApp Business API';
COMMENT ON SCHEMA google_calendar IS 'Integração com Google Calendar';

RAISE NOTICE '🎉 Migração base do banco de dados AtendeAI 2.0 concluída com sucesso!';
RAISE NOTICE '📊 Total de tabelas criadas: 21';
RAISE NOTICE '🔒 RLS habilitado em todas as tabelas';
RAISE NOTICE '📈 Índices de performance criados';
RAISE NOTICE '🔍 Sistema de auditoria configurado';
RAISE NOTICE '🚀 Sistema pronto para uso!';
