# 🔗 CONFIGURAÇÃO LOVABLE + RAILWAY

## 📋 **INFORMAÇÕES DO BACKEND**

**URL do Backend**: `https://atendeai-20-production.up.railway.app`

## 🔧 **VARIÁVEIS DE AMBIENTE PARA O LOVABLE**

Configure estas variáveis no seu projeto Lovable:

```env
# =====================================================
# CONFIGURAÇÃO SUPABASE
# =====================================================
VITE_SUPABASE_URL=https://kytphnasmdvebmdvvwtx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjI4MTAsImV4cCI6MjA3MTE5ODgxMH0.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA

# =====================================================
# CONFIGURAÇÃO DA API (RAILWAY)
# =====================================================
VITE_API_BASE_URL=https://atendeai-20-production.up.railway.app

# =====================================================
# ENDPOINTS ESPECÍFICOS
# =====================================================
VITE_AUTH_SERVICE_URL=https://atendeai-20-production.up.railway.app/api/auth
VITE_CLINIC_SERVICE_URL=https://atendeai-20-production.up.railway.app/api/clinics
VITE_CONVERSATION_SERVICE_URL=https://atendeai-20-production.up.railway.app/api/conversations
VITE_APPOINTMENT_SERVICE_URL=https://atendeai-20-production.up.railway.app/api/appointments
VITE_WHATSAPP_SERVICE_URL=https://atendeai-20-production.up.railway.app/api/whatsapp
VITE_USER_SERVICE_URL=https://atendeai-20-production.up.railway.app/api/users

# =====================================================
# CONFIGURAÇÕES GOOGLE CALENDAR
# =====================================================
VITE_GOOGLE_CLIENT_ID=367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://atendeai-20-production.up.railway.app/auth/google/callback
```

## 🚨 **CORREÇÃO DO ERRO DE HEADERS**

Se você estiver vendo o erro `TypeError: undefined is not an object (evaluating 'b.global.headers')`, siga estes passos:

### **1. Verificar Variáveis de Ambiente**
Certifique-se de que as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas no Lovable.

### **2. Limpar Cache do Navegador**
- Pressione `Ctrl+Shift+R` (ou `Cmd+Shift+R` no Mac)
- Ou abra as ferramentas de desenvolvedor e clique com botão direito no botão de atualizar

### **3. Verificar Console do Navegador**
Abra as ferramentas de desenvolvedor (F12) e verifique se há mensagens de erro relacionadas ao Supabase.

### **4. Reiniciar o Servidor de Desenvolvimento**
Se estiver rodando localmente, pare e reinicie o servidor:
```bash
npm run dev
```

## 🧪 **ENDPOINTS DISPONÍVEIS**

### **✅ TESTADOS E FUNCIONANDO**

- `GET /health` - Status da API
- `GET /api/clinics` - Listar clínicas
- `POST /api/clinics` - Criar nova clínica
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar novo usuário
- `POST /api/auth/login` - Login de usuário

### **🔧 ENDPOINTS DISPONÍVEIS**

- `GET /api/clinics/:id` - Buscar clínica específica
- `GET /api/users/:id` - Buscar usuário específico
- `POST /api/auth/register` - Registrar usuário
- `POST /api/conversations` - Criar conversa
- `GET /api/conversations` - Listar conversas
- `POST /api/appointments` - Criar agendamento
- `GET /api/appointments` - Listar agendamentos
- `POST /api/whatsapp/webhook` - Webhook do WhatsApp

## 🔒 **CORS CONFIGURADO**

O Railway está configurado para aceitar requisições de qualquer origem:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, x-clinic-id`

## 📊 **EXEMPLO DE USO**

```javascript
// Exemplo de chamada para a API
const response = await fetch('https://atendeai-20-production.up.railway.app/api/clinics', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-clinic-id': 'seu-clinic-id-aqui'
  }
});

const data = await response.json();
console.log(data);
```

## 🎯 **STATUS**

- ✅ **Backend Railway**: Funcionando
- ✅ **Conectividade Supabase**: Funcionando
- ✅ **CORS**: Configurado
- ✅ **Endpoints**: Testados e funcionais
- 🔄 **Frontend Lovable**: Aguardando configuração

---

**Próximo passo**: Configure as variáveis de ambiente no Lovable e teste a conexão!
