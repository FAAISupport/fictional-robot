# LifeSignal Phase 15 — Cron Orchestration

## Purpose
Complete the secured cron execution surface for check-ins, escalations, risk snapshots, thresholds, waitlist leaderboards, weekly reports, analytics rollups, and stale incident detection.

## Added Files
- `app/api/cron/leaderboards/route.ts`
- (plus prior phase cron additions in 11–14)

## Implementation Notes
- All cron routes require `Authorization: Bearer <CRON_SECRET>`.
- Jobs are idempotent by design through status filtering and upsert semantics.
- Orchestration now covers:
  - materialize/process check-ins
  - process escalations
  - calculate risk snapshots
  - process risk threshold notifications
  - refresh leaderboards
  - generate weekly reports
  - aggregate analytics
  - flag stale incidents

## Consistency Check
- **Newly added files**: listed above and referenced cron handlers.
- **Newly added tables**: none.
- **Newly added env vars**: none.
- **Newly added routes**: `/api/cron/leaderboards` and broader orchestration set.
- **Dependencies introduced**: none.
- **Assumptions made**: external scheduler invokes cron endpoints at configured cadence.
