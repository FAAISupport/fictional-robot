import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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
  'PHASE18_LAUNCH.md'
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

test('phase 16-18 required files exist', () => {
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
