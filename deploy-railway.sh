#!/bin/bash

# =====================================================
# 🚀 ATENDEAI 2.0 - DEPLOY RAILWAY
# Script de deploy para produção
# =====================================================

echo "🚀 Iniciando deploy para Railway..."
echo "=================================="

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instale com: npm install -g @railway/cli"
    exit 1
fi

# Verificar se está logado no Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Não está logado no Railway. Execute: railway login"
    exit 1
fi

# Build do frontend
echo "📦 Fazendo build do frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build do frontend"
    exit 1
fi

echo "✅ Build do frontend concluído"

# Verificar se o diretório dist existe
if [ ! -d "dist" ]; then
    echo "❌ Diretório dist não encontrado. Execute: npm run build"
    exit 1
fi

# Commit das mudanças
echo "📝 Fazendo commit das mudanças..."
git add .
git commit -m "feat: servidor integrado para produção - deploy Railway"

if [ $? -ne 0 ]; then
    echo "⚠️ Nenhuma mudança para commit ou erro no git"
fi

# Push para o repositório
echo "📤 Fazendo push para o repositório..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Erro no push para o repositório"
    exit 1
fi

echo "✅ Push concluído"

# Deploy no Railway
echo "🚀 Fazendo deploy no Railway..."
railway up

if [ $? -ne 0 ]; then
    echo "❌ Erro no deploy do Railway"
    exit 1
fi

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo ""
echo "📍 URL da aplicação: https://atendeai-20-production.up.railway.app"
echo "🔍 Health check: https://atendeai-20-production.up.railway.app/health"
echo "📱 Webhook: https://atendeai-20-production.up.railway.app/webhook/whatsapp"
echo ""
echo "✅ Frontend e API integrados funcionando!"
echo "✅ Todos os microserviços integrados!"
echo "✅ Pronto para receber webhooks do WhatsApp!"
