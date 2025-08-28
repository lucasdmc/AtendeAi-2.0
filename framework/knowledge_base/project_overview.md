# 🏗️ PROJECT OVERVIEW - ATENDEAI 2.0

---

## 🎯 **VISÃO GERAL DO PROJETO**

**AtendeAI 2.0** é um sistema de microserviços para gestão de clínicas com IA conversacional e agendamentos inteligentes. O projeto segue princípios de **Domain-Driven Design (DDD)** com isolamento completo entre clínicas e arquitetura distribuída.

---

## 🏛️ **ARQUITETURA GERAL**

### **PATRÕES DE DESIGN**
- **Domain-Driven Design (DDD)**: Separação clara de domínios de negócio
- **Microserviços**: Arquitetura distribuída com serviços independentes
- **Event-Driven Architecture**: Comunicação assíncrona entre serviços
- **CQRS**: Separação de comandos e consultas
- **Repository Pattern**: Abstração de acesso a dados

### **PRINCÍPIOS ARQUITETURAIS**
- **Single Responsibility**: Cada serviço tem uma responsabilidade específica
- **Loose Coupling**: Serviços independentes com interfaces bem definidas
- **High Cohesion**: Funcionalidades relacionadas agrupadas
- **Fault Tolerance**: Resiliência e recuperação de falhas
- **Scalability**: Capacidade de escalar horizontalmente

---

## 🔧 **TECNOLOGIAS E FERRAMENTAS**

### **FRONTEND**
- **Framework**: React 18 + TypeScript
- **Roteamento**: React Router v6
- **Estado**: React Context + Local Storage
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Build Tool**: Vite
- **Package Manager**: npm/bun

### **BACKEND**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Banco de Dados**: PostgreSQL 15+
- **ORM**: Prisma (recomendado) ou TypeORM
- **Cache**: Redis
- **Message Queue**: Redis Pub/Sub ou Bull

### **INFRAESTRUTURA**
- **Containerização**: Docker + Docker Compose
- **API Gateway**: Kong
- **Load Balancer**: HAProxy
- **Monitoramento**: Prometheus + Grafana
- **Logs**: ELK Stack ou Winston + Papertrail

### **INTEGRAÇÕES**
- **Autenticação**: Supabase Auth
- **WhatsApp**: WhatsApp Business API
- **Google**: Google Calendar API
- **Email**: SendGrid ou Nodemailer

---

## 📁 **ESTRUTURA DE DIRETÓRIOS**

### **FRONTEND (src/)**
```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── Layout/         # Layout principal da aplicação
│   └── common/         # Componentes comuns
├── pages/              # Páginas/rotas da aplicação
│   ├── Auth.tsx        # ✅ Login funcional com Supabase
│   ├── Index.tsx       # ✅ Dashboard principal
│   ├── Clinics.tsx     # ✅ Gestão de clínicas
│   ├── Users.tsx       # ✅ Gestão de usuários
│   ├── Conversations.tsx # ✅ Chat com IA
│   ├── Appointments.tsx  # ✅ Agendamentos
│   └── Calendar.tsx      # ✅ Calendário
├── hooks/              # Custom hooks React
│   ├── useAuth.tsx     # ❌ Será removido (usa AuthService Custom)
│   └── useToast.tsx    # ✅ Hook de notificações
├── services/           # Serviços de API
│   ├── authService.ts  # ❌ Será removido (duplicado)
│   └── api/            # ✅ Serviços de API reais
├── integrations/       # Integrações externas
│   └── supabase/       # ✅ Cliente Supabase
├── lib/                # Utilitários e configurações
├── types/              # Definições de tipos TypeScript
└── styles/             # Estilos globais
```

### **BACKEND (services/)**
```
services/
├── auth-service/        # ✅ Autenticação JWT
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── routes/
│   ├── Dockerfile
│   └── package.json
├── user-service/        # ✅ Gestão de usuários
├── clinic-service/      # ✅ Gestão de clínicas
├── conversation-service/ # ✅ IA conversacional
├── appointment-service/  # ✅ Agendamentos
├── whatsapp-service/    # ✅ Integração WhatsApp
└── google-calendar-service/ # ✅ Integração Google
```

### **INFRAESTRUTURA**
```
├── docker-compose.yml   # ✅ Configuração Docker
├── haproxy/            # ✅ Configuração HAProxy
├── monitoring/         # ✅ Prometheus + Grafana
├── scripts/            # ✅ Scripts de automação
└── supabase/           # ✅ Configuração banco de dados
```

---

## 🎨 **PADRÕES DE DESIGN FRONTEND**

### **COMPONENTES**
- **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
- **Composition over Inheritance**: Preferir composição
- **Props Interface**: Sempre definir interfaces para props
- **Custom Hooks**: Lógica reutilizável em hooks customizados

### **ESTADO**
- **React Context**: Estado global da aplicação
- **Local State**: Estado local dos componentes
- **Local Storage**: Persistência de dados do usuário
- **Session Storage**: Dados temporários da sessão

### **ROTEAMENTO**
- **Protected Routes**: Rotas que requerem autenticação
- **Public Routes**: Rotas acessíveis sem autenticação
- **Nested Routes**: Rotas aninhadas para funcionalidades complexas
- **Route Guards**: Middleware de proteção de rotas

