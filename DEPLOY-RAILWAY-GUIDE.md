# 🚀 Guia de Deploy no Railway - AtendeAI 2.0

**Projeto Railway**: https://railway.com/project/d5013814-7bfc-4b59-a913-439252079276

---

## 📋 **Pré-requisitos Cumpridos**

✅ **Testes Locais**: Sistema funcionando em http://localhost:8082  
✅ **Build**: Compilando sem erros  
✅ **Estrutura**: Arquivos de configuração criados  

---

## 🔧 **1. Preparação do Repositório**

### **A. Commitar as Mudanças**

```bash
# Verificar status
git status

# Adicionar arquivos
git add .

# Commitar
git commit -m "feat: prepare for railway deployment v1.2.0"

# Push para GitHub
git push origin main
```

### **B. Verificar Arquivos de Deploy**

Arquivos já criados para Railway:
- ✅ `railway.json` - Configuração do Railway
- ✅ `Procfile` - Comando de start
- ✅ `package.json` - Scripts atualizados
- ✅ `env.railway.example` - Exemplo de variáveis

---

## 🌐 **2. Configurar no Railway Dashboard**

### **A. Conectar Repositório**

1. **Acesse**: https://railway.com/project/d5013814-7bfc-4b59-a913-439252079276
2. **Clique**: "New" → "GitHub Repo"
3. **Selecione**: Seu repositório do AtendeAI 2.0
4. **Confirme**: Railway detectará automaticamente como projeto Node.js

### **B. Configurar Build**

Railway deve detectar automaticamente:
```json
{
  "buildCommand": "npm run build:production",
  "startCommand": "npm start"
}
```

---

## ⚙️ **3. Configurar Variáveis de Ambiente**

### **A. Variáveis Obrigatórias**

No Railway Dashboard → Variables, adicione:

```bash
# Build e Runtime
NODE_ENV=production
PORT=3000

# Supabase (obrigatório)
VITE_SUPABASE_URL=https://kytphnasmdvebmdvvwtx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjI4MTAsImV4cCI6MjA3MTE5ODgxMH0.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA

# API Base (será preenchido após deploy)
VITE_API_BASE_URL=https://atendeai-production.up.railway.app
```

### **B. Variáveis Opcionais (para funcionalidades completas)**

```bash
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=seu_token_meta_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id_aqui
WHATSAPP_WEBHOOK_VERIFY_TOKEN=atendeai_webhook_verify_2024

# Google Calendar
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_REDIRECT_URI=https://atendeai-production.up.railway.app/auth/google/callback

# Segurança
JWT_SECRET=railway-super-secret-jwt-key-production-2024
```

---

## 🗄️ **4. Configurar Banco de Dados (Opcional)**

### **A. PostgreSQL no Railway**

Se quiser usar PostgreSQL do Railway:

1. **Adicionar**: "New" → "Database" → "PostgreSQL"
2. **Copiar**: URL de conexão gerada
3. **Adicionar**: Como variável `DATABASE_URL`

### **B. Redis no Railway**

Para cache:

1. **Adicionar**: "New" → "Database" → "Redis"
2. **Copiar**: URL de conexão
3. **Adicionar**: Como variável `REDIS_URL`

---

## 🚀 **5. Processo de Deploy**

### **A. Deploy Automático**

1. **Push do código** → Railway detecta automaticamente
2. **Build automático** → npm run build:production
3. **Deploy automático** → npm start
4. **URL gerada** → https://atendeai-production.up.railway.app

### **B. Monitorar Deploy**

1. **Logs**: Railway Dashboard → Deployments → View Logs
2. **Status**: Verificar se build e start foram bem-sucedidos
3. **Saúde**: Testar URL gerada

---

## ✅ **6. Validação Pós-Deploy**

### **A. Testes Básicos**

1. **Acesso**: URL do Railway carrega?
2. **Autenticação**: Login funciona?
3. **Navegação**: Páginas carregam?
4. **APIs**: Integrações funcionam?

### **B. Testes de Performance**

1. **Velocidade**: < 3s para carregar
2. **Responsividade**: Mobile funciona?
3. **Estabilidade**: Sem crashes?

---

## 🔧 **7. Troubleshooting**

### **Problemas Comuns e Soluções**

#### **Build Failed**
```bash
# Verificar package.json scripts
npm run build:production

# Verificar logs do Railway
# Corrigir erros de dependências
```

#### **Start Failed**
```bash
# Verificar Procfile
web: npm run preview -- --host 0.0.0.0 --port $PORT

# Verificar se dist/ foi gerado
```

#### **Environment Variables**
```bash
# Verificar se todas as variáveis estão configuradas
# VITE_ prefix para variáveis do frontend
# Reiniciar deploy após mudanças
```

#### **404 on Refresh**
```bash
# Configurar SPA fallback no railway.json
# Verificar se index.html está sendo servido
```

---

## 📊 **8. Monitoramento**

### **A. Métricas Railway**

- **CPU Usage**: < 80%
- **Memory**: < 512MB
- **Response Time**: < 1s
- **Uptime**: > 99%

### **B. Logs Importantes**

```bash
# Build logs
> npm run build:production
> vite build

# Start logs
> npm start
> vite preview --host 0.0.0.0 --port $PORT

# Runtime logs
Server running on port $PORT
```

---

## 🔗 **9. URLs e Recursos**

### **A. URLs do Projeto**

- **Railway Dashboard**: https://railway.com/project/d5013814-7bfc-4b59-a913-439252079276
- **App URL**: https://atendeai-production.up.railway.app (após deploy)
- **Logs**: Dashboard → Deployments → View Logs

### **B. Documentação**

- **Railway Docs**: https://docs.railway.com/
- **Deploy Guide**: https://docs.railway.com/quick-start
- **Environment Variables**: https://docs.railway.com/develop/variables

---

## 🎯 **10. Próximos Passos Após Deploy**

### **A. Configuração Adicional**

1. **Domínio Personalizado**: Configurar DNS
2. **SSL**: Automático no Railway
3. **Webhooks**: Configurar para WhatsApp
4. **Analytics**: Implementar monitoramento

### **B. Otimizações Futuras**

1. **CDN**: Para assets estáticos
2. **Cache**: Redis para performance
3. **Monitoring**: Logs e métricas
4. **Backup**: Estratégia de backup

---

## ✅ **CHECKLIST FINAL**

Antes do deploy:

- [ ] Código commitado no GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] Railway conectado ao repositório
- [ ] Build local funcionando
- [ ] Testes locais passando

Após o deploy:

- [ ] URL do Railway acessível
- [ ] Login funcionando
- [ ] Todas as páginas carregando
- [ ] Integrações operacionais
- [ ] Performance adequada

---

**🚀 PRONTO PARA DEPLOY!**
