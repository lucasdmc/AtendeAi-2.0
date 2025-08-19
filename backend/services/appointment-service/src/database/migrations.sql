-- Migration para Appointment Service
-- Criar tabelas necessárias para o sistema de agendamento

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10,2) DEFAULT 0.00,
    accepts_insurance BOOLEAN DEFAULT false,
    insurance_providers JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de profissionais
CREATE TABLE IF NOT EXISTS professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    crm VARCHAR(20),
    specialties JSONB DEFAULT '[]',
    experience_years INTEGER DEFAULT 0,
    education TEXT,
    bio TEXT,
    accepts_new_patients BOOLEAN DEFAULT true,
    default_duration INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_name VARCHAR(100) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_email VARCHAR(100),
    service_id UUID NOT NULL,
    professional_id UUID,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    source VARCHAR(20) DEFAULT 'whatsapp',
    google_event_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pacientes (opcional, para histórico)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10),
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    insurance_provider VARCHAR(100),
    insurance_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_services_clinic_id ON services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

CREATE INDEX IF NOT EXISTS idx_professionals_clinic_id ON professionals(clinic_id);
CREATE INDEX IF NOT EXISTS idx_professionals_active ON professionals(is_active);
CREATE INDEX IF NOT EXISTS idx_professionals_specialties ON professionals USING GIN(specialties);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_phone ON appointments(patient_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_time ON appointments(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_google_event_id ON appointments(google_event_id);

CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_status ON appointments(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_date ON appointments(professional_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_clinic ON appointments(patient_phone, clinic_id);

-- Constraints
ALTER TABLE services 
ADD CONSTRAINT fk_services_clinic_id 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

ALTER TABLE professionals 
ADD CONSTRAINT fk_professionals_clinic_id 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_clinic_id 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_service_id 
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;

ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_professional_id 
FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL;

ALTER TABLE patients 
ADD CONSTRAINT fk_patients_clinic_id 
FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;

-- Constraints de validação
ALTER TABLE services 
ADD CONSTRAINT chk_services_duration 
CHECK (duration > 0 AND duration <= 480);

ALTER TABLE services 
ADD CONSTRAINT chk_services_price 
CHECK (price >= 0);

ALTER TABLE professionals 
ADD CONSTRAINT chk_professionals_experience 
CHECK (experience_years >= 0);

ALTER TABLE professionals 
ADD CONSTRAINT chk_professionals_duration 
CHECK (default_duration > 0 AND default_duration <= 480);

ALTER TABLE appointments 
ADD CONSTRAINT chk_appointments_duration 
CHECK (duration > 0 AND duration <= 480);

ALTER TABLE appointments 
ADD CONSTRAINT chk_appointments_status 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

ALTER TABLE appointments 
ADD CONSTRAINT chk_appointments_source 
CHECK (source IN ('whatsapp', 'web', 'phone', 'in_person'));

ALTER TABLE patients 
ADD CONSTRAINT chk_patients_gender 
CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at 
    BEFORE UPDATE ON professionals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para verificar disponibilidade de horário
CREATE OR REPLACE FUNCTION check_appointment_availability(
    p_clinic_id UUID,
    p_professional_id UUID,
    p_date DATE,
    p_time TIME,
    p_duration INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    conflicting_appointments INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflicting_appointments
    FROM appointments
    WHERE clinic_id = p_clinic_id
    AND professional_id = p_professional_id
    AND scheduled_date = p_date
    AND status NOT IN ('cancelled', 'no_show')
    AND (
        (scheduled_time <= p_time AND scheduled_time + INTERVAL '1 minute' * duration > p_time) OR
        (p_time <= scheduled_time AND p_time + INTERVAL '1 minute' * p_duration > scheduled_time)
    );
    
    RETURN conflicting_appointments = 0;
END;
$$ LANGUAGE plpgsql;

-- Função para obter horários disponíveis
CREATE OR REPLACE FUNCTION get_available_slots(
    p_clinic_id UUID,
    p_professional_id UUID,
    p_date DATE,
    p_duration INTEGER DEFAULT 30
)
RETURNS TABLE(slot_time TIME) AS $$
BEGIN
    RETURN QUERY
    SELECT generate_series(
        '08:00'::time, 
        '18:00'::time, 
        '30 minutes'::interval
    )::time AS slot_time
    EXCEPT
    SELECT scheduled_time
    FROM appointments
    WHERE clinic_id = p_clinic_id
    AND professional_id = p_professional_id
    AND scheduled_date = p_date
    AND status NOT IN ('cancelled', 'no_show')
    ORDER BY slot_time;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar agendamentos antigos
CREATE OR REPLACE FUNCTION cleanup_old_appointments(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM appointments 
    WHERE scheduled_date < CURRENT_DATE - INTERVAL '1 day' * days_old
    AND status IN ('completed', 'cancelled', 'no_show');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE services IS 'Tabela para armazenar serviços oferecidos pelas clínicas';
COMMENT ON TABLE professionals IS 'Tabela para armazenar profissionais das clínicas';
COMMENT ON TABLE appointments IS 'Tabela para armazenar agendamentos de consultas';
COMMENT ON TABLE patients IS 'Tabela para armazenar informações dos pacientes';

COMMENT ON COLUMN services.clinic_id IS 'ID da clínica (referência para tabela clinics)';
COMMENT ON COLUMN services.name IS 'Nome do serviço';
COMMENT ON COLUMN services.category IS 'Categoria do serviço (ex: consulta, exame, procedimento)';
COMMENT ON COLUMN services.duration IS 'Duração padrão em minutos';
COMMENT ON COLUMN services.price IS 'Preço do serviço';
COMMENT ON COLUMN services.accepts_insurance IS 'Se aceita convênio médico';
COMMENT ON COLUMN services.insurance_providers IS 'Lista de convênios aceitos';

COMMENT ON COLUMN professionals.clinic_id IS 'ID da clínica (referência para tabela clinics)';
COMMENT ON COLUMN professionals.name IS 'Nome do profissional';
COMMENT ON COLUMN professionals.crm IS 'Número do CRM (para médicos)';
COMMENT ON COLUMN professionals.specialties IS 'Especialidades em formato JSON';
COMMENT ON COLUMN professionals.experience_years IS 'Anos de experiência';
COMMENT ON COLUMN professionals.accepts_new_patients IS 'Se aceita novos pacientes';

COMMENT ON COLUMN appointments.clinic_id IS 'ID da clínica (referência para tabela clinics)';
COMMENT ON COLUMN appointments.patient_name IS 'Nome do paciente';
COMMENT ON COLUMN appointments.patient_phone IS 'Telefone do paciente';
COMMENT ON COLUMN appointments.service_id IS 'ID do serviço (referência para tabela services)';
COMMENT ON COLUMN appointments.professional_id IS 'ID do profissional (referência para tabela professionals)';
COMMENT ON COLUMN appointments.scheduled_date IS 'Data agendada';
COMMENT ON COLUMN appointments.scheduled_time IS 'Horário agendado';
COMMENT ON COLUMN appointments.duration IS 'Duração em minutos';
COMMENT ON COLUMN appointments.status IS 'Status do agendamento';
COMMENT ON COLUMN appointments.google_event_id IS 'ID do evento no Google Calendar';

-- Inserir dados de exemplo (opcional para desenvolvimento)
-- INSERT INTO services (clinic_id, name, description, category, duration, price) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', 'Consulta Médica', 'Consulta médica geral', 'consulta', 30, 150.00);

-- Verificar se as tabelas foram criadas corretamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('services', 'professionals', 'appointments', 'patients')
ORDER BY table_name, ordinal_position;
