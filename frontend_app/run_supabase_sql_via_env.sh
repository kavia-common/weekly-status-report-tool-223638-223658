#!/usr/bin/env bash
# Purpose: Execute Supabase Postgres SQL statements one-by-one using REACT_APP_SUPABASE_DB_URL.
# This script sources REACT_APP_SUPABASE_DB_URL from frontend_app/.env or .env.local if not present
# in the current environment, then executes each statement with psql -v ON_ERROR_STOP=1 -q -c "<SQL>".
# It is idempotent and safe to re-run.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Attempt to source REACT_APP_SUPABASE_DB_URL if not already present
if [[ -z "${REACT_APP_SUPABASE_DB_URL:-}" ]]; then
  if [[ -f "${ROOT_DIR}/.env" ]]; then
    set -a; source "${ROOT_DIR}/.env"; set +a
  fi
fi
if [[ -z "${REACT_APP_SUPABASE_DB_URL:-}" && -f "${ROOT_DIR}/.env.local" ]]; then
  set -a; source "${ROOT_DIR}/.env.local"; set +a
fi

if [[ -z "${REACT_APP_SUPABASE_DB_URL:-}" ]]; then
  echo "ERROR: REACT_APP_SUPABASE_DB_URL is not set in environment and not found in ${ROOT_DIR}/.env or .env.local"
  echo "Please export REACT_APP_SUPABASE_DB_URL or add it to frontend_app/.env, e.g.:"
  echo 'REACT_APP_SUPABASE_DB_URL=postgres://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres'
  exit 1
fi

PSQL="psql \"${REACT_APP_SUPABASE_DB_URL}\" -v ON_ERROR_STOP=1 -q"

echo "Connecting to Postgres using REACT_APP_SUPABASE_DB_URL..."
echo "Executing SQL statements one-by-one..."

# 1) Enable pgcrypto for gen_random_uuid()
eval ${PSQL} -c \""CREATE EXTENSION IF NOT EXISTS pgcrypto;"\"

# 2) teams table
eval ${PSQL} -c \""CREATE TABLE IF NOT EXISTS public.teams (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), team_name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());"\"

# 3) profiles table
eval ${PSQL} -c \""CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, full_name text, email text UNIQUE, role text, team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL);"\"

# 4) profiles role check constraint (idempotent)
eval ${PSQL} -c \""DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('Employee','Manager','Admin')); END IF; END $$;"\"

# 5) weekly_reports table
eval ${PSQL} -c \""CREATE TABLE IF NOT EXISTS public.weekly_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT, progress text, blockers text, resolutions text, help_needed text, key_learnings text, next_week_plan text, status text NOT NULL DEFAULT 'Pending', date_submitted timestamptz, created_at timestamptz NOT NULL DEFAULT now());"\"

# 6) weekly_reports status check constraint (idempotent)
eval ${PSQL} -c \""DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'weekly_reports_status_check') THEN ALTER TABLE public.weekly_reports ADD CONSTRAINT weekly_reports_status_check CHECK (status IN ('Pending','Draft','Submitted')); END IF; END $$;"\"

# 7) Helpful indexes
eval ${PSQL} -c \""CREATE INDEX IF NOT EXISTS idx_weekly_reports_author ON public.weekly_reports(author_id);"\"
eval ${PSQL} -c \""CREATE INDEX IF NOT EXISTS idx_weekly_reports_team ON public.weekly_reports(team_id);"\"
eval ${PSQL} -c \""CREATE INDEX IF NOT EXISTS idx_weekly_reports_status ON public.weekly_reports(status);"\"
eval ${PSQL} -c \""CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email));"\"

echo "All SQL statements executed successfully."

echo ""
echo "If you previously saw a 'Network is unreachable' error, ensure:"
echo " - The Supabase project allows external connections from this environment."
echo " - The DB URL is correct and reachable (host, port 5432)."
echo " - Your network egress/firewall permits outbound connections to Supabase Postgres."
