# 📅 ENTREGÁVEL 4: APPOINTMENT SERVICE - ATENDEAI 2.0

---

## 🎯 **OBJETIVO**

Implementar o **Appointment Service** completo com sistema de agendamento inteligente, máquina de estados para fluxos de conversa, integração com Google Calendar, e gestão avançada de disponibilidade de profissionais.

---

## 📋 **ESCOPO DO ENTREGÁVEL**

### **Sistema de Agendamento Inteligente**
- [ ] Verificação automática de disponibilidade
- [ ] Sugestões inteligentes de horários
- [ ] Validação de regras de negócio
- [ ] Sistema de confirmação automática

### **Máquina de Estados para Fluxos**
- [ ] Estados configuráveis por clínica
- [ ] Transições automáticas baseadas em contexto
- [ ] Fallbacks para situações excepcionais
- [ ] Rastreamento completo do fluxo

### **Integração com Google Calendar**
- [ ] Sincronização bidirecional de eventos
- [ ] Mapeamento de calendários por profissional
- [ ] Atualizações em tempo real
- [ ] Tratamento de conflitos

### **Gestão de Profissionais**
- [ ] Configurações individuais por profissional
- [ ] Horários de trabalho personalizados
- [ ] Especialidades e serviços
- [ ] Disponibilidade dinâmica

---

## 🏗️ **ARQUITETURA DO SERVIÇO**

### **Componentes Principais**
```
┌─────────────────────────────────────────────────────────────────┐
│                  APPOINTMENT SERVICE                            │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│  Appointment    │  Availability   │  Flow State     │  Google │
│   Manager       │   Engine        │   Machine       │Calendar │
├─────────────────┼─────────────────┼─────────────────┼─────────┤
│  Professional   │  Service        │  Validation     │  Audit  │
│   Manager       │   Manager       │   Engine        │ Service │
└─────────────────┴─────────────────┴─────────────────┴─────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                          │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│   PostgreSQL    │     Redis       │ Google Calendar │ Logging │
│   (Database)    │    (Cache)      │     API         │ (Winston)│
└─────────────────┴─────────────────┴─────────────────┴─────────┘
```

### **Endpoints da API**
```
# Gestão de Agendamentos
POST   /api/appointments                 # Criar agendamento
GET    /api/appointments/:id             # Buscar agendamento
PUT    /api/appointments/:id             # Atualizar agendamento
DELETE /api/appointments/:id             # Cancelar agendamento
PATCH  /api/appointments/:id/status      # Alterar status
GET    /api/appointments                 # Listar agendamentos

# Verificação de Disponibilidade
POST   /api/availability/check           # Verificar disponibilidade
GET    /api/availability/:professional_id # Horários disponíveis
POST   /api/availability/suggest         # Sugerir horários
GET    /api/availability/conflicts       # Verificar conflitos

# Fluxos de Agendamento
POST   /api/flows/start                  # Iniciar fluxo
GET    /api/flows/:id                    # Status do fluxo
PUT    /api/flows/:id/state              # Atualizar estado
POST   /api/flows/:id/complete           # Completar fluxo
GET    /api/flows/:id/history            # Histórico do fluxo

# Profissionais
GET    /api/professionals                # Listar profissionais
GET    /api/professionals/:id            # Buscar profissional
PUT    /api/professionals/:id            # Atualizar profissional
POST   /api/professionals/:id/availability # Configurar disponibilidade

# Serviços
GET    /api/services                     # Listar serviços
GET    /api/services/:id                 # Buscar serviço
POST   /api/services                     # Criar serviço
PUT    /api/services/:id                 # Atualizar serviço

# Google Calendar
POST   /api/google-calendar/sync         # Sincronizar calendário
GET    /api/google-calendar/events       # Listar eventos
POST   /api/google-calendar/events       # Criar evento
PUT    /api/google-calendar/events/:id   # Atualizar evento
DELETE /api/google-calendar/events/:id   # Deletar evento
```

---

## 🗄️ **MODELOS DE DADOS**

