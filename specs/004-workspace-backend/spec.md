# Feature Specification: Workspace Backend

**Feature Branch**: `004-workspace-backend`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "create complete backend" (taken from the conversation: complete the backend so that every workspace screen is served and saved by it, not only the eCourts Services-site searches)

## User Scenarios & Testing *(mandatory)*

Today the backend serves only the Services-site searches. Matters, documents, tasks, calendar, intake, billing, assistant conversations, research and voice notes live in the browser and are lost on refresh. This feature makes them persistent, private to the people entitled to see them, and traceable, so that the workspace can move from a demonstration towards real use. It must keep following the project constitution: demonstration data stays labelled, generated output is a draft for advocate review, and real client data is accepted only after the safeguards below exist.

### User Story 1 - Sign in and keep my work (Priority: P1)

An advocate signs in with a personal credential, creates and edits their matters, tasks, calendar entries and notes, signs out, and finds everything exactly as left when they sign in again on another day or another device.

**Why this priority**: Nothing else is useful until work survives a page refresh and belongs to a known person.

**Independent Test**: Sign in, add a matter and a task, sign out, sign in again, and see both. Delivers persistence on its own.

**Acceptance Scenarios**:

1. **Given** a registered advocate, **When** they sign in with correct credentials, **Then** they see their own workspace and nothing belonging to anyone else.
2. **Given** a signed-in advocate who adds a matter, **When** they refresh the page or sign in on another device, **Then** the matter is still there.
3. **Given** a wrong credential, **When** sign-in is attempted, **Then** access is refused with a message that does not reveal whether the account exists.
4. **Given** an idle session, **When** the session limit is reached, **Then** the advocate must sign in again and unsaved work is not silently discarded.

---

### User Story 2 - Matters are private to the people assigned (Priority: P1)

Each matter can be seen and changed only by the people assigned to it, with the level of access they were given. Someone who is not assigned cannot see that the matter exists.

**Why this priority**: Advocate-client confidentiality is the reason real client data is forbidden today; this is the safeguard that lifts that restriction.

**Independent Test**: Create a matter as advocate A; sign in as advocate B, who is not assigned, and confirm B cannot read, find, list or change it, and cannot tell it exists.

**Acceptance Scenarios**:

1. **Given** a matter assigned to A only, **When** B searches, lists or opens it by its address, **Then** B gets the same "not found" result as for a matter that does not exist.
2. **Given** A assigns B with view-only access, **When** B tries to edit, **Then** the change is refused and nothing is altered.
3. **Given** A removes B from the matter, **When** B next acts, **Then** B immediately loses access, including to documents and notes on that matter.

---

### User Story 3 - A trail of who did what (Priority: P1)

An owner or reviewer can see, for each matter, who viewed, created, changed, exported or deleted something and when, and the record cannot be edited by the people it describes.

**Why this priority**: The constitution requires an audit trail before real case data is accepted.

**Independent Test**: Perform a view, an edit and a delete on a matter, then open its audit trail and see all three, with person and time, in order.

**Acceptance Scenarios**:

1. **Given** any create, change, delete, export or access-change action on a matter, **When** it completes, **Then** an audit entry exists with the person, action, item and time.
2. **Given** an audit entry, **When** anyone tries to edit or remove it, **Then** the attempt is refused.
3. **Given** an audit trail, **When** it is read, **Then** it contains no case identifiers or party names beyond what the viewer is entitled to see, and no secrets.

---

### User Story 4 - Documents, notes and drafts are stored with their status (Priority: P2)

An advocate registers documents for a matter, keeps text extracted from them, stores voice-note transcripts, and keeps assistant answers, research results and section mappings. Anything produced by the system is stored and shown as a draft awaiting advocate verification, with its sources, and is never filed, sent or treated as a conclusion until the advocate approves it.

**Why this priority**: These are the workspace's main outputs; they must keep their "draft" status across sessions.

**Independent Test**: Save a generated summary on a matter, reopen it later, and confirm it is still marked a draft with its sources and has an approval record only after the advocate approves it.

**Acceptance Scenarios**:

1. **Given** a generated item is saved, **When** it is reopened, **Then** it is marked as a draft for advocate review and lists its sources.
2. **Given** a draft, **When** the advocate approves it, **Then** the approval is recorded with person and time, and the item shows as approved.
3. **Given** a search that finds no source, **When** the result is stored or shown, **Then** it says nothing was found in the sources searched, not that none exists.

---

### User Story 5 - Calendar, intake and billing records (Priority: P2)

An advocate keeps hearing dates and deadlines, records new-client intake including a conflict check outcome that an advocate must confirm, and tracks time and invoices per matter.

**Why this priority**: These complete the workspace; they depend on matters and sign-in but not on each other.

**Independent Test**: Add a hearing date, an intake with a conflict check and a time entry on one matter and see them in the matter's view and in the calendar and billing screens.

**Acceptance Scenarios**:

