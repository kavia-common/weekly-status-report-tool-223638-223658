#!/usr/bin/env bash
# Purpose: Execute Supabase Postgres SQL statements one-by-one for frontend_app using REACT_APP_SUPABASE_DB_URL.
# Fails with a clear message if REACT_APP_SUPABASE_DB_URL is not set.
# Each statement is executed separately with ON_ERROR_STOP=1.
# Usage:
#   chmod +x ./run_supabase_sql_frontend.sh
#   ./run_supabase_sql_frontend.sh
set -euo pipefail

# 1) Read Postgres connection string from environment variable REACT_APP_SUPABASE_DB_URL.
if [[ -z "${REACT_APP_SUPABASE_DB_URL:-}" ]]; then
  echo "ERROR: REACT_APP_SUPABASE_DB_URL is not set."
  echo "Please set REACT_APP_SUPABASE_DB_URL in the environment (e.g., export REACT_APP_SUPABASE_DB_URL=postgres://...)" 
  echo "and re-run this script."
  exit 1
fi

PSQL_CONN_STR="$REACT_APP_SUPABASE_DB_URL"

# psql base with ON_ERROR_STOP=1 and quiet mode
PSQL_BASE=(psql "$PSQL_CONN_STR" -v ON_ERROR_STOP=1 -q)

echo "Connecting to Postgres using REACT_APP_SUPABASE_DB_URL..."
echo "Executing SQL statements one-by-one..."

# -- Enable pgcrypto for gen_random_uuid()
"${PSQL_BASE[@]}" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# -- teams table
"${PSQL_BASE[@]}" -c "CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);"

# -- profiles table (public profile linked to auth.users)
"${PSQL_BASE[@]}" -c "CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text UNIQUE,
  role text,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL
);"

# -- role check constraint (idempotent)
"${PSQL_BASE[@]}" -c "DO \$\$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check CHECK (role IN ('Employee','Manager','Admin'));
  END IF;
END
\$\$;"

# -- weekly_reports table
"${PSQL_BASE[@]}" -c "CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  progress text,
  blockers text,
  resolutions text,
  help_needed text,
  key_learnings text,
  next_week_plan text,
  status text NOT NULL DEFAULT 'Pending',
  date_submitted timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);"

# -- status check constraint (idempotent)
"${PSQL_BASE[@]}" -c "DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'weekly_reports_status_check') THEN
    ALTER TABLE public.weekly_reports
      ADD CONSTRAINT weekly_reports_status_check CHECK (status IN ('Pending','Draft','Submitted'));
  END IF;
END
\$\$;"

# -- Helpful indexes
"${PSQL_BASE[@]}" -c "CREATE INDEX IF NOT EXISTS idx_weekly_reports_author ON public.weekly_reports(author_id);"
"${PSQL_BASE[@]}" -c "CREATE INDEX IF NOT EXISTS idx_weekly_reports_team ON public.weekly_reports(team_id);"
"${PSQL_BASE[@]}" -c "CREATE INDEX IF NOT EXISTS idx_weekly_reports_status ON public.weekly_reports(status);"
"${PSQL_BASE[@]}" -c "CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email));"

echo "All SQL statements executed successfully."