### **Tabela: `services` (Schema: `appointment`)**
```sql
CREATE TABLE appointment.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price DECIMAL(10,2),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    google_calendar_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: `professionals` (Schema: `appointment`)**
```sql
CREATE TABLE appointment.professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    crm VARCHAR(20),
    specialties TEXT[],
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    accepts_new_patients BOOLEAN DEFAULT true,
    default_duration_minutes INTEGER DEFAULT 60,
    google_calendar_id VARCHAR(255),
    working_hours JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: `appointments` (Schema: `appointment`)**
```sql
CREATE TABLE appointment.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversation.conversations(id),
    service_id UUID NOT NULL REFERENCES appointment.services(id),
    professional_id UUID REFERENCES appointment.professionals(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_email VARCHAR(255),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    google_calendar_event_id VARCHAR(255),
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Tabela: `appointment_flow` (Schema: `appointment`)**
```sql
CREATE TABLE appointment.appointment_flow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id),
    current_state VARCHAR(50) NOT NULL,
    flow_data JSONB DEFAULT '{}',
    step_history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos JSONB:**
- `flow_data`: Dados do fluxo de agendamento (estado atual, dados coletados, etc.)
- `step_history`: Histórico de passos executados

### **Tabela: `availability_slots` (Schema: `appointment`)**
```sql
CREATE TABLE appointment.availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES appointment.professionals(id),
    service_id UUID NOT NULL REFERENCES appointment.services(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    slot_type VARCHAR(20) DEFAULT 'regular' CHECK (slot_type IN ('regular', 'emergency', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(professional_id, service_id, date, start_time)
);
```

### **Tabela: `appointment_rules` (Schema: `appointment`)**
```sql
CREATE TABLE appointment.appointment_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('scheduling', 'cancellation', 'rescheduling', 'reminder')),
    rule_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, rule_name)
);
```

**Campos JSONB:**
- `rule_data`: Dados da regra específica do tipo

---

## 🔄 **MÁQUINA DE ESTADOS PARA FLUXOS**

