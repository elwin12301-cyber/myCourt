# Software Requirements Specification: myCourt

| | |
|---|---|
| **Document** | SRS-001 |
| **Version** | 1.2 |
| **Date** | 2026-10-28 |
| **Status** | Baseline of what is built, reviewed against the code and the Spec Kit specifications; 1.1 closes gaps G1–G3 and G6–G11 (see 11.1); 1.2 adds app-wide voice control (spec 005) |
| **Standard followed** | Structure of ISO/IEC/IEEE 29148 (and IEEE 830) |
| **Source of truth** | `specs/001`–`004`, `.specify/memory/constitution.md` v1.1.0, `docs/`, and the code in `frontend/` and `backend/` |

> **Demonstration only.** myCourt is an independent prototype. It is not the official eCourts service and is not affiliated with the Indian judiciary. All case, client and financial data is fictional.

**How to read this document.** Each requirement has an ID and a **status**: **Built** (implemented and tested), **Partial** (some of it built; the gap is stated) or **Not built** (specified or expected, but absent). Section 11 lists every gap in one place so nothing is hidden.

---

## 1. Introduction

### 1.1 Purpose
This document states what myCourt must do and the qualities it must have, so that developers, testers, reviewers and the product owner share one description of the system. It covers the whole product as it exists today, not only the latest feature.

### 1.2 Scope
myCourt is a web application with three parts:

1. **Advocate practice workspace**: matters, tasks, calendar, documents, drafts, time and invoices, client intake, with per-matter privacy and an audit trail.
2. **eCourts Services-site prototype**: a six-language reproduction of the public eCourts Services pages (Case Status, Court Orders, Cause List, Caveat Search, Process Details, Location) running on fictional data.
3. **Backend API** (FastAPI on PostgreSQL) that stores and serves both.

Out of scope: any connection to the real eCourts service, real AI or transcription providers, storage of original document files, firm-wide roles, multi-factor sign-in, and the handling of real client data (see 11.2).

### 1.3 Definitions and abbreviations

| Term | Meaning |
|---|---|
| Advocate | A lawyer; the primary user |
| Matter | A client engagement or case in the workspace |
| Draft | System-produced content that needs an advocate's approval before reliance |
| CNR | Case Number Record, the 16-character national case identifier |
| Demonstration data | Fictional data, always labelled as such |
| CSRF | Cross-site request forgery |
| MT | Machine translation |
| SRS | Software Requirements Specification |

### 1.4 References
- `.specify/memory/constitution.md` (principles I–V, v1.1.0)
- `specs/001-court-orders`, `002-services-site-prototype`, `003-site-translation`, `004-workspace-backend` (spec, plan, tasks, validation log)
- `specs/004-workspace-backend/contracts/api.md` and `data-model.md`
- `docs/backend-operations.md`, `docs/gap-analysis.md`, `docs/ecourts-reference-analysis.md`, `docs/prototype-guide.md`
- Source site analysed: `https://services.ecourts.gov.in/ecourtindia_v6/` (public pages only)

### 1.5 Overview
Section 2 describes the product, section 3 the users and interfaces, section 4 the functional requirements, section 5 data, section 6 the external interfaces, section 7 non-functional requirements, section 8 constraints, section 9 verification, section 10 traceability, section 11 gaps and risks.

---

## 2. Overall description

### 2.1 Product perspective
A single-page React application talks to a FastAPI service over JSON. Without an API address it runs entirely on in-browser mock data; with one, the workspace requires sign-in and all workspace records are saved in PostgreSQL.

```
 Browser (React 18, TypeScript, Vite, Material UI)
   |  hash routing, i18n (6 languages), mock adapters OR API client
   v   JSON over HTTP, session cookie + CSRF header
 FastAPI  /api   (auth, matters, contents, drafts, intake, audit, dashboard, services)
   |  SQLAlchemy 2, Alembic migrations 0001-0006
   v
 PostgreSQL 16   (append-only audit table enforced by triggers)
```

### 2.2 Product functions (summary)
- Accounts, sessions and per-matter access (view / edit / owner).
- Matters with tasks, calendar, documents, voice notes, time entries, invoices.
- Drafts, research, section mapping and conversations, all labelled as drafts and approved by a person.
- Client intake with a confirmed conflict check.
- Tamper-evident audit trail per matter.
- Dashboard and calendar across a person's matters.
- eCourts Services-site prototype: eight Case Status searches, Court Orders, Cause List, Caveat Search, Process Details, Location, site search, High Courts, Contact, About, forms, help and policy pages, in six languages.
- Display and accessibility tools; operator commands for migration, demo data, backup and restore.

### 2.3 User classes

