# 🗄️ Database Architecture - AtendeAI 2.0

## 📊 **Visão Geral**

O banco de dados do AtendeAI 2.0 utiliza **PostgreSQL 15+** hospedado no **Supabase** com implementação de **Row Level Security (RLS)** para garantir isolamento completo entre clínicas.

---

## 🏗️ **Arquitetura do Banco**

### **Multi-tenancy com RLS**
- **Isolamento por clínica**: Cada registro é automaticamente filtrado pela `clinic_id`
- **Row Level Security**: Políticas de segurança aplicadas em nível de linha
- **Segurança automática**: Usuários só acessam dados de suas clínicas

### **Schema Principal**

```sql
-- Tabela de clínicas (tenant)
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    webhook_url TEXT,
    whatsapp_number VARCHAR(20),
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin_lify', 'admin_clinic', 'attendant')),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis de usuário
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    profile_type VARCHAR(50) NOT NULL CHECK (profile_type IN ('admin_lify', 'admin_clinic', 'attendant')),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conversas WhatsApp
CREATE TABLE whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens WhatsApp
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'audio')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    is_from_customer BOOLEAN DEFAULT true
);

-- Tabela de configurações de bot
CREATE TABLE bot_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    is_bot_active BOOLEAN DEFAULT true,
    bot_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    google_event_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de integrações Google Calendar
CREATE TABLE google_calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    google_account_email VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    calendar_id VARCHAR(255) DEFAULT 'primary',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔒 **Row Level Security (RLS)**

### **Políticas de Segurança**

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Política para Admin Lify (acesso total)
CREATE POLICY "admin_lify_all_access" ON clinics
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin_lify'
    )
);

-- Política para Admin Clínica (apenas sua clínica)
CREATE POLICY "admin_clinic_own_clinic" ON clinics
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.clinic_id = clinics.id
        AND users.role IN ('admin_clinic', 'attendant')
    )
);

-- Política para usuários (isolamento por clínica)
CREATE POLICY "users_clinic_isolation" ON users
FOR ALL TO authenticated
USING (
    -- Admin Lify vê todos
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND u.role = 'admin_lify'
    )
    OR
    -- Usuários da mesma clínica
    clinic_id = (
        SELECT clinic_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Política para conversas WhatsApp (isolamento por clínica)
CREATE POLICY "conversations_clinic_isolation" ON whatsapp_conversations
FOR ALL TO authenticated
USING (
    clinic_id = (
        SELECT clinic_id FROM users 
        WHERE id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin_lify'
    )
);

-- Política para mensagens (através da conversa)
CREATE POLICY "messages_through_conversation" ON whatsapp_messages
FOR ALL TO authenticated
USING (
    conversation_id IN (
        SELECT id FROM whatsapp_conversations
        WHERE clinic_id = (
            SELECT clinic_id FROM users 
            WHERE id = auth.uid()
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin_lify'
    )
);
```

---

## 📋 **Comandos de Setup**

### **1. Configuração Inicial**

```bash
# Conectar ao Supabase
psql postgresql://postgres:Supa201294base@db.kytphnasmdvebmdvvwtx.supabase.co:5432/postgres

# Ou usar a CLI do Supabase
supabase db reset
supabase db push
```

### **2. Aplicar Migrações** [[memory:6759758]]

```bash
# Via Supabase CLI
supabase migration up

# Via SQL direto
psql < framework/db/migrations/001_initial_schema.sql
psql < framework/db/migrations/002_rls_policies.sql
psql < framework/db/migrations/003_indexes.sql
```

### **3. Executar Seed** 

```bash
# Seed de dados iniciais
psql < framework/db/seed/001_initial_data.sql
```

---

## 🚀 **Performance e Otimização**

### **Índices Essenciais**

```sql
-- Índices para performance
CREATE INDEX idx_users_clinic_id ON users(clinic_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_conversations_clinic_id ON whatsapp_conversations(clinic_id);
CREATE INDEX idx_conversations_customer_phone ON whatsapp_conversations(customer_phone);
CREATE INDEX idx_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_google_integrations_user_clinic ON google_calendar_integrations(user_id, clinic_id);

-- Índices compostos para queries complexas
CREATE INDEX idx_conversations_clinic_status ON whatsapp_conversations(clinic_id, status);
CREATE INDEX idx_messages_conv_timestamp ON whatsapp_messages(conversation_id, timestamp DESC);
CREATE INDEX idx_appointments_clinic_date_status ON appointments(clinic_id, appointment_date, status);
```

### **Triggers para Timestamps**

```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_google_integrations_updated_at BEFORE UPDATE ON google_calendar_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔍 **Queries Comuns**

### **Listar usuários de uma clínica**
```sql
SELECT * FROM users 
WHERE clinic_id = 'clinic-uuid'
ORDER BY created_at DESC;
```

### **Conversas ativas de uma clínica**
```sql
SELECT c.*, 
       COUNT(m.id) as message_count,
       MAX(m.timestamp) as last_message_time
FROM whatsapp_conversations c
LEFT JOIN whatsapp_messages m ON c.id = m.conversation_id
WHERE c.clinic_id = 'clinic-uuid' 
  AND c.status = 'active'
GROUP BY c.id
ORDER BY last_message_time DESC;
```

### **Agendamentos do dia**
```sql
SELECT * FROM appointments 
WHERE clinic_id = 'clinic-uuid'
  AND DATE(appointment_date) = CURRENT_DATE
  AND status IN ('scheduled', 'confirmed')
ORDER BY appointment_date ASC;
```

---

## 🛡️ **Backup e Segurança**

### **Backup Automático**
- **Supabase**: Backup automático diário
- **Retenção**: 7 dias (plano gratuito), 30 dias (plano pago)
- **Point-in-time recovery**: Disponível no plano pago

### **Monitoramento**
```sql
-- Query para monitorar performance
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## 📊 **Métricas e Alertas**

### **Alertas Configurados**
- **Conexões ativas** > 80% do limite
- **Tamanho do banco** > 90% da cota
- **Queries lentas** > 1 segundo
- **Deadlocks** detectados
- **RLS violations** (tentativas de acesso não autorizado)

### **Dashboard de Métricas**
- **Supabase Dashboard**: Métricas em tempo real
- **Grafana**: Dashboards customizados
- **Prometheus**: Coleta de métricas detalhadas

---

## 🔧 **Troubleshooting**

### **Problemas Comuns**

1. **RLS Bloqueando Acesso**
   ```sql
   -- Verificar políticas ativas
   SELECT * FROM pg_policies WHERE tablename = 'nome_da_tabela';
   
   -- Temporariamente desabilitar RLS (desenvolvimento)
   ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;
   ```

2. **Performance Lenta**
   ```sql
   -- Verificar queries lentas
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

3. **Conexões Esgotadas**
   ```sql
   -- Verificar conexões ativas
   SELECT state, count(*) 
   FROM pg_stat_activity 
   GROUP BY state;
   ```

---

**Status**: ✅ **Configurado e Funcional**  
**Última Atualização**: 2024-01-20  
**Responsável**: Database Architect