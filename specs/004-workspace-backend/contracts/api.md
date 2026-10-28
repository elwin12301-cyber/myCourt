# API Contract: Workspace Backend

Base path `/api`. Bodies are JSON in camelCase. The generated OpenAPI document at `/openapi.json` must match this file; a test compares the list of paths and methods.

## Conventions
- **Auth**: every route below except `POST /auth/register`, `POST /auth/login`, `GET /health` and the existing Services-site routes requires a valid session cookie. State-changing requests also need the `X-CSRF-Token` header (value returned by login) and an allowed `Origin`.
- **IDs** are UUIDs. **Times** are ISO 8601 UTC.
- **Edits** send `version` (the number last read). A mismatch returns `409 conflict` with the current `version`.
- **Lists** take `limit` (default 50, maximum 200) and `cursor`; they return `{ items, nextCursor }`.
- **Errors** always have this body (no submitted values are echoed):
  `{ "code": "validation_failed", "message": "…", "fields": { "title": "Enter a title." } }`

| Status | `code` | When |
|---|---|---|
| 400 | `bad_request` | Malformed JSON |
| 401 | `not_signed_in` | No or expired session |
| 403 | `forbidden` | Signed in, has access, but level too low; or CSRF/Origin check failed |
| 404 | `not_found` | Unknown **or not visible to the caller** (identical body) |
| 409 | `conflict` | Version mismatch, or last-owner rule |
| 413 | `too_large` | Text over its limit |
| 422 | `validation_failed` | Field errors |
| 429 | `too_many_attempts` | Sign-in throttle (same body for any account) |
| 503 | `unavailable` | Database not reachable |

## Accounts and sessions
| Method and path | Purpose | Notes |
|---|---|---|
| `POST /auth/register` | Create an account | `{email, displayName, password}`; same 202 response whether or not the address exists |
| `POST /auth/login` | Sign in | `{email, password, code?}`; when the account uses two-step sign-in and the password is right but `code` is missing: 401 `mfa_required`. → `{person, csrfToken}` and sets the cookie; one generic 401 for any failure |
| `POST /auth/logout` | Sign out | Deletes the session |
| `GET /auth/me` | Current person | |
| `POST /auth/password` | Change password | Ends other sessions |
| `POST /auth/mfa/setup` | Start two-step sign-in enrolment | Returns `{secret, otpauthUri}`; not active until confirmed |
| `POST /auth/mfa/enable` | Confirm with a code `{code}` | Ends other sessions |
| `POST /auth/mfa/disable` | Turn off `{password, code}` | |
| `POST /admin/people/{id}/deactivate` | Deactivate | Allowed only for an operator account (set at install); ends sessions at once |

## Matters and access
| Method and path | Purpose | Level needed |
|---|---|---|
| `GET /matters` | List the caller's matters (`isDemo` filter optional) | assigned |
| `POST /matters` | Create (caller becomes owner) | signed in; `isDemo=false` only if real data is allowed |
| `GET /matters/{id}` | Read | view |
| `PATCH /matters/{id}` | Edit | edit |
| `DELETE /matters/{id}?confirm={title}` | Delete with data | owner; the title must be repeated |
| `GET /matters/{id}/assignments` | Who has access | view |
| `PUT /matters/{id}/assignments/{personId}` | Share or change level `{level}` | owner |
| `DELETE /matters/{id}/assignments/{personId}` | Remove access | owner; refused for the last owner |
| `POST /people/lookup` | Find an existing account by exact e-mail `{email}` to share with; returns only `{id, displayName}` | signed in; POST so the address is never in a URL |

## Matter contents (all need `view` to read, `edit` to change)
`/matters/{id}/tasks`, `/matters/{id}/calendar`, `/matters/{id}/documents`, `/matters/{id}/voice-notes`, `/matters/{id}/time-entries`, `/matters/{id}/invoices` each support `GET` (list), `POST` (create), and on `/{itemId}` `GET`, `PATCH`, `DELETE`.

| Extra route | Purpose |
|---|---|
| `POST /matters/{id}/documents/{docId}/review` | Record that a person reviewed the extraction |
| `POST /matters/{id}/voice-notes/{noteId}/review` | Record that a person reviewed the transcript |
| `POST /matters/{id}/calendar/{entryId}/approve` | Approve a deadline (FR-013) |
| `POST /matters/{id}/invoices/{invId}/approve` | Approve an invoice; totals recomputed first |

## Drafts, conversations and the demonstration provider
| Method and path | Purpose |
|---|---|
| `GET /matters/{id}/drafts` · `POST …` · `GET/PATCH/DELETE …/{draftId}` | Drafts; every response includes `status`, `sources`, `isDemoContent` |
| `POST /matters/{id}/drafts/{draftId}/approve` | Record approval (needs `edit`) |
| `GET/POST /conversations` · `GET /conversations/{id}` · `POST /conversations/{id}/messages` | Assistant conversations; the reply is a `reply` draft from the demonstration provider |
| `POST /matters/{id}/research` | Returns a research draft; with no hits `sources` is empty and `body` is "Nothing found in the sources searched." |
| `POST /matters/{id}/mappings` | Returns a mapping draft (demonstration content, labelled) |

## Intake
| Method and path | Purpose |
|---|---|
| `GET/POST /intake` · `GET/PATCH /intake/{id}` | Caller's own intake records |
| `POST /intake/{id}/conflict-check/confirm` | `{result: "clear"|"needs_review", note}` records the confirming person and time |
| `POST /intake/{id}/convert` | Creates a matter and sets `matterId` |

## Audit
| Method and path | Purpose | Level |
|---|---|---|
| `GET /matters/{id}/audit` | Paged trail, newest first | owner |
| `GET /matters/{id}/audit/verify` | Recomputes the hash chain → `{ok, firstBadId}` | owner |

There is no route that edits or deletes an audit entry.

## Dashboard and calendar
`GET /dashboard` (counts and next five dates across the caller's matters) and `GET /calendar?from=&to=` (entries across the caller's matters in a range).

## Operations
| Route | Purpose |
|---|---|
| `GET /health` | Database check; `{status, demo, mode}` |
| `python -m app.cli migrate` | Apply migrations |
| `python -m app.cli seed-demo` / `remove-demo` | Load or remove the labelled demonstration set |
| `python -m app.cli export FILE` / `import FILE` | Logical backup and restore (import refuses a non-empty database) |
| `python -m app.cli check-real-data` | Runs the self-check D10 requires |

## Unchanged (FR-020)
`POST /cases/search`, `POST /orders/search`, `GET /court-rooms`, `POST /cause-lists`, `POST /caveats/search`, `POST /processes/lookup`, `POST /locations/find` stay public and independent of workspace tables.
