# 🗄️ DESIGN DE BANCO DE DADOS - ATENDEAÍ 2.0

---

## 🎯 **RESUMO EXECUTIVO**

**Projeto**: AtendeAí 2.0 - Schema de Banco de Dados  
**Data**: 2024-01-15  
**Arquiteto**: Senior Database Architect (DBA)  
**Status**: DESIGN COMPLETO  

### **Objetivo**
Projetar schema robusto e escalável para sistema multi-tenant com isolamento completo, suportando usuários, clínicas, conversas WhatsApp, agendamentos Google Calendar e sistema de perfis hierárquicos.

---

## 🏗️ **ARQUITETURA DO BANCO DE DADOS**

### **1. ESTRATÉGIA MULTI-TENANT ESCOLHIDA**

#### **1.1 Padrão: Coluna clinic_id**
- **Justificativa**: "Uso de coluna clinic_id em todas as tabelas para isolamento completo, permitindo particionamento futuro e mantendo simplicidade de queries"
- **Vantagens**: 
  - Simplicidade de implementação
  - Facilita particionamento por clínica
  - Queries diretas sem complexidade de schema
- **Desvantagens**: 
  - Necessidade de índices compostos
  - Validação de clinic_id em todas as operações

#### **1.2 Isolamento de Dados**
- **Row Level Security (RLS)**: Implementado via middleware de aplicação
- **Validação**: Todas as queries incluem filtro por clinic_id
- **Auditoria**: Log de todas as operações com clinic_id

### **2. ESTRATÉGIA DE PERFORMANCE**

#### **2.1 Indexação**
- **Índices Compostos**: (clinic_id, created_at) para consultas temporais
- **Índices Parciais**: Para status ativos e dados recentes
- **Índices de Texto**: Para busca em mensagens e contextualização

#### **2.2 Particionamento**
- **Estratégia**: Particionamento por clinic_id para tabelas grandes
- **Tabelas Candidatas**: whatsapp_messages, appointments, conversations
- **Benefício**: Consultas mais rápidas e manutenção simplificada

---

## 📊 **SCHEMA COMPLETO**

### **3. TABELAS PRINCIPAIS**

#### **3.1 Tabela: users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin_lify', 'admin_clinic', 'attendant')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT uk_users_email_clinic UNIQUE (email, clinic_id),
    CONSTRAINT fk_users_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_users_clinic_id ON users(clinic_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_clinic_role ON users(clinic_id, role);
```

**Justificativa**: "Estrutura normalizada para usuários com role hierárquico, permitindo controle granular de permissões por clínica. Índice composto (clinic_id, role) otimiza consultas de autorização."

#### **3.2 Tabela: clinics (Atualizada)**
```sql
-- Adicionar campos necessários para integrações
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_webhook_url TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_id_number VARCHAR(100);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_verify_token VARCHAR(255);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_client_id VARCHAR(255);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_client_secret TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Índices para novos campos
CREATE INDEX idx_clinics_whatsapp_id ON clinics(whatsapp_id_number);
CREATE INDEX idx_clinics_google_client ON clinics(google_client_id);
```

**Justificativa**: "Adição de campos para configuração de integrações externas, mantendo isolamento por clínica. Tokens OAuth2 armazenados de forma segura para renovação automática."

#### **3.3 Tabela: conversations**
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'transferred')),
    assigned_user_id UUID,
    is_bot_controlled BOOLEAN DEFAULT true,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_conversations_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversations_user_id FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_conversations_clinic_id ON conversations(clinic_id);
CREATE INDEX idx_conversations_patient_phone ON conversations(patient_phone);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_assigned_user ON conversations(assigned_user_id);
CREATE INDEX idx_conversations_bot_controlled ON conversations(is_bot_controlled);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at);
CREATE INDEX idx_conversations_clinic_status ON conversations(clinic_id, status);
CREATE INDEX idx_conversations_clinic_bot ON conversations(clinic_id, is_bot_controlled);
```

**Justificativa**: "Tabela de conversas com controle de transição bot/humano. Índice composto (clinic_id, status) otimiza consultas de conversas ativas por clínica."

#### **3.4 Tabela: appointments**
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
    google_event_id VARCHAR(255),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_appointments_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT uk_appointments_google_event UNIQUE (google_event_id),
    CONSTRAINT chk_appointments_time CHECK (end_time > start_time)
);

-- Índices para performance
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient_phone ON appointments(patient_phone);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_google_event ON appointments(google_event_id);
CREATE INDEX idx_appointments_clinic_status ON appointments(clinic_id, status);
CREATE INDEX idx_appointments_clinic_time ON appointments(clinic_id, start_time);
CREATE INDEX idx_appointments_clinic_patient ON appointments(clinic_id, patient_phone);
```

**Justificativa**: "Tabela de agendamentos com sincronização Google Calendar. Índice composto (clinic_id, start_time) otimiza consultas de próximos agendamentos por clínica."

#### **3.5 Tabela: google_calendar_tokens**
```sql
CREATE TABLE google_calendar_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_google_tokens_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT uk_google_tokens_clinic UNIQUE (clinic_id)
);

