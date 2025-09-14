#!/bin/bash

# =====================================================
# 🚀 ATENDEAI 2.0 - SERVIDOR INTEGRADO
# Script de inicialização
# =====================================================

echo "🚀 Iniciando AtendeAI 2.0 - Servidor Integrado"
echo "=============================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js primeiro."
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Parar processos existentes na porta 8080
echo "🛑 Parando processos existentes na porta 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || echo "Porta 8080 liberada"

# Aguardar um momento
sleep 2

# Iniciar o servidor integrado
echo "🚀 Iniciando servidor integrado..."
echo ""
echo "📍 URL: http://localhost:8080"
echo "📱 Webhook: /webhook/whatsapp"
echo "🔍 Health: /health"
echo "📞 WhatsApp: 554730915628"
echo ""
echo "✅ Microserviços Integrados:"
echo "   - Auth Service: /api/auth/*"
echo "   - Clinic Service: /api/clinics/*"
echo "   - Conversation Service: /api/conversations/*"
echo "   - Appointment Service: /api/appointments/*"
echo "   - WhatsApp Service: /api/whatsapp/*"
echo ""
echo "🎯 Pronto para receber webhooks do Meta!"
echo ""

# Iniciar o servidor
node webhook-integrated.js
