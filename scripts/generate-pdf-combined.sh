#!/bin/bash

# Script para gerar PDF combinado usando o arquivo HTML
# Requer: wkhtmltopdf

echo "🚀 Gerando PDF combinado da documentação do AtendeAí 2.0..."

# Verificar se wkhtmltopdf está instalado
if ! command -v wkhtmltopdf &> /dev/null; then
    echo "📦 Instalando wkhtmltopdf..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install wkhtmltopdf
        else
            echo "❌ Homebrew não encontrado. Instale manualmente: https://wkhtmltopdf.org/downloads.html"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y wkhtmltopdf
    else
        echo "❌ Sistema operacional não suportado. Instale wkhtmltopdf manualmente."
        exit 1
    fi
fi

# Criar diretório de saída
mkdir -p docs/pdf

# Gerar PDF combinado a partir do HTML
echo "📄 Gerando PDF combinado..."
wkhtmltopdf \
    --page-size A4 \
    --margin-top 20mm \
    --margin-right 15mm \
    --margin-bottom 20mm \
    --margin-left 15mm \
    --encoding UTF-8 \
    --enable-local-file-access \
    --print-media-type \
    --disable-smart-shrinking \
    --zoom 0.8 \
    --header-spacing 5 \
    --footer-spacing 5 \
    --header-html <(echo '<div style="font-size: 10px; text-align: center; color: #666; width: 100%;">AtendeAí 2.0 - Documentação Técnica - Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>') \
    --footer-html <(echo '<div style="font-size: 10px; text-align: center; color: #666; width: 100%;">© 2025 AtendeAí 2.0 - Sistema de Gestão de Clínicas</div>') \
    docs/pdf/AtendeAI-2.0-Documentacao-Completa.html \
    docs/pdf/AtendeAI-2.0-Documentacao-Completa.pdf

if [ $? -eq 0 ]; then
    echo "✅ PDF combinado gerado com sucesso!"
    echo "📁 Arquivo: docs/pdf/AtendeAI-2.0-Documentacao-Completa.pdf"
    echo "📊 Tamanho: $(ls -lh docs/pdf/AtendeAI-2.0-Documentacao-Completa.pdf | awk '{print $5}')"
    echo ""
    echo "🎯 Para visualizar:"
    echo "   open docs/pdf/AtendeAI-2.0-Documentacao-Completa.pdf"
else
    echo "❌ Erro ao gerar PDF combinado"
    exit 1
fi

echo ""
echo "📋 Resumo dos arquivos gerados:"
ls -la docs/pdf/*.pdf
