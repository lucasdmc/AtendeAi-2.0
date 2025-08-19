# 📱 WhatsApp Service - AtendeAI 2.0

## 📋 Descrição

O **WhatsApp Service** é um microserviço dedicado à integração com a **WhatsApp Business API** para o sistema AtendeAI 2.0. Este serviço gerencia todo o fluxo de mensagens, webhooks e integração com a plataforma WhatsApp.

## 🚀 Funcionalidades

### **Envio de Mensagens**
- ✅ **Mensagens de Texto**: Envio de mensagens simples de texto
- ✅ **Mensagens de Template**: Uso de templates pré-aprovados pelo WhatsApp
- ✅ **Mensagens de Mídia**: Envio de imagens, áudios, vídeos e documentos
- ✅ **Mensagens Interativas**: Botões, listas e respostas rápidas

### **Recebimento de Mensagens**
- ✅ **Webhook Integration**: Recebe mensagens em tempo real
- ✅ **Processamento Automático**: Processa mensagens recebidas
- ✅ **Validação de Assinatura**: Verifica autenticidade dos webhooks
- ✅ **Múltiplos Tipos**: Suporte a todos os tipos de mensagem WhatsApp

### **Gestão de Estado**
- ✅ **Persistência**: Armazena todas as mensagens no PostgreSQL
- ✅ **Cache Redis**: Cache para performance e gestão de estado
- ✅ **Rastreabilidade**: Histórico completo de mensagens
- ✅ **Estatísticas**: Métricas e relatórios de uso

## 🏗️ Arquitetura

### **Estrutura do Projeto**
```
services/whatsapp-service/
├── src/
│   ├── config/           # Configurações do serviço
│   ├── controllers/      # Controladores da API
│   ├── models/          # Modelos de dados
│   ├── routes/          # Definição de rotas
│   ├── services/        # Lógica de negócio
│   ├── utils/           # Utilitários e helpers
│   └── database/        # Migrações SQL
├── Dockerfile           # Containerização
├── package.json         # Dependências Node.js
├── healthcheck.js       # Health check para Docker
└── README.md           # Esta documentação
```

### **Tecnologias Utilizadas**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis
- **Containerização**: Docker
- **Logging**: Winston
- **Validação**: Express-validator
- **Upload**: Multer

## 🔧 Configuração

### **Variáveis de Ambiente**

```bash
# Servidor
WHATSAPP_SERVICE_PORT=3004
WHATSAPP_SERVICE_HOST=0.0.0.0

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
REDIS_DB=2

# WhatsApp Business API
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_API_VERSION=v18.0
WHATSAPP_BASE_URL=https://graph.facebook.com

# Segurança
WEBHOOK_SIGNATURE_SECRET=your_webhook_signature_secret
JWT_SECRET=your_jwt_secret

# Serviços Externos
CLINIC_SERVICE_URL=http://localhost:3001
CONVERSATION_SERVICE_URL=http://localhost:3003
APPOINTMENT_SERVICE_URL=http://localhost:3002
```

### **Configuração do WhatsApp Business API**

