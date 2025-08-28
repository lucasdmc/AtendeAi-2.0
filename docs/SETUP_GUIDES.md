# 🔧 **GUIAS DE CONFIGURAÇÃO - ATENDEAI 2.0**

---

## 🎯 **VISÃO GERAL DOS SETUPS**

Este documento consolida todos os guias de configuração necessários para colocar o AtendeAI 2.0 em funcionamento completo.

---

## 🚨 **CONFIGURAÇÕES OBRIGATÓRIAS - PRIORIDADE ALTA**

### **1. GOOGLE CALENDAR API - OBRIGATÓRIO**

#### **Google Client Secret:**
```bash
# No arquivo .env, altere esta linha:
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret_here

# Para:
GOOGLE_CLIENT_SECRET=GOCSPX-seu_client_secret_real_aqui
```

**Como obter:**
1. Acesse: https://console.cloud.google.com/
2. Selecione seu projeto
3. APIs & Services > Credentials
4. Clique no OAuth 2.0 Client ID existente
5. Copie o "Client Secret"

#### **Google API Key:**
```bash
# No arquivo .env, altere esta linha:
GOOGLE_API_KEY=your_google_api_key_here

# Para:
GOOGLE_API_KEY=AIzaSySua_chave_real_aqui
```

**Como obter:**
1. Acesse: https://console.cloud.google.com/
2. APIs & Services > Credentials
3. Clique em "Create Credentials" > "API Key"
4. Restrinja a chave para "Google Calendar API"

---

### **2. WEBHOOK DO WHATSAPP - OBRIGATÓRIO**

#### **Configure no Meta Developer Console:**
1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app
3. WhatsApp > Getting Started
4. Configure o Webhook:
   - **URL**: `https://seu-dominio.com/webhook/whatsapp`
   - **Verify Token**: `atendeai_webhook_verify_2024`
   - **Campos**: `messages`, `message_deliveries`, `message_reads`

#### **Teste o Webhook:**
```bash
curl -X POST http://localhost:3007/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"id":"123","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"1234567890","phone_number_id":"698766983327246"},"contacts":[{"profile":{"name":"Test"},"wa_id":"1234567890"}],"messages":[{"from":"1234567890","id":"wamid.123","timestamp":"1234567890","text":{"body":"Hello"}}]}}]}]}'
```

---

### **3. JWT SECRET - RECOMENDADO**

#### **Altere o JWT Secret padrão:**
```bash
# No arquivo .env, altere esta linha:
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Para uma chave segura:
JWT_SECRET=atendeai-jwt-secret-2024-super-seguro-e-unico
```

**Como gerar uma chave segura:**
```bash
# No terminal:
openssl rand -base64 64
```

---

## 🔧 **CONFIGURAÇÕES OPCIONAIS**

### **4. CONFIGURAÇÕES DE EMAIL (OPCIONAL)**

#### **Se quiser usar notificações por email:**
```bash
# No arquivo .env, configure:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app_do_gmail
```

**Para Gmail:**
1. Ative a verificação em 2 etapas
2. Gere uma "Senha de App"
3. Use essa senha no SMTP_PASS

---

## 🚀 **EXECUTAR O SISTEMA APÓS CONFIGURAÇÃO**

### **1. Inicie a infraestrutura:**
```bash
docker-compose up -d redis kong
```

### **2. Inicie os serviços:**
```bash
docker-compose up -d clinic-service conversation-service appointment-service
```

### **3. Inicie os serviços de integração:**
```bash
docker-compose up -d whatsapp-service google-calendar-service
```

### **4. Verifique o status:**
```bash
docker-compose ps
```

### **5. Inicie o frontend:**
```bash
./scripts/start-frontend.sh
```

---

## 🧪 **TESTAR AS CONFIGURAÇÕES**

### **Teste os serviços:**
```bash
# WhatsApp Service
curl http://localhost:3007/health

# Google Calendar Service
curl http://localhost:3008/health

# Clinic Service
curl http://localhost:3003/health
```

---

## 🔍 **TROUBLESHOOTING COMUM**

### **Problemas com Google Calendar:**
- Verifique se GOOGLE_CLIENT_SECRET está correto
- Verifique se GOOGLE_API_KEY está correto
- Verifique se a Google Calendar API está habilitada no projeto

### **Problemas com WhatsApp:**
- Verifique se o webhook está configurado no Meta Developer Console
- Verifique se o verify token está correto
- Verifique se a URL do webhook está acessível publicamente

### **Problemas com banco de dados:**
- Verifique se o Supabase está acessível
- Verifique se as credenciais do banco estão corretas
- Verifique se o SSL está configurado corretamente

---

## 📋 **CHECKLIST FINAL DE CONFIGURAÇÃO**

- [ ] Google Client Secret configurado
- [ ] Google API Key configurado
- [ ] Webhook do WhatsApp configurado no Meta Developer Console
- [ ] JWT Secret alterado para uma chave segura
- [ ] Todas as variáveis no arquivo .env estão corretas
- [ ] Docker está rodando
- [ ] Serviços estão iniciando sem erro
- [ ] APIs estão respondendo nos endpoints de health

---

## 🆘 **SUPORTE E LOGS**

### **Verificar logs dos serviços:**
```bash
# WhatsApp Service
docker-compose logs -f whatsapp-service

# Google Calendar Service
docker-compose logs -f google-calendar-service

# Todos os serviços
docker-compose logs -f
```

### **Verificar status:**
```bash
docker-compose ps
```

### **Testar conectividade:**
```bash
./scripts/test-connectivity.sh
```

---

## 📚 **RECURSOS ADICIONAIS**

- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **Google Calendar API**: https://developers.google.com/calendar
- **Meta Developer Console**: https://developers.facebook.com/
- **Google Cloud Console**: https://console.cloud.google.com/

---

## 🎯 **PRÓXIMOS PASSOS APÓS CONFIGURAÇÃO**

1. ✅ Configure todas as variáveis obrigatórias
2. ✅ Execute o sistema
3. ✅ Teste as APIs
4. ✅ Integre com o frontend
5. ✅ Configure monitoramento e alertas
6. ✅ Implemente sistema de autenticação

---

**🎉 Após completar essas configurações, seu sistema AtendeAI 2.0 estará funcionando perfeitamente!**

---

**Status**: ⚠️ REQUER CONFIGURAÇÃO  
**Última atualização**: 2024-01-15  
**Próxima ação**: Configurar variáveis obrigatórias
