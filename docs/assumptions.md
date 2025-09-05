# Assumptions (MVP)

- O frontend consumirá serviços internos via `http://localhost:{porta}` em ambiente local.
- O `authService` custom permanece temporariamente para chamadas aos microserviços protegidos.
- A unificação de autenticação com Supabase será tratada em fase posterior (fora do MVP atual).
- A clínica selecionada é única no combobox e usaremos um `clinicId` fixo durante o MVP.
- WhatsApp Service roda em `:3007`; Clinic Service em `:3003`.
- Não haverá mudanças visuais; SDKs serão chamados por futuras edições nas telas.