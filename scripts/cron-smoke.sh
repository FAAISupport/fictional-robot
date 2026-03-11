#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${APP_URL:-}" || -z "${CRON_SECRET:-}" ]]; then
  echo "APP_URL and CRON_SECRET are required"
  exit 1
fi

auth="Authorization: Bearer ${CRON_SECRET}"

curl -fsS -X POST "${APP_URL}/api/cron/materialize-checkins" -H "$auth" -H 'Content-Type: application/json' -d '{}'
curl -fsS -X POST "${APP_URL}/api/cron/process-checkins" -H "$auth" -H 'Content-Type: application/json' -d '{}'
curl -fsS -X POST "${APP_URL}/api/cron/process-escalations" -H "$auth" -H 'Content-Type: application/json' -d '{}'
curl -fsS -X POST "${APP_URL}/api/cron/risk-snapshots" -H "$auth" -H 'Content-Type: application/json' -d '{}'
curl -fsS -X POST "${APP_URL}/api/cron/risk-thresholds" -H "$auth" -H 'Content-Type: application/json' -d '{}'
curl -fsS -X POST "${APP_URL}/api/cron/leaderboards" -H "$auth" -H 'Content-Type: application/json' -d '{}'
curl -fsS -X POST "${APP_URL}/api/cron/weekly-reports" -H "$auth" -H 'Content-Type: application/json' -d '{}'
curl -fsS -X POST "${APP_URL}/api/cron/analytics-rollup" -H "$auth" -H 'Content-Type: application/json' -d '{}'
curl -fsS -X POST "${APP_URL}/api/cron/stale-incidents" -H "$auth" -H 'Content-Type: application/json' -d '{}'

echo "Cron smoke completed"
