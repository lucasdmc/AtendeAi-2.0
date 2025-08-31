# 🚀 DOCUMENTAÇÃO DE DESENVOLVIMENTO EM FASES - ATENDEAI 2.0

---

## 📋 **CONTEXTO E OBJETIVO**

**PROJETO**: AtendeAI 2.0 - Sistema Multiclínicas  
**STATUS ATUAL**: 100% implementado (backend + infraestrutura)  
**OBJETIVO**: Evolução do frontend para atender requisitos multiclínicas  
**DOCUMENTO BASE**: `Adaptação novo Front-end.md`  

---

## 🏗️ **ARQUITETURA ATUAL (BASELINE)**

### **STACK TECNOLÓGICA VALIDADA**
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Microserviços Node.js + Express (8 serviços)
- **Database**: PostgreSQL (Supabase) com RLS
- **Auth**: Supabase Auth (implementado)
- **Infraestrutura**: Docker + Kong + HAProxy + Redis

### **MICROSERVIÇOS DISPONÍVEIS**
1. **auth-service** (3001) - Autenticação JWT
2. **user-service** (3002) - Gestão de usuários  
3. **clinic-service** (3003) - Gestão de clínicas
4. **health-service** (3004) - Health checks
5. **conversation-service** (3005) - IA conversacional
6. **appointment-service** (3006) - Agendamentos
7. **whatsapp-service** (3007) - WhatsApp Business API
8. **google-calendar-service** (3008) - Google Calendar

---

## 📊 **PERFIS DE USUÁRIOS E PERMISSÕES**

### **ADMIN LIFY (Super Administrador)**
- **Acesso**: Todas as funcionalidades do sistema
- **Combobox**: Navegar entre todas as clínicas
- **Telas**: Gestão de Clínicas, Gestão de Usuários, Dashboard, Conversas, Agendamentos, Calendários

### **ADMINISTRADOR DE CLÍNICA**
- **Acesso**: Limitado à clínica onde foi criado
- **Combobox**: Não visível
- **Telas**: Gestão de Usuários (sua clínica), Dashboard, Conversas, Agendamentos, Calendários

### **ATENDENTE**
- **Acesso**: Funcionalidades operacionais da sua clínica
- **Combobox**: Não visível  
- **Telas**: Dashboard, Conversas, Agendamentos, Calendários

---

## 🎯 **FASES DE DESENVOLVIMENTO**

## **FASE 1: FUNDAÇÃO MULTICLÍNICAS** 
*Duração: 2-3 semanas*

### **1.1 Gestão de Usuários por Clínica**
**Requisitos**:
- Listar usuários da clínica atual
- Criar novos usuários com campos obrigatórios
- Senhas salvas como hash (segurança)
- Configuração de perfil (Admin Lify, Admin Clínica, Atendente)
- Isolamento por clínica (RLS)

**Implementação**:
```typescript
// Interface para criação de usuário
interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin_lify' | 'admin_clinic' | 'attendant';
  clinic_id: string;
}

// API Endpoints necessários
POST /api/users - Criar usuário
GET /api/users - Listar usuários da clínica
PUT /api/users/:id - Editar usuário  
DELETE /api/users/:id - Remover usuário
```

**Critérios de Aceitação**:
- [ ] Tela de gestão de usuários funcional
- [ ] CRUD completo de usuários
- [ ] Validação de campos obrigatórios
- [ ] Hash de senhas implementado
- [ ] Isolamento por clínica funcionando

### **1.2 Gestão de Clínicas (Admin Lify)**
**Requisitos**:
- Acesso restrito apenas para Admin Lify
- Listar todas as clínicas cadastradas
- Criar novas clínicas com:
  - Nome da Clínica
  - Número de WhatsApp
  - Webhook da Meta (URL)
  - WhatsApp ID number  
  - Campo JSON para configuração

**Implementação**:
```typescript
// Interface para clínica
interface Clinic {
  id: string;
  name: string;
  whatsapp_number: string;
  meta_webhook_url: string;
  whatsapp_id: string;
  config: Record<string, any>; // JSON de configuração
  status: 'active' | 'inactive';
}

// API Endpoints
POST /api/clinics - Criar clínica
GET /api/clinics - Listar clínicas (Admin Lify only)
PUT /api/clinics/:id - Editar clínica
DELETE /api/clinics/:id - Remover clínica
```

