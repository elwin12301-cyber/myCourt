# Implementation Plan: Workspace Backend

**Branch**: `004-workspace-backend` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-workspace-backend/spec.md`

## Summary

Make every workspace screen persistent, private to the people assigned, and audited. The existing FastAPI service gains accounts and server-side sessions, per-matter authorisation through one choke point, an append-only hash-chained audit trail, optimistic concurrency, a draft/approval model for everything the system generates, records for tasks, calendar, documents, voice notes, intake and billing, ordered migrations, and logical backup/restore. Assistant, research and mapping return labelled demonstration drafts only; no matter text leaves the system. Two scope decisions (individual advocates; store-only AI) are assumed and recorded in [research.md](research.md) D1 and D2.

## Technical Context

**Language/Version**: Python 3.12 or newer (developed on 3.13); front end TypeScript 5.6 (strict)

**Primary Dependencies**: FastAPI, SQLAlchemy 2, psycopg 3, pydantic 2 (existing). New: Alembic (migrations, justified in D11). Password hashing uses the standard library (`hashlib.scrypt`, D4), so no hashing dependency is added.

**Storage**: PostgreSQL 16 (Docker, port 5433). Tests use in-memory SQLite for speed, plus a `postgres`-marked set run against the container for triggers and concurrency.

**Testing**: pytest + httpx for the API; Vitest for the front end; the headless-Chrome browser checks in `specs/`.

**Target Platform**: Local development and a single Linux or Windows server; browsers current Chrome, Edge, Firefox, Safari.

**Project Type**: Web application (`frontend/` + `backend/`)

**Performance Goals**: Dashboard in under 3 s with 500 matters and 50 concurrent users; 95% of saves and searches under 2 s (SC-005, SC-006).

**Constraints**: Server-side checks for every rule; no secrets or party names in logs; no matter text to external services; real data refused unless the D10 self-check passes; `localhost` only until then.

**Scale/Scope**: One organisation, up to 500 matters and 50 concurrent users, one region, no offline use.

## Constitution Check

*GATE: passed before Phase 0 and re-checked after Phase 1 (below).*

| Principle | Assessment |
|---|---|
| I. Demo data never presented as real | **Pass.** `is_demo` on matters; demonstration content from the draft provider is flagged `isDemoContent`; real matters refused while `ALLOW_REAL_DATA=false` (D10). |
| II. Advocate review before reliance | **Pass.** Drafts stay `draft` until a person with `edit` approves; editing returns them to `draft`; deadlines, invoices and conflict checks need a recorded confirmation; "nothing found" never says none exists (D9). |
| III. Accessible and responsive | **Pass, partly front end.** Stable error codes with plain messages support translation; the screens that call the API keep their labelled errors and loading/empty/error states (D15, D17). |
| IV. Tested, type-safe | **Pass.** Security tests (access, audit, CSRF, enumeration, throttle, concurrency, migrations, restore) are listed in the quickstart and become tasks; the build and both test suites gate merging. |
| V. Confidentiality and secure integration | **Pass, with the controlled change below.** Auth, per-matter checks and audit now exist, which is the precondition the principle sets for real data; they are verified before the flag may be turned on. Server validates everything; identifiers are never in URLs for lookups that carry them; logs are filtered (D15). |

**Technology constraints**: one new dependency (Alembic), justified; adapter pattern kept (front end keeps mock default, API client is a second implementation). **Workflow**: spec, plan and tasks precede code; destructive operations (matter delete, import) need explicit confirmation by design.

**Post-design re-check**: no new violations. Residual risk recorded: the API has no firm roles, no MFA and no rate limiting beyond sign-in; therefore it stays demonstration-only and localhost-only until a security review (see Assumptions in the spec). No Complexity Tracking entries are needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-workspace-backend/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── api.md           # Phase 1
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
backend/
├── pyproject.toml                  # + alembic
├── alembic.ini
├── migrations/                     # versions/0001_services_site.py, 0002_workspace.py, ...
├── app/
│   ├── main.py                     # app, middleware (CSRF/Origin, log filter), routers
│   ├── config.py                   # + secret, session limits, allow_real_data
│   ├── cli.py                      # migrate, seed-demo, remove-demo, export, import, check-real-data
│   ├── core/
│   │   ├── security.py             # scrypt hashing, tokens, constant-time compare
│   │   ├── sessions.py             # create/validate/revoke, idle + absolute limits
│   │   ├── throttle.py             # login attempts
│   │   ├── access.py               # matter_for(): the single authorisation choke point
│   │   ├── audit.py                # append entry + hash chain, verify
│   │   └── errors.py               # one error body, stable codes
│   ├── models/                     # services.py (existing), accounts.py, workspace.py, audit.py
│   ├── schemas/                    # request/response models per area (existing schemas.py moves here)
│   ├── services/
│   │   ├── drafts.py               # draft/approve state machine, demo provider
│   │   ├── intake.py               # conflict-check rule
│   │   ├── billing.py              # totals in paise
│   │   └── backup.py               # logical export/import
│   └── routers/
│       ├── services_site.py        # existing routes, unchanged behaviour
│       ├── auth.py  matters.py  contents.py  drafts.py  intake.py  audit.py  dashboard.py
└── tests/
    ├── test_services_site.py       # existing tests
    ├── test_auth.py  test_access.py  test_audit.py  test_drafts.py  test_records.py
    ├── test_concurrency.py  test_migrations.py  test_backup.py  test_logs.py
    └── postgres/                   # -m postgres: triggers, concurrency

frontend/src/
├── api/                            # client.ts (cookie + CSRF), auth.tsx, workspace adapters
└── pages/                          # screens switched one by one from context state to the API
scripts/load_check.py               # SC-005/006 load check
```