| Class | Description | Needs |
|---|---|---|
| Advocate (owner) | Creates matters, shares them, approves drafts and deadlines | Full control of own matters, audit view |
| Collaborator | Another advocate given view or edit access to one matter | Access only to what was shared |
| Public visitor | Uses the Services-site prototype without an account | Search fictional court data, any language |
| Operator | Installs, migrates, seeds, backs up and deactivates accounts | CLI commands, health check |
| Reviewer / tester | Verifies behaviour and translations | Specs, checks, glossary |

### 2.4 Operating environment
Python 3.12+ (developed on 3.13), Node 22+, PostgreSQL 16 (Docker, host port 5433), Chrome or Edge current versions. Tests run on in-memory SQLite without Docker. Development uses `localhost` for both page and API so the session cookie is same-site.

### 2.5 Design and implementation constraints
- TypeScript strict mode stays on; backend uses typed pydantic v2 schemas that reject unknown fields.
- English text is the translation key; stored and searched values stay English.
- External data access goes through the adapter pattern; the in-browser mock stays the default until an integration is verified.
- New runtime dependencies must be justified. Material UI (with Emotion and icons) was added for the signed-in and shared components and is justified in the README.
- No scraping of official sites and no bypassing of CAPTCHAs or other access controls.

### 2.6 Assumptions and dependencies
- **D1 (assumed, unconfirmed):** accounts are individual advocates with per-matter sharing; firm roles come later.
- **D2 (assumed, unconfirmed):** the assistant, research, mapping and speech functions store and return labelled demonstration content only; no matter text leaves the system.
- One organisation, up to 500 matters and 50 concurrent users, one region, no offline use.
- Workspace screens are English; Services-site screens are multilingual.

---

## 3. Users, interfaces and look

### 3.1 User interface
- **Layout:** left sidebar (workspace, then eCourts portal reference), top bar (search, upcoming dates, display settings, notifications, profile, sign-out), content area, toast message, modal dialogs. A hamburger menu appears at narrow widths.
- **Look:** classic legal style: deep navy and antique gold on ivory, serif headings, squarer cards. Theme in `frontend/src/theme.ts` and `styles.css`.
- **Library:** Material UI components for buttons, cards, chips, fields, native selects, tables, dialogs, snackbars; legacy styles remain for layout.
- **Navigation:** hash routes (`#/cases`, `#/caseDetail/{id}`, `#/services/...`) so reload, Back and link-sharing work.
- **Accessibility:** skip link, labelled controls, errors tied to fields, visible amber focus ring, no colour-only meaning, language attribute matching the shown language, **Aa** display menu (text size, high contrast, invert, grayscale, low saturation, highlight links, text spacing, line height, hide images, big cursor, reset).
- **Services-site tools:** language selector, theme customizer (topbar light/dark; theme default/dark/eco/light), site search.

### 3.2 Hardware and software interfaces
Browser only; microphone is listed for planned voice features (not built). PostgreSQL via SQLAlchemy; Docker Compose for the local database.

### 3.3 Communication interfaces
JSON over HTTP under `/api`; HttpOnly SameSite=Lax session cookie; `X-CSRF-Token` header and Origin check on every state-changing request. OpenAPI at `/openapi.json`, interactive docs at `/docs`.

---

## 4. Functional requirements

Priority: **M** must, **S** should. Status as defined in the introduction.

### 4.1 Accounts and sessions (spec 004)

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-ACC-01 | A person can register, sign in and sign out with e-mail and password; every workspace function refuses access when not signed in. | M | Built |
| FR-ACC-02 | Idle sessions end after 30 minutes and every session after 12 hours. | M | Built |
| FR-ACC-03 | Five failed sign-ins in 15 minutes lock further attempts; the response is the same for any account. | M | Built |
| FR-ACC-04 | A sign-in failure and a registration never reveal whether an account exists (one generic 401; same 202 for register). | M | Built |
| FR-ACC-05 | Passwords are stored only as salted scrypt hashes; session tokens only as SHA-256 hashes. | M | Built |
| FR-ACC-06 | Changing a password ends the person's other sessions. | M | Built |
| FR-ACC-07 | An operator can deactivate an account; its sessions end at once and its history stays. | M | Built |
| FR-ACC-08 | State-changing requests require a valid CSRF token and an allowed Origin. | M | Built |
| FR-ACC-09 | A person can turn on two-step sign-in with an authenticator app (time-based one-time codes, RFC 6238): set up, confirm with a code, and turn off with the password and a code. Once on, sign-in needs the code; the "code needed" answer is given only after the password was right; wrong codes count towards the sign-in throttle. | S | Built |

