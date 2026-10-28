# Research: Workspace Backend

Phase 0 of `/speckit-plan`. Each decision resolves a question the spec left to the plan. "Assumed" marks a decision made without the user's confirmation.

## D1. User model (FR-025) — assumed
- **Decision**: Individual advocates. A matter owner shares a matter with another existing account at `view` or `edit` level. No firm-wide roles.
- **Rationale**: Smallest model that satisfies per-matter privacy (FR-005 to FR-008). Per-matter assignments are the same structure a firm role model would later sit on top of, so nothing is thrown away.
- **Alternatives**: Firm workspace with owner/advocate/clerk roles (larger scope: invitations, role screens, tenant separation); rejected for this release, not for ever.

## D2. AI, research, mapping and speech (FR-026) — assumed
- **Decision**: Store-and-return only. A `DraftProvider` interface returns labelled demonstration content; no matter text leaves the system. Speech-to-text is done in the user's browser (Web Speech API) and only the transcript is sent to the backend.
- **Rationale**: Sending advocates' text to a third party is a data-protection decision (constitution V). The draft, source and approval flow is the part the spec requires and is independent of the provider.
- **Alternatives**: Connect an AI provider now (needs provider choice, keys, data-processing terms); defer all four features (leaves the Draft entity untestable).

## D3. Sign-in and sessions
- **Decision**: Server-side sessions. Sign-in issues a random 256-bit token in an `HttpOnly`, `SameSite=Lax`, `Secure` (outside localhost) cookie; the database stores only a SHA-256 hash of the token, an expiry and a last-seen time. Idle timeout 30 minutes, absolute lifetime 12 hours. Sign-out and deactivation delete the session rows.
- **Rationale**: Sessions can be revoked at once (deactivation, access removal), which JWTs cannot do without a deny-list. No token in `localStorage`, so script injection cannot steal it.
- **Alternatives**: JWT bearer tokens (revocation problem, stored in script-reachable storage); an external identity provider (out of scope; the design leaves room for it).
- **CSRF**: cookie sessions need it. State-changing requests must carry `X-CSRF-Token` (a per-session value returned by sign-in) and an allowed `Origin`; both are checked. Searches on the Services site are unauthenticated and public, so they are exempt.

## D4. Password storage
- **Decision**: `hashlib.scrypt` from the Python standard library (N=2^15, r=8, p=1, 16-byte random salt, constant-time compare), with the parameters stored in the hash string so they can be raised later. Minimum length 12, no composition rules, checked against a small built-in list of very common passwords.
- **Rationale**: Meets FR-004 with no new dependency (constitution: justify new dependencies). Scrypt is memory-hard.
- **Alternatives**: argon2id via `argon2-cffi` (preferred by OWASP; a reasonable later swap because the hash string is versioned); bcrypt (72-byte limit).

## D5. Sign-in abuse and account enumeration (FR-002, FR-003)
- **Decision**: One generic failure message for unknown account, wrong password and deactivated account; a dummy hash is verified for unknown accounts so timing does not reveal them. Failures are counted per account and per client address in a `login_attempt` table; after 5 failures in 15 minutes further attempts get a 429 with the same generic body until the window passes. Registration returns the same response whether or not the address is already used.
- **Rationale**: Directly meets FR-002/FR-003 without an extra service.

## D6. Per-matter authorisation (FR-006, FR-007)
- **Decision**: One function, `matter_for(person, matter_id, need)`, is the only way to load a matter or anything under it. It joins `assignment` and returns "not found" (404 with the same body as an unknown id) when the person has no assignment, and 403 only when the person *has* access but too low a level. Lists and searches are always filtered by the same join. Identifiers are random UUIDs, never counters.
- **Rationale**: A single choke point is testable (SC-002) and cannot be forgotten on one route. 404-for-no-access satisfies "cannot tell it exists".
- **Alternatives**: Row-level security in PostgreSQL (strong, but ties tests to PostgreSQL and hides rules from the code; revisit as defence in depth).

## D7. Audit trail (FR-016, FR-017)
- **Decision**: Append-only `audit_entry` table: id, time (UTC), person, matter, action, target type and id, and a short detail that never holds names or case numbers. Each entry stores the hash of the previous entry for the same matter, so removal or reordering is detectable. Edits and deletes are blocked in the database by triggers (both PostgreSQL and SQLite), and the application has no update or delete path for it. Audit entries are written in the same transaction as the change they describe.
- **Rationale**: Triggers stop even application bugs; the hash chain gives tamper evidence for the people with database access. Same transaction means no change without an entry (FR-011).
- **Alternatives**: Separate audit service (overkill here); log files (not queryable, not tamper-evident).