**Critérios de Aceitação**:
- [ ] Tela acessível apenas para Admin Lify
- [ ] CRUD completo de clínicas
- [ ] Todos os campos obrigatórios implementados
- [ ] Configuração JSON flexível
- [ ] Isolamento de configurações entre clínicas

### **1.3 Combobox de Seleção de Clínicas**
**Requisitos**:
- Visível apenas para Admin Lify
- Lista dinâmica baseada em permissões
- Seleção persistida por usuário
- Integração com sistema de auth

**Implementação**:
```typescript
// Hook para gestão de clínica ativa
const useActiveClinic = () => {
  const [activeClinic, setActiveClinic] = useState<string | null>(null);
  
  const switchClinic = (clinicId: string) => {
    // Lógica para trocar clínica ativa
    // Persistir no localStorage
    // Atualizar contexto global
  };
  
  return { activeClinic, switchClinic };
};
```

**Critérios de Aceitação**:
- [ ] Combobox visível apenas para Admin Lify
- [ ] Lista dinâmica de clínicas disponíveis
- [ ] Seleção persistida entre sessões
- [ ] Contexto global de clínica ativa funcionando

---

## **FASE 2: INTEGRAÇÃO GOOGLE CALENDAR**
*Duração: 2 semanas*

### **2.1 Autenticação Google OAuth**
**Requisitos**:
- Botão para autenticação Google OAuth
- Fluxo de autenticação completo
- Tokens persistidos por clínica
- Manutenção da integração por longo período

**Implementação**:
```typescript
// Serviço de OAuth Google
interface GoogleOAuthService {
  authenticate(clinicId: string): Promise<{success: boolean, tokens?: any}>;
  refreshTokens(clinicId: string): Promise<boolean>;
  revokeAccess(clinicId: string): Promise<boolean>;
  isAuthenticated(clinicId: string): Promise<boolean>;
}
```

**Critérios de Aceitação**:
- [ ] Botão de autenticação funcional
- [ ] Fluxo OAuth completo
- [ ] Tokens persistidos por clínica
- [ ] Refresh automático de tokens
- [ ] Tratamento de erros de autenticação

### **2.2 Incorporação do Google Calendar**
**Requisitos**:
- Embedar calendários via iframe src
- Exibição de calendários da conta autenticada
- Interface responsiva e integrada

**Implementação**:
```typescript
// Componente de Calendar integrado
const GoogleCalendarEmbed = ({ clinicId }: { clinicId: string }) => {
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Buscar URL do calendário para a clínica
    // Gerar iframe src personalizado
  }, [clinicId]);
  
  return (
    <iframe 
      src={calendarUrl} 
      className="w-full h-screen border-0"
      title="Google Calendar"
    />
  );
};
```

**Critérios de Aceitação**:
- [ ] Calendário incorporado via iframe
- [ ] Exibição responsiva
- [ ] Calendários específicos por clínica
- [ ] Manutenção da integração

---

## **FASE 3: SISTEMA DE AGENDAMENTOS INTELIGENTE**
*Duração: 1-2 semanas*

### **3.1 Sincronização com Google Calendar**
**Requisitos**:
- Verificação de integração ativa
- Carregamento de próximos eventos
- Limite máximo de eventos (UX/UI)
- View padrão quando sem integração

**Implementação**:
```typescript
// Hook para agendamentos
const useAppointments = (clinicId: string) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hasCalendarIntegration, setHasCalendarIntegration] = useState(false);
  
  useEffect(() => {
    // Verificar se há integração Google Calendar
    // Se sim, carregar eventos
    // Se não, mostrar view padrão
  }, [clinicId]);
  
  return { appointments, hasCalendarIntegration };
};
```

**Critérios de Aceitação**:
- [ ] View padrão quando sem calendário
- [ ] Carregamento de eventos quando integrado
- [ ] Limite máximo de eventos respeitado
- [ ] Sincronização eficiente

---

## **FASE 4: INTEGRAÇÃO TELA DE CONVERSAS COM WHATSAPP**
*Duração: 2-3 semanas*

### **4.1 Integração com WhatsApp Service**
**Requisitos**:
- Exibir mensagens recebidas via WhatsApp
- Exibir mensagens enviadas (chatbot ou humano)
- Conectar com whatsapp-service (porta 3007)

