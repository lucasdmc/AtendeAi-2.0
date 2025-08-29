# 🤖 **GUIA DE ATIVAÇÃO DO CHATBOT - ATENDEAI 2.0**

## 🎯 **SUA URL DO PROJETO:**
```
https://atendeai-20-production.up.railway.app
```

---

## **PASSO 1: 🔗 CONFIGURAR WEBHOOK NO META DEVELOPER CONSOLE**

### **1.1 Acesse o Meta Developer Console:**
1. 🌐 Vá para: https://developers.facebook.com/apps/
2. 🏢 Selecione seu app existente
3. 📱 Clique em "WhatsApp" no menu lateral

### **1.2 Configure o Webhook:**
1. 📍 Vá para **"WhatsApp > Configuration"**
2. 🔧 Na seção **"Webhook"**, clique em **"Edit"**
3. ⚙️ Configure:

```
📍 Callback URL: https://atendeai-20-production.up.railway.app/webhook/whatsapp
🔑 Verify Token: atendeai_webhook_verify_2024
📋 Webhook Fields: ✅ messages ✅ message_deliveries ✅ message_reads
```

4. 💾 Clique em **"Verify and Save"**

---

## **PASSO 2: 📝 COLETAR SUAS CREDENCIAIS**

### **2.1 No Meta Developer Console, colete:**

1. **📱 WhatsApp Access Token:**
   - Vá para: WhatsApp > Getting Started
   - Copie o "Temporary access token" ou gere um permanente

2. **📞 Phone Number ID:**
   - Na mesma página, copie o "Phone number ID"

3. **🏢 Business Account ID:**
   - Vá para: WhatsApp > Getting Started
   - Copie o "WhatsApp Business Account ID"

4. **🔐 App Secret:**
   - Vá para: Settings > Basic
   - Copie o "App Secret"

---

## **PASSO 3: 🌐 CONFIGURAR VARIÁVEIS NO RAILWAY**

### **3.1 Acesse o Railway Dashboard:**
1. 🌐 Vá para: https://railway.com/project/d5013814-7bfc-4b59-a913-439252079276
2. 🎛️ Clique na aba **"Variables"**

### **3.2 Adicione as seguintes variáveis:**

```bash
# 📱 WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=seu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id_aqui
WHATSAPP_BUSINESS_ACCOUNT_ID=seu_business_id_aqui
WHATSAPP_VERIFY_TOKEN=atendeai_webhook_verify_2024
WHATSAPP_APP_SECRET=seu_app_secret_aqui

# 🤖 OpenAI (para o chatbot)
OPENAI_API_KEY=sua_openai_key_aqui

# 🗄️ Banco de Dados (já configurado)
DATABASE_URL=postgresql://seu_banco_aqui

# 🔐 Segurança
JWT_SECRET=atendeai-jwt-secret-2024-super-seguro

# 🌐 URLs dos Serviços
CONVERSATION_SERVICE_URL=https://atendeai-20-production.up.railway.app
CLINIC_SERVICE_URL=https://atendeai-20-production.up.railway.app
WHATSAPP_SERVICE_URL=https://atendeai-20-production.up.railway.app

# 🏥 Configuração padrão da clínica
DEFAULT_CLINIC_NAME=Clínica AtendeAI
DEFAULT_CLINIC_PHONE=+5511999999999
```

---

## **PASSO 4: 🚀 DEPLOY DOS SERVIÇOS BACKEND**

### **4.1 Vamos fazer deploy dos microserviços:**

**❗ IMPORTANTE:** Precisamos deployar os serviços backend separadamente ou configurar o Railway para rodar múltiplos serviços.

### **Opção A: Deploy All-in-One (Recomendado para início)**
Seu projeto atual já está configurado como monolito. Vamos ajustar para suportar todos os serviços.

### **Opção B: Deploy de Microserviços Separados**
Cada serviço em um projeto Railway separado.

**👉 Qual opção você prefere?**

---

## **PASSO 5: 🧪 TESTAR A INTEGRAÇÃO**

### **5.1 Teste o Webhook:**
1. 📱 Envie uma mensagem para seu número WhatsApp Business
2. 🔍 Verifique os logs no Railway
3. ✅ Confirme que a mensagem foi recebida

### **5.2 Teste o Chatbot:**
```
👤 Usuário: "Olá"
🤖 Bot: "Olá! Bem-vindo à [Nome da Clínica]. Como posso ajudá-lo hoje?"

👤 Usuário: "Quero agendar uma consulta"
🤖 Bot: "Ótimo! Para agendar sua consulta, preciso de algumas informações..."
```

---

## **⚡ CHECKLIST RÁPIDO:**

- [ ] ✅ Webhook configurado no Meta Developer Console
- [ ] ✅ URL: https://atendeai-20-production.up.railway.app/webhook/whatsapp
- [ ] ✅ Verify Token: atendeai_webhook_verify_2024
- [ ] ✅ Credenciais WhatsApp coletadas
- [ ] ✅ Variáveis configuradas no Railway
- [ ] ✅ Deploy dos serviços realizado
- [ ] ✅ Teste de mensagem WhatsApp
- [ ] ✅ Resposta do chatbot funcionando

---

## **🆘 PROBLEMAS COMUNS:**

### **❌ Webhook não verifica:**
- Verifique se a URL está correta
- Verifique se o verify token está exato
- Verifique se o serviço está rodando

### **❌ Chatbot não responde:**
- Verifique se OPENAI_API_KEY está configurada
- Verifique logs no Railway
- Verifique se o banco de dados está acessível

### **❌ Erro 500:**
- Verifique todas as variáveis de ambiente
- Verifique conexão com banco de dados
- Verifique logs detalhados

---

## **📞 PRÓXIMO PASSO:**

**👉 Vamos começar? Você já tem todas as credenciais do WhatsApp Business API em mãos?**

1. **Access Token** ✅/❌
2. **Phone Number ID** ✅/❌  
3. **Business Account ID** ✅/❌
4. **App Secret** ✅/❌

Se sim, posso te ajudar a configurar tudo no Railway agora mesmo! 🚀
