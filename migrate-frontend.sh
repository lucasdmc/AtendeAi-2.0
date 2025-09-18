#!/bin/bash

# Script para migrar frontend para novo repositório
# Uso: ./migrate-frontend.sh /caminho/para/novo/repositorio

if [ -z "$1" ]; then
    echo "Uso: $0 /caminho/para/novo/repositorio"
    exit 1
fi

NEW_REPO_PATH="$1"
CURRENT_PROJECT_PATH="/Users/lucascantoni/Desktop/AtendeAí 2.0"

echo "🚀 Iniciando migração do frontend..."
echo "📁 Origem: $CURRENT_PROJECT_PATH"
echo "📁 Destino: $NEW_REPO_PATH"

# Verificar se o diretório de destino existe
if [ ! -d "$NEW_REPO_PATH" ]; then
    echo "❌ Diretório de destino não existe: $NEW_REPO_PATH"
    exit 1
fi

# Navegar para o novo repositório
cd "$NEW_REPO_PATH"

echo "📦 Copiando arquivos do frontend..."

# Copiar pasta src completa
cp -r "$CURRENT_PROJECT_PATH/src" ./

# Copiar arquivos de configuração essenciais
cp "$CURRENT_PROJECT_PATH/package.json" ./
cp "$CURRENT_PROJECT_PATH/tsconfig.json" ./
cp "$CURRENT_PROJECT_PATH/tsconfig.app.json" ./
cp "$CURRENT_PROJECT_PATH/tsconfig.node.json" ./
cp "$CURRENT_PROJECT_PATH/vite.config.ts" ./
cp "$CURRENT_PROJECT_PATH/tailwind.config.ts" ./
cp "$CURRENT_PROJECT_PATH/postcss.config.js" ./
cp "$CURRENT_PROJECT_PATH/index.html" ./
cp "$CURRENT_PROJECT_PATH/components.json" ./
cp "$CURRENT_PROJECT_PATH/vite-env.d.ts" ./

# Copiar arquivos de ambiente de exemplo
if [ -f "$CURRENT_PROJECT_PATH/env.frontend.example" ]; then
    cp "$CURRENT_PROJECT_PATH/env.frontend.example" ./
fi

echo "📋 Instalando dependências..."
npm install

echo "✅ Migração concluída!"
echo "🔧 Próximos passos:"
echo "   1. Ajustar configurações de API no novo projeto"
echo "   2. Configurar variáveis de ambiente"
echo "   3. Testar o projeto: npm run dev"
echo "   4. Fazer commit: git add . && git commit -m 'Migrate frontend from AtendeAí 2.0'"

