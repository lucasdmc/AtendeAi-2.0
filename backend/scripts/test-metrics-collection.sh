#!/bin/bash

# =====================================================
# SCRIPT DE TESTES DE COLETA DE MÉTRICAS - ENTREGÁVEL 1
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
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"
}

# =====================================================
# VERIFICAÇÕES INICIAIS
# =====================================================

log "📊 Iniciando testes de coleta de métricas - AtendeAI 2.0"

# Verificar se Prometheus está rodando
if ! curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    error "Prometheus não está rodando. Execute 'docker-compose up -d' primeiro."
    exit 1
fi

# Verificar se Grafana está rodando
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    warn "Grafana não está respondendo. Pode estar inicializando."
fi

# =====================================================
# TESTES DO PROMETHEUS
# =====================================================

log "🔍 Testando Prometheus..."

# Teste 1: Health Check do Prometheus
log "💚 Testando health check do Prometheus..."
if curl -s http://localhost:9090/-/healthy | grep -q "OK"; then
    log "✅ Prometheus Health: OK"
else
    error "❌ Prometheus Health: FALHOU"
    exit 1
fi

# Teste 2: Status do Prometheus
log "📊 Testando status do Prometheus..."
if curl -s http://localhost:9090/api/v1/status/config | grep -q "yaml"; then
    log "✅ Prometheus Status: OK"
else
    warn "⚠️ Prometheus Status: Configuração não encontrada"
fi

