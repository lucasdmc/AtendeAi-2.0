# 🚀 REGRAS CRÍTICAS DE DEPLOYMENT - ATENDEAI 2.0

## ⚠️ **REGRA FUNDAMENTAL - NUNCA ESQUECER:**

### **BACKEND = RAILWAY**
- ✅ **Deploy**: `railway up`
- ✅ **Logs**: `railway logs`
- ✅ **URL**: https://atendeai-20-production.up.railway.app
- ✅ **Configuração**: `railway.json`

### **FRONTEND = LOVABLE**
- ✅ **Deploy**: Automático via Git push
- ✅ **Configuração**: `package.json` com script `build:dev`
- ✅ **Dependências**: Todas instaladas e funcionando

---

## 🔧 **COMANDOS GIT - REGRAS CRÍTICAS**

### ❌ **NUNCA FAZER:**
```bash
# NUNCA usar aspas que travam o terminal
git commit -m "mensagem com aspas que travam"
```

### ✅ **SEMPRE FAZER:**
```bash
# Sempre usar aspas simples ou sem aspas
git commit -m 'mensagem sem problemas'
git commit -m mensagem-sem-aspas
```

---

## 📋 **CHECKLIST DE DEPLOYMENT**

### **Backend (Railway):**
- [ ] `railway up` para deploy
- [ ] Verificar logs com `railway logs`
- [ ] Testar endpoints em produção
- [ ] Verificar conexão com Supabase

### **Frontend (Lovable):**
- [ ] Git push para trigger automático
- [ ] Verificar se `build:dev` funciona localmente
- [ ] Testar frontend em produção
- [ ] Verificar se correções estão aplicadas

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

### **Frontend não atualiza:**
- ✅ Verificar se Lovable está configurado
- ✅ Confirmar que `build:dev` funciona
- ✅ Verificar se dependências estão corretas

### **Backend não conecta:**
- ✅ Verificar `railway logs`
- ✅ Confirmar variáveis de ambiente
- ✅ Testar conexão com Supabase

---

## 📝 **ÚLTIMA ATUALIZAÇÃO**
- **Data**: 15/09/2025
- **Status**: ✅ Framework finalizado
- **Deployment**: ✅ Backend Railway + Frontend Lovable
- **Problemas**: ✅ Todos resolvidos
