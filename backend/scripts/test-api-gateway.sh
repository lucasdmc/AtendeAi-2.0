#!/bin/bash

# =====================================================
# SCRIPT DE TESTES DO API GATEWAY - ENTREGÁVEL 1
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

log "🚪 Iniciando testes do API Gateway - AtendeAI 2.0"

# Verificar se Kong está rodando
if ! curl -s http://localhost:8001/status > /dev/null 2>&1; then
    error "Kong não está rodando. Execute 'docker-compose up -d' primeiro."
    exit 1
fi

# Verificar se HAProxy está rodando
if ! curl -s http://localhost:8404/stats > /dev/null 2>&1; then
    warn "HAProxy não está respondendo na porta 8404"
fi

# =====================================================
# TESTES DO KONG API GATEWAY
# =====================================================

log "🔍 Testando Kong API Gateway..."

# Teste 1: Status do Kong
log "📊 Testando status do Kong..."
if curl -s http://localhost:8001/status | grep -q "database"; then
    log "✅ Kong Status: OK"
else
    error "❌ Kong Status: FALHOU"
    exit 1
fi

# Teste 2: Admin API
log "⚙️ Testando Kong Admin API..."
if curl -s http://localhost:8001/services | grep -q "auth-service"; then
    log "✅ Kong Admin API: OK"
else
    warn "⚠️ Kong Admin API: Serviços não configurados"
fi

# Teste 3: Admin GUI
log "🖥️ Testando Kong Admin GUI..."
if curl -s http://localhost:8002/ | grep -q "Kong"; then
    log "✅ Kong Admin GUI: OK"
else
    warn "⚠️ Kong Admin GUI: Não respondendo"
fi

# =====================================================
# TESTES DE ROTEAMENTO
# =====================================================

log "🛣️ Testando roteamento através do Kong..."

# Teste 4: Roteamento para Auth Service
log "🔐 Testando roteamento Auth Service..."
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:8000/api/v1/auth/login)
if [ "$RESPONSE" = "405" ] || [ "$RESPONSE" = "400" ]; then
    log "✅ Roteamento Auth Service: OK (Method Not Allowed é esperado para GET)"
else
    warn "⚠️ Roteamento Auth Service: Resposta inesperada ($RESPONSE)"
fi

# Teste 5: Roteamento para Clinic Service
log "🏥 Testando roteamento Clinic Service..."
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:8000/api/v1/clinics)
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "403" ]; then
    log "✅ Roteamento Clinic Service: OK (Unauthorized é esperado sem token)"
else
    warn "⚠️ Roteamento Clinic Service: Resposta inesperada ($RESPONSE)"
fi

# Teste 6: Roteamento para Health Service
log "💚 Testando roteamento Health Service..."
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:8000/health)
if [ "$RESPONSE" = "200" ]; then
    log "✅ Roteamento Health Service: OK"
else
    warn "⚠️ Roteamento Health Service: Resposta inesperada ($RESPONSE)"
fi

# =====================================================
# TESTES DE RATE LIMITING
# =====================================================

log "⏱️ Testando Rate Limiting..."

# Teste 7: Rate Limiting no Auth Service
log "🚫 Testando Rate Limiting Auth Service..."
for i in {1..6}; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:8000/api/v1/auth/login)
    if [ "$RESPONSE" = "429" ]; then
        log "✅ Rate Limiting Auth Service: OK (bloqueado após $i tentativas)"
        break
    fi
    sleep 1
done

# Teste 8: Rate Limiting no Clinic Service
log "🚫 Testando Rate Limiting Clinic Service..."
for i in {1..21}; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:8000/api/v1/clinics)
    if [ "$RESPONSE" = "429" ]; then
        log "✅ Rate Limiting Clinic Service: OK (bloqueado após $i tentativas)"
        break
    fi
    sleep 1
done

# =====================================================
# TESTES DE CORS
# =====================================================

log "🌐 Testando configurações CORS..."

# Teste 9: CORS Preflight
log "🔄 Testando CORS Preflight..."
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://localhost:8000/api/v1/auth/login)

if [ "$RESPONSE" = "200" ]; then
    log "✅ CORS Preflight: OK"
else
    warn "⚠️ CORS Preflight: Resposta inesperada ($RESPONSE)"
fi

# =====================================================
# TESTES DE HEADERS DE SEGURANÇA
# =====================================================

log "🔒 Testando headers de segurança..."

# Teste 10: Headers de Segurança
log "🛡️ Testando headers de segurança..."
HEADERS=$(curl -s -I http://localhost:8000/health)
if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    log "✅ Headers de Segurança: OK"
else
    warn "⚠️ Headers de Segurança: X-Frame-Options não encontrado"
fi

# =====================================================
# TESTES DE COMPRESSÃO
# =====================================================

log "🗜️ Testando compressão..."

# Teste 11: Compressão GZIP
log "📦 Testando compressão GZIP..."
RESPONSE=$(curl -s -H "Accept-Encoding: gzip" -I http://localhost:8000/health)
if echo "$RESPONSE" | grep -q "Content-Encoding: gzip"; then
    log "✅ Compressão GZIP: OK"
else
    warn "⚠️ Compressão GZIP: Não habilitada"
fi

# =====================================================
# TESTES DE HEALTH CHECKS
# =====================================================

log "💚 Testando health checks..."

# Teste 12: Health Check Kong
log "🏥 Testando health check Kong..."
if curl -s http://localhost:8001/status | grep -q "healthy"; then
    log "✅ Health Check Kong: OK"
else
    warn "⚠️ Health Check Kong: Status não saudável"
fi

# =====================================================
# TESTES DE PERFORMANCE
# =====================================================

log "⚡ Testando performance..."

# Teste 13: Tempo de resposta do Kong
log "⏱️ Testando tempo de resposta do Kong..."
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:8000/health)
if (( $(echo "$RESPONSE_TIME < 0.5" | bc -l) )); then
    log "✅ Tempo de Resposta Kong: ${RESPONSE_TIME}s (OK)"
else
    warn "⚠️ Tempo de Resposta Kong: ${RESPONSE_TIME}s (Lento)"
fi

# =====================================================
# RELATÓRIO FINAL
# =====================================================

log "📋 Relatório dos Testes do API Gateway:"
log "=========================================="

# Contar testes bem-sucedidos
SUCCESS_COUNT=0
TOTAL_TESTS=13

# Verificar cada teste
if curl -s http://localhost:8001/status > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:8001/services > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:8002/ > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:8000/api/v1/auth/login > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:8000/api/v1/clinics > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:8000/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi

log "📊 Testes bem-sucedidos: $SUCCESS_COUNT/$TOTAL_TESTS"

if [ "$SUCCESS_COUNT" -eq "$TOTAL_TESTS" ]; then
    log "🎉 Todos os testes do API Gateway passaram!"
else
    warn "⚠️ Alguns testes falharam. Verifique os logs do Kong."
fi

log "✅ Testes do API Gateway concluídos!"
log "💡 Para ver logs do Kong: docker-compose logs kong"
log "💡 Para acessar Admin GUI: http://localhost:8002"
log "💡 Para acessar Admin API: http://localhost:8001"
