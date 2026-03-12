# LifeSignal Phase 12 — Billing System

## Purpose
Implement Stripe checkout, billing portal access, webhook synchronization, billing event persistence, and subscription sync.

## Added Files
- `services/billing/billing.service.ts`
- `app/api/billing/checkout/route.ts`
- `app/api/billing/portal/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/billing/page.tsx`

## Implementation Notes
- Checkout route creates subscription sessions for Family/Caregiver/Enterprise plans.
- Portal route opens Stripe Billing Portal for existing customers.
- Webhook handler verifies signatures, stores `billing_events`, and upserts `subscriptions`.
- Plan metadata and profile linkage drive entitlement-ready synchronization.

## Consistency Check
- **Newly added files**: listed above.
- **Newly added tables**: none.
- **Newly added env vars**: uses existing Stripe vars in `.env.example`.
- **Newly added routes**: billing checkout/portal and stripe webhook.
- **Dependencies introduced**: `stripe`.
- **Assumptions made**: Stripe subscription metadata includes `profileId` and `plan`.
