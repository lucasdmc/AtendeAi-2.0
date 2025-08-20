-- Migração para criar usuário de teste
BEGIN;

-- Inserir usuário de teste (admin_lify)
INSERT INTO atendeai.users (
    clinic_id,
    email,
    password_hash,
    first_name,
    last_name,
    status,
    role
) VALUES (
    'cf0b8ee4-b5ca-4f9d-a7bc-0cf9df8447c1', -- ID da clínica de teste
    'admin@lify.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8J/8KqKqKq', -- senha: admin123
    'Admin',
    'Lify',
    'active',
    'admin_lify'
);

-- Inserir usuário de teste (admin_clinic)
INSERT INTO atendeai.users (
    clinic_id,
    email,
    password_hash,
    first_name,
    last_name,
    status,
    role
) VALUES (
    'cf0b8ee4-b5ca-4f9d-a7bc-0cf9df8447c1', -- ID da clínica de teste
    'admin@clinica.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8J/8KqKqKq', -- senha: admin123
    'Admin',
    'Clínica',
    'active',
    'admin_clinic'
);

-- Inserir usuário de teste (attendant)
INSERT INTO atendeai.users (
    clinic_id,
    email,
    password_hash,
    first_name,
    last_name,
    status,
    role
) VALUES (
    'cf0b8ee4-b5ca-4f9d-a7bc-0cf9df8447c1', -- ID da clínica de teste
    'atendente@clinica.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8J/8KqKqKq', -- senha: admin123
    'Atendente',
    'Teste',
    'active',
    'attendant'
);

-- Verificar se os usuários foram criados
SELECT id, email, first_name, last_name, role, status FROM atendeai.users ORDER BY role;

COMMIT;
