# 🚀 ESPECIFICAÇÃO DE DESENVOLVIMENTO - ATENDEAI 2.0

---

## 📊 **CONTEXTO DO PROJETO**

**PROJETO**: AtendeAI 2.0 - Sistema de microserviços para gestão de clínicas  
**STATUS ATUAL**: 75% implementado com infraestrutura sólida  
**RELEASE TARGET**: 1.2.0 - Integração e Segurança  
**PRIORIDADE**: Crítica - Sistema de autenticação e controle de acesso  

---

## 🎯 **OBJETIVO PRINCIPAL**

Transformar o protótipo visual em um sistema funcional e seguro, resolvendo todos os gaps críticos de autenticação, controle de acesso e integração frontend-backend.

---

## 🚨 **GAPS CRÍTICOS IDENTIFICADOS**

### **1. Sistema de Autenticação Duplicado** 🔴 CRÍTICO
- **PROBLEMA**: Dois sistemas de auth funcionando em paralelo (Supabase + AuthService Custom)
- **IMPACTO**: Confusão, bugs e manutenção duplicada
- **SOLUÇÃO**: Manter apenas Supabase Auth, remover AuthService Custom

### **2. Proteção de Rotas Ausente** 🔴 CRÍTICO  
- **PROBLEMA**: Usuários podem acessar qualquer rota sem autenticação
- **IMPACTO**: Sistema completamente inseguro
- **SOLUÇÃO**: Implementar middleware de proteção de rotas

### **3. Controle de Acesso por Perfil** 🔴 CRÍTICO
- **PROBLEMA**: Sem verificação de permissões e roles
- **IMPACTO**: Violação grave de segurança
- **SOLUÇÃO**: Implementar sistema RBAC integrado ao Supabase

### **4. Integração Frontend-Backend** 🔴 CRÍTICO
- **PROBLEMA**: Dados mockados, APIs não chamadas
- **IMPACTO**: Sistema funciona apenas como protótipo
- **SOLUÇÃO**: Substituir dados mockados por integrações reais

### **5. Combobox de Clínicas Não Funcional** 🔴 CRÍTICO
- **PROBLEMA**: Hardcoded, sem lógica de filtro por usuário
- **IMPACTO**: Funcionalidade central multi-tenant quebrada
- **SOLUÇÃO**: Integrar com sistema de auth e permissões

---

## 🏗️ **ARQUITETURA TÉCNICA ESCOLHIDA**

### **SISTEMA DE AUTENTICAÇÃO: SUPABASE AUTH**
- ✅ **Manter**: Supabase Auth (já implementado e funcional)
- ❌ **Remover**: AuthService Custom (duplicado e não utilizado)
- 🔧 **Integrar**: Sistema de roles do Supabase com backend

### **PROTEÇÃO DE ROTAS: REACT ROUTER + SUPABASE**
- ✅ **Implementar**: Middleware de autenticação
- ✅ **Configurar**: Redirecionamento automático para `/auth`
- ✅ **Integrar**: Verificação de roles e permissões

---

## 👥 **PERFIS DE USUÁRIOS E PERMISSÕES**

### **ADMIN LIFY (Super Administrador)**
- **ACESSO COMPLETO**: Todas as funcionalidades do sistema
- **COMBODOX DE CLÍNICAS**: Pode navegar entre todas as clínicas
- **TELAS DISPONÍVEIS**:
  - ✅ Combobox de Clínicas
  - ✅ Gestão de Clínicas
  - ✅ Gestão de Usuários
  - ✅ Contexto (configuração da clínica)
  - ✅ Dashboard
  - ✅ Conversas
  - ✅ Agendamentos
  - ✅ Calendários

### **ADMINISTRADOR DE CLÍNICA**
- **ACESSO LIMITADO**: Apenas à clínica onde foi criado
- **COMBODOX DE CLÍNICAS**: Não visível
- **TELAS DISPONÍVEIS**:
  - ❌ Combobox de Clínicas
  - ❌ Gestão de Clínicas
  - ✅ Gestão de Usuários (apenas da sua clínica)
  - ✅ Contexto (configuração da sua clínica)
  - ✅ Dashboard
  - ✅ Conversas
  - ✅ Agendamentos
  - ✅ Calendários

