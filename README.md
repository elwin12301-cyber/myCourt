# myCourt

A prototype of an advocate practice workspace (matters, documents, AI assistant, hearing prep, calendar, billing), plus a reference section that reproduces the public information structure of the eCourts portal, a demo **eCourts Services site** (Case Status, Court Orders, Cause List, Caveat Search, Process Details, Location) in six languages, and a small **backend API** that serves the demonstration data from PostgreSQL.

> **Demonstration only.** All case, client and financial data is fictional. myCourt is not the official eCourts portal and is not affiliated with the Indian judiciary. Verify everything on [ecourts.gov.in](https://ecourts.gov.in/ecourts2.0/).

## Repository layout

```
frontend/   React 18 + TypeScript + Vite app (npm)
backend/    FastAPI + SQLAlchemy API on PostgreSQL (Python)
docker-compose.yml   PostgreSQL for local development
docs/       audit, eCourts analysis, gap analysis, plan, prototype guide
specs/      Spec Kit feature specs, plans, tasks, validation logs and browser checks
.specify/   Spec Kit constitution and templates
```

## Prerequisites

| Requirement | Version | Used for |
|---|---|---|
| [Python](https://www.python.org/) | 3.12 or newer (developed on 3.13) | Backend |
| [Node.js](https://nodejs.org/) | 22 or newer (developed on 22.17) | Frontend (includes npm) |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | current | PostgreSQL 16 for the backend |
| [Git](https://git-scm.com/) | any recent version | Clone and contribute |
| Chrome or Edge | current, with a microphone | Viewing the app and browser-based voice features |
| Internet access | | `npm install` and `pip install` |

The frontend runs on its own with in-browser mock data, so Python and Docker are only needed if you want the backend.

Optional, only for the Spec Kit workflow (`/speckit-*`): [uv](https://docs.astral.sh/uv/), the Specify CLI and [Claude Code](https://claude.com/claude-code).

```bash
python --version   # 3.12 or newer
node -v            # v22 or newer
docker --version
git --version
```

## Getting started

### Frontend only (mock data in the browser)

```bash
git clone https://github.com/elwin12301-cyber/myCourt.git
cd myCourt/frontend
npm install
npm run dev
```

Open the address Vite prints (normally http://localhost:5173).

### With the backend and PostgreSQL

```bash
# 1. Database (from the repository root)
docker compose up -d --wait

# 2. Backend API on http://127.0.0.1:8000  (interactive docs at /docs)
cd backend
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --port 8000

# 3. Frontend, pointed at the API
cd ../frontend
npm install
set VITE_API_URL=http://localhost:8000    # macOS/Linux: export VITE_API_URL=http://localhost:8000
npm run dev
```

Use `localhost` (not `127.0.0.1`) for both the page and `VITE_API_URL`: the session cookie only travels between pages on the same site.

With the API address set, the workspace asks you to **create an account or sign in**. Your matters, tasks, calendar entries, documents, drafts, time entries and invoices are then saved on the server and are visible only to the people you share each matter with (view, edit or owner). Every action is recorded in an append-only audit trail that owners can read and verify. The eCourts Services site, Case status, Cause list and Court orders stay open without signing in. To try it with ready-made fictional data: `python -m app.cli seed-demo` (prints a password once), then sign in as `demo.advocate.one@example.invalid`.

On start the backend applies its database migrations and loads the fictional Services-site data (8 cases, 8 court rooms, 6 caveats, 3 processes, 14 locations). Without `VITE_API_URL` the frontend uses its mock data as before.

PostgreSQL is published on **port 5433** (not 5432) so it does not clash with a PostgreSQL already installed on your machine. Settings can be changed with `MYCOURT_*` variables; see `backend/.env.example`.

## Scripts

| Where | Command | What it does |
|---|---|---|
| `frontend/` | `npm run dev` | Dev server with hot reload |
| `frontend/` | `npm run build` | Type-check and build to `dist/` |
| `frontend/` | `npm test` | Unit tests (Vitest) |
| `backend/` | `python -m pytest` | API tests (in-memory SQLite; no Docker needed) |
| `backend/` | `python -m pytest -m postgres tests/postgres` | Triggers and concurrency on real PostgreSQL (needs `docker compose up -d --wait`) |
| `backend/` | `python -m app.cli migrate` | Apply database migrations |
| `backend/` | `uvicorn app.main:app --reload` | API with auto-reload |
| repo root | `docker compose down` | Stop PostgreSQL (add `-v` to delete its data) |

The browser checks drive headless Chrome and need the frontend (and optionally the backend) running: `node specs/002-services-site-prototype/browser-check.mjs <output-folder>`.

## The API

All endpoints are under `/api`; the interactive reference is at `/docs`, and the full contract is [specs/004-workspace-backend/contracts/api.md](specs/004-workspace-backend/contracts/api.md). Anything that carries a name, process ID or e-mail address is a `POST` with a body, so it never appears in a URL or access log. Every error has the same body: `{code, message, fields}`.

**Public (fictional data, no sign-in)**

| Endpoint | Purpose |
|---|---|
| `GET /health` | Database check and mode (`demonstration-only` unless real data is enabled) |
| `POST /cases/search`, `/orders/search`, `/caveats/search`, `/locations/find` | Case Status (eight searches), Court Orders, active caveats, fictional court addresses |
| `GET /court-rooms`, `POST /cause-lists` | Courts and their cause list for a date |
| `POST /processes/lookup` | Needs process ID **and** the registered e-mail; a wrong e-mail and an unknown ID give the same answer; the e-mail is never returned |

**Signed in (cookie session plus CSRF token)**

| Area | Endpoints |
|---|---|
| Accounts | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/password`, operator-only `/admin/people/{id}/deactivate` |
| Matters and access | `/matters`, `/matters/{id}`, `/matters/{id}/assignments`, `/people/lookup`. Someone with no access gets exactly the answer for a matter that does not exist |
| Matter contents | `tasks`, `calendar`, `documents`, `voice-notes`, `time-entries`, `invoices`, each under `/matters/{id}/` |
| Drafts | `/matters/{id}/drafts` (+ `approve`), `/research`, `/mappings`, `/conversations`. Everything generated is a draft until someone with edit access approves it |
| Intake | `/intake` and `/intake/{id}/conflict-check/confirm` (a conflict check can only be cleared by a recorded confirmation) |
| Audit | `/matters/{id}/audit` and `/audit/verify` (owners only; entries cannot be edited or removed) |
| Summary | `/dashboard`, `/calendar` |

The server validates every request again (unknown fields are rejected), so the front end's checks are a convenience, not the control. Searching the CNR `ERROR00000000000` returns 503 to exercise the retry state.

Operator commands (`python -m app.cli ...`: `migrate`, `seed-demo`, `remove-demo`, `export`, `import`, `check-real-data`) are described in [docs/backend-operations.md](docs/backend-operations.md).

## What's in the app

- **Workspace:** dashboard, cases, case status, cause list and court orders, AI assistant, research, documents and OCR, section mapping, voice notes, hearing preparation, calendar, client intake, billing.
- **eCourts Services site** (`#/services`): all seven Search Menu services, High Courts, Contact, About, forms, help, policies and site search, in English, हिन्दी, मराठी, ગુજરાતી, ಕನ್ನಡ and தமிழ். The non-English text is machine-assisted and **has not been reviewed by a native speaker**; every translated page says so.
- **eCourts portal reference:** overview, About, High Courts, District Courts, Forms, Contact, Help, portal search (snapshot dated 2026-10-26).
- **Accessibility:** skip link, keyboard-operable controls, and an **Aa** display menu.

## Data and integrations

The backend serves fictional data only. A real integration must read from an authorised source on the server; do not scrape the official site or bypass its CAPTCHA (see `docs/implementation-plan.md`). The captcha in the forms is a demonstration with no security purpose.

## Documentation

- [Repository audit](docs/repository-audit.md)
- [eCourts reference analysis](docs/ecourts-reference-analysis.md)
- [Gap analysis](docs/gap-analysis.md)
- [Implementation plan](docs/implementation-plan.md)
- [Prototype guide](docs/prototype-guide.md)
- [Project constitution](.specify/memory/constitution.md)

## Known limitations

- **Demonstration only.** The API refuses real client data unless `MYCOURT_ALLOW_REAL_DATA=true` **and** `python -m app.cli check-real-data` passes (changed secret, HTTPS cookies, audit triggers). Passing it is necessary, not sufficient: there are no firm roles, no multi-factor sign-in, no rate limiting beyond sign-in, and no security review yet. Keep it on localhost with fictional data.
- **Backend-backed screens.** With `VITE_API_URL` set, the Cases screen, the Dashboard summary and the new matter workspace (tasks, calendar, documents, drafts, time and invoices, access, audit) are saved on the server. The older standalone screens (Assistant, Research, Mapping, Voice, Hearing, Calendar, Intake, Billing, Documents) are still demonstration mock-ups that keep their state in the browser.
- **No real AI.** Assistant, research and mapping return labelled demonstration drafts; no matter text leaves the system. Original files are not stored, only register entries and extracted text.
- **Voice control is not built:** the Voice page does not use the browser's speech recognition yet, although a microphone is listed above for that purpose.
- Migrations create a fixed list of tables per revision; a later table change needs its own revision.
- The non-English translations are unreviewed. No linter is configured.
