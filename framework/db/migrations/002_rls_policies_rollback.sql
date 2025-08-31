-- =====================================================
-- ROLLBACK: 002_rls_policies_rollback.sql
-- Description: Rollback das políticas RLS
-- Author: database_architect
-- Date: 2025-01-20
-- Action: Remove políticas RLS e desabilita RLS
-- =====================================================

-- Log do rollback
INSERT INTO atendeai.audit_logs (
    clinic_id, user_id, action, table_name, record_id, 
    new_values, ip_address, user_agent
) VALUES (
    NULL, NULL, 'MIGRATION', 'schema', 'rls_policies_002_rollback', 
    '{"migration": "002_rls_policies_rollback.sql", "status": "started", "timestamp": "2025-01-20T15:30:00Z"}'::jsonb,
    '127.0.0.1', 'database-architect'
);

-- =====================================================
-- REMOVER POLÍTICAS RLS
-- =====================================================

-- Remover políticas atendeai schema
DROP POLICY IF EXISTS clinics_admin_full_access ON atendeai.clinics;
DROP POLICY IF EXISTS clinics_user_read_own ON atendeai.clinics;
DROP POLICY IF EXISTS users_admin_full_access ON atendeai.users;
DROP POLICY IF EXISTS users_manager_clinic_access ON atendeai.users;
DROP POLICY IF EXISTS users_self_read ON atendeai.users;
DROP POLICY IF EXISTS audit_logs_admin_read ON atendeai.audit_logs;
DROP POLICY IF EXISTS audit_logs_clinic_read ON atendeai.audit_logs;

-- Remover políticas conversation schema
DROP POLICY IF EXISTS conversations_clinic_isolation ON conversation.conversations;
DROP POLICY IF EXISTS messages_clinic_isolation ON conversation.messages;
DROP POLICY IF EXISTS conversation_tags_clinic_isolation ON conversation.conversation_tags;
DROP POLICY IF EXISTS whatsapp_service_access ON conversation.conversations;
DROP POLICY IF EXISTS whatsapp_service_messages ON conversation.messages;

-- Remover políticas appointment schema
DROP POLICY IF EXISTS appointments_clinic_isolation ON appointment.appointments;
DROP POLICY IF EXISTS appointment_types_clinic_isolation ON appointment.appointment_types;
DROP POLICY IF EXISTS google_integrations_clinic_isolation ON appointment.google_integrations;

-- =====================================================
-- DESABILITAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE atendeai.clinics DISABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.audit_logs DISABLE ROW LEVEL SECURITY;

ALTER TABLE conversation.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation.conversation_tags DISABLE ROW LEVEL SECURITY;

ALTER TABLE appointment.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment.appointment_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment.google_integrations DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- REMOVER ÍNDICES RLS
-- =====================================================

DROP INDEX IF EXISTS idx_users_auth_uid;
DROP INDEX IF EXISTS idx_conversations_clinic_rls;

-- =====================================================
-- REMOVER FUNÇÕES HELPER
-- =====================================================

DROP FUNCTION IF EXISTS test_clinic_isolation();
DROP FUNCTION IF EXISTS get_current_user_clinic_id();
DROP FUNCTION IF EXISTS is_admin_or_support();
DROP FUNCTION IF EXISTS can_manage_users();

-- =====================================================
-- REVOGAR GRANTS
-- =====================================================

REVOKE ALL ON SCHEMA atendeai FROM authenticated;
REVOKE ALL ON SCHEMA conversation FROM authenticated;
REVOKE ALL ON SCHEMA appointment FROM authenticated;

REVOKE ALL ON atendeai.clinics FROM authenticated;
REVOKE ALL ON atendeai.users FROM authenticated;
REVOKE ALL ON atendeai.audit_logs FROM authenticated;

REVOKE ALL ON conversation.conversations FROM authenticated;
REVOKE ALL ON conversation.messages FROM authenticated;
REVOKE ALL ON conversation.conversation_tags FROM authenticated;

REVOKE ALL ON appointment.appointments FROM authenticated;
REVOKE ALL ON appointment.appointment_types FROM authenticated;
REVOKE ALL ON appointment.google_integrations FROM authenticated;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Rollback RLS concluído - todas as políticas removidas e RLS desabilitado';
END
$$;
