import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const requiredFiles = [
  'db/seed/0002_phase16_seed.sql',
  'scripts/apply_seed.sh',
  'scripts/cron-smoke.sh',
  'docs/DEPLOYMENT_VERCEL.md',
  'docs/WEBHOOK_CONFIGURATION.md',
  'docs/CRON_SETUP.md',
  'LAUNCH_CHECKLIST_PHASE18.md',
  'PHASE16_TESTING_AND_SEED.md',
  'PHASE17_DEPLOYMENT_AND_WEBHOOKS.md',
  'PHASE18_LAUNCH.md',
  'app/how-it-works/page.tsx',
  'app/verticals/[slug]/page.tsx',
  'components/waitlist/WaitlistJoinForm.tsx',
  'components/marketing/TopNav.tsx',
  'components/marketing/Footer.tsx',
  'app/api/waitlist/stats/route.ts'
];

const requiredCronRoutes = [
  'app/api/cron/materialize-checkins/route.ts',
  'app/api/cron/process-checkins/route.ts',
  'app/api/cron/process-escalations/route.ts',
  'app/api/cron/risk-snapshots/route.ts',
  'app/api/cron/risk-thresholds/route.ts',
  'app/api/cron/leaderboards/route.ts',
  'app/api/cron/weekly-reports/route.ts',
  'app/api/cron/analytics-rollup/route.ts',
  'app/api/cron/stale-incidents/route.ts'
];

test('phase files and marketing waitlist assets exist', () => {
  for (const file of requiredFiles) {
    assert.equal(fs.existsSync(file), true, `missing required file: ${file}`);
  }
});

test('cron routes for orchestration exist', () => {
  for (const route of requiredCronRoutes) {
    assert.equal(fs.existsSync(route), true, `missing cron route: ${route}`);
  }
});

test('.env.example contains required deployment keys', () => {
  const envExample = fs.readFileSync('.env.example', 'utf8');
  for (const key of [
    'NEXT_PUBLIC_SUPABASE_URL=',
    'SUPABASE_SERVICE_ROLE_KEY=',
    'TWILIO_ACCOUNT_SID=',
    'TWILIO_AUTH_TOKEN=',
    'STRIPE_SECRET_KEY=',
    'STRIPE_WEBHOOK_SECRET=',
    'CRON_SECRET='
  ]) {
    assert.equal(envExample.includes(key), true, `missing env key in .env.example: ${key}`);
  }
});

test('runnable_context_core.sql includes waitlist growth tables', () => {
  const sql = fs.readFileSync(path.join('db', 'schema', 'runnable_context_core.sql'), 'utf8');
  for (const token of [
    'create table if not exists public.waitlist_users',
    'create table if not exists public.referrals',
    'create table if not exists public.leaderboard_snapshots'
  ]) {
    assert.equal(sql.includes(token), true, `missing token: ${token}`);
  }
});
