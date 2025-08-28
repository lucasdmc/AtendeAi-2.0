-- Migration: 002_whatsapp_integration.sql
-- Description: Implementação completa da integração WhatsApp com Meta
-- Author: Expert Developer
-- Date: 2024-01-15

-- Criar schema whatsapp se não existir
CREATE SCHEMA IF NOT EXISTS whatsapp;

-- 1. TABELA: whatsapp_messages
CREATE TABLE whatsapp.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação da clínica (multi-tenancy)
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    
    -- Identificação da conversa (opcional para mensagens iniciais)
    conversation_id UUID REFERENCES conversation.conversations(id) ON DELETE SET NULL,
    
    -- Identificação do usuário (opcional para mensagens anônimas)
    user_id UUID REFERENCES atendeai.users(id) ON DELETE SET NULL,
    
    -- Dados da mensagem WhatsApp
    whatsapp_message_id VARCHAR(255) NOT NULL UNIQUE,
    from_phone_number VARCHAR(20) NOT NULL,
    to_phone_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    
    -- Conteúdo da mensagem
    content_text TEXT,
    content_metadata JSONB,
    
    -- Status e processamento
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    processing_attempts INTEGER DEFAULT 0,
    last_processing_error TEXT,
    
    -- Metadados da Meta
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    webhook_event_id UUID,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location')),
    CONSTRAINT valid_status CHECK (status IN ('received', 'processing', 'processed', 'failed', 'sent', 'delivered', 'read')),
    CONSTRAINT valid_phone_format CHECK (from_phone_number ~ '^\+[1-9]\d{1,14}$')
);

-- 2. TABELA: whatsapp_webhook_events
CREATE TABLE whatsapp.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação da clínica
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    
    -- Dados do webhook da Meta
    webhook_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    object_type VARCHAR(100) NOT NULL,
    
    -- Payload completo do webhook
    raw_payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    
    -- Metadados
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status de processamento
    processing_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_event_type CHECK (event_type IN ('messages', 'message_deliveries', 'message_reads')),
    CONSTRAINT valid_processing_status CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 3. TABELA: whatsapp_conversation_sessions
CREATE TABLE whatsapp.conversation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação da clínica
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    
    -- Dados da conversa
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id) ON DELETE CASCADE,
    whatsapp_phone_number VARCHAR(20) NOT NULL,
    customer_phone_number VARCHAR(20) NOT NULL,
    
    -- Status da sessão
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    
    -- Configurações da sessão
    auto_reply_enabled BOOLEAN DEFAULT TRUE,
    escalation_threshold INTEGER DEFAULT 3,
    escalation_user_id UUID REFERENCES atendeai.users(id),
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_session_status CHECK (status IN ('active', 'paused', 'closed', 'archived')),
    CONSTRAINT valid_phone_format CHECK (customer_phone_number ~ '^\+[1-9]\d{1,14}$')
);

-- 4. TABELA: whatsapp_message_processing_logs
CREATE TABLE whatsapp.message_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referência à mensagem
    message_id UUID NOT NULL REFERENCES whatsapp.messages(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    
    -- Dados do processamento
    processing_step VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    
    -- Performance
    processing_time_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadados
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processor_service VARCHAR(100),
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_processing_step CHECK (processing_step IN ('webhook_received', 'conversation_created', 'ai_processed', 'response_sent', 'error_handled')),
    CONSTRAINT valid_status CHECK (status IN ('success', 'failed', 'retry', 'pending'))
);

-- Adicionar foreign key para webhook_event_id
ALTER TABLE whatsapp.messages 
ADD CONSTRAINT fk_messages_webhook_event 
FOREIGN KEY (webhook_event_id) REFERENCES whatsapp.webhook_events(id);

-- Criar índices para performance
CREATE INDEX idx_whatsapp_messages_clinic_id ON whatsapp.messages(clinic_id);
CREATE INDEX idx_whatsapp_messages_conversation_id ON whatsapp.messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_from_phone ON whatsapp.messages(from_phone_number);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp.messages(status);
CREATE INDEX idx_whatsapp_messages_created_at ON whatsapp.messages(created_at);
CREATE INDEX idx_whatsapp_messages_whatsapp_id ON whatsapp.messages(whatsapp_message_id);

-- Índices compostos para consultas frequentes
CREATE INDEX idx_whatsapp_messages_clinic_status ON whatsapp.messages(clinic_id, status);
CREATE INDEX idx_whatsapp_messages_conversation_created ON whatsapp.messages(conversation_id, created_at);

-- Índices para webhook events
CREATE INDEX idx_webhook_events_clinic_id ON whatsapp.webhook_events(clinic_id);
CREATE INDEX idx_webhook_events_event_type ON whatsapp.webhook_events(event_type);
CREATE INDEX idx_webhook_events_processing_status ON whatsapp.webhook_events(processing_status);
CREATE INDEX idx_webhook_events_received_at ON whatsapp.webhook_events(received_at);
CREATE INDEX idx_webhook_events_webhook_id ON whatsapp.webhook_events(webhook_id);

-- Índices para conversation sessions
CREATE INDEX idx_conversation_sessions_clinic_id ON whatsapp.conversation_sessions(clinic_id);
CREATE INDEX idx_conversation_sessions_conversation_id ON whatsapp.conversation_sessions(conversation_id);
CREATE INDEX idx_conversation_sessions_customer_phone ON whatsapp.conversation_sessions(customer_phone_number);
CREATE INDEX idx_conversation_sessions_status ON whatsapp.conversation_sessions(status);
CREATE INDEX idx_conversation_sessions_last_message ON whatsapp.conversation_sessions(last_message_at);

