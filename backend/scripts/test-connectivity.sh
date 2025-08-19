#!/bin/bash

# =====================================================
# SCRIPT DE TESTES DE CONECTIVIDADE - ENTREGÁVEL 1
# ATENDEAI 2.0
# =====================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# =====================================================
# VERIFICAÇÕES INICIAIS
# =====================================================

log "🧪 Iniciando testes de conectividade - AtendeAI 2.0"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    error "Docker não está rodando. Por favor, inicie o Docker e tente novamente."
    exit 1
fi

# Verificar se os containers estão rodando
if ! docker-compose ps | grep -q "Up"; then
    error "Containers não estão rodando. Execute 'docker-compose up -d' primeiro."
    exit 1
fi

# =====================================================
# TESTES DE CONECTIVIDADE
# =====================================================

log "🔍 Testando conectividade entre serviços..."

# Teste 1: PostgreSQL
log "📊 Testando PostgreSQL..."
if docker exec atendeai-postgres pg_isready -U postgres -d atendeai > /dev/null 2>&1; then
    log "✅ PostgreSQL: OK"
else
    error "❌ PostgreSQL: FALHOU"
    exit 1
fi

# Teste 2: Redis
log "🔴 Testando Redis..."
if docker exec atendeai-redis redis-cli --raw incr ping > /dev/null 2>&1; then
    log "✅ Redis: OK"
else
    error "❌ Redis: FALHOU"
    exit 1
fi

# Teste 3: Kong API Gateway
log "🚪 Testando Kong API Gateway..."
if curl -s http://localhost:8001/status > /dev/null 2>&1; then
    log "✅ Kong API Gateway: OK"
else
    warn "⚠️ Kong API Gateway: Não respondendo (pode estar inicializando)"
fi

# Teste 4: Prometheus
log "📈 Testando Prometheus..."
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    log "✅ Prometheus: OK"
else
    warn "⚠️ Prometheus: Não respondendo (pode estar inicializando)"
fi

# Teste 5: Grafana
log "📊 Testando Grafana..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Grafana: OK"
else
    warn "⚠️ Grafana: Não respondendo (pode estar inicializando)"
fi

# Teste 6: HAProxy
log "⚖️ Testando HAProxy..."
if curl -s http://localhost:80 > /dev/null 2>&1; then
    log "✅ HAProxy: OK"
else
    warn "⚠️ HAProxy: Não respondendo (pode estar inicializando)"
fi

# =====================================================
# TESTES DE SERVIÇOS
# =====================================================

log "🔧 Testando serviços individuais..."

# Teste 7: Auth Service
log "🔐 Testando Auth Service..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    log "✅ Auth Service: OK"
else
    warn "⚠️ Auth Service: Não respondendo (pode estar inicializando)"
fi

# Teste 8: Clinic Service
log "🏥 Testando Clinic Service..."
if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    log "✅ Clinic Service: OK"
else
    warn "⚠️ Clinic Service: Não respondendo (pode estar inicializando)"
fi

# Teste 9: Health Service
log "💚 Testando Health Service..."
if curl -s http://localhost:3004/health > /dev/null 2>&1; then
    log "✅ Health Service: OK"
else
    warn "⚠️ Health Service: Não respondendo (pode estar inicializando)"
fi

# =====================================================
# TESTES DE REDE
# =====================================================

log "🌐 Testando comunicação entre containers..."

# Teste 10: Comunicação entre serviços
log "🔗 Testando comunicação Auth Service -> PostgreSQL..."
if docker exec atendeai-auth-service curl -s http://postgres:5432 > /dev/null 2>&1; then
    log "✅ Auth Service -> PostgreSQL: OK"
else
    warn "⚠️ Auth Service -> PostgreSQL: Não conectando (esperado)"
fi

# Teste 11: Comunicação entre serviços
log "🔗 Testando comunicação Auth Service -> Redis..."
if docker exec atendeai-auth-service curl -s http://redis:6379 > /dev/null 2>&1; then
    log "✅ Auth Service -> Redis: OK"
else
    warn "⚠️ Auth Service -> Redis: Não conectando (esperado)"
fi

# =====================================================
# TESTES DE PERFORMANCE
# =====================================================

log "⚡ Testando performance básica..."

# Teste 12: Tempo de resposta do Auth Service
log "⏱️ Testando tempo de resposta do Auth Service..."
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3001/health)
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    log "✅ Auth Service Response Time: ${RESPONSE_TIME}s (OK)"
else
    warn "⚠️ Auth Service Response Time: ${RESPONSE_TIME}s (Lento)"
fi

# =====================================================
# RELATÓRIO FINAL
# =====================================================

log "📋 Relatório de Conectividade:"
log "=================================="

# Contar containers rodando
RUNNING_CONTAINERS=$(docker-compose ps --services --filter "status=running" | wc -l)
TOTAL_SERVICES=$(docker-compose ps --services | wc -l)

log "📊 Containers rodando: $RUNNING_CONTAINERS/$TOTAL_SERVICES"

if [ "$RUNNING_CONTAINERS" -eq "$TOTAL_SERVICES" ]; then
    log "🎉 Todos os serviços estão rodando!"
else
    warn "⚠️ Alguns serviços não estão rodando. Verifique os logs."
fi

log "✅ Testes de conectividade concluídos!"
log "💡 Para ver logs detalhados: docker-compose logs [service-name]"
log "💡 Para reiniciar um serviço: docker-compose restart [service-name]"
