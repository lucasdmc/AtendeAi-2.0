#!/bin/bash

# =====================================================
# SCRIPT PARA CONFIGURAR SUPABASE - ATENDEAI 2.0
# =====================================================

echo "🚀 Configurando Supabase para AtendeAI 2.0..."

# Verificar se psql está disponível
if ! command -v psql &> /dev/null; then
    echo "❌ psql não está instalado. Instalando..."
    
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install postgresql
        else
            echo "❌ Homebrew não está instalado. Instale o Homebrew primeiro."
            exit 1
        fi
    # Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y postgresql-client
        elif command -v yum &> /dev/null; then
            sudo yum install -y postgresql
        else
            echo "❌ Gerenciador de pacotes não suportado. Instale o PostgreSQL client manualmente."
            exit 1
        fi
    else
        echo "❌ Sistema operacional não suportado. Instale o PostgreSQL client manualmente."
        exit 1
    fi
fi

# Configurações do Supabase
SUPABASE_URL="https://kytphnasmdvebmdvvwtx.supabase.co"
SUPABASE_DB_HOST="db.kytphnasmdvebmdvvwtx.supabase.co"
SUPABASE_DB_PORT="5432"
SUPABASE_DB_NAME="postgres"
SUPABASE_DB_USER="postgres"
SUPABASE_DB_PASSWORD="supabase@1234"

echo "🔗 Conectando ao Supabase..."
echo "   Host: $SUPABASE_DB_HOST"
echo "   Database: $SUPABASE_DB_NAME"
echo "   User: $SUPABASE_DB_USER"

# Testar conexão usando variáveis separadas
echo "🧪 Testando conexão com o banco..."
export PGPASSWORD="$SUPABASE_DB_PASSWORD"
if psql -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" -U "$SUPABASE_DB_USER" -d "$SUPABASE_DB_NAME" -c "SELECT version();" &> /dev/null; then
    echo "✅ Conexão com Supabase estabelecida com sucesso!"
else
    echo "❌ Falha na conexão com Supabase. Verifique as credenciais."
    echo "💡 Tentando conexão alternativa..."
    
    # Tentar conexão alternativa
    if psql "postgresql://$SUPABASE_DB_USER:$SUPABASE_DB_PASSWORD@$SUPABASE_DB_HOST:$SUPABASE_DB_PORT/$SUPABASE_DB_NAME" -c "SELECT version();" &> /dev/null; then
        echo "✅ Conexão alternativa funcionou!"
    else
        echo "❌ Ambas as tentativas falharam. Verifique:"
        echo "   1. Se as credenciais estão corretas"
        echo "   2. Se o IP está liberado no Supabase"
        echo "   3. Se o banco está ativo"
        exit 1
    fi
fi

# Executar migração base
echo "🗄️ Executando migração base..."
psql -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" -U "$SUPABASE_DB_USER" -d "$SUPABASE_DB_NAME" -f framework/deliverables/01-foundation/database-migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Migração base executada com sucesso!"
else
    echo "❌ Erro na migração base. Verificando logs..."
    exit 1
fi

# Executar migrações específicas dos serviços
echo "🔧 Executando migrações dos serviços..."

# Conversation Service
echo "📝 Configurando Conversation Service..."
psql -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" -U "$SUPABASE_DB_USER" -d "$SUPABASE_DB_NAME" << 'EOF'
-- Schema para Conversation Service
CREATE SCHEMA IF NOT EXISTS conversation;

-- Tabela de conversas
CREATE TABLE conversation.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    whatsapp_number VARCHAR(20) NOT NULL,
    user_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
    context JSONB DEFAULT '{}',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE conversation.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('incoming', 'outgoing')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT false,
    intent_detected VARCHAR(100),
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de memória conversacional
CREATE TABLE conversation.conversation_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    memory_key VARCHAR(100) NOT NULL,
    memory_value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(conversation_id, memory_key)
);

-- Índices para performance
CREATE INDEX idx_conversations_clinic_whatsapp ON conversation.conversations(clinic_id, whatsapp_number);
CREATE INDEX idx_conversations_status ON conversation.conversations(status);
CREATE INDEX idx_messages_conversation_created ON conversation.messages(conversation_id, created_at);
CREATE INDEX idx_messages_clinic_processed ON conversation.messages(clinic_id, processed);
CREATE INDEX idx_memory_conversation_key ON conversation.conversation_memory(conversation_id, memory_key);

-- Habilitar RLS
ALTER TABLE conversation.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation.conversation_memory ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY conversations_clinic_isolation ON conversation.conversations
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY messages_clinic_isolation ON conversation.messages
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY memory_clinic_isolation ON conversation.conversation_memory
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);
EOF

