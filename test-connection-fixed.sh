#!/bin/bash

echo "🔍 TESTANDO CONEXÃO COM SUPABASE (VERSÃO CORRIGIDA)..."
echo "======================================================"

# Configurações corretas
HOST="aws-1-us-east-2.pooler.supabase.com"
PORT="5432"
USER="postgres.kytphnasmdvebmdvvwtx"
PASSWORD="Lify.2025!."
DATABASE="postgres"

echo "📋 Configuração:"
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   User: $USER"
echo "   Database: $DATABASE"

# Criar arquivo .pgpass para evitar problemas com caracteres especiais
echo "🔧 Criando arquivo .pgpass..."
echo "$HOST:$PORT:$DATABASE:$USER:$PASSWORD" > ~/.pgpass
chmod 600 ~/.pgpass

echo ""
echo "🧪 Testando conexão..."

# Testar conexão usando arquivo .pgpass
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
    echo "🔧 Verifique:"
    echo "   1. Se o projeto está ativo no Supabase"
    echo "   2. Se o IP está liberado"
    echo "   3. Se as credenciais estão corretas"
    echo ""
    echo "💡 Tentando conexão alternativa..."
    
    # Tentar conexão alternativa sem arquivo .pgpass
    export PGPASSWORD="$PASSWORD"
    if psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DATABASE" -c "SELECT version();" &> /dev/null; then
        echo "✅ CONEXÃO ALTERNATIVA FUNCIONOU!"
    else
        echo "❌ Conexão alternativa também falhou"
    fi
    unset PGPASSWORD
fi

# Limpar arquivo .pgpass
rm -f ~/.pgpass
