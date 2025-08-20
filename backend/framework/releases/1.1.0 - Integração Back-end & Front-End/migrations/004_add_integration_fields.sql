-- Migração para adicionar campos de integração
BEGIN;

-- Adicionar campos para integrações na tabela clinics
ALTER TABLE atendeai.clinics ADD COLUMN IF NOT EXISTS whatsapp_webhook_url TEXT;
ALTER TABLE atendeai.clinics ADD COLUMN IF NOT EXISTS whatsapp_id_number VARCHAR(100);
ALTER TABLE atendeai.clinics ADD COLUMN IF NOT EXISTS whatsapp_verify_token VARCHAR(255);
ALTER TABLE atendeai.clinics ADD COLUMN IF NOT EXISTS google_client_id VARCHAR(255);
ALTER TABLE atendeai.clinics ADD COLUMN IF NOT EXISTS google_client_secret TEXT;
ALTER TABLE atendeai.clinics ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE atendeai.clinics ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE atendeai.clinics ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campo role na tabela users (se não existir)
ALTER TABLE atendeai.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'attendant';

-- Criar índices para novos campos
CREATE INDEX IF NOT EXISTS idx_clinics_whatsapp_id ON atendeai.clinics(whatsapp_id_number);
CREATE INDEX IF NOT EXISTS idx_clinics_google_client ON atendeai.clinics(google_client_id);

-- Adicionar constraint para role (removendo IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_role_check' 
        AND table_name = 'users' 
        AND table_schema = 'atendeai'
    ) THEN
        ALTER TABLE atendeai.users ADD CONSTRAINT users_role_check 
            CHECK (role IN ('admin_lify', 'admin_clinic', 'attendant'));
    END IF;
END $$;

COMMIT;