# Teste 3: Targets do Prometheus
log "🎯 Testando targets do Prometheus..."
TARGETS=$(curl -s http://localhost:9090/api/v1/targets)
if echo "$TARGETS" | grep -q "up"; then
    log "✅ Prometheus Targets: OK"
else
    warn "⚠️ Prometheus Targets: Nenhum target ativo encontrado"
fi

# =====================================================
# TESTES DE COLETA DE MÉTRICAS
# =====================================================

log "📈 Testando coleta de métricas..."

# Teste 4: Métricas do sistema
log "🖥️ Testando métricas do sistema..."
METRICS=$(curl -s http://localhost:9090/metrics)
if echo "$METRICS" | grep -q "prometheus_build_info"; then
    log "✅ Métricas do Sistema: OK"
else
    warn "⚠️ Métricas do Sistema: Não encontradas"
fi

# Teste 5: Métricas de HTTP
log "🌐 Testando métricas HTTP..."
if echo "$METRICS" | grep -q "http_requests_total"; then
    log "✅ Métricas HTTP: OK"
else
    warn "⚠️ Métricas HTTP: Não encontradas"
fi

# Teste 6: Métricas de Go
log "🐹 Testando métricas Go..."
if echo "$METRICS" | grep -q "go_goroutines"; then
    log "✅ Métricas Go: OK"
else
    warn "⚠️ Métricas Go: Não encontradas"
fi

# =====================================================
# TESTES DE QUERIES PROMETHEUS
# =====================================================

log "🔍 Testando queries do Prometheus..."

# Teste 7: Query básica
log "❓ Testando query básica..."
QUERY_RESULT=$(curl -s "http://localhost:9090/api/v1/query?query=up")
if echo "$QUERY_RESULT" | grep -q "result"; then
    log "✅ Query Básica: OK"
else
    warn "⚠️ Query Básica: Falhou"
fi

# Teste 8: Query de métricas HTTP
log "📊 Testando query de métricas HTTP..."
HTTP_QUERY=$(curl -s "http://localhost:9090/api/v1/query?query=http_requests_total")
if echo "$HTTP_QUERY" | grep -q "result"; then
    log "✅ Query HTTP: OK"
else
    warn "⚠️ Query HTTP: Falhou"
fi

# =====================================================
# TESTES DO GRAFANA
# =====================================================

log "📊 Testando Grafana..."

# Teste 9: Health Check do Grafana
log "💚 Testando health check do Grafana..."
GRAFANA_HEALTH=$(curl -s http://localhost:3000/api/health)
if echo "$GRAFANA_HEALTH" | grep -q "ok"; then
    log "✅ Grafana Health: OK"
else
    warn "⚠️ Grafana Health: Não saudável"
fi

# Teste 10: Datasources do Grafana
log "🔌 Testando datasources do Grafana..."
DATASOURCES=$(curl -s http://localhost:3000/api/datasources)
if echo "$DATASOURCES" | grep -q "Prometheus"; then
    log "✅ Grafana Datasources: OK"
else
    warn "⚠️ Grafana Datasources: Prometheus não configurado"
fi

# =====================================================
# TESTES DE SERVIÇOS INDIVIDUAIS
# =====================================================

log "🔧 Testando métricas dos serviços..."

# Teste 11: Auth Service Metrics
log "🔐 Testando métricas do Auth Service..."
if curl -s http://localhost:3001/metrics > /dev/null 2>&1; then
    log "✅ Auth Service Metrics: OK"
else
    warn "⚠️ Auth Service Metrics: Não acessível"
fi

# Teste 12: Clinic Service Metrics
log "🏥 Testando métricas do Clinic Service..."
if curl -s http://localhost:3003/metrics > /dev/null 2>&1; then
    log "✅ Clinic Service Metrics: OK"
else
    warn "⚠️ Clinic Service Metrics: Não acessível"
fi

# Teste 13: Health Service Metrics
log "💚 Testando métricas do Health Service..."
if curl -s http://localhost:3004/metrics > /dev/null 2>&1; then
    log "✅ Health Service Metrics: OK"
else
    warn "⚠️ Health Service Metrics: Não acessível"
fi

# =====================================================
# TESTES DE PERFORMANCE
# =====================================================

log "⚡ Testando performance..."

# Teste 14: Tempo de resposta do Prometheus
log "⏱️ Testando tempo de resposta do Prometheus..."
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:9090/-/healthy)
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    log "✅ Tempo de Resposta Prometheus: ${RESPONSE_TIME}s (OK)"
else
    warn "⚠️ Tempo de Resposta Prometheus: ${RESPONSE_TIME}s (Lento)"
fi

# Teste 15: Tempo de resposta do Grafana
log "⏱️ Testando tempo de resposta do Grafana..."
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3000/api/health)
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    log "✅ Tempo de Resposta Grafana: ${RESPONSE_TIME}s (OK)"
else
    warn "⚠️ Tempo de Resposta Grafana: ${RESPONSE_TIME}s (Lento)"
fi

# =====================================================
# TESTES DE ALERTAS
# =====================================================

log "🚨 Testando sistema de alertas..."

# Teste 16: Alertas do Prometheus
log "📢 Testando alertas do Prometheus..."
ALERTS=$(curl -s http://localhost:9090/api/v1/alerts)
if echo "$ALERTS" | grep -q "data"; then
    log "✅ Alertas Prometheus: OK"
else
    warn "⚠️ Alertas Prometheus: Não configurados"
fi

# =====================================================
# RELATÓRIO FINAL
# =====================================================

log "📋 Relatório dos Testes de Métricas:"
log "====================================="

# Contar testes bem-sucedidos
SUCCESS_COUNT=0
TOTAL_TESTS=16

# Verificar cada teste
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:9090/api/v1/status/config > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:9090/api/v1/targets > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:9090/metrics > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi

log "📊 Testes bem-sucedidos: $SUCCESS_COUNT/$TOTAL_TESTS"

if [ "$SUCCESS_COUNT" -eq "$TOTAL_TESTS" ]; then
    log "🎉 Todos os testes de métricas passaram!"
else
    warn "⚠️ Alguns testes falharam. Verifique os logs dos serviços."
fi

log "✅ Testes de métricas concluídos!"
log "💡 Para ver logs do Prometheus: docker-compose logs prometheus"
log "💡 Para ver logs do Grafana: docker-compose logs grafana"
log "💡 Para acessar Prometheus: http://localhost:9090"
log "💡 Para acessar Grafana: http://localhost:3000 (admin/admin123)"
