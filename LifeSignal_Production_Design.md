# LifeSignal — Production SaaS Design

## 30-Second Pitch
LifeSignal is a gentle daily check-in service that helps older adults stay independent while keeping loved ones informed. Seniors confirm “I’m okay” via SMS, phone call, or one-tap web/app check-in. If no response is received, LifeSignal automatically escalates through a configurable safety tree—reminders, voice calls, family alerts, secondary contacts, and optional emergency outreach—so concerns are handled quickly without being intrusive.

---

## 1) Architecture Overview

### Core Stack
- **Frontend**: Next.js (App Router) on Vercel
- **Backend data/auth**: Supabase (Postgres, Auth, RLS, Realtime optional)
- **Messaging**: Twilio (Programmable SMS + Voice)
- **Billing**: Stripe (Checkout, Customer Portal, Subscriptions, webhooks)
- **Scheduler**: Vercel Cron → signed trigger endpoint
- **Secrets**: Vercel encrypted env vars + Supabase secrets

### High-Level Services
1. **Web App (Next.js)**
   - Role-based dashboards (Senior, Family, Caregiver, Admin)
   - Onboarding, escalation settings, billing, notification preferences
2. **API Routes / Server Actions**
   - Check-in processing
   - Escalation orchestration
   - Twilio/Stripe webhook ingestion
3. **Supabase Postgres**
   - Tenancy + user roles + escalation graph + event logs
   - Audit trails and consent artifacts
4. **Twilio Layer**
   - Outbound SMS reminder/check-in links
   - Outbound voice fallback calls with DTMF capture (press 1)
   - Status callbacks + inbound reply handling
5. **Stripe Layer**
   - Subscription lifecycle, invoices, failures, trials
6. **Secure Cron Runner**
   - Periodic job checks due check-ins/escalations
   - Idempotent, retry-safe workflow engine

### Operational Principles
- **Fail-safe defaults**: If uncertain, continue escalation with clear messaging.
- **Idempotency**: Every dispatch/escalation step is deduplicated by key.
- **Event-driven + poll safety net**: Webhooks primary, cron reconciliation secondary.
- **Minimal PHI**: no diagnosis/clinical records; only wellness check-in status.

---

## 2) User Personas & Product Flows

## 2.1 Senior
### Onboarding
1. Welcome screen: “We’re here to help you check in each day.”
2. Consent and preferred contact method (SMS, voice, app button).
3. Time window selection (e.g., 8–11 AM local).
4. Add trusted contacts (family/caregiver).
5. Optional backup phrase and language preference.

### Dashboard
- Big “I’m okay” button (one tap)
- Today’s status (Pending / Confirmed / Escalated)
- Next reminder time
- Contact methods on file
- “Need help now?” quick call button

### Notification Settings
- Preferred check-in channel order
- Reminder frequency
- Quiet hours
- Travel mode / temporary pause

### Subscription Handling
- Usually managed by family, but senior can view plan status and renewal date.

## 2.2 Family Member
### Onboarding
1. Accept invite from senior.
2. Set relation (daughter/son/friend/etc.).
3. Set alert method (SMS, push, email, voice).
4. Define escalation participation window.

### Dashboard
- Snapshot cards for each senior
- Current streak, missed check-ins, escalation history
- “Mark contacted” and “Resolve incident” actions

### Notification Settings
- Alert urgency levels
- Time-of-day preferences
- Optional geofenced vacation mode

### Subscription Handling
- Manage payment method, plan upgrades, add seats (multi-senior family plans)

## 2.3 Caregiver (Professional)
### Onboarding
1. Organization profile + verification
2. Assigned seniors import/invite
3. Work shift preferences

### Dashboard
- Queue view by risk level and overdue time
- Bulk acknowledgment tools
- Case notes (non-clinical)

### Notification Settings
- Shift-aware escalation routing
- Escalation to backup caregiver

### Subscription Handling
- Seat-based or volume-tier billing with invoice support

## 2.4 Admin
### Onboarding
- Internal ops account with MFA mandatory

### Dashboard
- Platform health: delivery rates, response latency, webhook failures
- User lifecycle funnel
- Incident monitor + manual override

### Notification Settings
- Ops alerts for service degradation

### Subscription Handling
- Plan catalog, coupon campaigns, failed payment dunning policies

---

## 3) Check-In & Escalation Logic

## Check-In Channels
1. **SMS check-in**: includes secure magic link + simple reply options (YES / OK)
2. **Voice fallback**: Twilio call with IVR prompt (“Press 1 if you are okay”)
3. **Web/app button**: logged-in one-tap confirmation

