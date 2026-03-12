# Database Notes

- Apply migrations in lexical order from `db/migrations`.
- Seed data is in `db/seed/0001_seed.sql`.
- Schema is Postgres 15+ and compatible with Supabase managed Postgres.
- RLS is enabled on all application tables.

- For a corrected runnable version of the schema subset shared in support threads, use `db/schema/runnable_context_core.sql`.
