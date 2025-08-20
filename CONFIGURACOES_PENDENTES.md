# 🔧 **CONFIGURAÇÕES PENDENTES - ATENDEAI 2.0**

## 📋 **Status das Configurações**

### ✅ **JÁ CONFIGURADO:**
- OpenAI API Key
- WhatsApp Business API (Token, Phone Number ID, Business Account ID)
- Google OAuth Client ID
- Supabase (URL, Anon Key, Service Role Key)
- Banco de dados PostgreSQL
- Redis
- Infraestrutura Docker

### ⚠️ **PRECISA CONFIGURAR:**

---

## 🔑 **1. GOOGLE CALENDAR API - OBRIGATÓRIO**

### **Google Client Secret:**
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

### **Google API Key:**
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

## 🌐 **2. WEBHOOK DO WHATSAPP - OBRIGATÓRIO**

### **Configure no Meta Developer Console:**
1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app
3. WhatsApp > Getting Started
4. Configure o Webhook:
   - **URL**: `https://seu-dominio.com/webhook/whatsapp`
   - **Verify Token**: `atendeai_webhook_verify_2024`
   - **Campos**: `messages`, `message_deliveries`, `message_reads`

---

## 🔒 **3. JWT SECRET - RECOMENDADO**

### **Altere o JWT Secret padrão:**
```bash
# No arquivo .env, altere esta linha:
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Para uma chave segura (exemplo):
JWT_SECRET=atendeai-jwt-secret-2024-super-seguro-e-unico
```

**Como gerar uma chave segura:**
```bash
# No terminal:
openssl rand -base64 64
```

---

## 📧 **4. CONFIGURAÇÕES DE EMAIL (OPCIONAL)**

### **Se quiser usar notificações por email:**
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

## 🚀 **5. EXECUTAR O SISTEMA**

### **Após configurar as variáveis obrigatórias:**

1. **Inicie a infraestrutura:**
   ```bash
   docker-compose up -d redis kong
   ```

2. **Inicie os serviços:**
   ```bash
   docker-compose up -d auth-service clinic-service conversation-service appointment-service
   ```

3. **Inicie os serviços de integração:**
   ```bash
   docker-compose up -d whatsapp-service google-calendar-service
   ```

4. **Verifique o status:**
   ```bash
   docker-compose ps
   ```

---

## 🧪 **6. TESTAR AS CONFIGURAÇÕES**

### **Teste os serviços:**
```bash
# WhatsApp Service
curl http://localhost:3007/health

# Google Calendar Service
curl http://localhost:3008/health

# Auth Service
curl http://localhost:3001/health

# Clinic Service
curl http://localhost:3002/health
```

---

## 📝 **7. CHECKLIST FINAL**

- [ ] Google Client Secret configurado
- [ ] Google API Key configurado
- [ ] Webhook do WhatsApp configurado no Meta Developer Console
- [ ] JWT Secret alterado para uma chave segura
- [ ] Todas as variáveis no arquivo .env estão corretas
- [ ] Docker está rodando
- [ ] Serviços estão iniciando sem erro
- [ ] APIs estão respondendo nos endpoints de health

---

## 🆘 **PROBLEMAS COMUNS**

### **Erro de conexão com Google Calendar:**
- Verifique se GOOGLE_CLIENT_SECRET está correto
- Verifique se GOOGLE_API_KEY está correto
- Verifique se a Google Calendar API está habilitada no projeto

### **Erro de webhook do WhatsApp:**
- Verifique se o webhook está configurado no Meta Developer Console
- Verifique se o verify token está correto
- Verifique se a URL do webhook está acessível publicamente

### **Erro de banco de dados:**
- Verifique se o Supabase está acessível
- Verifique se as credenciais do banco estão corretas
- Verifique se o SSL está configurado corretamente

---

## 📞 **SUPORTE**

Se encontrar problemas:
1. Verifique os logs: `docker-compose logs -f [nome-do-servico]`
2. Verifique o status: `docker-compose ps`
3. Teste a conectividade: `./scripts/test-connectivity.sh`

---

**🎯 Após completar essas configurações, seu sistema AtendeAI 2.0 estará funcionando perfeitamente!**