### 4.2 Matters and access control

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-MAT-01 | A person can create, list, read, edit and (with typed-title confirmation) delete matters; the creator becomes owner. | M | Built |
| FR-MAT-02 | Each matter has assignments with a level: view, edit or owner. | M | Built |
| FR-MAT-03 | Access is checked on the server for every matter request through one authorisation function. | M | Built |
| FR-MAT-04 | A person with no access gets the same 404 as for a matter that does not exist, for reads, lists, searches and changes. | M | Built |
| FR-MAT-05 | A matter always keeps at least one owner; removing the last owner is refused (409). | M | Built |
| FR-MAT-06 | An owner can find an existing account by exact e-mail (POST body, never in a URL) and share, change or remove access. | M | Built |
| FR-MAT-07 | Concurrent edits are detected by a version number; a stale save returns 409 and overwrites nothing. | M | Built |
| FR-MAT-08 | Every change is all-or-nothing. | M | Built |
| FR-MAT-09 | The Cases screen lists a person's matters with filter, status chip, access level and pagination (10 per page). | S | Built |

### 4.3 Matter contents

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-CON-01 | Tasks (title, due date, done) per matter: list, create, edit, delete. | M | Built |
| FR-CON-02 | Calendar entries (hearing, deadline, meeting) per matter; a deadline needs approval by an editor before it counts as approved. | M | Built |
| FR-CON-03 | Document register entries with type, extracted text (max 200 000 chars), extraction confidence and a recorded review. Original files are not stored. | M | Built |
| FR-CON-04 | Voice-note transcripts (max 50 000 chars) with a recorded review. | M | Built |
| FR-CON-05 | Time entries (1–1 440 minutes, rate in paise, description). | M | Built |
| FR-CON-06 | Invoices computed on the server from lines; a draft until approved. | M | Built |
| FR-CON-07 | Overlong or malformed input is refused with 413/422 and a plain message; unknown fields are rejected. | M | Built |
| FR-CON-08 | A matter workspace shows tabs: Overview, Tasks, Calendar, Documents, Drafts, Time & invoices, Access, Audit. | S | Built |

### 4.4 Drafts, research and conversations (constitution II)

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-DRF-01 | System-produced items (summary, brief, research, mapping, reply, client message) are stored and returned with status "draft", their sources and an `isDemoContent` flag. | M | Built |
| FR-DRF-02 | Only a person with edit access can approve a draft; approval records who and when; editing an approved draft returns it to draft and keeps the earlier approval in history. | M | Built |
| FR-DRF-03 | Nothing is filed, sent or committed without a recorded approval. | M | Built |
| FR-DRF-04 | Research with no hits returns "Nothing found in the sources searched." and never claims none exists; sources are never invented. | M | Built |
| FR-DRF-05 | Conversations hold ordered messages; each assistant reply is a draft of kind reply. | M | Built |
| FR-DRF-06 | Replies, research and mappings come from a local demonstration provider with no outbound network call. | M | Built |
| FR-DRF-07 | A real AI or transcription provider can be added behind a documented boundary. | S | Not built (by design; needs its own spec and data-protection review) |

### 4.5 Intake and billing records

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-INT-01 | A person can keep intake records (prospect, contact, summary, conflict result). | M | Built (API) |
| FR-INT-02 | A conflict check cannot be "clear" without a recorded confirmation by a person (who and when). | M | Built |
| FR-INT-03 | An intake can be converted into a matter. | M | Built (API) |
| FR-INT-04 | The Intake and Billing screens use the API when it is on (intake records with confirm-clear and convert-to-matter; time entries and invoices per matter). | S | Built |

### 4.6 Audit trail (constitution V)

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-AUD-01 | Every view, create, update, delete, export, share, unshare and approve on a matter, and denied attempts, is recorded with person, action, item and time. | M | Built |
| FR-AUD-02 | The trail cannot be edited or deleted: database triggers reject UPDATE and DELETE; there is no API route for it. | M | Built |
| FR-AUD-03 | Entries form a per-matter SHA-256 hash chain; an owner can verify it (`/audit/verify` returns ok or the first bad entry). | M | Built |
| FR-AUD-04 | Audit entries, logs and errors contain no credentials, party names or case identifiers. | M | Built |
| FR-AUD-05 | Audit entries outlive the data they describe (a matter delete removes data but not its audit). | M | Built |
| FR-AUD-06 | Only an owner can read a matter's audit trail. | M | Built |

### 4.7 Dashboard and calendar

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-DSH-01 | The dashboard shows counts of matters, open tasks, drafts awaiting approval, unapproved deadlines and the next five dates, only for matters the person can access. | M | Built |
| FR-DSH-02 | `/calendar?from=&to=` returns entries across the person's matters in a range. | S | Built (API) |
| FR-DSH-03 | The Calendar screen reads from the API: dates across all matters plus the chosen matter's calendar and tasks. | S | Built |