1. **Given** a hearing date on a matter, **When** the calendar is opened, **Then** it appears on the right day for people assigned to that matter only.
2. **Given** an intake whose conflict check is "needs review", **When** the advocate has not confirmed it, **Then** the intake cannot be marked cleared.
3. **Given** time entries on a matter, **When** an invoice is prepared, **Then** totals match the entries and the invoice is a draft until approved.

---

### User Story 6 - Safe to run, change and recover (Priority: P3)

An operator can start the system from empty, apply database changes without losing data, load the labelled demonstration data on request, back up and restore, and see whether the system is healthy.

**Why this priority**: Needed to run it responsibly, but valuable only once the earlier stories exist.

**Independent Test**: Start from an empty database, apply all changes, load demonstration data, back up, delete a record, restore, and see the record return.

**Acceptance Scenarios**:

1. **Given** a database from the previous release, **When** the new release is started, **Then** existing data is kept and changes are applied once, in order.
2. **Given** demonstration mode, **When** demonstration data is loaded, **Then** every item is labelled as fictional and none is mixed with real matters.
3. **Given** a backup, **When** it is restored to an empty system, **Then** matters, documents metadata, audit trail and assignments match the original.

---

### Edge Cases

- Two people edit the same item at once: the second save is told the item changed and nothing is overwritten silently.
- A matter's last owner is removed or leaves: the matter is never left without an owner; the action is refused or ownership must be handed over first.
- An advocate is deactivated: they lose access at once, their past work and audit entries remain, and their assignments can be reassigned.
- A very large document or note, or an unsupported file type: refused with a clear reason before anything is stored.
- Repeated failed sign-ins: further attempts are slowed or locked for a period, without revealing whether the account exists.
- The database is unavailable: screens show a retry state and no partial changes are saved.
- Deleting a matter: requires explicit confirmation, is recorded in the audit trail, and removes dependent items together; a deleted matter cannot be reopened by guessing its address.
- A generated draft is edited after approval: it returns to draft and the earlier approval is kept in history.
- Services-site searches keep working without sign-in, because they hold only fictional public data.

## Requirements *(mandatory)*

### Functional Requirements

**Accounts and access**

- **FR-001**: The system MUST let a registered person sign in with a personal credential and sign out, and MUST refuse access to every workspace function when not signed in.
- **FR-002**: The system MUST end idle sessions after a limited period and MUST slow or lock repeated failed sign-ins.
- **FR-003**: Sign-in failures MUST NOT reveal whether an account exists.
- **FR-004**: The system MUST store credentials only in a form that cannot be turned back into the original credential.
- **FR-005**: Each matter MUST have one or more assigned people, each with a stated access level (at least view-only, edit, and owner).
- **FR-006**: The system MUST check access on every request to a matter and its contents, on the server, regardless of what the screen shows.
- **FR-007**: A person without access MUST receive the same response as for a matter that does not exist, for reads, searches, lists and changes.
- **FR-008**: A matter MUST always keep at least one owner.

**Persistence of workspace records**

- **FR-009**: The system MUST persist matters, tasks, calendar entries (hearings and deadlines), documents (register entries and extracted text), voice-note transcripts, intake records, time entries and invoices, and assistant conversations.
- **FR-010**: Edits MUST be detected as conflicting when two people change the same item, and MUST NOT silently overwrite.
- **FR-011**: Every change MUST be all-or-nothing; a failure MUST leave no partial record.

**Drafts and review (constitution II)**

- **FR-012**: Anything produced by the system (summaries, drafts, mappings, research results, conversation replies) MUST be stored and returned with a "draft, advocate verification required" status and its sources.
- **FR-013**: The system MUST NOT file, send or commit any item, deadline or client message without a recorded approval by a signed-in person with edit access.
- **FR-014**: The system MUST NOT invent sources, authorities or statutory mappings; where none are found it MUST say nothing was found in the sources searched.
- **FR-015**: An intake conflict check MUST NOT be markable as cleared without a recorded confirmation by an advocate.

**Audit (constitution V)**

- **FR-016**: The system MUST record who viewed, created, changed, exported, deleted or re-assigned anything on a matter, with time and item, in a trail that the people it describes cannot edit or remove.
- **FR-017**: The audit trail, logs and error messages MUST NOT contain secrets, credentials, or case identifiers and party names beyond what the reader may see.

**Data labelling and separation (constitution I)**

- **FR-018**: Demonstration data MUST be marked as fictional in storage and when returned, and MUST be kept separate from real matters.
- **FR-019**: The system MUST accept real client data only when sign-in, per-matter access checks and the audit trail (FR-001 to FR-008, FR-016) are active; otherwise it MUST run in demonstration-only mode and refuse to label anything as real.

**Existing services**

- **FR-020**: The Services-site searches (case status, orders, cause lists, caveats, process lookup, location) MUST keep working as today, without sign-in, and MUST remain independent of workspace records.

**Operation**