**Structure Decision**: Keep the two-folder layout from the previous change. Inside `backend/app`, split by responsibility (`core` for security rules that must have exactly one implementation, `services` for business rules, `routers` for HTTP). Authorisation (`access.py`) and audit (`audit.py`) are single modules that every router must use, so a missing check shows up as a failing test rather than a missed line. The Services-site code moves to `routers/services_site.py` and `models/services.py` without behaviour change (FR-020).

## Delivery slices

Each slice leaves the system working and tested; slices follow the user-story priorities.

1. **Foundations**: Alembic with the existing tables as revision 1, error body, log filter, config, test fixtures.
2. **US1 Accounts and sessions**: register, login, logout, me, throttle, CSRF/Origin, session expiry; front end `AuthProvider` and sign-in screen.
3. **US2 Matters and access**: matters, assignments, `matter_for`, last-owner rule; front end Cases screen.
4. **US3 Audit**: audit table, triggers, chain, verify, wiring into every write and read of a matter.
5. **US4 Drafts**: draft state machine, approvals, demo provider, conversations, research and mapping; front end Assistant, Research, Mapping, Voice (transcript only).
6. **US5 Records**: tasks, calendar, documents, intake, time entries, invoices, dashboard; front end Dashboard, Calendar, Documents, Intake, Billing.
7. **US6 Operations**: seed/remove demo, export/import, `check-real-data`, load check, PostgreSQL test set.
8. **Polish**: docs, README, constitution check record, validation log, browser checks with the API on.

## Risks and mitigations

- **A route forgets the access check** → no router loads matter data except through `matter_for`; a test enumerates all routes under `/matters` and calls each as an unassigned person expecting 404.
- **Audit gaps** → writes and audit entries share one transaction; a test fails if any mutating route leaves no entry.
- **Session theft or CSRF** → `HttpOnly` cookie, hashed token, CSRF header plus Origin check, short idle limit.
- **Scope drift into real AI** → the provider interface is the only extension point and there is no outbound HTTP client in the dependency list; adding one needs a new specification.
- **Assumptions D1/D2 wrong** → both are isolated (assignments; provider interface), so changing them does not rewrite the model.
