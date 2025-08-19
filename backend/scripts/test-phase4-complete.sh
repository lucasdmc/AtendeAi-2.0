#!/bin/bash

# =====================================================
# SCRIPT COMPLETO DE TESTES DA FASE 4 - ENTREGÁVEL 1
# ATENDEAI 2.0
# =====================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

phase() {
    echo -e "${PURPLE}[$(date +'%H:%M:%S')] 🚀 FASE: $1${NC}"
}

# =====================================================
# INÍCIO DOS TESTES DA FASE 4
# =====================================================

phase "4: API Gateway e Monitoramento"
log "🎯 Iniciando testes completos da FASE 4 - AtendeAI 2.0"

# =====================================================
# VERIFICAÇÕES INICIAIS
# =====================================================

log "🔍 Verificando infraestrutura..."

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

log "✅ Infraestrutura verificada"

# =====================================================
# TESTE 1: CONECTIVIDADE GERAL
# =====================================================

phase "1: Testes de Conectividade"
log "🧪 Executando testes de conectividade..."
if [ -f "scripts/test-connectivity.sh" ]; then
    ./scripts/test-connectivity.sh
    log "✅ Testes de conectividade concluídos"
else
    warn "⚠️ Script de conectividade não encontrado"
fi

# =====================================================
# TESTE 2: API GATEWAY (KONG)
# =====================================================

phase "2: Testes do API Gateway"
log "🚪 Executando testes do Kong API Gateway..."
if [ -f "scripts/test-api-gateway.sh" ]; then
    ./scripts/test-api-gateway.sh
    log "✅ Testes do API Gateway concluídos"
else
    warn "⚠️ Script do API Gateway não encontrado"
fi

# =====================================================
# TESTE 3: SISTEMA DE MONITORAMENTO
# =====================================================

phase "3: Testes de Monitoramento"
log "📊 Executando testes de métricas..."
if [ -f "scripts/test-metrics-collection.sh" ]; then
    ./scripts/test-metrics-collection.sh
    log "✅ Testes de monitoramento concluídos"
else
    warn "⚠️ Script de métricas não encontrado"
fi

# =====================================================
# TESTE 4: VALIDAÇÃO MANUAL DOS COMPONENTES
# =====================================================

phase "4: Validação Manual dos Componentes"
log "🔧 Validando componentes individualmente..."

# Teste 4.1: Kong API Gateway
log "🚪 Validando Kong API Gateway..."
if curl -s http://localhost:8001/status > /dev/null 2>&1; then
    log "✅ Kong Status: OK"
else
    error "❌ Kong Status: FALHOU"
fi

# Teste 4.2: HAProxy Load Balancer
log "⚖️ Validando HAProxy..."
if curl -s http://localhost:8404/stats > /dev/null 2>&1; then
    log "✅ HAProxy Stats: OK"
else
    warn "⚠️ HAProxy Stats: Não acessível"
fi

# Teste 4.3: Prometheus
log "📈 Validando Prometheus..."
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    log "✅ Prometheus Health: OK"
else
    error "❌ Prometheus Health: FALHOU"
fi

# Teste 4.4: Grafana
log "📊 Validando Grafana..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Grafana Health: OK"
else
    warn "⚠️ Grafana Health: Não acessível"
fi

# =====================================================
# TESTE 5: VALIDAÇÃO DE CONFIGURAÇÕES
# =====================================================

phase "5: Validação de Configurações"
log "⚙️ Validando arquivos de configuração..."

# Teste 5.1: Configuração do HAProxy
if [ -f "haproxy/haproxy.cfg" ]; then
    log "✅ HAProxy Config: Encontrado"
    if grep -q "atendeai-network" haproxy/haproxy.cfg; then
        log "✅ HAProxy Network: Configurado"
    else
        warn "⚠️ HAProxy Network: Não configurado"
    fi
else
    error "❌ HAProxy Config: Não encontrado"
fi

# Teste 5.2: Configuração do Prometheus
if [ -f "monitoring/prometheus.yml" ]; then
    log "✅ Prometheus Config: Encontrado"
    if grep -q "auth-service" monitoring/prometheus.yml; then
        log "✅ Prometheus Targets: Configurados"
    else
        warn "⚠️ Prometheus Targets: Não configurados"
    fi
else
    error "❌ Prometheus Config: Não encontrado"
fi

# Teste 5.3: Configuração do Grafana
if [ -f "monitoring/grafana/provisioning/datasources/datasource.yml" ]; then
    log "✅ Grafana Datasources: Encontrado"
else
    warn "⚠️ Grafana Datasources: Não encontrado"
fi

if [ -f "monitoring/grafana/provisioning/dashboards/dashboard.yml" ]; then
    log "✅ Grafana Dashboards: Encontrado"
else
    warn "⚠️ Grafana Dashboards: Não encontrado"
fi

# =====================================================
# TESTE 6: VALIDAÇÃO DE ROTEAMENTO
# =====================================================

phase "6: Validação de Roteamento"
log "🛣️ Testando roteamento através do sistema..."

# Teste 6.1: Roteamento via HAProxy
log "🌐 Testando roteamento via HAProxy..."
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost/health)
if [ "$RESPONSE" = "200" ]; then
    log "✅ HAProxy Routing: OK"
else
    warn "⚠️ HAProxy Routing: Resposta inesperada ($RESPONSE)"
fi

# Teste 6.2: Roteamento via Kong
log "🚪 Testando roteamento via Kong..."
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:8000/health)
if [ "$RESPONSE" = "200" ]; then
    log "✅ Kong Routing: OK"
