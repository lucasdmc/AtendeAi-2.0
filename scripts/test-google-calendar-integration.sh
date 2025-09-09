#!/bin/bash

# =====================================================
# SCRIPT DE TESTE - INTEGRAÇÃO GOOGLE CALENDAR
# =====================================================

echo "🚀 Iniciando teste de integração Google Calendar..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] AVISO: $1${NC}"
}

# Verificar se o servidor está rodando
log "Verificando se o servidor frontend está rodando..."
if curl -s http://localhost:8080 > /dev/null; then
    log "✅ Servidor frontend está rodando na porta 8080"
else
    error "❌ Servidor frontend não está rodando na porta 8080"
    warning "Execute: npm run dev -- --port 8080"
    exit 1
fi

# Verificar se o serviço Google Calendar está rodando
log "Verificando se o serviço Google Calendar está rodando..."
if curl -s http://localhost:3005/health > /dev/null; then
    log "✅ Serviço Google Calendar está rodando na porta 3005"
else
    warning "⚠️ Serviço Google Calendar não está rodando na porta 3005"
    warning "Execute: cd backend/services/google-calendar-service && npm start"
fi

# Verificar variáveis de ambiente
log "Verificando variáveis de ambiente..."

if [ -z "$VITE_GOOGLE_CLIENT_ID" ]; then
    warning "⚠️ VITE_GOOGLE_CLIENT_ID não está definida"
    warning "Configure no arquivo .env ou env.frontend.example"
fi

if [ -z "$VITE_GOOGLE_CLIENT_SECRET" ]; then
    warning "⚠️ VITE_GOOGLE_CLIENT_SECRET não está definida"
    warning "Configure no arquivo .env ou env.frontend.example"
fi

# Testar endpoint de autorização
log "Testando endpoint de autorização..."
AUTH_RESPONSE=$(curl -s "http://localhost:3005/api/v1/calendar/oauth/authorize?clinic_id=test-clinic-id" 2>/dev/null)

if echo "$AUTH_RESPONSE" | grep -q "auth_url"; then
    log "✅ Endpoint de autorização funcionando"
else
    error "❌ Endpoint de autorização com problemas"
    echo "Resposta: $AUTH_RESPONSE"
fi

# Testar conexão com Google Calendar
log "Testando conexão com Google Calendar..."
CONNECTION_RESPONSE=$(curl -s "http://localhost:3005/api/v1/calendar/connection/test" 2>/dev/null)

if echo "$CONNECTION_RESPONSE" | grep -q "connected"; then
    log "✅ Conexão com Google Calendar funcionando"
else
    warning "⚠️ Conexão com Google Calendar com problemas"
    echo "Resposta: $CONNECTION_RESPONSE"
fi

# Verificar se a página Agenda está acessível
log "Testando acesso à página Agenda..."
AGENDA_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/calendar")

if [ "$AGENDA_RESPONSE" = "200" ]; then
    log "✅ Página Agenda acessível"
else
    error "❌ Página Agenda não acessível (HTTP $AGENDA_RESPONSE)"
fi

# Resumo dos testes
echo ""
log "📋 RESUMO DOS TESTES:"
echo "===================="

if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Frontend (porta 8080): OK"
else
    echo "❌ Frontend (porta 8080): FALHOU"
fi

if curl -s http://localhost:3005/health > /dev/null; then
    echo "✅ Google Calendar Service (porta 3005): OK"
else
    echo "❌ Google Calendar Service (porta 3005): FALHOU"
fi

if [ "$AGENDA_RESPONSE" = "200" ]; then
    echo "✅ Página Agenda: OK"
else
    echo "❌ Página Agenda: FALHOU"
fi

echo ""
log "🎯 PRÓXIMOS PASSOS:"
echo "=================="
echo "1. Acesse http://localhost:8080/calendar"
echo "2. Clique em 'Conectar Google Calendar'"
echo "3. Complete o fluxo OAuth"
echo "4. Verifique se o calendário é exibido como iframe"
echo ""
echo "📚 Para mais informações, consulte:"
echo "   - docs/google-oauth-setup.md"
echo "   - env.frontend.example"

log "✅ Teste de integração concluído!"
