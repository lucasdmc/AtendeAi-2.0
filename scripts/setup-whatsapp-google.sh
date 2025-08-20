#!/bin/bash

# =====================================================
# SCRIPT DE CONFIGURAÇÃO - WHATSAPP E GOOGLE CALENDAR
# ATENDEAI 2.0
# =====================================================

echo "🚀 Configurando serviços de WhatsApp e Google Calendar..."
echo "====================================================="

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp env.config .env
    echo "✅ Arquivo .env criado. Edite-o com suas credenciais completas."
fi

# Verificar variáveis obrigatórias
echo "🔍 Verificando configurações..."

# WhatsApp
if [ -z "$WHATSAPP_ACCESS_TOKEN" ]; then
    echo "⚠️  WHATSAPP_ACCESS_TOKEN não configurado"
    echo "   Configure no arquivo .env ou como variável de ambiente"
fi

if [ -z "$WHATSAPP_PHONE_NUMBER_ID" ]; then
    echo "⚠️  WHATSAPP_PHONE_NUMBER_ID não configurado"
fi

# Google
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "⚠️  GOOGLE_CLIENT_ID não configurado"
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "⚠️  GOOGLE_CLIENT_SECRET não configurado"
fi

# Construir e iniciar os serviços
echo "🔨 Construindo serviços..."
docker-compose build whatsapp-service google-calendar-service

echo "🚀 Iniciando serviços..."
docker-compose up -d whatsapp-service google-calendar-service

# Aguardar serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos serviços
echo "📊 Verificando status dos serviços..."

# WhatsApp Service
if curl -f http://localhost:3007/health > /dev/null 2>&1; then
    echo "✅ WhatsApp Service: RODANDO (http://localhost:3007)"
else
    echo "❌ WhatsApp Service: ERRO - verifique os logs"
    docker-compose logs whatsapp-service --tail=20
fi

# Google Calendar Service
if curl -f http://localhost:3008/health > /dev/null 2>&1; then
    echo "✅ Google Calendar Service: RODANDO (http://localhost:3008)"
else
    echo "❌ Google Calendar Service: ERRO - verifique os logs"
    docker-compose logs google-calendar-service --tail=20
fi

echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "====================================================="
echo "1. Configure o GOOGLE_CLIENT_SECRET no arquivo .env"
echo "2. Configure o GOOGLE_API_KEY no arquivo .env"
echo "3. Configure o webhook do WhatsApp no Meta Developer Console"
echo "4. Teste as APIs:"
echo "   - WhatsApp: http://localhost:3007/health"
echo "   - Google Calendar: http://localhost:3008/health"
echo ""
echo "📚 Documentação:"
echo "   - WhatsApp: https://developers.facebook.com/docs/whatsapp"
echo "   - Google Calendar: https://developers.google.com/calendar"
echo ""
echo "🔧 Para ver logs:"
echo "   docker-compose logs -f whatsapp-service"
echo "   docker-compose logs -f google-calendar-service"