### 4.8 Demonstration data and real-data gate (constitution I)

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-DEM-01 | Demonstration data is marked `isDemo` in storage and in responses and is kept apart from real matters. | M | Built |
| FR-DEM-02 | The system runs in demonstration-only mode unless `MYCOURT_ALLOW_REAL_DATA=true` **and** `check-real-data` passes (secret changed, HTTPS cookies, audit triggers present). | M | Built |
| FR-DEM-03 | `seed-demo` loads two demo advocates and three matters; `--matters N --owner EMAIL` adds N fictional matters; `--services N` tops cases, caveats and processes up to N (default 100 each). `remove-demo` removes the set. | M | Built |
| FR-DEM-04 | Every generated name is obviously fictional. | M | Built |

### 4.9 eCourts Services-site prototype (specs 001, 002)

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-SVC-01 | A full-page Services site is reachable from the workspace, has its own chrome and a way back. | M | Built |
| FR-SVC-02 | Top bar (external links, language selector, accessibility options, site search), branded header, dismissible theme notice, main menu (Home, e-Committee, Supreme Court, High Courts, District Courts, NJDG, Contact Us) and Search Menu (CNR Number, Case Status, Court Orders, Cause List, Caveat Search, Process Details, Location) in the official order, marking the current item. | M | Built |
| FR-SVC-03 | CNR Number search is the home page with example, Search, Reset, Back and help link. | M | Built |
| FR-SVC-04 | Case Status offers the seven official searches (Party Name, Case Number, Filing Number, Advocate [name / bar code / case-list date], FIR Number, Act, Case Type) with the court selector, status filter (Pending / Disposed / Both; no "Both" for Act and Case Type), captcha, Go, Back, "How to" help and help-video links, and case history from results. | M | Built |
| FR-SVC-05 | Court Orders: four searches (party name ≥ 3 characters + year; case number; court number; order date range, inclusive, from ≤ to), order-type filter (interim, final, both), results sorted newest first, case record with return to the unchanged list, unavailable-document explanation. | M | Built |
| FR-SVC-06 | Cause List by court and date; also available inside the site. | M | Built |
| FR-SVC-07 | Caveat Search: match type (anywhere / starting with), caveator or caveatee, subordinate court, case type and number, filing number, decision date, year, caveat number, captcha. | M | Built |
| FR-SVC-08 | Process Details needs a process ID **and** a registered e-mail; a wrong e-mail and an unknown ID give the same answer; the e-mail is never stored, logged, returned or placed in the address. | M | Built |
| FR-SVC-09 | Location: cascading court selector and a keyboard-operable, Escape-closable pop-up with a fictional address and a map placeholder. | M | Built |
| FR-SVC-10 | Cascading selector State → District → Court Complex → Establishment with the 36-entry state list; says plainly when a state has no demonstration data. | M | Built |
| FR-SVC-11 | High Courts (25, with breadcrumb), Contact Us, About Us, forms, help, 12 footer useful links, policy pages, YouTube link, six partner links, official last-updated date and version labelled as official facts. | M | Built |
| FR-SVC-12 | "Search this site" searches pages, services, High Courts and footer pages. | S | Built |
| FR-SVC-13 | Every form shows per-field errors, a demonstration captcha with refresh and audio, and distinct idle, loading, empty, error-with-retry and results states; a search in progress is cancelled when a new one starts or the form is reset. | M | Built |
| FR-SVC-14 | Combo-box keyboard tip (Enter then Alt+Down) is shown. | S | Built |
| FR-SVC-15 | Each page has its own address; Back, reload and shared links work. | M | Built |
| FR-SVC-16 | No emblems or logos of the judiciary are reproduced; no affiliation is claimed; a demonstration notice shows on every page. | M | Built |
| FR-SVC-17 | Data comes through replaceable adapters (mock or API); the CNR `ERROR00000000000` exercises the retry state. | M | Built |
| FR-SVC-18 | Services-site searches work without sign-in and are independent of workspace records. | M | Built |

