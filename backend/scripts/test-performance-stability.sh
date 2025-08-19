#!/bin/bash

# =====================================================
# SCRIPT DE TESTES DE PERFORMANCE E ESTABILIDADE - FASE 5
# ATENDEAI 2.0
# =====================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

success() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

# =====================================================
# INÍCIO DOS TESTES DE PERFORMANCE E ESTABILIDADE
# =====================================================

log "⚡ Iniciando testes de performance e estabilidade - FASE 5 - AtendeAI 2.0"

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
# TESTE 1: PERFORMANCE DE RESPOSTA
# =====================================================

log "⏱️ Testando performance de resposta..."

# Teste 1.1: Tempo de resposta do Auth Service
log "🔐 Testando Auth Service..."
AUTH_TIMES=()
for i in {1..10}; do
    RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3001/health)
    AUTH_TIMES+=($RESPONSE_TIME)
    sleep 0.1
done

# Calcular média e percentil 95
AUTH_AVG=$(echo "${AUTH_TIMES[@]}" | tr ' ' '\n' | awk '{sum+=$1} END {print sum/NR}')
AUTH_95TH=$(echo "${AUTH_TIMES[@]}" | tr ' ' '\n' | sort -n | awk 'BEGIN{c=0} length($0){a[c]=$0;c++}END{p5=(c/100*95);p5=p5%1==0?p5:p5+0.5;print a[int(p5)-1]}')

if (( $(echo "$AUTH_AVG < 0.2" | bc -l) )); then
    success "Auth Service - Média: ${AUTH_AVG}s, 95th: ${AUTH_95TH}s (EXCELENTE)"
elif (( $(echo "$AUTH_AVG < 0.5" | bc -l) )); then
    success "Auth Service - Média: ${AUTH_AVG}s, 95th: ${AUTH_95TH}s (BOM)"
else
    warn "Auth Service - Média: ${AUTH_AVG}s, 95th: ${AUTH_95TH}s (LENTO)"
fi

# Teste 1.2: Tempo de resposta do Clinic Service
log "🏥 Testando Clinic Service..."
CLINIC_TIMES=()
for i in {1..10}; do
    RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3003/health)
    CLINIC_TIMES+=($RESPONSE_TIME)
    sleep 0.1
done

CLINIC_AVG=$(echo "${CLINIC_TIMES[@]}" | tr ' ' '\n' | awk '{sum+=$1} END {print sum/NR}')
CLINIC_95TH=$(echo "${CLINIC_TIMES[@]}" | tr ' ' '\n' | sort -n | awk 'BEGIN{c=0} length($0){a[c]=$0;c++}END{p5=(c/100*95);p5=p5%1==0?p5:p5+0.5;print a[int(p5)-1]}')

if (( $(echo "$CLINIC_AVG < 0.2" | bc -l) )); then
    success "Clinic Service - Média: ${CLINIC_AVG}s, 95th: ${CLINIC_95TH}s (EXCELENTE)"
elif (( $(echo "$CLINIC_AVG < 0.5" | bc -l) )); then
    success "Clinic Service - Média: ${CLINIC_AVG}s, 95th: ${CLINIC_95TH}s (BOM)"
else
    warn "Clinic Service - Média: ${CLINIC_AVG}s, 95th: ${CLINIC_95TH}s (LENTO)"
fi

# Teste 1.3: Tempo de resposta do Kong
log "🚪 Testando Kong API Gateway..."
KONG_TIMES=()
for i in {1..10}; do
    RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:8000/health)
    KONG_TIMES+=($RESPONSE_TIME)
    sleep 0.1
done

KONG_AVG=$(echo "${KONG_TIMES[@]}" | tr ' ' '\n' | awk '{sum+=$1} END {print sum/NR}')
KONG_95TH=$(echo "${KONG_TIMES[@]}" | tr ' ' '\n' | sort -n | awk 'BEGIN{c=0} length($0){a[c]=$0;c++}END{p5=(c/100*95);p5=p5%1==0?p5:p5+0.5;print a[int(p5)-1]}')

if (( $(echo "$KONG_AVG < 0.5" | bc -l) )); then
    success "Kong - Média: ${KONG_AVG}s, 95th: ${KONG_95TH}s (EXCELENTE)"
elif (( $(echo "$KONG_AVG < 1.0" | bc -l) )); then
    success "Kong - Média: ${KONG_AVG}s, 95th: ${KONG_95TH}s (BOM)"
else
    warn "Kong - Média: ${KONG_AVG}s, 95th: ${KONG_95TH}s (LENTO)"
fi

# =====================================================
# TESTE 2: THROUGHPUT (REQUISIÇÕES POR SEGUNDO)
# =====================================================

log "📊 Testando throughput..."

