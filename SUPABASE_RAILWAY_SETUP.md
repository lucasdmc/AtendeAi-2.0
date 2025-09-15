# 🔧 CONFIGURAÇÃO SUPABASE PARA RAILWAY

## 📋 **VERIFICAÇÕES NECESSÁRIAS**

### 1️⃣ **VERIFICAR POOLER DO SUPABASE**

**Passos:**
1. Acesse: https://kytphnasmdvebmdvvwtx.supabase.co
2. Faça login na sua conta
3. Vá em **Settings** → **Database** → **Connection Pooling**
4. Verifique se o **Pooler** está **ATIVO**
5. Anote a URL do pooler (deve ser algo como: `aws-1-us-east-2.pooler.supabase.com`)

**Se o pooler estiver inativo:**
- Clique em **Enable Pooler**
- Escolha a região mais próxima (us-east-2)
- Salve as configurações

### 2️⃣ **VERIFICAR RESTRIÇÕES DE IP**

**Passos:**
1. Ainda em **Settings** → **Database**
2. Vá em **Network Restrictions**
3. Verifique se há restrições de IP configuradas

**Para permitir Railway:**
- Adicione `0.0.0.0/0` para permitir todas as conexões
- OU adicione os IPs específicos do Railway (se conhecidos)

### 3️⃣ **VERIFICAR CREDENCIAIS**

**Passos:**
1. Em **Settings** → **Database** → **Connection Info**
2. Verifique se a senha está correta: `lify2025supa`
3. Confirme o usuário: `postgres`
4. Confirme o host: `db.kytphnasmdvebmdvvwtx.supabase.co`

## 🚀 **CONFIGURAÇÕES RAILWAY**

### **Arquivo: `railway.env`**
```bash
# Conexão direta (fallback)
DATABASE_URL=postgresql://postgres:lify2025supa@db.kytphnasmdvebmdvvwtx.supabase.co:5432/postgres

# Session Pooler (recomendado para Railway)
DATABASE_URL_POOLER=postgresql://postgres.kytphnasmdvebmdvvwtx:lify2025supa@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Transaction Pooler (alternativa)
DATABASE_URL_TRANSACTION_POOLER=postgresql://postgres.kytphnasmdvebmdvvwtx:lify2025supa@aws-1-us-east-2.pooler.supabase.com:6543/postgres

# Configurações de conectividade otimizadas para Railway
DATABASE_CONNECTION_TIMEOUT=60000
DATABASE_POOL_SIZE=5
DATABASE_IDLE_TIMEOUT=60000
DATABASE_RETRY_ATTEMPTS=3
```

## 🧪 **TESTE DE CONECTIVIDADE**

**Execute o script de teste:**
```bash
node test-supabase-railway-connection.js
```

**O script irá:**
- ✅ Testar resolução DNS
- ✅ Testar conexão direta
- ✅ Testar conexão via pooler
- ✅ Fornecer recomendações

## 🔍 **DIAGNÓSTICO DE PROBLEMAS**

### **Erro ENETUNREACH**
- **Causa**: Falha na resolução DNS
- **Solução**: Usar pooler do Supabase
- **Fallback**: Configurar DNS 8.8.8.8 no Railway

### **Erro de Autenticação**
- **Causa**: Credenciais incorretas
- **Solução**: Verificar senha no painel Supabase

### **Erro de Conexão Recusada**
- **Causa**: Restrições de IP
- **Solução**: Liberar IPs no Supabase

## 📞 **SUPORTE**

Se os problemas persistirem:
1. Execute o script de teste
2. Copie os logs de erro
3. Verifique as configurações do Supabase
4. Teste com diferentes configurações de conexão

---

**Status**: Aguardando verificação das configurações do Supabase
