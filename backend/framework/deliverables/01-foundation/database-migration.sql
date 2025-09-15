-- =====================================================
-- MIGRAÇÃO BASE - ATENDEAI 2.0
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schema principal
CREATE SCHEMA IF NOT EXISTS atendeai;

-- Tabela de clínicas
CREATE TABLE IF NOT EXISTS atendeai.clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
    meta_webhook_url VARCHAR(500),
    whatsapp_id VARCHAR(255),
    context_json JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS atendeai.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de roles
CREATE TABLE IF NOT EXISTS atendeai.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de user_roles
CREATE TABLE IF NOT EXISTS atendeai.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES atendeai.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES atendeai.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Tabela de audit_logs
CREATE TABLE IF NOT EXISTS atendeai.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES atendeai.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir roles padrão
INSERT INTO atendeai.roles (name, description) VALUES
    ('admin_lify', 'Administrador do sistema Lify'),
    ('suporte_lify', 'Suporte técnico Lify'),
    ('atendente', 'Atendente da clínica'),
    ('gestor', 'Gestor da clínica'),
    ('administrador', 'Administrador da clínica')
ON CONFLICT (name) DO NOTHING;

-- Inserir clínica padrão
INSERT INTO atendeai.clinics (id, name, whatsapp_number, context_json) VALUES
    ('1', 'Clínica AtendeAI', '554730915628', '{
        "clinica": {
            "informacoes_basicas": {
                "nome": "Clínica AtendeAI",
                "descricao": "Clínica especializada em atendimento médico de qualidade"
            },
            "localizacao": {
                "endereco_principal": "Rua das Flores, 123 - Centro"
            },
            "contatos": {
                "telefone_principal": "(47) 3091-5628",
                "email_principal": "contato@atendeai.com"
            }
        }
    }')
ON CONFLICT (whatsapp_number) DO NOTHING;

-- Criar usuário padrão
INSERT INTO atendeai.users (email, password_hash, first_name, last_name, clinic_id) VALUES
    ('lucas@lify.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Lucas', 'Cantoni', '1')
ON CONFLICT (email) DO NOTHING;

-- Associar usuário ao role admin_lify
INSERT INTO atendeai.user_roles (user_id, role_id) 
SELECT u.id, r.id 
FROM atendeai.users u, atendeai.roles r 
WHERE u.email = 'lucas@lify.com' AND r.name = 'admin_lify'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON atendeai.users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON atendeai.users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON atendeai.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_id ON atendeai.audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON atendeai.audit_logs(created_at);

-- Habilitar RLS
ALTER TABLE atendeai.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
CREATE POLICY clinics_isolation ON atendeai.clinics
    FOR ALL USING (true);

CREATE POLICY users_clinic_isolation ON atendeai.users
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY user_roles_clinic_isolation ON atendeai.user_roles
    FOR ALL USING (user_id IN (
        SELECT id FROM atendeai.users WHERE clinic_id = current_setting('app.current_clinic_id')::UUID
    ));

CREATE POLICY audit_logs_clinic_isolation ON atendeai.audit_logs
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);
