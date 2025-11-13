#!/usr/bin/env bash
# Run required Supabase SQL statements one-by-one using psql.
# Connection resolution order:
#   1) ./db_connection.txt (if exists and non-empty)
#   2) DATABASE_URL env var
#   3) SUPABASE_DB_URL env var
#
# Usage:
#   chmod +x run_supabase_sql.sh
#   ./run_supabase_sql.sh
#
# The script will exit on first error (psql ON_ERROR_STOP=1).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONN_FILE="$ROOT_DIR/db_connection.txt"

function resolve_conn() {
  local conn_from_file=""
  if [[ -f "$CONN_FILE" ]]; then
    conn_from_file="$(grep -v '^[[:space:]]*$' "$CONN_FILE" | head -n1 || true)"
  fi
  if [[ -n "${conn_from_file:-}" ]]; then
    echo "$conn_from_file"
    return
  fi
  if [[ -n "${DATABASE_URL:-}" ]]; then
    echo "$DATABASE_URL"
    return
  fi
  if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
    echo "$SUPABASE_DB_URL"
    return
  fi
  echo ""
}

DB_URL="$(resolve_conn)"

if [[ -z "$DB_URL" ]]; then
  echo "ERROR: No database connection string found."
  echo "Provide one of the following and rerun:"
  echo "  - Place a Postgres connection URL in $CONN_FILE"
  echo "  - Or export DATABASE_URL"
  echo "  - Or export SUPABASE_DB_URL"
  echo ""
  echo "Example SUPABASE connection string:"
  echo "  postgres://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres"
  exit 1
fi

echo "Using database URL from ${CONN_FILE:+db_connection.txt} ${CONN_FILE:-env var}"
echo "Executing SQL statements one-by-one..."

# Ensures all commands fail fast
PSQL_BASE=(psql "$DB_URL" -v ON_ERROR_STOP=1 -q)

# 1) Extension for gen_random_uuid via pgcrypto
"${PSQL_BASE[@]}" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# 2) teams table
"${PSQL_BASE[@]}" -c "CREATE TABLE IF NOT EXISTS public.teams (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), team_name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());"

# 3) profiles table (depends on auth.users existing in Supabase)
"${PSQL_BASE[@]}" -c "CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, full_name text, email text UNIQUE, role text, team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL);"

# 4) profiles role check constraint (idempotent)
"${PSQL_BASE[@]}" -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('Employee','Manager','Admin')); END IF; END \$\$;"

# 5) weekly_reports table
"${PSQL_BASE[@]}" -c "CREATE TABLE IF NOT EXISTS public.weekly_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT, progress text, blockers text, resolutions text, help_needed text, key_learnings text, next_week_plan text, status text NOT NULL DEFAULT 'Pending', date_submitted timestamptz, created_at timestamptz NOT NULL DEFAULT now());"

# 6) weekly_reports status check constraint (idempotent)
"${PSQL_BASE[@]}" -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'weekly_reports_status_check') THEN ALTER TABLE public.weekly_reports ADD CONSTRAINT weekly_reports_status_check CHECK (status IN ('Pending','Draft','Submitted')); END IF; END \$\$;"

# 7) Indexes
"${PSQL_BASE[@]}" -c "CREATE INDEX IF NOT EXISTS idx_weekly_reports_author ON public.weekly_reports(author_id);"
"${PSQL_BASE[@]}" -c "CREATE INDEX IF NOT EXISTS idx_weekly_reports_team ON public.weekly_reports(team_id);"
"${PSQL_BASE[@]}" -c "CREATE INDEX IF NOT EXISTS idx_weekly_reports_status ON public.weekly_reports(status);"
"${PSQL_BASE[@]}" -c "CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email));"

echo "All SQL statements executed successfully."
