#!/bin/bash

# Script para testar a conversação ESADI em produção

echo "🚀 Teste de Conversação ESADI em Produção"
echo "=========================================="
echo ""

# URL do Railway (substitua pela URL real após o deploy)
PRODUCTION_URL="https://atendeai-production.up.railway.app"

# Testar health
echo "📡 Testando conexão com servidor de produção..."
curl -s "$PRODUCTION_URL/health" | head -n 5
echo ""

# Simular mensagem WhatsApp para ESADI
echo "📨 Enviando mensagem de teste para ESADI..."
echo ""

WEBHOOK_DATA='{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "123456789",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "554730915628",
          "phone_number_id": "123456789"
        },
        "messages": [{
          "from": "5547999999999",
          "id": "test_esadi_prod",
          "timestamp": "'$(date +%s)'",
          "text": {
            "body": "Olá! Qual o nome da assistente da ESADI?"
          },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}'

# Enviar requisição
RESPONSE=$(curl -s -X POST "$PRODUCTION_URL/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_DATA")

echo "✅ Resposta do servidor: $RESPONSE"
echo ""
echo "💡 A resposta deve processar a mensagem e:"
echo "   - Identificar a clínica ESADI pelo número 554730915628"
echo "   - Usar o contexto da Jessica como assistente"
echo "   - Responder com informações da ESADI"
echo ""
echo "📊 Verifique os logs no Railway para ver a resposta completa!"