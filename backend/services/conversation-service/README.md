# 🗣️ Conversation Service - AtendeAI 2.0

## 📋 Descrição

O **Conversation Service** é o núcleo do sistema de inteligência artificial do AtendeAI 2.0, responsável por processar mensagens do WhatsApp, detectar intenções e gerar respostas contextualizadas usando IA avançada.

## ✨ Funcionalidades Principais

### 🤖 **Sistema de Conversação WhatsApp**
- Recepção e processamento de mensagens via webhook
- Detecção inteligente de intenções do usuário
- Respostas humanizadas e contextualizadas por clínica
- Suporte a múltiplos tipos de mídia (texto, imagem, áudio, vídeo, documento)

### 🧠 **LLM Orchestrator Avançado**
- **CONTROLE TOTAL**: Sistema próprio de detecção sem agente tools da OpenAI
- **ROTEAMENTO INTELIGENTE**: Direcionamento para serviços específicos
- **FALLBACKS ROBUSTOS**: Múltiplas camadas de fallback para garantir resposta
- **INTEGRAÇÃO DIRETA**: Conexão com Appointment Flow Manager
- **MEMÓRIA CONVERSACIONAL**: Manutenção de contexto entre mensagens

### 💾 **Sistema de Memória Conversacional**
- Perfil do usuário persistente
- Histórico de conversas com contexto
- Histórico de intenções detectadas
- Dados de sessão para personalização
- Cache inteligente com Redis

### 🎯 **Detecção de Intenções**
- **Agendamento**: Marcar, reagendar, cancelar consultas
- **Informações**: Dúvidas sobre serviços, horários, preços
- **Saudações**: Cumprimentos e despedidas
- **Emergências**: Detecção automática de situações críticas
- **Suporte Humano**: Transferência para atendente humano

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │  Conversation   │    │   LLM           │
│   Webhook       │───►│   Controller    │───►│  Orchestrator   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Models        │    │  Conversational │
                       │  (Conversation, │    │     Memory      │
                       │     Message)    │    │                 │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  PostgreSQL     │    │      Redis      │
                       │   Database      │    │      Cache      │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Instalação e Configuração

### **Pré-requisitos**
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker e Docker Compose

### **1. Instalar Dependências**
```bash
cd services/conversation-service
npm install
```

### **2. Configurar Variáveis de Ambiente**
Criar arquivo `.env`:
```env
# Servidor
CONVERSATION_SERVICE_PORT=3003
CONVERSATION_SERVICE_HOST=0.0.0.0
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=atendeai
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# WhatsApp Business API
WHATSAPP_WEBHOOK_TOKEN=your_webhook_token
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Autenticação
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=7d

# Serviços
CLINIC_SERVICE_URL=http://localhost:3001
CLINIC_SERVICE_API_KEY=your_clinic_service_key
APPOINTMENT_SERVICE_URL=http://localhost:3002
APPOINTMENT_SERVICE_API_KEY=your_appointment_service_key

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### **3. Executar Migrações**
```bash
# Conectar ao PostgreSQL e executar
psql -U postgres -d atendeai -f src/database/migrations.sql
```

### **4. Iniciar o Serviço**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### **5. Docker (Recomendado)**
```bash
# Construir imagem
docker build -t conversation-service .

# Executar container
docker run -d \
  --name conversation-service \
  -p 3003:3003 \
  --env-file .env \
  conversation-service
```

## 📡 Endpoints da API

### **Processamento de Mensagens**
```http
POST /api/conversation/process
Content-Type: application/json

{
  "clinic_id": "uuid-da-clinica",
  "patient_phone": "+5511999999999",
  "patient_name": "João Silva",
  "message_content": "Gostaria de agendar uma consulta",
  "message_type": "text"
}
```

### **Histórico de Conversas**
```http
GET /api/conversation/history?clinic_id=uuid&patient_phone=+5511999999999&limit=50&offset=0
```

### **Conversas por Clínica**
```http
GET /api/conversation/clinic/{clinic_id}?limit=50&offset=0
```

### **Conversas Ativas**
```http
GET /api/conversation/clinic/{clinic_id}/active
```

### **Fechar Conversa**
```http
PUT /api/conversation/{conversation_id}/close
```

### **Estatísticas de Memória**
```http
GET /api/conversation/memory/stats?clinic_id=uuid&patient_phone=+5511999999999
```

### **Limpar Memória**
```http
DELETE /api/conversation/memory/clear
Content-Type: application/json