### 4.10 Languages (spec 003)

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-LNG-01 | The Services site is available in English, Hindi, Marathi, Gujarati, Kannada and Tamil; the choice persists and applies at once without losing typed data. | M | Built |
| FR-LNG-02 | Interface text, validation messages, headings, labels, options, hints, help, buttons and footers are translated; fictional records stay unchanged. | M | Built |
| FR-LNG-03 | Stored values (states, case types, acts, courts) stay English so searches behave the same in every language. | M | Built |
| FR-LNG-04 | Sentences with numbers, years or names are whole translated templates with typed rows; dates use the language's month names. | M | Built |
| FR-LNG-05 | Whenever a non-English language is active, a notice in that language and in English says the text is machine-translated, not reviewed by a native speaker, and that English is authoritative. | M | Built |
| FR-LNG-06 | A missing translation shows English (never blank) and fails the automated check; translations keep placeholders, are non-empty and in the right script (Latin allowed for CNR, PDF, NJDG, NIC, e-mail). | M | Built |
| FR-LNG-07 | The page language attribute matches the displayed language. | M | Built |
| FR-LNG-08 | Native-speaker review of the translations. | S | Not built (glossary and inspection method documented) |

### 4.11 Workspace screens

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-WSP-01 | Dashboard, Cases & matters, Case status, Cause list, Court orders, eCourts Services site, AI Legal Assistant, RAG Research, Documents & OCR, Legal section mapping, Voice-to-text, Hearing preparation, Calendar & follow-up, Client intake, Time & billing, plus the eCourts portal reference (Home, About, e-Committee, NJDG, Supreme Court, High Courts, District Courts, Contact, Forms, Help, search, policy pages). | M | Built |
| FR-WSP-02 | With the API on, Cases, Dashboard and the matter workspace are server-backed. | M | Built |
| FR-WSP-03 | With the API on, Assistant, Research, Mapping, Voice, Hearing, Calendar, Intake, Billing and Documents work on one of the person's matters (a matter picker on each screen) and save on the server; without the API they remain browser-state demonstration screens. | S | Built |
| FR-WSP-04 | Dictation on the Voice screen with the browser's speech recognition, in six languages, opt-in and for demonstration material only. Without support or consent the recorder stays simulated. | S | Built (see 11.2 for the confidentiality limit) |
| FR-VOI-01 | **App-wide voice control** (top-bar Voice button, Alt+V): move to any screen, back, forward, reload; scroll; press a button, link or tab by name; focus a field by label; type or dictate into it; set a named field; choose a list option; tick or untick a box; next, previous, clear, submit; text bigger, smaller, normal; high contrast on and off; read the page; sign out; help; stop. | S | Built |
| FR-VOI-02 | Controls are matched by what a person would say (label, name, text, placeholder). If nothing matches it says so and changes nothing. Dictated values keep their capitals and punctuation. | S | Built |
| FR-VOI-03 | Every command gives a visible, announced answer and can be spoken aloud on request; a status area shows listening, what was heard and what was done. | S | Built |
| FR-VOI-04 | Before first use a privacy warning (the browser vendor receives the audio; demonstration material only) must be agreed to; the microphone is not started before that. | M | Built |
| FR-VOI-05 | Alt+C opens a box to type any command, with the same result as speaking it (no microphone needed). | S | Built |
| FR-VOI-07 | A dark bar (microphone, state, last answer, **Numbers**, **Replies**, **Help**, **Stop**) shows while voice control is on. **Numbers** badges every pressable item so it can be pressed by saying its number; **Replies** lists what was said and answered. | S | Built |
| FR-VOI-08 | Voice control is available on every screen: top bar in the workspace, and a corner launcher on the sign-in screen and the full-page Services site. | S | Built |
| FR-VOI-06 | Spoken commands in Hindi, Marathi, Gujarati, Kannada and Tamil; hands-free wake word; on-device recognition. Commands are English only; dictation text can be in the six languages. | C | Not built |
| FR-WSP-05 | Global search routes a typed query to the closest workspace and says so. | S | Built |
| FR-WSP-06 | Notifications dialog lists items needing action. | S | Built |
| FR-WSP-07 | Display settings persist across reloads. | S | Built |

### 4.12 Operations

| ID | Requirement | Pri | Status |
|---|---|---|---|
| FR-OPS-01 | Database changes are applied by ordered, repeatable Alembic migrations (0001–0006) that keep data. | M | Built |
| FR-OPS-02 | `GET /health` reports database state and mode (`demonstration-only` unless real data is enabled). | M | Built |
| FR-OPS-03 | `export FILE` and `import FILE` make and restore a logical backup of all workspace data; import refuses a non-empty database. | M | Built |
| FR-OPS-04 | Every request is validated on the server; errors use one body `{code, message, fields}` that never echoes submitted values. | M | Built |
| FR-OPS-05 | Lookups carrying names, process IDs or e-mail addresses are POSTs with a body. | M | Built |
| FR-OPS-06 | A database outage returns 503 `unavailable` and the screens show a retry state. | M | Built |

---

## 5. Data requirements

