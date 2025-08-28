# Assumptions - AtendeAI 2.0

- Authentication is handled exclusively by Supabase Auth. No custom AuthService will be deployed.
- Each user belongs to a single clinic; Admin Lify can access all clinics (RBAC at UI + API).
- WhatsApp Business API credentials (access token, phone_number_id, verify token) are provided via environment variables, not committed.
- Supabase database schema and RLS are already provisioned; migrations are managed via Supabase SQL.
- Kong runs DB-less with declarative configuration and routes to internal services.
- Redis is available and reachable by all services for caching and bot context.
- Frontend runs at port 8080 during development (`npm run dev -- --port 8080`).
- Monitoring stack (Prometheus/Grafana) is optional in local development.