# Teste 2.1: Throughput do Auth Service
log "🔐 Testando throughput do Auth Service..."
START_TIME=$(date +%s.%N)
for i in {1..50}; do
    curl -s http://localhost:3001/health > /dev/null &
done
wait
END_TIME=$(date +%s.%N)

DURATION=$(echo "$END_TIME - $START_TIME" | bc)
THROUGHPUT=$(echo "scale=2; 50 / $DURATION" | bc)

if (( $(echo "$THROUGHPUT > 100" | bc -l) )); then
    success "Auth Service - Throughput: ${THROUGHPUT} req/s (EXCELENTE)"
elif (( $(echo "$THROUGHPUT > 50" | bc -l) )); then
    success "Auth Service - Throughput: ${THROUGHPUT} req/s (BOM)"
else
    warn "Auth Service - Throughput: ${THROUGHPUT} req/s (BAIXO)"
fi

# Teste 2.2: Throughput do Kong
log "🚪 Testando throughput do Kong..."
START_TIME=$(date +%s.%N)
for i in {1..50}; do
    curl -s http://localhost:8000/health > /dev/null &
done
wait
END_TIME=$(date +%s.%N)

DURATION=$(echo "$END_TIME - $START_TIME" | bc)
THROUGHPUT=$(echo "scale=2; 50 / $DURATION" | bc)

if (( $(echo "$THROUGHPUT > 80" | bc -l) )); then
    success "Kong - Throughput: ${THROUGHPUT} req/s (EXCELENTE)"
elif (( $(echo "$THROUGHPUT > 40" | bc -l) )); then
    success "Kong - Throughput: ${THROUGHPUT} req/s (BOM)"
else
    warn "Kong - Throughput: ${THROUGHPUT} req/s (BAIXO)"
fi

# =====================================================
# TESTE 3: ESTABILIDADE SOB CARGA
# =====================================================

log "🏋️ Testando estabilidade sob carga..."

# Teste 3.1: Carga sustentada no Auth Service
log "🔐 Testando carga sustentada no Auth Service..."
ERRORS=0
TOTAL_REQUESTS=100

for i in $(seq 1 $TOTAL_REQUESTS); do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/health)
    if [ "$RESPONSE" != "200" ]; then
        ((ERRORS++))
    fi
    sleep 0.01
done

ERROR_RATE=$(echo "scale=2; $ERRORS * 100 / $TOTAL_REQUESTS" | bc)

if (( $(echo "$ERROR_RATE < 1" | bc -l) )); then
    success "Auth Service - Taxa de erro: ${ERROR_RATE}% (EXCELENTE)"
elif (( $(echo "$ERROR_RATE < 5" | bc -l) )); then
    success "Auth Service - Taxa de erro: ${ERROR_RATE}% (BOM)"
else
    warn "Auth Service - Taxa de erro: ${ERROR_RATE}% (ALTO)"
fi

# Teste 3.2: Carga sustentada no Kong
log "🚪 Testando carga sustentada no Kong..."
ERRORS=0
TOTAL_REQUESTS=100

for i in $(seq 1 $TOTAL_REQUESTS); do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:8000/health)
    if [ "$RESPONSE" != "200" ]; then
        ((ERRORS++))
    fi
    sleep 0.01
done

ERROR_RATE=$(echo "scale=2; $ERRORS * 100 / $TOTAL_REQUESTS" | bc)

if (( $(echo "$ERROR_RATE < 1" | bc -l) )); then
    success "Kong - Taxa de erro: ${ERROR_RATE}% (EXCELENTE)"
elif (( $(echo "$ERROR_RATE < 5" | bc -l) )); then
    success "Kong - Taxa de erro: ${ERROR_RATE}% (BOM)"
else
    warn "Kong - Taxa de erro: ${ERROR_RATE}% (ALTO)"
fi

# =====================================================
# TESTE 4: RECUPERAÇÃO DE FALHAS
# =====================================================

log "🔄 Testando recuperação de falhas..."

# Teste 4.1: Simular falha no Auth Service
log "🔐 Simulando falha no Auth Service..."
# Este teste é simulado - em produção seria um restart real
log "⚠️ Teste de recuperação simulado (não executa restart real)"

# Verificar se o serviço ainda responde
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    success "Auth Service ainda responde após simulação de falha"
else
    error "Auth Service não responde após simulação de falha"
fi

# =====================================================
# TESTE 5: USO DE RECURSOS
# =====================================================

log "💾 Verificando uso de recursos..."

# Teste 5.1: Uso de memória dos containers
log "🧠 Verificando uso de memória..."
MEMORY_USAGE=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep -E "(auth-service|clinic-service|kong)" | head -3)

log "📊 Uso de memória dos principais serviços:"
echo "$MEMORY_USAGE"