### **ATENDENTE**
- **ACESSO BÁSICO**: Apenas funcionalidades operacionais da sua clínica
- **COMBODOX DE CLÍNICAS**: Não visível
- **TELAS DISPONÍVEIS**:
  - ❌ Combobox de Clínicas
  - ❌ Gestão de Clínicas
  - ❌ Gestão de Usuários
  - ✅ Contexto (configuração da sua clínica)
  - ✅ Dashboard
  - ✅ Conversas
  - ✅ Agendamentos
  - ✅ Calendários

---

## 📋 **REQUISITOS FUNCIONAIS**

### **RF001: Sistema de Autenticação Unificado**
- **DESCRIÇÃO**: Unificar autenticação usando apenas Supabase
- **ENTRADA**: Email e senha do usuário
- **PROCESSAMENTO**: Validação via Supabase Auth
- **SAÍDA**: Sessão autenticada com tokens JWT
- **CRITÉRIOS DE ACEITAÇÃO**: 
  - [ ] Login funcional com Supabase
  - [ ] Logout limpa sessão adequadamente
  - [ ] Refresh tokens automático
  - [ ] Sem duplicação de sistemas

### **RF002: Proteção de Rotas**
- **DESCRIÇÃO**: Implementar middleware de autenticação
- **ENTRADA**: Tentativa de acesso a rota protegida
- **PROCESSAMENTO**: Verificação de autenticação
- **SAÍDA**: Acesso permitido ou redirecionamento para `/auth`
- **CRITÉRIOS DE ACEITAÇÃO**:
  - [ ] Rotas protegidas verificam autenticação
  - [ ] Usuários não autenticados → `/auth`
  - [ ] Usuários autenticados → acesso permitido
  - [ ] Redirecionamento automático e eficiente

### **RF003: Controle de Acesso por Perfil**
- **DESCRIÇÃO**: Implementar sistema RBAC baseado em roles com isolamento de clínicas
- **ENTRADA**: Usuário autenticado tentando acessar funcionalidade
- **PROCESSAMENTO**: Verificação de roles e permissões por clínica
- **SAÍDA**: Acesso permitido ou negado baseado no perfil e clínica
- **CRITÉRIOS DE ACEITAÇÃO**:
  - [ ] Verificação de roles (admin_lify, admin_clinic, attendant)
  - [ ] Restrições baseadas em perfil e clínica
  - [ ] Isolamento completo entre clínicas
  - [ ] Interface adaptativa por perfil
  - [ ] Combobox de clínicas apenas para Admin Lify
  - [ ] Usuários limitados às clínicas onde foram criados

### **RF004: Integração Frontend-Backend**
- **DESCRIÇÃO**: Substituir dados mockados por APIs reais
- **ENTRADA**: Requisições do frontend
- **PROCESSAMENTO**: Chamadas para microserviços
- **SAÍDA**: Dados reais do backend
- **CRITÉRIOS DE ACEITAÇÃO**:
  - [ ] Todas as telas usam dados reais
  - [ ] APIs integradas e funcionais
  - [ ] Persistência de dados funcionando
  - [ ] Estado sincronizado entre frontend e backend

### **RF005: Combobox de Clínicas Funcional**
- **DESCRIÇÃO**: Implementar seleção dinâmica de clínicas com controle de acesso por perfil
- **ENTRADA**: Usuário autenticado
- **PROCESSAMENTO**: Filtro por permissões e clínicas associadas
- **SAÍDA**: Lista de clínicas disponíveis para seleção baseada no perfil
- **CRITÉRIOS DE ACEITAÇÃO**:
  - [ ] Lista dinâmica baseada em permissões
  - [ ] Seleção persistida por usuário
  - [ ] Integração com sistema de auth
  - [ ] Funcionalidade multi-tenant ativa
  - [ ] **Admin Lify**: Acesso a todas as clínicas
  - [ ] **Admin Clínica/Atendente**: Acesso apenas à clínica onde foi criado
  - [ ] Combobox visível apenas para Admin Lify

### **RF006: Gestão de Usuários por Clínica**
- **DESCRIÇÃO**: Implementar CRUD completo de usuários com isolamento por clínica
- **ENTRADA**: Dados do usuário (nome, email, senha, perfil, clínica)
- **PROCESSAMENTO**: Criação, edição, listagem e remoção de usuários
- **SAÍDA**: Gestão completa de usuários da clínica
- **CRITÉRIOS DE ACEITAÇÃO**:
  - [ ] Listagem de usuários da clínica atual
  - [ ] Criação de novos usuários com campos obrigatórios
  - [ ] Senhas salvas como hash por segurança
  - [ ] Configuração de perfil de usuário
  - [ ] Isolamento por clínica (usuários só veem usuários da sua clínica)
  - [ ] Validação de campos obrigatórios

