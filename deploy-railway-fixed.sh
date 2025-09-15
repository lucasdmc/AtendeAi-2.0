#!/bin/bash

# =====================================================
# 🚀 DEPLOY RAILWAY CORRIGIDO - ATENDEAI 2.0
# =====================================================

echo "🔧 Iniciando deploy corrigido para Railway..."

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instalando..."
    npm install -g @railway/cli
fi

# Fazer login no Railway
echo "🔐 Fazendo login no Railway..."
railway login

# Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=https://kytphnasmdvebmdvvwtx.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjI4MTAsImV4cCI6MjA3MTE5ODgxMH0.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYyMjgxMCwiZXhwIjoyMDcxMTk4ODEwfQ.36Ip9NWvqh6aeFQeowV79r54C2YQPc5N-Mn_dn2qD70
railway variables set JWT_SECRET=lykk38BdYh0gYhNVNBbe48sxjbDOVxLrt4xVfbwqCMbTniovlOJyI6iFNmCUza9udQzkD8RPeKE2xSwjhNAUiA==
railway variables set PORT=8080

# Remover variável DATABASE_URL se existir (não precisamos mais)
echo "🗑️ Removendo configuração PostgreSQL desnecessária..."
railway variables unset DATABASE_URL 2>/dev/null || true

# Fazer deploy
echo "🚀 Fazendo deploy..."
railway up

# Verificar status
echo "✅ Deploy concluído! Verificando status..."
railway status

echo "🎉 Deploy corrigido finalizado!"
echo "📝 Nota: Frontend está hospedado no Lovable, Railway apenas para backend"
