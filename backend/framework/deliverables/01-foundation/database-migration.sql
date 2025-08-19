-- =====================================================
-- MIGRAÇÃO COMPLETA - ENTREGÁVEL 1: FUNDAÇÃO E INFRAESTRUTURA
-- ATENDEAI 2.0 - SUPABASE
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- SCHEMA PRINCIPAL
-- =====================================================
CREATE SCHEMA IF NOT EXISTS atendeai;

-- =====================================================
-- TABELAS BASE
-- =====================================================

-- Tabela de clínicas (tenant principal)
CREATE TABLE atendeai.clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários com isolamento por clínica
CREATE TABLE atendeai.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, email)
);

-- Tabela de roles
CREATE TABLE atendeai.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de permissões
CREATE TABLE atendeai.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento usuário-role
CREATE TABLE atendeai.user_roles (
    user_id UUID REFERENCES atendeai.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES atendeai.roles(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (user_id, role_id, clinic_id)
);

-- Tabela de relacionamento role-permissão
CREATE TABLE atendeai.role_permissions (
    role_id UUID REFERENCES atendeai.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES atendeai.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (role_id, permission_id)
);

-- Tabela de sessões JWT
CREATE TABLE atendeai.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES atendeai.users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id),
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, refresh_token_hash)
);

-- Tabela de auditoria (retenção de 6 meses)
CREATE TABLE atendeai.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id),
    user_id UUID REFERENCES atendeai.users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE atendeai.system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES atendeai.clinics(id),
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, config_key)
);

-- Tabela de API keys (para futuras integrações)
CREATE TABLE atendeai.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id),
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(clinic_id, name)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX idx_users_clinic_email ON atendeai.users(clinic_id, email);
CREATE INDEX idx_users_clinic_status ON atendeai.users(clinic_id, status);
CREATE INDEX idx_users_email ON atendeai.users(email);
CREATE INDEX idx_user_sessions_user_id ON atendeai.user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON atendeai.user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_clinic ON atendeai.user_sessions(clinic_id);
CREATE INDEX idx_audit_logs_clinic_created ON atendeai.audit_logs(clinic_id, created_at);
CREATE INDEX idx_audit_logs_user_action ON atendeai.audit_logs(user_id, action, created_at);
CREATE INDEX idx_audit_logs_created_at ON atendeai.audit_logs(created_at);

-- Índices para relacionamentos
CREATE INDEX idx_user_roles_user_clinic ON atendeai.user_roles(user_id, clinic_id);
CREATE INDEX idx_user_roles_role_clinic ON atendeai.user_roles(role_id, clinic_id);
CREATE INDEX idx_role_permissions_role ON atendeai.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON atendeai.role_permissions(permission_id);

-- Índices para configurações
CREATE INDEX idx_system_config_clinic ON atendeai.system_config(clinic_id);
CREATE INDEX idx_system_config_key ON atendeai.system_config(config_key);
CREATE INDEX idx_api_keys_clinic ON atendeai.api_keys(clinic_id);
CREATE INDEX idx_api_keys_status ON atendeai.api_keys(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE atendeai.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendeai.api_keys ENABLE ROW LEVEL SECURITY;

-- Políticas para isolamento por clínica
CREATE POLICY users_clinic_isolation ON atendeai.users
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY user_roles_clinic_isolation ON atendeai.user_roles
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY sessions_clinic_isolation ON atendeai.user_sessions
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY audit_clinic_isolation ON atendeai.audit_logs
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY config_clinic_isolation ON atendeai.system_config
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY api_keys_clinic_isolation ON atendeai.api_keys
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION atendeai.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON atendeai.users
    FOR EACH ROW EXECUTE FUNCTION atendeai.update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON atendeai.system_config
    FOR EACH ROW EXECUTE FUNCTION atendeai.update_updated_at_column();

-- Função para limpeza automática de logs (6 meses)
CREATE OR REPLACE FUNCTION atendeai.cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM atendeai.audit_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$ language 'plpgsql';

-- =====================================================
-- DADOS INICIAIS (SEED DATA)
-- =====================================================

-- Inserir clínica padrão para testes
INSERT INTO atendeai.clinics (id, name, cnpj, status) VALUES 
    (uuid_generate_v4(), 'Clínica Teste AtendeAI', '00.000.000/0001-00', 'active');

-- Inserir roles padrão
INSERT INTO atendeai.roles (name, description) VALUES 
    ('admin', 'Administrador com acesso total ao sistema'),
    ('manager', 'Gerente com acesso limitado'),
    ('user', 'Usuário padrão com acesso básico');

-- Inserir permissões básicas
INSERT INTO atendeai.permissions (name, resource, action) VALUES 
    ('users.read', 'users', 'read'),
    ('users.write', 'users', 'write'),
    ('users.delete', 'users', 'delete'),
    ('clinics.read', 'clinics', 'read'),
    ('clinics.write', 'clinics', 'write'),
    ('system.read', 'system', 'read'),
    ('system.write', 'system', 'write');

-- Associar permissões aos roles
INSERT INTO atendeai.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM atendeai.roles r, atendeai.permissions p
WHERE r.name = 'admin';

INSERT INTO atendeai.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM atendeai.roles r, atendeai.permissions p
WHERE r.name = 'manager' AND p.action IN ('read');

INSERT INTO atendeai.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM atendeai.roles r, atendeai.permissions p
WHERE r.name = 'user' AND p.action = 'read' AND p.resource IN ('users', 'clinics');

-- =====================================================
-- CONFIGURAÇÕES INICIAIS
-- =====================================================

-- Configuração padrão do sistema
INSERT INTO atendeai.system_config (clinic_id, config_key, config_value, description)
SELECT 
    c.id,
    'jwt_config',
    '{"access_token_expiry": "15m", "refresh_token_expiry": "7d", "algorithm": "HS256"}',
    'Configurações JWT para autenticação'
FROM atendeai.clinics c
WHERE c.name = 'Clínica Teste AtendeAI';

INSERT INTO atendeai.system_config (clinic_id, config_key, config_value, description)
SELECT 
    c.id,
    'rate_limiting',
    '{"login_attempts": 5, "window_minutes": 1, "jwt_validation_per_minute": 100}',
    'Configurações de rate limiting'
FROM atendeai.clinics c
WHERE c.name = 'Clínica Teste AtendeAI';

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON SCHEMA atendeai IS 'Schema principal do sistema AtendeAI 2.0';
COMMENT ON TABLE atendeai.clinics IS 'Tabela de clínicas (tenants) do sistema';
COMMENT ON TABLE atendeai.users IS 'Usuários do sistema com isolamento por clínica';
COMMENT ON TABLE atendeai.roles IS 'Roles do sistema RBAC';
COMMENT ON TABLE atendeai.permissions IS 'Permissões granulares do sistema';
COMMENT ON TABLE atendeai.user_sessions IS 'Sessões JWT dos usuários';
COMMENT ON TABLE atendeai.audit_logs IS 'Logs de auditoria com retenção de 6 meses';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'atendeai'
ORDER BY tablename;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'atendeai'
ORDER BY tablename;
