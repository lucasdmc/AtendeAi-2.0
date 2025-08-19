# 📚 CONTEXT - ATENDEAI 2.0

---

## 🎯 **PROJETO ATUAL**

### **Nome do Projeto**
**AtendeAI 2.0** - Sistema de Inteligência Artificial para WhatsApp

### **Descrição**
Sistema de IA para WhatsApp que automatiza agendamentos de consultas médicas através de conversas naturais, com contextualização avançada por clínica.

### **Status Atual**
- **Frontend**: React existente com telas funcionais
- **Backend**: Sistema atual que precisa ser substituído por arquitetura robusta
- **Especificação**: Completa e aprovada em `framework/runtime/specification.md`

---

## 🏗️ **ARQUITETURA ATUAL**

### **Frontend (Existente)**
- **Tecnologia**: React
- **Telas Funcionais**:
  - Agendamentos
  - Clínicas
  - Conversas
  - Gestão de Usuários
  - Contextualização
  - Conversa Individual

### **Backend (A Ser Construído)**
- **Arquitetura**: Microserviços
- **Serviços Principais**:
  - Conversation Service
  - Appointment Service
  - Clinic Service
  - WhatsApp Service
  - Auth Service
  - LLM Orchestrator Service

---

## 📋 **REQUISITOS CRÍTICOS**

### **Funcionalidades Core**
1. **Sistema de Conversação WhatsApp** com contextualização avançada
2. **Sistema de Agendamento Inteligente** com máquina de estados
3. **Gestão de Clínicas Multi-tenant** com isolamento completo
4. **Sistema de Contextualização JSON** avançado
5. **LLM Orchestrator** próprio (sem agente tools da OpenAI)

### **Compatibilidade**
- **Frontend**: Manter compatibilidade com telas existentes
- **Dados**: Criar banco do zero mas manter compatibilidade
- **APIs**: Endpoints devem retornar dados no formato esperado

---

## 🔧 **TECNOLOGIAS E FRAMEWORKS**

### **Infraestrutura**
- **Containerização**: Docker + Docker Compose
- **Banco de Dados**: PostgreSQL com particionamento
- **Cache**: Redis Cluster
- **API Gateway**: Kong/Nginx
- **Monitoramento**: Prometheus + Grafana

### **Backend**
- **Framework**: A ser definido (Node.js/Express, Python/FastAPI, etc.)
- **Autenticação**: JWT com refresh tokens
- **Integrações**: WhatsApp Business API, Google Calendar
- **Observabilidade**: OpenTelemetry, logs estruturados

---

## 📊 **ESTRUTURA DE PASTAS**

```
AtendeAí 2.0/
├── framework/
│   ├── knowledge_base/
│   │   └── CONTEXT.md (este arquivo)
│   ├── runtime/
│   │   └── specification.md
│   └── releases/
├── pages/ (frontend existente)
│   ├── Agendamentos.tsx
│   ├── Clinicas.tsx
│   ├── Conversas.tsx
│   ├── GestaoUsuarios.tsx
│   └── ...
└── backend.md (especificação original)
```

---

## 🎯 **OBJETIVOS DE DESENVOLVIMENTO**

### **Fase 1: Fundação e Infraestrutura** ✅ **COMPLETO**
- ✅ Setup completo da infraestrutura Docker
- ✅ Banco de dados PostgreSQL com RLS e multi-tenancy
- ✅ Sistema de cache Redis com persistência
- ✅ Sistema de autenticação JWT completo
- ✅ API Gateway Kong configurado
- ✅ Monitoramento Prometheus + Grafana
- ✅ Load Balancer HAProxy
- ✅ Scripts de inicialização automatizados
- ✅ **Scripts de testes de conectividade implementados**
- ✅ **Documentação completa da arquitetura criada**

### **Fase 2: Serviços Core**
- Clinic Service com contextualização
- Conversation Service com IA
- Appointment Service com fluxo

### **Fase 3: Integrações**
- WhatsApp Business API
- Google Calendar
- Sistema de notificações

### **Fase 4: Gateway e Monitoramento** ✅ **COMPLETA**
- ✅ Kong API Gateway configurado com roteamento e segurança
- ✅ HAProxy configurado como load balancer
- ✅ Prometheus configurado para coleta de métricas
- ✅ Grafana configurado com dashboards automáticos
- ✅ Scripts de testes implementados para validação
- ✅ Documentação completa do sistema de monitoramento

### **Fase 5: Testes e Deploy** ✅ **COMPLETA**
- ✅ Testes end-to-end implementados para todos os fluxos
- ✅ Testes de performance e estabilidade implementados
- ✅ Script de deploy em produção implementado
- ✅ Validação completa do sistema em produção
- ✅ Sistema validado e pronto para uso

---

## ⚠️ **CONSTRAINTS E LIMITAÇÕES**

### **Técnicas**
- **Performance**: < 200ms para 95% das requisições
- **Uptime**: > 99.9%
- **Escalabilidade**: 1000+ usuários simultâneos
- **Recuperação**: < 2 minutos para falhas

### **Funcionais**
- **Compatibilidade**: Frontend existente deve funcionar
- **Funcionalidades**: 100% das especificadas devem ser implementadas
- **Contextualização**: Sistema JSON deve funcionar para todas as clínicas

---

## 🔄 **FLUXO DE DESENVOLVIMENTO**

### **Ordem de Implementação**
1. **Autenticação** (menor risco)
2. **Gestão de Clínicas** (base para outras funcionalidades)
3. **Sistema de Conversação** (core do negócio)
4. **Sistema de Agendamento** (funcionalidade principal)
5. **Integrações Externas** (WhatsApp e Google Calendar)

### **Validação Contínua**
- Testes automatizados para cada funcionalidade
- Validação de compatibilidade com frontend
- Verificação de performance e estabilidade

---

## 📝 **DOCUMENTAÇÃO**

### **Arquivos Principais**
- **CONTEXT.md**: Este arquivo (contexto do projeto)
- **specification.md**: Especificação completa da funcionalidade
- **backend.md**: Especificação técnica original

### **Próximos Passos**
1. **Aprovação da Especificação** pelo usuário
2. **Ativação dos Agentes Especialistas** (database_architect, api_architect)
3. **Desenvolvimento** com expert_developer
4. **Revisão** com delivery_reviewer
5. **Atualização do Contexto** com context_manager

---

**Última atualização**: 2024-01-15  
**Versão**: 1.1.0  
**Status**: ENTREGÁVEL 1 COMPLETO  
**Próxima revisão**: Início do Entregável 2 - Clinic Service