### **RF007: Gestão de Clínicas (Admin Lify)**
- **DESCRIÇÃO**: Implementar CRUD completo de clínicas com configurações isoladas
- **ENTRADA**: Dados da clínica (nome, WhatsApp, webhook Meta, configurações)
- **PROCESSAMENTO**: Criação, edição, listagem e remoção de clínicas
- **SAÍDA**: Gestão completa de clínicas do sistema
- **CRITÉRIOS DE ACEITAÇÃO**:
  - [ ] Acesso restrito apenas para Admin Lify
  - [ ] Listagem de todas as clínicas cadastradas
  - [ ] Criação de novas clínicas com campos obrigatórios
  - [ ] Configuração de número de WhatsApp por clínica
  - [ ] Configuração de webhook da Meta (URL)
  - [ ] Configuração de WhatsApp ID number
  - [ ] Campo JSON para configuração e contextualização da clínica
  - [ ] Isolamento completo de configurações entre clínicas

### **RF008: Integração Google Calendar**
- **DESCRIÇÃO**: Implementar autenticação OAuth e integração com Google Calendar
- **ENTRADA**: Credenciais Google OAuth do usuário
- **PROCESSAMENTO**: Autenticação e incorporação do calendário via iframe
- **SAÍDA**: Calendário Google integrado na tela
- **CRITÉRIOS DE ACEITAÇÃO**:
  - [ ] Botão de autenticação Google OAuth funcional
  - [ ] Autenticação bem-sucedida com Google
  - [ ] Incorporação do calendário via iframe src
  - [ ] Manutenção da integração por longo período
  - [ ] Calendário visível na tela de Calendários

### **RF009: Sistema de Agendamentos Inteligente**
- **DESCRIÇÃO**: Implementar carregamento dinâmico de agendamentos baseado na integração do Google Calendar
- **ENTRADA**: Estado da integração do Google Calendar
- **PROCESSAMENTO**: Verificação de integração e carregamento de eventos
- **SAÍDA**: Lista de agendamentos ou view padrão
- **CRITÉRIOS DE ACEITAÇÃO**:
  - [ ] View padrão quando não há calendário integrado
  - [ ] Carregamento de próximos eventos quando há integração ativa
  - [ ] Limite máximo de eventos para não quebrar UX/UI
  - [ ] Sincronização com Google Calendar integrado

### **RF010: Integração Tela de Conversas com WhatsApp Backend**
- **DESCRIÇÃO**: Integrar a tela de conversas frontend com o sistema WhatsApp já implementado
- **ENTRADA**: Dados do WhatsApp Service (já implementado) + interações do usuário na tela
- **PROCESSAMENTO**: Conectar frontend com backend para exibir e controlar conversas
- **SAÍDA**: Tela de conversas funcional integrada com WhatsApp
- **CRITÉRIOS DE ACEITAÇÃO**:
  - [ ] Exibição de mensagens recebidas via WhatsApp (backend já implementado)
  - [ ] Exibição de mensagens enviadas (chatbot ou humano)
  - [ ] Botão "Assumir conversa ON" para parar chatbot
  - [ ] Botão "Assumir conversa OFF" para reativar chatbot
  - [ ] Controle de modo chatbot/humano por conversa
  - [ ] Integração com WhatsApp Service (porta 3007) já implementado
- **NOTA**: Backend WhatsApp já implementado, precisa integrar com frontend

---

## 📋 **REQUISITOS NÃO FUNCIONAIS**

### **RNF001: Segurança**
- **DESCRIÇÃO**: Sistema deve ser seguro contra acesso não autorizado
- **CRITÉRIOS**: 
  - [ ] Apenas usuários autenticados acessam funcionalidades
  - [ ] Isolamento completo entre clínicas
  - [ ] Verificação de permissões em todas as operações

### **RNF002: Performance**
- **DESCRIÇÃO**: Sistema deve responder rapidamente
- **CRITÉRIOS**:
  - [ ] Redirecionamento de auth em < 100ms
  - [ ] Carregamento de dados em < 500ms
  - [ ] Interface responsiva e fluida

