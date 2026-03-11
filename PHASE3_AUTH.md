# LifeSignal Phase 3 — Auth System and Roles Model

## Purpose
Implement role-aware auth foundation using Supabase Auth identity + `profiles` role mapping, with route-level guards and role checks for API entry points.

## Added Files
- `lib/auth/guards.ts`
- `services/auth/auth.service.ts`
- `app/api/auth/bootstrap/route.ts`
- `types/domain.ts`

## Implementation Notes
- `requireAuth` enforces authenticated session and profile presence.
- `requireAuth(allowedRoles)` provides role authorization for endpoints.
- Profile bootstrap route persists role metadata into `profiles` and writes `audit_logs`.
- Role values strictly match schema enum (`app_role`).

## Consistency Check
- **Newly added files**: listed above.
- **Newly added tables**: none (uses Phase 2 schema).
- **Newly added env vars**: none.
- **Newly added routes**: `POST /api/auth/bootstrap`.
- **Dependencies introduced**: none beyond Next/Supabase/Zod baseline.
- **Assumptions made**: user is created in `auth.users` before profile bootstrap.