{
  "clinic_id": "uuid-da-clinica",
  "patient_phone": "+5511999999999"
}
```

### **Health Check**
```http
GET /api/conversation/health
```

### **Status do Serviço**
```http
GET /api/conversation/status
```

## 🧪 Testes

### **Executar Testes**
```bash
# Todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com cobertura
npm run test:coverage
```

### **Executar Linting**
```bash
# Verificar código
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

## 🔧 Configurações Avançadas

### **Rate Limiting**
```javascript
// Configuração padrão
rateLimit: {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: 'Too many requests from this IP'
}
```

### **Logging**
```javascript
// Níveis disponíveis: error, warn, info, debug
LOG_LEVEL=info

// Formatos disponíveis: json, simple
LOG_FORMAT=json
```

### **Cache Redis**
```javascript
// TTL padrão para memória conversacional
defaultTTL = 24 * 60 * 60; // 24 horas

// Prefixo para chaves
keyPrefix: 'conversation:'
```

## 📊 Monitoramento

### **Métricas Disponíveis**
- Tempo de resposta das requisições
- Taxa de sucesso na detecção de intenções
- Uso de memória e CPU
- Conexões com banco de dados e Redis
- Erros e exceções

### **Health Checks**
- Conectividade com PostgreSQL
- Conectividade com Redis
- Configuração da OpenAI
- Status do LLM Orchestrator

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **1. Erro de Conexão com Banco**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar conectividade
psql -h localhost -U postgres -d atendeai
```

#### **2. Erro de Conexão com Redis**
```bash
# Verificar se Redis está rodando
sudo systemctl status redis

# Testar conectividade
redis-cli ping
```

#### **3. Erro da OpenAI**
```bash
# Verificar API key
echo $OPENAI_API_KEY

# Testar conectividade
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

#### **4. Problemas de Memória**
```bash
# Verificar uso de memória
docker stats conversation-service

# Verificar logs
docker logs conversation-service
```

## 🔒 Segurança

### **Medidas Implementadas**
- **Helmet**: Headers de segurança HTTP
- **CORS**: Controle de origem das requisições
- **Rate Limiting**: Proteção contra ataques DDoS
- **Validação de Entrada**: Sanitização de dados
- **Logs de Auditoria**: Rastreamento de todas as ações
- **Isolamento por Clínica**: Multi-tenancy seguro

### **Recomendações**
- Usar HTTPS em produção
- Configurar firewall adequadamente
- Monitorar logs de segurança
- Atualizar dependências regularmente
- Usar variáveis de ambiente para secrets

## 📈 Performance

### **Otimizações Implementadas**
- **Índices de Banco**: Consultas otimizadas
- **Cache Redis**: Redução de latência
- **Compressão**: Redução de tráfego
- **Connection Pooling**: Reutilização de conexões
- **Async/Await**: Operações não-bloqueantes

### **Benchmarks Esperados**
- **Tempo de Resposta**: < 200ms para 95% das requisições
- **Throughput**: 1000+ mensagens por minuto
- **Latência de IA**: < 2s para geração de respostas
- **Uptime**: > 99.9%

## 🤝 Contribuição

### **Padrões de Código**
- Seguir ESLint configurado
- Usar async/await para operações assíncronas
- Implementar tratamento de erros robusto
- Adicionar logs estruturados
- Escrever testes para novas funcionalidades

### **Estrutura de Commits**
```
feat: adicionar nova funcionalidade de detecção de emoção
fix: corrigir problema de memória em conversas longas
docs: atualizar documentação da API
test: adicionar testes para LLM Orchestrator
refactor: reorganizar estrutura de serviços
```

## 📞 Suporte

### **Canais de Ajuda**
- **Documentação**: Este README
- **Issues**: GitHub Issues do projeto
- **Logs**: Verificar logs do serviço
- **Monitoramento**: Dashboards de métricas

### **Contatos**
- **Equipe**: AtendeAI Development Team
- **Email**: dev@atendeai.com
- **Slack**: #conversation-service

---

**Versão**: 1.0.0  
**Última Atualização**: 2024-01-15  
**Status**: ✅ PRODUÇÃO READY