1. **Criar Conta Business**: Acesse [Facebook Developers](https://developers.facebook.com/)
2. **Configurar App**: Crie um app para WhatsApp Business API
3. **Obter Credenciais**:
   - Business Account ID
   - Phone Number ID
   - Access Token
   - Webhook Verify Token
4. **Configurar Webhook**: Configure o endpoint `/api/whatsapp/webhook`

## 🚀 Instalação e Execução

### **Desenvolvimento Local**

```bash
# Clonar o projeto
cd services/whatsapp-service

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar migrações
psql -U postgres -d atendeai -f src/database/migrations.sql

# Iniciar em modo desenvolvimento
npm run dev
```

### **Docker**

```bash
# Construir imagem
docker build -t whatsapp-service .

# Executar container
docker run -d \
  --name whatsapp-service \
  -p 3004:3004 \
  --env-file .env \
  whatsapp-service
```

### **Docker Compose**

```yaml
version: '3.8'
services:
  whatsapp-service:
    build: .
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
```

## 📡 API Endpoints

### **Envio de Mensagens**

#### **POST** `/api/whatsapp/send/text`
Envia mensagem de texto simples.

**Request Body:**
```json
{
  "patient_phone": "+5511999999999",
  "message": "Olá! Como posso ajudar?",
  "clinic_id": "550e8400-e29b-41d4-a716-446655440000",
  "conversation_id": "optional-conversation-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message_id": "uuid",
    "whatsapp_message_id": "wamid.xxx",
    "status": "sent"
  }
}
```

#### **POST** `/api/whatsapp/send/template`
Envia mensagem usando template pré-aprovado.

**Request Body:**
```json
{
  "patient_phone": "+5511999999999",
  "template_name": "welcome_message",
  "language_code": "pt-BR",
  "clinic_id": "550e8400-e29b-41d4-a716-446655440000",
  "components": []
}
```

#### **POST** `/api/whatsapp/send/media`
Envia mensagem com mídia (imagem, áudio, vídeo, documento).

**Request Body:**
```json
{
  "patient_phone": "+5511999999999",
  "media_type": "image",
  "media_url": "https://example.com/image.jpg",
  "caption": "Imagem de exemplo",
  "clinic_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### **POST** `/api/whatsapp/send/interactive**
Envia mensagem interativa com botões ou listas.

**Request Body:**
```json
{
  "patient_phone": "+5511999999999",
  "interactive_data": {
    "type": "button",
    "body": {
      "text": "Escolha uma opção:"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "btn_1",
            "title": "Agendar Consulta"
          }
        }
      ]
    }
  },
  "clinic_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### **Webhook**

#### **GET** `/api/whatsapp/webhook`
Verificação do webhook pelo WhatsApp.

**Query Parameters:**
- `mode`: `subscribe` ou `unsubscribe`
- `token`: Token de verificação
- `challenge`: Desafio para verificação

#### **POST** `/api/whatsapp/webhook`
Recebe webhooks do WhatsApp.

**Request Body:** Dados do webhook do WhatsApp

### **Upload de Mídia**

#### **POST** `/api/whatsapp/media/upload`
Faz upload de mídia para o WhatsApp.

**Request:** FormData com arquivo e clinic_id

### **Gestão de Mensagens**

#### **GET** `/api/whatsapp/messages`
Lista mensagens com filtros.

**Query Parameters:**
- `clinic_id`: ID da clínica (obrigatório)
- `patient_phone`: Telefone do paciente (opcional)
- `limit`: Limite de resultados (padrão: 50)
- `offset`: Offset para paginação (padrão: 0)
- `status`: Status da mensagem (opcional)

#### **GET** `/api/whatsapp/messages/:id`
Obtém mensagem específica por ID.

#### **PUT** `/api/whatsapp/messages/:id`
Atualiza mensagem existente.

#### **DELETE** `/api/whatsapp/messages/:id`
Remove mensagem.

### **Status e Estatísticas**

#### **GET** `/api/whatsapp/messages/:message_id/status`
Obtém status de uma mensagem específica.

#### **GET** `/api/whatsapp/messages/stats`
Obtém estatísticas de mensagens por período.

**Query Parameters:**
- `clinic_id`: ID da clínica
- `start_date`: Data inicial (ISO 8601)
- `end_date`: Data final (ISO 8601)

#### **GET** `/api/whatsapp/messages/recent`
Obtém mensagens recentes.

#### **GET** `/api/whatsapp/messages/unprocessed`
Obtém mensagens não processadas.

### **Conexão e Conta**

#### **GET** `/api/whatsapp/connection/test`
Testa conexão com WhatsApp Business API.

#### **GET** `/api/whatsapp/account/info`
Obtém informações da conta WhatsApp.

### **Health Check**

#### **GET** `/api/whatsapp/health`
Health check básico do serviço.

#### **GET** `/api/whatsapp/status`
Status detalhado do serviço.

## 🗄️ Banco de Dados

### **Tabelas Principais**

#### **whatsapp_messages**
Armazena todas as mensagens enviadas e recebidas.

```sql
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY,
    clinic_id UUID NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_name VARCHAR(100),
    message_type VARCHAR(20) NOT NULL,
    content TEXT,
    direction VARCHAR(20) NOT NULL,
    whatsapp_message_id VARCHAR(100) UNIQUE,
    conversation_id UUID,
    metadata JSONB,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

#### **whatsapp_templates**
Armazena templates de mensagens aprovados.

#### **whatsapp_media**
Armazena informações sobre mídia enviada.

#### **whatsapp_webhooks**
Armazena webhooks recebidos para auditoria.

### **Índices de Performance**
- Índices em `clinic_id`, `patient_phone`, `status`
- Índices compostos para consultas frequentes
- Índices em timestamps para consultas por período

## 🔒 Segurança

### **Validação de Webhook**
- Verificação de assinatura HMAC-SHA256
- Token de verificação configurável
- Validação de origem das requisições

### **Rate Limiting**
- Limite de 100 requisições por 15 minutos por IP
- Configurável via variáveis de ambiente

### **Validação de Entrada**
- Validação de telefones brasileiros
- Validação de UUIDs
- Sanitização de conteúdo
- Validação de tipos de arquivo

### **CORS e Headers**
- Configuração de origens permitidas
- Headers de segurança com Helmet
- Suporte a credenciais

## 📊 Monitoramento

### **Logging**
- Logs estruturados em JSON
- Níveis: error, warn, info, debug
- Contexto rico para debugging
- Rotação de arquivos de log

### **Health Checks**
- Endpoint `/health` para Docker
- Verificação de conectividade com banco
- Verificação de conectividade com Redis
- Status de integração com WhatsApp

### **Métricas**
- Contagem de mensagens por tipo
- Estatísticas de status
- Performance de consultas
- Uso de recursos

## 🧪 Testes

### **Executar Testes**

```bash
# Testes unitários
npm test

# Testes em modo watch
npm run test:watch

# Testes com cobertura
npm run test:coverage

# Linting
npm run lint

# Linting com correção automática
npm run lint:fix
```

### **Cobertura de Testes**
- Testes unitários para todos os modelos
- Testes de integração para controllers
- Testes de validação de rotas
- Testes de serviços externos

## 🚀 Deploy

### **Ambiente de Produção**

1. **Configurar Variáveis**: Definir todas as variáveis de ambiente
2. **Executar Migrações**: Aplicar migrações no banco de produção
3. **Configurar SSL**: Configurar certificados para HTTPS
4. **Configurar Load Balancer**: Configurar balanceamento de carga
5. **Monitoramento**: Configurar alertas e dashboards

### **Docker Production**

```bash
# Build otimizado
docker build --target production -t whatsapp-service:prod .

# Executar com restart automático
docker run -d \
  --name whatsapp-service-prod \
  --restart unless-stopped \
  -p 3004:3004 \
  --env-file .env.prod \
  whatsapp-service:prod
```

## 🔧 Troubleshooting

### **Problemas Comuns**

#### **Webhook não recebendo mensagens**
- Verificar configuração do webhook no Facebook
- Verificar token de verificação
- Verificar logs de erro
- Verificar conectividade de rede

#### **Erro de autenticação**
- Verificar `WHATSAPP_ACCESS_TOKEN`
- Verificar `WHATSAPP_PHONE_NUMBER_ID`
- Verificar permissões da conta
- Verificar expiração do token

#### **Mensagens não sendo enviadas**
- Verificar status da conta WhatsApp
- Verificar limites de rate limiting
- Verificar logs de erro
- Verificar conectividade com API

### **Logs de Debug**

```bash
# Ativar logs detalhados
LOG_LEVEL=debug npm start

# Verificar logs do container
docker logs whatsapp-service -f

# Verificar logs do banco
docker logs postgres -f
```

## 📚 Recursos Adicionais

### **Documentação WhatsApp Business API**
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Webhook Setup Guide](https://developers.facebook.com/docs/whatsapp/webhook)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/message-templates)

### **Exemplos de Uso**
- [Exemplos de Mensagens](https://developers.facebook.com/docs/whatsapp/sample-messages)
- [Exemplos de Webhooks](https://developers.facebook.com/docs/whatsapp/webhook-examples)

### **Suporte**
- [WhatsApp Business Support](https://business.whatsapp.com/support)
- [Facebook Developer Support](https://developers.facebook.com/support)

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Contribuição

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Contato

- **Equipe AtendeAI**: [contato@atendeai.com](mailto:contato@atendeai.com)
- **Documentação**: [docs.atendeai.com](https://docs.atendeai.com)
- **Issues**: [GitHub Issues](https://github.com/atendeai/atendeai-2.0/issues)

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2024  
**Status**: ✅ Implementado e Testado
