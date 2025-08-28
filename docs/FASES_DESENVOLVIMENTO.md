# Fases de Desenvolvimento (MVP → Funcional Completo)

## Fase 1 (Core MVP): WhatsApp + Chatbot + Contexto por Clínica + Integração FE↔BE
- Objetivo: Conversas WhatsApp operacionais com chatbot contextualizado por clínica e UI integrada.
- Entregas:
  - Webhook WhatsApp ativo com verificação de assinatura
  - Persistência de conversas/mensagens por clínica
  - Modo Chatbot: ON/OFF por conversa (assumir conversa)
  - Tela de Conversas integrada aos serviços (stream/lista/envio)
  - Autenticação Supabase ativa no frontend
- Critérios de Aceitação:
  - Receber e enviar mensagens em tempo real por clínica
  - Alternar Chatbot ON/OFF reflete no backend e na UI
  - Usuário não autenticado é redirecionado para `/auth`

## Fase 2: Segurança e RBAC
- Objetivo: Acesso seguro e isolamento por clínica.
- Entregas:
  - Proteção de rotas (todas as telas)
  - RBAC: admin_lify, admin_clinic, attendant (UI/menus/ações)
  - Combobox de clínicas visível apenas para Admin Lify
- Critérios de Aceitação:
  - Isolamento completo de dados entre clínicas
  - UI adaptativa por perfil

## Fase 3: Google Calendar e Agendamentos
- Entregas:
  - OAuth Google concluído e iframe do calendário renderizado
  - Sincronização básica de próximos eventos quando integrado
- Critérios de Aceitação:
  - View padrão sem integração; eventos quando integrado

## Fase 4: Gestão de Dados e Integrações Restantes
- Entregas:
  - CRUD de usuários por clínica
  - CRUD de clínicas (Admin Lify) com configurações WhatsApp
  - Substituição de dados mockados por chamadas reais em todas as telas
- Critérios de Aceitação:
  - Persistência funcionando e UI sincronizada

## Fase 5: Observabilidade e Qualidade
- Entregas:
  - Dashboards de saúde e latência no Grafana
  - Testes de regressão verdes; cobertura mínima
  - Catálogo de erros e OpenAPI atualizados
- Critérios de Aceitação:
  - Build verde e alertas mínimos configurados