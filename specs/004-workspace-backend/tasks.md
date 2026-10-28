---

description: "Task list for the workspace backend"
---

# Tasks: Workspace Backend

**Input**: Design documents from `/specs/004-workspace-backend/`

**Prerequisites**: plan.md, spec.md, research.md (D1 to D18), data-model.md, contracts/api.md, quickstart.md

**Tests**: INCLUDED. Constitution Principle IV requires tests for validation, adapters and API logic, and the spec's success criteria (SC-002 to SC-010) are verified by them. Write each story's tests first and see them fail.

**Organization**: Grouped by user story. Paths are repository-relative: `backend/app/...`, `backend/tests/...`, `frontend/src/...`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 to US6, matching the stories in spec.md

---

## Phase 1: Setup

**Purpose**: Dependencies, layout and configuration. The Services-site behaviour must not change (FR-020).

- [x] T001 Add `alembic>=1.13` to `dependencies` in `backend/pyproject.toml` and install it in `backend/.venv`
- [x] T002 Restructure `backend/app/` into `core/`, `models/`, `schemas/`, `services/`, `routers/` per plan.md: move `models.py` to `backend/app/models/services.py`, `schemas.py` to `backend/app/schemas/services_site.py`, `search.py` to `backend/app/services/search.py`, and `routers/api.py` to `backend/app/routers/services_site.py`; update imports; `python -m pytest` must still pass 24 tests unchanged
- [x] T003 [P] Extend `backend/app/config.py` with `secret_key`, `session_idle_minutes=30`, `session_max_hours=12`, `login_max_failures=5`, `login_window_minutes=15`, `allow_real_data=false`, `operator_emails`, `cookie_secure`; reject the default secret when `allow_real_data` is true
- [x] T004 [P] Update `backend/.env.example` with every new `MYCOURT_*` variable and a comment for each
- [x] T005 [P] Create `backend/alembic.ini` and `backend/migrations/env.py` reading `settings.database_url` and the metadata from `app.models`

---

## Phase 2: Foundational (blocks every story)

**Purpose**: Things every story uses: one error body, safe logging, a base model, the first migration, the audit writer, and test helpers.

**⚠️ CRITICAL**: No user story starts until this phase is done.

