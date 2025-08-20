# 💬 ENTREGÁVEL 3: CONVERSATION SERVICE - ATENDEAI 2.0

---

## 🎯 **OBJETIVO**

Implementar o **Conversation Service** completo com sistema de memória conversacional avançado, orquestração de LLMs, e gestão inteligente de contexto para conversas naturais e personalizadas por clínica.

---

## 📋 **ESCOPO DO ENTREGÁVEL**

### **Sistema de Memória Conversacional**
- [ ] Memória de curto prazo (sessão atual)
- [ ] Memória de longo prazo (histórico de conversas)
- [ ] Sistema de cache inteligente
- [ ] Limpeza automática de memória expirada

### **Orquestração de LLMs**
- [ ] Integração com múltiplos provedores (OpenAI, Anthropic, Google)
- [ ] Roteamento inteligente baseado em contexto
- [ ] Fallback automático entre modelos
- [ ] Balanceamento de carga entre provedores

### **Gestão de Contexto**
- [ ] Contexto dinâmico por conversa
- [ ] Personalização por clínica
- [ ] Histórico de intenções
- [ ] Rastreamento de estado da conversa

### **Sistema de Intenções**
- [ ] Detecção automática de intenções
- [ ] Classificação de confiança
- [ ] Fallbacks configuráveis
- [ ] Aprendizado contínuo

---

## 🏗️ **ARQUITETURA DO SERVIÇO**

### **Componentes Principais**
```
┌─────────────────────────────────────────────────────────────────┐
│                  CONVERSATION SERVICE                          │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│  Conversation   │  Message        │  Memory         │  LLM    │
│   Manager       │  Processor      │   Manager       │Orchestr.│
├─────────────────┼─────────────────┼─────────────────┼─────────┤
│  Intent         │  Context        │  Cache          │  Audit  │
│  Detector       │  Manager        │  Service        │ Service │
└─────────────────┴─────────────────┴─────────────────┴─────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                          │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│   PostgreSQL    │     Redis       │   LLM APIs      │ Logging │
│   (Database)    │    (Cache)      │   (External)    │ (Winston)│
└─────────────────┴─────────────────┴─────────────────┴─────────┘
```

### **Endpoints da API**
```
# Gestão de Conversas
POST   /api/conversations              # Iniciar nova conversa
GET    /api/conversations/:id          # Buscar conversa
PUT    /api/conversations/:id          # Atualizar conversa
DELETE /api/conversations/:id          # Encerrar conversa
GET    /api/conversations/:id/status   # Status da conversa

# Mensagens
POST   /api/conversations/:id/messages # Enviar mensagem
GET    /api/conversations/:id/messages # Histórico de mensagens
PUT    /api/messages/:id               # Atualizar mensagem
DELETE /api/messages/:id               # Deletar mensagem

# Memória Conversacional
GET    /api/conversations/:id/memory   # Buscar memória
PUT    /api/conversations/:id/memory   # Atualizar memória
DELETE /api/conversations/:id/memory   # Limpar memória
POST   /api/conversations/:id/memory/clear # Limpeza automática

# Contexto
GET    /api/conversations/:id/context  # Buscar contexto atual
PUT    /api/conversations/:id/context  # Atualizar contexto
POST   /api/conversations/:id/context/reset # Resetar contexto

# Intenções
GET    /api/conversations/:id/intents  # Histórico de intenções
POST   /api/conversations/:id/intents/analyze # Analisar mensagem
GET    /api/intents/statistics         # Estatísticas de intenções

# LLM
POST   /api/llm/generate              # Gerar resposta
POST   /api/llm/analyze               # Analisar texto
GET    /api/llm/providers             # Listar provedores
GET    /api/llm/status                # Status dos provedores
```

---

## 🗄️ **MODELOS DE DADOS**

### **Tabela: `conversations` (Schema: `conversation`)**
```sql
CREATE TABLE conversation.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    whatsapp_number VARCHAR(20) NOT NULL,
    user_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
    context JSONB DEFAULT '{}',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos JSONB:**
- `context`: Contexto da conversa (intenções, dados coletados, estado atual)

### **Tabela: `messages` (Schema: `conversation`)**
```sql
CREATE TABLE conversation.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('incoming', 'outgoing')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT false,
    intent_detected VARCHAR(100),
    confidence_score DECIMAL(3,2),
    llm_provider VARCHAR(50),
    llm_model VARCHAR(50),
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos JSONB:**
- `metadata`: Metadados da mensagem (tipo de mídia, status, tokens, etc.)

