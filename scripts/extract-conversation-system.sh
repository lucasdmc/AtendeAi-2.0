#!/bin/bash

# Script para extrair o sistema de conversação + contextualização
# Este script cria um pacote com apenas os arquivos essenciais

echo "🚀 Extraindo Sistema de Conversação + Contextualização"
echo "======================================================"

# Nome do diretório de saída
OUTPUT_DIR="atende-ai-conversation-system"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FINAL_DIR="${OUTPUT_DIR}_${TIMESTAMP}"

# Criar estrutura de diretórios
echo "📁 Criando estrutura de diretórios..."
mkdir -p "${FINAL_DIR}/conversation-service/src"/{clients,controllers,services,models,config,utils}
mkdir -p "${FINAL_DIR}/clinic-service/src"/{controllers,services,models,routes,config,utils}
mkdir -p "${FINAL_DIR}/database/migrations"
mkdir -p "${FINAL_DIR}/docs"
mkdir -p "${FINAL_DIR}/examples"
mkdir -p "${FINAL_DIR}/scripts"

# Copiar arquivos do Conversation Service
echo "📦 Copiando Conversation Service..."
cp -r backend/services/conversation-service/src/clients/clinicServiceClient.js "${FINAL_DIR}/conversation-service/src/clients/"
cp -r backend/services/conversation-service/src/controllers/conversationController.js "${FINAL_DIR}/conversation-service/src/controllers/"
cp -r backend/services/conversation-service/src/services/llmOrchestrator.js "${FINAL_DIR}/conversation-service/src/services/"
cp -r backend/services/conversation-service/src/services/conversationalMemory.js "${FINAL_DIR}/conversation-service/src/services/"
cp -r backend/services/conversation-service/src/models/*.js "${FINAL_DIR}/conversation-service/src/models/" 2>/dev/null || true
cp -r backend/services/conversation-service/src/config/*.js "${FINAL_DIR}/conversation-service/src/config/" 2>/dev/null || true
cp -r backend/services/conversation-service/src/utils/*.js "${FINAL_DIR}/conversation-service/src/utils/" 2>/dev/null || true
cp backend/services/conversation-service/package.json "${FINAL_DIR}/conversation-service/"
cp backend/services/conversation-service/README.md "${FINAL_DIR}/conversation-service/" 2>/dev/null || true

# Copiar arquivos do Clinic Service
echo "📦 Copiando Clinic Service..."
cp backend/services/clinic-service/src/controllers/clinicController.js "${FINAL_DIR}/clinic-service/src/controllers/"
cp backend/services/clinic-service/src/services/contextualization.js "${FINAL_DIR}/clinic-service/src/services/"
cp backend/services/clinic-service/src/models/clinic.js "${FINAL_DIR}/clinic-service/src/models/"
cp backend/services/clinic-service/src/routes/clinic.js "${FINAL_DIR}/clinic-service/src/routes/"
cp -r backend/services/clinic-service/src/config/*.js "${FINAL_DIR}/clinic-service/src/config/" 2>/dev/null || true
cp -r backend/services/clinic-service/src/utils/*.js "${FINAL_DIR}/clinic-service/src/utils/" 2>/dev/null || true
cp backend/services/clinic-service/package.json "${FINAL_DIR}/clinic-service/"
cp backend/services/clinic-service/README.md "${FINAL_DIR}/clinic-service/" 2>/dev/null || true

# Copiar exemplos e documentação
echo "📚 Copiando documentação e exemplos..."
cp docs/CONVERSATION_CONTEXTUALIZATION_SYSTEM.md "${FINAL_DIR}/docs/"
cp backend/services/clinic-service/examples/esadi-context.json "${FINAL_DIR}/examples/" 2>/dev/null || true
cp backend/services/conversation-service/test-contextualization.js "${FINAL_DIR}/scripts/" 2>/dev/null || true
cp backend/services/clinic-service/scripts/update-esadi-context.js "${FINAL_DIR}/scripts/" 2>/dev/null || true

# Copiar migrations relevantes
echo "🗄️  Copiando migrations..."
find backend/services -name "*.sql" -type f | while read file; do
    if grep -q -E "(conversation|message|clinic|contextualization)" "$file"; then
        cp "$file" "${FINAL_DIR}/database/migrations/"
    fi
done

# Criar arquivo de configuração de exemplo
echo "⚙️  Criando arquivo de configuração..."
cat > "${FINAL_DIR}/.env.example" << 'EOF'
# Conversation Service
CONVERSATION_SERVICE_PORT=3005
OPENAI_API_KEY=your-openai-api-key
CLINIC_SERVICE_URL=http://localhost:3002
REDIS_URL=redis://localhost:6379

# Clinic Service  
CLINIC_SERVICE_PORT=3002
DATABASE_URL=postgresql://user:password@localhost:5432/atende_ai
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret
CLINIC_SERVICE_TOKEN=internal-service-token
EOF

# Criar README principal
echo "📝 Criando README..."
cat > "${FINAL_DIR}/README.md" << 'EOF'
# Sistema de Conversação AtendeAI com Contextualização JSON ESADI

Este pacote contém o sistema completo de conversação do AtendeAI com suporte à contextualização JSON ESADI.

## 📦 Conteúdo

- **conversation-service/**: Serviço de processamento de conversas e IA
- **clinic-service/**: Serviço de gestão de clínicas e contextualização  
- **database/**: Migrations SQL necessárias
- **docs/**: Documentação completa do sistema
- **examples/**: Exemplos de contextualização JSON
- **scripts/**: Scripts utilitários

## 🚀 Instalação Rápida

1. Configure o PostgreSQL e Redis
2. Copie `.env.example` para `.env` e configure
3. Execute as migrations em `database/migrations/`
4. Instale dependências:
   ```bash
   cd conversation-service && npm install
   cd ../clinic-service && npm install
   ```
5. Inicie os serviços:
   ```bash
   # Terminal 1
   cd clinic-service && npm start
   
   # Terminal 2
   cd conversation-service && npm start
   ```

## 📚 Documentação

Veja `docs/CONVERSATION_CONTEXTUALIZATION_SYSTEM.md` para documentação completa.

## 🧪 Teste

Use os scripts em `scripts/` para testar o sistema:

```bash
# Atualizar contextualização ESADI
node scripts/update-esadi-context.js

# Testar conversação
node scripts/test-contextualization.js
```
EOF

# Criar arquivo de informações da extração
echo "📋 Criando informações da extração..."
cat > "${FINAL_DIR}/EXTRACTION_INFO.txt" << EOF
Sistema de Conversação AtendeAI - Extração
==========================================
Data: $(date)
Versão: 2.0
Componentes: Conversation Service + Clinic Service + Contextualização JSON ESADI

Arquivos Extraídos:
------------------
$(find "${FINAL_DIR}" -type f | wc -l) arquivos
$(du -sh "${FINAL_DIR}" | cut -f1) total

Funcionalidades Incluídas:
-------------------------
✅ Processamento de mensagens WhatsApp
✅ Contextualização JSON ESADI
✅ Integração com OpenAI
✅ Cache Redis
✅ Multi-tenant
✅ Personalidade de IA configurável
✅ Gestão de contexto conversacional

Dependências Principais:
-----------------------
- Node.js >= 18.0.0
- PostgreSQL
- Redis
- OpenAI API
EOF

# Criar arquivo ZIP
echo "📦 Criando arquivo ZIP..."
zip -r "${FINAL_DIR}.zip" "${FINAL_DIR}" -q

echo ""
echo "✅ Extração concluída com sucesso!"
echo "📁 Diretório: ${FINAL_DIR}"
echo "📦 Arquivo: ${FINAL_DIR}.zip"
echo "📊 Tamanho: $(du -sh "${FINAL_DIR}.zip" | cut -f1)"
echo ""
echo "🎯 Próximos passos:"
echo "1. Configure as variáveis de ambiente em .env"
echo "2. Execute as migrations do banco de dados"
echo "3. Inicie os serviços seguindo o README"