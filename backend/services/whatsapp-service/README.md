# 📱 WhatsApp Service - AtendeAI 2.0

Serviço de integração com WhatsApp Business API da Meta para o sistema AtendeAI 2.0.

## 🎯 **Visão Geral**

Este serviço implementa a integração completa com a WhatsApp Business API da Meta, incluindo:

- **Webhook** para recebimento de mensagens
- **Processamento automático** com IA via Conversation Service
- **Respostas inteligentes** e contextuais
- **Persistência completa** de conversas
- **Padrões de resiliência** (Circuit Breaker, Retry, Fallbacks)
- **Monitoramento** e métricas em tempo real

## 🏗️ **Arquitetura**

### **Componentes Principais:**

1. **WebhookValidator** - Validação de webhooks da Meta
2. **MetaAPICircuitBreaker** - Circuit breaker para Meta API
3. **RetryStrategy** - Estratégia de retry com exponential backoff
4. **FallbackStrategy** - Fallbacks para falhas de IA
5. **WhatsAppMessageAdapter** - Anti-corruption layer
6. **WhatsAppService** - Serviço principal de integração
7. **HealthChecker** - Verificações de saúde das integrações
8. **IntegrationMetrics** - Métricas de monitoramento

### **Fluxo de Processamento:**

```
1. Meta envia webhook → WhatsApp Service
2. WhatsApp Service valida e processa
3. WhatsApp Service → Conversation Service (IA)
4. Conversation Service → Clinic Service (contexto)
5. Conversation Service retorna resposta
6. WhatsApp Service envia resposta via Meta API
7. WhatsApp Service persiste dados
```

## 🚀 **Instalação e Configuração**

### **Pré-requisitos:**

- Node.js 18+
- PostgreSQL com Supabase
- Redis (opcional)
- Conta Meta Developer com WhatsApp Business API

### **1. Instalar Dependências:**

```bash
cd backend/services/whatsapp-service
npm install
```

### **2. Configurar Variáveis de Ambiente:**

Copie o arquivo `env.example` para `.env` e configure:

```bash
cp env.example .env
```

**Configurações Obrigatórias:**

```env
# Meta WhatsApp API
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_VERIFY_TOKEN=atendeai_webhook_verify_2024
WHATSAPP_APP_SECRET=your_app_secret_here

# Serviços Internos
CONVERSATION_SERVICE_URL=http://localhost:3005
CONVERSATION_SERVICE_TOKEN=your_conversation_service_token
CLINIC_SERVICE_URL=http://localhost:3003
CLINIC_SERVICE_TOKEN=your_clinic_service_token

# Banco de Dados
DATABASE_URL=postgresql://username:password@localhost:5432/atendeai
```

### **3. Executar Migrações:**

```bash
npm run migrate
```

### **4. Iniciar Serviço:**

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 🔧 **Configuração Meta Developer Console**

### **1. Acessar Meta Developer Console:**

