#!/bin/bash

# Script para abrir os PDFs da documentação
# Funciona no macOS, Linux e Windows (com WSL)

echo "🚀 Abrindo documentação PDF do AtendeAí 2.0..."

# Verificar se o diretório existe
if [ ! -d "docs/pdf" ]; then
    echo "❌ Diretório docs/pdf não encontrado. Execute primeiro:"
    echo "   ./scripts/generate-pdf-simple.sh"
    exit 1
fi

# Função para abrir arquivo baseado no OS
open_file() {
    local file="$1"
    if [ -f "$file" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            open "$file"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            xdg-open "$file"
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
            # Windows (Git Bash/WSL)
            start "$file"
        else
            echo "❌ Sistema operacional não suportado: $OSTYPE"
            exit 1
        fi
    else
        echo "⚠️  Arquivo não encontrado: $file"
    fi
}

# Menu interativo
echo ""
echo "📋 Escolha uma opção:"
echo "1. Abrir PDF combinado (recomendado)"
echo "2. Abrir features.pdf"
echo "3. Abrir system_spec.pdf"
echo "4. Abrir acceptance_report.pdf"
echo "5. Abrir db_model.pdf"
echo "6. Abrir frontend_integration.pdf"
echo "7. Abrir CHANGELOG.pdf"
echo "8. Abrir README.pdf"
echo "9. Abrir HTML combinado"
echo "0. Abrir todos os PDFs"
echo ""

read -p "Digite sua opção (0-9): " choice

case $choice in
    1)
        echo "📄 Abrindo PDF combinado..."
        open_file "docs/pdf/AtendeAI-2.0-Documentacao-Completa.pdf"
        ;;
    2)
        echo "📄 Abrindo features.pdf..."
        open_file "docs/pdf/features.pdf"
        ;;
    3)
        echo "📄 Abrindo system_spec.pdf..."
        open_file "docs/pdf/system_spec.pdf"
        ;;
    4)
        echo "📄 Abrindo acceptance_report.pdf..."
        open_file "docs/pdf/acceptance_report.pdf"
        ;;
    5)
        echo "📄 Abrindo db_model.pdf..."
        open_file "docs/pdf/db_model.pdf"
        ;;
    6)
        echo "📄 Abrindo frontend_integration.pdf..."
        open_file "docs/pdf/frontend_integration.pdf"
        ;;
    7)
        echo "📄 Abrindo CHANGELOG.pdf..."
        open_file "docs/pdf/CHANGELOG.pdf"
        ;;
    8)
        echo "📄 Abrindo README.pdf..."
        open_file "docs/pdf/README.pdf"
        ;;
    9)
        echo "📄 Abrindo HTML combinado..."
        open_file "docs/pdf/AtendeAI-2.0-Documentacao-Completa.html"
        ;;
    0)
        echo "📄 Abrindo todos os PDFs..."
        open_file "docs/pdf/AtendeAI-2.0-Documentacao-Completa.pdf"
        open_file "docs/pdf/features.pdf"
        open_file "docs/pdf/system_spec.pdf"
        open_file "docs/pdf/acceptance_report.pdf"
        open_file "docs/pdf/db_model.pdf"
        open_file "docs/pdf/frontend_integration.pdf"
        open_file "docs/pdf/CHANGELOG.pdf"
        open_file "docs/pdf/README.pdf"
        ;;
    *)
        echo "❌ Opção inválida. Use 0-9."
        exit 1
        ;;
esac

echo "✅ Arquivo(s) aberto(s) com sucesso!"
echo ""
echo "📁 Localização dos arquivos:"
echo "   $(pwd)/docs/pdf/"
echo ""
echo "🎯 Para visualizar todos os arquivos:"
echo "   ls -la docs/pdf/"