## D8. Concurrency and transactions (FR-010, FR-011)
- **Decision**: Every editable row has an integer `version`. Updates must send the version they read; a mismatch returns 409 with the current version and nothing is changed. Each request is one database transaction.
- **Alternatives**: Last write wins (violates FR-010); pessimistic locks (poor fit for web screens).

## D9. Drafts and approval (FR-012 to FR-015)
- **Decision**: A `draft_item` has `status` `draft` or `approved`, a `sources` list (possibly empty), and an `approval` history. Only `POST …/approve` by a person with `edit` level moves it to `approved`; editing the body of an approved draft sets it back to `draft` and keeps the old approval in history. The API never returns a draft without `status`. Searches with no hits store `sources: []` and the fixed text "Nothing found in the sources searched." Intake `conflict_check` has `needs_review` / `clear`; `clear` requires an advocate confirmation (person and time) in the same request.
- **Rationale**: Constitution II. The state machine is small and fully testable.

## D10. Demonstration versus real data (FR-018, FR-019)
- **Decision**: Every matter has `is_demo`. A setting `MYCOURT_ALLOW_REAL_DATA` (default `false`) governs creating non-demo matters; with it false, `is_demo=false` is refused with 403. Turning it on is refused at start-up unless a self-check passes: sign-in required, sessions on, audit triggers present, `Secure` cookies and a non-default secret. Demonstration data is loaded by an explicit command, marked `is_demo`, and removable as a unit; a person's demo and real matters never appear in the same list unless asked.
- **Rationale**: Makes FR-019 a mechanical check instead of a promise.

## D11. Migrations (FR-021)
- **Decision**: Alembic (new dependency, justified: ordered, repeatable, reversible schema changes are required by FR-021 and there is no equivalent in the current stack). Replaces `create_all` outside tests. The first revision creates the existing Services-site tables unchanged.
- **Alternatives**: Hand-written SQL scripts (reinvents ordering and history).

## D12. Backup and restore (FR-022)
- **Decision**: Two layers. (1) `pg_dump` / `pg_restore` documented for whole-database backup. (2) A logical `python -m app.cli export` / `import` that writes and reads a JSON archive of all workspace tables including the audit chain, which is what tests use to prove SC-008 on SQLite and PostgreSQL alike. Import refuses a non-empty database.
- **Rationale**: The logical form is portable and verifiable in CI; the physical form is what operators actually rely on.

## D13. Documents (scope)
- **Decision**: Register entries and extracted text only (no file storage). Maximum text size 200 000 characters; refused with 413 beyond that. File type is a label from a fixed list.
- **Rationale**: Matches the spec assumption; avoids storing and scanning binary files in this release.

## D14. Money in billing
- **Decision**: Amounts are stored as integer paise; totals are computed on the server from entries, never trusted from the client.
- **Alternatives**: Floating point (rounding errors); decimal strings (fine, but integers are simpler to sum and compare).

## D15. Errors, validation and logging (FR-017, FR-023)
- **Decision**: One error body for every failure: `{ "code": "...", "message": "...", "fields": { ... } }`. Codes are stable so the screens can translate messages later. Validation errors list field names only, not submitted values. Logging uses a filter that drops request bodies and any value under keys named `password`, `token`, `email`, `cnr`, `name`, `party`; access logs carry method, path template and status, never query strings.
- **Rationale**: Gives SC-009 a mechanical test: search the captured log output for the seeded names and passwords.

## D16. Performance (SC-005, SC-006)
- **Decision**: Index `assignment(person_id, matter_id)` and every foreign key; list endpoints are paginated (default 50, maximum 200) and never load documents' text; calendar and dashboard have dedicated aggregate queries. Verified by a load script at 500 matters and 50 concurrent users.

## D17. Front-end integration
- **Decision**: Add an `AuthProvider` and API client (`credentials: 'include'`, CSRF header) and switch screens one at a time from `AppContext` state to the API, keeping the mock as the default when `VITE_API_URL` is unset. The Services-site adapters are untouched (FR-020).

## D18. Voice
- **Decision**: Not part of this feature. The voice screen will post a transcript produced in the browser; building browser speech recognition is a separate front-end feature and is listed as follow-up.

## Open items
None blocking. D1 and D2 are assumed and should be confirmed or changed before `/speckit-tasks`; changing D1 to a firm model would alter data-model.md (add an organisation and role) and contracts (invitations).
