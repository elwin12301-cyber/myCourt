# Validation log: Workspace Backend

Run on 2026-10-28 against PostgreSQL 16 in Docker (port 5433) and the dev servers.

## Automated checks
| Check | Result |
|---|---|
| `python -m pytest` (backend, in-memory SQLite) | **108 passed** (24 Services-site tests carried over, 84 new) |
| `python -m pytest -m postgres tests/postgres` | **4 passed** on real PostgreSQL |
| `npm test` (frontend) | **513 passed**, 2 skipped (dev aids) |
| `npm run build` (frontend) | type-check and production build succeed |

New backend tests cover: accounts, sign-in failure sameness, throttle and lock window, idle and absolute session limits, password change, deactivation, CSRF and Origin, per-matter access (not-found sameness, view/edit/owner levels, last-owner rule, removal effective at once), a route-by-route 404 sweep of every `/matters` route, optimistic-concurrency conflicts, deletion with confirmation, real-data refusal, audit entries for every changing route, audit immutability and chain tamper detection, draft state machine and approvals, research "nothing found" wording, no outbound network, record limits (413), deadline and invoice approval, intake conflict-check rule, server-side invoice totals, dashboard scoping, migrations (from empty, from the previous release, from a pre-Alembic database, repeat run), logical backup and restore, demo set and removal, the real-data gate, log redaction, and a check that the API matches `contracts/api.md`.