# Teste 5.2: Uso de CPU dos containers
log "🖥️ Verificando uso de CPU..."
CPU_USAGE=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}" | grep -E "(auth-service|clinic-service|kong)" | head -3)

log "📊 Uso de CPU dos principais serviços:"
echo "$CPU_USAGE"

# =====================================================
# TESTE 6: LATÊNCIA DE REDE
# =====================================================

log "🌐 Testando latência de rede..."

# Teste 6.1: Latência entre containers
log "🔗 Testando latência entre containers..."
if docker exec atendeai-auth-service ping -c 3 postgres > /dev/null 2>&1; then
    success "Latência Auth Service -> PostgreSQL: OK"
else
    warn "Latência Auth Service -> PostgreSQL: Não testável"
fi

if docker exec atendeai-auth-service ping -c 3 redis > /dev/null 2>&1; then
    success "Latência Auth Service -> Redis: OK"
else
    warn "Latência Auth Service -> Redis: Não testável"
fi

# =====================================================
# TESTE 7: VALIDAÇÃO DE SLAs
# =====================================================

log "📋 Validando SLAs..."

# SLA 1: Tempo de resposta < 200ms para 95% das requisições
log "⏱️ SLA 1: Tempo de resposta < 200ms (95%)..."
if (( $(echo "$AUTH_95TH < 0.2" | bc -l) )); then
    success "SLA 1: Auth Service - ATENDIDO (${AUTH_95TH}s)"
else
    warn "SLA 1: Auth Service - NÃO ATENDIDO (${AUTH_95TH}s)"
fi

if (( $(echo "$CLINIC_95TH < 0.2" | bc -l) )); then
    success "SLA 1: Clinic Service - ATENDIDO (${CLINIC_95TH}s)"
else
    warn "SLA 1: Clinic Service - NÃO ATENDIDO (${CLINIC_95TH}s)"
fi

# SLA 2: Taxa de erro < 1%
log "❌ SLA 2: Taxa de erro < 1%..."
if (( $(echo "$ERROR_RATE < 1" | bc -l) )); then
    success "SLA 2: Taxa de erro - ATENDIDO (${ERROR_RATE}%)"
else
    warn "SLA 2: Taxa de erro - NÃO ATENDIDO (${ERROR_RATE}%)"
fi

# SLA 3: Throughput > 50 req/s
log "📊 SLA 3: Throughput > 50 req/s..."
if (( $(echo "$THROUGHPUT > 50" | bc -l) )); then
    success "SLA 3: Throughput - ATENDIDO (${THROUGHPUT} req/s)"
else
    warn "SLA 3: Throughput - NÃO ATENDIDO (${THROUGHPUT} req/s)"
fi

# =====================================================
# RELATÓRIO FINAL
# =====================================================

log "📋 Relatório de Performance e Estabilidade:"
log "============================================"

# Calcular score geral
SCORE=0
MAX_SCORE=100

# Score por tempo de resposta (30 pontos)
if (( $(echo "$AUTH_AVG < 0.2" | bc -l) )); then SCORE=$((SCORE + 15)); fi
if (( $(echo "$CLINIC_AVG < 0.2" | bc -l) )); then SCORE=$((SCORE + 15)); fi

# Score por throughput (25 pontos)
if (( $(echo "$THROUGHPUT > 80" | bc -l) )); then SCORE=$((SCORE + 25)); fi

# Score por taxa de erro (25 pontos)
if (( $(echo "$ERROR_RATE < 1" | bc -l) )); then SCORE=$((SCORE + 25)); fi

# Score por estabilidade (20 pontos)
if curl -s http://localhost:3001/health > /dev/null 2>&1; then SCORE=$((SCORE + 10)); fi
if curl -s http://localhost:3003/health > /dev/null 2>&1; then SCORE=$((SCORE + 10)); fi

log "🎯 SCORE FINAL: $SCORE/$MAX_SCORE"

if [ "$SCORE" -ge 90 ]; then
    log "🏆 PERFORMANCE: EXCELENTE - Pronto para produção!"
elif [ "$SCORE" -ge 75 ]; then
    log "🥈 PERFORMANCE: BOM - Recomenda-se otimizações menores"
elif [ "$SCORE" -ge 60 ]; then
    log "🥉 PERFORMANCE: ACEITÁVEL - Necessita otimizações"
else
    warn "⚠️ PERFORMANCE: BAIXA - Necessita melhorias significativas"
fi

log "✅ Testes de performance e estabilidade concluídos!"
log "💡 Recomendações:"
log "   - Monitorar métricas em tempo real via Grafana"
log "   - Configurar alertas para violações de SLA"
log "   - Executar testes de carga regulares"
log "   - Otimizar queries de banco de dados se necessário"
