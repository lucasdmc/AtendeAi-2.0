-- =====================================================
-- ROLLBACK: 001_core_schema_rollback.sql
-- Description: Rollback da migração 001_core_schema.sql
-- Author: database_architect
-- Date: 2025-01-20
-- Action: Remove todos os schemas e estruturas criadas
-- =====================================================

-- Log do rollback
INSERT INTO atendeai.audit_logs (
    clinic_id, user_id, action, table_name, record_id, 
    new_values, ip_address, user_agent
) VALUES (
    NULL, NULL, 'MIGRATION', 'schema', 'core_schema_001_rollback', 
    '{"migration": "001_core_schema_rollback.sql", "status": "started", "timestamp": "2025-01-20T15:00:00Z"}'::jsonb,
    '127.0.0.1', 'database-architect'
);

-- =====================================================
-- REMOVER TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS audit_appointments ON appointment.appointments;
DROP TRIGGER IF EXISTS audit_users ON atendeai.users;
DROP TRIGGER IF EXISTS audit_clinics ON atendeai.clinics;

-- =====================================================
-- REMOVER FUNÇÃO DE AUDITORIA
-- =====================================================

DROP FUNCTION IF EXISTS trigger_audit_log();

-- =====================================================
-- REMOVER ÍNDICES (serão removidos automaticamente com as tabelas)
-- =====================================================

-- Índices são removidos automaticamente quando as tabelas são removidas

-- =====================================================
-- REMOVER TABELAS EM ORDEM DE DEPENDÊNCIA
-- =====================================================

-- Appointment schema
DROP TABLE IF EXISTS appointment.google_integrations;
DROP TABLE IF EXISTS appointment.appointment_types;
DROP TABLE IF EXISTS appointment.appointments;

-- Conversation schema
DROP TABLE IF EXISTS conversation.conversation_tags;
DROP TABLE IF EXISTS conversation.messages;
DROP TABLE IF EXISTS conversation.conversations;

-- AtendeAI schema
DROP TABLE IF EXISTS atendeai.audit_logs;
DROP TABLE IF EXISTS atendeai.users;
DROP TABLE IF EXISTS atendeai.clinics;

-- =====================================================
-- REMOVER SCHEMAS
-- =====================================================

DROP SCHEMA IF EXISTS appointment CASCADE;
DROP SCHEMA IF EXISTS conversation CASCADE;
DROP SCHEMA IF EXISTS atendeai CASCADE;
DROP SCHEMA IF EXISTS whatsapp CASCADE;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se os schemas foram removidos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name IN ('atendeai', 'conversation', 'appointment', 'whatsapp')) THEN
        RAISE NOTICE 'ATENÇÃO: Alguns schemas ainda existem após rollback';
    ELSE
        RAISE NOTICE 'Rollback concluído com sucesso - todos os schemas removidos';
    END IF;
END
$$;
