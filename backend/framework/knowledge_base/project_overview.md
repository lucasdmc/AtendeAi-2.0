# 🏗️ PROJECT OVERVIEW - ATENDEAI 2.0

---

## 🎯 **VISÃO GERAL DO PROJETO**

### **Nome do Projeto**
**AtendeAI 2.0** - Sistema de Inteligência Artificial para WhatsApp

### **Descrição**
Sistema de IA para WhatsApp que automatiza agendamentos de consultas médicas através de conversas naturais, com contextualização avançada por clínica.

### **Status Atual**
- **Frontend**: React existente com telas funcionais
- **Backend**: Sistema atual que precisa ser substituído por arquitetura robusta
- **Especificação**: Completa e aprovada para Entregável 1

---

## 🏗️ **ARQUITETURA ATUAL**

### **Frontend (Existente - React)**
- **Framework**: React com TypeScript
- **UI Components**: Componentes customizados (Button, Card, Input, etc.)
- **State Management**: Hooks nativos do React
- **Routing**: React Router
- **Styling**: Tailwind CSS com gradientes personalizados

### **Telas Funcionais Identificadas**
1. **Auth.tsx** - Sistema de autenticação
2. **Clinicas.tsx** - Gestão de clínicas
3. **Agendamentos.tsx** - Sistema de agendamentos
4. **Conversas.tsx** - Lista de conversas
5. **ConversaIndividual.tsx** - Conversa individual
6. **Contextualizar.tsx** - Sistema de contextualização
7. **GestaoUsuarios.tsx** - Gestão de usuários
8. **Index.tsx** - Página inicial

---

## 📊 **ESTRUTURA DE DADOS IDENTIFICADA**

### **Clinic Entity (Baseado em Clinicas.tsx)**
```typescript
interface Clinic {
  id: string;
  name: string;
  simulation_mode?: boolean;
  whatsapp_phone?: string;
  contextualization_json?: any;
  created_at: string;
  updated_at: string;
}
```

