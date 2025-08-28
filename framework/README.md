# 🤖 **FRAMEWORK DE AGENTES - ATENDEAÍ 2.0**

## 📋 **VISÃO GERAL**

Este framework contém um conjunto completo de agentes especializados refatorados para automação e desenvolvimento do projeto AtendeAí 2.0. Os agentes são definidos em arquivos YAML e fornecem funcionalidades específicas para diferentes aspectos do desenvolvimento.

---

## 🗂️ **ESTRUTURA DO FRAMEWORK**

```
framework/
├── agents/                    # 🤖 Agentes YAML especializados
├── api/                      # 📡 Documentação de APIs
├── db/                       # 🗄️ Estrutura de banco de dados
├── knowledge_base/           # 📚 Base de conhecimento
├── reports/                  # 📊 Relatórios e análises
├── runtime/                  # ⚙️ Especificação de runtime
├── src/                     # 💻 Código fonte framework
├── tests/                   # 🧪 Testes do framework
├── CHANGELOG.md             # 📝 Log de mudanças
└── Makefile                # 🔧 Automação de builds
```

---

## 🤖 **AGENTES DISPONÍVEIS**

### **Desenvolvimento e Arquitetura**
- **`api_architect.yaml`** - Arquiteto de APIs e integração
- **`database_architect.yaml`** - Design e otimização de banco de dados
- **`expert_developer.yaml`** - Desenvolvimento especializado
- **`frontend_integrator.yaml`** - Integração de frontend

### **Gestão e Qualidade**
- **`context_manager.yaml`** - Gerenciamento de contexto e estado
- **`delivery_reviewer.yaml`** - Revisão de entregas e quality assurance
- **`quality_hardening.yaml`** - Hardening e segurança
- **`test_engineer.yaml`** - Engenharia de testes

### **Descoberta e Especificação**
- **`discovery_agent.yaml`** - Descoberta de requisitos e análise
- **`specification_agent.yaml`** - Especificação e documentação

### **Gestão de Projeto**
- **`release_manager.yaml`** - Gerenciamento de releases
- **`repository_manager.yaml`** - Gestão de repositório

---

## 📡 **DOCUMENTAÇÃO DE API**

### **Estrutura da API**
- **`api/openapi.yaml`** - Especificação OpenAPI completa
- **`api/error-catalog.md`** - Catálogo de erros da API
- **`api/examples/`** - Exemplos de requisições e respostas

---

## 🗄️ **ESTRUTURA DE BANCO**

### **Gerenciamento de Dados**
- **`db/migrations/`** - Scripts de migração do banco
- **`db/seed/`** - Dados de seed para inicialização
- **`db/README.md`** - Documentação do esquema de banco

---

## 📚 **BASE DE CONHECIMENTO**

### **Documentação Técnica**
- **`knowledge_base/CONTEXT.md`** - Contexto do projeto
- **`knowledge_base/project_overview.md`** - Visão geral do projeto
- **`knowledge_base/docs/`** - Documentação técnica detalhada
  - `assumptions.md` - Premissas do sistema
  - `frontend_integration.md` - Guia de integração frontend
  - `ops.md` - Documentação operacional
  - `system_spec.md` - Especificação do sistema
  - `traceability.csv` - Matriz de rastreabilidade

---

## 📊 **RELATÓRIOS E ANÁLISES**

### **Monitoramento e Qualidade**
- **`reports/ocr_determinism.json`** - Análise de determinismo OCR
- **`reports/orchestration.json`** - Relatório de orquestração
- **`reports/review.json`** - Relatórios de revisão

---

## ⚙️ **RUNTIME E EXECUÇÃO**

### **Configuração de Runtime**
- **`runtime/specification.md`** - Especificação de runtime do sistema

---

## 🧪 **TESTES**

### **Framework de Testes**
- **`tests/__init__.py`** - Inicialização do framework de testes
- **`tests/example_test.py`** - Exemplo de teste
- Estrutura preparada para testes unitários e integração

---

## 🔧 **AUTOMAÇÃO**

### **Build e Deploy**
- **`Makefile`** - Comandos automatizados para:
  - Build do projeto
  - Deploy de componentes
  - Execução de testes
  - Linting e formatação

### **Controle de Versão**
- **`CHANGELOG.md`** - Log detalhado de mudanças e versões

---

## 🚀 **COMO USAR OS AGENTES**

### **1. Execução Individual**
```bash
# Executar um agente específico
make run-agent AGENT=api_architect

# Ou manualmente
python -m framework.agents.api_architect
```

### **2. Execução em Pipeline**
```bash
# Pipeline completo de desenvolvimento
make dev-pipeline

# Pipeline de qualidade
make quality-pipeline
```

### **3. Configuração Personalizada**
```bash
# Configurar variáveis de ambiente
cp .env.example .env
vim .env

# Executar com configuração personalizada
make run-agent AGENT=expert_developer CONFIG=custom
```

---

## 📖 **DOCUMENTAÇÃO ADICIONAL**

Para informações mais detalhadas sobre cada componente:

1. **Agentes**: Consulte os arquivos YAML individuais em `agents/`
2. **API**: Consulte `api/openapi.yaml` para especificações completas
3. **Banco**: Consulte `db/README.md` para esquema e migrações
4. **Testes**: Consulte `tests/` para exemplos e estrutura

---

## 🔄 **ATUALIZAÇÕES E MANUTENÇÃO**

### **Atualizando Agentes**
1. Edite o arquivo YAML do agente desejado
2. Teste a funcionalidade
3. Atualize o `CHANGELOG.md`
4. Commit as mudanças

### **Adicionando Novos Agentes**
1. Crie um novo arquivo YAML em `agents/`
2. Siga a estrutura dos agentes existentes
3. Adicione testes em `tests/`
4. Atualize este README

---

## 📞 **SUPORTE**

Para dúvidas ou problemas com o framework de agentes:
1. Consulte a documentação em `knowledge_base/docs/`
2. Verifique os logs em `reports/`
3. Execute os testes para validar funcionalidade
4. Consulte o `CHANGELOG.md` para mudanças recentes

---

**Framework de Agentes AtendeAí 2.0** - Automatização inteligente para desenvolvimento eficiente! 🤖

**Status**: ✅ **FRAMEWORK COMPLETO E OPERACIONAL**
**Última atualização**: $(date +%Y-%m-%d)
