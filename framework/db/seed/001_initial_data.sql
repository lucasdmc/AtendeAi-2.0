-- =====================================================
-- SEED: 001_initial_data.sql
-- Description: Dados iniciais mínimos para funcionamento
-- Author: database_architect
-- Date: 2025-01-20
-- Idempotent: Sim (usa ON CONFLICT)
-- =====================================================

-- =====================================================
-- CLÍNICA DEMO PARA TESTES
-- =====================================================

-- Inserir clínica demo (idempotente)
INSERT INTO atendeai.clinics (
    id,
    name,
    whatsapp_number,
    meta_webhook_url,
    whatsapp_id,
    context_json,
    simulation_mode,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Clínica Demo',
    '+5511999999999',
    'https://webhook.example.com/whatsapp',
    'demo_whatsapp_id',
    '{
        "agente_ia": {
            "configuracao": {
                "nome": "Dr. Virtual",
                "personalidade": "Profissional e acolhedor",
                "tom_comunicacao": "Formal mas amigável",
                "saudacao_inicial": "Olá! Sou o assistente virtual da Clínica Demo. Como posso ajudá-lo?",
                "mensagem_despedida": "Obrigado pelo contato! Tenha um ótimo dia!",
                "mensagem_fora_horario": "No momento estamos fora do horário de atendimento. Nossa equipe responderá em breve."
            },
            "comportamento": {
                "proativo": true,
                "oferece_sugestoes": true,
                "escalacao_automatica": true
            }
        },
        "horario_funcionamento": {
            "segunda": {"abertura": "08:00", "fechamento": "18:00"},
            "terca": {"abertura": "08:00", "fechamento": "18:00"},
            "quarta": {"abertura": "08:00", "fechamento": "18:00"},
            "quinta": {"abertura": "08:00", "fechamento": "18:00"},
            "sexta": {"abertura": "08:00", "fechamento": "18:00"},
            "sabado": {"abertura": "08:00", "fechamento": "12:00"},
            "domingo": {"abertura": "00:00", "fechamento": "00:00"}
        }
    }'::jsonb,
    false,
    'active'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    context_json = EXCLUDED.context_json,
    updated_at = NOW();

-- =====================================================
-- USUÁRIO ADMIN LIFY INICIAL
-- =====================================================

-- Inserir usuário Admin Lify (senha: admin123 hasheada)
INSERT INTO atendeai.users (
    id,
    name,
    login,
    password_hash,
    role,
    clinic_id,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'Admin Sistema',
    'admin@lify.com',
    '$2b$12$LQv3c1yqBwkVsvGODM8qL.KgQ8gQMXhYKzFjgPL3QLCHFqyGJ8K6a', -- admin123
    'admin_lify',
    '550e8400-e29b-41d4-a716-446655440000',
    'active'
) ON CONFLICT (login) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- =====================================================
-- USUÁRIO ADMIN CLÍNICA DEMO
-- =====================================================

-- Inserir usuário Admin Clínica (senha: clinica123 hasheada)
INSERT INTO atendeai.users (
    id,
    name,
    login,
    password_hash,
    role,
    clinic_id,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'Administrador Clínica Demo',
    'admin@clinicademo.com',
    '$2b$12$8TqYvzKQzXGYgT4FjdQeB.nQnNzYXJhGzFj7PQzpL3tNqVmGjHKE2', -- clinica123
    'administrador',
    '550e8400-e29b-41d4-a716-446655440000',
    'active'
) ON CONFLICT (login) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- =====================================================
-- USUÁRIO ATENDENTE DEMO
-- =====================================================

-- Inserir usuário Atendente (senha: atendente123 hasheada)
INSERT INTO atendeai.users (
    id,
    name,
    login,
    password_hash,
    role,
    clinic_id,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'Atendente Demo',
    'atendente@clinicademo.com',
    '$2b$12$9UwZxLRzYHZhU5GkEqFdC.oRoRoYzAkGaGk8QRaqM4uOqWnHkJLF3', -- atendente123
    'atendente',
    '550e8400-e29b-41d4-a716-446655440000',
    'active'
) ON CONFLICT (login) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- =====================================================
-- TIPOS DE AGENDAMENTO PADRÃO
-- =====================================================