### **User Entity (Baseado em GestaoUsuarios.tsx)**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  clinic_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}
```

### **Appointment Entity (Baseado em Agendamentos.tsx)**
```typescript
interface Appointment {
  id: string;
  patient_name: string;
  service: string;
  professional: string;
  date: string;
  time: string;
  status: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
}
```

### **Conversation Entity (Baseado em Conversas.tsx)**
```typescript
interface Conversation {
  id: string;
  patient_phone: string;
  patient_name: string;
  status: string;
  last_message: string;
  last_message_at: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
}
```

---

## 🔧 **TECNOLOGIAS E FRAMEWORKS**

### **Frontend (Existente)**
- **Framework**: React 18+ com TypeScript
- **UI Library**: Componentes customizados
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Axios/Fetch (via services)
- **Routing**: React Router v6

### **Backend (A Ser Construído)**
- **Framework**: Node.js com Express/FastAPI
- **Database**: PostgreSQL (Supabase)
- **Cache**: Redis
- **API Gateway**: Kong
- **Containerização**: Docker + Docker Compose
- **Authentication**: JWT com refresh tokens

---

## 📁 **ESTRUTURA DE DIRETÓRIOS**

```
AtendeAí 2.0/
├── .cursor/
│   └── rules/
│       └── delivery_orchestrator.yml
├── framework/
│   ├── knowledge_base/
│   │   ├── CONTEXT.md
│   │   └── project_overview.md (este arquivo)
│   ├── deliverables/
│   │   ├── 01-foundation/
│   │   │   ├── specification.md
│   │   │   ├── database-migration.sql
│   │   │   ├── database-design.md
│   │   │   ├── kong-config.yml
│   │   │   ├── api-design.md
│   │   │   └── supabase-config.env
│   │   ├── 02-clinic-service/
│   │   ├── 03-conversation-service/
│   │   ├── 04-appointment-service/
│   │   ├── 05-integrations/
│   │   ├── 06-monitoring/
│   │   └── ROADMAP.md
│   └── runtime/
│       └── specification.md
├── pages/ (frontend existente)
│   ├── Auth.tsx
│   ├── Clinicas.tsx
│   ├── Agendamentos.tsx
│   ├── Conversas.tsx
│   ├── ConversaIndividual.tsx
│   ├── Contextualizar.tsx
│   ├── GestaoUsuarios.tsx
│   └── Index.tsx
├── components/ (frontend existente)
├── services/ (frontend existente)
├── hooks/ (frontend existente)
├── backend.md (especificação original)
└── README.md
```

---

## 🎯 **CASOS DE USO IDENTIFICADOS**

### **1. Autenticação e Autorização**
- **Login/Logout** de usuários
- **Gestão de sessões** com JWT
- **Controle de acesso** baseado em roles
- **Isolamento** por clínica

### **2. Gestão de Clínicas**
- **CRUD** de clínicas
- **Configuração** de contextualização JSON
- **Configuração** de WhatsApp
- **Modo simulação** para testes

### **3. Gestão de Usuários**
- **CRUD** de usuários por clínica
- **Atribuição** de roles e permissões
- **Controle** de status (ativo/inativo)

### **4. Sistema de Agendamentos**
- **Criação** de agendamentos
- **Gestão** de status
- **Associação** com profissionais e serviços
- **Integração** com Google Calendar

### **5. Sistema de Conversas**
- **Recepção** de mensagens WhatsApp
- **Processamento** com IA
- **Contextualização** por clínica
- **Histórico** de conversas

### **6. Sistema de Contextualização**
- **Carregamento** dinâmico de JSONs
- **Extração** de campos como intenções
- **Cache** inteligente
- **Personalização** por clínica

---

## 🔄 **PADRÕES DE DESIGN IDENTIFICADOS**

### **Frontend Patterns**
- **Component Composition**: Componentes reutilizáveis
- **Custom Hooks**: Lógica de negócio encapsulada
- **Service Layer**: Comunicação com backend
- **Toast Notifications**: Feedback para usuário
- **Form Handling**: Gestão de formulários com validação

### **Backend Patterns (A Implementar)**
- **Microservices Architecture**: Serviços independentes
- **API Gateway Pattern**: Roteamento centralizado
- **Multi-tenancy**: Isolamento por clínica
- **Repository Pattern**: Acesso a dados
- **Service Layer**: Lógica de negócio
- **Circuit Breaker**: Resiliência em integrações

---

## 📊 **REQUISITOS DE INTEGRAÇÃO**

### **APIs Externas**
- **WhatsApp Business API**: Recepção e envio de mensagens
- **Google Calendar API**: Sincronização de agendamentos
- **Supabase**: Banco de dados e autenticação

### **Integrações Internas**
- **Auth Service**: Autenticação e autorização
- **User Service**: Gestão de usuários
- **Clinic Service**: Gestão de clínicas
- **Appointment Service**: Sistema de agendamentos
- **Conversation Service**: Processamento de conversas
- **Contextualization Service**: Sistema de contextualização

---

## 🚀 **ESTRATÉGIA DE IMPLEMENTAÇÃO**

### **Fase 1: Fundação e Infraestrutura (Atual)**
1. **Infraestrutura Docker** completa
2. **Banco de dados** PostgreSQL configurado
3. **Sistema de cache** Redis implementado
4. **Auth Service** funcional
5. **API Gateway** Kong configurado

### **Fase 2: Clinic Service + Contextualização**
1. **Sistema multi-tenant** robusto
2. **Sistema de contextualização** JSON avançado
3. **Gestão de clínicas** funcional

### **Fase 3: Conversation Service + LLM Orchestrator**
1. **Sistema de conversação** WhatsApp
2. **LLM Orchestrator** próprio
3. **Sistema de memória** conversacional

### **Fase 4: Appointment Service + Agendamento**
1. **Máquina de estados** para agendamentos
2. **Integração** com Google Calendar
3. **Sistema de notificações**

---

## 🔍 **DICAS E OBSERVAÇÕES**

### **Compatibilidade Frontend**
- **Manter** estrutura de componentes existente
- **Preservar** hooks e serviços existentes
- **Adaptar** APIs para formato esperado
- **Manter** sistema de toast notifications

### **Performance e Escalabilidade**
- **Cache Redis** para contextualizações
- **Índices** otimizados no PostgreSQL
- **Rate limiting** por endpoint
- **Health checks** para todos os serviços

### **Segurança e Compliance**
- **LGPD** compliance para dados médicos
- **Isolamento** completo entre clínicas
- **Auditoria** de todas as ações
- **JWT** com expiração configurável

---

## 📝 **PRÓXIMOS PASSOS**

### **Imediato (Entregável 1)**
1. **Implementar** infraestrutura Docker
2. **Configurar** banco de dados no Supabase
3. **Implementar** Auth Service
4. **Configurar** Redis Cache
5. **Validar** todos os critérios de aceitação

### **Próximo (Entregável 2)**
1. **Implementar** Clinic Service
2. **Sistema de contextualização** JSON
3. **Gestão de profissionais** e serviços

---

**Documento criado em**: {{ new Date().toISOString() }}  
**Versão**: 1.0.0  
**Status**: READY FOR IMPLEMENTATION  
**Entregável**: 01 - Fundação e Infraestrutura