- [x] T006 [P] Implement the single error body and stable codes from contracts/api.md in `backend/app/core/errors.py` (exception classes `NotFound`, `Forbidden`, `Conflict`, `NotSignedIn`, `TooMany`, `TooLarge`; handlers for these and for request validation that list field names only and never echo submitted values)
- [x] T007 [P] Implement the log filter in `backend/app/core/logging.py` (drop request bodies and query strings; redact values under keys `password`, `token`, `email`, `cnr`, `name`, `party`) and install it in `backend/app/main.py`
- [x] T008 [P] Create the base mixin in `backend/app/models/base.py`: UUID string primary key, `version` (starts at 1), `created_at`, `updated_at`, and a helper that bumps `version` and raises `Conflict` on mismatch
- [x] T009 Create Alembic revision `backend/migrations/versions/0001_services_site.py` for the existing Services-site tables, unchanged; keep `Base.metadata.create_all` only for the test fixtures
- [x] T010 Define `AuditEntry` in `backend/app/models/audit.py` and revision `backend/migrations/versions/0002_audit.py` (fields and hash chain per data-model.md; database triggers that reject UPDATE and DELETE on both PostgreSQL and SQLite)
- [x] T011 Implement `append_audit(session, person_id, matter_id, action, target_type, target_id, detail)` and `verify_chain(session, matter_id)` in `backend/app/core/audit.py` (hash = SHA-256 of previous hash plus canonical fields; entry added in the caller's transaction; `detail` is limited to 200 characters)
- [x] T012 [P] Write the test helpers in `backend/tests/conftest.py` and `backend/tests/helpers.py`: in-memory SQLite engine with migrations applied, `make_person()`, `sign_in(client, person)` returning headers with the cookie and CSRF token, `make_matter(owner)`; register the `postgres` pytest marker in `backend/pyproject.toml`
- [x] T013 [P] Write tests for errors and logs in `backend/tests/test_errors_logs.py`: every error has the contracted body, validation errors do not echo submitted values, and a captured log of a failing request contains no password, e-mail or party name

**Checkpoint**: Foundation ready; user stories can start.

---

## Phase 3: User Story 1 - Sign in and keep my work (Priority: P1) 🎯 MVP

**Goal**: Accounts, sessions and a signed-in front end. Work saved by a person is there after sign-out and sign-in (the saved records themselves arrive in US2 and later stories; this phase proves the session and account layer).

**Independent Test**: Register, sign in, call `GET /auth/me`, sign out, confirm the cookie no longer works; wrong password gives the generic 401; six wrong attempts give 429; an idle session expires.

### Tests for User Story 1 ⚠️ (write first, see them fail)

- [x] T014 [P] [US1] Auth flow tests in `backend/tests/test_auth.py`: register returns the same 202 for a new and an existing address; login sets an `HttpOnly` cookie; wrong password, unknown account and deactivated account give the identical 401 body; logout revokes the session
- [x] T015 [P] [US1] Throttle and session-limit tests in `backend/tests/test_sessions.py`: five failures in 15 minutes then 429 with the same body for any account; idle limit and absolute limit end the session (use an injectable clock); password change ends other sessions
- [x] T016 [P] [US1] CSRF and Origin tests in `backend/tests/test_csrf.py`: a state-changing request without `X-CSRF-Token`, or from a disallowed `Origin`, gets 403; Services-site searches stay public and need neither

### Implementation for User Story 1

- [x] T017 [P] [US1] Create `Person`, `Session` and `LoginAttempt` in `backend/app/models/accounts.py` and revision `backend/migrations/versions/0003_accounts.py` (e-mail unique and case-insensitive; token stored only as SHA-256)
- [x] T018 [P] [US1] Implement scrypt hashing in `backend/app/core/security.py`: versioned hash string, 16-byte salt, constant-time verify, a dummy verify for unknown accounts, minimum length 12 and a short common-password list
- [x] T019 [US1] Implement session create, validate (idle and absolute limits, sliding last-seen), revoke and revoke-all in `backend/app/core/sessions.py` (depends on T017, T018)
- [x] T020 [P] [US1] Implement the login throttle in `backend/app/core/throttle.py` (hashed e-mail and client address; purge rows older than 24 hours) (depends on T017)
- [x] T021 [US1] Add request models in `backend/app/schemas/auth.py` and routes `register`, `login`, `logout`, `me`, `password` in `backend/app/routers/auth.py`; write `sign_in` and `sign_out` audit entries (account events have no matter) (depends on T011, T019, T020)
- [x] T022 [US1] Add the CSRF and Origin check as middleware plus the `current_person` dependency in `backend/app/core/deps.py`, wired in `backend/app/main.py` (depends on T019)
- [x] T023 [US1] Add the operator-only `POST /admin/people/{id}/deactivate` in `backend/app/routers/auth.py`; it revokes all sessions at once
- [x] T024 [P] [US1] Create the API client in `frontend/src/api/client.ts` (`credentials: 'include'`, CSRF header from the sign-in response, error body parsing into `ApiError` with `code`) and test it in `frontend/src/api/client.test.ts`
- [x] T025 [P] [US1] Create `AuthProvider` and `useAuth` in `frontend/src/api/auth.tsx` and the sign-in and register screen in `frontend/src/pages/SignIn.tsx` (labelled fields, errors tied to fields, generic failure message, loading and error states, keyboard operable)
- [x] T026 [US1] Gate the workspace behind sign-in in `frontend/src/App.tsx` only when `VITE_API_URL` is set; without it the app behaves as today; keep `#/services` public (depends on T024, T025)
- [x] T027 [US1] Test the gate in `frontend/src/api/auth.test.tsx` (workspace hidden when signed out, services page still reachable, mock mode unchanged)

**Checkpoint**: US1 works alone: accounts and sessions with the front end signed in.

---

## Phase 4: User Story 2 - Matters are private to the people assigned (Priority: P1)

**Goal**: Matters and assignments with one authorisation choke point; "not found" for anyone without access.

**Independent Test**: A creates a matter; B cannot read, list, search, change or learn of it; sharing at `view` allows reads only; removing B closes access at once; the last owner cannot be removed.

### Tests for User Story 2 ⚠️

- [x] T028 [P] [US2] Access tests in `backend/tests/test_access.py`: B gets a body identical to a random UUID's for read, list, search, patch and delete; `view` cannot edit (403); `edit` can; removal takes effect on the next request; last owner cannot be removed or demoted (409)
- [x] T029 [P] [US2] Route-coverage test in `backend/tests/test_route_coverage.py`: enumerate every route under `/matters` and `/conversations` from the OpenAPI document, call each as an unassigned person with a real matter id, and expect 404; fails if a new route skips the check
- [x] T030 [P] [US2] Matter rule tests in `backend/tests/test_matters.py`: delete needs `?confirm=` equal to the title; edit with a stale `version` gets 409 and changes nothing; `isDemo=false` is refused (403) while `allow_real_data` is false; IDs are random UUIDs

### Implementation for User Story 2

- [x] T031 [P] [US2] Create `Matter` and `Assignment` in `backend/app/models/workspace.py` and revision `backend/migrations/versions/0004_matters.py` (index on `assignment(person_id, matter_id)`)
- [x] T032 [US2] Implement `matter_for(session, person, matter_id, need)` in `backend/app/core/access.py`: join on `assignment`, `NotFound` when no assignment, `Forbidden` when the level is too low, and a `visible_matters(session, person)` query used by every list (depends on T031)
- [x] T033 [P] [US2] Add matter and assignment request/response models in `backend/app/schemas/matters.py`
- [x] T034 [US2] Implement matter routes (list, create, get, patch, delete) in `backend/app/routers/matters.py`, using only `matter_for` and `visible_matters`; creation makes the caller owner; every write calls `append_audit` in the same transaction (depends on T032, T033)
- [x] T035 [US2] Implement assignment routes (list, share, change level, remove) with the last-owner rule in `backend/app/routers/matters.py` (depends on T034)
- [x] T036 [US2] Implement the matter delete with confirmation that removes dependants but keeps audit entries, in `backend/app/services/matters.py` (depends on T034)
- [x] T037 [P] [US2] Add `MatterAdapter` (list, get, create, update, share) in `frontend/src/api/workspace.ts` with a mock implementation in `frontend/src/features/workspace/mockMatters.ts`; select by `VITE_API_URL` as for the Services site
- [x] T038 [US2] (Cases screen done; matter detail is the matter workspace) Switch the Cases screen and the case detail to the adapter in `frontend/src/pages/Cases.tsx` with loading, empty, error and conflict states, and add a share dialog (view/edit/owner) with labelled controls (depends on T037)
- [x] T039 [P] [US2] Adapter tests in `frontend/src/api/workspace.test.ts` (paths, bodies, version sent on edit, 404 and 409 mapped to states)

**Checkpoint**: US1 and US2 work: signed-in people see only their matters.

---

## Phase 5: User Story 3 - A trail of who did what (Priority: P1)

**Goal**: The audit trail is complete, readable by owners, tamper-evident and unalterable. (The writer and table exist from Phase 2; this phase proves and exposes them.)

**Independent Test**: View, edit and delete on a matter produce three ordered entries; `verify` returns ok; an UPDATE or DELETE on the table is rejected by the database; a tampered row makes `verify` report the first bad entry.

### Tests for User Story 3 ⚠️

- [x] T040 [P] [US3] Trail tests in `backend/tests/test_audit.py`: create, update, delete, share, unshare, approve and export each add an entry with person, time, action and target; reads of a matter add `view`; a denied attempt adds `denied`; `detail` never contains the matter title, party names or e-mails
- [x] T041 [P] [US3] Immutability tests in `backend/tests/test_audit_immutable.py`: raw UPDATE and DELETE on `audit_entry` fail (SQLite) and the same in `backend/tests/postgres/test_audit_triggers.py` marked `postgres`; no router exposes an edit or delete
- [x] T042 [P] [US3] Chain tests in `backend/tests/test_audit_chain.py`: `verify` is ok on a clean trail, and reports the first bad id after the trigger is dropped and a row altered or removed
- [x] T043 [P] [US3] Completeness test in `backend/tests/test_audit_complete.py`: iterate every mutating route (POST, PUT, PATCH, DELETE under `/matters`) and fail if a successful call leaves no new audit entry

### Implementation for User Story 3

- [x] T044 [US3] Add the `view` entry (one per matter open, not per list row) and the `denied` entry (without revealing existence to the caller) inside `matter_for` in `backend/app/core/access.py`
- [x] T045 [P] [US3] Add audit response models in `backend/app/schemas/audit.py`
- [x] T046 [US3] Implement `GET /matters/{id}/audit` (owner only, paged, newest first) and `GET /matters/{id}/audit/verify` in `backend/app/routers/audit.py` and include the router in `backend/app/main.py` (depends on T044, T045)
- [x] T047 [P] [US3] Add the audit view for owners in `frontend/src/pages/MatterAudit.tsx` (table with caption, paging, a "verify" button and result), linked from the case detail, with tests in `frontend/src/pages/MatterAudit.test.tsx`

**Checkpoint**: US1 to US3 give accounts, privacy and a verifiable trail: the preconditions Principle V sets for real data.

---

## Phase 6: User Story 4 - Documents, notes and drafts keep their status (Priority: P2)

**Goal**: Documents, voice-note transcripts, conversations and drafts persist; generated items are drafts until approved; nothing sent to an external service.

**Independent Test**: Create a research draft with no hits → `sources: []` and the fixed "nothing found" text; approve as a view-only person (403) and as an editor (approved); edit the body (back to draft, approval kept in history).

### Tests for User Story 4 ⚠️

- [x] T048 [P] [US4] Draft state-machine tests in `backend/tests/test_drafts.py`: every response carries `status`, `sources`, `isDemoContent`; approve needs `edit`; editing an approved draft returns it to `draft` and marks the old approval revoked; approval history is kept
- [x] T049 [P] [US4] Research and mapping tests in `backend/tests/test_research.py`: empty result stores `sources: []` and exactly "Nothing found in the sources searched."; no response claims that nothing exists
- [x] T050 [P] [US4] No-egress test in `backend/tests/test_no_egress.py`: replace the socket layer with one that fails on any outbound connection and run the assistant, research, mapping and voice routes; also assert `httpx`/`requests` are imported only in tests
- [x] T051 [P] [US4] Document and voice-note tests in `backend/tests/test_documents.py`: text over 200 000 characters gets 413, unknown file type gets 422, review records person and time, access follows the matter

### Implementation for User Story 4

- [x] T052 [P] [US4] Create `Document`, `VoiceNote`, `DraftItem`, `DraftApproval`, `Conversation`, `Message` in `backend/app/models/workspace.py` and revision `backend/migrations/versions/0005_documents_drafts.py`
- [x] T053 [P] [US4] Add request/response models in `backend/app/schemas/drafts.py` and `backend/app/schemas/documents.py` (size limits from data-model.md)
- [x] T054 [US4] Implement the draft state machine (`create`, `update`, `approve`, revoke on edit) in `backend/app/services/drafts.py` (depends on T052)
- [x] T055 [US4] Implement the `DraftProvider` interface and `DemoProvider` (labelled demonstration content, no network) in `backend/app/services/provider.py`; document that a real provider needs its own specification
- [x] T056 [US4] Implement draft, conversation, research and mapping routes in `backend/app/routers/drafts.py` (depends on T054, T055)
- [x] T057 [US4] Implement document and voice-note routes including `review` in `backend/app/routers/contents.py` (depends on T052, T053)
- [x] T058 [P] [US4] Add draft/document/conversation adapters (API and mock) to `frontend/src/api/workspace.ts` and `frontend/src/features/workspace/`
- [x] T059 [US4] (done as the matter workspace tabs; see validation-log.md, deviations) Switch the Assistant, Research, Mapping, Documents and Voice screens to the adapters in `frontend/src/pages/` (`Assistant.tsx`, `Research.tsx`, `Mapping.tsx`, `Documents.tsx`, `Voice.tsx`); show a "Draft: advocate verification required" label, sources, and an Approve button for editors; the Voice screen sends a transcript only (depends on T058)
- [x] T060 [P] [US4] Front-end tests in `frontend/src/pages/drafts.test.tsx` (label always shown, Approve hidden for view-only, empty-sources text)

**Checkpoint**: Drafts persist with their status and approvals.

---

## Phase 7: User Story 5 - Calendar, intake and billing (Priority: P2)

**Goal**: Tasks, calendar entries, intake with a confirmed conflict check, time entries and invoices.

**Independent Test**: Add a deadline (unapproved), an intake at `needs_review` that cannot become `clear` without confirmation, two time entries and an invoice whose total equals the entries.

### Tests for User Story 5 ⚠️

- [x] T061 [P] [US5] Task and calendar tests in `backend/tests/test_tasks_calendar.py`: only people on the matter see entries; `GET /calendar?from=&to=` spans matters; a deadline is unapproved until `approve` by an editor
- [x] T062 [P] [US5] Intake tests in `backend/tests/test_intake.py`: setting `clear` without a confirming person is 422; confirmation records person and time; convert creates a matter with the caller as owner
- [x] T063 [P] [US5] Billing tests in `backend/tests/test_billing.py`: totals are computed on the server from entries in paise, a client-sent total is ignored, minutes limit 1 to 1 440, an approved invoice is recorded but never sent
- [x] T064 [P] [US5] Dashboard test in `backend/tests/test_dashboard.py`: counts and the next five dates include only the caller's matters

### Implementation for User Story 5

- [x] T065 [P] [US5] Create `Task`, `CalendarEntry`, `IntakeRecord`, `TimeEntry`, `Invoice`, `InvoiceLine` in `backend/app/models/workspace.py` and revision `backend/migrations/versions/0006_records.py`
- [x] T066 [P] [US5] Add request/response models in `backend/app/schemas/records.py`
- [x] T067 [P] [US5] Implement the conflict-check rule in `backend/app/services/intake.py` and totals in `backend/app/services/billing.py`
- [x] T068 [US5] Implement task, calendar, time-entry and invoice routes (with `approve`) in `backend/app/routers/contents.py` (depends on T065, T066, T067)
- [x] T069 [US5] Implement intake routes (including `conflict-check/confirm` and `convert`) in `backend/app/routers/intake.py` (depends on T067)
- [x] T070 [US5] Implement `GET /dashboard` and `GET /calendar` aggregate queries in `backend/app/routers/dashboard.py` with the indexes from data-model.md
- [x] T071 [P] [US5] Add task/calendar/intake/billing adapters (API and mock) to `frontend/src/api/workspace.ts` and `frontend/src/features/workspace/`
- [x] T072 [US5] (done as the matter workspace tabs; see validation-log.md, deviations) Switch `Dashboard.tsx`, `Calendar.tsx`, `Intake.tsx`, `Billing.tsx` and `Hearing.tsx` in `frontend/src/pages/` to the adapters; unapproved deadlines and invoices are labelled as drafts; the conflict check "clear" option needs a confirmation checkbox with a clear label (depends on T071)
- [x] T073 [P] [US5] Front-end tests in `frontend/src/pages/records.test.tsx`

**Checkpoint**: All workspace screens are served by the backend.

---

## Phase 8: User Story 6 - Safe to run, change and recover (Priority: P3)

**Goal**: Repeatable migrations, demonstration data on demand, backup/restore, the real-data gate and a health check.

**Independent Test**: Start empty, `migrate`, `seed-demo`, `export`, delete a matter, `remove-demo`, `import` into an empty database, and see counts and `audit/verify` match; running `migrate` twice changes nothing.

### Tests for User Story 6 ⚠️

- [x] T074 [P] [US6] Migration tests in `backend/tests/test_migrations.py`: upgrade from empty reaches head; a database at revision 0001 with Services-site rows upgrades to head keeping every row; a second upgrade is a no-op
- [x] T075 [P] [US6] Backup tests in `backend/tests/test_backup.py`: export then import into an empty database reproduces counts per table, assignments and a verified audit chain; import into a non-empty database is refused
- [x] T076 [P] [US6] Demonstration-set tests in `backend/tests/test_demo_set.py`: every seeded matter has `isDemo=true`; `remove-demo` deletes only those; real and demo matters are not mixed in a default list
- [x] T077 [P] [US6] Real-data gate tests in `backend/tests/test_real_data_gate.py`: `check-real-data` fails with the default secret, insecure cookies or missing audit triggers and lists what is wrong; start-up refuses `allow_real_data=true` while it fails
- [x] T078 [P] [US6] PostgreSQL set in `backend/tests/postgres/test_concurrency.py` (marked `postgres`): two simultaneous edits of one matter give one success and one 409; a failing request leaves no partial rows

### Implementation for User Story 6

- [x] T079 [US6] Replace start-up `create_all` with `alembic upgrade head` through `python -m app.cli migrate` in `backend/app/cli.py` and update `backend/app/main.py` (the Services-site seeding stays, run after migration)
- [x] T080 [P] [US6] Implement `seed-demo` and `remove-demo` in `backend/app/cli.py` using `backend/app/seed/workspace_demo.json` (two fictional advocates, three matters, with drafts, documents and calendar entries, all `isDemo`)
- [x] T081 [P] [US6] Implement the logical export and import in `backend/app/services/backup.py` and the `export`/`import` commands (JSON archive of every workspace table plus audit entries, with a format version)
- [x] T082 [US6] Implement `check-real-data` and the start-up refusal in `backend/app/core/real_data.py` and `backend/app/cli.py`: secret changed, `Secure` cookies, audit triggers present, sessions enabled (depends on T003)
- [x] T083 [US6] Extend `GET /health` to return `{status, demo, mode}` and report 503 with `unavailable` when the database is down, in `backend/app/routers/services_site.py`
- [x] T084 [P] [US6] Write the load check in `scripts/load_check.py`: seed 500 matters, 50 concurrent users, report the 95th percentile of dashboard, save and search calls against SC-005 and SC-006
- [x] T085 [P] [US6] Document `pg_dump`/`pg_restore` and the logical backup in `docs/backend-operations.md`

**Checkpoint**: All six stories work; the system can be run, changed and recovered.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T086 [P] Add a contract test in `backend/tests/test_contract.py` that compares the paths and methods in `/openapi.json` with the table in `specs/004-workspace-backend/contracts/api.md`
- [x] T087 [P] Add the log-leak check for SC-009 in `backend/tests/test_logs.py`: run the full scenario set and search captured log output for every seeded password, e-mail, party name and CNR
- [x] T088 Re-run the Services-site checks with the API on: `python -m pytest` (the 24 original tests), `node specs/002-services-site-prototype/browser-check.mjs <out>` (60 of 60) and `node specs/001-court-orders/browser-check.mjs <out>` (23 of 23) with `VITE_API_URL` set (SC-010)
- [x] T089 Write `specs/004-workspace-backend/browser-check.mjs`: sign in, create a matter, share it, sign in as the second person, confirm 404 on the first matter, approve a draft, and check keyboard operation of the sign-in form
- [x] T090 Run the quickstart manual scenarios 1 to 8 in `specs/004-workspace-backend/quickstart.md` against PostgreSQL and record the results in `specs/004-workspace-backend/validation-log.md`
- [x] T091 Run `python scripts/load_check.py` and record SC-005 and SC-006 in the validation log
- [x] T092 [P] Update `README.md` (backend sections: migrations, accounts, real-data flag, new commands, removed limitations), `docs/gap-analysis.md`, `docs/implementation-plan.md` and `docs/prototype-guide.md`
- [x] T093 [P] Check Principles I to V against the finished work and record it in `specs/004-workspace-backend/validation-log.md`; confirm or change assumptions D1 and D2 in `research.md`
- [x] T094 Run `npm test`, `npm run build` (in `frontend/`) and `python -m pytest` plus `python -m pytest -m postgres` (in `backend/`); fix anything that fails and commit

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (1)** → **Foundational (2)** → user stories → **Polish (9)**.
- T002 (restructure) must finish before any other backend task touches files; T009 before T010; T011 needs T010.

### User Story Dependencies
- **US1** needs Phase 2 only. This is the MVP.
- **US2** needs US1 (it needs a signed-in person).
- **US3** needs US2 (matters to audit); its writer exists from Phase 2, so US2 already records entries.
- **US4** and **US5** need US2 (they belong to matters); they do not need each other and can run in parallel.
- **US6** needs the tables from US1 to US5 for export and the demo set; its migration and gate tests can start after US2.

### Within Each Story
Tests first and failing → models and migration → core/services → routers → front end → story checkpoint.

### Parallel Opportunities
- Phase 1: T003, T004, T005. Phase 2: T006, T007, T008, T012, T013.
- US1: tests T014 to T016 together; T017, T018 together; T024 and T025 together.
- US2: T028 to T030 together; T031 and T033 together; T037 and T039 together.
- US3: T040 to T043 together.
- US4 and US5 can proceed side by side after US2; within them, the test tasks and the model/schema tasks are parallel.
- Polish: T086, T087, T092, T093.

### Parallel Example: User Story 2
```text
Task: "Access tests in backend/tests/test_access.py"            (T028)
Task: "Route-coverage test in backend/tests/test_route_coverage.py" (T029)
Task: "Matter rule tests in backend/tests/test_matters.py"      (T030)
Task: "Create Matter and Assignment in backend/app/models/workspace.py" (T031)
Task: "Matter models in backend/app/schemas/matters.py"         (T033)
```

---

## Implementation Strategy

### MVP First (US1, then US2 and US3)
1. Phases 1 and 2.
2. US1 and validate: accounts and sessions work end to end.
3. US2 and US3 together are the real milestone: privacy plus a verifiable trail. **Stop and validate against quickstart scenarios 1 to 3.** Only then does the backend meet the preconditions of constitution Principle V.
4. Real client data stays forbidden until T082 passes and a security review is done, whatever stage is reached.

### Incremental Delivery
Each phase ends at a checkpoint where the earlier stories still work and all earlier tests pass: demo after US1, after US3, after US5, and after US6 for operations.

---

## Notes
- No task adds an outbound HTTP client; T050 enforces this.
- The Services-site routes stay public and unchanged (T002, T088).
- Commit after each task or small group. Never push without being asked.
- Assumptions D1 (individual advocates) and D2 (store-only AI) are open until T093; changing D1 adds an organisation and role to data-model.md before US2.
