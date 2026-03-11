#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seed/0001_seed.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seed/0002_phase16_seed.sql

echo "Seed scripts applied successfully."