### **Estados do Fluxo de Agendamento**
```javascript
class AppointmentFlowStateMachine {
  constructor() {
    this.states = {
      // Estados iniciais
      'greeting': {
        name: 'Saudação',
        description: 'Início da conversa e identificação do usuário',
        actions: ['identify_user', 'ask_intention'],
        transitions: ['user_identified', 'intention_clear']
      },
      
      'intention_collection': {
        name: 'Coleta de Intenção',
        description: 'Identificar o que o usuário quer fazer',
        actions: ['detect_intent', 'confirm_intent'],
        transitions: ['intent_confirmed', 'intent_unclear']
      },
      
      'service_selection': {
        name: 'Seleção de Serviço',
        description: 'Escolher o tipo de serviço desejado',
        actions: ['list_services', 'confirm_service'],
        transitions: ['service_selected', 'service_unclear']
      },
      
      'professional_selection': {
        name: 'Seleção de Profissional',
        description: 'Escolher o profissional preferido',
        actions: ['list_professionals', 'confirm_professional'],
        transitions: ['professional_selected', 'professional_unclear']
      },
      
      'date_selection': {
        name: 'Seleção de Data',
        description: 'Escolher a data preferida',
        actions: ['suggest_dates', 'confirm_date'],
        transitions: ['date_selected', 'date_unclear']
      },
      
      'time_selection': {
        name: 'Seleção de Horário',
        description: 'Escolher o horário preferido',
        actions: ['check_availability', 'suggest_times', 'confirm_time'],
        transitions: ['time_selected', 'time_unavailable']
      },
      
      'patient_info': {
        name: 'Informações do Paciente',
        description: 'Coletar dados do paciente',
        actions: ['ask_name', 'ask_phone', 'ask_email', 'confirm_info'],
        transitions: ['info_complete', 'info_incomplete']
      },
      
      'confirmation': {
        name: 'Confirmação',
        description: 'Confirmar todos os detalhes do agendamento',
        actions: ['summarize_appointment', 'ask_confirmation'],
        transitions: ['confirmed', 'needs_changes']
      },
      
      'scheduling': {
        name: 'Agendamento',
        description: 'Executar o agendamento no sistema',
        actions: ['create_appointment', 'sync_calendar', 'send_confirmation'],
        transitions: ['scheduled', 'scheduling_failed']
      },
      
      'completion': {
        name: 'Conclusão',
        description: 'Finalizar o fluxo com sucesso',
        actions: ['send_summary', 'end_conversation'],
        transitions: ['completed']
      },
      
      'error': {
        name: 'Erro',
        description: 'Estado de erro que requer intervenção',
        actions: ['log_error', 'escalate_to_human'],
        transitions: ['retry', 'escalated']
      }
    };
    
    this.transitions = {
      'greeting': {
        'user_identified': 'intention_collection',
        'intention_clear': 'service_selection'
      },
      'intention_collection': {
        'intent_confirmed': 'service_selection',
        'intent_unclear': 'error'
      },
      'service_selection': {
        'service_selected': 'professional_selection',
        'service_unclear': 'error'
      },
      'professional_selection': {
        'professional_selected': 'date_selection',
        'professional_unclear': 'error'
      },
      'date_selection': {
        'date_selected': 'time_selection',
        'date_unclear': 'error'
      },
      'time_selection': {
        'time_selected': 'patient_info',
        'time_unavailable': 'date_selection'
      },
      'patient_info': {
        'info_complete': 'confirmation',
        'info_incomplete': 'error'
      },
      'confirmation': {
        'confirmed': 'scheduling',
        'needs_changes': 'service_selection'
      },
      'scheduling': {
        'scheduled': 'completion',
        'scheduling_failed': 'error'
      },
      'completion': {
        'completed': 'end'
      },
      'error': {
        'retry': 'greeting',
        'escalated': 'end'
      }
    };
  }

  // Executar transição de estado
  async transitionTo(flowId, newState, context) {
    const currentFlow = await this.getFlow(flowId);
    const currentState = currentFlow.current_state;
    
    // Verificar se a transição é válida
    if (!this.isValidTransition(currentState, newState)) {
      throw new Error(`Invalid transition from ${currentState} to ${newState}`);
    }
    
    // Executar ações de saída do estado atual
    await this.executeExitActions(currentState, context);
    
    // Atualizar estado
    await this.updateFlowState(flowId, newState);
    
    // Executar ações de entrada do novo estado
    await this.executeEntryActions(newState, context);
    
    // Registrar transição no histórico
      await this.logTransition(flowId, currentState, newState, context);
    
    return newState;
  }

  // Verificar se a transição é válida
  isValidTransition(fromState, toState) {
    const validTransitions = this.transitions[fromState];
    if (!validTransitions) return false;
    
    return Object.values(validTransitions).includes(toState);
  }

  // Executar ações de entrada de um estado
  async executeEntryActions(state, context) {
    const stateConfig = this.states[state];
    if (!stateConfig || !stateConfig.actions) return;
    
    for (const action of stateConfig.actions) {
      await this.executeAction(action, context);
    }
  }

  // Executar ações de saída de um estado
  async executeExitActions(state, context) {
    const stateConfig = this.states[state];
    if (!stateConfig || !stateConfig.exitActions) return;
    
    for (const action of stateConfig.exitActions) {
      await this.executeAction(action, context);
    }
  }

  // Executar uma ação específica
  async executeAction(actionName, context) {
    switch (actionName) {
      case 'identify_user':
        return await this.identifyUser(context);
      case 'ask_intention':
        return await this.askIntention(context);
      case 'detect_intent':
        return await this.detectIntent(context);
      case 'list_services':
        return await this.listServices(context);
      case 'check_availability':
        return await this.checkAvailability(context);
      case 'suggest_times':
        return await this.suggestTimes(context);
      case 'create_appointment':
        return await this.createAppointment(context);
      case 'sync_calendar':
        return await this.syncGoogleCalendar(context);
      default:
        console.log(`Action ${actionName} not implemented`);
    }
  }
}
```

