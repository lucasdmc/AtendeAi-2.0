# 🧪 Guia de Testes Locais - AtendeAI 2.0

Este guia te ajuda a testar o sistema completo localmente antes do deploy.

---

## 🚀 **Início Rápido**

### **1. Preparação Inicial**

```bash
# Instalar dependências
npm install

# Criar arquivo de configuração
cp env.railway.example .env

# Dar permissão aos scripts
chmod +x scripts/*.sh
```

### **2. Configurar Variáveis de Ambiente**

Edite o arquivo `.env` com suas configurações:

```bash
# Obrigatórias para funcionamento básico
VITE_SUPABASE_URL=https://kytphnasmdvebmdvvwtx.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui

# Opcionais para teste completo
WHATSAPP_ACCESS_TOKEN=seu_token_whatsapp
GOOGLE_CLIENT_ID=seu_google_client_id
```

### **3. Executar Testes Automatizados**

```bash
# Teste completo do sistema
./scripts/test-local.sh

# Ou executar individualmente
npm run test:run          # Testes básicos
npm run test:coverage     # Com coverage
npm run quality:check     # Verificação completa
```

---

## 🔧 **Opções de Desenvolvimento**

### **Opção 1: Frontend Apenas** (Recomendado para início)

```bash
# Script automatizado
./scripts/start-dev.sh
# Escolha opção 1

# Ou manual
npm run dev -- --port 8080
```

**Acesse**: http://localhost:8080

**O que funciona**:
- ✅ Autenticação Supabase
- ✅ Interface completa
- ✅ Dados mockados para demo
- ✅ Navegação entre telas

### **Opção 2: Sistema Completo** (Para testes avançados)

```bash
# Com microserviços (requer Docker)
./scripts/start-dev.sh
# Escolha opção 2

# Ou manual
docker-compose up -d redis prometheus grafana
npm run dev -- --port 8080
```

**Acesse**: 
- Frontend: http://localhost:8080
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090

---

## 🧪 **Cenários de Teste**

### **1. Teste de Autenticação**

```bash
# Executar teste específico
npm run test:auth

# Teste manual
1. Acesse http://localhost:8080
2. Tente acessar /dashboard (deve redirecionar para /auth)
3. Faça login com credenciais válidas
4. Verifique se foi redirecionado para dashboard
```

### **2. Teste de Permissões**

```bash
# Executar teste de isolamento
npm run test:permissions
npm run test:clinic-isolation

# Teste manual
1. Login como admin_lify
2. Verifique acesso ao combobox de clínicas
3. Login como admin_clinic
4. Verifique que só vê sua clínica
```

### **3. Teste de Integração WhatsApp**

```bash
# Executar teste de integração
npm run test:whatsapp

# Teste manual (requer token WhatsApp)
1. Configure WHATSAPP_ACCESS_TOKEN no .env
2. Acesse /conversations
3. Teste envio de mensagem
4. Teste botões "Assumir/Liberar conversa"
```

### **4. Teste de Google Calendar**

```bash
# Executar teste
npm run test:google-calendar

# Teste manual (requer Google OAuth)
1. Configure GOOGLE_CLIENT_ID no .env
2. Acesse /calendar
3. Clique em "Conectar Google Calendar"
4. Complete o fluxo OAuth
5. Verifique incorporação do calendário
```

---

## 📊 **Verificação de Qualidade**

### **1. Coverage de Testes**

```bash
# Gerar relatório completo
npm run test:coverage

# Visualizar no navegador
open reports/coverage/index.html
```

**Meta**: Coverage ≥ 80% (Quality Profile Pack v1.0)

### **2. Linting e Tipos**

```bash
# Verificar código
npm run lint
npm run type-check

# Corrigir automaticamente
npm run lint:fix
```

### **3. Auditoria de Segurança**

```bash
# Verificar vulnerabilidades
npm audit
npm run security:check

# Corrigir automaticamente
npm audit fix
```

### **4. Performance**

```bash
# Testes de performance
npm run test:performance

# Build de produção
npm run build
npm run preview
```

---

## 🐛 **Troubleshooting**

### **Problemas Comuns**

#### **1. Erro "Supabase client not configured"**
```bash
# Verificar configuração
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Recriar .env se necessário
cp env.railway.example .env
```

#### **2. Porta 8080 já em uso**
```bash
# Encontrar processo usando a porta
lsof -i :8080

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
npm run dev -- --port 3000
```

#### **3. Testes falhando**
```bash
# Limpar cache
npm run test:run -- --no-cache

# Verificar setup
cat src/tests/setup.ts

# Executar teste específico
npm run test:run src/tests/auth.test.ts
```

#### **4. Docker não funcionando**
```bash
# Verificar status
docker --version
docker-compose --version

# Reiniciar Docker
docker-compose down
docker-compose up -d
```

---

## 📋 **Checklist de Testes**

Antes do deploy, verifique:

### **Funcionalidades Básicas**
- [ ] Login/logout funciona
- [ ] Redirecionamento de rotas funciona
- [ ] Dados carregam corretamente
- [ ] Interface responsiva

### **Segurança**
- [ ] Rotas protegidas funcionam
- [ ] Isolamento por clínica funciona
- [ ] Permissões por perfil funcionam
- [ ] Logout limpa sessão

### **Integrações**
- [ ] Supabase conecta corretamente
- [ ] WhatsApp (se configurado)
- [ ] Google Calendar (se configurado)
- [ ] APIs retornam dados válidos

### **Qualidade**
- [ ] Testes passam (≥ 80% coverage)
- [ ] Linting passa
- [ ] Type check passa
- [ ] Build funciona sem erros
- [ ] Security audit limpo

---

## 🎯 **Próximos Passos**

Após os testes locais:

1. **✅ Tudo funcionando?** → Prosseguir com deploy
2. **❌ Problemas encontrados?** → Corrigir e testar novamente
3. **⚠️ Configurações faltando?** → Completar setup das integrações

### **Para Deploy no Railway**
```bash
# Após testes locais bem-sucedidos
git add .
git commit -m "feat: preparar para deploy railway"
git push origin main

# Seguir guia de deploy do Railway
```

---

**💡 Dica**: Execute sempre `./scripts/test-local.sh` antes de fazer deploy. Isso garante que tudo está funcionando perfeitamente!
