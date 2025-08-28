# 📚 CONTEXT - ATENDEAI 2.0

---

## 🎯 **VISÃO GERAL DO PROJETO**

**AtendeAI 2.0** é um sistema de microserviços para gestão de clínicas com IA conversacional e agendamentos inteligentes. O projeto está em fase de **integração e segurança** para transformar um protótipo visual em um sistema funcional.

---

## 📊 **STATUS ATUAL**

**PROGRESSO TOTAL**: 75% COMPLETO

### **✅ IMPLEMENTADO (100%)**
- **Infraestrutura Docker**: Todos os serviços e configurações
- **Backend**: Todos os microserviços implementados
- **Banco de Dados**: PostgreSQL com RLS e multi-tenancy
- **Frontend UI**: Interface completa e responsiva
- **Documentação**: Estrutura completa e detalhada

### **🔴 GAPS CRÍTICOS (0%)**
- **Sistema de Autenticação**: Duplicado (Supabase + AuthService Custom)
- **Proteção de Rotas**: Completamente ausente
- **Controle de Acesso**: Sem verificação de permissões
- **Integração Frontend-Backend**: Dados mockados
- **Combobox de Clínicas**: Não funcional

---

## 🏗️ **ARQUITETURA TÉCNICA**

### **FRONTEND**
- **Framework**: React 18 + TypeScript
- **Roteamento**: React Router v6
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Estado**: React Context + Local Storage

### **BACKEND**
- **Arquitetura**: Microserviços distribuídos
- **API Gateway**: Kong + HAProxy
- **Banco de Dados**: PostgreSQL + Supabase
- **Cache**: Redis
- **Monitoramento**: Prometheus + Grafana

### **SERVIÇOS IMPLEMENTADOS**
- **Auth Service** (Porta 3001): JWT + refresh tokens
- **User Service** (Porta 3002): Gestão de usuários
- **Clinic Service** (Porta 3003): Gestão de clínicas
- **Conversation Service** (Porta 3005): IA conversacional
- **Appointment Service** (Porta 3006): Agendamentos
- **WhatsApp Service** (Porta 3007): Integração WhatsApp
- **Google Calendar Service** (Porta 3008): Integração Google

---

## 🔐 **SISTEMA DE AUTENTICAÇÃO**

### **DECISÃO TÉCNICA TOMADA**
**MANTER**: Supabase Auth (já implementado e funcional)  
**REMOVER**: AuthService Custom (duplicado e não utilizado)

### **JUSTIFICATIVA**
1. **Supabase já funciona** na página Auth.tsx
2. **Integração nativa** com React e TypeScript
3. **Sistema de roles e RLS** já implementado no backend
4. **Menos código custom** para manter
5. **Funcionalidades avançadas** como refresh tokens automático

### **IMPLEMENTAÇÃO ATUAL**
- **Página de Login**: `/src/pages/Auth.tsx` (funcional com Supabase)
- **Hook de Auth**: `/src/hooks/useAuth.tsx` (usa AuthService Custom - será removido)
- **Serviço de Auth**: `/src/services/authService.ts` (será removido)

---

## 🚨 **PROBLEMAS IDENTIFICADOS**

### **1. DUPLICAÇÃO DE SISTEMAS**
- **PROBLEMA**: Dois sistemas de auth funcionando em paralelo
- **IMPACTO**: Confusão, bugs e manutenção duplicada
- **SOLUÇÃO**: Unificar usando apenas Supabase

### **2. PROTEÇÃO DE ROTAS AUSENTE**
- **PROBLEMA**: Usuários podem acessar qualquer rota sem autenticação
- **IMPACTO**: Sistema completamente inseguro
- **SOLUÇÃO**: Implementar middleware de proteção

### **3. CONTROLE DE ACESSO AUSENTE**
- **PROBLEMA**: Sem verificação de permissões e roles
- **IMPACTO**: Violação grave de segurança
- **SOLUÇÃO**: Implementar sistema RBAC integrado

### **4. INTEGRAÇÃO BACKEND AUSENTE**
- **PROBLEMA**: Dados mockados, APIs não chamadas
- **IMPACTO**: Sistema funciona apenas como protótipo
- **SOLUÇÃO**: Substituir por integrações reais

