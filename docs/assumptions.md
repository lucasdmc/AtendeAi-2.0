# Assumptions (MVP)

- Compose canonical: docker-compose.improved.yml (contexts em backend/services).
- docker-compose.yml permanece até migração completa, mas considerado legacy.
- Auth: Supabase planejado; no MVP, mínimas proteções no frontend para não bloquear fluxos de conversa.
- clinic_id deve ser um UUID válido; durante desenvolvimento, usar um valor de teste configurável via .env.
- Integrações (WhatsApp/Google) requerem variáveis reais; sem elas, testar rotas de health/status e mocks locais.
- Frontend roda na porta 8080 (`npm run dev -- --port 8080`).