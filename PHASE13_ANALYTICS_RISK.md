# LifeSignal Phase 13 — Analytics and Routine Stability Intelligence

## Purpose
Implement daily analytics rollups and explainable routine stability/risk snapshot computation using observed platform behavior.

## Added Files
- `services/analytics/analytics.service.ts`
- `services/risk/risk-calculation.service.ts`
- `app/api/risk-snapshots/route.ts`
- `app/api/risk-threshold-events/route.ts`
- `app/api/cron/risk-snapshots/route.ts`
- `app/api/cron/risk-thresholds/route.ts`
- `app/api/cron/analytics-rollup/route.ts`

## Implementation Notes
- Daily risk scoring uses rules-based weighted factors from check-in, medication, recovery, escalation, and emergency data.
- Snapshots persist all required risk metrics and explainable `score_factors` + human explanation text.
- Threshold crossings are persisted in `risk_threshold_events` and trigger notifications.
- Analytics rollups persist DAU, monitored count, success rates, and escalation frequency into `analytics_events`.

## Consistency Check
- **Newly added files**: listed above.
- **Newly added tables**: none.
- **Newly added env vars**: none.
- **Newly added routes**: risk snapshot queries and cron processing routes.
- **Dependencies introduced**: none.
- **Assumptions made**: current factor weights are transparent defaults and intentionally non-diagnostic.
