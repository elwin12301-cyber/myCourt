# Backend operations

How to run, change, back up and recover the myCourt backend. All data is fictional unless the real-data gate has been passed (see below).

## Commands

Run from `backend/` with the virtual environment active. They use `MYCOURT_DATABASE_URL` (see `backend/.env.example`).

| Command | What it does |
|---|---|
| `python -m app.cli migrate` | Apply all database migrations (safe to run again) and load the Services-site demo data if the database has none |
| `python -m app.cli seed-demo` | Create two fictional advocates and three fictional matters, all flagged as demonstration. Prints a generated password **once** |
| `python -m app.cli remove-demo` | Delete the demonstration matters and the seeded demo accounts. Audit entries are kept |
| `python -m app.cli export FILE` | Logical backup to a JSON file |
| `python -m app.cli import FILE` | Restore a logical backup. Refused unless the database holds no accounts, matters or audit entries |
| `python -m app.cli check-real-data` | List what blocks enabling real client data; exit code 1 while anything is missing |

The server also applies migrations when it starts.

## Migrations

Revisions live in `backend/migrations/versions/` (`0001` Services-site tables, `0002` audit trail and its triggers, `0003` accounts, `0004` matters, `0005` documents/drafts/conversations, `0006` tasks/calendar/intake/billing). Each revision creates a fixed list of tables. **A later change to a table needs a new revision with explicit `op.add_column` and similar steps**; do not edit an old revision. A database created before Alembic was introduced is accepted: the first run records it as up to date.

## Backups

Two layers; use both.

1. **Whole database (physical).** With the Docker database:
   ```bash
   docker compose exec -T db pg_dump -U mycourt -Fc mycourt > mycourt.dump
   docker compose exec -T db pg_restore -U mycourt -d mycourt_restore --clean --if-exists < mycourt.dump
   ```
   Create the target database first. This copies everything, including sessions and the audit triggers.
2. **Logical archive.** `export` / `import` above. It is portable between PostgreSQL and SQLite, includes the audit chain, and is what the tests use to prove a restore reproduces the data. It leaves out sessions and sign-in attempts on purpose: people sign in again after a restore.

After any restore, check each important matter's trail: `GET /api/matters/{id}/audit/verify` must return `{"ok": true}`.

## Real client data

Real data is refused by default. `MYCOURT_ALLOW_REAL_DATA=true` is accepted only when `check-real-data` finds nothing missing: a changed secret of at least 32 characters, secure cookies (HTTPS), positive session limits, and the audit triggers installed. Passing this check is necessary, **not sufficient**: it does not replace a security review, and the API still has no firm roles, no multi-factor sign-in and no rate limiting beyond sign-in.

## Deactivating an account

List the operator's address in `MYCOURT_OPERATOR_EMAILS` (a JSON list), sign in as that person, and call `POST /api/admin/people/{id}/deactivate`. The person's sessions end at once; their past work and audit entries remain.

## Load check

`scripts/load_check.py` (see its header) fills a throw-away database with 500 matters and 50 users and measures the dashboard, list, save and search calls against SC-005 and SC-006.

## Tests

| Command | Needs |
|---|---|
| `python -m pytest` | Nothing (in-memory SQLite) |
| `python -m pytest -m postgres tests/postgres` | The Docker database running (`docker compose up -d --wait`); creates and drops its own `mycourt_test` database |
