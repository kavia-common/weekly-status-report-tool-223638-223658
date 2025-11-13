# weekly-status-report-tool-223638-223658

## Database Setup (Supabase Postgres)

To create required tables, constraints, and indexes in your Supabase Postgres:

Option A (generic):
1) Provide a Postgres connection URL by either:
   - Creating a file db_connection.txt in the repository root with the connection string on the first line, or
   - Setting an environment variable DATABASE_URL, or
   - Setting an environment variable SUPABASE_DB_URL

Example:
postgres://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres

2) Run the helper script:
chmod +x ./run_supabase_sql.sh
./run_supabase_sql.sh

Option B (frontend_app env var):
If you prefer using the frontend container env var, set REACT_APP_SUPABASE_DB_URL and run:
chmod +x ./frontend_app/run_supabase_sql_frontend.sh
./frontend_app/run_supabase_sql_frontend.sh

Both scripts execute each statement with:
psql -v ON_ERROR_STOP=1 -c "<single statement>"

It is safe to re-run; operations are idempotent (IF NOT EXISTS and constraint guards).