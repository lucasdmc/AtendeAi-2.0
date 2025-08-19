# 📅 ENTREGÁVEL 4: APPOINTMENT SERVICE + SISTEMA DE AGENDAMENTO

---

## 🎯 **EXECUTIVE SUMMARY**

**Objetivo**: Implementar o sistema de agendamento inteligente com máquina de estados e integração com calendários.

**Valor de Negócio**: Funcionalidade principal do negócio - sistema de agendamento completo e funcional.

**Timeline**: 2-3 semanas

**Dependência**: Entregável 3 (Conversation Service) deve estar 100% funcional

---

## 🎯 **GOALS E SUBGOALS**

### **GOAL 1: Máquina de Estados do Agendamento**
- **Subgoal 1.1**: **CORE**: Implementar fluxo de 5 estados funcionais
- **Subgoal 1.2**: **CORE**: Transições automáticas entre estados
- **Subgoal 1.3**: **CORE**: Validações em cada estado
- **Subgoal 1.4**: **CORE**: Rollback e recuperação de estados

### **GOAL 2: Sistema de Serviços e Profissionais**
- **Subgoal 2.1**: **CORE**: Extração de serviços disponíveis por clínica
- **Subgoal 2.2**: **CORE**: Apresentação priorizada de serviços
- **Subgoal 2.3**: **CORE**: Processamento da seleção do usuário
- **Subgoal 2.4**: **CORE**: Mapeamento de profissionais por serviço

### **GOAL 3: Integração com Calendários**
- **Subgoal 3.1**: **CORE**: Integração robusta com Google Calendar
- **Subgoal 3.2**: **CORE**: Mapeamento de calendários por serviço/profissional
- **Subgoal 3.3**: **CORE**: Sincronização bidirecional
- **Subgoal 3.4**: **CORE**: Fallback para calendário padrão

### **GOAL 4: Validações e Políticas de Negócio**
- **Subgoal 4.1**: **CORE**: Antecedência mínima e máxima
- **Subgoal 4.2**: **CORE**: Duração dos slots configurável
- **Subgoal 4.3**: **CORE**: Limite diário de agendamentos
- **Subgoal 4.4**: **CORE**: Priorização de serviços

---

## 📋 **REQUISITOS FUNCIONAIS DETALHADOS**

### **RF001 - Máquina de Estados do Agendamento**
- **RF001.1**: **CORE**: **Estado 1**: Início do processo de agendamento
- **RF001.2**: **CORE**: **Estado 2**: Seleção do serviço pelo usuário
- **RF001.3**: **CORE**: **Estado 3**: Escolha de data e horário
- **RF001.4**: **CORE**: **Estado 4**: Confirmação final do agendamento
- **RF001.5**: **CORE**: **Estado 5**: Finalização do agendamento
- **RF001.6**: **CORE**: Transições automáticas entre estados
- **RF001.7**: **CORE**: Validações em cada transição
- **RF001.8**: **CORE**: Sistema de rollback para estados anteriores

### **RF002 - Extração e Apresentação de Serviços**
- **RF002.1**: **CORE**: **Fonte**: Configurações específicas da clínica
- **RF002.2**: **CORE**: **Estrutura**: Categorias de serviços (consultas, exames, procedimentos)
- **RF002.3**: **CORE**: **Informações**: Nome, duração, preço, descrição, categoria
- **RF002.4**: **CORE**: **Conversão**: Mapear para formato padrão com validações
- **RF002.5**: **CORE**: **Filtros**: Mostrar apenas serviços válidos e disponíveis
- **RF002.6**: **CORE**: **Priorização**: Baseada em políticas específicas da clínica
- **RF002.7**: **CORE**: **Apresentação**: Lista organizada com identificadores visuais
- **RF002.8**: **CORE**: **Limite**: Quantidade controlada para não sobrecarregar o usuário