---

## 🔐 **SISTEMA DE AUTENTICAÇÃO**

### **ARQUITETURA ESCOLHIDA**
**SUPABASE AUTH** - Sistema único de autenticação

### **COMPONENTES**
- **Auth Provider**: Contexto de autenticação
- **Protected Route**: Componente de proteção de rotas
- **Auth Middleware**: Middleware de verificação
- **Role-Based Access Control**: Controle de acesso por perfil

### **FLUXO DE AUTENTICAÇÃO**
1. **Login**: Usuário fornece credenciais
2. **Validação**: Supabase valida credenciais
3. **Sessão**: Criação de sessão autenticada
4. **Proteção**: Verificação de rotas protegidas
5. **Autorização**: Verificação de permissões por role

---

## 🗄️ **MODELO DE DADOS**

### **ENTIDADES PRINCIPAIS**
- **Users**: Usuários do sistema
- **Clinics**: Clínicas multi-tenant
- **Appointments**: Agendamentos
- **Conversations**: Conversas com IA
- **Roles**: Perfis de usuário

### **RELACIONAMENTOS**
- **User → Clinic**: Muitos para muitos
- **User → Role**: Muitos para muitos
- **Clinic → Appointment**: Um para muitos
- **User → Conversation**: Um para muitos

### **POLÍTICAS DE SEGURANÇA**
- **Row Level Security (RLS)**: Isolamento por clínica
- **Role-Based Access**: Controle por perfil
- **Multi-Tenancy**: Separação completa entre clínicas

---

## 🔌 **INTEGRAÇÕES EXTERNAS**

### **SUPABASE**
- **Autenticação**: Login, registro, recuperação de senha
- **Banco de Dados**: PostgreSQL com RLS
- **Storage**: Arquivos e documentos
- **Real-time**: Atualizações em tempo real

### **WHATSAPP BUSINESS API**
- **Envio de Mensagens**: Notificações automáticas
- **Webhooks**: Recebimento de mensagens
- **Templates**: Mensagens pré-aprovadas
- **Status**: Acompanhamento de entrega

### **GOOGLE CALENDAR API**
- **Sincronização**: Agendamentos bidirecionais
- **Notificações**: Lembretes automáticos
- **Integração**: Calendário da clínica

---

## 🚀 **PADRÕES DE IMPLEMENTAÇÃO**

### **CÓDIGO**
- **TypeScript**: Tipagem estática obrigatória
- **ESLint**: Linting de código
- **Prettier**: Formatação automática
- **Husky**: Git hooks para qualidade

### **TESTES**
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Testes de API
- **E2E Tests**: Cypress ou Playwright
- **Coverage**: Mínimo 80% de cobertura

### **DEPLOYMENT**
- **Docker**: Containerização completa
- **Environment Variables**: Configuração por ambiente
- **Health Checks**: Verificação de saúde dos serviços
- **Logs**: Logging estruturado

---

## 📊 **MÉTRICAS E MONITORAMENTO**

### **PERFORMANCE**
- **Lighthouse Score**: Mínimo 90
- **Bundle Size**: Otimização de tamanho
- **Loading Time**: Carregamento < 3s
- **Time to Interactive**: < 2s

### **QUALIDADE**
- **Code Coverage**: Mínimo 80%
- **TypeScript Strict**: Modo estrito ativado
- **No Console Errors**: Sem erros no console
- **Accessibility**: WCAG 2.1 AA compliance

---

## 🔍 **CASOS DE USO PRINCIPAIS**

### **ADMIN LIFY**
- **Gestão Global**: Acesso a todas as clínicas
- **Configuração**: Configurações do sistema
- **Monitoramento**: Métricas e logs

### **ADMIN CLÍNICA**
- **Gestão Local**: Acesso apenas à clínica
- **Usuários**: Gestão de usuários da clínica
- **Configuração**: Configurações da clínica

### **ATENDENTE**
- **Agendamentos**: Gestão de horários
- **Conversas**: Atendimento via chat
- **Calendário**: Visualização de agenda

---

## 📝 **CONVENÇÕES E PADRÕES**

### **NOMENCLATURA**
- **Arquivos**: PascalCase para componentes, camelCase para utilitários
- **Componentes**: PascalCase
- **Hooks**: camelCase com prefixo 'use'
- **Variáveis**: camelCase
- **Constantes**: UPPER_SNAKE_CASE

### **ESTRUTURA DE ARQUIVOS**
- **Um componente por arquivo**
- **Index files para exportações**
- **Separar lógica de apresentação**
- **Agrupar por funcionalidade**

### **COMMITS**
- **Conventional Commits**: feat:, fix:, docs:, style:, refactor:, test:, chore:
- **Mensagens em português**
- **Descrição clara da mudança**

---

**STATUS**: 🏗️ PROJECT OVERVIEW CRIADO  
**ÚLTIMA ATUALIZAÇÃO**: 2024-01-15  
**PRÓXIMA AÇÃO**: Início do desenvolvimento com expert_developer  
**AGENTE RESPONSÁVEL**: context_manager (concluído)
