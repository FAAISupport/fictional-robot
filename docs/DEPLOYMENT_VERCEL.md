# LifeSignal Deployment Guide (Vercel)

## 1. Prerequisites
- Vercel project connected to this repository.
- Supabase project (dev/staging/prod).
- Twilio account with Messaging Service and voice-capable number.
- Stripe account with three recurring prices (Family/Caregiver/Enterprise).

## 2. Environment Variables in Vercel
Configure all keys from `.env.example` in Vercel Project Settings → Environment Variables for Production/Preview/Development.

Minimum required for production:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_MESSAGING_SERVICE_SID`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_STATUS_CALLBACK_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_FAMILY`
- `STRIPE_PRICE_CAREGIVER`
- `STRIPE_PRICE_ENTERPRISE`

## 3. Database Migration & Seed
Run from CI/CD or trusted workstation:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0001_init.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seed/0001_seed.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seed/0002_phase16_seed.sql
```

or use:

```bash
DATABASE_URL=... ./scripts/apply_seed.sh
```

## 4. Build and Deploy
Vercel defaults:
- Build command: `npm run build`
- Output: Next.js default
- Install command: `npm install`

## 5. Post-Deploy Validation
- `GET /api/cron/health` with cron auth header.
- Trigger webhook test events (Twilio + Stripe).
- Run cron smoke script:

```bash
APP_URL=https://your-app.vercel.app CRON_SECRET=... ./scripts/cron-smoke.sh
```