### **Implementação das Ações**
```javascript
class AppointmentActions {
  // Identificar usuário
  async identifyUser(context) {
    const { conversationId, message } = context;
    
    // Extrair informações do usuário da mensagem
    const userInfo = await this.extractUserInfo(message);
    
    // Atualizar contexto da conversa
    await this.updateConversationContext(conversationId, {
      user_name: userInfo.name,
      user_phone: userInfo.phone,
      user_email: userInfo.email
    });
    
    return {
      success: true,
      user_identified: true,
      next_action: 'ask_intention'
    };
  }

  // Perguntar intenção
  async askIntention(context) {
    const { conversationId, clinicContext } = context;
    
    const message = `Olá! Como posso ajudá-lo hoje? 
    
    Posso ajudá-lo com:
    📅 Agendamento de consulta
    🔄 Reagendamento
    ❌ Cancelamento
    ℹ️ Informações sobre a clínica
    💬 Outras dúvidas`;
    
    // Enviar mensagem via WhatsApp
    await this.sendWhatsAppMessage(conversationId, message);
    
    return {
      success: true,
      message_sent: true,
      next_action: 'wait_response'
    };
  }

  // Detectar intenção
  async detectIntent(context) {
    const { conversationId, message } = context;
    
    // Usar o Conversation Service para detectar intenção
    const intent = await this.conversationService.detectIntent(message, context);
    
    // Atualizar contexto com a intenção detectada
    await this.updateConversationContext(conversationId, {
      detected_intent: intent.intent,
      intent_confidence: intent.confidence,
      intent_entities: intent.entities
    });
    
    return {
      success: true,
      intent_detected: true,
      intent: intent.intent,
      confidence: intent.confidence
    };
  }

  // Listar serviços
  async listServices(context) {
    const { conversationId, clinicId } = context;
    
    // Buscar serviços disponíveis da clínica
    const services = await this.getClinicServices(clinicId);
    
    const message = `Aqui estão nossos serviços disponíveis:
    
${services.map(service => 
  `🏥 ${service.name}
   ⏱️ ${service.duration_minutes} minutos
   💰 R$ ${service.price}
   📝 ${service.description}`
).join('\n\n')}

Qual serviço você gostaria de agendar?`;
    
    // Enviar mensagem via WhatsApp
    await this.sendWhatsAppMessage(conversationId, message);
    
    return {
      success: true,
      services_listed: true,
      services_count: services.length
    };
  }

  // Verificar disponibilidade
  async checkAvailability(context) {
    const { conversationId, serviceId, professionalId, date } = context;
    
    // Verificar slots disponíveis
    const availableSlots = await this.getAvailableSlots(serviceId, professionalId, date);
    
    if (availableSlots.length === 0) {
      const message = `Desculpe, não há horários disponíveis para ${date}. 
      
      Gostaria de verificar outra data?`;
      
      await this.sendWhatsAppMessage(conversationId, message);
      
      return {
        success: false,
        no_availability: true,
        next_action: 'suggest_alternative_date'
      };
    }
    
    return {
      success: true,
      slots_available: true,
      available_slots: availableSlots
    };
  }

  // Sugerir horários
  async suggestTimes(context) {
    const { conversationId, availableSlots } = context;
    
    const message = `Horários disponíveis:
    
${availableSlots.map(slot => 
  `🕐 ${slot.start_time} - ${slot.end_time}`
).join('\n')}

Qual horário você prefere?`;
    
    await this.sendWhatsAppMessage(conversationId, message);
    
    return {
      success: true,
      times_suggested: true,
      suggested_times: availableSlots
    };
  }

  // Criar agendamento
  async createAppointment(context) {
    const { conversationId, appointmentData } = context;
    
    try {
      // Criar agendamento no banco
      const appointment = await this.appointmentService.create(appointmentData);
      
      // Sincronizar com Google Calendar
      const calendarEvent = await this.syncGoogleCalendar(context);
      
      // Enviar confirmação
      const message = `✅ Agendamento confirmado!
      
📅 Data: ${appointment.appointment_date}
🕐 Horário: ${appointment.start_time}
🏥 Serviço: ${appointment.service_name}
👨‍⚕️ Profissional: ${appointment.professional_name}
👤 Paciente: ${appointment.patient_name}