## Timed Reminder Sequence (example)
- T0: scheduled check-in prompt
- T0 + 30m: reminder SMS
- T0 + 60m: automated voice call
- T0 + 90m: notify primary family contact
- T0 + 120m: notify secondary contact
- T0 + 150m: optional emergency alert workflow

## Configurability
Per senior:
- Number of reminders
- Wait intervals
- Contact priority order
- Whether emergency escalation is enabled
- Local timezone + holiday behavior

## Escalation State Machine
`scheduled -> reminder_sent -> voice_attempted -> family_alerted -> secondary_alerted -> emergency_alerted -> resolved`

Resolution events:
- Senior confirms okay
- Family/caregiver marks safe after outreach
- Admin closes incident with reason

---

## 4) Database Schema (Supabase/Postgres)

## 4.1 Core Tables

### `profiles`
- `id uuid pk` (matches auth.users.id)
- `role text check in ('senior','family','caregiver','admin')`
- `full_name text`
- `phone_e164 text encrypted`
- `timezone text`
- `locale text`
- `created_at timestamptz`

### `senior_accounts`
- `id uuid pk`
- `senior_user_id uuid fk -> profiles.id`
- `status text` (active, paused)
- `checkin_window_start time`
- `checkin_window_end time`
- `default_channel text` (sms/voice/app)
- `emergency_enabled bool`

### `relationships`
- `id uuid pk`
- `senior_account_id uuid fk -> senior_accounts.id`
- `related_user_id uuid fk -> profiles.id`
- `relationship_type text` (family/caregiver/secondary)
- `priority int`
- `is_active bool`

### `notification_methods`
- `id uuid pk`
- `user_id uuid fk -> profiles.id`
- `method_type text` (sms/email/voice/push)
- `destination text encrypted`
- `is_verified bool`
- `created_at timestamptz`

### `checkin_schedules`
- `id uuid pk`
- `senior_account_id uuid fk`
- `days_of_week int[]`
- `target_time_local time`
- `grace_minutes int`
- `active bool`

### `checkin_events`
- `id uuid pk`
- `senior_account_id uuid fk`
- `scheduled_for timestamptz`
- `status text` (pending/confirmed/missed/escalated/resolved)
- `confirmed_at timestamptz null`
- `confirmation_channel text null`
- `metadata jsonb`

### `escalation_policies`
- `id uuid pk`
- `senior_account_id uuid fk unique`
- `policy_version int`
- `steps jsonb` (ordered actions + delays + contact target)
- `updated_by uuid fk -> profiles.id`
- `updated_at timestamptz`

### `escalation_runs`
- `id uuid pk`
- `checkin_event_id uuid fk`
- `current_step int`
- `state text`
- `next_action_at timestamptz`
- `resolved_at timestamptz null`

### `message_deliveries`
- `id uuid pk`
- `provider text` (twilio)
- `provider_message_id text unique`
- `channel text` (sms/voice)
- `direction text` (outbound/inbound)
- `to_masked text`
- `status text`
- `payload jsonb`
- `created_at timestamptz`

### `audit_logs`
- `id bigserial pk`
- `actor_user_id uuid null`
- `entity_type text`
- `entity_id uuid`
- `action text`
- `ip_hash text`
- `user_agent text`
- `created_at timestamptz`

### `consents`
- `id uuid pk`
- `user_id uuid fk`
- `consent_type text` (terms, messaging, emergency_contact)
- `version text`
- `accepted_at timestamptz`
- `evidence jsonb`

### `subscriptions`
- `id uuid pk`
- `account_scope text` (senior/family/org)
- `scope_id uuid`
- `stripe_customer_id text unique`
- `stripe_subscription_id text unique`
- `plan_code text`
- `status text`
- `current_period_end timestamptz`

### `webhook_events`
- `id uuid pk`
- `source text` (stripe/twilio)
- `event_id text`
- `received_at timestamptz`
- `processed_at timestamptz null`
- `status text` (received/processed/failed/duplicate)
- `payload jsonb`

## 4.2 Relationship Summary
- One senior account has many relationships, schedules, check-in events.
- One check-in event has zero/one escalation run.
- One escalation policy per senior account (versioned updates).
- Subscriptions map to either family or org scopes.

---

## 5) RLS Strategy (Supabase)