### **Tabela: `conversation_memory` (Schema: `conversation`)**
```sql
CREATE TABLE conversation.conversation_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    memory_key VARCHAR(100) NOT NULL,
    memory_value JSONB NOT NULL,
    memory_type VARCHAR(20) DEFAULT 'session' CHECK (memory_type IN ('session', 'long_term', 'context')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(conversation_id, memory_key)
);
```

**Campos JSONB:**
- `memory_value`: Valor da memória (pode ser qualquer tipo de dado)

### **Tabela: `intent_history` (Schema: `conversation`)**
```sql
CREATE TABLE conversation.intent_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversation.conversations(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    message_id UUID REFERENCES conversation.messages(id),
    intent_name VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    entities JSONB DEFAULT '{}',
    fallback_used BOOLEAN DEFAULT false,
    llm_provider VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos JSONB:**
- `entities`: Entidades extraídas da mensagem

### **Tabela: `llm_providers` (Schema: `conversation`)**
```sql
CREATE TABLE conversation.llm_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES atendeai.clinics(id) ON DELETE CASCADE,
    provider_name VARCHAR(50) NOT NULL,
    api_key VARCHAR(500),
    api_endpoint VARCHAR(500),
    models JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    rate_limit_per_minute INTEGER DEFAULT 60,
    cost_per_token DECIMAL(10,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, provider_name)
);
```

**Campos JSONB:**
- `models`: Lista de modelos disponíveis para este provedor

---

## 🧠 **SISTEMA DE MEMÓRIA CONVERSACIONAL**

### **Tipos de Memória**

#### **1. Memória de Sessão (Session Memory)**
- **Duração**: Durante a conversa atual
- **Escopo**: Conversa específica
- **Conteúdo**: Contexto imediato, dados coletados
- **Exemplo**: Nome do paciente, sintomas, preferências de horário

#### **2. Memória de Longo Prazo (Long-term Memory)**
- **Duração**: Indefinida (até limpeza manual)
- **Escopo**: Usuário específico
- **Conteúdo**: Preferências, histórico médico, padrões de comportamento
- **Exemplo**: Alergias conhecidas, horários preferidos, histórico de consultas

#### **3. Memória de Contexto (Context Memory)**
- **Duração**: Configurável por clínica
- **Escopo**: Clínica específica
- **Conteúdo**: Configurações da IA, respostas padrão, fluxos de conversa
- **Exemplo**: Personalidade da IA, políticas de agendamento, horários da clínica

### **Estrutura da Memória**
```json
{
  "memory_key": "patient_preferences",
  "memory_value": {
    "preferred_time": "morning",
    "avoid_days": ["monday", "friday"],
    "special_requests": "acessibilidade para cadeirantes",
    "last_consultation": "2024-01-10",
    "favorite_doctor": "Dr. Silva"
  },
  "memory_type": "long_term",
  "expires_at": null,
  "metadata": {
    "source": "user_input",
    "confidence": 0.95,
    "last_updated": "2024-01-15T10:00:00Z"
  }
}
```

### **Sistema de Cache Inteligente**
```javascript
class MemoryCacheService {
  constructor() {
    this.sessionCache = new Map(); // Memória de sessão
    this.longTermCache = new Map(); // Memória de longo prazo
    this.contextCache = new Map(); // Memória de contexto
  }

  // Buscar memória com fallback
  async getMemory(conversationId, key, type = 'session') {
    // 1. Tentar cache local
    const cacheKey = `${conversationId}:${key}`;
    let memory = this.getFromLocalCache(cacheKey, type);
    
    if (memory) return memory;

    // 2. Buscar no banco
    memory = await this.getFromDatabase(conversationId, key, type);
    
    if (memory) {
      // 3. Atualizar cache local
      this.updateLocalCache(cacheKey, memory, type);
      return memory;
    }

    // 4. Fallback para contexto da clínica
    return await this.getClinicContext(conversationId, key);
  }

  // Atualizar memória
  async updateMemory(conversationId, key, value, type = 'session') {
    // 1. Atualizar cache local
    const cacheKey = `${conversationId}:${key}`;
    this.updateLocalCache(cacheKey, value, type);

    // 2. Persistir no banco
    await this.persistToDatabase(conversationId, key, value, type);

    // 3. Notificar outros serviços se necessário
    await this.notifyMemoryUpdate(conversationId, key, value);
  }