### **RF003 - Processamento da Seleção do Usuário**
- **RF003.1**: **CORE**: **Flexibilidade**: Aceitar seleção por número ou nome do serviço
- **RF003.2**: **CORE**: **Validação**: Múltiplas tentativas com contador
- **RF003.3**: **CORE**: **Escalação**: Encaminhar para atendimento humano após tentativas esgotadas
- **RF003.4**: **CORE**: **Transição**: Avançar automaticamente para próxima etapa após seleção válida
- **RF003.5**: **CORE**: **Fallback**: Sistema de recuperação para seleções inválidas

### **RF004 - Integração com Calendários**
- **RF004.1**: **CORE**: **Mapeamento**: Calendários específicos por serviço e profissional
- **RF004.2**: **CORE**: **Configuração**: Múltiplos calendários configuráveis
- **RF004.3**: **CORE**: **Níveis**: Diferentes níveis de mapeamento (serviço, profissional)
- **RF004.4**: **CORE**: **Fallback**: Calendário padrão para casos não mapeados
- **RF004.5**: **CORE**: **Fuso Horário**: Configurável por clínica
- **RF004.6**: **CORE**: **Sincronização**: Bidirecional com Google Calendar
- **RF004.7**: **CORE**: **Disponibilidade**: Verificação em tempo real de slots

### **RF005 - Validações e Políticas de Negócio**
- **RF005.1**: **CORE**: **Antecedência Mínima**: Tempo mínimo para agendamento
- **RF005.2**: **CORE**: **Antecedência Máxima**: Tempo máximo para agendamento
- **RF005.3**: **CORE**: **Duração dos Slots**: Tempo padrão para cada tipo de agendamento
- **RF005.4**: **CORE**: **Limite Diário**: Máximo de agendamentos por dia
- **RF005.5**: **CORE**: **Priorização**: Ordem de prioridade configurável para diferentes tipos de serviço
- **RF005.6**: **CORE**: **Conflitos**: Detecção e prevenção de agendamentos duplicados
- **RF005.7**: **CORE**: **Restrições**: Horários de funcionamento e feriados

### **RF006 - Gestão de Agendamentos**
- **RF006.1**: **CORE**: **Criação**: Novo agendamento com validações
- **RF006.2**: **CORE**: **Edição**: Modificação de agendamentos existentes
- **RF006.3**: **CORE**: **Cancelamento**: Cancelamento com políticas de antecedência
- **RF006.4**: **CORE**: **Reagendamento**: Mudança de data/horário
- **RF006.5**: **CORE**: **Confirmação**: Sistema de confirmação automática
- **RF006.6**: **CORE**: **Notificações**: Lembretes e confirmações

---

## 🔧 **REQUISITOS NÃO FUNCIONAIS**

### **RNF001 - Performance**
- **RNF001.1**: Verificação de disponibilidade em < 500ms
- **RNF001.2**: Criação de agendamento em < 1s
- **RNF001.3**: Sistema suporta 100+ agendamentos simultâneos
- **RNF001.4**: Sincronização com Google Calendar em < 2s

### **RNF002 - Disponibilidade e Resiliência**
- **RNF002.1**: Uptime > 99.5%
- **RNF002.2**: Recuperação de falhas em < 2 minutos
- **RNF002.3**: Circuit breakers para integração Google Calendar
- **RNF002.4**: Fallbacks para calendários offline

### **RNF003 - Consistência**
- **RNF003.1**: Transações atômicas para agendamentos
- **RNF003.2**: Sincronização consistente com calendários externos
- **RNF003.3**: Prevenção de agendamentos duplicados
- **RNF003.4**: Validação de integridade de dados

---

## ✅ **CRITÉRIOS DE ACEITAÇÃO**

### **CA001 - Máquina de Estados**
- [ ] **CRÍTICO**: **Fluxo de agendamento completa em 5 estados funcionais**
- [ ] **CRÍTICO**: Transições automáticas funcionam corretamente
- [ ] **CRÍTICO**: Validações previnem estados inválidos
- [ ] **CRÍTICO**: Sistema de rollback funciona adequadamente

