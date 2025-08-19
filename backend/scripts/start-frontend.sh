#!/bin/bash

# =====================================================
# SCRIPT PARA EXECUTAR FRONTEND - ATENDEAI 2.0
# =====================================================

echo "🚀 Iniciando Frontend AtendeAI 2.0..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado. Por favor, instale o npm primeiro."
    exit 1
fi

# Verificar se o diretório pages existe
if [ ! -d "pages" ]; then
    echo "❌ Diretório 'pages' não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# Verificar se há arquivos React
if [ ! -f "pages/Index.tsx" ]; then
    echo "❌ Arquivos React não encontrados. Verifique se o frontend está configurado."
    exit 1
fi

echo "✅ Verificações concluídas. Iniciando frontend..."

# Navegar para o diretório do frontend (se existir um package.json)
if [ -f "package.json" ]; then
    echo "📦 Instalando dependências..."
    npm install
    
    echo "🌐 Iniciando servidor de desenvolvimento na porta 8080..."
    PORT=8080 npm start
else
    echo "⚠️  package.json não encontrado. Tentando executar com servidor simples..."
    
    # Criar um servidor simples para servir os arquivos React
    echo "🌐 Iniciando servidor simples na porta 8080..."
    echo "📁 Servindo arquivos do diretório 'pages'"
    echo "🔗 Acesse: http://localhost:8080"
    
    # Usar Python para criar um servidor simples (se disponível)
    if command -v python3 &> /dev/null; then
        python3 -m http.server 8080
    elif command -v python &> /dev/null; then
        python -m http.server 8080
    else
        echo "❌ Python não encontrado. Por favor, instale Python ou configure o frontend corretamente."
        echo "💡 Alternativa: Use um servidor local como Live Server (VS Code) ou http-server (npm)"
        exit 1
    fi
fi
