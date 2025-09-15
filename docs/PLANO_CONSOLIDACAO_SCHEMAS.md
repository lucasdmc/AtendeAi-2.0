# PLANO DE CONSOLIDAÇÃO DE SCHEMAS - ATENDEAI 2.0

## 🎯 OBJETIVO
Consolidar 29 schemas em 1 schema principal (`atendeai`) para eliminar complexidade desnecessária e melhorar performance.

---

## 📋 ESTRUTURA PROPOSTA

### Schema Principal: `atendeai`
**Mantém todas as tabelas atuais + tabelas consolidadas dos outros schemas**

#### Tabelas Existentes (MANTER)
```
✅ JÁ NO SCHEMA ATENDEAI:
- api_keys
- audit_logs  
- clinics
- permissions
- role_permissions
- roles
- sessions
- system_config
- user_roles
- user_sessions
- users
```

#### Tabelas para Migrar (CONSOLIDAR)
```
🔄 MIGRAR DE OUTROS SCHEMAS:

De 'conversation':
- conversations → atendeai.conversations
- messages → atendeai.messages  
- conversation_memory → atendeai.conversation_memory

De 'appointment':
- appointments → atendeai.appointments
- appointment_flow → atendeai.appointment_flow
- professionals → atendeai.professionals
- services → atendeai.services

De 'clinic':
- clinic_configurations → atendeai.clinic_configurations
- contextualization → atendeai.contextualization  
- scheduling_policies → atendeai.scheduling_policies
- working_hours → atendeai.working_hours

De 'whatsapp':
- configurations → atendeai.whatsapp_configurations
- messages → atendeai.whatsapp_messages
- webhooks → atendeai.whatsapp_webhooks

De 'google_calendar':
- calendar_events → atendeai.calendar_events
- calendar_mappings → atendeai.calendar_mappings
- google_configurations → atendeai.google_configurations

De 'public':
- appointment_availability → atendeai.appointment_availability
- appointments → atendeai.public_appointments (renomear para evitar conflito)
```

---

## 🔧 SCRIPT DE MIGRAÇÃO

### Passo 1: Backup Completo
```sql
-- Backup de todos os schemas
pg_dump -h db.kytphnasmdvebmdvvwtx.supabase.co -U postgres -d postgres --schema=atendeai > backup_atendeai.sql
pg_dump -h db.kytphnasmdvebmdvvwtx.supabase.co -U postgres -d postgres --schema=conversation > backup_conversation.sql
pg_dump -h db.kytphnasmdvebmdvvwtx.supabase.co -U postgres -d postgres --schema=appointment > backup_appointment.sql
pg_dump -h db.kytphnasmdvebmdvvwtx.supabase.co -U postgres -d postgres --schema=clinic > backup_clinic.sql
pg_dump -h db.kytphnasmdvebmdvvwtx.supabase.co -U postgres -d postgres --schema=whatsapp > backup_whatsapp.sql
pg_dump -h db.kytphnasmdvebmdvvwtx.supabase.co -U postgres -d postgres --schema=google_calendar > backup_google_calendar.sql
```

### Passo 2: Resolver Duplicações
```sql
-- Decidir qual tabela 'appointments' manter
-- Opção A: Manter appointment.appointments (mais completa)
-- Opção B: Manter public.appointments (mais simples)

-- Decidir qual tabela 'messages' manter  
-- Opção A: Manter conversation.messages (mais estruturada)
-- Opção B: Manter whatsapp.messages (mais específica)
```

### Passo 3: Migração das Tabelas
```sql
-- Migrar conversation schema
ALTER TABLE conversation.conversations SET SCHEMA atendeai;
ALTER TABLE conversation.messages SET SCHEMA atendeai;
ALTER TABLE conversation.conversation_memory SET SCHEMA atendeai;

-- Migrar appointment schema
ALTER TABLE appointment.appointments SET SCHEMA atendeai;
ALTER TABLE appointment.appointment_flow SET SCHEMA atendeai;
ALTER TABLE appointment.professionals SET SCHEMA atendeai;
ALTER TABLE appointment.services SET SCHEMA atendeai;

-- Migrar clinic schema
ALTER TABLE clinic.clinic_configurations SET SCHEMA atendeai;
ALTER TABLE clinic.contextualization SET SCHEMA atendeai;
ALTER TABLE clinic.scheduling_policies SET SCHEMA atendeai;
ALTER TABLE clinic.working_hours SET SCHEMA atendeai;

-- Migrar whatsapp schema
ALTER TABLE whatsapp.configurations SET SCHEMA atendeai;
ALTER TABLE whatsapp.messages SET SCHEMA atendeai;
ALTER TABLE whatsapp.webhooks SET SCHEMA atendeai;

-- Migrar google_calendar schema
ALTER TABLE google_calendar.calendar_events SET SCHEMA atendeai;
ALTER TABLE google_calendar.calendar_mappings SET SCHEMA atendeai;
ALTER TABLE google_calendar.google_configurations SET SCHEMA atendeai;

-- Migrar public schema
ALTER TABLE public.appointment_availability SET SCHEMA atendeai;
-- Renomear public.appointments para evitar conflito
ALTER TABLE public.appointments RENAME TO public_appointments;
ALTER TABLE public.public_appointments SET SCHEMA atendeai;
```