### 5.1 Logical entities
Person, Session, LoginAttempt, Matter, Assignment, Task, CalendarEntry, Document, VoiceNote, DraftItem, DraftApproval, Conversation, Message, IntakeRecord, TimeEntry, Invoice, AuditEntry; and for the Services site Case, CourtRoom, Caveat, Process, Location and related reference data. Full field rules are in `specs/004-workspace-backend/data-model.md`.

### 5.2 Key rules
- IDs are UUIDs; times are UTC ISO 8601; editable rows carry `version`, `created_at`, `updated_at`.
- Matter title 1–200 characters; status open / on_hold / closed; optional CNR of 16 letters or digits, stored but never used to call outside services.
- Roles per matter: view < edit < owner; at least one owner always.
- Draft lifecycle: draft → approved (by editor); any edit → draft; approval history kept.
- Audit: append-only, hash-chained per matter, enforced by triggers.
- Demonstration records carry `isDemo` / `isDemoContent` and are labelled when shown.

### 5.3 Seed data volumes (demonstration)
100 cases, 100 caveats, 100 processes, 8 court rooms, 14 locations (the court hierarchy itself); 100 matters for a chosen owner plus 3 from demo accounts. Counts are set by `seed-demo`.

### 5.4 Retention
Matter data is kept until an owner deletes it (permanent after typed confirmation). Audit entries outlive their data. Login-attempt rows older than 24 hours are purged.

---

## 6. External interface requirements

### 6.1 HTTP API (summary; full contract in `specs/004-workspace-backend/contracts/api.md`)

