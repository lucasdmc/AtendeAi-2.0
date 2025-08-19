#!/bin/bash

# =====================================================
# SCRIPT DE TESTES END-TO-END - ENTREGÁVEL 1
# ATENDEAI 2.0 - FASE 5
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
# INÍCIO DOS TESTES END-TO-END
# =====================================================

log "🧪 Iniciando testes end-to-end - FASE 5 - AtendeAI 2.0"

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
# TESTE 1: FLUXO DE AUTENTICAÇÃO COMPLETO
# =====================================================

log "🔐 Testando fluxo de autenticação completo..."

# Teste 1.1: Health check do Auth Service
log "💚 Verificando saúde do Auth Service..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    success "Auth Service está saudável"
else
    error "Auth Service não está respondendo"
    exit 1
fi

# Teste 1.2: Endpoint de login (sem credenciais)
log "🔑 Testando endpoint de login..."
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3001/api/v1/auth/login)

if [ "$LOGIN_RESPONSE" = "400" ]; then
    success "Login endpoint responde corretamente (400 - Bad Request)"
else
    warn "Login endpoint respondeu com código inesperado: $LOGIN_RESPONSE"
fi

# Teste 1.3: Endpoint de login (credenciais inválidas)
log "🚫 Testando login com credenciais inválidas..."
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}' \
  http://localhost:3001/api/v1/auth/login)

if [ "$LOGIN_RESPONSE" = "401" ]; then
    success "Login com credenciais inválidas retorna 401"
else
    warn "Login com credenciais inválidas retornou: $LOGIN_RESPONSE"
fi

# =====================================================
# TESTE 2: FLUXO DE GESTÃO DE CLÍNICAS
# =====================================================

log "🏥 Testando fluxo de gestão de clínicas..."

# Teste 2.1: Health check do Clinic Service
log "💚 Verificando saúde do Clinic Service..."
if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    success "Clinic Service está saudável"
else
    error "Clinic Service não está respondendo"
    exit 1
fi

# Teste 2.2: Endpoint de clínicas (sem autenticação)
log "🏥 Testando endpoint de clínicas..."
CLINICS_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
  http://localhost:3003/api/v1/clinics)

if [ "$CLINICS_RESPONSE" = "401" ] || [ "$CLINICS_RESPONSE" = "403" ]; then
    success "Endpoint de clínicas protege acesso (401/403)"
else
    warn "Endpoint de clínicas retornou: $CLINICS_RESPONSE"
fi

# =====================================================
# TESTE 3: FLUXO DE GESTÃO DE USUÁRIOS
# =====================================================

log "👥 Testando fluxo de gestão de usuários..."

# Teste 3.1: Health check do User Service
log "💚 Verificando saúde do User Service..."
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    success "User Service está saudável"
else
    error "User Service não está respondendo"
    exit 1
fi

# Teste 3.2: Endpoint de usuários (sem autenticação)
log "👥 Testando endpoint de usuários..."
USERS_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
  http://localhost:3002/api/v1/users)

if [ "$USERS_RESPONSE" = "401" ] || [ "$USERS_RESPONSE" = "403" ]; then
    success "Endpoint de usuários protege acesso (401/403)"
else
    warn "Endpoint de usuários retornou: $USERS_RESPONSE"
fi

# =====================================================
# TESTE 4: FLUXO DE CONVERSAS
# =====================================================

log "💬 Testando fluxo de conversas..."

# Teste 4.1: Health check do Conversation Service
log "💚 Verificando saúde do Conversation Service..."
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    success "Conversation Service está saudável"
else
    warn "Conversation Service não está respondendo"
fi

# Teste 4.2: Endpoint de conversas (sem autenticação)
log "💬 Testando endpoint de conversas..."
CONVERSATIONS_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
  http://localhost:3005/api/v1/conversations)

if [ "$CONVERSATIONS_RESPONSE" = "401" ] || [ "$CONVERSATIONS_RESPONSE" = "403" ]; then
    success "Endpoint de conversas protege acesso (401/403)"
else
    warn "Endpoint de conversas retornou: $CONVERSATIONS_RESPONSE"
fi

# =====================================================
# TESTE 5: FLUXO DE AGENDAMENTOS
# =====================================================

log "📅 Testando fluxo de agendamentos..."

# Teste 5.1: Health check do Appointment Service
log "💚 Verificando saúde do Appointment Service..."
if curl -s http://localhost:3006/health > /dev/null 2>&1; then
    success "Appointment Service está saudável"
else
    warn "Appointment Service não está respondendo"
fi

# Teste 5.2: Endpoint de agendamentos (sem autenticação)
log "📅 Testando endpoint de agendamentos..."
APPOINTMENTS_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
  http://localhost:3006/api/v1/appointments)

if [ "$APPOINTMENTS_RESPONSE" = "401" ] || [ "$APPOINTMENTS_RESPONSE" = "403" ]; then
    success "Endpoint de agendamentos protege acesso (401/403)"
else
    warn "Endpoint de agendamentos retornou: $APPOINTMENTS_RESPONSE"
fi

# =====================================================
# TESTE 6: FLUXO DE WHATSAPP
# =====================================================

log "📱 Testando fluxo de WhatsApp..."