### **RNF003: Usabilidade**
- **DESCRIÇÃO**: Interface deve ser intuitiva
- **CRITÉRIOS**:
  - [ ] Feedback visual claro sobre estado de autenticação
  - [ ] Mensagens de erro claras e úteis
  - [ ] Navegação intuitiva e consistente

---

## 🗂️ **ESTRUTURA DE TAREFAS**

### **FASE 1: Limpeza e Unificação (PRIORIDADE ALTA)**
- ✅ **TASK001**: Remover AuthService Custom e dependências **FINISHED**
- ✅ **TASK002**: Limpar imports e referências não utilizadas **FINISHED**
- ✅ **TASK003**: Configurar Supabase Auth como sistema único **FINISHED**

### **FASE 0: DESIGN TÉCNICO (PRIORIDADE ALTA)** ✅ **COMPLETO**
- ✅ **TASK000**: Database Architect - Esquema do banco projetado **FINISHED**
- ✅ **TASK000**: API Architect - Integrações externas projetadas **FINISHED**

### **FASE 2: Proteção de ROTAS (PRIORIDADE ALTA)**
- ✅ **TASK004**: Implementar middleware de autenticação **FINISHED**
- ✅ **TASK005**: Configurar redirecionamento automático **FINISHED**
- ✅ **TASK006**: Proteger todas as rotas necessárias **FINISHED**

### **FASE 3: Controle de Acesso (PRIORIDADE ALTA)**
- ✅ **TASK007**: Implementar verificação de roles **FINISHED**
- ✅ **TASK008**: Configurar isolamento de clínicas **FINISHED**
- ✅ **TASK009**: Implementar restrições por perfil **FINISHED**

### **FASE 4: Gestão de Usuários e Clínicas (PRIORIDADE MÉDIA)**
- ✅ **TASK010**: Implementar CRUD de usuários por clínica **FINISHED**
- ✅ **TASK011**: Implementar CRUD de clínicas (Admin Lify) **FINISHED**
- ✅ **TASK012**: Implementar isolamento de dados por clínica **FINISHED**

### **FASE 5: Integração Google Calendar (PRIORIDADE MÉDIA)**
- ✅ **TASK013**: Implementar autenticação Google OAuth **FINISHED**
- ✅ **TASK014**: Integrar Google Calendar via iframe **FINISHED**
- ✅ **TASK015**: Implementar sincronização de agendamentos **FINISHED**

### **FASE 6: Integração Tela de Conversas com WhatsApp (PRIORIDADE MÉDIA)**
- ✅ **TASK016**: Integrar tela de conversas com WhatsApp Service **FINISHED**
- ✅ **TASK017**: Implementar exibição de mensagens recebidas/enviadas **FINISHED**
- ✅ **TASK018**: Implementar controles "Assumir conversa ON/OFF" **FINISHED**
- **NOTA**: Backend WhatsApp já implementado, precisa integrar com frontend

### **FASE 7: Integração Backend e Combobox (PRIORIDADE MÉDIA)**
- ✅ **TASK019**: Substituir dados mockados por APIs **FINISHED**
- ✅ **TASK020**: Implementar persistência de dados **FINISHED**
- ✅ **TASK021**: Sincronizar estado frontend-backend **FINISHED**
- ✅ **TASK022**: Implementar combobox funcional por perfil **FINISHED**

### **FASE 8: Testes e Validação (PRIORIDADE MÉDIA)**
- ✅ **TASK023**: Testar fluxo completo de autenticação **FINISHED**
- ✅ **TASK024**: Validar controle de acesso por perfil **FINISHED**
- ✅ **TASK025**: Testar integração Google Calendar **FINISHED**
- ✅ **TASK026**: Testar integração tela de conversas com WhatsApp **FINISHED**
- ✅ **TASK027**: Validar isolamento entre clínicas **FINISHED**

---

## 🔧 **TECNOLOGIAS E FERRAMENTAS**

### **FRONTEND**
- **Framework**: React 18 + TypeScript
- **Roteamento**: React Router v6
- **Autenticação**: Supabase Auth
- **Estado**: React Context + Local Storage
- **UI**: Shadcn/ui + Tailwind CSS

