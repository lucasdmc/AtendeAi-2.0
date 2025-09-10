-- =====================================================
-- MIGRATION: 003_frontend_compatibility.sql
-- Description: Criação de tabelas no schema public para compatibilidade com frontend
-- Author: database_architect
-- Date: 2025-01-20
-- Forward: Criar tabelas no schema public
-- Backward: DROP tabelas do schema public
-- =====================================================

-- =====================================================
-- TABELA: user_clinic_relations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_clinic_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referências
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    
    -- Relacionamento
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    permissions JSONB DEFAULT '{}',
    
    -- Status
    active BOOLEAN NOT NULL DEFAULT true,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_clinic UNIQUE (user_id, clinic_id),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'user', 'viewer'))
);

-- =====================================================
-- TABELA: google_integrations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.google_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referências
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    
    -- Configuração Google
    google_calendar_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'https://www.googleapis.com/auth/calendar',
    token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Metadados do calendário
    calendar_name VARCHAR(255),
    calendar_description TEXT,
    
    -- Configurações de sincronização
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_integration_status CHECK (status IN ('active', 'expired', 'error')),
    CONSTRAINT unique_user_calendar UNIQUE (user_id, google_calendar_id)
);

-- =====================================================
-- TABELA: calendar_events
-- =====================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referências
    integration_id UUID NOT NULL REFERENCES public.google_integrations(id) ON DELETE CASCADE,
    google_event_id VARCHAR(255) NOT NULL,
    
    -- Dados do evento
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN NOT NULL DEFAULT false,
    location TEXT,
    attendees TEXT[] DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_event_status CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    CONSTRAINT unique_google_event UNIQUE (integration_id, google_event_id)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para user_clinic_relations
CREATE INDEX IF NOT EXISTS idx_user_clinic_relations_user_id ON public.user_clinic_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_relations_clinic_id ON public.user_clinic_relations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_relations_active ON public.user_clinic_relations(active);

-- Índices para google_integrations
CREATE INDEX IF NOT EXISTS idx_google_integrations_user_id ON public.google_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_google_integrations_clinic_id ON public.google_integrations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_google_integrations_status ON public.google_integrations(status);
CREATE INDEX IF NOT EXISTS idx_google_integrations_sync_enabled ON public.google_integrations(sync_enabled);

-- Índices para calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_integration_id ON public.calendar_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_event_id ON public.calendar_events(google_event_id);

-- =====================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.user_clinic_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Políticas para user_clinic_relations
CREATE POLICY "Users can view their own clinic relations" ON public.user_clinic_relations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clinic relations" ON public.user_clinic_relations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clinic relations" ON public.user_clinic_relations
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para google_integrations
CREATE POLICY "Users can view their own integrations" ON public.google_integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations" ON public.google_integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" ON public.google_integrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations" ON public.google_integrations
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para calendar_events
CREATE POLICY "Users can view events from their integrations" ON public.calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.google_integrations gi 
            WHERE gi.id = calendar_events.integration_id 
            AND gi.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert events to their integrations" ON public.calendar_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.google_integrations gi 
            WHERE gi.id = calendar_events.integration_id 
            AND gi.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update events from their integrations" ON public.calendar_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.google_integrations gi 
            WHERE gi.id = calendar_events.integration_id 
            AND gi.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete events from their integrations" ON public.calendar_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.google_integrations gi 
            WHERE gi.id = calendar_events.integration_id 
            AND gi.user_id = auth.uid()
        )
    );

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.user_clinic_relations IS 'Relacionamentos entre usuários e clínicas no sistema';
COMMENT ON TABLE public.google_integrations IS 'Integrações Google Calendar por usuário e clínica';
COMMENT ON TABLE public.calendar_events IS 'Eventos do Google Calendar sincronizados';

-- Log da migração
INSERT INTO atendeai.audit_logs (
    clinic_id, user_id, action, table_name, record_id, 
    new_values, ip_address, user_agent
) VALUES (
    NULL, NULL, 'MIGRATION', 'schema', 'frontend_compatibility_003', 
    '{"migration": "003_frontend_compatibility.sql", "status": "completed", "timestamp": "2025-01-20T15:30:00Z"}'::jsonb,
    '127.0.0.1', 'database-architect'
);

