# 🔗 ENTREGÁVEL 5: INTEGRATIONS SERVICE - ATENDEAI 2.0

---

## 🎯 **OBJETIVO**

Implementar o **Integrations Service** completo com integrações para WhatsApp Business API, Google Calendar, e outras APIs externas necessárias para o funcionamento do sistema.

---

## 📋 **ESCOPO DO ENTREGÁVEL**

### **WhatsApp Business API**
- [ ] Webhook para recebimento de mensagens
- [ ] Envio de mensagens automáticas
- [ ] Gestão de templates de mensagem
- [ ] Sistema de notificações

### **Google Calendar Integration**
- [ ] Sincronização bidirecional de eventos
- [ ] Mapeamento de calendários por clínica
- [ ] Tratamento de conflitos e atualizações
- [ ] Gestão de permissões OAuth2

### **Outras Integrações**
- [ ] Sistema de pagamentos (Stripe/PayPal)
- [ ] Serviços de SMS
- [ ] APIs de geolocalização
- [ ] Serviços de notificação push

---

## 🏗️ **ARQUITETURA DO SERVIÇO**

### **Componentes Principais**
```
┌─────────────────────────────────────────────────────────────────┐
│                  INTEGRATIONS SERVICE                           │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│  WhatsApp       │  Google         │  Payment        │  Other  │
│   Manager       │  Calendar       │   Gateway       │   APIs  │
├─────────────────┼─────────────────┼─────────────────┼─────────┤
│  Webhook        │  OAuth2         │  Stripe         │  SMS    │
│  Handler        │  Manager        │  Integration    │ Service │
└─────────────────┴─────────────────┴─────────────────┴─────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                          │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│   PostgreSQL    │     Redis       │   External      │ Logging │
│   (Database)    │    (Cache)      │     APIs        │ (Winston)│
└─────────────────┴─────────────────┴─────────────────┴─────────┘
```

---

## 🗄️ **MODELOS DE DADOS**

### **WhatsApp Tables**
```sql
-- Tabela de mensagens WhatsApp
CREATE TABLE whatsapp.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id),
    conversation_id UUID REFERENCES conversation.conversations(id),
    whatsapp_message_id VARCHAR(255) UNIQUE,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    content TEXT,
    media_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'received',
    direction VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações WhatsApp
CREATE TABLE whatsapp.configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id),
    phone_number_id VARCHAR(255) NOT NULL,
    access_token VARCHAR(500) NOT NULL,
    business_account_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Google Calendar Tables**
```sql
-- Eventos do calendário
CREATE TABLE google_calendar.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id),
    appointment_id UUID REFERENCES appointment.appointments(id),
    google_calendar_id VARCHAR(255) UNIQUE,
    event_summary VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    attendees JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações Google
CREATE TABLE google_calendar.google_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id),
    client_id VARCHAR(255) NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📱 **WHATSAPP BUSINESS API**

### **Webhook Handler**
```javascript
class WhatsAppWebhookHandler {
  async handleWebhook(req, res) {
    try {
      const { body } = req;
      
      // Verificar se é uma mensagem
      if (body.entry && body.entry[0].changes) {
        for (const change of body.entry[0].changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              await this.processIncomingMessage(message);
            }
          }
        }
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Error');
    }
  }

  async processIncomingMessage(message) {
    // Processar mensagem recebida
    const conversation = await this.findOrCreateConversation(message);
    await this.saveMessage(message, conversation.id);
    await this.triggerConversationFlow(conversation.id, message);
  }
}
```

---

## 📅 **GOOGLE CALENDAR INTEGRATION**

### **OAuth2 Manager**
```javascript
class GoogleOAuth2Manager {
  async getAuthUrl(clinicId) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: clinicId
    });
  }

  async handleCallback(code, clinicId) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    const { tokens } = await oauth2Client.getToken(code);
    
    await this.saveTokens(clinicId, tokens);
    return tokens;
  }
}
```

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **Estrutura de Arquivos**
```
integrations-service/
├── src/
│   ├── controllers/
│   │   ├── whatsappController.js
│   │   ├── googleCalendarController.js
│   │   └── paymentController.js
│   ├── services/
│   │   ├── whatsappService.js
│   │   ├── googleCalendarService.js
│   │   └── paymentService.js
│   ├── models/
│   │   ├── whatsappMessage.js
│   │   ├── calendarEvent.js
│   │   └── paymentTransaction.js
│   ├── routes/
│   │   ├── whatsapp.js
│   │   ├── googleCalendar.js
│   │   └── payment.js
│   └── config/
│       ├── database.js
│       ├── whatsapp.js
│       └── googleCalendar.js
├── Dockerfile
└── package.json
```

---

## 🎯 **CRITÉRIOS DE ACEITAÇÃO**

### **Funcionalidade**
- [ ] Webhook WhatsApp funcionando
- [ ] Integração Google Calendar ativa
- [ ] Sistema de pagamentos operacional
- [ ] APIs externas integradas

### **Performance**
- [ ] Response time < 1 segundo
- [ ] Uptime > 99.5%
- [ ] Sincronização em tempo real
- [ ] Tratamento de erros robusto

---

## 🏆 **CONCLUSÃO**

O **Entregável 5: Integrations Service** implementa todas as integrações externas necessárias para o funcionamento completo do sistema.

### **Status Final**
**🔄 ENTREGÁVEL 5 EM DESENVOLVIMENTO**  
**📋 PRONTO PARA IMPLEMENTAÇÃO**

---

**Documento**: specification.md  
**Entregável**: 05-integrations  
**Status**: 🔄 EM DESENVOLVIMENTO  
**Data**: 2024-01-15  
**Versão**: 1.0.0