# Appointment Service
echo "📅 Configurando Appointment Service..."
psql -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" -U "$SUPABASE_DB_USER" -d "$SUPABASE_DB_NAME" << 'EOF'
-- Schema para Appointment Service
CREATE SCHEMA IF NOT EXISTS appointment;

-- Tabela de serviços
CREATE TABLE appointment.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price DECIMAL(10,2),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    google_calendar_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de profissionais
CREATE TABLE appointment.professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    crm VARCHAR(20),
    specialties TEXT[],
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    accepts_new_patients BOOLEAN DEFAULT true,
    default_duration_minutes INTEGER DEFAULT 60,
    google_calendar_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE appointment.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversation.conversations(id),
    service_id UUID NOT NULL REFERENCES appointment.services(id),
    professional_id UUID REFERENCES appointment.professionals(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    google_calendar_event_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fluxo de agendamento
CREATE TABLE appointment.appointment_flow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id),
    current_state VARCHAR(50) NOT NULL,
    flow_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_services_clinic_status ON appointment.services(clinic_id, status);
CREATE INDEX idx_professionals_clinic_status ON appointment.professionals(clinic_id, status);
CREATE INDEX idx_appointments_clinic_date ON appointment.appointments(clinic_id, appointment_date);
CREATE INDEX idx_appointments_conversation ON appointment.appointments(conversation_id);
CREATE INDEX idx_appointments_google_calendar ON appointment.appointments(google_calendar_event_id);
CREATE INDEX idx_flow_conversation ON appointment.appointment_flow(conversation_id);

-- Habilitar RLS
ALTER TABLE appointment.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment.appointment_flow ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY services_clinic_isolation ON appointment.services
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY professionals_clinic_isolation ON appointment.professionals
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY appointments_clinic_isolation ON appointment.appointments
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY flow_clinic_isolation ON appointment.appointment_flow
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);
EOF

# Clinic Service
echo "🏥 Configurando Clinic Service..."
psql -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" -U "$SUPABASE_DB_USER" -d "$SUPABASE_DB_NAME" << 'EOF'
-- Schema para Clinic Service
CREATE SCHEMA IF NOT EXISTS clinic;

-- Tabela de configurações da clínica
CREATE TABLE clinic.clinic_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    config_type VARCHAR(100) NOT NULL,
    config_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, config_type)
);

-- Tabela de contextualização JSON
CREATE TABLE clinic.contextualization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    context_name VARCHAR(100) NOT NULL,
    context_data JSONB NOT NULL,
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, context_name)
);

-- Tabela de horários de funcionamento
CREATE TABLE clinic.working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_working_day BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, day_of_week)
);

-- Tabela de políticas de agendamento
CREATE TABLE clinic.scheduling_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    policy_name VARCHAR(100) NOT NULL,
    policy_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, policy_name)
);

-- Índices para performance
CREATE INDEX idx_clinic_config_clinic_type ON clinic.clinic_configurations(clinic_id, config_type);
CREATE INDEX idx_contextualization_clinic_active ON clinic.contextualization(clinic_id, is_active);
CREATE INDEX idx_working_hours_clinic_day ON clinic.working_hours(clinic_id, day_of_week);
CREATE INDEX idx_scheduling_policies_clinic ON clinic.scheduling_policies(clinic_id);

-- Habilitar RLS
ALTER TABLE clinic.clinic_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic.contextualization ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic.scheduling_policies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY clinic_config_isolation ON clinic.clinic_configurations
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY contextualization_isolation ON clinic.contextualization
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY working_hours_isolation ON clinic.working_hours
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY scheduling_policies_isolation ON clinic.scheduling_policies
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);
EOF

# WhatsApp Service
echo "📱 Configurando WhatsApp Service..."
psql -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" -U "$SUPABASE_DB_USER" -d "$SUPABASE_DB_NAME" << 'EOF'
-- Schema para WhatsApp Service
CREATE SCHEMA IF NOT EXISTS whatsapp;

-- Tabela de mensagens WhatsApp
CREATE TABLE whatsapp.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversation.conversations(id),
    whatsapp_message_id VARCHAR(255) UNIQUE,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location')),
    content TEXT,
    media_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de webhooks
CREATE TABLE whatsapp.webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    webhook_url VARCHAR(500) NOT NULL,
    verify_token VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações WhatsApp
