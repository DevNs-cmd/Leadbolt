# Leadbolt

Monorepo: `backend/` = FastAPI API, `frontend/` = Next.js 15 / React 19 app in `frontend/app/`. No tests and no CI anywhere — verification is manual.

## Backend

- Python venv lives at `backend/venv` (`backend/venv/Scripts/activate` on Windows). Deps: `backend/requirements.txt`.
- Run from `backend/`: `uvicorn app.main:app --reload` (port 8000; interactive docs at `/docs`, API prefix `/api/v1`).
- `app/core/config.py` (pydantic-settings) resolves the repo-root `.env` via `Path(__file__).parents[3]` — **not** CWD-relative — so the Supabase `DATABASE_URL` loads regardless of where uvicorn is launched. The `.env` `DATABASE_URL` points at the Supabase session pooler (`aws-1-ap-south-1.pooler.supabase.com`); the direct `db.<ref>.supabase.co` host is IPv6-only and unreachable from this machine. With no env loaded the app falls back to SQLite (`backend/leadbolt.db`).
- `database.py` engine is driven entirely by `settings.database_url` — swap the URL in `.env` to switch DBs, no code change.
- Schema is created at startup via `Base.metadata.create_all` in `app/core/database.py:init_db`. Do **not** use Alembic: `backend/alembic/` is an empty scaffold (`.gitkeep` only).
- **Active routers live in `app/api/routes/`** (`health.py`, `leads.py`). `app/routers/` is legacy: `leads.py` just re-exports the active router; `analytics.py`/`auth.py`/`outreach.py`/`proposals.py`/`qualification.py`/`scheduler.py` are empty placeholders. Don't add endpoints under `app/routers/`.
- In `app/api/routes/leads.py`, static paths (`/stats`, `/qualify`) must be registered **before** the parameterized `/{lead_id}` routes (FastAPI would otherwise match them as an int string and 422).
- AI qualification (`app/services/llm.py`): tries Groq, then OpenAI, then rule-based fallback. Without API keys it silently falls back to rule-based, so "qualify" never 500s.

## Frontend

- Dev server: `npm run dev` in `frontend/` (port 3000). Path alias `@/*` maps to the frontend root; styled primitives in `frontend/components/ui/`.
- `frontend/app/page.tsx` redirects to `/leads`. Implemented pages: `dashboard/`, `leads/`. The `outreach/`, `proposals/`, `qualification/`, `scheduler/` dirs are empty / unimplemented.
- All API calls go through `frontend/lib/axios.ts` — a fetch wrapper, **not** the axios npm package (axios isn't a dependency). Base URL is `http://localhost:8000` or `NEXT_PUBLIC_API_URL`. Callers pass the full path including `/api/v1`.
- Only lint script: `next lint`. Typecheck with `npx tsc --noEmit` from `frontend/` (tsconfig is strict). No frontend test setup.

## Gotchas

- `.env` at repo root is untracked; root `package-lock.json` is an empty stub (no root `package.json`).
- No `.gitignore` exists in the repo — keep runtime artifacts out of commits: `.env`, `backend/leadbolt.db`, `frontend/node_modules/`, `frontend/.next/`, `**/__pycache__/`, `backend/venv/`, `tsconfig.tsbuildinfo`.