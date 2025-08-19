-- Migration para Conversation Service
-- Criar tabelas necessárias para o sistema de conversação

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'text',
    direction VARCHAR(20) NOT NULL DEFAULT 'inbound',
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversations_clinic_id ON conversations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_conversations_patient_phone ON conversations(patient_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_clinic_id ON messages(clinic_id);
CREATE INDEX IF NOT EXISTS idx_messages_patient_phone ON messages(patient_phone);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_conversations_clinic_phone ON conversations(clinic_id, patient_phone);
CREATE INDEX IF NOT EXISTS idx_messages_clinic_phone_time ON messages(clinic_id, patient_phone, timestamp);

-- Constraints
ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_clinic_id 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT fk_messages_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT fk_messages_clinic_id 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

-- Constraints de validação
ALTER TABLE conversations 
ADD CONSTRAINT chk_conversations_status 
CHECK (status IN ('active', 'closed', 'archived'));

ALTER TABLE messages 
ADD CONSTRAINT chk_messages_type 
CHECK (type IN ('text', 'image', 'audio', 'video', 'document'));

ALTER TABLE messages 
ADD CONSTRAINT chk_messages_direction 
CHECK (direction IN ('inbound', 'outbound'));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar conversas antigas (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_conversations(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM conversations 
    WHERE status = 'closed' 
    AND last_message_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE conversations IS 'Tabela para armazenar conversas entre pacientes e clínicas';
COMMENT ON TABLE messages IS 'Tabela para armazenar mensagens individuais das conversas';
COMMENT ON COLUMN conversations.clinic_id IS 'ID da clínica (referência para tabela clinics)';
COMMENT ON COLUMN conversations.patient_phone IS 'Telefone do paciente (formato internacional)';
COMMENT ON COLUMN conversations.patient_name IS 'Nome do paciente';
COMMENT ON COLUMN conversations.status IS 'Status da conversa: active, closed, archived';
COMMENT ON COLUMN conversations.last_message IS 'Última mensagem da conversa';
COMMENT ON COLUMN conversations.last_message_at IS 'Timestamp da última mensagem';

COMMENT ON COLUMN messages.conversation_id IS 'ID da conversa (referência para tabela conversations)';
COMMENT ON COLUMN messages.clinic_id IS 'ID da clínica (referência para tabela clinics)';
COMMENT ON COLUMN messages.patient_phone IS 'Telefone do paciente';
COMMENT ON COLUMN messages.content IS 'Conteúdo da mensagem';
COMMENT ON COLUMN messages.type IS 'Tipo da mensagem: text, image, audio, video, document';
COMMENT ON COLUMN messages.direction IS 'Direção da mensagem: inbound (recebida), outbound (enviada)';
COMMENT ON COLUMN messages.metadata IS 'Metadados adicionais da mensagem em formato JSON';
COMMENT ON COLUMN messages.timestamp IS 'Timestamp da mensagem';

-- Inserir dados de exemplo (opcional para desenvolvimento)
-- INSERT INTO conversations (clinic_id, patient_phone, patient_name, status) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', '+5511999999999', 'João Silva', 'active');

-- Verificar se as tabelas foram criadas corretamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('conversations', 'messages')
ORDER BY table_name, ordinal_position;
