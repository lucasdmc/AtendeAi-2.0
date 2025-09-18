# Sistema de Conversação com Contextualização JSON ESADI

## 📋 Visão Geral

O sistema de conversação do AtendeAI 2.0 agora suporta contextualização completa através de JSON ESADI, permitindo que cada clínica tenha sua própria personalidade de IA, informações específicas e comportamentos customizados.

## 🏗️ Arquitetura

### Componentes Principais

1. **Conversation Service**
   - Processa mensagens do WhatsApp
   - Gerencia contexto conversacional
   - Integra com LLM (OpenAI)
   - Busca contexto via ClinicServiceClient

2. **Clinic Service**
   - Armazena dados das clínicas
   - Gerencia contextualização JSON ESADI
   - Fornece APIs para buscar contexto
   - Cache com Redis para performance

3. **WhatsApp Service**
   - Recebe webhooks do WhatsApp
   - Envia mensagens para pacientes
   - Integra com Conversation Service

### Fluxo de Dados

```
WhatsApp → WhatsApp Service → Conversation Service → Clinic Service
                                      ↓
                                 LLM (OpenAI)
                                      ↓
                               Resposta Contextualizada
```

## 🔧 Implementação

### 1. ClinicServiceClient (Conversation Service)

```javascript
// backend/services/conversation-service/src/clients/clinicServiceClient.js

class ClinicServiceClient {
    async getClinicContext(clinicId) {
        // Busca dados da clínica
        const clinic = await this.makeRequest('GET', `/api/clinics/${clinicId}`);
        
        // Busca contextualização JSON ESADI
        const contextualization = await this.makeRequest('GET', `/api/clinics/${clinicId}/contextualization`);
        
        // Processa e retorna contexto completo
        return this.processContextualization(clinic, contextualization);
    }
}
```

### 2. ConversationController

```javascript
// backend/services/conversation-service/src/controllers/conversationController.js

class ConversationController {
    constructor() {
        this.clinicServiceClient = new ClinicServiceClient();
    }

    async getClinicContext(clinic_id) {
        try {
            // Busca contexto completo via ClinicServiceClient
            const context = await this.clinicServiceClient.getClinicContext(clinic_id);
            return context;
        } catch (error) {
            // Retorna contexto padrão em caso de erro
            return this.getDefaultClinicContext();
        }
    }
}
```

### 3. LLMOrchestrator

```javascript
// backend/services/conversation-service/src/services/llmOrchestrator.js

async generateResponse(message, intent, clinic_id, patient_phone, clinicContext) {
    const aiPersonality = clinicContext?.ai_personality || {};
    const assistantName = aiPersonality.name || 'Assistente';
    
    // Usa contexto da clínica para personalizar respostas
    const systemPrompt = this.buildSystemPrompt(clinicContext);
    
    // Gera resposta contextualizada via OpenAI
    const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ]
    });
}
```

## 📄 Estrutura JSON ESADI

### Exemplo Completo

```json
{
  "clinica": {
    "informacoes_basicas": {
      "nome": "ESADI - Centro de Saúde Digestiva",
      "tipo": "centro_diagnostico",
      "especialidade_principal": "Gastroenterologia",
      "especialidades_secundarias": ["Endoscopia", "Colonoscopia"],
      "descricao": "Centro especializado em saúde digestiva",
      "missao": "Proporcionar diagnósticos precisos",
      "valores": ["Excelência", "Tecnologia", "Humanização"],
      "diferenciais": ["Equipamentos de ponta", "Equipe especializada"]
    },
    "localizacao": {
      "endereco_principal": {
        "logradouro": "Rua Sete de Setembro",
        "numero": "777",
        "bairro": "Centro",
        "cidade": "Blumenau",
        "estado": "SC",
        "cep": "89010-200"
      }
    },
    "contatos": {
      "telefone_principal": "(47) 3222-0432",
      "whatsapp": "(47) 99963-3223",
      "email_principal": "contato@esadi.com.br",
      "website": "https://www.esadi.com.br"
    },
    "horario_funcionamento": {
      "segunda": { "abertura": "07:00", "fechamento": "18:00" },
      "terca": { "abertura": "07:00", "fechamento": "18:00" },
      "quarta": { "abertura": "07:00", "fechamento": "18:00" },
      "quinta": { "abertura": "07:00", "fechamento": "18:00" },
      "sexta": { "abertura": "07:00", "fechamento": "17:00" },
      "sabado": { "abertura": "07:00", "fechamento": "12:00" },
      "domingo": { "abertura": null, "fechamento": null }
    }
  },
  "agente_ia": {
    "configuracao": {
      "nome": "Jessica",
      "personalidade": "Profissional e acolhedora",
      "tom_comunicacao": "Formal mas acessível",
      "nivel_formalidade": "Médio-alto",
      "saudacao_inicial": "Olá! Sou a Jessica, assistente virtual da ESADI.",
      "mensagem_despedida": "Obrigado por escolher a ESADI!",
      "mensagem_fora_horario": "Estamos fora do horário de atendimento."
    },
    "comportamento": {
      "proativo": true,
      "oferece_sugestoes": true,
      "solicita_feedback": true,
      "escalacao_automatica": true,
      "limite_tentativas": 3,
      "contexto_conversa": true
    }
  },
  "servicos": {
    "consultas": [...],
    "exames": [...]
  },
  "profissionais": [...],
  "convenios": [...],
  "politicas": {...}
}
```