📱 Você receberá um lembrete 24h antes da consulta.
❓ Para alterações, entre em contato conosco.`;
      
      await this.sendWhatsAppMessage(conversationId, message);
      
      return {
        success: true,
        appointment_created: true,
        appointment_id: appointment.id,
        calendar_synced: !!calendarEvent
      };
    } catch (error) {
      console.error('Error creating appointment:', error);
      
      const message = `❌ Desculpe, houve um erro ao criar o agendamento.
      
      Por favor, tente novamente ou entre em contato conosco.`;
      
      await this.sendWhatsAppMessage(conversationId, message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sincronizar com Google Calendar
  async syncGoogleCalendar(context) {
    const { appointmentData, clinicContext } = context;
    
    try {
      const eventData = {
        summary: `Consulta: ${appointmentData.service_name}`,
        description: `Paciente: ${appointmentData.patient_name}
Telefone: ${appointmentData.patient_phone}
Notas: ${appointmentData.notes || 'Nenhuma'}`,
        start: {
          dateTime: `${appointmentData.appointment_date}T${appointmentData.start_time}:00`,
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: `${appointmentData.appointment_date}T${appointmentData.end_time}:00`,
          timeZone: 'America/Sao_Paulo'
        },
        attendees: [
          { email: appointmentData.patient_email },
          { email: appointmentData.professional_email }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 }
          ]
        }
      };
      
      // Criar evento no Google Calendar
      const event = await this.googleCalendarService.createEvent(eventData);
      
      // Atualizar agendamento com ID do evento
      await this.updateAppointmentCalendarId(appointmentData.id, event.id);
      
      return event;
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      throw error;
    }
  }
}
```

---

## 📅 **SISTEMA DE VERIFICAÇÃO DE DISPONIBILIDADE**

