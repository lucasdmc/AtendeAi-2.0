# API Resilience - AtendeAí 2.0

## Estratégias de Resiliência

### 1. Retry Policy
- Máximo 3 tentativas
- Backoff exponencial (1s, 2s, 4s)
- Apenas para erros 5xx

### 2. Circuit Breaker
- Abrir após 5 falhas consecutivas
- Timeout de 30s para fechar
- Fallback para modo offline

### 3. Timeout
- 10s para operações normais
- 30s para uploads/operações pesadas

### 4. Rate Limiting
- 100 requests/min por usuário
- 1000 requests/min por IP

## Monitoramento
- Logs de erro em tempo real
- Métricas de latência
- Alertas para falhas críticas
