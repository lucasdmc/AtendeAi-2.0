# Especificação do Sistema AtendeAí 2.0

## Visão Geral
Sistema de gestão de clínicas médicas com agenda própria, sem dependências externas de Google Auth ou Google Calendar.

## Funcionalidades Principais

### 1. Autenticação e Autorização
- Login/logout de usuários
- Controle de acesso baseado em perfis (AdminLify, AdminClinic, User)
- Gestão de permissões por clínica

### 2. Gestão de Clínicas
- CRUD completo de clínicas
- Seleção de clínica ativa
- Configurações específicas por clínica

### 3. Gestão de Usuários
- CRUD de usuários
- Associação usuário-clínica
- Controle de permissões

### 4. Agenda Própria (Nova Funcionalidade)
- Visualização de agenda em calendário
- Criação, edição e exclusão de agendamentos
- Gestão de horários disponíveis
- Notificações de agendamentos

### 5. Gestão de Conversas
- Chat integrado para comunicação
- Histórico de conversas
- Suporte a múltiplos canais

## Arquitetura Técnica

### Frontend
- React 18 + TypeScript
- Vite como bundler
- Tailwind CSS para estilização
- Componentes reutilizáveis

### Backend
- Node.js com Express
- Supabase como banco de dados
- Serviços modulares (auth, clinic, user, conversation, appointment)

### Banco de Dados
- PostgreSQL via Supabase
- Tabelas: users, clinics, appointments, conversations, permissions

## Requisitos Não Funcionais
- Build sem erros de runtime
- Interface responsiva
- Performance adequada
- Segurança de dados

## Remoções Necessárias
- Integração Google Auth
- Integração Google Calendar
- Serviços externos desnecessários
- Dependências de process.env no frontend
