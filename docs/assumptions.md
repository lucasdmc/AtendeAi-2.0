# Assumptions - AtendeAí 2.0

## Assumptions Técnicas
- Backend services estarão disponíveis nas portas especificadas
- APIs seguirão padrão REST com JSON
- Autenticação será via JWT token
- Banco de dados estará populado com dados reais

## Assumptions de Negócio
- Usuários terão acesso às clínicas baseado em roles
- Conversas serão atribuídas automaticamente ou manualmente
- Agendamentos usarão calendário próprio na tela de Agenda
- WhatsApp será o canal principal de comunicação
- Calendário interno será responsável por toda gestão de horários

## Dependências Externas
- Meta WhatsApp Business API
- Supabase (banco de dados)
- Railway (deploy)

## Integrações Removidas
- Google Calendar API (removido)
- Google OAuth (removido)
- Qualquer serviço Google (removido)
