#!/bin/bash

# =====================================================
# SCRIPT DE TESTE LOCAL - ATENDEAI 2.0
# =====================================================

set -e  # Parar em caso de erro

echo "🚀 Iniciando testes locais do AtendeAI 2.0..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs coloridos
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Execute este script na raiz do projeto AtendeAI 2.0"
    exit 1
fi

# 1. Verificar dependências instaladas
log_info "Verificando dependências..."
if [ ! -d "node_modules" ]; then
    log_warning "node_modules não encontrado. Instalando dependências..."
    npm install
fi
log_success "Dependências verificadas"

# 2. Verificar arquivo de configuração
log_info "Verificando configurações..."
if [ ! -f ".env" ]; then
    log_warning "Arquivo .env não encontrado. Criando com base no exemplo..."
    if [ -f "env.railway.example" ]; then
        cp env.railway.example .env
        log_warning "Por favor, configure as variáveis em .env antes de continuar"
        log_info "Principais variáveis a configurar:"
        echo "  - VITE_SUPABASE_URL"
        echo "  - VITE_SUPABASE_ANON_KEY"
        echo "  - WHATSAPP_ACCESS_TOKEN (opcional para teste)"
        echo "  - GOOGLE_CLIENT_ID (opcional para teste)"
        read -p "Pressione ENTER após configurar o .env..."
    fi
fi
log_success "Configurações verificadas"

# 3. Executar linting
log_info "Executando linting..."
npm run lint
log_success "Linting passou sem erros"

# 4. Executar verificação de tipos
log_info "Verificando tipos TypeScript..."
npm run type-check
log_success "Verificação de tipos passou"

# 5. Executar testes
log_info "Executando bateria de testes..."
npm run test:run
log_success "Todos os testes passaram"

# 6. Verificar coverage
log_info "Gerando relatório de coverage..."
npm run test:coverage
log_success "Coverage gerado em reports/coverage/"

# 7. Build da aplicação
log_info "Fazendo build da aplicação..."
npm run build
log_success "Build concluído em dist/"

# 8. Executar auditoria de segurança
log_info "Executando auditoria de segurança..."
npm audit --audit-level moderate
log_success "Auditoria de segurança passou"

# 9. Teste de qualidade completo
log_info "Executando verificação completa de qualidade..."
npm run quality:check
log_success "Verificação de qualidade passou"

echo ""
echo "🎉 Todos os testes locais passaram com sucesso!"
echo ""
log_info "Próximos passos:"
echo "  1. Execute 'npm run dev' para testar o frontend"
echo "  2. Execute 'npm run preview' para testar a versão de produção"
echo "  3. Use o script start-services.sh para testar com microserviços"
echo ""
log_success "Sistema pronto para desenvolvimento e deploy!"