**Implementação**:
```typescript
// Service para WhatsApp (já implementado no backend)
interface WhatsAppConversation {
  id: string;
  customer_phone: string;
  clinic_id: string;
  messages: WhatsAppMessage[];
  status: 'active' | 'paused' | 'closed';
  is_bot_active: boolean;
}

// API Integration
const whatsappService = {
  getConversations: (clinicId: string) => 
    fetch(`http://whatsapp-service:3007/conversations?clinic_id=${clinicId}`),
  
  sendMessage: (conversationId: string, message: string) =>
    fetch(`http://whatsapp-service:3007/messages`, {
      method: 'POST',
      body: JSON.stringify({ conversationId, message })
    })
};
```

### **4.2 Controles de Chatbot/Humano**
**Requisitos**:
- Botão "Assumir conversa ON" - parar chatbot
- Botão "Assumir conversa OFF" - reativar chatbot
- Controle por conversa individual

**Implementação**:
```typescript
// Componente de controle de conversa
const ConversationControls = ({ conversationId, isBotActive }) => {
  const toggleBotMode = async (enable: boolean) => {
    await fetch(`http://whatsapp-service:3007/conversations/${conversationId}/bot`, {
      method: 'PUT',
      body: JSON.stringify({ enabled: enable })
    });
  };
  
  return (
    <div className="flex gap-2">
      <Button 
        onClick={() => toggleBotMode(false)}
        variant={!isBotActive ? "default" : "outline"}
      >
        Assumir Conversa ON
      </Button>
      <Button 
        onClick={() => toggleBotMode(true)}
        variant={isBotActive ? "default" : "outline"}
      >
        Assumir Conversa OFF
      </Button>
    </div>
  );
};
```

**Critérios de Aceitação**:
- [ ] Exibição de mensagens recebidas/enviadas
- [ ] Controles ON/OFF funcionais
- [ ] Integração com whatsapp-service ativa
- [ ] Controle individual por conversa
- [ ] Interface intuitiva para atendentes

---

## **FASE 5: TELA DE CONTEXTO E CONFIGURAÇÃO**
*Duração: 1 semana*

### **5.1 Configuração da Clínica**
**Requisitos**:
- Tela para configuração específica da clínica
- Campo JSON para contextualização
- Configurações de IA conversacional
- Isolamento por clínica

**Implementação**:
```typescript
// Interface de configuração
interface ClinicConfig {
  ai_context: string;
  business_hours: {
    start: string;
    end: string;
    days: string[];
  };
  auto_responses: Record<string, string>;
  escalation_rules: {
    keywords: string[];
    action: 'human' | 'priority';
  }[];
}
```

**Critérios de Aceitação**:
- [ ] Tela de configuração acessível por perfil
- [ ] Edição de contexto da IA
- [ ] Configurações salvas por clínica
- [ ] Validação de campos obrigatórios

---

## **FASE 6: DASHBOARD E MÉTRICAS**
*Duração: 1-2 semanas*

### **6.1 Dashboard Multiclínicas**
**Requisitos**:
- Métricas específicas por clínica
- Gráficos de conversas, agendamentos
- Dados em tempo real
- Permissões por perfil

**Implementação**:
```typescript
// Hook para métricas do dashboard
const useDashboardMetrics = (clinicId: string) => {
  const [metrics, setMetrics] = useState({
    conversations_today: 0,
    appointments_today: 0,
    active_conversations: 0,
    bot_response_rate: 0
  });
  
  // Integrar com APIs de métricas dos microserviços
  // conversation-service, appointment-service, whatsapp-service
  
  return metrics;
};
```

**Critérios de Aceitação**:
- [ ] Dashboard específico por clínica
- [ ] Métricas em tempo real
- [ ] Gráficos responsivos
- [ ] Dados isolados por clínica

---

## 🧪 **FASE 7: TESTES E VALIDAÇÃO**
*Duração: 1-2 semanas*

### **7.1 Testes de Integração**
- Teste de fluxo completo multiclínicas
- Validação de isolamento entre clínicas
- Testes de permissões por perfil
- Teste de integração Google Calendar
- Teste de integração WhatsApp

### **7.2 Testes de Performance**
- Carregamento de dados por clínica
- Performance da troca de clínicas (Admin Lify)
- Stress test com múltiplas clínicas

**Implementação**:
```typescript
// Exemplo de teste de isolamento
describe('Clinic Isolation', () => {
  it('should not show users from other clinics', async () => {
    // Login como Admin Clínica A
    // Verificar que não vê usuários da Clínica B
  });
  
  it('should not allow access to other clinic data', async () => {
    // Tentar acessar dados de outra clínica
    // Deve retornar erro 403
  });
});
```

---

## 📋 **CHECKLIST DE ENTREGÁVEIS**

### **FUNCIONALIDADES CORE**
- [ ] Sistema de login com perfis funcionando
- [ ] Combobox de clínicas (Admin Lify only)
- [ ] Gestão de usuários por clínica
- [ ] Gestão de clínicas (Admin Lify only)
- [ ] Integração Google Calendar completa
- [ ] Sistema de agendamentos inteligente
- [ ] Tela de conversas WhatsApp integrada
- [ ] Controles chatbot/humano funcionais
- [ ] Tela de contexto/configuração
- [ ] Dashboard com métricas por clínica

### **SEGURANÇA E ISOLAMENTO**
- [ ] Row Level Security (RLS) funcionando
- [ ] Isolamento completo entre clínicas
- [ ] Verificação de permissões por perfil
- [ ] Senhas hasheadas adequadamente
- [ ] Tokens OAuth seguros por clínica

### **PERFORMANCE E UX**
- [ ] Carregamento rápido de dados
- [ ] Interface responsiva
- [ ] Feedback visual claro
- [ ] Tratamento de erros adequado
- [ ] Transições suaves entre clínicas

---

## 🔧 **ARQUITETURA DE INTEGRAÇÃO**

### **ENDPOINTS DO BACKEND (Já Implementados)**
```bash
# Auth Service (3001)
POST /auth/login
POST /auth/refresh
POST /auth/logout

