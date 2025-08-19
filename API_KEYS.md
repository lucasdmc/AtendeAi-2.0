# 🔑 CONFIGURAÇÃO DE API KEYS - ATENDEAI 2.0

---

## 📋 **VISÃO GERAL**

Este documento contém todas as configurações de API Keys necessárias para executar o projeto AtendeAI 2.0. **IMPORTANTE**: Nunca commite este arquivo no repositório, mantenha-o apenas localmente.

---

## 🚀 **CONFIGURAÇÕES SUPABASE**

### **Projeto Supabase**
- **URL**: `https://kytphnasmdvebmdvvwtx.supabase.co`
- **Project ID**: `kytphnasmdvebmdvvwtx`

### **API Keys**
```bash
# Chave anônima (para frontend)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9lIjoiYW5vbiIsImlhdCI6MTc1NTYyMjgxMCwiZXhwIjoyMDcxMTk4ODEwfQ.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA

# Chave de serviço (para backend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9lIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU1NjIyODEwLCJleHAiOjIwNzExOTg4MTB9LjM2SXA5Tld2cWg2YWVGUXVvd1Y3OXI1NEMyWVFQYzVOLU1uX2RuMlFENzA
```

### **Conexão do Banco**
```bash
DATABASE_URL=postgresql://postgres:supabase@1234@db.kytphnasmdvebmdvvwtx.supabase.co:5432/postgres
```

---

## 🔐 **CONFIGURAÇÕES JWT**

```bash
# Chave secreta para JWT (ALTERAR EM PRODUÇÃO)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Expiração dos tokens
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Configurações de segurança
BCRYPT_ROUNDS=12
```

---

## 📱 **CONFIGURAÇÕES WHATSAPP BUSINESS API**

### **Meta Developer Account**
- **App ID**: [CONFIGURAR]
- **App Secret**: [CONFIGURAR]
- **Phone Number ID**: [CONFIGURAR]
- **Business Account ID**: [CONFIGURAR]

### **Variáveis de Ambiente**
```bash
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=[CONFIGURAR]
WHATSAPP_PHONE_NUMBER_ID=[CONFIGURAR]
WHATSAPP_BUSINESS_ACCOUNT_ID=[CONFIGURAR]
WHATSAPP_APP_ID=[CONFIGURAR]
WHATSAPP_APP_SECRET=[CONFIGURAR]

# Webhook
WHATSAPP_WEBHOOK_VERIFY_TOKEN=[CONFIGURAR]
```

---

## 📅 **CONFIGURAÇÕES GOOGLE CALENDAR**

### **Google Cloud Console**
- **Project ID**: [CONFIGURAR]
- **Client ID**: [CONFIGURAR]
- **Client Secret**: [CONFIGURAR]

### **Variáveis de Ambiente**
```bash
# Google Calendar API
GOOGLE_CLIENT_ID=[CONFIGURAR]
GOOGLE_CLIENT_SECRET=[CONFIGURAR]
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
GOOGLE_SCOPES=https://www.googleapis.com/auth/calendar

# Arquivo de credenciais
GOOGLE_CREDENTIALS_FILE=./credentials/google-calendar-credentials.json
```

---

## 🔒 **CONFIGURAÇÕES DE SEGURANÇA**

```bash
# Rate Limiting
RATE_LIMIT_LOGIN_ATTEMPTS=5
RATE_LIMIT_WINDOW_MINUTES=1
RATE_LIMIT_JWT_VALIDATION_PER_MINUTE=100

# CORS
CORS_ORIGIN=http://localhost:8080,http://localhost:3000

# Session
SESSION_SECRET=your-super-secret-session-key-change-in-production
```

---

## 🗄️ **CONFIGURAÇÕES REDIS**

```bash
# Redis Cache
REDIS_URL=redis://:redis123@localhost:6379
REDIS_PASSWORD=redis123
REDIS_DB=0
```

---

## 📊 **CONFIGURAÇÕES DE MONITORAMENTO**