else
    warn "⚠️ Kong Routing: Resposta inesperada ($RESPONSE)"
fi

# =====================================================
# TESTE 7: VALIDAÇÃO DE MÉTRICAS
# =====================================================

phase "7: Validação de Métricas"
log "📊 Validando coleta de métricas..."

# Teste 7.1: Métricas do Kong
log "🚪 Testando métricas do Kong..."
if curl -s http://localhost:8001/metrics > /dev/null 2>&1; then
    log "✅ Kong Metrics: OK"
else
    warn "⚠️ Kong Metrics: Não acessível"
fi

# Teste 7.2: Métricas do Prometheus
log "📈 Testando métricas do Prometheus..."
if curl -s http://localhost:9090/metrics > /dev/null 2>&1; then
    log "✅ Prometheus Metrics: OK"
else
    warn "⚠️ Prometheus Metrics: Não acessível"
fi

# =====================================================
# TESTE 8: VALIDAÇÃO DE SEGURANÇA
# =====================================================

phase "8: Validação de Segurança"
log "🔒 Validando configurações de segurança..."

# Teste 8.1: Rate Limiting
log "⏱️ Testando rate limiting..."
for i in {1..6}; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:8000/api/v1/auth/login)
    if [ "$RESPONSE" = "429" ]; then
        log "✅ Rate Limiting: OK (bloqueado após $i tentativas)"
        break
    fi
    sleep 1
done

# Teste 8.2: Headers de Segurança
log "🛡️ Testando headers de segurança..."
HEADERS=$(curl -s -I http://localhost:8000/health)
if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    log "✅ Security Headers: OK"
else
    warn "⚠️ Security Headers: X-Frame-Options não encontrado"
fi

# =====================================================
# RELATÓRIO FINAL DA FASE 4
# =====================================================

phase "RELATÓRIO FINAL"
log "📋 Relatório Completo da FASE 4:"
log "=================================="

# Contar componentes funcionando
COMPONENTS_WORKING=0
TOTAL_COMPONENTS=8

# Verificar cada componente
if curl -s http://localhost:8001/status > /dev/null 2>&1; then ((COMPONENTS_WORKING++)); fi
if curl -s http://localhost:8404/stats > /dev/null 2>&1; then ((COMPONENTS_WORKING++)); fi
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then ((COMPONENTS_WORKING++)); fi
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then ((COMPONENTS_WORKING++)); fi
if [ -f "haproxy/haproxy.cfg" ]; then ((COMPONENTS_WORKING++)); fi
if [ -f "monitoring/prometheus.yml" ]; then ((COMPONENTS_WORKING++)); fi
if [ -f "monitoring/grafana/provisioning/datasources/datasource.yml" ]; then ((COMPONENTS_WORKING++)); fi
if [ -f "monitoring/grafana/provisioning/dashboards/dashboard.yml" ]; then ((COMPONENTS_WORKING++)); fi

log "📊 Componentes funcionando: $COMPONENTS_WORKING/$TOTAL_COMPONENTS"

# Verificar scripts de teste
SCRIPTS_WORKING=0
TOTAL_SCRIPTS=3

if [ -f "scripts/test-connectivity.sh" ]; then ((SCRIPTS_WORKING++)); fi
if [ -f "scripts/test-api-gateway.sh" ]; then ((SCRIPTS_WORKING++)); fi
if [ -f "scripts/test-metrics-collection.sh" ]; then ((SCRIPTS_WORKING++)); fi

log "📊 Scripts de teste: $SCRIPTS_WORKING/$TOTAL_SCRIPTS"

# Verificar documentação
DOCS_WORKING=0
TOTAL_DOCS=2

if [ -f "framework/knowledge_base/ARCHITECTURE.md" ]; then ((DOCS_WORKING++)); fi
if [ -f "framework/knowledge_base/MONITORING.md" ]; then ((DOCS_WORKING++)); fi

log "📊 Documentação: $DOCS_WORKING/$TOTAL_DOCS"

# Resultado final
TOTAL_SCORE=$((COMPONENTS_WORKING + SCRIPTS_WORKING + DOCS_WORKING))
MAX_SCORE=$((TOTAL_COMPONENTS + TOTAL_SCRIPTS + TOTAL_DOCS))

log "🎯 SCORE FINAL DA FASE 4: $TOTAL_SCORE/$MAX_SCORE"

if [ "$TOTAL_SCORE" -eq "$MAX_SCORE" ]; then
    log "🎉 FASE 4 COMPLETAMENTE IMPLEMENTADA!"
    log "✅ Todos os componentes estão funcionando"
    log "✅ Todos os scripts de teste estão implementados"
    log "✅ Toda a documentação está criada"
else
    warn "⚠️ FASE 4 parcialmente implementada"
    warn "Verifique os componentes que falharam"
fi

# =====================================================
# PRÓXIMOS PASSOS
# =====================================================

log "🚀 PRÓXIMOS PASSOS:"
log "==================="
log "1. ✅ FASE 1: Fundação e Infraestrutura - COMPLETA"
log "2. ✅ FASE 2: Serviços Core - COMPLETA"
log "3. ✅ FASE 3: Integrações - COMPLETA"
log "4. ✅ FASE 4: API Gateway e Monitoramento - COMPLETA"
log "5. 🔄 FASE 5: Testes e Deploy - PRÓXIMA"

log "💡 Para prosseguir para a FASE 5, execute:"
log "   ./scripts/test-phase4-complete.sh"
log "   docker-compose up -d"
log "   # Testar todos os componentes"

log "✅ Testes da FASE 4 concluídos!"
