.PHONY: test lint contract build clean install

# Instalação de dependências
install:
	@echo "Instalando dependências..."
	npm ci

# Testes
test:
	@echo "Executando testes..."
	npm test

# Linting
lint:
	@echo "Executando linters..."
	npm run lint

# Validação de contrato API
contract:
	@echo "Validando contrato OpenAPI..."
	@if [ -f "api/openapi.yaml" ]; then \
		spectral lint api/openapi.yaml; \
	else \
		echo "Arquivo api/openapi.yaml não encontrado"; \
	fi

# Build
build:
	@echo "Fazendo build do projeto..."
	npm run build

# Limpeza
clean:
	@echo "Limpando arquivos temporários..."
	rm -rf node_modules/.cache
	rm -rf dist
	rm -rf reports/coverage

# Setup completo
setup: install
	@echo "Setup completo realizado"

# Validação completa
validate: lint test contract
	@echo "Validação completa realizada"

# Deploy (placeholder)
deploy:
	@echo "Deploy não configurado ainda"

# Geração de PDFs
pdf:
	@echo "Gerando PDFs da documentação..."
	@./scripts/generate-pdf-simple.sh

pdf-combined:
	@echo "Gerando PDF combinado..."
	@./scripts/generate-pdf-combined.sh

pdf-all: pdf pdf-combined
	@echo "Todos os PDFs gerados com sucesso!"

open-pdfs:
	@echo "Abrindo PDFs da documentação..."
	@./scripts/open-pdfs.sh

# Limpeza de PDFs
clean-pdfs:
	@echo "Limpando PDFs gerados..."
	@rm -rf docs/pdf/*.pdf
	@rm -rf docs/pdf/*.html

# Help
help:
	@echo "Comandos disponíveis:"
	@echo "  install      - Instala dependências"
	@echo "  test         - Executa testes"
	@echo "  lint         - Executa linters"
	@echo "  contract     - Valida contrato OpenAPI"
	@echo "  build        - Faz build do projeto"
	@echo "  clean        - Limpa arquivos temporários"
	@echo "  setup        - Setup completo"
	@echo "  validate     - Validação completa"
	@echo "  deploy       - Deploy (placeholder)"
	@echo "  pdf          - Gera PDFs individuais"
	@echo "  pdf-combined - Gera PDF combinado"
	@echo "  pdf-all      - Gera todos os PDFs"
	@echo "  open-pdfs    - Abre PDFs da documentação"
	@echo "  clean-pdfs   - Limpa PDFs gerados"