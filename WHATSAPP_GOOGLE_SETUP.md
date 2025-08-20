# 🚀 Configuração dos Serviços WhatsApp e Google Calendar

## 📋 **Resumo das Configurações**

### ✅ **Já Configurado:**
- **WhatsApp Business API**: Token de acesso e Phone Number ID
- **Google OAuth**: Client ID
- **Infraestrutura**: Docker, Redis, Banco de dados
- **Variáveis de ambiente**: Configuradas no docker-compose.yml

### ⚠️ **Ainda Precisa Configurar:**
- **Google Client Secret**
- **Google API Key**
- **Webhook do WhatsApp no Meta Developer Console**

---

## 🔧 **Configuração Rápida**

### **1. Execute o Script de Setup**
```bash
./scripts/setup-whatsapp-google.sh
```

### **2. Configure as Credenciais Faltantes**
Edite o arquivo `.env` e adicione:
```bash
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_API_KEY=sua_api_key_aqui
```

### **3. Reinicie os Serviços**
```bash
docker-compose restart whatsapp-service google-calendar-service
```

---

## 📱 **Configuração do WhatsApp Business API**

### **Status Atual:**
- ✅ **Access Token**: Configurado
- ✅ **Phone Number ID**: Configurado
- ✅ **Business Account ID**: Configurado
- ⚠️ **Webhook**: Precisa ser configurado no Meta Developer Console

### **Para Configurar o Webhook:**

1. **Acesse o Meta Developer Console**
   - https://developers.facebook.com/apps/

2. **Configure o Webhook:**
   - **URL**: `https://seu-dominio.com/webhook/whatsapp`
   - **Verify Token**: `atendeai_webhook_verify_2024`
   - **Campos**: `messages`, `message_deliveries`, `message_reads`

3. **Teste o Webhook:**
   ```bash
   curl -X POST http://localhost:3007/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"1234567890","phone_number_id":"698766983327246"},"contacts":[{"profile":{"name":"Test"},"wa_id":"1234567890"}],"messages":[{"from":"1234567890","id":"wamid.123","timestamp":"1234567890","text":{"body":"Hello"}}]}}]}]}'
   ```

---

## 📅 **Configuração do Google Calendar API**

### **Status Atual:**
- ✅ **Client ID**: Configurado
- ⚠️ **Client Secret**: Precisa ser configurado
- ⚠️ **API Key**: Precisa ser configurado

### **Para Obter as Credenciais:**

1. **Acesse o Google Cloud Console**
   - https://console.cloud.google.com/

2. **Crie um Projeto ou Use um Existente**

3. **Habilite a Google Calendar API**
   - APIs & Services > Library
   - Procure por "Google Calendar API"
   - Clique em "Enable"

4. **Configure OAuth 2.0:**
   - APIs & Services > Credentials
   - Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
   - Tipo: "Web application"
   - URIs autorizados: `http://localhost:3008`
   - URIs de redirecionamento: `http://localhost:3008/auth/google/callback`

5. **Crie uma API Key:**
   - APIs & Services > Credentials
   - Clique em "Create Credentials" > "API Key"
   - Restrinja a chave para "Google Calendar API"

6. **Configure no arquivo .env:**
   ```bash
   GOOGLE_CLIENT_SECRET=GOCSPX-seu_client_secret_aqui
   GOOGLE_API_KEY=sua_api_key_aqui
   ```

---

## 🧪 **Testando os Serviços**

### **1. Verificar Status dos Serviços**
```bash
# WhatsApp Service
curl http://localhost:3007/health

# Google Calendar Service
curl http://localhost:3008/health
```

### **2. Testar WhatsApp API**
```bash
# Enviar mensagem de teste
curl -X POST http://localhost:3007/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_jwt_token" \
  -d '{
    "phoneNumber": "5511999999999",
    "message": "Teste do AtendeAI 2.0"
  }'
```

### **3. Testar Google Calendar API**
```bash
# Listar calendários
curl http://localhost:3008/api/calendar/list \
  -H "Authorization: Bearer seu_jwt_token"

# Criar evento de teste
curl -X POST http://localhost:3008/api/calendar/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_jwt_token" \
  -d '{
    "summary": "Consulta Teste",
    "start": "2024-01-20T10:00:00-03:00",
    "end": "2024-01-20T10:30:00-03:00",
    "description": "Consulta de teste do AtendeAI 2.0"
  }'
```

---

## 🔍 **Troubleshooting**

### **Problemas Comuns:**

1. **WhatsApp Service não inicia:**
   ```bash
   docker-compose logs whatsapp-service
   # Verifique se as variáveis de ambiente estão corretas
   ```

2. **Google Calendar Service não inicia:**
   ```bash
   docker-compose logs google-calendar-service
   # Verifique se GOOGLE_CLIENT_SECRET está configurado
   ```

3. **Erro de conexão com banco:**
   ```bash
   # Verifique se o Supabase está acessível
   curl https://kytphnasmdvebmdvvwtx.supabase.co/rest/v1/
   ```

4. **Erro de Redis:**
   ```bash
   # Verifique se o Redis está rodando
   docker-compose ps redis
   ```

### **Logs dos Serviços:**
```bash
# WhatsApp Service
docker-compose logs -f whatsapp-service

# Google Calendar Service
docker-compose logs -f google-calendar-service

# Todos os serviços
docker-compose logs -f
```

---

## 📚 **Documentação Adicional**

- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **Google Calendar API**: https://developers.google.com/calendar
- **Meta Developer Console**: https://developers.facebook.com/
- **Google Cloud Console**: https://console.cloud.google.com/

---

## 🎯 **Próximos Passos**

1. ✅ Configure o `GOOGLE_CLIENT_SECRET`
2. ✅ Configure o `GOOGLE_API_KEY`
3. ✅ Configure o webhook do WhatsApp no Meta Developer Console
4. ✅ Teste as APIs
5. ✅ Integre com o frontend
6. ✅ Configure monitoramento e alertas

---

**🎉 Após essas configurações, os serviços de WhatsApp e Google Calendar estarão funcionando perfeitamente!**