CREATE TABLE whatsapp.configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    phone_number_id VARCHAR(255) NOT NULL,
    access_token VARCHAR(500) NOT NULL,
    business_account_id VARCHAR(255),
    app_id VARCHAR(255),
    app_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, phone_number_id)
);

-- Índices para performance
CREATE INDEX idx_whatsapp_messages_clinic_created ON whatsapp.messages(clinic_id, created_at);
CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp.messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp.messages(status);
CREATE INDEX idx_whatsapp_messages_whatsapp_id ON whatsapp.messages(whatsapp_message_id);
CREATE INDEX idx_whatsapp_config_clinic_active ON whatsapp.configurations(clinic_id, is_active);

-- Habilitar RLS
ALTER TABLE whatsapp.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp.configurations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY whatsapp_messages_isolation ON whatsapp.messages
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY whatsapp_webhooks_isolation ON whatsapp.webhooks
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY whatsapp_config_isolation ON whatsapp.configurations
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);
EOF

# Google Calendar Service
echo "📅 Configurando Google Calendar Service..."
psql -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" -U "$SUPABASE_DB_USER" -d "$SUPABASE_DB_NAME" << 'EOF'
-- Schema para Google Calendar Service
CREATE SCHEMA IF NOT EXISTS google_calendar;

-- Tabela de eventos do calendário
CREATE TABLE google_calendar.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointment.appointments(id),
    google_calendar_id VARCHAR(255) UNIQUE,
    event_summary VARCHAR(255) NOT NULL,
    event_description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    attendees JSONB DEFAULT '[]',
    location VARCHAR(500),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mapeamentos de calendário
CREATE TABLE google_calendar.calendar_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    mapping_type VARCHAR(50) NOT NULL CHECK (mapping_type IN ('service', 'professional', 'clinic')),
    entity_id UUID,
    google_calendar_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do Google
CREATE TABLE google_calendar.google_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    client_id VARCHAR(255) NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    redirect_uri VARCHAR(500),
    scopes TEXT[],
    refresh_token TEXT,
    access_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_calendar_events_clinic_date ON google_calendar.calendar_events(clinic_id, start_time);
CREATE INDEX idx_calendar_events_appointment ON google_calendar.calendar_events(appointment_id);
CREATE INDEX idx_calendar_events_google_id ON google_calendar.calendar_events(google_calendar_id);
CREATE INDEX idx_calendar_mappings_clinic_type ON google_calendar.calendar_mappings(clinic_id, mapping_type);
CREATE INDEX idx_google_config_clinic_active ON google_calendar.google_configurations(clinic_id, is_active);

-- Habilitar RLS
ALTER TABLE google_calendar.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar.calendar_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar.google_configurations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY calendar_events_isolation ON google_calendar.calendar_events
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY calendar_mappings_isolation ON google_calendar.calendar_mappings
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);

CREATE POLICY google_config_isolation ON google_calendar.google_configurations
    FOR ALL USING (clinic_id = current_setting('app.current_clinic_id')::UUID);
EOF

# Verificar se todas as tabelas foram criadas
echo "🔍 Verificando tabelas criadas..."
psql -h "$SUPABASE_DB_HOST" -p "$SUPABASE_DB_PORT" -U "$SUPABASE_DB_USER" -d "$SUPABASE_DB_NAME" -c "
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname IN ('atendeai', 'conversation', 'appointment', 'clinic', 'whatsapp', 'google_calendar')
ORDER BY schemaname, tablename;
"

echo ""
echo "✅ Configuração do Supabase concluída com sucesso!"
echo ""
echo "📊 Resumo das tabelas criadas:"
echo "   - Schema atendeai: Tabelas base do sistema"
echo "   - Schema conversation: Sistema de conversação e IA"
echo "   - Schema appointment: Sistema de agendamentos"
echo "   - Schema clinic: Configurações de clínicas"
echo "   - Schema whatsapp: Integração com WhatsApp"
echo "   - Schema google_calendar: Integração com Google Calendar"
echo ""
echo "🔐 Próximos passos:"
echo "   1. Configure as APIs do WhatsApp Business"
echo "   2. Configure as APIs do Google Calendar"
echo "   3. Execute a infraestrutura com ./scripts/start-infrastructure.sh"
echo "   4. Execute o frontend com ./scripts/start-frontend.sh"
echo ""
echo "🌐 URLs de acesso:"
echo "   - Supabase Dashboard: $SUPABASE_URL"
echo "   - Frontend: http://localhost:8080"
echo "   - Backend: http://localhost:8000 (via Kong)"

# Limpar variável de ambiente
unset PGPASSWORD
