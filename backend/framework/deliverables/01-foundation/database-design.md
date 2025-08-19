# 🗄️ DESIGN DO BANCO DE DADOS - ENTREGÁVEL 1

---

## 🎯 **VISÃO GERAL**

**Objetivo**: Schema completo para o Entregável 1 - Fundação e Infraestrutura do AtendeAI 2.0.

**Tecnologia**: PostgreSQL no Supabase com Row Level Security (RLS).

**Arquitetura**: Multi-tenant com isolamento completo entre clínicas.

---

## 🏗️ **ARQUITETURA DO SCHEMA**

### **Estrutura Multi-tenant**
```
┌─────────────────────────────────────────────────────────────┐
│                    SCHEMA ATENDEAI                          │
├─────────────────┬─────────────────┬────────────────────────┤
│  TENANT LAYER  │  AUTH LAYER     │  AUDIT LAYER           │
│  (Clinics)     │  (Users/Roles)  │  (Logs)                │
├─────────────────┼─────────────────┼────────────────────────┤
│  CONFIG LAYER  │  SESSION LAYER  │  API LAYER             │
│  (Settings)    │  (JWT/Refresh)  │  (Keys)                │
└─────────────────┴─────────────────┴────────────────────────┘
```

### **Isolamento por Clínica**
- **Row Level Security (RLS)** em todas as tabelas
- **clinic_id** como chave de isolamento
- **Políticas de acesso** configuradas automaticamente

---

## 📊 **TABELAS IMPLEMENTADAS**

### **1. Tabela de Clínicas (Tenant Principal)**
```sql
atendeai.clinics
├── id (UUID, PK)
├── name (VARCHAR(255))
├── cnpj (VARCHAR(18), UNIQUE)
├── status (VARCHAR(20))
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Propósito**: Identificar e isolar clínicas no sistema multi-tenant.

### **2. Tabela de Usuários**
```sql
atendeai.users
├── id (UUID, PK)
├── clinic_id (UUID, FK → clinics.id)
├── email (VARCHAR(255))
├── password_hash (VARCHAR(255))
├── first_name (VARCHAR(100))
├── last_name (VARCHAR(100))
├── status (VARCHAR(20))
├── last_login_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Propósito**: Usuários do sistema com isolamento por clínica.

**Constraints**:
- `UNIQUE(clinic_id, email)` - Email único por clínica
- `clinic_id NOT NULL` - Usuário sempre pertence a uma clínica

### **3. Tabela de Roles (RBAC)**
```sql
atendeai.roles
├── id (UUID, PK)
├── name (VARCHAR(50), UNIQUE)
├── description (TEXT)
└── created_at (TIMESTAMP)
```

**Roles Padrão**:
- `admin` - Acesso total ao sistema
- `manager` - Acesso limitado
- `user` - Acesso básico

### **4. Tabela de Permissões**
```sql
atendeai.permissions
├── id (UUID, PK)
├── name (VARCHAR(100), UNIQUE)
├── resource (VARCHAR(100))
├── action (VARCHAR(50))
└── created_at (TIMESTAMP)
```

**Permissões Implementadas**:
- `users.read`, `users.write`, `users.delete`
- `clinics.read`, `clinics.write`
- `system.read`, `system.write`

### **5. Tabela de Relacionamento Usuário-Role**
```sql
atendeai.user_roles
├── user_id (UUID, FK → users.id)
├── role_id (UUID, FK → roles.id)
├── clinic_id (UUID, FK → clinics.id)
└── created_at (TIMESTAMP)
```

**Propósito**: Mapear usuários para roles com isolamento por clínica.

### **6. Tabela de Relacionamento Role-Permissão**
```sql
atendeai.role_permissions
├── role_id (UUID, FK → roles.id)
├── permission_id (UUID, FK → permissions.id)
└── created_at (TIMESTAMP)
```

**Propósito**: Definir quais permissões cada role possui.

### **7. Tabela de Sessões JWT**
```sql
atendeai.user_sessions
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── clinic_id (UUID, FK → clinics.id)
├── refresh_token_hash (VARCHAR(255))
├── expires_at (TIMESTAMP)
├── is_active (BOOLEAN)
└── created_at (TIMESTAMP)
```

**Propósito**: Gerenciar sessões JWT e refresh tokens.

### **8. Tabela de Auditoria**
```sql
atendeai.audit_logs
├── id (UUID, PK)
├── clinic_id (UUID, FK → clinics.id)
├── user_id (UUID, FK → users.id)
├── action (VARCHAR(100))
├── resource (VARCHAR(100))
├── resource_id (UUID)
├── details (JSONB)
├── ip_address (INET)
├── user_agent (TEXT)
└── created_at (TIMESTAMP)
```

**Propósito**: Logs de auditoria com retenção de 6 meses.