  // Limpeza automática
  async cleanupExpiredMemory() {
    const now = new Date();
    
    // Limpar memórias expiradas
    for (const [key, memory] of this.sessionCache.entries()) {
      if (memory.expires_at && memory.expires_at < now) {
        this.sessionCache.delete(key);
      }
    }

    // Limpar memórias de contexto expiradas
    for (const [key, memory] of this.contextCache.entries()) {
      if (memory.expires_at && memory.expires_at < now) {
        this.contextCache.delete(key);
      }
    }
  }
}
```

---

## 🤖 **ORQUESTRAÇÃO DE LLMS**

### **Provedores Suportados**

#### **1. OpenAI (GPT-4, GPT-3.5-turbo)**
```javascript
class OpenAIProvider {
  constructor(apiKey, models = ['gpt-4', 'gpt-3.5-turbo']) {
    this.apiKey = apiKey;
    this.models = models;
    this.baseURL = 'https://api.openai.com/v1';
  }

  async generateResponse(prompt, context, model = 'gpt-4') {
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: this.buildSystemPrompt(context) },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return {
        content: response.choices[0].message.content,
        provider: 'openai',
        model: model,
        tokens_used: response.usage.total_tokens,
        cost: this.calculateCost(response.usage.total_tokens, model)
      };
    } catch (error) {
      throw new Error(`OpenAI Error: ${error.message}`);
    }
  }

  buildSystemPrompt(context) {
    return `Você é um assistente virtual médico chamado ${context.ai_personality.name}.
    
    Personalidade: ${context.ai_personality.tone}
    Nível de formalidade: ${context.ai_personality.formality_level}
    Idiomas: ${context.ai_personality.languages.join(', ')}
    
    Horários da clínica: ${JSON.stringify(context.working_hours)}
    Políticas de agendamento: ${JSON.stringify(context.scheduling_policies)}
    
    Seja ${context.ai_personality.response_style} e ${context.ai_behavior.proactivity ? 'proativo' : 'reativo'}.
    
    Respostas devem ter no máximo ${context.ai_behavior.max_response_length} caracteres.
    
    Se não souber algo, use a estratégia: ${context.ai_behavior.fallback_strategy}`;
  }
}
```

#### **2. Anthropic (Claude)**
```javascript
class AnthropicProvider {
  constructor(apiKey, models = ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307']) {
    this.apiKey = apiKey;
    this.models = models;
    this.baseURL = 'https://api.anthropic.com/v1';
  }

  async generateResponse(prompt, context, model = 'claude-3-sonnet-20240229') {
    try {
      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 1000,
        temperature: 0.7,
        system: this.buildSystemPrompt(context),
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        content: response.content[0].text,
        provider: 'anthropic',
        model: model,
        tokens_used: response.usage.input_tokens + response.usage.output_tokens,
        cost: this.calculateCost(response.usage.input_tokens + response.usage.output_tokens, model)
      };
    } catch (error) {
      throw new Error(`Anthropic Error: ${error.message}`);
    }
  }
}
```

#### **3. Google (Gemini)**
```javascript
class GoogleProvider {
  constructor(apiKey, models = ['gemini-pro', 'gemini-pro-vision']) {
    this.apiKey = apiKey;
    this.models = models;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateResponse(prompt, context, model = 'gemini-pro') {
    try {
      const response = await google.generativeAI.generateContent({
        model: model,
        contents: [
          { role: 'user', parts: [{ text: this.buildSystemPrompt(context) + '\n\n' + prompt }] }
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        }
      });

      return {
        content: response.response.text(),
        provider: 'google',
        model: model,
        tokens_used: response.response.usageMetadata.totalTokenCount,
        cost: this.calculateCost(response.response.usageMetadata.totalTokenCount, model)
      };
    } catch (error) {
      throw new Error(`Google Error: ${error.message}`);
    }
  }
}
```

### **Orquestrador Inteligente**
```javascript
class LLMOrchestrator {
  constructor() {
    this.providers = new Map();
    this.fallbackChain = [];
    this.healthChecks = new Map();
  }