-- Índices para performance
CREATE INDEX idx_google_tokens_clinic_id ON google_calendar_tokens(clinic_id);
CREATE INDEX idx_google_tokens_expires ON google_calendar_tokens(expires_at);
CREATE INDEX idx_google_tokens_active ON google_calendar_tokens(is_active) WHERE is_active = true;
```

**Justificativa**: "Tabela separada para tokens Google OAuth2, permitindo renovação automática e auditoria completa. Índice em expires_at facilita limpeza de tokens expirados."

---

## 🔧 **ESTRATÉGIAS DE OTIMIZAÇÃO**

### **4. INDEXAÇÃO AVANÇADA**

#### **4.1 Índices Parciais para Performance**
```sql
-- Índice parcial para usuários ativos
CREATE INDEX idx_users_active_partial ON users(clinic_id, role) 
WHERE is_active = true;

-- Índice parcial para conversas ativas
CREATE INDEX idx_conversations_active_partial ON conversations(clinic_id, last_message_at) 
WHERE status = 'active';

-- Índice parcial para agendamentos futuros
CREATE INDEX idx_appointments_future_partial ON appointments(clinic_id, start_time) 
WHERE start_time > NOW() AND status IN ('scheduled', 'confirmed');
```

**Justificativa**: "Índices parciais reduzem tamanho do índice e melhoram performance para consultas específicas, como usuários ativos e agendamentos futuros."

#### **4.2 Índices de Texto para Busca**
```sql
-- Índice GIN para busca em mensagens
CREATE INDEX idx_whatsapp_messages_content_gin ON whatsapp_messages USING GIN (to_tsvector('portuguese', content));

-- Índice GIN para busca em contextualização
CREATE INDEX idx_clinics_context_gin ON clinics USING GIN (contextualization_json);
```

**Justificativa**: "Índices GIN permitem busca eficiente em texto e JSON, essencial para funcionalidades de busca e contextualização."

### **5. PARTICIONAMENTO PARA ESCALABILIDADE**

#### **5.1 Estratégia de Particionamento**
```sql
-- Particionamento por clinic_id para tabelas grandes
CREATE TABLE whatsapp_messages_partitioned (
    id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_name VARCHAR(100),
    message_type VARCHAR(20) NOT NULL,
    content TEXT,
    direction VARCHAR(20) NOT NULL,
    whatsapp_message_id VARCHAR(100),
    conversation_id UUID,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'received',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY HASH (clinic_id);

-- Criar partições (exemplo para 4 partições)
CREATE TABLE whatsapp_messages_part_0 PARTITION OF whatsapp_messages_partitioned
FOR VALUES WITH (modulus 4, remainder 0);

CREATE TABLE whatsapp_messages_part_1 PARTITION OF whatsapp_messages_partitioned
FOR VALUES WITH (modulus 4, remainder 1);

CREATE TABLE whatsapp_messages_part_2 PARTITION OF whatsapp_messages_partitioned
FOR VALUES WITH (modulus 4, remainder 2);

CREATE TABLE whatsapp_messages_part_3 PARTITION OF whatsapp_messages_partitioned
FOR VALUES WITH (modulus 4, remainder 3);
```

**Justificativa**: "Particionamento por clinic_id distribui dados uniformemente, melhorando performance de consultas e manutenção de tabelas grandes."

---

## 🔒 **SEGURANÇA E COMPLIANCE**

### **6. ROW LEVEL SECURITY (RLS)**

#### **6.1 Políticas de Segurança**
```sql
-- Habilitar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Política para usuários (cada usuário vê apenas dados da sua clínica)
CREATE POLICY users_clinic_isolation ON users
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

-- Política para conversas
CREATE POLICY conversations_clinic_isolation ON conversations
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

-- Política para agendamentos
CREATE POLICY appointments_clinic_isolation ON appointments
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);
```

**Justificativa**: "RLS fornece camada adicional de segurança no nível do banco, garantindo isolamento completo mesmo se a aplicação falhar na validação."

### **7. AUDITORIA E LOGGING**

#### **7.1 Tabela de Auditoria**
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    user_id UUID,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_audit_logs_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para auditoria
CREATE INDEX idx_audit_logs_clinic_id ON audit_logs(clinic_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_clinic_operation ON audit_logs(clinic_id, operation);
```

**Justificativa**: "Sistema de auditoria completo para compliance e debugging, rastreando todas as mudanças com contexto de usuário e clínica."

---

## 📝 **SCRIPTS DE MIGRAÇÃO**

### **8. Migração Completa**

