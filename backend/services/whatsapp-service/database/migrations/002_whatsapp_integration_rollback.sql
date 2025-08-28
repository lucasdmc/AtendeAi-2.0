-- Rollback Migration: 002_whatsapp_integration_rollback.sql
-- Description: Reverter implementação da integração WhatsApp com Meta
-- Author: Expert Developer
-- Date: 2024-01-15

-- Log de início do rollback
INSERT INTO atendeai.audit_logs (
    clinic_id, user_id, action, table_name, record_id, 
    new_values, ip_address, user_agent
) VALUES (
    NULL, NULL, 'ROLLBACK', 'schema', 'whatsapp', 
    '{"migration": "002_whatsapp_integration", "status": "rollback_started", "timestamp": "2024-01-15T00:00:00Z"}'::jsonb,
    '127.0.0.1', 'rollback-script'
);

-- Remover triggers
DROP TRIGGER IF EXISTS audit_messages_changes ON whatsapp.messages;

-- Remover funções
DROP FUNCTION IF EXISTS whatsapp.audit_message_changes();

-- Remover views
DROP VIEW IF EXISTS whatsapp.active_conversations;
DROP VIEW IF EXISTS whatsapp.messages_metrics;

-- Remover tabelas na ordem correta (dependências)
DROP TABLE IF EXISTS whatsapp.message_processing_logs;
DROP TABLE IF EXISTS whatsapp.conversation_sessions;
DROP TABLE IF EXISTS whatsapp.webhook_events;
DROP TABLE IF EXISTS whatsapp.messages;

-- Remover schema
DROP SCHEMA IF EXISTS whatsapp CASCADE;

-- Log de conclusão do rollback
INSERT INTO atendeai.audit_logs (
    clinic_id, user_id, action, table_name, record_id, 
    new_values, ip_address, user_agent
) VALUES (
    NULL, NULL, 'ROLLBACK', 'schema', 'whatsapp', 
    '{"migration": "002_whatsapp_integration", "status": "rollback_completed", "timestamp": "2024-01-15T00:00:00Z"}'::jsonb,
    '127.0.0.1', 'rollback-script'
);
