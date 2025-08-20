# 🏗️ DESIGN DE INTEGRAÇÃO - ATENDEAÍ 2.0

---

## 🎯 **RESUMO EXECUTIVO**

**Projeto**: AtendeAí 2.0 - Arquitetura de Integração  
**Data**: 2024-01-15  
**Arquiteto**: Solutions Architect Specializing in Integrations  
**Status**: DESIGN COMPLETO  

### **Objetivo**
Projetar arquitetura robusta e segura para integrações com WhatsApp Business API e Google Calendar, garantindo resiliência, segurança e escalabilidade para o sistema multi-tenant.

---

## 🏗️ **ARQUITETURA DE INTEGRAÇÃO**

### **1. PADRÕES DE INTEGRAÇÃO ESCOLHIDOS**

#### **1.1 WhatsApp Business API - Padrão Híbrido**
- **Síncrono**: Para envio imediato de mensagens
- **Assíncrono**: Para processamento de webhooks via filas Redis
- **Justificativa**: "Webhook assíncrono via Redis para processamento de mensagens recebidas, evitando timeout e garantindo processamento confiável"

#### **1.2 Google Calendar - Padrão Síncrono com Cache**
- **Síncrono**: Para operações CRUD de agendamentos
- **Cache**: Redis para otimizar consultas frequentes
- **Justificativa**: "Operações síncronas para agendamentos garantem consistência imediata, com cache Redis para performance"

### **2. ESTRATÉGIA DE RESILIÊNCIA**

#### **2.1 WhatsApp Business API**
- **Retry Logic**: 3 tentativas com backoff exponencial (1s, 2s, 4s)
- **Circuit Breaker**: Falha após 5 erros consecutivos, recuperação em 30s
- **Timeout**: 10s para envio de mensagens, 30s para webhooks
- **Fallback**: Mensagens em fila Redis para retry posterior

#### **2.2 Google Calendar API**
- **Retry Logic**: 3 tentativas com backoff exponencial (1s, 2s, 4s)
- **Circuit Breaker**: Falha após 3 erros consecutivos, recuperação em 60s
- **Timeout**: 15s para operações de calendário
- **Fallback**: Cache Redis para leitura, fila para escrita

### **3. IMPLEMENTAÇÃO DE SEGURANÇA**

#### **3.1 Gestão de Credenciais**
- **Storage**: Variáveis de ambiente por clínica
- **Rotação**: Refresh tokens automáticos para Google
- **Isolamento**: Cada clínica tem suas próprias credenciais
- **Auditoria**: Log de todas as operações de credenciais

#### **3.2 Validação de Webhooks**
- **WhatsApp**: Verificação de assinatura HMAC-SHA256
- **Google**: Validação de token OAuth2
- **Rate Limiting**: 100 requests/min por clínica
- **Origem**: Validação de IPs permitidos

---

## 🔧 **CONTRATOS DE API CLIENTE**

### **4.1 WhatsApp Service Interface**
```javascript
class WhatsAppService {
  async sendMessage(clinicId, phoneNumber, message, type = 'text')
  async processWebhook(clinicId, payload, signature)
  async getMessageStatus(clinicId, messageId)
  async setWebhook(clinicId, url, verifyToken)
}
```

### **4.2 Google Calendar Service Interface**
```javascript
class GoogleCalendarService {
  async authenticate(clinicId, authCode)
  async createEvent(clinicId, eventData)
  async updateEvent(clinicId, eventId, eventData)
  async deleteEvent(clinicId, eventId)
  async listEvents(clinicId, timeMin, timeMax)
}
```

---

## 📝 **CÓDIGO SKELETON**

### **5.1 WhatsApp Service Enhanced**
```javascript
// TODO: Implementar lógica de negócio para envio de mensagens
class WhatsAppServiceEnhanced {
  constructor(clinicId) {
    this.clinicId = clinicId;
    this.circuitBreaker = new CircuitBreaker();
    this.redis = require('../config/redis');
  }

  async sendMessage(phoneNumber, message, type = 'text') {
    try {
      // TODO: Implementar validação de clínica
      // TODO: Implementar rate limiting por clínica
      // TODO: Implementar circuit breaker
      
      const result = await this.makeWhatsAppRequest('POST', '/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: type,
        text: { body: message }
      });

      // TODO: Implementar persistência da mensagem
      // TODO: Implementar cache Redis
      
      return result;
    } catch (error) {
      // TODO: Implementar fallback para fila Redis
      throw error;
    }
  }

  async processWebhook(payload, signature) {
    try {
      // TODO: Implementar validação de assinatura HMAC-SHA256
      // TODO: Implementar validação de origem
      // TODO: Implementar processamento assíncrono via Redis
      
      const messageData = {
        clinic_id: this.clinicId,
        payload: payload,
        signature: signature,
        processed_at: new Date()
      };

      // TODO: Implementar persistência do webhook
      // TODO: Implementar roteamento para chatbot/atendente
      
      return { success: true };
    } catch (error) {
      // TODO: Implementar fallback e logging
      throw error;
    }
  }
}
```

