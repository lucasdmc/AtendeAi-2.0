# 💬 ENTREGÁVEL 3: CONVERSATION SERVICE + LLM ORCHESTRATOR

---

## 🎯 **EXECUTIVE SUMMARY**

**Objetivo**: Implementar o sistema de conversação WhatsApp com IA avançada e LLM Orchestrator próprio.

**Valor de Negócio**: Sistema de conversação funcional com detecção de intenções e memória conversacional.

**Timeline**: 3-4 semanas

**Dependência**: Entregável 2 (Clinic Service) deve estar 100% funcional

---

## 🎯 **GOALS E SUBGOALS**

### **GOAL 1: Sistema de Conversação WhatsApp**
- **Subgoal 1.1**: Recepção de mensagens via webhook
- **Subgoal 1.2**: Processamento inteligente de mensagens
- **Subgoal 1.3**: Detecção de intenções com fallbacks
- **Subgoal 1.4**: Memória conversacional robusta

### **GOAL 2: LLM Orchestrator Próprio**
- **Subgoal 2.1**: **CORE**: Sistema próprio de detecção sem agente tools da OpenAI
- **Subgoal 2.2**: **CORE**: Roteamento inteligente de mensagens
- **Subgoal 2.3**: **CORE**: Fallbacks robustos em múltiplas camadas
- **Subgoal 2.4**: **CORE**: Integração direta com sistema de agendamento

### **GOAL 3: Humanização e Personalização**
- **Subgoal 3.1**: Temperatura dinâmica baseada no contexto
- **Subgoal 3.2**: Personalidade específica da clínica
- **Subgoal 3.3**: Detecção de emoção e emergências
- **Subgoal 3.4**: Escalação automática para humano

### **GOAL 4: Sistema de Memória e Contexto**
- **Subgoal 4.1**: Perfil do usuário persistente
- **Subgoal 4.2**: Histórico de conversas
- **Subgoal 4.3**: Contexto entre sessões
- **Subgoal 4.4**: Cache inteligente de conversas

---

## 📋 **REQUISITOS FUNCIONAIS DETALHADOS**

### **RF001 - Sistema de Conversação WhatsApp**
- **RF001.1**: Receber mensagens via webhook do WhatsApp Business API
- **RF001.2**: Sistema de verificação e controle de taxa de uso
- **RF001.3**: Armazenar histórico de conversas para análise
- **RF001.4**: Identificador único para cada conversa

### **RF002 - Processamento Inteligente de Mensagens**
- **RF002.1**: Usar modelo de linguagem avançado para compreensão
- **RF002.2**: Aplicar contexto específico da clínica em cada interação
- **RF002.3**: Detectar automaticamente o que o usuário deseja
- **RF002.4**: Sistema de recuperação quando o processamento principal falha
- **RF002.5**: Ajustar criatividade das respostas baseado no contexto

### **RF003 - Detecção de Intenções**
- **RF003.1**: **CORE**: Agendamento de consultas
- **RF003.2**: **CORE**: Reagendamento de consultas
- **RF003.3**: **CORE**: Cancelamento de consultas
- **RF003.4**: **CORE**: Listagem de agendamentos
- **RF003.5**: **CORE**: Informações sobre horários, localização, serviços
- **RF003.6**: **CORE**: Informações sobre profissionais e preços
- **RF003.7**: **CORE**: Saudações, despedidas e atendimento humano
- **RF003.8**: **CORE**: Sistema de fallback baseado em palavras-chave
- **RF003.9**: **CORE**: Extração automática de entidades (datas, horários, nomes)

### **RF004 - LLM Orchestrator Avançado**
- **RF004.1**: **CORE**: **CONTROLE TOTAL**: Sistema próprio de detecção e roteamento de intenções
- **RF004.2**: **CORE**: **ROTEAMENTO INTELIGENTE**: Direcionamento para serviços específicos
- **RF004.3**: **CORE**: **FALLBACKS ROBUSTOS**: Múltiplas camadas de fallback para garantir resposta
- **RF004.4**: **CORE**: **INTEGRAÇÃO COM FLUXO**: Conexão direta com sistema de agendamento
- **RF004.5**: **CORE**: **MEMÓRIA CONVERSACIONAL**: Manutenção de contexto entre mensagens
- **RF004.6**: **CORE**: **HUMANIZAÇÃO**: Aplicação de personalidade e tom específico da clínica

### **RF005 - Memória Conversacional**
- **RF005.1**: **CORE**: Lembrar e usar nome do usuário automaticamente
- **RF005.2**: **CORE**: Manter contexto das últimas interações
- **RF005.3**: **CORE**: Armazenar informações entre sessões
- **RF005.4**: **CORE**: Dados organizados para fácil recuperação