| Area | Endpoints |
|---|---|
| Public (fictional data) | `GET /health`; `POST /cases/search`, `/orders/search`, `/caveats/search`, `/locations/find`, `/cause-lists`, `/processes/lookup`; `GET /court-rooms` |
| Accounts | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/password`; `GET /auth/me`; `POST /admin/people/{id}/deactivate` |
| Matters | `/matters`, `/matters/{id}`, `/matters/{id}/assignments[/{personId}]`, `POST /people/lookup` |
| Contents | `/matters/{id}/tasks`, `calendar`, `documents`, `voice-notes`, `time-entries`, `invoices` (list, create, get, patch, delete) plus review and approve actions |
| Drafts | `/matters/{id}/drafts` (+ `/approve`), `/matters/{id}/research`, `/matters/{id}/mappings`, `/conversations[/{id}[/messages]]` |
| Intake | `/intake`, `/intake/{id}`, `/intake/{id}/conflict-check/confirm`, `/intake/{id}/convert` |
| Audit | `GET /matters/{id}/audit`, `GET /matters/{id}/audit/verify` |
| Summary | `GET /dashboard`, `GET /calendar` |

### 6.2 API conventions
Lists take `limit` (default 50, max 200) and `cursor` and return `{items, nextCursor}`. Edits send `version`. Status codes: 400 bad_request, 401 not_signed_in, 403 forbidden, 404 not_found (also for hidden), 409 conflict, 413 too_large, 422 validation_failed, 429 too_many_attempts, 503 unavailable.

### 6.3 Command line
`python -m app.cli` with `migrate`, `seed-demo [--matters N --owner EMAIL] [--services N]`, `remove-demo`, `export FILE`, `import FILE`, `check-real-data`.

### 6.4 Configuration
`MYCOURT_*` environment variables (see `backend/.env.example`); `VITE_API_URL` switches the frontend from mock to API (must share the site of the page, e.g. both `localhost`).

---

## 7. Non-functional requirements

### 7.1 Security and privacy

| ID | Requirement | Status |
|---|---|---|
| NFR-SEC-01 | Server-side validation and authorisation on every request; the front end is a convenience only. | Built |
| NFR-SEC-02 | HttpOnly SameSite=Lax cookie; CSRF header and Origin check; scrypt password hashing; hashed session tokens. | Built |
| NFR-SEC-03 | Responses never reveal whether an account, matter or process exists to someone not entitled to know. | Built |
| NFR-SEC-04 | No secrets, credentials, party names or case identifiers in logs, audit entries or error bodies. | Built |
| NFR-SEC-05 | Sensitive identifiers are never placed in a URL. | Built |
| NFR-SEC-06 | No real client data unless sign-in, per-matter authorisation and audit are active and the real-data self-check passes. | Built (gate); a security review is still required before real use |
| NFR-SEC-07 | Optional two-step sign-in (FR-ACC-09) and a general request limit per client address (600 per minute by default, `/health` exempt; 429 with the standard error body). | Built |
| NFR-SEC-08 | Single sign-on and firm-wide roles (clerk, firm administrator). | Not built |

### 7.2 Performance (targets from spec 004)
- Sign-in to a populated dashboard in under 3 s with up to 500 matters and 50 concurrent users.
- 95% of saves and searches return a result or a clear error within 2 s under that load.
- Services-site demonstration searches return in under 2 s for 95% of attempts; language change applies in under 1 s.
- Verified with `scripts/load_check.py` at the time of implementation; re-run before any real deployment.

### 7.3 Reliability and recoverability
All changes are atomic; the database being down yields a retry state; backup and restore reproduce matters, assignments, documents and audit entries; upgrades keep data without manual fixes.

### 7.4 Usability and accessibility (constitution III)
Keyboard-only operation of every screen; labelled controls with required markers; errors associated with fields and announced; visible focus; colour never the only signal; usable from 360 px to desktop with no horizontal page scroll, including the longest translations; designed loading, empty and error states.

### 7.5 Maintainability and quality
TypeScript strict; ESLint (`npm run lint`, TypeScript and React-hooks rules) is clean; automated tests required for validation, adapters and endpoints; a bug fix adds a failing-first test where practical. A schema-snapshot test fails when a model changes without a new Alembic revision.

### 7.6 Portability
Runs on Windows, macOS and Linux with the stated runtimes; the browser needs no plug-ins.

### 7.7 Compliance and honesty
Demonstration data is always labelled; the system never implies affiliation with the judiciary or eCourts; machine translation is always disclosed; generated output is a draft until approved; not finding a source is never presented as proof none exists.

### 7.8 Bundle size
Pages are loaded on demand; React and Material UI are separate cached chunks. The first screen loads about 250 kB gzipped (it was about 294 kB in one file) and the build no longer warns about chunk size.

---

## 8. Constraints and governing principles
The project constitution v1.1.0 governs and wins over other practices:

1. **Demonstration data is never presented as real.**
2. **Advocate review before reliance.**
3. **Accessible and responsive by default.**
4. **Tested, type-safe changes.**
5. **Client confidentiality and secure integration.**

Amendments go through `/speckit-constitution` with a Sync Impact Report. Non-trivial features start with a specification and plan.

---

## 9. Verification

| Layer | Method | Result at this baseline |
|---|---|---|
| Backend | `python -m pytest` (SQLite in memory) | 123 passed |
| Backend on PostgreSQL | `python -m pytest -m postgres tests/postgres` (triggers, concurrency) | 4 passed |
| Frontend | `npm test` (Vitest) | 590 passed, 2 skipped |
| Lint | `npm run lint` | Clean |
| Dependencies | `npm audit` | 0 vulnerabilities |
| Build | `npm run build` (type-check + bundle) | Passes |
| Browser, voice control | `specs/005-voice-control/browser-check.mjs` (mock mode) | 27/27 |
| Browser, workspace | `specs/004-workspace-backend/browser-check.mjs` (throw-away PostgreSQL database) | 33/33, including the screens that now save on the server |
| Browser, Services site | `specs/002-services-site-prototype/browser-check.mjs` | 60/60 (mock mode) |
| Browser, court orders | `specs/001-court-orders/browser-check.mjs` | 23/23 |
| Load | `scripts/load_check.py` | Run at implementation time |

Acceptance of this SRS: every **Built** requirement has at least one automated test or browser check; **Partial** and **Not built** items are accepted only as listed in section 11.

---

## 10. Traceability

| Source spec | Requirement groups |
|---|---|
| 001 Court orders | FR-SVC-05, FR-SVC-10, FR-SVC-13 |
| 002 Services-site prototype | FR-SVC-01 to FR-SVC-18, FR-WSP-07 |
| 003 Site translation | FR-LNG-01 to FR-LNG-08 |
| 005 Voice control | FR-VOI-01 to FR-VOI-06, FR-WSP-04 |
| 004 Workspace backend | FR-ACC, FR-MAT, FR-CON, FR-DRF, FR-INT, FR-AUD, FR-DSH, FR-DEM, FR-OPS, NFR-SEC |
| Constitution I | FR-DEM, FR-LNG-05, FR-SVC-16, NFR 7.7 |
| Constitution II | FR-DRF, FR-INT-02, FR-CON-02 |
| Constitution III | NFR 7.4 |
| Constitution IV | NFR 7.5, section 9 |
| Constitution V | FR-AUD, FR-MAT-03/04, FR-OPS-05, NFR-SEC |

---

## 11. Gaps, risks and open decisions

### 11.1 Gap register

| # | Gap | Priority | Status in 1.1 |
|---|---|---|---|
| G1 | Voice control with browser speech recognition | P2 | **Closed.** Dictation on the Voice screen (FR-WSP-04) and, in 1.2, full app-wide voice control with 27 browser checks (FR-VOI-01 to 05). Numbers, replies and a corner launcher on every screen were added (FR-VOI-07, 08). Commands in languages other than English remain open (FR-VOI-06). |
| G2 | Standalone screens kept browser state | P1 | **Closed.** Assistant, Research, Mapping, Voice, Hearing, Calendar, Intake, Billing and Documents save on the server when the API is on (FR-WSP-03). |
| G3 | No front-end screen for the intake API | P2 | **Closed.** Intake screen with confirm-clear and create-matter. |
| G4 | Translations not reviewed by a native speaker | P1 | **Open.** Needs people, not code. The notice, glossary and inspection method are in place; reviewers are still needed. |
| G5 | No real AI, research or transcription provider; no original-file storage | P2 | **Open by design.** Needs a decision (D2), a provider specification and a data-protection review. |
| G6 | No MFA, SSO, firm roles or general rate limiting | P2 | **Partly closed.** Optional authenticator-app two-step sign-in and a general rate limit are built. SSO and firm roles remain (NFR-SEC-08, decision D1). |
| G7 | No linter | P3 | **Closed.** ESLint with TypeScript and React-hooks rules; it found and fixed a real hooks-order bug in Cases. |
| G8 | Large bundle | P3 | **Closed.** On-demand pages and separate library chunks. |
| G9 | Workspace browser check not re-run | P2 | **Closed.** 33/33 on a throw-away PostgreSQL database. |
| G10 | `npm audit` notices | P2 | **Closed.** Test tooling upgraded; 0 vulnerabilities. |
| G11 | Migrations list fixed tables per revision | P3 | **Closed.** A schema-snapshot test fails when a model changes without a new revision; migration 0007 added the two-step columns. |

### 11.2 Remaining gaps and conditions before real client data
Open: **G4** (native review), **G5** (real AI provider and file storage) and the SSO and firm-roles part of **G6**.

New limits introduced in 1.1 that must be weighed before real use:
- **Browser dictation is not private.** The Web Speech API in Chrome and Edge sends audio to the browser vendor. This is why it is opt-in, warned about on screen, and restricted to demonstration material. It conflicts with the store-only rule of D2 for real matter text, so it MUST stay off for real client data unless a private transcription service replaces it.
- **Two-step secrets are stored readable.** The authenticator secret must be recoverable to verify codes, so it is stored as plain text in the database (as are the other fields); protect the database and backups accordingly, or add encryption with a managed key.
- **Codes are not replay-protected** within their 30-second window, and the rate limit is per process (adequate for one server).

All of the following are needed before real client data: a security review; resolution of the open gaps above; confirmation of D1 and D2; HTTPS with a changed secret; `check-real-data` passing; and an operations and incident procedure. Until then the system must stay on localhost with fictional data.

### 11.3 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Users mistake demonstration data or machine translation for real or authoritative content | Wrong legal reliance | Labels on every page, MT notice, draft status, constitution I and II |
| Real eCourts rules differ from inferred validation | Wrong behaviour | Inferred rules are documented as unverified in `docs/` |
| Unreviewed translations contain errors | Misleading text | MT notice; English is authoritative; reviewer process |
| Real-data mode switched on early | Confidentiality breach | Two-condition gate plus self-check |
| Large bundle on slow networks | Slow first load | Code-splitting follow-up |

### 11.4 Open decisions for the product owner
1. **D1:** confirm individual-advocate accounts with per-matter sharing, or specify firm roles and SSO now.
2. **D2:** confirm store-only AI behaviour, or choose a provider and commission its spec; also decide whether browser dictation may remain for demonstration use.
3. Decide whether a native-speaker translation review is planned and for which languages.

---

## Appendix A. Glossary of screens and routes

| Screen | Route |
|---|---|
| Dashboard | `#/dashboard` |
| Cases & matters | `#/cases`; detail `#/caseDetail/{id}` |
| Case status / Cause list / Court orders | `#/caseStatus`, `#/causeList`, `#/courtOrders` |
| eCourts Services site | `#/services` (and sub-routes per service) |
| Assistant, Research, Documents, Mapping, Voice, Hearing, Calendar, Intake, Billing | `#/assistant`, `#/research`, `#/documents`, `#/mapping`, `#/voice`, `#/hearing`, `#/calendar`, `#/intake`, `#/billing` |
| eCourts portal reference | `#/portalHome`, `#/portalAbout`, `#/portalHighCourts`, `#/portalDistrict`, `#/portalForms`, `#/portalContact`, `#/portalHelp`, `#/portalSearch`, and policy pages |

## Appendix B. Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-28 | First full SRS, reviewed against specs 001–004, the constitution and the implemented code |
| 1.1 | 2026-10-28 | Gaps G1–G3 and G6–G11 closed; two-step sign-in, rate limiting, dictation, server-backed screens, lint, code-splitting, schema-snapshot test; gap register rewritten |
