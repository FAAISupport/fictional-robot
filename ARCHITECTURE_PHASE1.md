# LifeSignal Phase 1 — System Architecture Blueprint

## Purpose
Define the production architecture, domain boundaries, module responsibilities, deployment topology, and operational constraints for LifeSignal before implementation.

## Monorepo Folder Structure

```text
/
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── senior/
│   ├── caregiver/
│   ├── agency/
│   ├── waitlist/
│   ├── billing/
│   ├── reports/
│   └── api/
├── components/
│   ├── ui/
│   ├── dashboards/
│   ├── waitlist/
│   ├── safety/
│   └── forms/
├── lib/
│   ├── supabase/
│   ├── stripe/
│   ├── twilio/
│   ├── auth/
│   ├── validation/
│   └── telemetry/
├── services/
│   ├── checkins/
│   ├── escalations/
│   ├── notifications/
│   ├── risk/
│   ├── waitlist/
│   ├── billing/
│   ├── reporting/
│   └── audit/
├── types/
├── db/
│   ├── migrations/
│   └── seed/
├── cron/
├── webhooks/
├── utils/
├── public/
├── scripts/
└── styles/
```

## Runtime Architecture

1. **Frontend + API layer**: Next.js 16 App Router deployed on Vercel.
2. **Primary data platform**: Supabase Postgres with Row Level Security.
3. **Auth**: Supabase Auth with profile and role mapping in Postgres.
4. **Messaging**: Twilio SMS + Voice with webhook callbacks persisted as communication logs.
5. **Billing**: Stripe Checkout + Billing Portal + webhook sync to subscriptions/billing_events tables.
6. **Automation**: Token-protected HTTP cron route handlers in `app/api/cron/*`.
7. **Risk intelligence**: Daily rules engine computes explainable `risk_snapshots` with factor JSON and threshold events.

## Core Domain Modules

### 1) Identity & Access
- `profiles` table maps Supabase user to role.
- Role types: senior, caregiver, guardian, agency_staff, agency_admin, platform_admin, waitlist_only.
- Authorization is enforced in both API service layer and RLS policies.

### 2) Guardian Network
- Supports many-to-many monitored people and guardians.
- Invitation acceptance flow creates persistent relationship.
- Priority and fallback routing drive escalations.

### 3) Check-In Engine
- Schedules are reusable rules.
- Actual check-in expectations are materialized into `checkins` rows.
- Each attempt recorded in `checkin_attempts`.
- Responses captured in `checkin_responses` from SMS YES/OK or DTMF=1.

### 4) Escalation Engine
- Missed check-ins create escalation records.
- Escalation executes tiered steps with delay and optional parallelization.
- Acknowledgment requires explicit action (not delivery receipt).

### 5) Messaging Infrastructure
- Outbound messages/calls logged in `communication_logs`.
- Twilio status callbacks append delivery/call state transitions.
- Inbound handlers correlate responses to active check-ins/escalations.

### 6) Health Modules
- Medication reminders and adherence logging.
- Recovery program check-ins with same automation and escalation model.

### 7) Risk / Routine Stability Engine
- Daily score (0–100) from behavior-derived factors only.
- Stores rates, trends, explanation text, and threshold crossing markers.
- Caregiver/agency dashboards can view detailed factors.
- Senior dashboard shows calm “routine consistency” language.

### 8) Incident + Reporting
- Incident records aggregate severe/multi-step events.
- Weekly reports include response rates, misses, escalations, intervention, trend summaries.

### 9) Waitlist + Viral Growth
- Waitlist users with referral codes, attribution, and ranking snapshots.
- Referral milestones determine beta eligibility and reward markers.
- Leaderboards: all-time, weekly, geo.

### 10) Subscription + Entitlements
- Stripe events hydrate internal subscription state.
- Feature access uses entitlement checks from plan + feature flags.

## Scheduling and Cron Topology

All cron handlers require `Authorization: Bearer <CRON_SECRET>` and idempotency key handling.

- `/api/cron/materialize-checkins` — generate due check-in records for windows.
- `/api/cron/process-checkins` — send due attempts, retries, mark missed.
- `/api/cron/process-escalations` — execute pending escalation steps.
- `/api/cron/risk-snapshots` — compute daily routine stability snapshots.
- `/api/cron/risk-thresholds` — detect crossings and emit events/alerts.
- `/api/cron/leaderboards` — refresh all-time/weekly/geo rank snapshots.
- `/api/cron/weekly-reports` — generate weekly safety report rows.
- `/api/cron/analytics-rollup` — aggregate operational metrics.
- `/api/cron/stale-incidents` — auto-flag unresolved incidents.

## API Surface (Initial Contract)

- `POST /api/waitlist/join`
- `POST /api/waitlist/referral`
- `GET /api/waitlist/leaderboard`
- `POST /api/guardian-invites`
- `POST /api/checkins/send`
- `POST /api/checkins/sms-response`
- `POST /api/checkins/voice-response`
- `POST /api/escalations/trigger`
- `POST /api/escalations/:id/acknowledge`
- `POST /api/medications/:id/confirm`
- `POST /api/recovery/:id/confirm`
- `POST /api/emergency/trigger`
- `GET /api/risk-snapshots`
- `GET /api/risk-threshold-events`
- `POST /api/webhooks/twilio/sms-status`
- `POST /api/webhooks/twilio/voice-status`
- `POST /api/webhooks/stripe`

## Event and Audit Strategy

Safety-critical writes also insert an `audit_logs` row:
- check-in state transitions
- escalation starts/steps/acknowledgment/resolution
- emergency triggers
- schedule changes
- contact and guardian permission changes
- billing entitlement changes

## Explainable Risk Scoring Contract

Daily rules compute and persist:
- miss rates (7d/30d)
- response latency (7d/30d)
- late response rates (7d/30d)
- retry dependence
- medication/recovery miss rates
- guardian intervention and emergency frequency
- weighted factor vector + explanation text
- trend direction against trailing baseline

No ML or diagnostic claims are included in architecture.

## Infrastructure and Deployment

- Vercel for web/API runtime.
- Supabase project per environment (dev/staging/prod).
- Twilio subaccount per environment.
- Stripe test/live mode separation.
- Vercel cron + external scheduler support (both token-secured).

## Consistency Check (Phase 1)

- **Newly added files**: `ARCHITECTURE_PHASE1.md`, `.env.example`, `db/README.md`, `db/migrations/0001_init.sql`, `db/seed/0001_seed.sql`.
- **Newly added tables**: Defined in Phase 2 migration.
- **Newly added env vars**: Declared in `.env.example`.
- **Newly added routes**: Blueprinted (implementation in later phases).
- **Dependencies introduced**: Postgres extensions `pgcrypto`, `citext`.
- **Assumptions made**: UTC in DB + per-user IANA timezone conversion at service layer; Supabase Auth UUID aligns with `profiles.id`.