#### **8.1 Arquivo: 001_create_core_tables.sql**
```sql
-- Migração para criar tabelas principais
BEGIN;

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin_lify', 'admin_clinic', 'attendant')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uk_users_email_clinic UNIQUE (email, clinic_id),
    CONSTRAINT fk_users_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- Criar tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_name VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'transferred')),
    assigned_user_id UUID,
    is_bot_controlled BOOLEAN DEFAULT true,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_conversations_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversations_user_id FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
    google_event_id VARCHAR(255),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_appointments_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT uk_appointments_google_event UNIQUE (google_event_id),
    CONSTRAINT chk_appointments_time CHECK (end_time > start_time)
);

-- Criar tabela de tokens Google
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_google_tokens_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT uk_google_tokens_clinic UNIQUE (clinic_id)
);

-- Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    user_id UUID,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_audit_logs_clinic_id FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

COMMIT;
```

#### **8.2 Arquivo: 002_create_indexes.sql**
```sql
-- Migração para criar índices de performance
BEGIN;

-- Índices para usuários
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_clinic_role ON users(clinic_id, role);

-- Índices para conversas
CREATE INDEX IF NOT EXISTS idx_conversations_clinic_id ON conversations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_conversations_patient_phone ON conversations(patient_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_user ON conversations(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_bot_controlled ON conversations(is_bot_controlled);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_clinic_status ON conversations(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_clinic_bot ON conversations(clinic_id, is_bot_controlled);

-- Índices para agendamentos
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_phone ON appointments(patient_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_google_event ON appointments(google_event_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_status ON appointments(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_time ON appointments(clinic_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_patient ON appointments(clinic_id, patient_phone);

-- Índices para tokens Google
CREATE INDEX IF NOT EXISTS idx_google_tokens_clinic_id ON google_calendar_tokens(clinic_id);
CREATE INDEX IF NOT EXISTS idx_google_tokens_expires ON google_calendar_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_google_tokens_active ON google_calendar_tokens(is_active) WHERE is_active = true;

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_id ON audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_operation ON audit_logs(clinic_id, operation);

COMMIT;
```

#### **8.3 Arquivo: 003_update_clinics_table.sql**
```sql
-- Migração para atualizar tabela de clínicas
BEGIN;

-- Adicionar campos para integrações
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_webhook_url TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_id_number VARCHAR(100);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_verify_token VARCHAR(255);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_client_id VARCHAR(255);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_client_secret TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Criar índices para novos campos
CREATE INDEX IF NOT EXISTS idx_clinics_whatsapp_id ON clinics(whatsapp_id_number);
CREATE INDEX IF NOT EXISTS idx_clinics_google_client ON clinics(google_client_id);

COMMIT;
```

---

## 📊 **CONSIDERAÇÕES DE PERFORMANCE**

### **9. Estratégias de Otimização**

#### **9.1 Consultas Otimizadas**
```sql
-- Consulta otimizada para próximos agendamentos
SELECT a.*, c.name as clinic_name
FROM appointments a
JOIN clinics c ON a.clinic_id = c.id
WHERE a.clinic_id = $1 
  AND a.start_time > NOW() 
  AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.start_time
LIMIT 50;

-- Consulta otimizada para conversas ativas
SELECT c.*, u.first_name, u.last_name
FROM conversations c
LEFT JOIN users u ON c.assigned_user_id = u.id
WHERE c.clinic_id = $1 
  AND c.status = 'active'
ORDER BY c.last_message_at DESC
LIMIT 100;
```

#### **9.2 Particionamento Futuro**
```sql
-- Script para particionamento futuro
-- Executar quando tabelas atingirem 1M+ registros

-- Criar tabela particionada
CREATE TABLE appointments_partitioned (
    -- mesma estrutura da tabela original
) PARTITION BY HASH (clinic_id);

-- Migrar dados existentes
INSERT INTO appointments_partitioned 
SELECT * FROM appointments;

-- Trocar tabelas
ALTER TABLE appointments RENAME TO appointments_old;
ALTER TABLE appointments_partitioned RENAME TO appointments;
```

---

## 🚀 **ESTRATÉGIA DE DEPLOY**

### **10. Plano de Migração**

#### **10.1 Fases de Migração**
1. **Fase 1**: Criar novas tabelas (sem afetar existentes)
2. **Fase 2**: Migrar dados existentes
3. **Fase 3**: Atualizar aplicação para usar novas tabelas
4. **Fase 4**: Remover tabelas antigas

#### **10.2 Rollback Strategy**
- **Backup**: Backup completo antes de cada migração
- **Testes**: Testar migração em ambiente staging
- **Rollback**: Scripts para reverter mudanças se necessário

---

## 📋 **PRÓXIMOS PASSOS**

1. **Revisão**: Validar design com equipe técnica
2. **Implementação**: Executar scripts de migração
3. **Testes**: Validar performance e funcionalidade
4. **Monitoramento**: Acompanhar métricas de performance
5. **Otimização**: Ajustar índices baseado em uso real

---

**Documento criado por**: Senior Database Architect (DBA)  
**Data de criação**: 2024-01-15  
**Versão**: 1.0  
**Status**: DESIGN COMPLETO - PRONTO PARA IMPLEMENTAÇÃO**
