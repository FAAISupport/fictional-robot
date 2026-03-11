# LifeSignal Phase 8 — Senior Dashboard

## Purpose
Deliver a calm, accessible senior dashboard focused on current status, routine consistency language, and guardian visibility.

## Added Files
- `app/senior/page.tsx`
- `services/dashboard/dashboard.service.ts` (senior data path)

## Implementation Notes
- Senior-facing language avoids alarmist “risk score” phrasing and uses routine consistency framing.
- Dashboard surfaces latest check-in status, routine consistency summary, and guardian priority list.
- Data source is fully tied to persisted Phase 2 entities (`checkins`, `risk_snapshots`, `guardian_network`).

## Consistency Check
- **Newly added files**: listed above.
- **Newly added tables**: none.
- **Newly added env vars**: none.
- **Newly added routes**: none.
- **Dependencies introduced**: none.
- **Assumptions made**: signed-in senior has `monitored_people.profile_id = auth user id` mapping.