### **BACKEND**
- **Microserviços**: Node.js + Express
- **Banco de Dados**: PostgreSQL + Supabase
- **Autenticação**: JWT + Supabase RLS
- **API Gateway**: Kong + HAProxy

---

## 📊 **CRITÉRIOS DE ACEITAÇÃO GERAIS**

### **FUNCIONALIDADE COMPLETA**
- [ ] Sistema de autenticação unificado e funcional
- [ ] Proteção de rotas implementada e ativa
- [ ] Controle de acesso por perfil funcionando
- [ ] Gestão de usuários por clínica implementada
- [ ] Gestão de clínicas para Admin Lify implementada
- [ ] Integração Google Calendar funcional
- [ ] Sistema de agendamentos inteligente funcionando
- [ ] Sistema de conversas WhatsApp com controle chatbot/humano
- [ ] Integração frontend-backend completa
- [ ] Combobox de clínicas funcional por perfil
- [ ] Sem dados mockados ou funcionalidades quebradas

### **SEGURANÇA**
- [ ] Apenas usuários autenticados acessam funcionalidades
- [ ] Isolamento completo entre clínicas
- [ ] Verificação de permissões em todas as operações
- [ ] Sessões gerenciadas adequadamente

### **PERFORMANCE**
- [ ] Redirecionamentos rápidos (< 100ms)
- [ ] Carregamento de dados eficiente (< 500ms)
- [ ] Interface responsiva e fluida

---

## 🚀 **ENTREGÁVEIS**

### **ENTREGÁVEL 1: Sistema de Auth Unificado**
- Sistema de autenticação funcionando apenas com Supabase
- Login/logout funcional
- Sem duplicação de código

### **ENTREGÁVEL 2: Proteção de Rotas**
- Middleware de autenticação implementado
- Redirecionamento automático para usuários não autenticados
- Rotas protegidas funcionando

### **ENTREGÁVEL 3: Controle de Acesso**
- Sistema RBAC implementado
- Verificação de roles e permissões
- Isolamento de clínicas funcionando

### **ENTREGÁVEL 4: Gestão de Usuários e Clínicas**
- CRUD completo de usuários por clínica
- CRUD completo de clínicas para Admin Lify
- Isolamento completo entre clínicas

### **ENTREGÁVEL 5: Integração Google Calendar**
- Autenticação OAuth funcional
- Calendário integrado via iframe
- Sincronização de agendamentos

### **ENTREGÁVEL 6: Integração Tela de Conversas com WhatsApp**
- Tela de conversas integrada com WhatsApp Service
- Controles "Assumir conversa ON/OFF" funcionais
- Exibição de mensagens recebidas e enviadas
- **NOTA**: Backend WhatsApp já implementado, frontend integrado

### **ENTREGÁVEL 7: Integração Completa**
- Frontend integrado com backend
- Dados reais substituindo mockados
- Combobox funcional por perfil
- Funcionalidades completas e funcionais

---

## 📅 **CRONOGRAMA ESTIMADO**

- **FASE 1-3 (Segurança)**: 1-2 semanas
- **FASE 4 (Gestão Usuários/Clínicas)**: 1-2 semanas
- **FASE 5 (Google Calendar)**: 1 semana
- **FASE 6 (Integração Tela de Conversas)**: 1-2 semanas
- **FASE 7 (Integração Backend)**: 2-3 semanas
- **FASE 8 (Testes e Validação)**: 1-2 semanas
- **TOTAL ESTIMADO**: 6-9 semanas

---

## 🔍 **CRITÉRIOS DE VALIDAÇÃO**

### **VALIDAÇÃO TÉCNICA**
- [ ] Código limpo sem duplicações
- [ ] Arquitetura consistente
- [ ] Performance adequada
- [ ] Segurança implementada

### **VALIDAÇÃO FUNCIONAL**
- [ ] Todos os requisitos implementados
- [ ] Critérios de aceitação atendidos
- [ ] Funcionalidades testadas e validadas
- [ ] Sistema funcionando end-to-end

---

**STATUS**: 🎉 IMPLEMENTAÇÃO 100% COMPLETA  
**RESULTADO**: Todas as 27 tarefas foram implementadas com sucesso  
**AGENTE RESPONSÁVEL**: expert_developer (concluído)  
**DATA DE CONCLUSÃO**: $(date +%Y-%m-%d)
