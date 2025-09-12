#!/bin/bash
# =====================================================
# DEPLOY DE MICROSERVIÇOS - RAILWAY
# ATENDEAI 2.0
# =====================================================

echo "🚀 Iniciando deploy dos microserviços no Railway..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Erro: Railway CLI não está instalado"
    echo "Instale com: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI encontrado"

# Verificar se estamos logados no Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Erro: Não está logado no Railway"
    echo "Execute: railway login"
    exit 1
fi

echo "✅ Logado no Railway"

# Fazer commit das mudanças
echo "📝 Fazendo commit das mudanças..."
git add .
git commit -m "feat: configure microservices URLs and remove mocks for production

- Updated API service URLs to use Railway production URLs
- Removed all mock data from useAuth and useAgenda hooks
- Configured environment variables for microservices
- Implemented real authentication with Supabase
- Updated appointment CRUD operations to use real API"

# Fazer push para o repositório
echo "📤 Fazendo push para o repositório..."
git push origin main

# Fazer deploy no Railway
echo "🚀 Fazendo deploy no Railway..."
railway up

echo "✅ Deploy concluído!"
echo ""
echo "📋 URLs dos microserviços configuradas:"
echo "- Aplicação principal: https://atendeai-20-production.up.railway.app"
echo "- Auth Service: https://atendeai-20-production.up.railway.app:3001"
echo "- User Service: https://atendeai-20-production.up.railway.app:3002"
echo "- Clinic Service: https://atendeai-20-production.up.railway.app:3003"
echo "- Conversation Service: https://atendeai-20-production.up.railway.app:3005"
echo "- Appointment Service: https://atendeai-20-production.up.railway.app:3006"
echo "- WhatsApp Service: https://atendeai-20-production.up.railway.app:3007"
echo "- Google Calendar Service: https://atendeai-20-production.up.railway.app:3008"
echo ""
echo "🔍 Para verificar o status:"
echo "railway status"
echo "railway logs"