### **Engine de Disponibilidade**
```javascript
class AvailabilityEngine {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos
  }

  // Verificar disponibilidade para um serviço/profissional/data
  async checkAvailability(serviceId, professionalId, date, duration = null) {
    const cacheKey = `${serviceId}:${professionalId}:${date}`;
    
    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }
    }
    
    // Buscar dados do banco
    const availability = await this.calculateAvailability(serviceId, professionalId, date, duration);
    
    // Atualizar cache
    this.cache.set(cacheKey, {
      data: availability,
      timestamp: Date.now()
    });
    
    return availability;
  }

  // Calcular disponibilidade
  async calculateAvailability(serviceId, professionalId, date, duration) {
    // 1. Buscar configurações do serviço
    const service = await this.getService(serviceId);
    const serviceDuration = duration || service.duration_minutes;
    
    // 2. Buscar configurações do profissional
    const professional = await this.getProfessional(professionalId);
    
    // 3. Buscar horários de trabalho
    const workingHours = await this.getWorkingHours(professionalId, date);
    
    // 4. Buscar agendamentos existentes
    const existingAppointments = await this.getExistingAppointments(professionalId, date);
    
    // 5. Calcular slots disponíveis
    const availableSlots = this.calculateAvailableSlots(
      workingHours,
      existingAppointments,
      serviceDuration
    );
    
    return {
      service: service,
      professional: professional,
      date: date,
      working_hours: workingHours,
      existing_appointments: existingAppointments,
      available_slots: availableSlots,
      total_slots: availableSlots.length
    };
  }

  // Calcular slots disponíveis
  calculateAvailableSlots(workingHours, existingAppointments, serviceDuration) {
    const availableSlots = [];
    
    for (const workingHour of workingHours) {
      const startTime = new Date(`2000-01-01T${workingHour.start_time}`);
      const endTime = new Date(`2000-01-01T${workingHour.end_time}`);
      
      // Gerar slots de acordo com a duração do serviço
      let currentSlot = new Date(startTime);
      
      while (currentSlot < endTime) {
        const slotEnd = new Date(currentSlot.getTime() + serviceDuration * 60000);
        
        if (slotEnd <= endTime) {
          // Verificar se o slot não conflita com agendamentos existentes
          const hasConflict = this.checkSlotConflict(
            currentSlot,
            slotEnd,
            existingAppointments
          );
          
          if (!hasConflict) {
            availableSlots.push({
              start_time: currentSlot.toTimeString().slice(0, 5),
              end_time: slotEnd.toTimeString().slice(0, 5),
              duration_minutes: serviceDuration
            });
          }
        }
        
        // Avançar para o próximo slot
        currentSlot = slotEnd;
      }
    }
    
    return availableSlots;
  }

  // Verificar conflito de slot
  checkSlotConflict(slotStart, slotEnd, existingAppointments) {
    for (const appointment of existingAppointments) {
      const appointmentStart = new Date(`2000-01-01T${appointment.start_time}`);
      const appointmentEnd = new Date(`2000-01-01T${appointment.end_time}`);
      
      // Verificar sobreposição
      if (slotStart < appointmentEnd && slotEnd > appointmentStart) {
        return true; // Conflito detectado
      }
    }
    
    return false; // Sem conflito
  }

  // Sugerir horários alternativos
  async suggestAlternativeTimes(serviceId, professionalId, preferredDate, preferredTime) {
    const suggestions = [];
    
    // 1. Mesmo dia, horários próximos
    const sameDaySlots = await this.checkAvailability(serviceId, professionalId, preferredDate);
    const nearbySlots = this.findNearbySlots(sameDaySlots.available_slots, preferredTime);
    
    if (nearbySlots.length > 0) {
      suggestions.push({
        type: 'same_day',
        date: preferredDate,
        slots: nearbySlots,
        priority: 'high'
      });
    }
    
    // 2. Próximos dias
    for (let i = 1; i <= 7; i++) {
      const alternativeDate = new Date(preferredDate);
      alternativeDate.setDate(alternativeDate.getDate() + i);
      
      const alternativeSlots = await this.checkAvailability(serviceId, professionalId, alternativeDate.toISOString().split('T')[0]);
      
      if (alternativeSlots.available_slots.length > 0) {
        suggestions.push({
          type: 'alternative_day',
          date: alternativeDate.toISOString().split('T')[0],
          slots: alternativeSlots.available_slots,
          priority: i <= 3 ? 'medium' : 'low'
        });
      }
    }
    
    // 3. Outros profissionais para o mesmo serviço
    const otherProfessionals = await this.getProfessionalsForService(serviceId, preferredDate);
    
    for (const prof of otherProfessionals) {
      if (prof.id !== professionalId) {
        const profSlots = await this.checkAvailability(serviceId, prof.id, preferredDate);
        
        if (profSlots.available_slots.length > 0) {
          suggestions.push({
            type: 'alternative_professional',
            professional: prof,
            date: preferredDate,
            slots: profSlots.available_slots,
            priority: 'medium'
          });
        }
      }
    }
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Encontrar slots próximos
  findNearbySlots(availableSlots, preferredTime) {
    const preferred = new Date(`2000-01-01T${preferredTime}`);
    const nearby = [];
    
    for (const slot of availableSlots) {
      const slotTime = new Date(`2000-01-01T${slot.start_time}`);
      const diffMinutes = Math.abs(slotTime.getTime() - preferred.getTime()) / 60000;
      
      if (diffMinutes <= 60) { // Dentro de 1 hora
        nearby.push({
          ...slot,
          distance_minutes: diffMinutes
        });
      }
    }
    
    return nearby.sort((a, b) => a.distance_minutes - b.distance_minutes);
  }
}
```

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **Estrutura de Arquivos**
```
appointment-service/
├── src/
│   ├── controllers/
│   │   ├── appointmentController.js
│   │   ├── availabilityController.js
│   │   ├── flowController.js
│   │   ├── professionalController.js
│   │   ├── serviceController.js
│   │   └── googleCalendarController.js
│   ├── services/
│   │   ├── appointmentService.js
│   │   ├── availabilityService.js
│   │   ├── flowService.js
│   │   ├── professionalService.js
│   │   ├── serviceService.js
│   │   ├── googleCalendarService.js
│   │   ├── stateMachine.js
│   │   └── cacheService.js
│   ├── models/
│   │   ├── appointment.js
│   │   ├── availability.js
│   │   ├── flow.js
│   │   ├── professional.js
│   │   ├── service.js
│   │   └── appointmentRule.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── rateLimit.js
│   │   └── multiTenant.js
│   ├── routes/
│   │   ├── appointment.js
│   │   ├── availability.js
│   │   ├── flow.js
│   │   ├── professional.js
│   │   ├── service.js
│   │   └── googleCalendar.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── validator.js
│   │   ├── cache.js
│   │   ├── dateUtils.js
│   │   └── timeUtils.js
│   └── config/
│       ├── database.js
│       ├── redis.js
│       ├── googleCalendar.js
│       └── validation.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile
├── package.json
└── README.md
```

