# Supabase Setup (Sprint 1)

## 1) Create a Supabase project
1. Create a new project in Supabase.
2. Wait until the database is fully provisioned.

## 2) Get project credentials
- **Project URL:** Project Settings → API → Project URL.
- **Publishable key:** Project Settings → API → `anon` / publishable key.
- **Secret key:** Project Settings → API → service-role/secret key (server-only).

## 3) Configure environment variables
Copy `.env.example` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

## 4) Apply migration
1. Open Supabase SQL Editor.
2. Paste `supabase/migrations/001_initial_tableflash_schema.sql`.
3. Run and verify all tables/types/functions/policies are created.

## 5) Security notes
- Never expose `SUPABASE_SECRET_KEY` in browser code.
- Only `NEXT_PUBLIC_` variables can be used in Client Components.
- Keep `SUPABASE_SECRET_KEY` for trusted server contexts only.

## 6) Notes for Sprint Supabase 2
- Anonymous order insert is intentionally deferred to server action/API mediation.
- Auth pages and route protection will be added next sprint.
