# Database Model - AtendeAí 2.0

## Tabelas Principais

### users
- Armazena informações dos usuários do sistema
- Campos: id, email, name, role, created_at, updated_at

### clinics
- Armazena informações das clínicas
- Campos: id, name, address, phone, email, settings, created_at, updated_at

### appointments (Nova)
- Armazena agendamentos locais
- Campos: id, clinic_id, user_id, patient_name, patient_phone, patient_email, appointment_date, duration_minutes, status, notes, created_at, updated_at

### appointment_availability (Nova)
- Armazena horários disponíveis por clínica
- Campos: id, clinic_id, day_of_week, start_time, end_time, duration_minutes, is_available, created_at, updated_at

### user_clinic_permissions
- Gerencia permissões de usuários por clínica
- Campos: id, user_id, clinic_id, role, created_at, updated_at

### conversations
- Armazena conversas do chat
- Campos: id, clinic_id, user_id, message, created_at, updated_at

## Remoções
- google_integrations (removida)
- calendar_events (removida)

## Relacionamentos
- appointments -> clinics (many-to-one)
- appointments -> users (many-to-one)
- appointment_availability -> clinics (many-to-one)
- user_clinic_permissions -> users (many-to-one)
- user_clinic_permissions -> clinics (many-to-one)