```bash
# Prometheus
PROMETHEUS_PORT=9090

# Grafana
GRAFANA_PORT=3000
GRAFANA_ADMIN_PASSWORD=admin123
```

---

## 🚀 **CONFIGURAÇÕES DE DESENVOLVIMENTO**

### **Portas dos Serviços**
```bash
# Frontend
FRONTEND_PORT=8080

# Backend Services
AUTH_SERVICE_PORT=3001
USER_SERVICE_PORT=3002
CLINIC_SERVICE_PORT=3003
HEALTH_SERVICE_PORT=3004
CONVERSATION_SERVICE_PORT=3005
APPOINTMENT_SERVICE_PORT=3006
WHATSAPP_SERVICE_PORT=3007
GOOGLE_CALENDAR_SERVICE_PORT=3008

# Infrastructure
KONG_PROXY_PORT=8000
KONG_ADMIN_PORT=8001
KONG_GUI_PORT=8002
HAPROXY_PORT=80
REDIS_PORT=6379
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
```

---

## 📝 **ARQUIVO .ENV EXEMPLO**

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```bash
# =====================================================
# CONFIGURAÇÕES SUPABASE
# =====================================================
SUPABASE_URL=https://kytphnasmdvebmdvvwtx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9lIjoiYW5vbiIsImlhdCI6MTc1NTYyMjgxMCwiZXhwIjoyMDcxMTk4ODEwfQ.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9lIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU1NjIyODEwLCJleHAiOjIwNzExOTg4MTB9LjM2SXA5Tld2cWg2YWVGUXVvd1Y3OXI1NEMyWVFQYzVOLU1uX2RuMlFENzA
DATABASE_URL=postgresql://postgres:supabase@1234@db.kytphnasmdvebmdvvwtx.supabase.co:5432/postgres

# =====================================================
# CONFIGURAÇÕES JWT
# =====================================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
BCRYPT_ROUNDS=12

# =====================================================
# CONFIGURAÇÕES WHATSAPP
# =====================================================
WHATSAPP_ACCESS_TOKEN=[CONFIGURAR]
WHATSAPP_PHONE_NUMBER_ID=[CONFIGURAR]
WHATSAPP_BUSINESS_ACCOUNT_ID=[CONFIGURAR]
WHATSAPP_APP_ID=[CONFIGURAR]
WHATSAPP_APP_SECRET=[CONFIGURAR]
WHATSAPP_WEBHOOK_VERIFY_TOKEN=[CONFIGURAR]

# =====================================================
# CONFIGURAÇÕES GOOGLE
# =====================================================
GOOGLE_CLIENT_ID=[CONFIGURAR]
GOOGLE_CLIENT_SECRET=[CONFIGURAR]
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
GOOGLE_SCOPES=https://www.googleapis.com/auth/calendar

# =====================================================
# CONFIGURAÇÕES REDIS
# =====================================================
REDIS_URL=redis://:redis123@localhost:6379
REDIS_PASSWORD=redis123

# =====================================================
# CONFIGURAÇÕES DE DESENVOLVIMENTO
# =====================================================
NODE_ENV=development
FRONTEND_PORT=8080
```

---

## ⚠️ **IMPORTANTE**

1. **Nunca commite este arquivo** no repositório
2. **Altere todas as senhas** em produção
3. **Configure as APIs** do WhatsApp e Google Calendar
4. **Mantenha as chaves seguras** e não as compartilhe
5. **Use variáveis de ambiente** para configurações sensíveis

---

## 🚀 **PRÓXIMOS PASSOS**

1. Configure as APIs do WhatsApp Business
2. Configure as APIs do Google Calendar
3. Execute `docker-compose up -d` para iniciar a infraestrutura
4. Execute o frontend na porta 8080
5. Teste a conectividade entre os serviços

---

**Última atualização**: 2024-01-15  
**Versão**: 1.0.0  
**Status**: CONFIGURAÇÃO COMPLETA