### Passo 4: Renomear Tabelas para Evitar Conflitos
```sql
-- Renomear tabelas duplicadas
ALTER TABLE atendeai.whatsapp_messages RENAME TO whatsapp_messages;
ALTER TABLE atendeai.public_appointments RENAME TO legacy_appointments;

-- Ou escolher uma das tabelas duplicadas e remover a outra
```

### Passo 5: Atualizar Relacionamentos
```sql
-- Recriar foreign keys entre as tabelas migradas
-- Exemplo:
ALTER TABLE atendeai.conversations 
ADD CONSTRAINT fk_conversations_clinic 
FOREIGN KEY (clinic_id) REFERENCES atendeai.clinics(id);

ALTER TABLE atendeai.messages 
ADD CONSTRAINT fk_messages_conversation 
FOREIGN KEY (conversation_id) REFERENCES atendeai.conversations(id);
```

### Passo 6: Limpeza
```sql
-- Remover schemas vazios
DROP SCHEMA conversation CASCADE;
DROP SCHEMA appointment CASCADE;
DROP SCHEMA clinic CASCADE;
DROP SCHEMA whatsapp CASCADE;
DROP SCHEMA google_calendar CASCADE;
-- Manter public para tabelas do Supabase
```

---

## ⚠️ DECISÕES CRÍTICAS

### 1. Tabela `appointments` Duplicada
**Opções:**
- **A)** Manter `appointment.appointments` (15 colunas, mais completa)
- **B)** Manter `public.appointments` (12 colunas, mais simples)

**Recomendação:** Opção A - `appointment.appointments` é mais robusta

### 2. Tabela `messages` Duplicada  
**Opções:**
- **A)** Manter `conversation.messages` (10 colunas, foco em conversas)
- **B)** Manter `whatsapp.messages` (14 colunas, foco em WhatsApp)

**Recomendação:** Opção B - `whatsapp.messages` é mais específica para o contexto

---

## 🚀 CRONOGRAMA DE EXECUÇÃO

### Dia 1: Preparação
- [ ] Backup completo de todos os schemas
- [ ] Testar scripts em ambiente de desenvolvimento
- [ ] Validar integridade dos dados atuais

### Dia 2: Migração
- [ ] Executar migração das tabelas
- [ ] Resolver duplicações
- [ ] Atualizar relacionamentos
- [ ] Testar integridade pós-migração

### Dia 3: Limpeza e Validação
- [ ] Remover schemas vazios
- [ ] Atualizar aplicações para usar novo schema
- [ ] Executar testes completos
- [ ] Documentar nova estrutura

---

## 📊 BENEFÍCIOS ESPERADOS

### ✅ Redução de Complexidade
- **Antes:** 29 schemas
- **Depois:** 1 schema principal
- **Redução:** 97% menos complexidade

### ✅ Melhoria de Performance
- Joins mais eficientes
- Menos overhead de conexão
- Queries simplificadas

### ✅ Facilidade de Manutenção
- Estrutura única e clara
- Menos confusão para desenvolvedores
- Debugging simplificado

---

## 🎯 PRÓXIMOS PASSOS

1. **Aprovação do Plano** - Revisar e aprovar este plano
2. **Backup de Segurança** - Executar backup completo
3. **Teste em Desenvolvimento** - Validar em ambiente de teste
4. **Execução em Produção** - Implementar migração
5. **Validação Final** - Testar todas as funcionalidades

**Este plano eliminará a complexidade desnecessária e criará uma estrutura de banco de dados limpa e eficiente.**
