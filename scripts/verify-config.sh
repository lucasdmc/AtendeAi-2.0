#!/bin/bash

# =====================================================
# SCRIPT DE VERIFICAÇÃO DE CONFIGURAÇÕES
# ATENDEAI 2.0
# =====================================================

echo "🔍 Verificando configurações do AtendeAI 2.0..."
echo "====================================================="

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "   Execute: cp env.config .env"
    exit 1
fi

echo "✅ Arquivo .env encontrado"

# Carregar variáveis do .env
source .env

# Função para verificar variável
check_var() {
    local var_name=$1
    local var_value=${!var_name}
    local required=$2
    
    if [ -z "$var_value" ] || [ "$var_value" = "your_*" ] || [ "$var_value" = "*_here" ]; then
        if [ "$required" = "true" ]; then
            echo "❌ $var_name: NÃO CONFIGURADO (OBRIGATÓRIO)"
            return 1
        else
            echo "⚠️  $var_name: NÃO CONFIGURADO (OPCIONAL)"
            return 0
        fi
    else
        echo "✅ $var_name: CONFIGURADO"
        return 0
    fi
}

echo ""
echo "🔑 VERIFICANDO API KEYS OBRIGATÓRIAS:"
echo "----------------------------------------"

errors=0

# OpenAI API
check_var "OPENAI_API_KEY" "true" || ((errors++))

# WhatsApp
check_var "WHATSAPP_ACCESS_TOKEN" "true" || ((errors++))
check_var "WHATSAPP_PHONE_NUMBER_ID" "true" || ((errors++))
check_var "WHATSAPP_BUSINESS_ACCOUNT_ID" "true" || ((errors++))

# Google Calendar
check_var "GOOGLE_CLIENT_ID" "true" || ((errors++))
check_var "GOOGLE_CLIENT_SECRET" "true" || ((errors++))
check_var "GOOGLE_API_KEY" "true" || ((errors++))

echo ""
echo "🗄️  VERIFICANDO CONFIGURAÇÕES DE BANCO:"
echo "----------------------------------------"

# Supabase
check_var "SUPABASE_URL" "true" || ((errors++))
check_var "SUPABASE_ANON_KEY" "true" || ((errors++))
check_var "SUPABASE_SERVICE_ROLE_KEY" "true" || ((errors++))

# Database
check_var "DATABASE_URL" "true" || ((errors++))

echo ""
echo "🔐 VERIFICANDO CONFIGURAÇÕES DE SEGURANÇA:"
echo "--------------------------------------------"

# JWT
check_var "JWT_SECRET" "true" || ((errors++))

# Webhook
check_var "WHATSAPP_WEBHOOK_VERIFY_TOKEN" "true" || ((errors++))
check_var "WEBHOOK_SIGNATURE_SECRET" "true" || ((errors++))

echo ""
echo "🌐 VERIFICANDO CONFIGURAÇÕES DE SERVIÇOS:"
echo "-------------------------------------------"

# URLs dos serviços
check_var "CLINIC_SERVICE_URL" "false"
check_var "CONVERSATION_SERVICE_URL" "false"
check_var "APPOINTMENT_SERVICE_URL" "false"

# Portas
check_var "WHATSAPP_SERVICE_PORT" "false"
check_var "GOOGLE_CALENDAR_SERVICE_PORT" "false"

echo ""
echo "📊 RESUMO DA VERIFICAÇÃO:"
echo "=========================="

if [ $errors -eq 0 ]; then
    echo "🎉 TODAS AS CONFIGURAÇÕES OBRIGATÓRIAS ESTÃO CORRETAS!"
    echo ""
    echo "🚀 Você pode iniciar o sistema:"
    echo "   docker-compose up -d"
    echo ""
    echo "🧪 Teste os serviços:"
    echo "   ./scripts/setup-whatsapp-google.sh"
else
    echo "❌ ENCONTRADOS $errors ERROS DE CONFIGURAÇÃO"
    echo ""
    echo "🔧 Configure as variáveis obrigatórias no arquivo .env"
    echo "📖 Consulte: CONFIGURACOES_PENDENTES.md"
    echo ""
    echo "⚠️  Variáveis que começam com 'your_' ou terminam com '_here' precisam ser configuradas"
fi

echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "===================="

if [ $errors -eq 0 ]; then
    echo "1. ✅ Configurações verificadas"
    echo "2. 🚀 Iniciar infraestrutura: docker-compose up -d redis kong"
    echo "3. 🔧 Iniciar serviços: docker-compose up -d auth-service clinic-service conversation-service appointment-service"
    echo "4. 📱 Iniciar integrações: docker-compose up -d whatsapp-service google-calendar-service"
    echo "5. 🧪 Testar: ./scripts/setup-whatsapp-google.sh"
else
    echo "1. ❌ Corrigir configurações no arquivo .env"
    echo "2. 🔍 Executar este script novamente: ./scripts/verify-config.sh"
    echo "3. 📖 Ler: CONFIGURACOES_PENDENTES.md"
    echo "4. 🚀 Após corrigir, iniciar o sistema"
fi

echo ""
echo "====================================================="
exit $errors