### **RF006 - Humanização das Respostas**
- **RF006.1**: **CORE**: Temperatura dinâmica baseada no contexto emocional
- **RF006.2**: **CORE**: Variações linguísticas para evitar repetição
- **RF006.3**: **CORE**: Formatação WhatsApp com emojis, negrito, itálico
- **RF006.4**: **CORE**: Detecção e resposta adequada a estados emocionais
- **RF006.5**: **CORE**: Respostas empáticas para usuários ansiosos
- **RF006.6**: **CORE**: Respostas diretas para emergências

### **RF007 - Roteamento Inteligente**
- **RF007.1**: **CORE**: Encaminhar usuários para o fluxo correto baseado na intenção
- **RF007.2**: **CORE**: Verificar disponibilidade dos sistemas antes do roteamento
- **RF007.3**: **CORE**: Fallbacks específicos para cada tipo de falha
- **RF007.4**: **CORE**: Todas as funcionalidades de agendamento roteadas corretamente

---

## 🔧 **REQUISITOS NÃO FUNCIONAIS**

### **RNF001 - Performance**
- **RNF001.1**: Webhook recebe mensagens em < 100ms
- **RNF001.2**: Sistema processa mensagem e detecta intenção em < 2s
- **RNF001.3**: Sistema suporta 100+ conversas simultâneas
- **RNF001.4**: Cache hit ratio > 90% para contextualizações

### **RNF002 - Disponibilidade e Resiliência**
- **RNF002.1**: Uptime > 99.5%
- **RNF002.2**: Recuperação automática de falhas em < 2 minutos
- **RNF002.3**: Circuit breakers para integrações externas
- **RNF002.4**: Fallbacks para todos os serviços críticos

### **RNF003 - Segurança**
- **RNF003.1**: Validação de webhooks do WhatsApp
- **RNF003.2**: Rate limiting por usuário/IP
- **RNF003.3**: Logs de auditoria para todas as conversas
- **RNF003.4**: Criptografia de dados sensíveis

---

## ✅ **CRITÉRIOS DE ACEITAÇÃO**

### **CA001 - Sistema de Conversação**
- [ ] **CRÍTICO**: Webhook recebe mensagens do WhatsApp em < 100ms
- [ ] **CRÍTICO**: Sistema processa mensagem e detecta intenção em < 2s
- [ ] **CRÍTICO**: **Contexto conversacional é mantido entre mensagens**
- [ ] **CRÍTICO**: **Sistema de fallback funciona quando processamento principal falha**
- [ ] **CRÍTICO**: **Respostas são humanizadas e contextualizadas**
- [ ] **CRÍTICO**: **Memória do usuário é persistida e recuperada corretamente**
- [ ] **CRÍTICO**: **Nome do usuário é extraído e usado automaticamente**

### **CA002 - LLM Orchestrator**
- [ ] **CRÍTICO**: **LLM Orchestrator controla intenções sem agente tools da OpenAI**
- [ ] **CRÍTICO**: **Sistema de roteamento inteligente funciona corretamente**
- [ ] **CRÍTICO**: **Fallbacks robustos garantem resposta em todas as situações**
- [ ] **CRÍTICO**: **Detecção de emoção funciona para personalização de respostas**
- [ ] **CRÍTICO**: **Detecção de emergências funciona para escalação automática**

### **CA003 - Detecção de Intenções**
- [ ] **CRÍTICO**: Todas as intenções de agendamento são detectadas
- [ ] **CRÍTICO**: Sistema de fallback funciona para intenções não claras
- [ ] **CRÍTICO**: Entidades são extraídas corretamente (datas, horários, nomes)
- [ ] **CRÍTICO**: Roteamento para fluxos corretos funciona

### **CA004 - Memória e Contexto**
- [ ] **CRÍTICO**: Perfil do usuário é mantido entre sessões
- [ ] **CRÍTICO**: Histórico de conversas é persistido
- [ ] **CRÍTICO**: Contexto é aplicado corretamente
- [ ] **CRÍTICO**: Cache melhora performance de respostas

---

## 🏗️ **ARQUITETURA TÉCNICA**

### **Estrutura do Serviço**
```
┌─────────────────────────────────────────────────────────────┐
│                CONVERSATION SERVICE                        │
├─────────────────┬─────────────────┬────────────────────────┤
│  WhatsApp       │  Message        │  LLM Orchestrator      │
│  Webhook        │  Processor      │  (Core System)         │
├─────────────────┼─────────────────┼────────────────────────┤
│  Intent         │  Memory         │  Response              │
│  Detector       │  Manager        │  Generator             │
├─────────────────┼─────────────────┼────────────────────────┤
│  Context        │  Fallback       │  Humanization          │
│  Manager        │  System         │  Engine                │
└─────────────────┴─────────────────┴────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    INTEGRATIONS                            │
├─────────────────┬─────────────────┬────────────────────────┤
│  Clinic         │  Appointment    │  WhatsApp              │
│  Service        │  Service        │  Business API          │
└─────────────────┴─────────────────┴────────────────────────┘
```