  // Registrar provedor
  registerProvider(provider) {
    this.providers.set(provider.name, provider);
    this.fallbackChain.push(provider.name);
    this.healthChecks.set(provider.name, { status: 'healthy', lastCheck: Date.now() });
  }

  // Gerar resposta com fallback
  async generateResponse(prompt, context, preferredProvider = null) {
    let lastError = null;
    
    // Tentar provedor preferido primeiro
    if (preferredProvider && this.providers.has(preferredProvider)) {
      try {
        return await this.providers.get(preferredProvider).generateResponse(prompt, context);
      } catch (error) {
        lastError = error;
        this.updateProviderHealth(preferredProvider, 'unhealthy');
      }
    }

    // Tentar outros provedores na ordem de fallback
    for (const providerName of this.fallbackChain) {
      if (providerName === preferredProvider) continue;
      
      try {
        const provider = this.providers.get(providerName);
        if (provider && this.isProviderHealthy(providerName)) {
          return await provider.generateResponse(prompt, context);
        }
      } catch (error) {
        lastError = error;
        this.updateProviderHealth(providerName, 'unhealthy');
      }
    }

    // Todos os provedores falharam
    throw new Error(`All LLM providers failed. Last error: ${lastError.message}`);
  }

  // Verificar saúde dos provedores
  async checkProviderHealth() {
    for (const [providerName, provider] of this.providers.entries()) {
      try {
        // Teste simples de conectividade
        await provider.generateResponse('Test', { ai_personality: { name: 'Test' } });
        this.updateProviderHealth(providerName, 'healthy');
      } catch (error) {
        this.updateProviderHealth(providerName, 'unhealthy');
      }
    }
  }

  // Balanceamento de carga
  getOptimalProvider(context) {
    const healthyProviders = Array.from(this.healthChecks.entries())
      .filter(([_, health]) => health.status === 'healthy')
      .map(([name, _]) => name);

    if (healthyProviders.length === 0) {
      throw new Error('No healthy LLM providers available');
    }

    // Lógica de seleção baseada em contexto
    if (context.requires_vision && healthyProviders.includes('gemini-pro-vision')) {
      return 'gemini-pro-vision';
    }

    if (context.requires_long_context && healthyProviders.includes('claude-3-sonnet')) {
      return 'claude-3-sonnet';
    }

    // Retornar o primeiro saudável
    return healthyProviders[0];
  }
}
```

---

## 🎯 **SISTEMA DE DETECÇÃO DE INTENÇÕES**

### **Classificação de Intenções**
```javascript
class IntentDetector {
  constructor() {
    this.intentPatterns = new Map();
    this.confidenceThreshold = 0.7;
    this.loadIntentPatterns();
  }

  // Detectar intenção de uma mensagem
  async detectIntent(message, context) {
    // 1. Análise baseada em padrões
    const patternMatch = this.analyzePatterns(message);
    
    // 2. Análise com LLM
    const llmAnalysis = await this.analyzeWithLLM(message, context);
    
    // 3. Combinação de resultados
    const combinedResult = this.combineAnalyses(patternMatch, llmAnalysis);
    
    // 4. Validação de confiança
    if (combinedResult.confidence >= this.confidenceThreshold) {
      return combinedResult;
    }

    // 5. Fallback para intenção genérica
    return {
      intent: 'information_request',
      confidence: 0.5,
      entities: {},
      fallback_used: true
    };
  }

  // Análise baseada em padrões
  analyzePatterns(message) {
    const lowerMessage = message.toLowerCase();
    
    // Padrões para agendamento
    if (lowerMessage.includes('marcar') || lowerMessage.includes('agendar') || 
        lowerMessage.includes('consulta') || lowerMessage.includes('horário')) {
      return {
        intent: 'appointment_booking',
        confidence: 0.8,
        entities: this.extractEntities(message)
      };
    }

    // Padrões para reagendamento
    if (lowerMessage.includes('reagendar') || lowerMessage.includes('mudar') || 
        lowerMessage.includes('alterar') || lowerMessage.includes('trocar')) {
      return {
        intent: 'appointment_reschedule',
        confidence: 0.8,
        entities: this.extractEntities(message)
      };
    }

    // Padrões para cancelamento
    if (lowerMessage.includes('cancelar') || lowerMessage.includes('desmarcar') || 
        lowerMessage.includes('não quero') || lowerMessage.includes('desistir')) {
      return {
        intent: 'appointment_cancellation',
        confidence: 0.8,
        entities: this.extractEntities(message)
      };
    }

    // Padrões para informações
    if (lowerMessage.includes('horário') || lowerMessage.includes('funciona') || 
        lowerMessage.includes('aberto') || lowerMessage.includes('fechado')) {
      return {
        intent: 'information_request',
        confidence: 0.7,
        entities: this.extractEntities(message)
      };
    }

    return {
      intent: 'unknown',
      confidence: 0.3,
      entities: {}
    };
  }

