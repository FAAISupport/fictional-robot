# LifeSignal Phase 6 — Check-in Scheduling Engine

## Purpose
Implement persistent expected check-in generation and processing through token-secured cron routes.

## Added Files
- `app/api/cron/materialize-checkins/route.ts`
- `app/api/cron/process-checkins/route.ts`
- `app/api/cron/health/route.ts`
- `app/api/checkins/materialize/route.ts`
- `app/api/checkins/process/route.ts`

## Implementation Notes
- Materialization creates auditable `checkins` from active schedules (deduped per schedule and time window).
- Processing sends due attempts, logs `checkin_attempts`, transitions status, marks misses, and creates escalation records.
- Cron endpoints require `Authorization: Bearer <CRON_SECRET>` and return structured JSON.
- Logic is safe to rerun and avoids duplicate check-ins via existence checks.

## Consistency Check
- **Newly added files**: listed above.
- **Newly added tables**: none.
- **Newly added env vars**: none.
- **Newly added routes**: cron and authenticated check-in processing endpoints.
- **Dependencies introduced**: none.
- **Assumptions made**: schedule timezone handling currently uses UTC runtime window and will be expanded with robust local-time expansion.