### **Endpoints Principais**
- **Webhook**: `/webhook/whatsapp`
- **Conversação**: `/api/conversation/process`
- **Contexto**: `/api/conversation/context`
- **Memória**: `/api/conversation/memory`

---

## 📝 **BREAKDOWN DE TAREFAS**

### **Tarefa 3.1: WhatsApp Webhook**
- [ ] **PENDING** - **Implementation**: Implementar webhook de recebimento
- [ ] **PENDING** - **Tests**: Testes de validação e rate limiting
- [ ] **PENDING** - **Documentation**: Documentar integração WhatsApp

### **Tarefa 3.2: LLM Orchestrator Core**
- [ ] **PENDING** - **Implementation**: **CORE**: Sistema próprio de detecção de intenções
- [ ] **PENDING** - **Tests**: **CORE**: Validar detecção sem agente tools OpenAI
- [ ] **PENDING** - **Documentation**: **CORE**: Documentar arquitetura do orchestrator

### **Tarefa 3.3: Sistema de Memória**
- [ ] **PENDING** - **Implementation**: **CORE**: Sistema de memória conversacional
- [ ] **PENDING** - **Tests**: **CORE**: Validar persistência e recuperação
- [ ] **PENDING** - **Documentation**: **CORE**: Documentar sistema de memória

### **Tarefa 3.4: Humanização e Personalização**
- [ ] **PENDING** - **Implementation**: **CORE**: Sistema de humanização de respostas
- [ ] **PENDING** - **Tests**: **CORE**: Validar personalidade da clínica
- [ ] **PENDING** - **Documentation**: **CORE**: Documentar sistema de humanização

### **Tarefa 3.5: Roteamento e Fallbacks**
- [ ] **PENDING** - **Implementation**: **CORE**: Sistema de roteamento inteligente
- [ ] **PENDING** - **Tests**: **CORE**: Validar fallbacks robustos
- [ ] **PENDING** - **Documentation**: **CORE**: Documentar sistema de roteamento

---

## 📊 **STATUS TRACKING**

### **Status Geral**
- **Status**: 🔴 PENDING
- **Início**: [Data a definir]
- **Fim**: [Data a definir]
- **Responsável**: [Nome do desenvolvedor]

### **Progresso por Tarefa**
- **Tarefa 3.1**: 🔴 PENDING
- **Tarefa 3.2**: 🔴 PENDING
- **Tarefa 3.3**: 🔴 PENDING
- **Tarefa 3.4**: 🔴 PENDING
- **Tarefa 3.5**: 🔴 PENDING

---

## 🚀 **CRITÉRIOS DE ENTREGA**

### **Entregável Considerado Pronto Quando**
- [ ] **CRÍTICO**: WhatsApp webhook funciona perfeitamente
- [ ] **CRÍTICO**: LLM Orchestrator detecta intenções sem agente tools OpenAI
- [ ] **CRÍTICO**: Sistema de memória mantém contexto entre mensagens
- [ ] **CRÍTICO**: Respostas são humanizadas e contextualizadas
- [ ] **CRÍTICO**: Sistema de fallbacks garante resposta em todas as situações
- [ ] **CRÍTICO**: Roteamento inteligente funciona corretamente
- [ ] Todos os testes passam
- [ ] Documentação está completa

### **Próximo Entregável**
- **Dependência**: Este entregável deve estar 100% funcional
- **Próximo**: Appointment Service + Sistema de Agendamento

---

## 🔍 **FUNCIONALIDADES CRÍTICAS DO LLM ORCHESTRATOR**

### **O que DEVE funcionar:**
- ✅ **CONTROLE TOTAL**: Sistema próprio de detecção sem agente tools da OpenAI
- ✅ **ROTEAMENTO INTELIGENTE**: Direcionamento para serviços específicos
- ✅ **FALLBACKS ROBUSTOS**: Múltiplas camadas de fallback
- ✅ **INTEGRAÇÃO DIRETA**: Conexão com Appointment Flow Manager
- ✅ **MEMÓRIA CONVERSACIONAL**: Manutenção de contexto
- ✅ **HUMANIZAÇÃO**: Aplicação de personalidade específica da clínica

### **O que NÃO deve usar:**
- ❌ Agente tools da OpenAI
- ❌ Dependências externas para detecção de intenções
- ❌ Sistemas de terceiros para roteamento

---

**Documento criado em**: {{ new Date().toISOString() }}  
**Versão**: 1.0.0  
**Status**: READY FOR IMPLEMENTATION  
**Entregável**: 03 - Conversation Service + LLM Orchestrator
