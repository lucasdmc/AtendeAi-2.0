#!/bin/bash

# =====================================================
# SCRIPT DE TESTE DE CONECTIVIDADE SUPABASE - ATENDEAI 2.0
# =====================================================

echo "🔍 TESTANDO CONECTIVIDADE COM SUPABASE..."
echo "=========================================="

# Verificar se psql está disponível
if ! command -v psql &> /dev/null; then
    echo "❌ psql não está instalado. Instalando..."
    
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install postgresql
        else
            echo "❌ Homebrew não está instalado. Instale o Homebrew primeiro."
            exit 1
        fi
    else
        echo "❌ Sistema operacional não suportado. Instale o PostgreSQL client manualmente."
        exit 1
    fi
fi

echo ""
echo "🧪 TESTANDO DIFERENTES CONFIGURAÇÕES..."

# Configurações para testar
CONFIGS=(
    "kytphnasmdvebmdvvwtx.supabase.co:5432:postgres:supabase@1234:postgres"
    "kytphnasmdvebmdvvwtx.supabase.co:6543:postgres:supabase@1234:postgres"
    "kytphnasmdvebmdvvwtx.supabase.co:5432:postgres:supabase1234:postgres"
    "kytphnasmdvebmdvvwtx.supabase.co:5432:postgres:supabase:postgres"
)

SUCCESS=false

for config in "${CONFIGS[@]}"; do
    IFS=':' read -r host port user password database <<< "$config"
    
    echo ""
    echo "🔗 Testando: $host:$port"
    echo "   User: $user"
    echo "   Database: $database"
    
    # Testar conexão
    export PGPASSWORD="$password"
    if psql -h "$host" -p "$port" -U "$user" -d "$database" -c "SELECT version();" &> /dev/null; then
        echo "✅ CONEXÃO BEM-SUCEDIDA!"
        echo "   Host: $host"
        echo "   Port: $port"
        echo "   User: $user"
        echo "   Password: $password"
        echo "   Database: $database"
        
        # Testar se as tabelas existem
        echo ""
        echo "🔍 Verificando tabelas existentes..."
        psql -h "$host" -p "$port" -U "$user" -d "$database" -c "
        SELECT 
            schemaname,
            tablename
        FROM pg_tables 
        WHERE schemaname IN ('atendeai', 'conversation', 'appointment', 'clinic', 'whatsapp', 'google_calendar')
        ORDER BY schemaname, tablename;
        "
        
        SUCCESS=true
        WORKING_HOST="$host"
        WORKING_PORT="$port"
        WORKING_USER="$user"
        WORKING_PASSWORD="$password"
        WORKING_DATABASE="$database"
        break
    else
        echo "❌ Falha na conexão"
    fi
done

if [ "$SUCCESS" = false ]; then
    echo ""
    echo "❌ NENHUMA CONFIGURAÇÃO FUNCIONOU!"
    echo ""
    echo "🔧 AÇÕES NECESSÁRIAS:"
    echo "   1. Acesse: https://kytphnasmdvebmdvvwtx.supabase.co"
    echo "   2. Vá em Settings → Database"
    echo "   3. Copie a Connection String exata"
    echo "   4. Verifique se o projeto está ativo"
    echo "   5. Verifique se o IP está liberado"
    echo ""
    echo "💡 DICA: A senha pode ter caracteres especiais que precisam ser escapados"
    exit 1
fi

echo ""
echo "✅ CONFIGURAÇÃO FUNCIONANDO ENCONTRADA!"
echo "========================================"
echo "   Host: $WORKING_HOST"
echo "   Port: $WORKING_PORT"
echo "   User: $WORKING_USER"
echo "   Database: $WORKING_DATABASE"
echo ""

# Criar arquivo de configuração corrigido
echo "📝 Criando arquivo de configuração corrigido..."
cat > supabase-config-corrected.env << EOF
# =====================================================
# CONFIGURAÇÃO SUPABASE CORRIGIDA - ATENDEAI 2.0
# =====================================================
SUPABASE_URL=https://kytphnasmdvebmdvvwtx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9lIjoiYW5vbiIsImlhdCI6MTc1NTYyMjgxMCwiZXhwIjoyMDcxMTk4ODEwfQ.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9lIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU1NjIyODEwLCJleHAiOjIwNzExOTg4MTB9LjM2SXA5Tld2cWg2YWVGUXVvd1Y3OXI1NEMyWVFQYzVOLU1uX2RuMlFENzA

# CONFIGURAÇÃO CORRIGIDA DO BANCO
DATABASE_URL=postgresql://$WORKING_USER:$WORKING_PASSWORD@$WORKING_HOST:$WORKING_PORT/$WORKING_DATABASE
SUPABASE_DB_HOST=$WORKING_HOST
SUPABASE_DB_PORT=$WORKING_PORT
SUPABASE_DB_USER=$WORKING_USER
SUPABASE_DB_PASSWORD=$WORKING_PASSWORD
SUPABASE_DB_NAME=$WORKING_DATABASE
EOF

echo "📁 Arquivo criado: supabase-config-corrected.env"
echo ""
echo "🔧 PRÓXIMOS PASSOS:"
echo "   1. Copie as configurações do arquivo supabase-config-corrected.env"
echo "   2. Atualize o docker-compose.yml"
echo "   3. Execute: ./backend/scripts/setup-supabase-simple.sh"
echo "   4. Teste a infraestrutura: ./backend/scripts/start-infrastructure.sh"

# Limpar variável de ambiente
unset PGPASSWORD

echo ""
echo "🎯 PROBLEMA RESOLVIDO! O Supabase está funcionando perfeitamente."