  // Análise com LLM
  async analyzeWithLLM(message, context) {
    try {
      const prompt = `Analise a seguinte mensagem e identifique a intenção do usuário:

Mensagem: "${message}"

Contexto da clínica:
- Personalidade da IA: ${context.ai_personality.name}
- Horários: ${JSON.stringify(context.working_hours)}
- Serviços: ${JSON.stringify(context.services)}

Classifique a intenção em uma das seguintes categorias:
1. appointment_booking - Usuário quer marcar uma consulta
2. appointment_reschedule - Usuário quer reagendar uma consulta
3. appointment_cancellation - Usuário quer cancelar uma consulta
4. information_request - Usuário quer informações sobre a clínica
5. complaint - Usuário tem uma reclamação
6. feedback - Usuário quer dar feedback
7. other - Outra intenção não classificada

Responda apenas com um JSON no formato:
{
  "intent": "nome_da_intencao",
  "confidence": 0.95,
  "entities": {
    "date": "2024-01-20",
    "time": "14:00",
    "service": "consulta médica"
  },
  "reasoning": "Breve explicação da classificação"
}`;

      const response = await this.llmOrchestrator.generateResponse(prompt, context);
      return JSON.parse(response.content);
    } catch (error) {
      return {
        intent: 'unknown',
        confidence: 0.3,
        entities: {},
        reasoning: 'LLM analysis failed'
      };
    }
  }

  // Extrair entidades da mensagem
  extractEntities(message) {
    const entities = {};
    
    // Extrair datas
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4})|(\d{1,2}-\d{1,2}-\d{4})|(hoje|amanhã|depois de amanhã)/gi;
    const dateMatches = message.match(datePattern);
    if (dateMatches) {
      entities.dates = dateMatches;
    }

    // Extrair horários
    const timePattern = /(\d{1,2}:\d{2})|(\d{1,2}h)|(manhã|tarde|noite)/gi;
    const timeMatches = message.match(timePattern);
    if (timeMatches) {
      entities.times = timeMatches;
    }

    // Extrair serviços
    const servicePattern = /(consulta|exame|procedimento|cirurgia)/gi;
    const serviceMatches = message.match(servicePattern);
    if (serviceMatches) {
      entities.services = serviceMatches;
    }

    return entities;
  }

  // Combinar análises
  combineAnalyses(patternAnalysis, llmAnalysis) {
    // Peso para cada tipo de análise
    const patternWeight = 0.4;
    const llmWeight = 0.6;

    // Se as intenções são iguais, aumentar confiança
    if (patternAnalysis.intent === llmAnalysis.intent) {
      return {
        intent: patternAnalysis.intent,
        confidence: Math.min(0.95, patternAnalysis.confidence + llmAnalysis.confidence * 0.2),
        entities: { ...patternAnalysis.entities, ...llmAnalysis.entities },
        fallback_used: false
      };
    }

    // Se são diferentes, usar a de maior confiança
    if (llmAnalysis.confidence > patternAnalysis.confidence) {
      return {
        intent: llmAnalysis.intent,
        confidence: llmAnalysis.confidence,
        entities: llmAnalysis.entities,
        fallback_used: false
      };
    } else {
      return {
        intent: patternAnalysis.intent,
        confidence: patternAnalysis.confidence,
        entities: patternAnalysis.entities,
        fallback_used: false
      };
    }
  }
}
```

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **Estrutura de Arquivos**
```
conversation-service/
├── src/
│   ├── controllers/
│   │   ├── conversationController.js
│   │   ├── messageController.js
│   │   ├── memoryController.js
│   │   ├── intentController.js
│   │   └── llmController.js
│   ├── services/
│   │   ├── conversationService.js
│   │   ├── messageService.js
│   │   ├── memoryService.js
│   │   ├── intentService.js
│   │   ├── llmOrchestrator.js
│   │   ├── openaiProvider.js
│   │   ├── anthropicProvider.js
│   │   ├── googleProvider.js
│   │   └── cacheService.js
│   ├── models/
│   │   ├── conversation.js
│   │   ├── message.js
│   │   ├── memory.js
│   │   ├── intent.js
│   │   └── llmProvider.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── rateLimit.js
│   │   └── multiTenant.js
│   ├── routes/
│   │   ├── conversation.js
│   │   ├── message.js
│   │   ├── memory.js
│   │   ├── intent.js
│   │   └── llm.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── validator.js
│   │   ├── cache.js
│   │   ├── memoryProcessor.js
│   │   └── intentProcessor.js
│   └── config/
│       ├── database.js
│       ├── redis.js
│       ├── llm.js
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
    "openai": "^4.20.1",
    "@anthropic-ai/sdk": "^0.9.1",
    "@google/generative-ai": "^0.2.1",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "compression": "^1.7.4",
    "morgan": "^1.10.0"
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
- [ ] Detecção de intenções
- [ ] Sistema de memória
- [ ] Orquestração de LLMs
- [ ] Processamento de mensagens