### Role Model
- `senior`: access own account and own events.
- `family`: access seniors linked in `relationships` where active.
- `caregiver`: access assigned seniors by relationship + org constraints.
- `admin`: full access via service-role only in backend, not client JWT.

### Policy Examples
1. `profiles`: user can `select/update` where `id = auth.uid()`.
2. `senior_accounts`: senior owner can read own; related users can read if active relation.
3. `checkin_events`: senior + related family/caregiver can read; write restricted to service role and senior confirmation endpoint.
4. `escalation_policies`: senior owner + family manager role can update.
5. `audit_logs`: only admin/service role can read.

### Security Controls
- Never expose service role key to client.
- Use RPC functions for sensitive mutations (policy validated server-side).
- Enforce column-level redaction for phone destinations to non-admin users.

---

## 6) API Route Map (Next.js App Router)

## Authenticated App Routes
- `GET /app/dashboard`
- `GET /app/settings/notifications`
- `GET /app/settings/escalation`
- `GET /app/billing`

## API Endpoints
- `POST /api/checkins/confirm` (senior confirms)
- `POST /api/checkins/schedule` (admin/system create daily events)
- `POST /api/escalations/run-step` (cron worker executes due steps)
- `POST /api/escalations/resolve` (family/caregiver/admin resolve)
- `POST /api/notifications/send` (internal abstraction)
- `POST /api/twilio/sms-status` (delivery callbacks)
- `POST /api/twilio/inbound-sms` (YES/OK parsing)
- `POST /api/twilio/voice-status` (call outcomes)
- `POST /api/twilio/voice-gather` (DTMF result)
- `POST /api/stripe/webhook` (subscription lifecycle)
- `POST /api/cron/daily-checkins` (secure cron trigger)
- `POST /api/cron/escalation-sweeper` (secure cron trigger)

### Endpoint Security
- Cron endpoints require signed HMAC header + IP allowlist (Vercel cron signature preferred).
- Twilio endpoints validate Twilio request signature.
- Stripe webhook verifies endpoint secret + replay timestamp tolerance.

---

## 7) Cron Workflow

### Job A: `daily-checkins`
Runs every 10 minutes:
1. Find seniors whose local check-in window starts now.
2. Upsert today’s `checkin_event` (idempotent key: senior+date).
3. Send initial check-in prompt.
4. Seed `escalation_runs` with `next_action_at`.

### Job B: `escalation-sweeper`
Runs every 5 minutes:
1. Query due escalation runs (`next_action_at <= now` and unresolved).
2. Execute current step action.
3. Record `message_deliveries` and update `current_step`.
4. If terminal unresolved, set `state='emergency_alerted'` if enabled.

### Reliability Patterns
- Advisory locks to avoid double-processing.
- Retry with exponential backoff for transient Twilio/Stripe/API failures.
- Dead-letter table for repeatedly failing events.

---

## 8) Webhook Handling

### Twilio
- Ingest inbound SMS/call status into `webhook_events` first.
- Deduplicate by Twilio SID.
- Parse intent (`YES`, `OK`, DTMF=1) to confirm check-in.
- Push delivery failures back into escalation engine.

### Stripe
Handle:
- `checkout.session.completed`
- `customer.subscription.updated`
- `invoice.payment_failed`
- `customer.subscription.deleted`

Actions:
- Sync `subscriptions` table.
- Trigger dunning notifications.
- On payment failure grace expiry, reduce to read-only alerts + billing warning.

---

## 9) Error Recovery Approach

1. **Communication failure**
   - Auto-fallback from SMS to voice.
   - Retry via alternate number if configured.
2. **Webhook outage**
   - Cron reconciliation checks unprocessed provider events and delivery statuses.
3. **DB transient errors**
   - Transaction retries + idempotency keys.
4. **False escalations**
   - One-tap “I’m okay” closes active run and sends reassurance notification to contacts.
5. **Human override**
   - Admin can pause account, reroute escalation tree, annotate reason in audit logs.

---

## 10) Revenue Design

## 10.1 Tiered Plans (example USD/month)
| Plan | Price | Includes | Intended User |
|---|---:|---|---|
| Basic SMS | $14 | 1 senior, SMS check-ins, 2 reminders, 2 contacts | Budget families |
| Plus Voice | $24 | Basic + voice fallback + 4 contacts + custom escalation | Higher assurance |
| Family | $39 | Up to 2 seniors, shared family dashboard, priority alerts | Multi-parent households |
| Premium | $79 | Up to 5 seniors, caregiver seat, advanced analytics, priority support | Care networks |

