# Especificação do Sistema AtendeAí 2.0

## Visão Geral
Sistema de gestão de clínicas médicas com agenda própria, autenticação unificada e WhatsApp multi-clínica.

## Requisitos Funcionais

### REQ-001: Sistema de Autenticação Unificado
**Descrição**: Implementar sistema de autenticação único usando Supabase Auth
**Prioridade**: high
**Status**: pending
**Critérios de Aceitação**:
- Remover AuthService Custom completamente
- Manter apenas Supabase Auth
- Implementar middleware de proteção de rotas
- Configurar redirecionamento automático

### REQ-002: Controle de Acesso por Perfil
**Descrição**: Implementar sistema RBAC com 3 perfis de usuário
**Prioridade**: high
**Status**: pending
**Critérios de Aceitação**:
- Admin Lify: Acesso total ao sistema
- Admin Clínica: Acesso apenas à sua clínica
- Atendente: Acesso operacional (Dashboard, Agenda, Agendamentos, Contexto, Conversas)
- Implementar verificação de permissões em todas as operações

### REQ-003: Integração Frontend-Backend
**Descrição**: Conectar CRUDs com Supabase e implementar contextualização
**Prioridade**: medium
**Status**: pending
**Critérios de Aceitação**:
- Conectar CRUD de Clínicas com tabela atendeai.clinics
- Conectar CRUD de Usuários com tabela atendeai.users
- Implementar contextualização via context_json
- Conectar combobox com dados reais do banco

### REQ-004: WhatsApp Multi-clínica
**Descrição**: Configurar servidor para múltiplas conexões WhatsApp
**Prioridade**: medium
**Status**: pending
**Critérios de Aceitação**:
- Configurar webhook individual por clínica
- Implementar roteamento de mensagens por clínica
- Conectar tela de conversas com dados reais
- Implementar controle bot/humano por clínica