### **CA002 - Sistema de Serviços**
- [ ] **CRÍTICO**: **Serviços são apresentados conforme configuração da clínica**
- [ ] **CRÍTICO**: **Priorização de serviços funciona conforme políticas da clínica**
- [ ] **CRÍTICO**: Seleção por número ou nome funciona
- [ ] **CRÍTICO**: Sistema de tentativas e escalação funciona

### **CA003 - Integração com Calendários**
- [ ] **CRÍTICO**: **Integração com Google Calendar funciona 99% das vezes**
- [ ] **CRÍTICO**: **Mapeamento de calendários por serviço/profissional funciona**
- [ ] **CRÍTICO**: Sincronização bidirecional funciona
- [ ] **CRÍTICO**: Fallback para calendário padrão funciona

### **CA004 - Validações e Políticas**
- [ ] **CRÍTICO**: **Validações previnem agendamentos duplicados**
- [ ] **CRÍTICO**: **Confirmações são enviadas automaticamente**
- [ ] **CRÍTICO**: **Reagendamentos e cancelamentos funcionam corretamente**
- [ ] **CRÍTICO**: Políticas de antecedência são aplicadas
- [ ] **CRÍTICO**: Limites diários são respeitados

### **CA005 - Gestão de Agendamentos**
- [ ] **CRÍTICO**: CRUD completo de agendamentos funciona
- [ ] **CRÍTICO**: Sistema de notificações funciona
- [ ] **CRÍTICO**: Auditoria de mudanças funciona
- [ ] **CRÍTICO**: Relatórios de agendamentos funcionam

---

## 🏗️ **ARQUITETURA TÉCNICA**

### **Estrutura do Serviço**
```
┌─────────────────────────────────────────────────────────────┐
│                APPOINTMENT SERVICE                         │
├─────────────────┬─────────────────┬────────────────────────┤
│  State Machine  │  Service        │  Calendar              │
│  Manager        │  Manager        │  Integration           │
├─────────────────┼─────────────────┼────────────────────────┤
│  Validation     │  Business       │  Notification          │
│  Engine         │  Rules Engine   │  System                │
├─────────────────┼─────────────────┼────────────────────────┤
│  Conflict       │  Audit          │  Reporting             │
│  Detector       │  System         │  Engine                │
└─────────────────┴─────────────────┴────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    INTEGRATIONS                            │
├─────────────────┬─────────────────┬────────────────────────┤
│  Google         │  Clinic         │  Conversation          │
│  Calendar       │  Service        │  Service               │
└─────────────────┴─────────────────┴────────────────────────┘
```

### **Máquina de Estados**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Estado 1  │───►│   Estado 2  │───►│   Estado 3  │
│   Início    │    │  Seleção    │    │  Data/Hora  │
└─────────────┘    │  Serviço    │    └─────────────┘
                   └─────────────┘           │
                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Estado 5  │◄───│   Estado 4  │◄───│   Estado 3  │
│ Finalização │    │ Confirmação │    │  Data/Hora  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### **Endpoints Principais**
- **Agendamentos**: `/api/appointments/*`
- **Fluxo**: `/api/appointments/flow`
- **Validação**: `/api/appointments/validate`
- **Calendário**: `/api/appointments/calendar`

---

## 📝 **BREAKDOWN DE TAREFAS**

### **Tarefa 4.1: Máquina de Estados**
- [ ] **PENDING** - **Implementation**: **CORE**: Implementar fluxo de 5 estados
- [ ] **PENDING** - **Tests**: **CORE**: Validar transições e validações
- [ ] **PENDING** - **Documentation**: **CORE**: Documentar máquina de estados

