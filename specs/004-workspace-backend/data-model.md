# Data Model: Workspace Backend

All identifiers are random UUIDs (strings). All times are UTC. Every editable row has `version` (integer, starts at 1, +1 per change) and `created_at` / `updated_at`. Existing Services-site tables (`cases`, `court_rooms`, `caveats`, `processes`, `locations`) are unchanged and unrelated to the tables below.

## Person
| Field | Rules |
|---|---|
| id | UUID |
| email | unique (case-insensitive), valid address, never logged or returned to others |
| display_name | 1 to 120 characters |
| password_hash | versioned scrypt string; never returned |
| active | false after deactivation: sessions end at once |
| created_at | |

## Session
`id`, `person_id`, `token_hash` (SHA-256 of the cookie value), `csrf_token`, `created_at`, `last_seen_at`, `expires_at`. Idle limit 30 min, absolute limit 12 h. Deleted on sign-out, deactivation or password change.

## LoginAttempt
`id`, `time`, `email_hash`, `client_hash`, `success`. Used only to throttle (5 failures in 15 minutes). Rows older than 24 h are purged.

## Matter
| Field | Rules |
|---|---|
| id | UUID |
| title | 1 to 200 characters |
| client_ref | 0 to 120 characters; a reference, not a full client record |
| status | `open`, `on_hold`, `closed` |
| court_case_ref | optional CNR (16 letters/digits); stored, never used to call external services |
| is_demo | true for fictional data; false only when real data is allowed (D10) |
| deleted_at | null; set only by the confirmed delete, after which dependants are removed |

## Assignment
`matter_id`, `person_id`, `level` (`view`, `edit`, `owner`), `granted_by`, `granted_at`. Unique on (matter, person). **Rule**: at least one `owner` per matter at all times (FR-008). Changing or removing the last owner is refused.

## Task
`matter_id`, `title` (1 to 200), `due` (date, optional), `done`. Belongs to one matter.

## CalendarEntry
`matter_id`, `kind` (`hearing`, `deadline`, `meeting`), `title`, `starts_at`, `ends_at` (optional), `note`. A deadline is a draft until approved (FR-013): `approved_by`, `approved_at` are empty until then.

## Document
`matter_id`, `name`, `file_type` (fixed list), `review_status` (`needs_review`, `reviewed`), `extracted_text` (maximum 200 000 characters), `extraction_confidence` (0 to 1, optional), `reviewed_by`, `reviewed_at`. No file content is stored.

## VoiceNote
`matter_id`, `transcript` (maximum 50 000), `language`, `review_status`, `reviewed_by`, `reviewed_at`.

## DraftItem
| Field | Rules |
|---|---|
| matter_id | |
| kind | `summary`, `brief`, `research`, `mapping`, `reply`, `client_message` |
| title, body | body maximum 100 000 characters |
| sources | list of `{label, reference}`; may be empty |
| status | `draft` or `approved` |
| generated_by | `person` or `demo_provider` |
| is_demo_content | true when produced by the demonstration provider |

### DraftApproval (history)
`draft_id`, `approved_by`, `approved_at`, `revoked_at` (set when the body is edited afterwards). Several rows may exist per draft.

**State transitions**: `draft` → `approved` only by `POST …/approve` from a person with `edit`; `approved` → `draft` on any change to title, body or sources. Nothing is filed or sent by the backend in this release; "approved" is a recorded decision.

## Conversation / Message
Conversation: `matter_id` (optional), `person_id`, `title`. Message: `conversation_id`, `position`, `role` (`user`, `assistant`), `body`, `draft_id` (assistant replies are DraftItems of kind `reply`).

## IntakeRecord
`person_id` (creator), `prospect_name`, `contact`, `summary`, `conflict_check` (`not_checked`, `needs_review`, `clear`), `conflict_note`, `confirmed_by`, `confirmed_at`, `matter_id` (set when converted). **Rule**: `clear` requires `confirmed_by`/`confirmed_at` set in the same request by a signed-in person (FR-015).

## TimeEntry
`matter_id`, `person_id`, `worked_on` (date), `minutes` (1 to 1 440), `rate_paise` (integer), `description`.

## Invoice
`matter_id`, `number`, `status` (`draft`, `approved`, `sent_recorded`), `total_paise` (computed on the server from its lines), `approved_by`, `approved_at`. Lines are stored with the invoice as a list of `{description, amountPaise, timeEntryId?}` (built from time entries and free text on the server). The backend records that an invoice was approved; it does not send it.

## AuditEntry (append-only)
| Field | Rules |
|---|---|
| id, time | |
| person_id | who |
| matter_id | which matter (null for account events) |
| action | `view`, `create`, `update`, `delete`, `export`, `share`, `unshare`, `approve`, `sign_in`, `sign_out`, `denied` |
| target_type, target_id | what |
| detail | short text, no names, case numbers, e-mails or secrets |
| prev_hash, hash | chain per matter: `hash = SHA-256(prev_hash + canonical fields)` |

Database triggers reject UPDATE and DELETE on this table. A matter delete removes the matter's data but **not** its audit entries.

## Relationships
Person 1–n Session; Person n–n Matter via Assignment; Matter 1–n Task, CalendarEntry, Document, VoiceNote, DraftItem, TimeEntry, Invoice, Conversation, AuditEntry; DraftItem 1–n DraftApproval; Conversation 1–n Message; IntakeRecord 0–1 Matter.

## Indexes
`assignment(person_id, matter_id)`, `audit_entry(matter_id, time)`, `session(token_hash)`, `login_attempt(email_hash, time)`, and every foreign key.
