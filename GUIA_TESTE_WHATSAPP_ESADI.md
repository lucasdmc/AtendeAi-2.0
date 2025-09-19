# 📱 Guia de Teste WhatsApp com Contexto ESADI

## Pré-requisitos

1. **WhatsApp Business API** configurada
2. **Webhook do WhatsApp** apontando para seu servidor
3. **Serviços rodando**: Clinic Service, Conversation Service e WhatsApp Service

## 🚀 Passo a Passo

### 1️⃣ Verificar se a Clínica ESADI Existe

```bash
# Criar script de verificação
cat > check-esadi-clinic.js << 'EOF'
const { Pool } = require('pg');
require('dotenv').config({ path: 'railway.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkESADIClinic() {
    console.log('🔍 Verificando clínica ESADI...\n');
    
    try {
        const result = await pool.query(`
            SELECT id, name, whatsapp_phone, status,
                   context_json IS NOT NULL as has_context_json
            FROM clinics 
            WHERE id = '9981f126-a9b9-4c7d-819a-3380b9ee61de'
        `);

        if (result.rows.length > 0) {
            const clinic = result.rows[0];
            console.log('✅ Clínica ESADI encontrada!');
            console.log(`   - Nome: ${clinic.name}`);
            console.log(`   - WhatsApp: ${clinic.whatsapp_phone}`);
            console.log(`   - Tem contexto JSON: ${clinic.has_context_json ? 'Sim' : 'Não'}`);
        } else {
            console.log('❌ Clínica ESADI não encontrada!');
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkESADIClinic();
EOF

# Executar verificação
node check-esadi-clinic.js
```

### 2️⃣ Criar a Clínica ESADI (se não existir)

```bash
cat > create-esadi-clinic.js << 'EOF'
const { Pool } = require('pg');
require('dotenv').config({ path: 'railway.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createESADIClinic() {
    try {
        await pool.query(`
            INSERT INTO clinics (
                id, name, type, specialty, whatsapp_phone, 
                email, city, state, status
            ) VALUES (
                '9981f126-a9b9-4c7d-819a-3380b9ee61de',
                'ESADI',
                'centro_diagnostico',
                'Gastroenterologia',
                '+5547999633223',
                'contato@esadi.com.br',
                'Blumenau',
                'SC',
                'active'
            ) ON CONFLICT (id) DO NOTHING
        `);
        
        console.log('✅ Clínica ESADI criada/verificada!');
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

createESADIClinic();
EOF

node create-esadi-clinic.js
```

### 3️⃣ Atualizar Contextualização JSON ESADI

```bash
# Navegar para o Clinic Service
cd backend/services/clinic-service

# Executar script de atualização
node scripts/update-esadi-context.js
```

### 4️⃣ Iniciar os Serviços Necessários

```bash
# Terminal 1 - Clinic Service
cd backend/services/clinic-service
npm start

# Terminal 2 - Conversation Service  
cd backend/services/conversation-service
npm start

# Terminal 3 - WhatsApp Service
cd backend/services/whatsapp-service
npm start
```

### 5️⃣ Configurar Variáveis de Ambiente

Certifique-se que as seguintes variáveis estão configuradas:

```env
# WhatsApp Service
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_BUSINESS_ACCOUNT_ID=seu_business_account_id
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_ACCESS_TOKEN=seu_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=seu_verify_token

# URLs dos Serviços
CLINIC_SERVICE_URL=http://localhost:3002
CONVERSATION_SERVICE_URL=http://localhost:3005
```

### 6️⃣ Testar Localmente (Sem WhatsApp Real)

```bash
# Simular mensagem do WhatsApp
curl -X POST http://localhost:3003/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "id": "ENTRY_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "5547999633223",
            "phone_number_id": "PHONE_NUMBER_ID"
          },
          "contacts": [{
            "profile": {
              "name": "Paciente Teste"
            },
            "wa_id": "5511999999999"
          }],
          "messages": [{
            "from": "5511999999999",
            "id": "MESSAGE_ID",
            "timestamp": "1234567890",
            "text": {
              "body": "Olá, quem é você?"
            },
            "type": "text"
          }]
        }
      }]
    }]
  }'
```

### 7️⃣ Configurar Webhook Real do WhatsApp

1. **No Meta Developer Console**:
   - Vá para seu app > WhatsApp > Configuration
   - Configure o Webhook URL: `https://seu-dominio.com/webhook/whatsapp`
   - Token de verificação: mesmo valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Assine os eventos: `messages`, `messaging_postbacks`

2. **No Railway** (se usando):
   ```bash
   # Deploy dos serviços
   railway up
   
   # Verificar logs
   railway logs
   ```

### 8️⃣ Testar Conversação Real

1. **Envie mensagem para o WhatsApp da clínica**: +55 47 99963-3223

2. **Mensagens de teste**:
   - "Olá"
   - "Quem é você?"
   - "Quais são os horários?"
   - "Quero agendar uma consulta"
   - "Quais exames vocês fazem?"

### 🔍 Verificar Logs

```bash
# Conversation Service
tail -f backend/services/conversation-service/logs/app.log

# WhatsApp Service
tail -f backend/services/whatsapp-service/logs/app.log

# Clinic Service
tail -f backend/services/clinic-service/logs/app.log
```

### ✅ Respostas Esperadas

Com a contextualização ESADI funcionando, você deve receber:

1. **Saudação**: "Olá! Sou a Jessica, assistente virtual da ESADI..."
2. **Informações**: Dados específicos da ESADI (horários, exames, etc.)
3. **Personalidade**: Tom profissional mas acessível
4. **Contexto**: Referências à gastroenterologia e especialidades

### 🐛 Troubleshooting

**Problema**: Resposta genérica sem contexto ESADI
- Verificar se a contextualização foi carregada: `GET /api/clinics/{id}/contextualization`
- Verificar logs do ClinicServiceClient

**Problema**: Webhook não recebe mensagens
- Verificar configuração no Meta Developer Console
- Testar com ngrok para desenvolvimento local

**Problema**: Erro de autenticação
- Verificar tokens do WhatsApp
- Verificar CLINIC_SERVICE_TOKEN

### 📊 Monitoramento

```bash
# Status dos serviços
curl http://localhost:3002/health  # Clinic Service
curl http://localhost:3005/health  # Conversation Service
curl http://localhost:3003/health  # WhatsApp Service

# Verificar contextualização
curl http://localhost:3002/api/clinics/9981f126-a9b9-4c7d-819a-3380b9ee61de/contextualization
```