-- Índices para processing logs
CREATE INDEX idx_processing_logs_message_id ON whatsapp.message_processing_logs(message_id);
CREATE INDEX idx_processing_logs_clinic_id ON whatsapp.message_processing_logs(clinic_id);
CREATE INDEX idx_processing_logs_processing_step ON whatsapp.message_processing_logs(processing_step);
CREATE INDEX idx_processing_logs_status ON whatsapp.message_processing_logs(status);
CREATE INDEX idx_processing_logs_processed_at ON whatsapp.message_processing_logs(processed_at);

-- Índices estratégicos para performance
CREATE INDEX idx_messages_clinic_created_period ON whatsapp.messages(clinic_id, created_at DESC)
    WHERE status IN ('received', 'processed');

CREATE INDEX idx_conversation_sessions_active ON whatsapp.conversation_sessions(clinic_id, status, last_message_at DESC)
    WHERE status = 'active';

CREATE INDEX idx_webhook_events_pending ON whatsapp.webhook_events(clinic_id, processing_status, received_at)
    WHERE processing_status = 'pending';

-- Habilitar Row Level Security (RLS)
ALTER TABLE whatsapp.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp.message_processing_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para isolamento de clínicas
CREATE POLICY messages_clinic_isolation ON whatsapp.messages
    FOR ALL USING (clinic_id IN (
        SELECT clinic_id FROM atendeai.users WHERE id = auth.uid()
    ));

CREATE POLICY webhook_events_clinic_isolation ON whatsapp.webhook_events
    FOR ALL USING (clinic_id IN (
        SELECT clinic_id FROM atendeai.users WHERE id = auth.uid()
    ));

CREATE POLICY conversation_sessions_clinic_isolation ON whatsapp.conversation_sessions
    FOR ALL USING (clinic_id IN (
        SELECT clinic_id FROM atendeai.users WHERE id = auth.uid()
    ));

CREATE POLICY processing_logs_clinic_isolation ON whatsapp.message_processing_logs
    FOR ALL USING (clinic_id IN (
        SELECT clinic_id FROM atendeai.users WHERE id = auth.uid()
    ));

-- Função para auditoria de mudanças nas mensagens
CREATE OR REPLACE FUNCTION whatsapp.audit_message_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO atendeai.audit_logs (
            clinic_id, user_id, action, table_name, record_id, 
            new_values, ip_address, user_agent
        ) VALUES (
            NEW.clinic_id, auth.uid(), 'INSERT', 'whatsapp.messages', 
            NEW.id, to_jsonb(NEW), inet_client_addr(), current_setting('app.user_agent')
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO atendeai.audit_logs (
            clinic_id, user_id, action, table_name, record_id, 
            old_values, new_values, ip_address, user_agent
        ) VALUES (
            NEW.clinic_id, auth.uid(), 'UPDATE', 'whatsapp.messages', 
            NEW.id, to_jsonb(OLD), to_jsonb(NEW), inet_client_addr(), current_setting('app.user_agent')
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO atendeai.audit_logs (
            clinic_id, user_id, action, table_name, record_id, 
            old_values, ip_address, user_agent
        ) VALUES (
            OLD.clinic_id, auth.uid(), 'DELETE', 'whatsapp.messages', 
            OLD.id, to_jsonb(OLD), inet_client_addr(), current_setting('app.user_agent')
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoria automática
CREATE TRIGGER audit_messages_changes
    AFTER INSERT OR UPDATE OR DELETE ON whatsapp.messages
    FOR EACH ROW EXECUTE FUNCTION whatsapp.audit_message_changes();

-- Views para dashboards e métricas
CREATE VIEW whatsapp.messages_metrics AS
SELECT 
    clinic_id,
    DATE(created_at) as date,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_messages,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_messages,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM whatsapp.messages
GROUP BY clinic_id, DATE(created_at);

CREATE VIEW whatsapp.active_conversations AS
SELECT 
    cs.clinic_id,
    c.name as clinic_name,
    cs.customer_phone_number,
    cs.message_count,
    cs.last_message_at,
    cs.auto_reply_enabled
FROM whatsapp.conversation_sessions cs
JOIN atendeai.clinics c ON c.id = cs.clinic_id
WHERE cs.status = 'active'
ORDER BY cs.last_message_at DESC;

-- Inserir dados iniciais para clínicas ativas
INSERT INTO whatsapp.webhook_events (clinic_id, webhook_id, event_type, object_type, raw_payload, processed)
SELECT 
    c.id as clinic_id,
    'initial_setup' as webhook_id,
    'messages' as event_type,
    'whatsapp_business_account' as object_type,
    '{"setup": "initial"}'::jsonb as raw_payload,
    true as processed
FROM atendeai.clinics c
WHERE c.status = 'active';

-- Comentários para documentação
COMMENT ON SCHEMA whatsapp IS 'Schema para integração com WhatsApp Business API';
COMMENT ON TABLE whatsapp.messages IS 'Mensagens recebidas e enviadas via WhatsApp';
COMMENT ON TABLE whatsapp.webhook_events IS 'Eventos de webhook recebidos da Meta';
COMMENT ON TABLE whatsapp.conversation_sessions IS 'Sessões de conversa ativas no WhatsApp';
COMMENT ON TABLE whatsapp.message_processing_logs IS 'Logs de processamento de mensagens';

-- Log de migração
INSERT INTO atendeai.audit_logs (
    clinic_id, user_id, action, table_name, record_id, 
    new_values, ip_address, user_agent
) VALUES (
    NULL, NULL, 'MIGRATION', 'schema', 'whatsapp', 
    '{"migration": "002_whatsapp_integration", "status": "completed", "timestamp": "2024-01-15T00:00:00Z"}'::jsonb,
    '127.0.0.1', 'migration-script'
);
