<!--
Sync Impact Report
Version change: template (unversioned) -> 1.0.0
Modified principles: none renamed (all five were unfilled template placeholders)
Added sections: Core Principles I-V, Technology and Integration Constraints,
  Development Workflow and Quality Gates, Governance
Removed sections: none
Deferred items: none. Ratification date set to the adoption date (2026-10-26).
Templates checked: .specify/templates/{plan,spec,tasks}-template.md read the constitution at
  runtime; none were modified by this command.
-->
# myCourt Constitution

## Core Principles

### I. Demonstration Data Is Never Presented as Real
Every record, figure, citation, or case detail that is not obtained from a verified, authorised
source MUST be visibly labelled as demonstration data. The application MUST NOT fabricate court
records, authorities, statutory mappings, or API responses, and MUST NOT imply affiliation with
the Indian judiciary or the official eCourts service. Rationale: users are advocates whose work
depends on accurate legal information; a believable fake is worse than an empty screen.

### II. Advocate Review Before Reliance
AI-generated or system-generated output (summaries, drafts, mappings, briefs) MUST be presented
as a draft that requires advocate verification. No filing, client message, deadline, or legal
conclusion may be committed or sent without explicit user approval. Not finding a source MUST NOT
be presented as proof that none exists. Rationale: legal accuracy and professional responsibility
rest with the advocate, not the tool.

### III. Accessible and Responsive by Default
Every screen MUST work by keyboard, expose labelled controls, associate validation errors with
their fields, keep a visible focus indicator, and remain usable at phone, tablet, and desktop
widths. Colour MUST NOT be the only carrier of meaning. Loading, empty, and error states MUST be
designed for every data-driven view. Rationale: court services are public-facing and must be
usable by all.

### IV. Tested, Type-Safe Changes
TypeScript strict mode MUST remain enabled. Validation rules, data adapters, and other pure logic
MUST have automated tests that run with `npm test`, and `npm run build` MUST pass before a change
is merged. A bug fix MUST add a test that fails without the fix where practical. Test results MUST
be reported as actually observed, never assumed. Rationale: the app currently has no backend
safety net, so tests are the primary regression defence.

### V. Client Confidentiality and Secure Integration
Real client or case data MUST NOT be stored or processed until a server-side service provides
authentication, per-matter authorisation, and an audit trail. Secrets, tokens, and credentials
MUST NOT appear in client code, logs, or repositories. Integrations with external court services
MUST go through a documented adapter boundary on the server, use only authorised access, and MUST
NOT bypass CAPTCHAs, rate limits, or other access controls. Case identifiers and party names MUST
NOT be written to logs. Rationale: advocate-client privilege and applicable data-protection duties.

## Technology and Integration Constraints

- Stack: Vite, React 18, TypeScript (strict), plain CSS. New runtime dependencies MUST be justified
  in the change description; prefer the existing stack.
- External data access MUST use the adapter pattern (see `src/features/caseStatus/types.ts`) so
  mock and real implementations are interchangeable and the mock remains the default until an
  integration is verified.
- Unverified assumptions (for example validation rules inferred rather than observed on an
  official service) MUST be documented as such in `docs/`.

## Development Workflow and Quality Gates

- Non-trivial features start with a Spec Kit specification and plan before implementation.
- Each change MUST keep unrelated functionality intact and be reviewable as a small set of files.
- Before merge: build passes, tests pass, and new UI is checked by keyboard.
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

**Version**: 1.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26
