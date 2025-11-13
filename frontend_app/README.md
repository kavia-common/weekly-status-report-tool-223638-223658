# Weekly Status Report - React Frontend

React app for DigitalT3 Weekly Status Report Platform. Authentication is handled via Supabase (email/password or magic link). Users can create weekly reports with auto-save drafts and view history.

## Features

- Supabase auth (email/password, magic link)
- Dashboard layout with Executive Gray theme
- Weekly report editor with auto-save to `weekly_reports`
- Submit/publish flow (`draft` -> `submitted`)
- History view with status and date filters
- Graceful handling for missing Supabase env vars
- TEMP: Auth bypass feature flag for demos/local usage

## Requirements

- Node.js 18+
- Supabase project (URL + anon key)
- Table: `weekly_reports`

### Database setup via REACT_APP_SUPABASE_DB_URL

If you have a Postgres connection string available as REACT_APP_SUPABASE_DB_URL, you can create the `teams`, `profiles`, and `weekly_reports` tables (plus constraints and indexes) by running:

Option 1:
```bash
export REACT_APP_SUPABASE_DB_URL="postgres://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres"
chmod +x ./run_supabase_sql_frontend.sh
./run_supabase_sql_frontend.sh
```

Option 2 (auto-source from frontend_app/.env or .env.local):
```bash
chmod +x ./run_supabase_sql_via_env.sh
./run_supabase_sql_via_env.sh
```

Both scripts execute each statement separately with `psql -v ON_ERROR_STOP=1 -c "<SQL>"` and are idempotent.

Troubleshooting:
- If you see a network error like "Network is unreachable", ensure outbound network access to Supabase Postgres is allowed from your environment and the DB URL is correct.
 
### Supabase Table Schema

Run this SQL in Supabase:

```sql
create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  week_start date not null,
  status text not null check (status in ('draft','submitted')),
  sections jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now()
);

-- Optional helpful indexes
create index if not exists weekly_reports_user_week_idx on public.weekly_reports (user_id, week_start);
create index if not exists weekly_reports_status_idx on public.weekly_reports (status);
```

Note: Ensure Row Level Security (RLS) is configured appropriately to restrict records to the owning user (`user_id = auth.uid()`).

## Environment Variables

Create a `.env` file in `frontend_app/`:

```
REACT_APP_SUPABASE_URL=YOUR_SUPABASE_URL
REACT_APP_SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
REACT_APP_FRONTEND_URL=http://localhost:3000
# Feature flags (comma-separated). Set AUTH_BYPASS to bypass Supabase and always sign in a default user.
REACT_APP_FEATURE_FLAGS=AUTH_BYPASS
```

If `REACT_APP_SUPABASE_URL` or `REACT_APP_SUPABASE_KEY` are missing, the UI will show a config error unless `AUTH_BYPASS` is enabled.
You can copy from the provided `.env.example`.

## Getting Started

Install dependencies and run the app:

```bash
npm install
npm start
```

The app will open at http://localhost:3000

## Pages

- `/login` – Sign in via password or magic link (or instant sign-in in AUTH_BYPASS mode).
- `/dashboard` – Overview with quick actions.
- `/weekly-report` – Editor with auto-save and submit.
- `/history` – Report list with filters.

## Code Structure

- `src/supabaseClient.js` – Supabase initialization with env checks
- `src/transports/` – (reserved for future API clients)
- `src/contexts/AuthContext.js` – Auth provider and hooks (supports AUTH_BYPASS)
- `src/components/Layout/*` – Dashboard shell (Topbar, Sidebar, Layout)
- `src/components/UI/*` – Reusable UI components
- `src/pages/*` – Screens
- `src/theme.css` – Executive Gray theme

## Styling

The "Executive Gray" theme uses charcoal and silver tones, with professional dashboard layout and subtle shadows.

## Security Notes

- No secrets are hardcoded. Env variables are required.
- Ensure RLS and policies in Supabase enforce `user_id = auth.uid()`.
- Input validation is implemented client-side for basic checks.
- AUTH_BYPASS is intended only for local/demo environments. Do not enable in production.

## Scripts

- `npm start` – Start dev server
- `npm run build` – Build production bundle
- `npm test` – Run tests (CRA defaults)

## Troubleshooting

- If login fails with magic link locally, ensure `REACT_APP_FRONTEND_URL` matches your local URL and is configured in Supabase auth settings.
- If you see "Config Error" badge, set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_KEY` in `.env`, or enable `REACT_APP_FEATURE_FLAGS=AUTH_BYPASS` for demos.
