# Cron Setup

All cron endpoints require:

`Authorization: Bearer <CRON_SECRET>`

## Recommended schedule

### Every 5 minutes
- `POST /api/cron/materialize-checkins`
- `POST /api/cron/process-checkins`
- `POST /api/cron/process-escalations`

### Daily (local midnight UTC)
- `POST /api/cron/risk-snapshots`
- `POST /api/cron/leaderboards`

### Daily +15 minutes
- `POST /api/cron/risk-thresholds`
- `POST /api/cron/analytics-rollup`
- `POST /api/cron/stale-incidents`

### Weekly
- `POST /api/cron/weekly-reports`

## Vercel cron
Configure in `vercel.json` or Vercel dashboard and ensure headers include cron bearer token via secure serverless proxy or scheduler integration.

## External scheduler option
Use GitHub Actions, Cloud Scheduler, or Temporal trigger worker with secure secret injection.
