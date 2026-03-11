# LifeSignal Phase 4 — Core Service Layer

## Purpose
Add reusable service layer primitives for audit logging, check-in orchestration, and shared API response handling.

## Added Files
- `services/audit/audit.service.ts`
- `services/checkins/checkin.service.ts`
- `utils/api.ts`
- `lib/validation/checkins.ts`

## Implementation Notes
- Audit service writes safety-critical events to `audit_logs`.
- Check-in service contains materialization, delivery processing, missed detection, escalation creation, SMS response parsing, and voice response handling.
- All service writes map to Phase 2 column names exactly.
- Routes consume these services to avoid duplicated business logic.

## Consistency Check
- **Newly added files**: listed above.
- **Newly added tables**: none.
- **Newly added env vars**: none.
- **Newly added routes**: powered by service methods in Phases 5/6 route handlers.
- **Dependencies introduced**: none.
- **Assumptions made**: cron drives materialization/processing windows and is idempotent by dedupe checks.
