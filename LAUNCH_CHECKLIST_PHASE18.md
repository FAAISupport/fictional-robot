# LifeSignal Phase 18 Launch Checklist

## Product readiness
- [ ] Marketing, waitlist, and dashboard pages render correctly.
- [ ] Senior, caregiver, and agency role-based pages accessible only with authorized roles.
- [ ] All critical APIs return structured JSON (except TwiML routes).

## Safety workflow readiness
- [ ] Check-in materialization creates persistent `checkins` records.
- [ ] SMS/voice check-ins process valid confirmations.
- [ ] Missed check-ins trigger escalations.
- [ ] Escalation acknowledgment requires explicit token action.

## Risk intelligence readiness
- [ ] Daily risk snapshots generate and persist all required factor fields.
- [ ] Threshold crossings create `risk_threshold_events`.
- [ ] Caregiver and agency views show trend + top factors.

## Billing readiness
- [ ] Checkout and portal routes function in Stripe test mode.
- [ ] Stripe webhooks are signed and events persisted.
- [ ] Subscription records sync to `subscriptions`.

## Messaging readiness
- [ ] Twilio callback URLs configured and reachable.
- [ ] Twilio status events persisted in `communication_logs`.

## Operations readiness
- [ ] Cron schedule configured for all phase 15 jobs.
- [ ] Cron secret protected in environment manager.
- [ ] Incident stale check and weekly reports executed successfully.

## Compliance and audit readiness
- [ ] RLS enabled for production schema.
- [ ] Audit logs written for safety-critical actions.
- [ ] Production secrets rotated and scoped by environment.

## Go-live checks
- [ ] Smoke test endpoints execute without errors.
- [ ] Seed data removed or isolated in non-production environments.
- [ ] On-call escalation policy documented for launch week.