- **FR-021**: Database changes MUST be applied through ordered, repeatable steps that keep existing data.
- **FR-022**: The system MUST offer a health check and MUST support back-up and restore of all workspace data.
- **FR-023**: Every request MUST be validated on the server; unknown or malformed input MUST be refused with a clear message.
- **FR-024**: Lookups that carry personal or case identifiers MUST NOT put them in an address, and the system MUST NOT bypass any external service's access controls.

**Deferred decisions**

- **FR-025**: Accounts MUST be individual advocates. A matter's owner MAY share it with another existing account at view-only or edit level; firm-wide roles (clerk, firm administrator) are out of scope for this release but the access model MUST NOT prevent adding them later. *(Assumed decision, not yet confirmed by the user; see Assumptions.)*
- **FR-026**: The assistant, research, section mapping and speech-to-text functions MUST, in this release, store and return their outputs with labelled demonstration content and MUST NOT send any matter text to an external AI or transcription service. The draft, source and approval flow (FR-012 to FR-015) MUST be complete so a provider can be added later behind a documented boundary. *(Assumed decision, not yet confirmed by the user; see Assumptions.)*

### Key Entities

- **Person**: someone who can sign in; has a name, a contact address, an active or deactivated state and credentials.
- **Matter**: a client engagement or case; has a title, status, a client reference, and optionally linked court case identifiers; is either demonstration or real.
- **Assignment**: links a Person to a Matter with an access level (view-only, edit, owner).
- **Task / Calendar entry**: a to-do or a hearing or deadline belonging to one Matter, with a date and done state.
- **Document**: a register entry for a file on a Matter with type, status, extracted text and the confidence of that extraction.
- **Voice note**: a transcript on a Matter, with a review state.
- **Draft item**: any system-produced output (summary, mapping, research result, conversation reply) with its sources and review state (draft, approved) and approval history.
- **Conversation**: an ordered set of messages between a Person and the assistant, tied to a Matter.
- **Intake record**: a prospective client's details and a conflict check result with a recorded confirmation.
- **Time entry / Invoice**: billable time on a Matter and the invoice built from it, with review state.
- **Audit entry**: an unalterable record of who did what to which item and when.
- **Demonstration set**: the labelled fictional data that can be loaded and removed as a unit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After refreshing the page or signing in on another device, 100% of saved matters, tasks, calendar entries, documents, notes and drafts are present and unchanged.
- **SC-002**: In an access test across at least two people and ten matters, 0 reads, lists, searches or changes succeed on a matter the person is not assigned to, and the response is indistinguishable from "not found" in every case.
- **SC-003**: 100% of create, change, delete, export and access-change actions on a matter appear in its audit trail within one minute, and 0 attempts to edit or remove an audit entry succeed.
- **SC-004**: 100% of system-produced items are shown as drafts until approved, and 0 are filed, sent or committed without a recorded approval.
- **SC-005**: A person can sign in, open the dashboard and see their matters in under 3 seconds with up to 500 matters and 50 concurrent users.
- **SC-006**: A save or search returns a result or a clear error within 2 seconds for 95% of requests under that load.
- **SC-007**: Upgrading from the previous release keeps 100% of existing data and needs no manual data fixes.
- **SC-008**: A restore of a backup onto an empty system reproduces all matters, assignments, documents and audit entries, verified by comparing counts and a sample of records.
- **SC-009**: A review of logs and error responses from the test run finds 0 credentials and 0 party names or case identifiers in them.
- **SC-010**: All Services-site searches that work today still work without sign-in after this release.

## Assumptions

- **Demonstration first**: until FR-019's safeguards are verified, the system runs in demonstration-only mode and holds fictional data; real client data is out of scope for this release's go-live and needs a separate review.
- **Sign-in**: a personal credential (such as e-mail and password) is enough for this release; single sign-on and multi-factor sign-in are out of scope but must not be made impossible.
- **Roles (assumed, changeable)**: individual advocates with per-matter sharing (FR-025); the three access levels per matter in FR-005 are enough. Firm-wide roles are a later feature.
- **AI and transcription (assumed, changeable)**: store-and-return only, with labelled demonstration content (FR-026). Connecting a provider needs its own specification and a data-protection review under constitution Principle V.
- **Documents**: the system stores each document's register entry and extracted text; storing and virus-scanning the original files is out of scope for this release unless stated in planning.
- **Language and accessibility**: workspace screens stay in English; errors returned by the backend are plain-language and carry a code so screens can translate them later.
- **Retention**: matter data is kept until an owner deletes it; deletion is permanent after confirmation; audit entries outlive the data they describe.
- **Scale**: one organisation, up to 500 matters and 50 concurrent users, one region; no offline use.
- **Existing parts**: the Services-site backend, the front end's mock default and the translation work remain as built; the front end switches from browser state to the backend screen by screen.
- **Not affiliated**: the system remains an independent prototype, not connected to eCourts and not affiliated with the judiciary; it does not scrape official sites or bypass their controls.