# User Service (3002)  
GET /users
POST /users
PUT /users/:id
DELETE /users/:id

# Clinic Service (3003)
GET /clinics
POST /clinics  
PUT /clinics/:id
DELETE /clinics/:id

# WhatsApp Service (3007)
GET /conversations
POST /messages
PUT /conversations/:id/bot

# Google Calendar Service (3008)
POST /auth/google
GET /events
POST /events
```

### **INTEGRAÇÃO FRONTEND-BACKEND**
```typescript
// Service Layer Pattern
const clinicService = {
  getClinics: () => api.get('/clinics'),
  createClinic: (data) => api.post('/clinics', data),
  updateClinic: (id, data) => api.put(`/clinics/${id}`, data)
};

// Context para clínica ativa
const ClinicContext = createContext({
  activeClinic: null,
  switchClinic: (id: string) => {},
  clinics: []
});
```

---

## 📅 **CRONOGRAMA RESUMIDO**

| Fase | Duração | Foco Principal |
|------|---------|----------------|
| **Fase 1** | 2-3 semanas | Fundação Multiclínicas |
| **Fase 2** | 2 semanas | Google Calendar |
| **Fase 3** | 1-2 semanas | Agendamentos |
| **Fase 4** | 2-3 semanas | WhatsApp Conversas |
| **Fase 5** | 1 semana | Contexto/Config |
| **Fase 6** | 1-2 semanas | Dashboard |
| **Fase 7** | 1-2 semanas | Testes/Validação |

**TOTAL ESTIMADO**: 10-15 semanas

---

## 🎯 **CRITÉRIOS DE SUCESSO**

### **CRITÉRIOS TÉCNICOS**
- Sistema multiclínicas funcionando com isolamento completo
- Integração Google Calendar estável e persistente
- WhatsApp conversas com controle chatbot/humano eficiente
- Performance adequada com múltiplas clínicas

### **CRITÉRIOS DE NEGÓCIO**
- Admin Lify pode gerenciar todas as clínicas
- Admin Clínica limitado à sua clínica
- Atendentes operam apenas funcionalidades permitidas
- Configurações isoladas e flexíveis por clínica

### **CRITÉRIOS DE QUALIDADE**
- Código limpo e bem documentado
- Testes de integração passando
- Interface intuitiva e responsiva  
- Segurança e isolamento validados

---

**AGENTE RESPONSÁVEL**: discovery_agent  
**DATA DE CRIAÇÃO**: $(date +%Y-%m-%d)  
**STATUS**: 📋 Documentação completa para execução  
**PRÓXIMO PASSO**: Handoff para specification_agent
