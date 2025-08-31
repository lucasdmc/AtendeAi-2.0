# 🗄️ Database Architecture - AtendeAI 2.0

## Overview

Sistema de banco de dados PostgreSQL com arquitetura multiclínicas usando **Row Level Security (RLS)** para isolamento completo entre clínicas. Implementado no **Supabase** com migrações reversíveis e seeds idempotentes.

## 🏗️ Architecture

### Schemas Organization

```
atendeai/          # Core entities (clinics, users, audit)
├── clinics        # Multiclínicas data & JSON context
├── users          # Users with roles & clinic isolation  
└── audit_logs     # System audit trail

conversation/      # WhatsApp chat & messaging
├── conversations  # Chat sessions with customers
├── messages       # Individual messages (text, media)
└── conversation_tags # Classification tags system

appointment/       # Scheduling & Google Calendar
├── appointments   # Scheduled events
├── appointment_types # Configurable appointment types
└── google_integrations # OAuth tokens & calendar config

whatsapp/         # WhatsApp Business API (existing)
├── messages      # WhatsApp messages (from existing implementation)
├── webhook_events # Meta webhook processing
└── conversation_sessions # Active chat sessions
```

### 🔐 Security Model

**Row Level Security (RLS)** enforced on all tables:
- **Admin Lify/Suporte**: Access to all clinics
- **Administrador**: Full access to own clinic
- **Gestor**: Management access to own clinic
- **Atendente**: Operational access to own clinic

### 🎯 Core Entities

#### Clinic (atendeai.clinics)
```sql
id               UUID PRIMARY KEY
name             VARCHAR(255) NOT NULL
whatsapp_number  VARCHAR(20) UNIQUE
context_json     JSONB -- Full clinic configuration
simulation_mode  BOOLEAN -- Toggle for testing
status           active | inactive
```

#### User (atendeai.users)
```sql
id           UUID PRIMARY KEY  
name         VARCHAR(30)
login        VARCHAR(25) UNIQUE
password_hash VARCHAR(255) -- bcrypt hashed
role         admin_lify | suporte_lify | atendente | gestor | administrador
clinic_id    UUID REFERENCES clinics(id)
```

#### Conversation (conversation.conversations)
```sql
id               UUID PRIMARY KEY
clinic_id        UUID REFERENCES clinics(id)
customer_phone   VARCHAR(20)
conversation_type chatbot | human | mixed
bot_active       BOOLEAN -- Chatbot ON/OFF control
assigned_user_id UUID -- Human takeover
tags             JSONB -- Classification labels
```

#### Appointment (appointment.appointments)
```sql
id                   UUID PRIMARY KEY
clinic_id            UUID REFERENCES clinics(id)
google_event_id      VARCHAR(255) -- Google Calendar integration
appointment_type     VARCHAR(100) -- From JSON config
datetime             TIMESTAMP WITH TIME ZONE
priority             INTEGER 1-10 -- For automatic rescheduling
confirmation_sent    BOOLEAN
confirmation_received BOOLEAN
```

## 🚀 Setup & Operations

### Prerequisites
- PostgreSQL 15+ (Supabase)
- Database URL: `postgresql://postgres:password@host:5432/database`

### 🔄 Migration Commands

```bash
# Apply migrations (forward)
psql $DATABASE_URL -f framework/db/migrations/001_core_schema.sql
psql $DATABASE_URL -f framework/db/migrations/002_rls_policies.sql

# Rollback migrations (backward)  
psql $DATABASE_URL -f framework/db/migrations/002_rls_policies_rollback.sql
psql $DATABASE_URL -f framework/db/migrations/001_core_schema_rollback.sql

# Apply seeds (idempotent)
psql $DATABASE_URL -f framework/db/seed/001_initial_data.sql
```

### 🌱 Seed Data

The seed creates:
- **Demo Clinic**: Test clinic with complete JSON configuration
- **Test Users**: Admin Lify, Clinic Admin, Attendant with hashed passwords
- **Appointment Types**: General, Return, Exam, Emergency with different priorities
- **Conversation Tags**: Classification system (Scheduling, Cancellation, Info, Support, Urgent)
- **Demo Conversation**: Sample WhatsApp conversation for testing

### 📊 Database Indexes

**Performance-optimized indexes:**
```sql
-- Core lookups
idx_users_clinic_id, idx_users_role, idx_users_login
idx_conversations_clinic_id, idx_conversations_status  
idx_appointments_clinic_id, idx_appointments_datetime

-- RLS optimization
idx_users_auth_uid -- For auth.uid() lookups
idx_conversations_clinic_rls -- For RLS policy efficiency
```

## 🔒 Row Level Security (RLS)

### Helper Functions
```sql
get_current_user_clinic_id() -- Returns user's clinic_id
is_admin_or_support()        -- Checks admin/support role
can_manage_users()           -- Checks user management permission
```

### Policy Examples
```sql
-- Users can only see own clinic data
CREATE POLICY clinic_isolation ON appointments
  FOR ALL USING (clinic_id = get_current_user_clinic_id());

-- Admins see everything
CREATE POLICY admin_full_access ON clinics  
  FOR ALL USING (is_admin_or_support());
```

## 🔧 Database Configuration

### Connection Settings
```bash
# Environment variables
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Performance Tuning
```sql
-- Recommended PostgreSQL settings for Supabase
shared_preload_libraries = 'pg_stat_statements'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
```

## 📈 Monitoring & Maintenance

### Health Checks
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies WHERE schemaname IN ('atendeai', 'conversation', 'appointment');

-- Check indexes
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes WHERE schemaname IN ('atendeai', 'conversation', 'appointment');

-- Monitor table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname IN ('atendeai', 'conversation', 'appointment');
```

### Backup Strategy
```bash
# Full backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only backup
pg_dump $DATABASE_URL --schema-only > schema_backup.sql

# Data only backup  
pg_dump $DATABASE_URL --data-only > data_backup.sql
```

## 🧪 Testing & Validation

### Migration Testing
```sql
-- Test clinic isolation
SET row_security = on;
SET ROLE authenticated;
SELECT * FROM atendeai.clinics; -- Should respect RLS

-- Test user permissions
SELECT has_table_privilege('atendeai.users', 'SELECT'); -- Should be true
```

### Data Integrity
```sql
-- Verify foreign key constraints
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint WHERE contype = 'f';

-- Check JSON schema validation
SELECT clinic_id, jsonb_typeof(context_json) 
FROM atendeai.clinics WHERE jsonb_typeof(context_json) != 'object';
```

## 🐛 Troubleshooting

### Common Issues

**RLS blocking queries:**
```sql
-- Check current user context
SELECT auth.uid(), current_user, session_user;

-- Temporarily disable RLS for debugging (use carefully)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

**Migration failures:**
```sql
-- Check migration log
SELECT * FROM atendeai.audit_logs WHERE action = 'MIGRATION' ORDER BY created_at DESC;

-- Verify schema state
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('atendeai', 'conversation', 'appointment');
```

**Performance issues:**
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM appointments WHERE clinic_id = 'uuid';

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats WHERE schemaname = 'atendeai';
```

## 📚 References

- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth & RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Migration Best Practices](https://www.postgresql.org/docs/current/ddl-alter.html)

---

**Last Updated**: 2025-01-20  
**Schema Version**: 002 (Core + RLS)  
**Compatible With**: PostgreSQL 15+, Supabase