# Teste 6.1: Health check do WhatsApp Service
log "💚 Verificando saúde do WhatsApp Service..."
if curl -s http://localhost:3007/health > /dev/null 2>&1; then
    success "WhatsApp Service está saudável"
else
    warn "WhatsApp Service não está respondendo"
fi

# Teste 6.2: Webhook de WhatsApp (sem assinatura)
log "📱 Testando webhook de WhatsApp..."
WHATSAPP_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
  http://localhost:3007/webhook/whatsapp)

if [ "$WHATSAPP_RESPONSE" = "400" ] || [ "$WHATSAPP_RESPONSE" = "401" ]; then
    success "Webhook de WhatsApp valida assinatura (400/401)"
else
    warn "Webhook de WhatsApp retornou: $WHATSAPP_RESPONSE"
fi

# =====================================================
# TESTE 7: FLUXO DE GOOGLE CALENDAR
# =====================================================

log "📅 Testando fluxo de Google Calendar..."

# Teste 7.1: Health check do Google Calendar Service
log "💚 Verificando saúde do Google Calendar Service..."
if curl -s http://localhost:3008/health > /dev/null 2>&1; then
    success "Google Calendar Service está saudável"
else
    warn "Google Calendar Service não está respondendo"
fi

# Teste 7.2: Endpoint de calendário (sem autenticação)
log "📅 Testando endpoint de calendário..."
CALENDAR_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
  http://localhost:3008/api/v1/calendar)

if [ "$CALENDAR_RESPONSE" = "401" ] || [ "$CALENDAR_RESPONSE" = "403" ]; then
    success "Endpoint de calendário protege acesso (401/403)"
else
    warn "Endpoint de calendário retornou: $CALENDAR_RESPONSE"
fi

# =====================================================
# TESTE 8: FLUXO ATRAVÉS DO API GATEWAY
# =====================================================

log "🚪 Testando fluxo através do API Gateway..."

# Teste 8.1: Roteamento via Kong
log "🛣️ Testando roteamento via Kong..."
KONG_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
  http://localhost:8000/health)

if [ "$KONG_RESPONSE" = "200" ]; then
    success "Kong roteia corretamente para health service"
else
    warn "Kong retornou: $KONG_RESPONSE"
fi

# Teste 8.2: Roteamento via HAProxy
log "⚖️ Testando roteamento via HAProxy..."
HAPROXY_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
  http://localhost/health)

if [ "$HAPROXY_RESPONSE" = "200" ]; then
    success "HAProxy roteia corretamente"
else
    warn "HAProxy retornou: $HAPROXY_RESPONSE"
fi

# =====================================================
# TESTE 9: FLUXO DE MONITORAMENTO
# =====================================================

log "📊 Testando fluxo de monitoramento..."

# Teste 9.1: Prometheus
log "📈 Verificando Prometheus..."
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    success "Prometheus está funcionando"
else
    error "Prometheus não está funcionando"
fi

# Teste 9.2: Grafana
log "📊 Verificando Grafana..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    success "Grafana está funcionando"
else
    warn "Grafana não está funcionando"
fi

# =====================================================
# TESTE 10: VALIDAÇÃO DE PERFORMANCE
# =====================================================

log "⚡ Testando performance..."

# Teste 10.1: Tempo de resposta do Auth Service
log "⏱️ Testando tempo de resposta do Auth Service..."
AUTH_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3001/health)
if (( $(echo "$AUTH_TIME < 0.5" | bc -l) )); then
    success "Auth Service: ${AUTH_TIME}s (OK)"
else
    warn "Auth Service: ${AUTH_TIME}s (Lento)"
fi

# Teste 10.2: Tempo de resposta do Clinic Service
log "⏱️ Testando tempo de resposta do Clinic Service..."
CLINIC_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3003/health)
if (( $(echo "$CLINIC_TIME < 0.5" | bc -l) )); then
    success "Clinic Service: ${CLINIC_TIME}s (OK)"
else
    warn "Clinic Service: ${CLINIC_TIME}s (Lento)"
fi

# Teste 10.3: Tempo de resposta do Kong
log "⏱️ Testando tempo de resposta do Kong..."
KONG_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:8000/health)
if (( $(echo "$KONG_TIME < 1.0" | bc -l) )); then
    success "Kong: ${KONG_TIME}s (OK)"
else
    warn "Kong: ${KONG_TIME}s (Lento)"
fi

# =====================================================
# RELATÓRIO FINAL
# =====================================================

log "📋 Relatório dos Testes End-to-End:"
log "===================================="

# Contar testes bem-sucedidos
SUCCESS_COUNT=0
TOTAL_TESTS=25

# Verificar cada teste
if curl -s http://localhost:3001/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:3002/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:3003/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:3005/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:3006/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:3007/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:3008/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:8000/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then ((SUCCESS_COUNT++)); fi

log "📊 Testes bem-sucedidos: $SUCCESS_COUNT/$TOTAL_TESTS"

if [ "$SUCCESS_COUNT" -eq "$TOTAL_TESTS" ]; then
    log "🎉 Todos os testes end-to-end passaram!"
else
    warn "⚠️ Alguns testes falharam. Verifique os logs dos serviços."
fi

log "✅ Testes end-to-end concluídos!"
log "💡 Para ver logs detalhados: docker-compose logs [service-name]"
log "💡 Para reiniciar um serviço: docker-compose restart [service-name]"