-- Inserir tipos de agendamento padrão
INSERT INTO appointment.appointment_types (
    id,
    clinic_id,
    name,
    description,
    default_duration,
    color,
    priority,
    requires_confirmation,
    auto_confirmation_hours
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440000',
    'Consulta Geral',
    'Consulta médica geral',
    30,
    '#4285f4',
    1,
    true,
    24
),
(
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440000',
    'Consulta de Retorno',
    'Consulta de retorno/acompanhamento',
    20,
    '#34a853',
    2,
    true,
    24
),
(
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440000',
    'Exame',
    'Realização de exames',
    45,
    '#fbbc04',
    3,
    true,
    48
),
(
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440000',
    'Emergência',
    'Atendimento de emergência',
    60,
    '#ea4335',
    10,
    false,
    1
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    updated_at = NOW();

-- =====================================================
-- ETIQUETAS DE CONVERSA PADRÃO
-- =====================================================

-- Inserir etiquetas padrão para conversas
INSERT INTO conversation.conversation_tags (
    id,
    clinic_id,
    name,
    color,
    description
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440000',
    'Agendamento',
    '#4285f4',
    'Conversas relacionadas a agendamentos'
),
(
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440000',
    'Cancelamento',
    '#ea4335',
    'Conversas sobre cancelamentos'
),
(
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440000',
    'Informações',
    '#34a853',
    'Solicitações de informações gerais'
),
(
    '550e8400-e29b-41d4-a716-446655440023',
    '550e8400-e29b-41d4-a716-446655440000',
    'Suporte',
    '#ff9800',
    'Questões de suporte técnico'
),
(
    '550e8400-e29b-41d4-a716-446655440024',
    '550e8400-e29b-41d4-a716-446655440000',
    'Urgente',
    '#f44336',
    'Conversas que requerem atenção urgente'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    updated_at = NOW();

-- =====================================================
-- CONVERSA DEMO (OPCIONAL)
-- =====================================================

-- Inserir conversa demo para testes
INSERT INTO conversation.conversations (
    id,
    clinic_id,
    customer_phone,
    conversation_type,
    status,
    bot_active,
    tags
) VALUES (
    '550e8400-e29b-41d4-a716-446655440030',
    '550e8400-e29b-41d4-a716-446655440000',
    '+5511888888888',
    'chatbot',
    'active',
    true,
    '["550e8400-e29b-41d4-a716-446655440020"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = NOW();

-- Inserir mensagem demo
INSERT INTO conversation.messages (
    id,
    conversation_id,
    sender_type,
    content,
    message_type,
    timestamp
) VALUES (
    '550e8400-e29b-41d4-a716-446655440040',
    '550e8400-e29b-41d4-a716-446655440030',
    'customer',
    'Olá, gostaria de agendar uma consulta',
    'text',
    NOW() - INTERVAL '5 minutes'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO conversation.messages (
    id,
    conversation_id,
    sender_type,
    content,
    message_type,
    timestamp
) VALUES (
    '550e8400-e29b-41d4-a716-446655440041',
    '550e8400-e29b-41d4-a716-446655440030',
    'bot',
    'Olá! Sou o assistente virtual da Clínica Demo. Ficarei feliz em ajudá-lo com o agendamento. Qual tipo de consulta você precisa?',
    'text',
    NOW() - INTERVAL '4 minutes'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- LOG DA SEED
-- =====================================================

-- Log do seed
INSERT INTO atendeai.audit_logs (
    clinic_id, user_id, action, table_name, record_id, 
    new_values, ip_address, user_agent
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    NULL, 
    'MIGRATION', 
    'seed', 
    'initial_data_001', 
    '{"seed": "001_initial_data.sql", "status": "completed", "timestamp": "2025-01-20T15:45:00Z", "records_inserted": "clinic_demo+users+types+tags+conversation"}'::jsonb,
    '127.0.0.1', 
    'database-architect'
);

-- =====================================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- =====================================================

-- Função para verificar se os dados foram inseridos corretamente
DO $$
DECLARE
    clinic_count INTEGER;
    user_count INTEGER;
    type_count INTEGER;
    tag_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO clinic_count FROM atendeai.clinics;
    SELECT COUNT(*) INTO user_count FROM atendeai.users;
    SELECT COUNT(*) INTO type_count FROM appointment.appointment_types;
    SELECT COUNT(*) INTO tag_count FROM conversation.conversation_tags;
    
    RAISE NOTICE 'Seed concluído com sucesso:';
    RAISE NOTICE '- Clínicas: %', clinic_count;
    RAISE NOTICE '- Usuários: %', user_count;
    RAISE NOTICE '- Tipos de agendamento: %', type_count;
    RAISE NOTICE '- Etiquetas: %', tag_count;
END
$$;