- Vá para [developers.facebook.com](https://developers.facebook.com)
- Crie ou acesse sua aplicação
- Adicione o produto "WhatsApp"

### **2. Configurar Webhook:**

- **URL**: `https://seu-dominio.com/webhook/whatsapp`
- **Verify Token**: `atendeai_webhook_verify_2024`
- **Campos**: `messages`, `message_deliveries`, `message_reads`

### **3. Obter Credenciais:**

- **Access Token**: Token de acesso permanente
- **Phone Number ID**: ID do número de telefone
- **Business Account ID**: ID da conta empresarial
- **App Secret**: Segredo da aplicação

## 📡 **Endpoints da API**

### **Webhook (Meta):**

```
GET  /webhook/whatsapp?mode=subscribe&token=...&challenge=...
POST /webhook/whatsapp
```

### **API Interna:**

```
POST   /api/whatsapp/send
GET    /api/whatsapp/message/:messageId/status
GET    /api/whatsapp/clinic/:clinicId/context
GET    /api/whatsapp/clinic/:clinicId/config
```

### **Monitoramento:**

```
GET /health
GET /health/detailed
GET /health/:checkName
GET /metrics
GET /status
```

## 🧪 **Testes**

### **Executar Testes:**

```bash
# Todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage
```

### **Cobertura Mínima:**

- **Testes Unitários**: 90%
- **Testes de Integração**: 100%
- **Testes de Resiliência**: 100%

## 📊 **Monitoramento e Métricas**

### **Métricas Disponíveis:**

- **webhooks_received_total** - Total de webhooks recebidos
- **messages_processed_total** - Total de mensagens processadas
- **messages_failed_total** - Total de mensagens falhadas
- **ai_response_time_seconds** - Tempo de resposta da IA
- **errors_*_total** - Contadores de erros por tipo

### **Health Checks:**

- **meta_api** - Verificação da Meta API
- **conversation_service** - Verificação do Conversation Service
- **clinic_service** - Verificação do Clinic Service
- **database** - Verificação do banco de dados

## 🔐 **Segurança**

### **Validações Implementadas:**

- **Webhook Signature** - Validação HMAC-SHA256
- **Verify Token** - Validação de token de verificação
- **Rate Limiting** - Proteção contra abuso
- **Input Validation** - Validação de entrada com Joi
- **Row Level Security** - Isolamento de dados por clínica

### **Headers de Segurança:**

- **Helmet** - Headers de segurança HTTP
- **CORS** - Controle de origem
- **Rate Limiting** - Limitação de requisições

## 🚨 **Tratamento de Erros**

### **Estratégias de Resiliência:**

1. **Circuit Breaker** - Proteção contra falhas em cascata
2. **Retry Strategy** - Tentativas automáticas com backoff exponencial
3. **Fallback Mechanisms** - Respostas de emergência
4. **Error Logging** - Logs estruturados para debugging

### **Códigos de Erro:**

- **400** - Requisição inválida
- **403** - Verificação de webhook falhou
- **500** - Erro interno do servidor
- **503** - Serviço indisponível

## 📈 **Performance**

### **Targets:**

- **Response Time**: < 30 segundos para resposta completa
- **Throughput**: 100+ mensagens simultâneas
- **Uptime**: > 99.9%
- **Recovery Time**: < 2 minutos

### **Otimizações:**

- **Connection Pooling** - Pool de conexões com banco
- **Async Processing** - Processamento assíncrono
- **Caching** - Cache de configurações de clínica
- **Indexes** - Índices otimizados para consultas

## 🔄 **Deployment**

### **Docker:**

```bash
# Build da imagem
docker build -t whatsapp-service .

# Executar container
docker run -p 3007:3007 --env-file .env whatsapp-service
```

### **Docker Compose:**

```yaml
services:
  whatsapp-service:
    build: ./services/whatsapp-service
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - conversation-service
      - clinic-service
```

## 📝 **Logs**

### **Formato dos Logs:**

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "whatsapp-service",
  "message": "Webhook processed successfully",
  "messageId": "msg-123",
  "clinicId": "clinic-456",
  "processingTime": 1500
}
```

### **Níveis de Log:**

- **ERROR** - Erros críticos
- **WARN** - Avisos e alertas
- **INFO** - Informações gerais
- **DEBUG** - Informações detalhadas (desenvolvimento)

## 🆘 **Troubleshooting**

### **Problemas Comuns:**

1. **Webhook não recebido:**
   - Verificar configuração no Meta Developer Console
   - Validar URL e verify token
   - Verificar logs de erro

2. **Falha na Meta API:**
   - Verificar credenciais (access token, phone number ID)
   - Verificar status do Circuit Breaker
   - Verificar logs de erro da Meta

3. **Falha no Conversation Service:**
   - Verificar conectividade com o serviço
   - Verificar token de autenticação
   - Verificar logs do Conversation Service

### **Comandos Úteis:**

```bash
# Verificar saúde do serviço
curl http://localhost:3007/health

# Verificar métricas
curl http://localhost:3007/metrics

# Verificar status detalhado
curl http://localhost:3007/health/detailed

# Verificar logs
docker logs whatsapp-service
```

## 🤝 **Contribuição**

### **Padrões de Código:**

- **ESLint** para qualidade de código
- **Prettier** para formatação
- **Jest** para testes
- **Conventional Commits** para mensagens de commit

### **Workflow:**

1. Fork do repositório
2. Criação de feature branch
3. Implementação com testes
4. Pull Request com descrição detalhada
5. Code Review e aprovação
6. Merge para main

## 📄 **Licença**

MIT License - veja o arquivo [LICENSE](../../LICENSE) para detalhes.

## 🆘 **Suporte**

- **Issues**: [GitHub Issues](https://github.com/atendeai/atendeai-2.0/issues)
- **Documentação**: [docs/](../../docs/)
- **Equipe**: AtendeAI Development Team

---

**Versão**: 2.0.0  
**Última atualização**: 2024-01-15  
**Status**: ✅ Implementação Completa
