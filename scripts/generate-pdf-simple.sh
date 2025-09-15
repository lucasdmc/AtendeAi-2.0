#!/bin/bash

# Script simples para gerar PDF usando markdown-pdf (Node.js)
# Requer: npm install -g markdown-pdf

echo "🚀 Gerando PDF da documentação do AtendeAí 2.0 (método simples)..."

# Instalar markdown-pdf se não estiver instalado
if ! command -v markdown-pdf &> /dev/null; then
    echo "📦 Instalando markdown-pdf..."
    npm install -g markdown-pdf
fi

# Criar diretório de saída
mkdir -p docs/pdf

# Configurações do PDF
PDF_OPTIONS="--paper-format A4 --paper-orientation portrait --paper-border 2cm --render-delay 2000"

# Gerar PDFs individuais
echo "📄 Gerando PDFs individuais..."

# README principal
if [ -f "README.md" ]; then
    echo "  - README.pdf"
    markdown-pdf README.md $PDF_OPTIONS -o docs/pdf/README.pdf
fi

# Features
if [ -f "features.md" ]; then
    echo "  - features.pdf"
    markdown-pdf features.md $PDF_OPTIONS -o docs/pdf/features.pdf
fi

# System Spec
if [ -f "docs/system_spec.md" ]; then
    echo "  - system_spec.pdf"
    markdown-pdf docs/system_spec.md $PDF_OPTIONS -o docs/pdf/system_spec.pdf
fi

# Acceptance Report
if [ -f "docs/acceptance_report.md" ]; then
    echo "  - acceptance_report.pdf"
    markdown-pdf docs/acceptance_report.md $PDF_OPTIONS -o docs/pdf/acceptance_report.pdf
fi

# DB Model
if [ -f "docs/db_model.md" ]; then
    echo "  - db_model.pdf"
    markdown-pdf docs/db_model.md $PDF_OPTIONS -o docs/pdf/db_model.pdf
fi

# Frontend Integration
if [ -f "docs/frontend_integration.md" ]; then
    echo "  - frontend_integration.pdf"
    markdown-pdf docs/frontend_integration.md $PDF_OPTIONS -o docs/pdf/frontend_integration.pdf
fi

# Changelog
if [ -f "CHANGELOG.md" ]; then
    echo "  - CHANGELOG.pdf"
    markdown-pdf CHANGELOG.md $PDF_OPTIONS -o docs/pdf/CHANGELOG.pdf
fi

echo "✅ PDFs gerados com sucesso em docs/pdf/"
echo "📁 Arquivos gerados:"
ls -la docs/pdf/

echo ""
echo "🎯 Para visualizar:"
echo "   open docs/pdf/"