### **Testes de Integração**
- [ ] Integração com LLMs
- [ ] Sistema de cache
- [ ] Banco de dados
- [ ] Validação de endpoints

### **Testes End-to-End**
- [ ] Fluxo completo de conversa
- [ ] Sistema de memória
- [ ] Fallbacks de LLM
- [ ] Performance de resposta

---

## 📊 **MÉTRICAS E MONITORAMENTO**

### **Métricas de Negócio**
- **Total de conversas** ativas/encerradas
- **Taxa de resolução** automática
- **Tempo médio** de resposta
- **Satisfação** do usuário

### **Métricas Técnicas**
- **Response time** dos LLMs
- **Taxa de erro** por provedor
- **Performance** do cache
- **Uso de tokens** e custos

### **Alertas Configurados**
- **LLM down** (todos os provedores)
- **Alta latência** (> 5 segundos)
- **Alta taxa de erro** (> 10%)
- **Cache miss** (> 30%)

---

## 🔒 **SEGURANÇA IMPLEMENTADA**

### **Autenticação e Autorização**
- **JWT** com refresh tokens
- **Multi-tenancy** com isolamento completo
- **Rate limiting** por conversa/IP
- **Validação** de entrada rigorosa

### **Proteção de Dados**
- **Criptografia** de dados sensíveis
- **Logs** sem informações pessoais
- **Retenção** configurável de dados
- **GDPR compliance** preparado

---

## 🚀 **COMO EXECUTAR**

### **1. Configurar Ambiente**
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com chaves de API dos LLMs
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
docker-compose up conversation-service
```

---

## 🎯 **CRITÉRIOS DE ACEITAÇÃO**

### **Funcionalidade**
- [ ] Sistema de conversas funcionando
- [ ] Memória conversacional operacional
- [ ] Orquestração de LLMs ativa
- [ ] Detecção de intenções funcionando

### **Performance**
- [ ] Response time < 3 segundos para 95% das respostas
- [ ] Cache hit ratio > 80%
- [ ] Uptime > 99.5%
- [ ] Throughput > 100 conversas simultâneas

### **Qualidade**
- [ ] Cobertura de testes > 90%
- [ ] Documentação completa
- [ ] Logs estruturados funcionando
- [ ] Métricas sendo coletadas

---

## 🏆 **CONCLUSÃO**

O **Entregável 3: Conversation Service** implementa o sistema completo de conversação com memória avançada, orquestração de LLMs e detecção inteligente de intenções.

### **Valor Entregue**
- ✅ **Sistema de conversas** multi-tenant completo
- ✅ **Memória conversacional** avançada e inteligente
- ✅ **Orquestração de LLMs** com fallbacks
- ✅ **Detecção de intenções** automática
- ✅ **Cache inteligente** para performance
- ✅ **Segurança robusta** com isolamento completo

### **Status Final**
**🔄 ENTREGÁVEL 3 EM DESENVOLVIMENTO**  
**📋 PRONTO PARA IMPLEMENTAÇÃO**

---

**Documento**: specification.md  
**Entregável**: 03-conversation-service  
**Status**: 🔄 EM DESENVOLVIMENTO  
**Data**: 2024-01-15  
**Versão**: 1.0.0  
**Próxima Fase**: Implementação e testes
