# Database - AtendeAI 2.0

Migrations e seed são geridos via Supabase CLI.

## Pré-requisitos
- Supabase projeto configurado
- `supabase` CLI instalada

## Migrations
- Coloque suas migrações SQL em `framework/db/migrations/` (fonte de verdade)
- Para aplicar:
```bash
supabase migration up
```
- Para reverter:
```bash
a supabase migration down 1
```

## Seed
- Arquivos em `framework/db/seed/`
- Para executar manualmente, utilize `psql` apontando para o banco Supabase.

## Notas
- Naming: snake_case
- RLS: habilitado e validado por clínica
- Migrations devem ser reversíveis