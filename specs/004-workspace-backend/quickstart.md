# Quickstart: Validating the Workspace Backend

A run guide for proving the feature works end to end. Details of fields are in [data-model.md](data-model.md) and routes in [contracts/api.md](contracts/api.md).

## Prerequisites
Python 3.12+, Node 22+, Docker Desktop, Git (see the root README). Start PostgreSQL from the repository root: `docker compose up -d --wait` (port 5433).

## Setup
```bash
cd backend
python -m venv .venv && .venv\Scripts\activate      # macOS/Linux: source .venv/bin/activate
pip install -e ".[dev]"
python -m app.cli migrate
python -m app.cli seed-demo
uvicorn app.main:app --port 8000
```
Settings use `MYCOURT_*` variables (`backend/.env.example`). `MYCOURT_ALLOW_REAL_DATA` stays `false`.

## Automated validation
| Command | Expected |
|---|---|
| `python -m pytest` (in `backend/`) | All tests pass on in-memory SQLite, including the access, audit, draft and migration tests |
| `MYCOURT_DATABASE_URL=<postgres url> python -m pytest -m postgres` | The same security tests pass on PostgreSQL (audit triggers included) |
| `npm test` and `npm run build` (in `frontend/`) | Pass |
| `python scripts/load_check.py` | 500 matters, 50 concurrent users: 95% of requests under 2 s (SC-005, SC-006) |

## Manual scenarios (one per user story)
1. **Persistence (US1, SC-001)**: register two people, A and B; sign in as A, create a matter and a task; sign out; sign in again → both are present. Wrong password → generic 401; six wrong attempts → 429.
2. **Privacy (US2, SC-002)**: as B, `GET /matters/{A's id}` → 404 with the same body as a random UUID; share it with B at `view`; B's `PATCH` → 403; remove B → 404 again; removing A as last owner → 409.
3. **Audit (US3, SC-003)**: view, edit and delete an item, then `GET /matters/{id}/audit` → three entries in order; `GET …/audit/verify` → `ok: true`; attempt `UPDATE audit_entry …` in `psql` → rejected by the trigger.
4. **Drafts (US4, SC-004)**: `POST /matters/{id}/research` with an empty search → `sources: []`, text "Nothing found in the sources searched."; the draft shows `status: draft`; `approve` as a view-only person → 403, as an editor → `approved`; edit the body → back to `draft`, approval kept in history.
5. **Records (US5)**: add a deadline (unapproved), an intake with `needs_review` (cannot be set `clear` without confirmation), two time entries and an invoice → total equals the entries.
6. **Operate (US6, SC-007, SC-008)**: `export` to a file, delete a matter, `remove-demo`, `import` into an empty database → counts and `audit/verify` match; run `migrate` twice → second run changes nothing.
7. **Logs (SC-009)**: after the scenarios, search the captured server output for the test passwords, e-mails and party names → no matches.
8. **Services site (SC-010)**: run `node specs/002-services-site-prototype/browser-check.mjs <out>` with `VITE_API_URL` set → 60 of 60 pass without signing in.

## Expected outcome
All automated checks pass and each manual scenario ends as described. Record results in `validation-log.md`.
