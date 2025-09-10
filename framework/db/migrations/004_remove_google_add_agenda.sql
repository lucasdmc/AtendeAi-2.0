-- Migration: Remove Google integrations and add local agenda
-- Created: 2025-09-10T14:39:12.905Z

-- Remove Google integration tables
DROP TABLE IF EXISTS google_integrations CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;

-- Create appointments table for local agenda
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(20),
  patient_email VARCHAR(255),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointment_availability table for managing available slots
CREATE TABLE IF NOT EXISTS appointment_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_availability_clinic_id ON appointment_availability(clinic_id);

-- Add RLS policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_availability ENABLE ROW LEVEL SECURITY;

-- Policy for appointments - users can only see appointments from their clinics
CREATE POLICY "Users can view appointments from their clinics" ON appointments
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM user_clinic_permissions 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for appointment_availability - users can view availability from their clinics
CREATE POLICY "Users can view availability from their clinics" ON appointment_availability
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM user_clinic_permissions 
      WHERE user_id = auth.uid()
    )
  );
