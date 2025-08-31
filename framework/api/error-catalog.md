# 🚨 API Error Catalog - AtendeAI 2.0

## Error Response Format (RFC 7807)

Todas as respostas de erro seguem o padrão **RFC 7807 - Problem Details for HTTP APIs**:

```json
{
  "type": "https://api.atendeai.com.br/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "O campo 'email' é obrigatório",
  "instance": "/users",
  "errors": [
    {
      "field": "email",
      "message": "Este campo é obrigatório"
    }
  ]
}
```

## 🔐 Authentication Errors (4xx)

### 401 - Unauthorized

#### AUTH_TOKEN_MISSING
```json
{
  "type": "https://api.atendeai.com.br/errors/auth-token-missing",
  "title": "Token de Autenticação Ausente",
  "status": 401,
  "detail": "Token de acesso é obrigatório para esta operação"
}
```

#### AUTH_TOKEN_INVALID
```json
{
  "type": "https://api.atendeai.com.br/errors/auth-token-invalid",
  "title": "Token de Autenticação Inválido",
  "status": 401,
  "detail": "Token de acesso fornecido é inválido ou malformado"
}
```

#### AUTH_TOKEN_EXPIRED
```json
{
  "type": "https://api.atendeai.com.br/errors/auth-token-expired",
  "title": "Token de Autenticação Expirado",
  "status": 401,
  "detail": "Token de acesso expirou. Use o refresh token para obter um novo",
  "refresh_required": true
}
```

#### AUTH_CREDENTIALS_INVALID
```json
{
  "type": "https://api.atendeai.com.br/errors/auth-credentials-invalid",
  "title": "Credenciais Inválidas",
  "status": 401,
  "detail": "Email ou senha incorretos"
}
```

### 403 - Forbidden

#### PERMISSION_DENIED
```json
{
  "type": "https://api.atendeai.com.br/errors/permission-denied",
  "title": "Permissão Negada",
  "status": 403,
  "detail": "Usuário não possui permissão para esta operação",
  "required_role": "admin_lify"
}
```

#### CLINIC_ACCESS_DENIED
```json
{
  "type": "https://api.atendeai.com.br/errors/clinic-access-denied",
  "title": "Acesso à Clínica Negado",
  "status": 403,
  "detail": "Usuário não possui acesso a esta clínica"
}
```

#### FEATURE_DISABLED
```json
{
  "type": "https://api.atendeai.com.br/errors/feature-disabled",
  "title": "Funcionalidade Desabilitada",
  "status": 403,
  "detail": "Esta funcionalidade está desabilitada para sua clínica"
}
```

## 📝 Validation Errors (422)

### VALIDATION_ERROR
```json
{
  "type": "https://api.atendeai.com.br/errors/validation-error",
  "title": "Erro de Validação",
  "status": 422,
  "detail": "Dados de entrada contêm erros de validação",
  "errors": [
    {
      "field": "email",
      "message": "Formato de email inválido"
    },
    {
      "field": "password",
      "message": "Senha deve ter pelo menos 6 caracteres"
    }
  ]
}
```

### UNIQUE_CONSTRAINT_VIOLATION
```json
{
  "type": "https://api.atendeai.com.br/errors/unique-constraint-violation",
  "title": "Violação de Restrição de Unicidade",
  "status": 422,
  "detail": "O valor fornecido já existe no sistema",
  "field": "whatsapp_number",
  "value": "+5511999999999"
}
```

### FOREIGN_KEY_VIOLATION
```json
{
  "type": "https://api.atendeai.com.br/errors/foreign-key-violation",
  "title": "Referência Inválida",
  "status": 422,
  "detail": "O recurso referenciado não existe",
  "field": "clinic_id",
  "referenced_table": "clinics"
}
```

## 🔍 Resource Errors (404)

### RESOURCE_NOT_FOUND
```json
{
  "type": "https://api.atendeai.com.br/errors/resource-not-found",
  "title": "Recurso Não Encontrado",
  "status": 404,
  "detail": "O recurso solicitado não foi encontrado",
  "resource_type": "clinic",
  "resource_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### ENDPOINT_NOT_FOUND
```json
{
  "type": "https://api.atendeai.com.br/errors/endpoint-not-found",
  "title": "Endpoint Não Encontrado",
  "status": 404,
  "detail": "O endpoint solicitado não existe",
  "path": "/api/v1/invalid-endpoint"
}
```

## ⚡ Rate Limiting (429)

### RATE_LIMIT_EXCEEDED
```json
{
  "type": "https://api.atendeai.com.br/errors/rate-limit-exceeded",
  "title": "Limite de Requisições Excedido",
  "status": 429,
  "detail": "Limite de 1000 requisições por hora excedido",
  "retry_after": 3600,
  "limit": 1000,
  "remaining": 0,
  "reset_time": "2025-01-20T16:00:00Z"
}
```

**Headers de Rate Limiting:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1737388800
Retry-After: 3600
```

## 🛠️ Business Logic Errors (422)

