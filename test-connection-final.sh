#!/bin/bash

echo "🔍 TESTE FINAL DE CONEXÃO SUPABASE - ATENDEAI 2.0"
echo "=================================================="

# Configurações corretas
HOST="db.kytphnasmdvebmdvvwtx.supabase.co"
PORT="5432"
USER="postgres"
PASSWORD="Supa201294base"
DATABASE="postgres"

echo "📋 Configuração:"
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   User: $USER"
echo "   Database: $DATABASE"
echo "   Seu IP: $(curl -s https://ipinfo.io/ip)"

echo ""
echo "🧪 Testando conexão..."

# Testar conexão
export PGPASSWORD="$PASSWORD"
if psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" -c "SELECT version();" &> /dev/null; then
    echo "✅ CONEXÃO BEM-SUCEDIDA!"
    echo ""
    echo "🔍 Verificando tabelas existentes..."
    psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" -c "
    SELECT 
        schemaname,
        tablename
    FROM pg_tables 
    WHERE schemaname IN ('atendeai', 'conversation', 'appointment', 'clinic', 'whatsapp', 'google_calendar')
    ORDER BY schemaname, tablename;
    "
    
    echo ""
    echo "🎯 PROBLEMA RESOLVIDO! O Supabase está funcionando perfeitamente."
    echo ""
    echo "🚀 PRÓXIMOS PASSOS:"
    echo "   1. Execute: ./backend/scripts/setup-supabase-simple.sh"
    echo "   2. Execute: ./backend/scripts/start-infrastructure.sh"
    echo "   3. Execute: ./backend/scripts/start-frontend.sh"
    
else
    echo "❌ FALHA NA CONEXÃO!"
    echo ""
    echo "🔧 AÇÕES NECESSÁRIAS:"
    echo "   1. Acesse: https://kytphnasmdvebmdvvwtx.supabase.co"
    echo "   2. Vá em Settings → Database → Connection Pooling"
    echo "   3. Adicione seu IP: $(curl -s https://ipinfo.io/ip)"
    echo "   4. Salve as configurações"
    echo "   5. Aguarde 2-3 minutos e teste novamente"
    echo ""
    echo "💡 DICA: O IP pode levar alguns minutos para ser liberado"
fi

# Limpar variável de ambiente
unset PGPASSWORD