## PostgreSQL-only checks
| Check | Result |
|---|---|
| Migrations install the audit triggers; `UPDATE` and `DELETE` on `audit_entry` are rejected by the database | pass |
| Two simultaneous edits of one matter | exactly one `200` and one `409` |
| A failed request (invoice built from another matter's time entry) | no invoice and no audit row left behind |
| Eight concurrent writers on one matter | audit chain still verifies |

## Operator commands (on PostgreSQL)
`migrate` run twice (second is a no-op), `seed-demo` (3 matters, 2 accounts), `export` then `import` into a fresh database (every table count equal), a second `import` refused, `check-real-data` lists the missing safeguards (secret key, secure cookies).

## Load check (SC-005, SC-006)
`scripts/load_check.py`: 500 matters, 50 concurrent users, 2 000 requests, one server process, 0 errors.

| Call | median | p95 |
|---|---|---|
| dashboard | 539 ms | 987 ms |
| list matters | 515 ms | 881 ms |
| save task | 538 ms | 866 ms |
| search (research) | 535 ms | 986 ms |

Both targets met (dashboard p95 under 3 s; all calls p95 under 2 s).

## Browser checks (headless Chrome, frontend using the real backend and PostgreSQL)
| Script | Result |
|---|---|
| `specs/004-workspace-backend/browser-check.mjs` | **23 of 23** |
| `specs/002-services-site-prototype/browser-check.mjs` (public, no sign-in) | **60 of 60** |
| `specs/001-court-orders/browser-check.mjs` | **23 of 23** (on its own; one earlier run in a long chain stalled in the harness and was re-run) |

The new script covers: the sign-in gate and generic failure message, keyboard order and labels, registering, creating a matter, saving a task, a deadline that starts unapproved, a labelled demonstration research draft and its approval, persistence after reload, the audit trail verifying as intact, sign-out, a second person getting the same "not found" with no title, sharing at view-only, a view-only person seeing no edit or approve controls and no Audit tab, the Services-site demo opening without sign-in, and no horizontal scroll at 360 px on every matter tab.

## Quickstart scenarios
| # | Scenario | Evidence |
|---|---|---|
| 1 | Persistence | `test_auth.py`, browser W5 to W14 |
| 2 | Privacy | `test_access.py`, `test_route_coverage.py`, browser W17 to W21, PostgreSQL concurrency |
| 3 | Audit | `test_audit.py`, `tests/postgres`, browser W15 |
| 4 | Drafts | `test_drafts.py`, browser W11 to W12 |
| 5 | Records | `test_records.py`, browser W10 |
| 6 | Operate | `test_ops.py`, CLI run on PostgreSQL above |
| 7 | Logs | `test_ops.py` (redaction filter and full-scenario log scan) |
| 8 | Services site | browser 60 of 60 and 23 of 23 |

## Defects found and fixed while building
- **Lost update under concurrency.** The first version checked the edit version in Python only, so two simultaneous edits could both pass and the second overwrite the first. Found while designing the PostgreSQL test. Fixed: the version is now part of the SQL `UPDATE` (SQLAlchemy version counter); the loser gets `409`.
- **Audit chain fork risk.** Locking the "last entry" lets a waiting writer miss a row inserted meanwhile (READ COMMITTED). Fixed: lock the matter row first.
- **E-mail in a URL.** The first "find a person to share with" route took the address as a query parameter, against FR-024. Now a POST body, with a test.
- **Gate too wide.** The first sign-in gate also blocked Case status, Cause list and Court orders, which hold only public fictional data (FR-020). Narrowed to the private screens and tested.
- **Test harness.** The no-network test blocked Windows' own loopback socket pair; the tamper test read a stale cached row; route discovery missed nested routers. All were test-side and fixed.
- **Environment.** A PostgreSQL already installed on the machine owned port 5432 (container moved to 5433); `localhost` stalled 8 s on IPv6 (defaults use `127.0.0.1`); the browser needs the API on the same site as the page, so the front end uses `http://localhost:8000` for `VITE_API_URL`, not `127.0.0.1`.

## Deviations from tasks.md (honest list)
- **T038, T059, T072** ("switch each legacy screen"): the legacy workspace screens (Assistant, Research, Mapping, Voice, Hearing, Calendar, Intake, Billing, and the static Documents list) are demonstration mock-ups with no data model behind them. Instead of rewriting them, the backend-backed workflow is one new **matter workspace** (`frontend/src/pages/MatterWorkspace.tsx`) with tabs for overview, tasks, calendar, documents and voice-note transcripts, drafts and research, time and invoices, access and audit. The legacy screens still keep their state in the browser. The Cases screen and the Dashboard summary use the backend when `VITE_API_URL` is set.
- **T037, T039, T047**: adapters live in `frontend/src/api/workspace.ts` (no separate mock copy: in mock mode the original static screens are shown). The audit view is `AuditView` inside the matter workspace.
- **T080**: the demonstration workspace is built in code (`backend/app/seed/workspace_demo.py`), not a JSON file.
- **T009 and migrations**: each revision creates a fixed list of tables from the current models (`checkfirst`), so a later change to a table needs its own explicit revision. Documented in `docs/backend-operations.md`.
- **Voice control**: not built (research D18). The matter workspace stores transcripts; browser speech recognition is a separate front-end feature.
- **Client-side intake and conversation screens**: the API has intake and conversation routes with tests; there is no dedicated front-end screen for intake. Conversations are available through the demonstration provider only via the API.

## Not done
- Native-speaker review of translations (unchanged).
- No multi-factor sign-in, no firm roles, no rate limiting beyond sign-in, no original-file storage: the API stays demonstration-only and localhost-only.
- A security review. `check-real-data` is necessary, not sufficient.

## Constitution check
- **I Demonstration data never real**: matters carry `is_demo`; real matters are refused (`403`) while `ALLOW_REAL_DATA=false`; generated content is flagged `isDemoContent` and labelled "not legal advice".
- **II Advocate review**: drafts stay drafts until a person with edit access approves; editing withdraws approval; deadlines, invoices and conflict checks need a recorded confirmation; research with no hits says "Nothing found in the sources searched." (tested for the absence of "does not exist" wording).
- **III Accessible and responsive**: sign-in and every matter form have labels and field-tied errors; loading, empty and error states exist; keyboard order and 360 px layout checked in the browser.
- **IV Tested and type-safe**: 108 + 4 backend tests, 513 frontend tests, strict TypeScript, three browser checks.
- **V Confidentiality**: per-matter checks go through one function and are swept by a route-coverage test; the audit trail is append-only in the database and hash-chained; the server validates everything; identifiers are not in URLs; logs are redacted and scanned; no outbound HTTP client exists in the application. The real-data gate and the residual risks are recorded above.

Assumptions D1 (individual advocates) and D2 (store-only AI) were implemented as assumed and have **not** been confirmed by the user.
