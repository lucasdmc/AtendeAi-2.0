-- Migration para WhatsApp Service
-- Criar tabelas necessárias para o sistema de mensagens do WhatsApp

-- Tabela de mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_name VARCHAR(100),
    message_type VARCHAR(20) NOT NULL,
    content TEXT,
    direction VARCHAR(20) NOT NULL,
    whatsapp_message_id VARCHAR(100) UNIQUE,
    conversation_id UUID,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'received',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    category VARCHAR(50),
    components JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mídia do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    whatsapp_media_id VARCHAR(100) UNIQUE,
    media_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size INTEGER,
    url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de webhooks recebidos
CREATE TABLE IF NOT EXISTS whatsapp_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID,
    webhook_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processing_result JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_clinic_id ON whatsapp_messages(clinic_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_patient_phone ON whatsapp_messages(patient_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_whatsapp_message_id ON whatsapp_messages(whatsapp_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_type ON whatsapp_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_clinic_id ON whatsapp_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_name ON whatsapp_templates(name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_language ON whatsapp_templates(language_code);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_active ON whatsapp_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_whatsapp_media_clinic_id ON whatsapp_media(clinic_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_media_whatsapp_id ON whatsapp_media(whatsapp_media_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_media_type ON whatsapp_media(media_type);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_clinic_id ON whatsapp_webhooks(clinic_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_processed ON whatsapp_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_created_at ON whatsapp_webhooks(created_at);

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_clinic_status ON whatsapp_messages(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_clinic_direction ON whatsapp_messages(clinic_id, direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_patient_clinic ON whatsapp_messages(patient_phone, clinic_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_type_status ON whatsapp_messages(message_type, status);

-- Constraints
ALTER TABLE whatsapp_messages 
ADD CONSTRAINT fk_whatsapp_messages_clinic_id 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

ALTER TABLE whatsapp_templates 
ADD CONSTRAINT fk_whatsapp_templates_clinic_id 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

ALTER TABLE whatsapp_media 
ADD CONSTRAINT fk_whatsapp_media_clinic_id 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

ALTER TABLE whatsapp_webhooks 
ADD CONSTRAINT fk_whatsapp_webhooks_clinic_id 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL;

-- Constraints de validação
ALTER TABLE whatsapp_messages 
ADD CONSTRAINT chk_whatsapp_messages_type 
CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location', 'contacts', 'sticker', 'reaction', 'template', 'interactive'));

ALTER TABLE whatsapp_messages 
ADD CONSTRAINT chk_whatsapp_messages_direction 
CHECK (direction IN ('inbound', 'outbound'));

ALTER TABLE whatsapp_messages 
ADD CONSTRAINT chk_whatsapp_messages_status 
CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed', 'processed'));

ALTER TABLE whatsapp_media 
ADD CONSTRAINT chk_whatsapp_media_type 
CHECK (media_type IN ('image', 'audio', 'video', 'document'));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_whatsapp_messages_updated_at 
    BEFORE UPDATE ON whatsapp_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at 
    BEFORE UPDATE ON whatsapp_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_media_updated_at 
    BEFORE UPDATE ON whatsapp_media 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_webhooks_updated_at 
    BEFORE UPDATE ON whatsapp_webhooks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar mensagens antigas
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_messages(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM whatsapp_messages 
    WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * days_old
    AND status IN ('delivered', 'read', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de mensagens por período
CREATE OR REPLACE FUNCTION get_whatsapp_message_stats(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    message_type VARCHAR(20),
    direction VARCHAR(20),
    status VARCHAR(20),
    count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wm.message_type,
        wm.direction,
        wm.status,
        COUNT(*) as count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
    FROM whatsapp_messages wm
    WHERE wm.clinic_id = p_clinic_id 
    AND wm.created_at::date >= p_start_date
    AND wm.created_at::date <= p_end_date
    GROUP BY wm.message_type, wm.direction, wm.status
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar mensagens não processadas
CREATE OR REPLACE FUNCTION get_unprocessed_whatsapp_messages(
    p_clinic_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
    id UUID,
    patient_phone VARCHAR(20),
    message_type VARCHAR(20),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wm.id,
        wm.patient_phone,
        wm.message_type,
        wm.content,
        wm.created_at
    FROM whatsapp_messages wm
    WHERE wm.clinic_id = p_clinic_id
    AND wm.status = 'received'
    AND wm.direction = 'inbound'
    ORDER BY wm.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE whatsapp_messages IS 'Tabela para armazenar mensagens do WhatsApp';
COMMENT ON TABLE whatsapp_templates IS 'Tabela para armazenar templates de mensagens do WhatsApp';
COMMENT ON TABLE whatsapp_media IS 'Tabela para armazenar mídia do WhatsApp';
COMMENT ON TABLE whatsapp_webhooks IS 'Tabela para armazenar webhooks recebidos do WhatsApp';

COMMENT ON COLUMN whatsapp_messages.clinic_id IS 'ID da clínica (referência para tabela clinics)';
COMMENT ON COLUMN whatsapp_messages.patient_phone IS 'Telefone do paciente';
COMMENT ON COLUMN whatsapp_messages.message_type IS 'Tipo da mensagem (text, image, audio, etc.)';
COMMENT ON COLUMN whatsapp_messages.content IS 'Conteúdo da mensagem';
COMMENT ON COLUMN whatsapp_messages.direction IS 'Direção da mensagem (inbound/outbound)';
COMMENT ON COLUMN whatsapp_messages.whatsapp_message_id IS 'ID da mensagem no WhatsApp';
COMMENT ON COLUMN whatsapp_messages.conversation_id IS 'ID da conversa (referência para conversation service)';
COMMENT ON COLUMN whatsapp_messages.status IS 'Status da mensagem';
COMMENT ON COLUMN whatsapp_messages.metadata IS 'Metadados adicionais da mensagem';

COMMENT ON COLUMN whatsapp_templates.clinic_id IS 'ID da clínica (referência para tabela clinics)';
COMMENT ON COLUMN whatsapp_templates.name IS 'Nome do template';
COMMENT ON COLUMN whatsapp_templates.language_code IS 'Código do idioma (ex: pt-BR)';
COMMENT ON COLUMN whatsapp_templates.category IS 'Categoria do template';
COMMENT ON COLUMN whatsapp_templates.components IS 'Componentes do template em formato JSON';

COMMENT ON COLUMN whatsapp_media.clinic_id IS 'ID da clínica (referência para tabela clinics)';
COMMENT ON COLUMN whatsapp_media.whatsapp_media_id IS 'ID da mídia no WhatsApp';
COMMENT ON COLUMN whatsapp_media.media_type IS 'Tipo da mídia (image, audio, video, document)';
COMMENT ON COLUMN whatsapp_media.file_name IS 'Nome do arquivo';
COMMENT ON COLUMN whatsapp_media.mime_type IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN whatsapp_media.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN whatsapp_media.url IS 'URL para download da mídia';

COMMENT ON COLUMN whatsapp_webhooks.clinic_id IS 'ID da clínica (referência para tabela clinics)';
COMMENT ON COLUMN whatsapp_webhooks.webhook_data IS 'Dados do webhook recebido';
COMMENT ON COLUMN whatsapp_webhooks.processed IS 'Se o webhook foi processado';
COMMENT ON COLUMN whatsapp_webhooks.processing_result IS 'Resultado do processamento';

-- Inserir dados de exemplo (opcional para desenvolvimento)
-- INSERT INTO whatsapp_templates (clinic_id, name, language_code, category) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', 'welcome_message', 'pt-BR', 'greeting');

-- Verificar se as tabelas foram criadas corretamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('whatsapp_messages', 'whatsapp_templates', 'whatsapp_media', 'whatsapp_webhooks')
ORDER BY table_name, ordinal_position;
