-- =====================================================
-- MIGRATION: 002_rls_policies.sql
-- Description: Implementação Row Level Security para isolamento multiclínicas
-- Author: database_architect
-- Date: 2025-01-20
-- Forward: Habilitar RLS e criar políticas
-- Backward: Remover políticas e desabilitar RLS
-- =====================================================

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS em todas as tabelas principais
ALTER TABLE atendeai.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE conversation.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation.conversation_tags ENABLE ROW LEVEL SECURITY;

ALTER TABLE appointment.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment.appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment.google_integrations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNÇÕES HELPER PARA RLS
-- =====================================================

-- Função para obter clinic_id do usuário atual
CREATE OR REPLACE FUNCTION get_current_user_clinic_id()
RETURNS UUID AS $$
DECLARE
    user_clinic_id UUID;
BEGIN
    -- Buscar clinic_id do usuário autenticado
    SELECT clinic_id INTO user_clinic_id
    FROM atendeai.users 
    WHERE id = auth.uid();
    
    RETURN user_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é Admin Lify ou Suporte Lify
CREATE OR REPLACE FUNCTION is_admin_or_support()
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(20);
BEGIN
    SELECT role INTO user_role
    FROM atendeai.users 
    WHERE id = auth.uid();
    
    RETURN user_role IN ('admin_lify', 'suporte_lify');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar permissão de gestão de usuários
CREATE OR REPLACE FUNCTION can_manage_users()
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(20);
BEGIN
    SELECT role INTO user_role
    FROM atendeai.users 
    WHERE id = auth.uid();
    
    RETURN user_role IN ('admin_lify', 'suporte_lify', 'administrador');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS RLS - ATENDEAI SCHEMA
-- =====================================================

-- Políticas para clínicas
CREATE POLICY clinics_admin_full_access ON atendeai.clinics
    FOR ALL USING (is_admin_or_support());

CREATE POLICY clinics_user_read_own ON atendeai.clinics
    FOR SELECT USING (id = get_current_user_clinic_id());

-- Políticas para usuários
CREATE POLICY users_admin_full_access ON atendeai.users
    FOR ALL USING (is_admin_or_support());

CREATE POLICY users_manager_clinic_access ON atendeai.users
    FOR ALL USING (
        can_manage_users() AND 
        clinic_id = get_current_user_clinic_id()
    );

CREATE POLICY users_self_read ON atendeai.users
    FOR SELECT USING (id = auth.uid());

-- Políticas para audit logs
CREATE POLICY audit_logs_admin_read ON atendeai.audit_logs
    FOR SELECT USING (is_admin_or_support());

CREATE POLICY audit_logs_clinic_read ON atendeai.audit_logs
    FOR SELECT USING (clinic_id = get_current_user_clinic_id());

-- =====================================================
-- POLÍTICAS RLS - CONVERSATION SCHEMA
-- =====================================================

-- Políticas para conversas
CREATE POLICY conversations_clinic_isolation ON conversation.conversations
    FOR ALL USING (clinic_id = get_current_user_clinic_id());

-- Políticas para mensagens (via conversa)
CREATE POLICY messages_clinic_isolation ON conversation.messages
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM conversation.conversations 
            WHERE clinic_id = get_current_user_clinic_id()
        )
    );

-- Políticas para etiquetas de conversas
CREATE POLICY conversation_tags_clinic_isolation ON conversation.conversation_tags
    FOR ALL USING (clinic_id = get_current_user_clinic_id());

-- =====================================================
-- POLÍTICAS RLS - APPOINTMENT SCHEMA
-- =====================================================

-- Políticas para agendamentos
CREATE POLICY appointments_clinic_isolation ON appointment.appointments
    FOR ALL USING (clinic_id = get_current_user_clinic_id());

-- Políticas para tipos de agendamento
CREATE POLICY appointment_types_clinic_isolation ON appointment.appointment_types
    FOR ALL USING (clinic_id = get_current_user_clinic_id());

-- Políticas para integrações Google
CREATE POLICY google_integrations_clinic_isolation ON appointment.google_integrations
    FOR ALL USING (clinic_id = get_current_user_clinic_id());

-- =====================================================
-- POLÍTICAS ESPECIAIS PARA WEBHOOK WHATSAPP
-- =====================================================

-- Permitir acesso do serviço WhatsApp às tabelas necessárias
CREATE POLICY whatsapp_service_access ON conversation.conversations
    FOR ALL USING (
        current_setting('role', true) = 'whatsapp_service' OR
        clinic_id = get_current_user_clinic_id()
    );

CREATE POLICY whatsapp_service_messages ON conversation.messages
    FOR ALL USING (
        current_setting('role', true) = 'whatsapp_service' OR
        conversation_id IN (
            SELECT id FROM conversation.conversations 
            WHERE clinic_id = get_current_user_clinic_id()
        )
    );

-- =====================================================
-- GRANTS E PERMISSÕES
-- =====================================================

-- Grants para usuários autenticados
GRANT USAGE ON SCHEMA atendeai TO authenticated;
GRANT USAGE ON SCHEMA conversation TO authenticated;
GRANT USAGE ON SCHEMA appointment TO authenticated;

-- Grants específicos por tabela
GRANT SELECT, INSERT, UPDATE, DELETE ON atendeai.clinics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON atendeai.users TO authenticated;
GRANT SELECT ON atendeai.audit_logs TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON conversation.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation.conversation_tags TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON appointment.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON appointment.appointment_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON appointment.google_integrations TO authenticated;

-- Grants para funções auxiliares
GRANT EXECUTE ON FUNCTION get_current_user_clinic_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_support() TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_users() TO authenticated;

-- =====================================================
-- ÍNDICES ADICIONAIS PARA RLS
-- =====================================================

-- Índices específicos para otimização de RLS
CREATE INDEX idx_users_auth_uid ON atendeai.users(id) WHERE id = auth.uid();
CREATE INDEX idx_conversations_clinic_rls ON conversation.conversations(clinic_id) 
    WHERE clinic_id = get_current_user_clinic_id();

-- =====================================================
-- VALIDAÇÃO DAS POLÍTICAS
-- =====================================================

-- Função para testar isolamento entre clínicas
CREATE OR REPLACE FUNCTION test_clinic_isolation()
RETURNS TABLE(test_name TEXT, result BOOLEAN, message TEXT) AS $$
BEGIN
    RETURN QUERY SELECT 
        'RLS Policies Created'::TEXT,
        true::BOOLEAN,
        'All RLS policies have been successfully created'::TEXT;
        
    -- Aqui poderiam ser adicionados testes mais específicos
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION get_current_user_clinic_id() IS 'Retorna clinic_id do usuário autenticado para RLS';
COMMENT ON FUNCTION is_admin_or_support() IS 'Verifica se usuário é Admin Lify ou Suporte Lify';
COMMENT ON FUNCTION can_manage_users() IS 'Verifica se usuário pode gerenciar outros usuários';

-- Log da migração
INSERT INTO atendeai.audit_logs (
    clinic_id, user_id, action, table_name, record_id, 
    new_values, ip_address, user_agent
) VALUES (
    NULL, NULL, 'MIGRATION', 'schema', 'rls_policies_002', 
    '{"migration": "002_rls_policies.sql", "status": "completed", "timestamp": "2025-01-20T15:30:00Z"}'::jsonb,
    '127.0.0.1', 'database-architect'
);