### **Dependências Principais**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "googleapis": "^128.0.0",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "moment": "^2.29.4",
    "moment-timezone": "^0.5.43"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "nodemon": "^3.0.2",
    "eslint": "^8.56.0"
  }
}
```

---

## 🧪 **TESTES IMPLEMENTADOS**

### **Testes Unitários**
- [ ] Máquina de estados
- [ ] Engine de disponibilidade
- [ ] Validação de regras
- [ ] Utilitários de data/hora

### **Testes de Integração**
- [ ] Integração com Google Calendar
- [ ] Sistema de cache
- [ ] Banco de dados
- [ ] Validação de endpoints

### **Testes End-to-End**
- [ ] Fluxo completo de agendamento
- [ ] Verificação de disponibilidade
- [ ] Sincronização de calendário
- [ ] Tratamento de conflitos

---

## 📊 **MÉTRICAS E MONITORAMENTO**

### **Métricas de Negócio**
- **Total de agendamentos** criados/confirmados/cancelados
- **Taxa de confirmação** de agendamentos
- **Tempo médio** de agendamento
- **Satisfação** do usuário

### **Métricas Técnicas**
- **Response time** das APIs
- **Taxa de erro** por endpoint
- **Performance** do cache
- **Sincronização** com Google Calendar

### **Alertas Configurados**
- **Alta latência** (> 500ms)
- **Alta taxa de erro** (> 5%)
- **Falha na sincronização** com Google Calendar
- **Conflitos** de agendamento

---

## 🔒 **SEGURANÇA IMPLEMENTADA**

### **Autenticação e Autorização**
- **JWT** com refresh tokens
- **Multi-tenancy** com isolamento completo
- **Rate limiting** por usuário/IP
- **Validação** de entrada rigorosa

### **Validação de Regras**
- **Regras de negócio** configuráveis
- **Validação** de disponibilidade
- **Prevenção** de conflitos
- **Auditoria** completa

---

## 🚀 **COMO EXECUTAR**

### **1. Configurar Ambiente**
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com configurações do Google Calendar
```

### **2. Executar Testes**
```bash
# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes end-to-end
npm run test:e2e

# Todos os testes
npm test
```

### **3. Iniciar Serviço**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Docker
docker-compose up appointment-service
```

---

## 🎯 **CRITÉRIOS DE ACEITAÇÃO**

### **Funcionalidade**
- [ ] Sistema de agendamento funcionando
- [ ] Máquina de estados operacional
- [ ] Verificação de disponibilidade ativa
- [ ] Integração com Google Calendar funcionando

### **Performance**
- [ ] Response time < 500ms para 95% das requisições
- [ ] Cache hit ratio > 85%
- [ ] Uptime > 99.5%
- [ ] Throughput > 500 agendamentos/hora

### **Qualidade**
- [ ] Cobertura de testes > 90%
- [ ] Documentação completa
- [ ] Logs estruturados funcionando
- [ ] Métricas sendo coletadas

---

## 🏆 **CONCLUSÃO**

O **Entregável 4: Appointment Service** implementa o sistema completo de agendamento com máquina de estados inteligente, verificação de disponibilidade avançada e integração com Google Calendar.

### **Valor Entregue**
- ✅ **Sistema de agendamento** multi-tenant completo
- ✅ **Máquina de estados** para fluxos inteligentes
- ✅ **Engine de disponibilidade** avançado
- ✅ **Integração com Google Calendar** bidirecional
- ✅ **Gestão de profissionais** e serviços
- ✅ **Validação de regras** configurável

### **Status Final**
**🔄 ENTREGÁVEL 4 EM DESENVOLVIMENTO**  
**📋 PRONTO PARA IMPLEMENTAÇÃO**

---

**Documento**: specification.md  
**Entregável**: 04-appointment-service  
**Status**: 🔄 EM DESENVOLVIMENTO  
**Data**: 2024-01-15  
**Versão**: 1.0.0  
**Próxima Fase**: Implementação e testes