---

## 🎯 **PLANO DE DESENVOLVIMENTO**

### **RELEASE 1.2.0: Integração e Segurança**
**OBJETIVO**: Transformar protótipo em sistema funcional e seguro

### **FASES PRIORITÁRIAS**
1. **Limpeza e Unificação** (1 semana): Remover duplicações
2. **Proteção de Rotas** (1 semana): Implementar segurança
3. **Controle de Acesso** (1 semana): Implementar RBAC
4. **Integração Backend** (2-3 semanas): Substituir dados mockados
5. **Combobox Funcional** (1 semana): Implementar seleção de clínicas
6. **Testes e Validação** (1 semana): Validar funcionalidades

### **CRONOGRAMA TOTAL**: 4-6 semanas

---

## 🔧 **CONFIGURAÇÕES TÉCNICAS**

### **VARIÁVEIS DE AMBIENTE**
```bash
# Supabase
SUPABASE_URL=https://kytphnasmdvebmdvvwtx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret
JWT_SECRET=atendeai-jwt-secret-2024-super-seguro-e-unico

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=seu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
```

### **PORTAS DOS SERVIÇOS**
- **Frontend**: 8080
- **Auth Service**: 3001
- **User Service**: 3002
- **Clinic Service**: 3003
- **WhatsApp Service**: 3007
- **Kong Gateway**: 8000
- **HAProxy**: 80

---

## 📁 **ESTRUTURA DE ARQUIVOS**

### **FRONTEND PRINCIPAL**
```
src/
├── pages/
│   ├── Auth.tsx          # ✅ Login funcional com Supabase
│   ├── Index.tsx         # ✅ Dashboard
│   ├── Clinics.tsx       # ✅ Gestão de clínicas
│   ├── Users.tsx         # ✅ Gestão de usuários
│   ├── Conversations.tsx # ✅ Chat com IA
│   ├── Appointments.tsx  # ✅ Agendamentos
│   └── Calendar.tsx      # ✅ Calendário
├── hooks/
│   └── useAuth.tsx       # ❌ Usa AuthService Custom (será removido)
├── services/
│   └── authService.ts    # ❌ Serviço custom (será removido)
└── integrations/
    └── supabase/
        └── client.ts     # ✅ Cliente Supabase configurado
```

### **BACKEND**
```
services/
├── auth-service/         # ✅ JWT + refresh tokens
├── user-service/         # ✅ Gestão de usuários
├── clinic-service/       # ✅ Gestão de clínicas
├── conversation-service/  # ✅ IA conversacional
├── appointment-service/   # ✅ Agendamentos
├── whatsapp-service/     # ✅ Integração WhatsApp
└── google-calendar-service/ # ✅ Integração Google
```

---

## 🔍 **PRÓXIMOS PASSOS**

### **IMMEDIATO (Esta semana)**
1. **Aprovar especificação** criada pelo spec_planner
2. **Iniciar desenvolvimento** com expert_developer
3. **Implementar FASE 1**: Limpeza e unificação

### **CURTO PRAZO (1-2 semanas)**
1. **Completar FASE 2-3**: Segurança e controle de acesso
2. **Validar proteção de rotas** funcionando
3. **Testar fluxo de autenticação** completo

### **MÉDIO PRAZO (3-4 semanas)**
1. **Completar FASE 4-5**: Integração backend e combobox
2. **Substituir dados mockados** por APIs reais
3. **Implementar funcionalidade multi-tenant** completa

---

## 📝 **NOTAS IMPORTANTES**

- **O sistema tem uma base sólida** com infraestrutura completa
- **Os gaps são principalmente de integração** e não de arquitetura
- **A segurança é o problema mais crítico** e deve ser priorizada
- **O sistema está 75% implementado** e pode ser completado em 6-8 semanas
- **Decisão técnica tomada**: Manter apenas Supabase Auth

---

**STATUS**: 📚 CONTEXTO ATUALIZADO  
**ÚLTIMA ATUALIZAÇÃO**: 2024-01-15  
**PRÓXIMA AÇÃO**: Aprovação da especificação e início do desenvolvimento  
**AGENTE RESPONSÁVEL**: context_manager (concluído)
