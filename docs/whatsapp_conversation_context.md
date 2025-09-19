## Sistema de Conversação WhatsApp + Contextualização JSON

Este documento descreve como o chatbot no WhatsApp identifica a clínica e aplica a contextualização via JSON (ESADI ou outras), incluindo fallbacks e variáveis de ambiente para operação local/produção.

### Visão Geral
- Entrada do WhatsApp: `POST /webhook/whatsapp` no `webhook.js`.
- Identificação de clínica pelo número do WhatsApp (destino): busca por `whatsapp_id_number` ou `whatsapp_number` na tabela `atendeai.clinics` (normalizado apenas dígitos).
- Carregamento de contexto: lê `context_json` ou `contextualization_json` de `atendeai.clinics` e normaliza o formato ESADI para a estrutura esperada pelo motor.
- Geração de resposta: preferencialmente via OpenAI (se `OPENAI_API_KEY` configurada); caso contrário, regras de fallback contextualizadas.
- Envio de resposta: WhatsApp Cloud API; em desenvolvimento, se não houver credenciais, o envio é simulado.

### Arquivos-Chave
- `webhook.js`
  - `identifyClinicByWhatsAppNumber()`: identifica clínica por número (com timeout e normalização de dígitos).
  - `getClinicContext()`: busca contexto no DB com fallback offline (ESADI) e `getDefaultClinicContext`.
  - `normalizeClinicContext()`: mapeia JSON ESADI para a estrutura esperada (nome, ai_personality, working_hours, services, etc.).
  - Removidos textos hardcoded de “Clínica AtendeAI” nos fallbacks.
- `backend/services/conversation-service/src/controllers/conversationController.js`
  - Removeu respostas hardcoded “Jessica/ESADI”. Passa a usar `LLMOrchestrator` para responder.
- `backend/services/conversation-service/src/services/llmOrchestrator.js`
  - Usa `ai_personality.greeting` quando disponível; fallback dinâmico para nome da clínica e assistente.
- `update-esadi-context.cjs`
  - Atualiza `atendeai.clinics.contextualization_json` para a clínica ESADI.

### Variáveis de Ambiente
- `DATABASE_URL`: conexão Postgres (produção Railway/Supabase).
- `OPENAI_API_KEY`: se ausente, usa regras de fallback.
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: credenciais da Cloud API (ausentes => envio simulado).
- `DEFAULT_CLINIC_ID`: ID da clínica usada como fallback quando o número de destino não mapeia uma clínica ativa (ex.: ESADI).

### Teste Local Rápido
1) Instale dependências e inicie o servidor integrado:
```bash
npm install --legacy-peer-deps
export DEFAULT_CLINIC_ID=9981f126-a9b9-4c7d-819a-3380b9ee61de
node webhook.js
```
2) Health check:
```bash
curl -s http://localhost:8080/health
```
3) Simule uma mensagem do WhatsApp (fallback por DEFAULT_CLINIC_ID):
```bash
curl -s -X POST http://localhost:8080/webhook/whatsapp \
  -H 'Content-Type: application/json' \
  -d '{"object":"whatsapp_business_account","entry":[{"id":"1","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"554700000000","phone_number_id":"1"},"messages":[{"from":"5547999999999","id":"wamid.1","timestamp":"1640995200","text":{"body":"Oi"},"type":"text"}]},"field":"messages"}]}]}'
```

Se o banco estiver indisponível, o loader de contexto tenta um fallback offline básico para a clínica `DEFAULT_CLINIC_ID` (ESADI) e responde usando as regras contextuais.

### Formato JSON esperado (pós-normalização)
Exemplo de estrutura utilizada pelo motor após `normalizeClinicContext`:
```json
{
  "name": "ESADI",
  "clinic_info": {
    "name": "ESADI",
    "description": "Centro especializado em saúde do aparelho digestivo...",
    "specialty": "Gastroenterologia",
    "mission": "Proporcionar diagnósticos precisos...",
    "values": ["Excelência", "Tecnologia", "Atendimento humanizado"]
  },
  "ai_personality": {
    "name": "Jessica",
    "greeting": "Olá! Sou a Jessica, assistente virtual da ESADI...",
    "farewell": "Obrigado por escolher a ESADI...",
    "tone": "Formal mas acessível",
    "personality": "Profissional e acolhedora"
  },
  "working_hours": {"segunda": {"abertura": "07:00", "fechamento": "18:00"}},
  "services": [{"name": "Consulta Gastroenterológica", "category": "Consulta", "price": 280}]
}
```

### Extração do Módulo de Conversação + Contexto
- O núcleo já está isolado em funções puras dentro de `webhook.js` (`getClinicContext`, `normalizeClinicContext`, `generateContextualizedResponse`).
- Para extrair:
  - Mover essas funções para um pacote Node (ex.: `modules/conversation-context/`) exportando-as via `index.js`.
  - Adaptar imports no `webhook.js` e no `conversation-service` para usar o pacote.
  - Publicar como pacote privado (npm, Git) ou manter como submódulo.

### Observações
- Todas as menções fixas à “Clínica AtendeAI” nas respostas foram removidas.
- Queries compatíveis com `whatsapp_id_number` e `whatsapp_number`.
- Timeouts em consultas DB para evitar bloqueios em desenvolvimento.
