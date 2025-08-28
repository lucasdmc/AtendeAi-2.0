#!/bin/bash

# =====================================================
# SCRIPT DE DESENVOLVIMENTO LOCAL - ATENDEAI 2.0
# =====================================================

set -e

echo "🔧 Iniciando ambiente de desenvolvimento local..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto"
    exit 1
fi

# Verificar dependências
log_info "Verificando dependências..."
if [ ! -d "node_modules" ]; then
    log_warning "Instalando dependências..."
    npm install
fi

# Verificar .env
if [ ! -f ".env" ]; then
    log_warning "Criando arquivo .env..."
    cp env.railway.example .env
    log_warning "Configure as variáveis em .env"
fi

# Função para verificar se porta está em uso
check_port() {
    if lsof -i :$1 >/dev/null 2>&1; then
        return 0  # Porta em uso
    else
        return 1  # Porta livre
    fi
}

# Verificar portas necessárias
log_info "Verificando portas disponíveis..."

FRONTEND_PORT=8080
if check_port $FRONTEND_PORT; then
    log_warning "Porta $FRONTEND_PORT já está em uso"
    read -p "Deseja matar o processo? (y/n): " kill_process
    if [ "$kill_process" = "y" ]; then
        lsof -ti :$FRONTEND_PORT | xargs kill -9
        log_success "Processo na porta $FRONTEND_PORT finalizado"
    fi
fi

# Mostrar status dos serviços
echo ""
log_info "Status dos microserviços:"
echo "  Frontend (React):     http://localhost:$FRONTEND_PORT"
echo "  Auth Service:         http://localhost:3001"
echo "  User Service:         http://localhost:3002" 
echo "  Clinic Service:       http://localhost:3003"
echo "  Health Service:       http://localhost:3004"
echo "  Conversation Service: http://localhost:3005"
echo "  Appointment Service:  http://localhost:3006"
echo "  WhatsApp Service:     http://localhost:3007"
echo "  Google Calendar:      http://localhost:3008"
echo ""

# Opções de inicialização
echo "Opções de inicialização:"
echo "  1. Apenas Frontend (desenvolvimento frontend)"
echo "  2. Frontend + Microserviços (sistema completo)"
echo "  3. Apenas testes (executar bateria de testes)"
echo ""

read -p "Escolha uma opção (1-3): " option

case $option in
    1)
        log_info "Iniciando apenas o frontend..."
        log_warning "Certifique-se de que o Supabase está configurado em .env"
        npm run dev -- --port $FRONTEND_PORT
        ;;
    2)
        log_info "Iniciando sistema completo..."
        log_warning "Iniciando microserviços em segundo plano..."
        
        # Verificar Docker
        if ! command -v docker &> /dev/null; then
            log_warning "Docker não encontrado. Apenas frontend será iniciado."
            npm run dev -- --port $FRONTEND_PORT
        else
            # Iniciar microserviços com Docker
            log_info "Iniciando infraestrutura com Docker..."
            docker-compose up -d redis prometheus grafana
            
            # Dar tempo para inicializar
            sleep 5
            
            # Iniciar frontend
            log_success "Infraestrutura iniciada. Iniciando frontend..."
            npm run dev -- --port $FRONTEND_PORT
        fi
        ;;
    3)
        log_info "Executando bateria de testes..."
        ./scripts/test-local.sh
        ;;
    *)
        log_warning "Opção inválida. Iniciando apenas frontend..."
        npm run dev -- --port $FRONTEND_PORT
        ;;
esac
