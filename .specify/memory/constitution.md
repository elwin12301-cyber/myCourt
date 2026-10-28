<!--
Sync Impact Report
Version change: 1.0.0 -> 1.1.0 (MINOR: guidance materially expanded; no principle removed or redefined)
Modified principles:
  - I. Demonstration Data Is Never Presented as Real: also covers unreviewed machine translation.
  - IV. Tested, Type-Safe Changes: covers the Python backend and its tests; removed the "no backend" rationale.
  - V. Client Confidentiality and Secure Integration: server-side validation, POST-only sensitive
    lookups, and the rule that the unauthenticated prototype API holds fictional data only.
Added sections: none (existing sections expanded: Technology and Integration Constraints,
  Development Workflow and Quality Gates).
Removed sections: none.
Deferred items: none.
Reason: the repository now has frontend/ and backend/ (FastAPI + PostgreSQL), a six-language
  services site, and new paths and commands that the 1.0.0 text no longer matched.
Templates checked: .specify/templates/{plan,spec,tasks}-template.md read the constitution at
  runtime; none were modified by this command.
-->
# myCourt Constitution

## Core Principles

### I. Demonstration Data Is Never Presented as Real
Every record, figure, citation, or case detail that is not obtained from a verified, authorised
source MUST be visibly labelled as demonstration data. The application MUST NOT fabricate court
records, authorities, statutory mappings, or API responses, and MUST NOT imply affiliation with
the Indian judiciary or the official eCourts service. Text that is machine-translated MUST say so
on the page, in the reader's language and in English, until a native speaker has reviewed it.
Rationale: users are advocates whose work depends on accurate legal information; a believable
fake is worse than an empty screen.

### II. Advocate Review Before Reliance
AI-generated or system-generated output (summaries, drafts, mappings, briefs) MUST be presented
as a draft that requires advocate verification. No filing, client message, deadline, or legal
conclusion may be committed or sent without explicit user approval. Not finding a source MUST NOT
be presented as proof that none exists. Rationale: legal accuracy and professional responsibility
rest with the advocate, not the tool.

### III. Accessible and Responsive by Default
Every screen MUST work by keyboard, expose labelled controls, associate validation errors with
their fields, keep a visible focus indicator, and remain usable at phone, tablet, and desktop
widths, including with the longest translated text. Colour MUST NOT be the only carrier of
meaning. The page language attribute MUST match the displayed language. Loading, empty, and error
states MUST be designed for every data-driven view. Rationale: court services are public-facing
and must be usable by all.

### IV. Tested, Type-Safe Changes
Frontend TypeScript strict mode MUST remain enabled. Validation rules, data adapters, API
endpoints, and other logic MUST have automated tests: `npm test` in `frontend/` and
`python -m pytest` in `backend/`. `npm run build` and the backend tests MUST pass before a change
is merged. A bug fix MUST add a test that fails without the fix where practical. Test results MUST
be reported as actually observed, never assumed. Rationale: tests are the primary regression
defence, and a prototype that grows a backend must not lose that safety net.

### V. Client Confidentiality and Secure Integration
Real client or case data MUST NOT be stored or processed until the backend provides
authentication, per-matter authorisation, and an audit trail. Until then the API is a prototype
that MUST hold fictional data only and MUST NOT be exposed beyond localhost. The server MUST
validate every request itself; front-end checks are a convenience, never the control. Lookups
that carry personal or case identifiers (names, process IDs, e-mail addresses) MUST use a request
body, not a URL, and MUST NOT reveal whether a record exists when the caller is not entitled to
know. Secrets, tokens, and credentials MUST NOT appear in client code, logs, or repositories
(development-only throw-away credentials in `docker-compose.yml` are the one exception).
Integrations with external court services MUST go through a documented adapter boundary on the
server, use only authorised access, and MUST NOT bypass CAPTCHAs, rate limits, or other access
controls. Case identifiers and party names MUST NOT be written to logs. Rationale: advocate-client
privilege and applicable data-protection duties.

## Technology and Integration Constraints

- Repository layout: `frontend/` (Vite, React 18, TypeScript strict, plain CSS) and `backend/`
  (Python 3.12 or newer, FastAPI, SQLAlchemy, PostgreSQL). Specifications, plans, and logs live in
  `specs/`; analysis in `docs/`.
- New runtime dependencies, in either part, MUST be justified in the change description; prefer the
  existing stack.
- External data access MUST use the adapter pattern (see `frontend/src/features/caseStatus/types.ts`
  and `frontend/src/api/adapters.ts`) so mock, backend, and any future real implementations are
  interchangeable. The in-browser mock MUST remain the default until an integration is verified.
- User-facing text on the services site MUST be translatable: English is the key, every supported
  language MUST have a translation for each string, and stored or searched values MUST stay in
  English (`frontend/src/i18n`).
- Unverified assumptions (for example validation rules inferred rather than observed on an
  official service) MUST be documented as such in `docs/`.

## Development Workflow and Quality Gates

- Non-trivial features start with a Spec Kit specification and plan before implementation.
- Each change MUST keep unrelated functionality intact and be reviewable as a small set of files.
- Before merge: frontend build and tests pass, backend tests pass, and new UI is checked by
  keyboard. Changes to what the services site shows SHOULD also pass the browser checks in
  `specs/` against the running app.
- Audit and gap findings are recorded in `docs/` with evidence (file path or source URL) and a
  P0-P3 priority; unverifiable claims MUST be labelled Unverified.
- Destructive operations (deleting modules, overwriting files, database changes) require explicit
  approval.

## Governance

This constitution supersedes other project practices. Amendments MUST be made through
`/speckit-constitution`, include a Sync Impact Report, and update dependent documents in the same
change. Versioning follows semantic rules: MAJOR for removing or redefining a principle in a
backward-incompatible way, MINOR for adding a principle or materially expanding guidance, PATCH
for clarifications. Every plan and review MUST check compliance with these principles, and any
justified deviation MUST be recorded in the plan's complexity or exceptions section. Runtime
guidance lives in `docs/prototype-guide.md` and `docs/implementation-plan.md`.

**Version**: 1.1.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-28