### APPOINTMENT_CONFLICT
```json
{
  "type": "https://api.atendeai.com.br/errors/appointment-conflict",
  "title": "Conflito de Agendamento",
  "status": 422,
  "detail": "Já existe um agendamento neste horário",
  "conflict_datetime": "2025-01-20T14:00:00Z",
  "existing_appointment_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

### CONVERSATION_ALREADY_ASSIGNED
```json
{
  "type": "https://api.atendeai.com.br/errors/conversation-already-assigned",
  "title": "Conversa Já Atribuída",
  "status": 422,
  "detail": "Esta conversa já foi assumida por outro atendente",
  "assigned_user": "João Silva"
}
```

### GOOGLE_CALENDAR_NOT_INTEGRATED
```json
{
  "type": "https://api.atendeai.com.br/errors/google-calendar-not-integrated",
  "title": "Google Calendar Não Integrado",
  "status": 422,
  "detail": "É necessário integrar o Google Calendar antes de criar agendamentos"
}
```

### SIMULATION_MODE_ACTIVE
```json
{
  "type": "https://api.atendeai.com.br/errors/simulation-mode-active",
  "title": "Modo Simulação Ativo",
  "status": 422,
  "detail": "Operação não pode ser executada com modo simulação ativo"
}
```

## 🔄 Integration Errors (502/503)

### WHATSAPP_SERVICE_UNAVAILABLE
```json
{
  "type": "https://api.atendeai.com.br/errors/whatsapp-service-unavailable",
  "title": "Serviço WhatsApp Indisponível",
  "status": 503,
  "detail": "O serviço WhatsApp está temporariamente indisponível",
  "retry_after": 300
}
```

### GOOGLE_API_ERROR
```json
{
  "type": "https://api.atendeai.com.br/errors/google-api-error",
  "title": "Erro na API do Google",
  "status": 502,
  "detail": "Erro ao comunicar com a API do Google Calendar",
  "google_error_code": "quotaExceeded"
}
```

### GOOGLE_OAUTH_EXPIRED
```json
{
  "type": "https://api.atendeai.com.br/errors/google-oauth-expired",
  "title": "Autorização Google Expirada",
  "status": 422,
  "detail": "A autorização do Google Calendar expirou. É necessário reautorizar",
  "reauthorization_required": true
}
```

## 🚫 Server Errors (5xx)

### INTERNAL_SERVER_ERROR
```json
{
  "type": "https://api.atendeai.com.br/errors/internal-server-error",
  "title": "Erro Interno do Servidor",
  "status": 500,
  "detail": "Ocorreu um erro inesperado. Nossa equipe foi notificada",
  "incident_id": "INC-20250120-001"
}
```

### DATABASE_CONNECTION_ERROR
```json
{
  "type": "https://api.atendeai.com.br/errors/database-connection-error",
  "title": "Erro de Conexão com Banco",
  "status": 503,
  "detail": "Erro ao conectar com o banco de dados",
  "retry_after": 60
}
```

## 📊 Resilience Policies

### Timeout Configuration
- **Default Timeout**: 30 segundos
- **Long Operations**: 60 segundos (uploads, exports)
- **External APIs**: 15 segundos (WhatsApp, Google)

### Retry Policies

#### Exponential Backoff
```
Retry 1: 1 segundo
Retry 2: 2 segundos  
Retry 3: 4 segundos
Retry 4: 8 segundos
Max Retries: 3
```

#### Retryable Errors
- `500 Internal Server Error`
- `502 Bad Gateway`
- `503 Service Unavailable`
- `504 Gateway Timeout`
- Network timeouts

#### Non-Retryable Errors
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `422 Validation Error`

### Circuit Breaker
- **Failure Threshold**: 5 falhas consecutivas
- **Timeout**: 60 segundos
- **Half-Open Requests**: 3 tentativas

### Idempotency

#### Idempotent Operations
- `GET` - Safe, sempre idempotente
- `PUT` - Idempotente por design
- `DELETE` - Idempotente (204 se já removido)

#### Idempotency Keys
Para operações `POST` críticas:

```http
POST /appointments
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "customer_info": {...},
  "datetime": "2025-01-20T14:00:00Z"
}
```

**Response Headers:**
```
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Cache-Control: private, max-age=3600
```

## 🔧 Rate Limiting Configuration

### Per User Limits
```
Authentication: 10 req/min
General API: 1000 req/hour
WhatsApp: 100 req/min
File Upload: 10 req/min
```

### Per Clinic Limits
```
Appointments: 500 req/hour
Conversations: 1000 req/hour
Dashboard: 200 req/hour
```

### Global Limits
```
Webhook: 10000 req/min
Health Check: Unlimited
```

## 📈 Monitoring & Alerting

### Error Rate Thresholds
- **Warning**: Error rate > 1%
- **Critical**: Error rate > 5%
- **Emergency**: Error rate > 10%

### Response Time Thresholds
- **Warning**: P95 > 1 segundo
- **Critical**: P95 > 3 segundos
- **Emergency**: P95 > 5 segundos

### Alert Conditions
```yaml
# Prometheus alerts
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 2m
  
- alert: SlowAPI
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 3
  for: 5m
```

## 🧪 Testing Error Scenarios

### Authentication Testing
```bash
# Token inválido
curl -H "Authorization: Bearer invalid_token" /api/clinics

# Token expirado  
curl -H "Authorization: Bearer expired_token" /api/users

# Sem token
curl /api/conversations
```

### Validation Testing
```bash
# Campo obrigatório ausente
curl -X POST /api/users -d '{"name": "Test"}'

# Formato inválido
curl -X POST /api/clinics -d '{"whatsapp_number": "invalid"}'
```

### Rate Limiting Testing
```bash
# Exceder limite
for i in {1..1001}; do
  curl -H "Authorization: Bearer $TOKEN" /api/dashboard/metrics
done
```

---

**Last Updated**: 2025-01-20  
**API Version**: 1.3.0  
**RFC Compliance**: RFC 7807 (Problem Details)