### **5.2 Google Calendar Service Enhanced**
```javascript
// TODO: Implementar lógica de negócio para sincronização de calendários
class GoogleCalendarServiceEnhanced {
  constructor(clinicId) {
    this.clinicId = clinicId;
    this.circuitBreaker = new CircuitBreaker();
    this.redis = require('../config/redis');
    this.oauth2Client = new google.auth.OAuth2();
  }

  async authenticate(authCode) {
    try {
      // TODO: Implementar fluxo OAuth2 completo
      // TODO: Implementar armazenamento seguro de tokens
      // TODO: Implementar refresh automático de tokens
      
      const { tokens } = await this.oauth2Client.getToken(authCode);
      
      // TODO: Implementar persistência dos tokens
      // TODO: Implementar cache Redis para tokens
      
      return { success: true, tokens };
    } catch (error) {
      // TODO: Implementar fallback e logging
      throw error;
    }
  }

  async createEvent(eventData) {
    try {
      // TODO: Implementar validação de dados do evento
      // TODO: Implementar circuit breaker
      // TODO: Implementar cache Redis
      
      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: { dateTime: eventData.start_time, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: eventData.end_time, timeZone: 'America/Sao_Paulo' },
        attendees: eventData.attendees || [],
        extendedProperties: {
          private: { clinic_id: this.clinicId, ...eventData.metadata }
        }
      };

      const result = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all'
      });

      // TODO: Implementar persistência do evento
      // TODO: Implementar cache Redis
      
      return result;
    } catch (error) {
      // TODO: Implementar fallback para fila Redis
      throw error;
    }
  }

  async listEvents(timeMin, timeMax) {
    try {
      // TODO: Implementar cache Redis para consultas
      // TODO: Implementar paginação
      // TODO: Implementar filtros por clínica
      
      const cacheKey = `calendar:${this.clinicId}:${timeMin}:${timeMax}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const result = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime'
      });

      // TODO: Implementar cache Redis com TTL
      await this.redis.setex(cacheKey, 300, JSON.stringify(result.data));
      
      return result.data;
    } catch (error) {
      // TODO: Implementar fallback para cache local
      throw error;
    }
  }
}
```

### **5.3 Circuit Breaker Implementation**
```javascript
// TODO: Implementar circuit breaker robusto
class CircuitBreaker {
  constructor(failureThreshold = 5, recoveryTimeout = 30000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
```

---

## 🔒 **CONFIGURAÇÕES DE SEGURANÇA**

### **6.1 Variáveis de Ambiente por Clínica**
```bash
# Clínica 1
CLINIC_1_WHATSAPP_ACCESS_TOKEN=xxx
CLINIC_1_WHATSAPP_PHONE_NUMBER_ID=xxx
CLINIC_1_GOOGLE_CLIENT_ID=xxx
CLINIC_1_GOOGLE_CLIENT_SECRET=xxx

# Clínica 2
CLINIC_2_WHATSAPP_ACCESS_TOKEN=xxx
CLINIC_2_WHATSAPP_PHONE_NUMBER_ID=xxx
CLINIC_2_GOOGLE_CLIENT_ID=xxx
CLINIC_2_GOOGLE_CLIENT_SECRET=xxx
```

### **6.2 Configuração de Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const clinicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite por clínica
  keyGenerator: (req) => req.headers['x-clinic-id'],
  message: 'Too many requests from this clinic'
});
```

---

## 📊 **MONITORAMENTO E OBSERVABILIDADE**

### **7.1 Métricas Prometheus**
```javascript
const prometheus = require('prom-client');

const whatsappMessagesTotal = new prometheus.Counter({
  name: 'whatsapp_messages_total',
  help: 'Total number of WhatsApp messages sent',
  labelNames: ['clinic_id', 'status', 'type']
});

const googleCalendarOperationsTotal = new prometheus.Counter({
  name: 'google_calendar_operations_total',
  help: 'Total number of Google Calendar operations',
  labelNames: ['clinic_id', 'operation', 'status']
});
```

### **7.2 Logs Estruturados**
```javascript
const logger = require('../utils/logger');

logger.info('WhatsApp message sent', {
  clinic_id: clinicId,
  phone_number: phoneNumber,
  message_type: type,
  status: 'success',
  duration_ms: Date.now() - startTime
});
```

---

## 🚀 **ESTRATÉGIA DE DEPLOY**

### **8.1 Configuração por Ambiente**
- **Desenvolvimento**: Credenciais mock, rate limiting baixo
- **Staging**: Credenciais reais, rate limiting médio
- **Produção**: Credenciais reais, rate limiting alto, monitoramento completo

### **8.2 Rollback Strategy**
- **Configuração**: Versionamento de configurações por clínica
- **Código**: Deploy com blue-green para rollback rápido
- **Dados**: Backup automático antes de mudanças de schema

---

## 📋 **PRÓXIMOS PASSOS**

1. **Implementação**: Desenvolver código seguindo o skeleton
2. **Testes**: Unit tests e integration tests
3. **Deploy**: Configuração por ambiente
4. **Monitoramento**: Setup de métricas e alertas
5. **Documentação**: Guias de uso e troubleshooting

---

**Documento criado por**: Solutions Architect Specializing in Integrations  
**Data de criação**: 2024-01-15  
**Versão**: 1.0  
**Status**: DESIGN COMPLETO - PRONTO PARA IMPLEMENTAÇÃO**