## 🚀 Como Usar

### 1. Criar/Atualizar Contextualização de uma Clínica

```bash
# Via API
curl -X PUT http://localhost:3002/api/clinics/{clinic_id}/contextualization \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d @esadi-context.json

# Via Script
cd backend/services/clinic-service
node scripts/update-esadi-context.js
```

### 2. Testar Conversação

```bash
# Script de teste
cd backend/services/conversation-service
node test-contextualization.js
```

### 3. Enviar Mensagem via WhatsApp

```bash
curl -X POST http://localhost:3005/api/conversation/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "clinic_id": "9981f126-a9b9-4c7d-819a-3380b9ee61de",
    "patient_phone": "+5511999999999",
    "patient_name": "João Silva",
    "message_content": "Olá, quem é você?"
  }'
```

## 🔍 Verificação e Debug

### 1. Verificar Contextualização

```bash
# Buscar contextualização de uma clínica
curl http://localhost:3002/api/clinics/{clinic_id}/contextualization \
  -H "Authorization: Bearer {token}"
```

### 2. Logs Importantes

- **Conversation Service**: Logs de processamento de mensagens e contexto
- **Clinic Service**: Logs de busca e cache de contextualização
- **WhatsApp Service**: Logs de recebimento e envio de mensagens

### 3. Pontos de Debug

1. `ConversationController.getClinicContext()` - Busca de contexto
2. `ClinicServiceClient.getClinicContext()` - Processamento JSON ESADI
3. `LLMOrchestrator.generateResponse()` - Geração de resposta contextualizada

## 📦 Extração do Sistema

Para extrair apenas o sistema de conversação + contextualização:

### Arquivos Essenciais

**Conversation Service:**
- `/src/clients/clinicServiceClient.js`
- `/src/controllers/conversationController.js`
- `/src/services/llmOrchestrator.js`
- `/src/services/conversationalMemory.js`
- `/src/models/conversation.js`
- `/src/models/message.js`

**Clinic Service:**
- `/src/controllers/clinicController.js`
- `/src/services/contextualization.js`
- `/src/models/clinic.js`
- `/src/routes/clinic.js`

**Configurações:**
- Variáveis de ambiente necessárias
- Estrutura do banco de dados
- Configuração do Redis

### Dependências Principais

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "openai": "^4.20.1",
    "node-fetch": "^3.3.2",
    "winston": "^3.11.0"
  }
}
```

## 🔐 Segurança

1. **Autenticação**: Todas as APIs requerem token JWT
2. **Isolamento**: Multi-tenant com isolamento por clinic_id
3. **Validação**: Dados de contextualização são validados
4. **Cache**: TTL configurável para evitar cache stale

## 📈 Performance

1. **Cache Redis**: Contextualização é cacheada por 1 hora
2. **Lazy Loading**: Contexto só é buscado quando necessário
3. **Fallbacks**: Sistema funciona mesmo sem contextualização

## 🛠️ Manutenção

### Atualizar Contextualização

1. Modificar JSON ESADI
2. Executar script de atualização
3. Cache é invalidado automaticamente

### Monitorar Sistema

1. Verificar logs dos serviços
2. Monitorar latência de respostas
3. Acompanhar taxa de cache hit

## 🎯 Próximos Passos

1. **Melhorias de Performance**
   - Implementar cache distribuído
   - Otimizar queries de contextualização

2. **Funcionalidades Adicionais**
   - Suporte a múltiplos idiomas
   - Templates de resposta personalizados
   - Analytics de conversação

3. **Integração**
   - Webhook para atualização de contexto
   - API GraphQL para queries complexas
   - Dashboard de gestão de contextualização