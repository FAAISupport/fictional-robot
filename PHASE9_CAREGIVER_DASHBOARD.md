# LifeSignal Phase 9 — Caregiver Dashboard

## Purpose
Provide caregiver operations view with check-in state, routine stability level, trend direction, and explainable top factors.

## Added Files
- `app/caregiver/page.tsx`
- `services/risk/risk.service.ts`
- `services/dashboard/dashboard.service.ts` (caregiver data path)

## Implementation Notes
- Uses latest `risk_snapshots` plus trailing baseline to compute trend direction.
- Exposes top contributing factors from stored explainable `score_factors` JSON.
- Presents monitored-person cards with latest check-in status and concern context.

## Consistency Check
- **Newly added files**: listed above.
- **Newly added tables**: none.
- **Newly added env vars**: none.
- **Newly added routes**: none.
- **Dependencies introduced**: none.
- **Assumptions made**: caregiver membership comes from `guardian_network` relationships.