## 10.2 Cost Modeling Assumptions (per senior/month)
- 30 daily SMS prompts + 20 reminder SMS = 50 SMS
- 6 outbound voice minutes fallback average
- Twilio blended estimate:
  - SMS: $0.008 each -> **$0.40**
  - Voice: $0.02/min -> **$0.12**
- Infra (Vercel + Supabase prorated): **$1.80**
- Support + overhead reserve: **$1.50**
- Payment processing blended: ~3% + $0.30/txn (effective **$0.80** at $24 plan)

Estimated variable cost at Plus plan: **~$4.62/senior/month**

## 10.3 Breakeven Snapshot
Assume fixed monthly operating cost = **$12,000** (team, tooling, compliance, marketing baseline).
- If ARPU = $28 and variable cost = $5, contribution margin = $23.
- Breakeven users ≈ `12000 / 23 = 522 seniors`.

Sensitivity:
- At ARPU $24, margin $19 -> breakeven ~632 seniors.
- At ARPU $32, margin $27 -> breakeven ~445 seniors.

---

## 11) UX Tone & Content

## Tone Principles
- Calm, respectful, non-alarming
- Empower independence, avoid infantilizing language
- Keep messages short and action-oriented

### Sample SMS Copy
1. **Daily check-in**: “Good morning from LifeSignal 💛 Just tap to confirm you’re okay today: {secure_link}”
2. **Reminder**: “Just checking in again—please confirm when you can: {secure_link}. We’ll notify your family only if we can’t reach you.”
3. **Escalation notice to family**: “LifeSignal update: We haven’t received today’s check-in from {Name}. Please try reaching them now.”

### Sample Voice Script
“Hello, this is LifeSignal with your daily wellness check-in. If you are okay, press 1 now. To hear this message again, press 2. If you need immediate help, hang up and dial emergency services.”

### Dashboard Layout (Senior)
- Top: large status chip (“You’re all set for today”)
- Center: giant confirmation button
- Secondary cards: next check-in time, contact preferences, help button
- Footer: trusted contacts and support

### Accessibility Notes
- WCAG 2.2 AA target
- 16px+ base font, high contrast mode, large tap targets (48px min)
- Screen-reader labels for all status actions
- Reduced-motion option
- Plain-language copy at ~6th–8th grade reading level
- Multilingual templates for SMS and IVR

---

## 12) Compliance & Safety Posture

### PHI Minimization
- Store only wellness check status and contact metadata.
- Avoid diagnosis, treatment, or medical charting.

### Security Controls
- Encryption at rest (Postgres disk + column encryption for phone data)
- TLS in transit everywhere
- Key rotation and secret scoping
- MFA for admin and caregiver accounts

### Audit & Legal
- Immutable `audit_logs` for critical actions
- Consent capture for messaging and emergency-contact escalation
- Data retention controls (e.g., event logs retained 12–24 months)

### Liability Disclaimer (sample)
“LifeSignal is a non-medical wellness reminder and notification service. It is not an emergency response provider and does not replace 911 or professional medical monitoring. In any emergency, call local emergency services immediately.”

---

## 13) Pilot Rollout Plan (First 100 Users)

### Phase 1 (0–25 users)
- Concierge onboarding by team
- Daily manual review of escalations
- KPI baseline setup

### Phase 2 (26–60 users)
- Self-serve onboarding + support chat
- A/B test reminder timing
- Introduce referral incentives

### Phase 3 (61–100 users)
- Expand caregiver workflows
- Add weekly family summary emails
- Harden incident response runbooks

### Pilot KPIs
- Daily check-in completion rate
- Escalation rate per active senior
- Median time-to-resolution for missed check-ins
- False positive escalation rate
- 30-day retention
- NPS (family and seniors separately)

### Referral Strategy
- “Protect a loved one” family referral loop
- Give $10 off next month for both referrer and referred
- Co-marketing with senior community centers and home care agencies

### Positioning vs Medical Alert Devices
- **LifeSignal**: proactive daily reassurance + family coordination + lower cost
- **Medical alert device**: reactive emergency button hardware
- Position as complementary, not competitive replacement for high-risk users

---

## 14) Escalation Flow (Text Diagram)

`Daily schedule trigger`
→ Send SMS check-in
→ If confirmed: mark resolved + notify opted-in family summary
→ If no response in X min: send reminder
→ If no response: place voice call
→ If no confirmation: alert primary family
→ If unresolved: alert secondary contact/caregiver
→ Optional: emergency alert instruction + incident open until resolved

