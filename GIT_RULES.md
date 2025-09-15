# 🔧 REGRAS CRÍTICAS DE COMANDOS GIT - ATENDEAI 2.0

## ⚠️ **REGRA FUNDAMENTAL - NUNCA ESQUECER:**

### ❌ **NUNCA FAZER:**
```bash
# NUNCA usar aspas duplas que travam o terminal
git commit -m "mensagem com aspas que travam"
# Resultado: cmdand dquote> (TERMINAL TRAVADO!)
```

### ✅ **SEMPRE FAZER:**
```bash
# Opção 1: Aspas simples
git commit -m 'mensagem sem problemas'

# Opção 2: Sem aspas (para mensagens simples)
git commit -m mensagem-sem-aspas

# Opção 3: Múltiplas linhas
git commit -m 'mensagem
multilinha
sem problemas'
```

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

### **Terminal travado com `cmdand dquote>`:**
1. **Pressione `Ctrl+C`** para cancelar
2. **Use aspas simples** ou **sem aspas**
3. **Nunca use aspas duplas** em mensagens de commit

### **Exemplos corretos:**
```bash
# ✅ Correto
git add .
git commit -m 'CORRECAO: Problema resolvido'
git push origin main

# ✅ Correto
git add .
git commit -m CORRECAO-Problema-resolvido
git push origin main
```

---

## 📋 **COMANDOS GIT PADRÃO**

### **Deploy Backend (Railway):**
```bash
git add .
git commit -m 'BACKEND: Correcao implementada'
git push origin main
railway up
```

### **Deploy Frontend (Lovable):**
```bash
git add .
git commit -m 'FRONTEND: Correcao implementada'
git push origin main
# Lovable faz deploy automático
```

---

## 📝 **ÚLTIMA ATUALIZAÇÃO**
- **Data**: 15/09/2025
- **Status**: ✅ Regras criadas
- **Problema**: ✅ Terminal travado resolvido
