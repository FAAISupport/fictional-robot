# Database Notes

- Apply migrations in lexical order from `db/migrations`.
- Seed data is in `db/seed/0001_seed.sql`.
- Schema is Postgres 15+ and compatible with Supabase managed Postgres.
- RLS is enabled on all application tables.