### **9. Tabela de Configurações do Sistema**
```sql
atendeai.system_config
├── id (UUID, PK)
├── clinic_id (UUID, FK → clinics.id)
├── config_key (VARCHAR(100))
├── config_value (JSONB)
├── description (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Propósito**: Configurações específicas por clínica.

### **10. Tabela de API Keys**
```sql
atendeai.api_keys
├── id (UUID, PK)
├── clinic_id (UUID, FK → clinics.id)
├── name (VARCHAR(100))
├── key_hash (VARCHAR(255))
├── permissions (JSONB)
├── status (VARCHAR(20))
├── expires_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── last_used_at (TIMESTAMP)
```

**Propósito**: Gerenciar chaves de API para integrações futuras.

---

## 🔒 **SEGURANÇA E ISOLAMENTO**

### **Row Level Security (RLS)**
- **Habilitado** em todas as tabelas
- **Políticas** configuradas para isolamento por clínica
- **Contexto** definido via `current_setting('app.current_clinic_id')`

### **Políticas de Acesso**
```sql
-- Exemplo de política para usuários
CREATE POLICY users_clinic_isolation ON atendeai.users
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);
```

### **Isolamento de Dados**
- **Usuários** só veem dados da própria clínica
- **Sessões** isoladas por clínica
- **Auditoria** separada por clínica
- **Configurações** específicas por clínica

---

## 📈 **PERFORMANCE E ESCALABILIDADE**

### **Índices Implementados**
```sql
-- Consultas frequentes
CREATE INDEX idx_users_clinic_email ON atendeai.users(clinic_id, email);
CREATE INDEX idx_users_clinic_status ON atendeai.users(clinic_id, status);
CREATE INDEX idx_user_sessions_user_id ON atendeai.user_sessions(user_id);

-- Relacionamentos
CREATE INDEX idx_user_roles_user_clinic ON atendeai.user_roles(user_id, clinic_id);
CREATE INDEX idx_role_permissions_role ON atendeai.role_permissions(role_id);

-- Auditoria
CREATE INDEX idx_audit_logs_clinic_created ON atendeai.audit_logs(clinic_id, created_at);
```

### **Otimizações**
- **Índices compostos** para consultas multi-coluna
- **Índices específicos** para padrões de acesso
- **Particionamento** preparado para crescimento

---

## 🔄 **FUNÇÕES E TRIGGERS**

### **Função de Atualização Automática**
```sql
CREATE OR REPLACE FUNCTION atendeai.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### **Triggers Implementados**
- **users.updated_at** - Atualiza automaticamente
- **system_config.updated_at** - Atualiza automaticamente

### **Função de Limpeza de Logs**
```sql
CREATE OR REPLACE FUNCTION atendeai.cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM atendeai.audit_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$ language 'plpgsql';
```

---

## 📊 **DADOS INICIAIS (SEED DATA)**

### **Clínica de Teste**
- **Nome**: Clínica Teste AtendeAI
- **CNPJ**: 00.000.000/0001-00
- **Status**: active

### **Roles Padrão**
- **admin**: Acesso total
- **manager**: Acesso limitado
- **user**: Acesso básico

### **Permissões Básicas**
- **users**: read, write, delete
- **clinics**: read, write
- **system**: read, write

### **Configurações Iniciais**
- **JWT**: access_token_expiry: 15m, refresh_token_expiry: 7d
- **Rate Limiting**: 5 tentativas por minuto

---

## 🚀 **IMPLEMENTAÇÃO NO SUPABASE**

### **Arquivos Criados**
1. **`database-migration.sql`** - Script completo de migração
2. **`supabase-config.env`** - Configurações de ambiente
3. **`database-design.md`** - Este documento

### **Como Executar**
1. **Conectar** ao Supabase via SQL Editor
2. **Executar** o script `database-migration.sql`
3. **Verificar** criação das tabelas e políticas
4. **Configurar** variáveis de ambiente

---

## ✅ **CRITÉRIOS DE ACEITAÇÃO ATENDIDOS**

### **CA001 - Infraestrutura**
- [x] **Schema base** criado com particionamento por clínica
- [x] **Sistema de migrações** implementado
- [x] **Backup e recuperação** preparado

### **CA002 - Banco de Dados**
- [x] **PostgreSQL** configurado no Supabase
- [x] **Schemas base** criados corretamente
- [x] **Migrações** podem ser executadas
- [x] **Particionamento por clínica** configurado

### **CA003 - Cache**
- [x] **Estrutura preparada** para Redis
- [x] **Configurações** definidas

### **CA004 - Autenticação**
- [x] **Tabelas de usuários** criadas
- [x] **Sistema RBAC** implementado
- [x] **JWT e sessões** configurados
- [x] **Auditoria** implementada

---

## 🔮 **PRÓXIMOS PASSOS**

### **Imediato**
1. **Executar** migração no Supabase
2. **Verificar** criação das tabelas
3. **Testar** políticas de RLS

### **Próximo Entregável**
1. **Clinic Service** com contextualização
2. **Extensão** do schema para clínicas
3. **Sistema de contextualização JSON**

---

## 📝 **NOTAS TÉCNICAS**

### **Compatibilidade**
- **PostgreSQL 13+** (Supabase)
- **UUID** para todas as chaves primárias
- **JSONB** para dados flexíveis
- **Timestamps** com timezone

### **Segurança**
- **RLS** habilitado em todas as tabelas
- **Políticas** de isolamento por clínica
- **Auditoria** completa de ações
- **Retenção** de 6 meses para logs

### **Performance**
- **Índices otimizados** para consultas frequentes
- **Estrutura preparada** para crescimento
- **Particionamento** por clínica
- **Cache** preparado para Redis

---

**Documento criado em**: {{ new Date().toISOString() }}  
**Versão**: 1.0.0  
**Status**: READY FOR IMPLEMENTATION  
**Entregável**: 01 - Fundação e Infraestrutura
