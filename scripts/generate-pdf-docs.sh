#!/bin/bash

# Script para gerar PDF da documentação do AtendeAí 2.0
# Requer: pandoc, texlive (ou miktex no Windows)

echo "🚀 Gerando PDF da documentação do AtendeAí 2.0..."

# Criar diretório de saída
mkdir -p docs/pdf

# Lista de arquivos para incluir no PDF
FILES=(
    "README.md"
    "features.md"
    "docs/system_spec.md"
    "docs/acceptance_report.md"
    "docs/db_model.md"
    "docs/frontend_integration.md"
    "docs/assumptions.md"
    "CHANGELOG.md"
)

# Gerar PDF combinado
echo "📄 Gerando PDF combinado..."
pandoc "${FILES[@]}" \
    --pdf-engine=xelatex \
    --toc \
    --toc-depth=3 \
    --number-sections \
    --highlight-style=tango \
    --variable=geometry:margin=2cm \
    --variable=fontsize:11pt \
    --variable=documentclass:article \
    --variable=colorlinks:true \
    --variable=linkcolor:blue \
    --variable=urlcolor:blue \
    --variable=toccolor:black \
    --metadata title="AtendeAí 2.0 - Documentação Completa" \
    --metadata author="AtendeAí Team" \
    --metadata date="$(date '+%Y-%m-%d')" \
    -o "docs/pdf/AtendeAI-2.0-Documentacao-Completa.pdf"

# Gerar PDFs individuais
echo "📄 Gerando PDFs individuais..."

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .md)
        echo "  - $filename.pdf"
        pandoc "$file" \
            --pdf-engine=xelatex \
            --toc \
            --number-sections \
            --highlight-style=tango \
            --variable=geometry:margin=2cm \
            --variable=fontsize:11pt \
            --variable=documentclass:article \
            --variable=colorlinks:true \
            --variable=linkcolor:blue \
            --variable=urlcolor:blue \
            --variable=toccolor:black \
            -o "docs/pdf/$filename.pdf"
    else
        echo "⚠️  Arquivo não encontrado: $file"
    fi
done

echo "✅ PDFs gerados com sucesso em docs/pdf/"
echo "📁 Arquivos gerados:"
ls -la docs/pdf/

echo ""
echo "🎯 Para visualizar:"
echo "   open docs/pdf/AtendeAI-2.0-Documentacao-Completa.pdf"
