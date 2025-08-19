# 🔧 CONFIGURAÇÃO MANUAL DO SUPABASE - ATENDEAI 2.0

---

## 🚨 **PROBLEMA IDENTIFICADO**

As credenciais atuais do Supabase não estão funcionando. O host `db.kytphnasmdvebmdvvwtx.supabase.co` não está resolvendo e a conexão está falhando.

---

## 🔍 **DIAGNÓSTICO**

### **Sintomas:**
- ❌ Host `db.kytphnasmdvebmdvvwtx.supabase.co` não resolve
- ❌ Conexão com banco falha
- ❌ Credenciais parecem estar incorretas ou desatualizadas

### **Possíveis Causas:**
1. **Credenciais desatualizadas** - O projeto pode ter sido recriado
2. **Host incorreto** - O formato do host pode ter mudado
3. **IP não liberado** - Seu IP pode não estar na whitelist
4. **Projeto inativo** - O projeto pode ter sido pausado ou deletado

---

## 🛠️ **SOLUÇÃO MANUAL**

### **PASSO 1: Acessar o Dashboard do Supabase**

1. **Acesse**: https://kytphnasmdvebmdvvwtx.supabase.co
2. **Faça login** com suas credenciais
3. **Verifique se o projeto está ativo**

### **PASSO 2: Verificar Configurações do Banco**

1. **No dashboard, vá para**: `Settings` → `Database`
2. **Anote as seguintes informações**:
   - **Host**: (ex: `db.abcdefghijklmnop.supabase.co`)
   - **Database name**: (geralmente `postgres`)
   - **Port**: (geralmente `5432`)
   - **User**: (geralmente `postgres`)
   - **Password**: (sua senha atual)

### **PASSO 3: Verificar Connection String**

1. **Na seção Database, procure por**: `Connection string`
2. **Copie a string completa** que deve parecer com:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```

### **PASSO 4: Testar Conexão**

1. **Abra o terminal**
2. **Teste a conexão** com as novas credenciais:
   ```bash
   psql "postgresql://postgres:SUA_SENHA@NOVO_HOST:5432/postgres" -c "SELECT version();"
   ```

---

## 🔄 **ATUALIZAR CONFIGURAÇÕES**

### **1. Atualizar docker-compose.yml**

Substitua as configurações atuais pelas novas:

```yaml
environment:
  DATABASE_URL: postgresql://postgres:NOVA_SENHA@NOVO_HOST:5432/postgres
  SUPABASE_URL: https://NOVO_PROJECT_ID.supabase.co
  SUPABASE_ANON_KEY: NOVA_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY: NOVA_SERVICE_ROLE_KEY
```

### **2. Atualizar API_KEYS.md**

```bash
# Atualizar com as novas credenciais
SUPABASE_URL=https://NOVO_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=NOVA_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=NOVA_SERVICE_ROLE_KEY
DATABASE_URL=postgresql://postgres:NOVA_SENHA@NOVO_HOST:5432/postgres
```

### **3. Atualizar scripts**

Atualize os scripts com as novas credenciais:
- `scripts/setup-supabase.sh`
- `scripts/setup-supabase-simple.sh`

---

## 🆕 **CRIAR NOVO PROJETO SUPABASE (ALTERNATIVA)**

Se o projeto atual não estiver funcionando, crie um novo:

### **PASSO 1: Criar Novo Projeto**

1. **Acesse**: https://supabase.com
2. **Faça login** e clique em `New Project`
3. **Escolha sua organização**
4. **Digite um nome**: `AtendeAI 2.0`
5. **Digite uma senha forte** para o banco
6. **Escolha uma região** próxima
7. **Clique em `Create new project`**

### **PASSO 2: Aguardar Setup**

1. **Aguarde** o projeto ser criado (pode levar alguns minutos)
2. **Anote as credenciais** fornecidas

### **PASSO 3: Configurar**

1. **Vá para**: `Settings` → `API`
2. **Copie as chaves**:
   - `anon` key
   - `service_role` key
3. **Vá para**: `Settings` → `Database`
4. **Copie a connection string**

---

## 🧪 **TESTE DE CONECTIVIDADE**

### **Teste Básico**

```bash
# Testar se o host resolve
ping -c 3 NOVO_HOST

# Testar conexão com psql
psql "postgresql://postgres:SENHA@HOST:5432/postgres" -c "SELECT version();"

# Testar com variáveis separadas
export PGPASSWORD="SUA_SENHA"
psql -h "HOST" -p 5432 -U postgres -d postgres -c "SELECT version();"
```

### **Teste de Porta**

```bash
# Testar se a porta 5432 está acessível
telnet HOST 5432
# ou
nc -zv HOST 5432
```

---

## 📋 **CHECKLIST DE VERIFICAÇÃO**

- [ ] **Projeto Supabase está ativo**
- [ ] **Credenciais estão corretas**
- [ ] **Host resolve corretamente**
- [ ] **Porta 5432 está acessível**
- [ ] **IP está liberado na whitelist**
- [ ] **Connection string está correta**
- [ ] **Teste de conexão funciona**

---

## 🚀 **PRÓXIMOS PASSOS APÓS CONFIGURAÇÃO**

1. **Execute o script de setup**:
   ```bash
   ./scripts/setup-supabase-simple.sh
   ```

2. **Verifique se as tabelas foram criadas**:
   ```bash
   psql "postgresql://postgres:SENHA@HOST:5432/postgres" -c "
   SELECT schemaname, tablename FROM pg_tables 
   WHERE schemaname IN ('atendeai', 'conversation', 'appointment', 'clinic', 'whatsapp', 'google_calendar')
   ORDER BY schemaname, tablename;"
   ```

3. **Execute a infraestrutura**:
   ```bash
   ./scripts/start-infrastructure.sh
   ```

4. **Execute o frontend**:
   ```bash
   ./scripts/start-frontend.sh
   ```

---

## 🆘 **SUPORTE**

### **Se ainda houver problemas:**

1. **Verifique os logs** do Supabase
2. **Teste com outro cliente** (DBeaver, pgAdmin)
3. **Verifique se há restrições de IP**
4. **Entre em contato** com o suporte do Supabase

### **Recursos Úteis:**

- **Documentação Supabase**: https://supabase.com/docs
- **Supabase Status**: https://status.supabase.com
- **Community**: https://github.com/supabase/supabase/discussions

---

## 📝 **NOTAS IMPORTANTES**

- **Nunca commite credenciais** no repositório
- **Use variáveis de ambiente** para configurações sensíveis
- **Mantenha as credenciais seguras** e não as compartilhe
- **Teste sempre** antes de executar scripts de produção

---

**Status**: ⚠️ REQUER CONFIGURAÇÃO MANUAL  
**Última atualização**: 2024-01-15  
**Próxima ação**: Configurar credenciais corretas do Supabase