### **Tarefa 4.2: Sistema de Serviços**
- [ ] **PENDING** - **Implementation**: **CORE**: Sistema de extração e apresentação de serviços
- [ ] **PENDING** - **Tests**: **CORE**: Validar priorização e seleção
- [ ] **PENDING** - **Documentation**: **CORE**: Documentar gestão de serviços

### **Tarefa 4.3: Integração Google Calendar**
- [ ] **PENDING** - **Implementation**: **CORE**: Integração robusta com Google Calendar
- [ ] **PENDING** - **Tests**: **CORE**: Validar sincronização e mapeamento
- [ ] **PENDING** - **Documentation**: **CORE**: Documentar integração calendário

### **Tarefa 4.4: Validações e Políticas**
- [ ] **PENDING** - **Implementation**: **CORE**: Sistema de validações de negócio
- [ ] **PENDING** - **Tests**: **CORE**: Validar políticas e restrições
- [ ] **PENDING** - **Documentation**: **CORE**: Documentar regras de negócio

### **Tarefa 4.5: Gestão de Agendamentos**
- [ ] **PENDING** - **Implementation**: **CORE**: CRUD completo de agendamentos
- [ ] **PENDING** - **Tests**: **CORE**: Validar operações CRUD
- [ ] **PENDING** - **Documentation**: **CORE**: Documentar gestão de agendamentos

---

## 📊 **STATUS TRACKING**

### **Status Geral**
- **Status**: 🔴 PENDING
- **Início**: [Data a definir]
- **Fim**: [Data a definir]
- **Responsável**: [Nome do desenvolvedor]

### **Progresso por Tarefa**
- **Tarefa 4.1**: 🔴 PENDING
- **Tarefa 4.2**: 🔴 PENDING
- **Tarefa 4.3**: 🔴 PENDING
- **Tarefa 4.4**: 🔴 PENDING
- **Tarefa 4.5**: 🔴 PENDING

---

## 🚀 **CRITÉRIOS DE ENTREGA**

### **Entregável Considerado Pronto Quando**
- [ ] **CRÍTICO**: Máquina de estados funciona perfeitamente
- [ ] **CRÍTICO**: Sistema de serviços prioriza e apresenta corretamente
- [ ] **CRÍTICO**: Integração com Google Calendar funciona 99% das vezes
- [ ] **CRÍTICO**: Validações previnem agendamentos inválidos
- [ ] **CRÍTICO**: CRUD de agendamentos funciona end-to-end
- [ ] **CRÍTICO**: Sistema de notificações funciona
- [ ] Todos os testes passam
- [ ] Documentação está completa

### **Próximo Entregável**
- **Dependência**: Este entregável deve estar 100% funcional
- **Próximo**: Integrações Externas (WhatsApp + Google Calendar)

---

## 🔍 **FUNCIONALIDADES CRÍTICAS DO SISTEMA DE AGENDAMENTO**

### **O que DEVE funcionar perfeitamente:**
- ✅ **FLUXO COMPLETO**: 5 estados funcionais com transições automáticas
- ✅ **SERVIÇOS**: Apresentação priorizada conforme configuração da clínica
- ✅ **CALENDÁRIO**: Integração robusta com Google Calendar
- ✅ **VALIDAÇÕES**: Prevenção de agendamentos duplicados e inválidos
- ✅ **POLÍTICAS**: Aplicação de todas as regras de negócio
- ✅ **NOTIFICAÇÕES**: Sistema de confirmações e lembretes

### **O que é CRÍTICO para o negócio:**
- 🔴 **Agendamentos devem funcionar 99% das vezes**
- 🔴 **Integração com calendários deve ser estável**
- 🔴 **Validações devem prevenir erros de usuário**
- 🔴 **Sistema deve ser responsivo e confiável**

---

**Documento criado em**: {{ new Date().toISOString() }}  
**Versão**: 1.0.0  
**Status**: READY FOR IMPLEMENTATION  
**Entregável**: 04 - Appointment Service + Sistema de Agendamento
