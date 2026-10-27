---

description: "Task list for the Court Orders Search feature"
---

# Tasks: Court Orders Search

**Input**: Design documents from `/specs/001-court-orders/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: INCLUDED. The spec does not ask for TDD, but the project constitution (Principle IV) requires automated tests for validation rules and data adapters, and `npm test` plus `npm run build` must pass before merge. Write each story's tests first and confirm they fail before implementing.

**Organization**: Tasks are grouped by user story so each can be implemented and tested independently. Priorities from the spec: US1 (P1), US4 (P1), US2 (P2), US3 (P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 find orders in a known case, US2 browse by court or date, US3 open the case behind an order, US4 demonstration-data clarity
- Paths are relative to the repository root (single front-end project)

---

## Phase 1: Setup

**Purpose**: confirm the starting point and create the folders.

- [X] T001 Run `npm test` and `npm run build` at the repository root and record the baseline (72 tests passing, build succeeding) in the commit message of the first change
- [X] T002 [P] Create the folders `src/features/courtOrders/` and `src/pages/courtOrders/`

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: shared data, exports and page registration that every story needs.

**CRITICAL**: no user story work starts until this phase is complete.

- [X] T003 Extend the order entry in `src/features/caseStatus/types.ts`: export `OrderKind = 'Interim' | 'Final'` and add `kind`, `number` and `hasDocument` to `OrderEntry` (data-model: Order)
- [X] T004 Update every order in `src/features/caseStatus/mockData.ts` to carry `kind`, a sequential `number` per case in date order, and `hasDocument: false`; add one interim order to case `MHMU019999992022` so at least one case has both kinds, and keep case `DLND019999992023` with no orders
- [X] T005 [P] Add a fictional `period` field to every court in `src/features/causeList/courtRooms.ts` and export `courtNumberLabel(room)` returning `number - judge - designation (period)`; keep `roomLabel` unchanged
- [X] T006 [P] Export `Radios`, `YearField`, `CaseTypeField` and the `Setter` type from `src/pages/caseStatus/form.tsx` (research D1, D7)
- [X] T007 [P] Create `src/features/courtOrders/types.ts` with `OrderFilter`, the `OrderQuery` union (`party`, `caseNumber`, `courtNumber`, `orderDate`), `OrderResult` and `OrderSearchAdapter` exactly as in `contracts/order-search-adapter.md`
- [X] T008 [P] Update the Orders section of `src/pages/caseStatus/Detail.tsx` to show `Order {number}: {title}`, the order type and date, and a disabled document control driven by `hasDocument` with the text "No document exists in demonstration data" (FR-013)
- [X] T009 [P] Add the page id `'courtOrders'` to `src/types.ts` and to `PAGE_IDS` in `src/router.ts`
- [X] T010 Create the page shell `src/pages/CourtOrders.tsx`: heading and Reset button, the demonstration notice with `role="note"` (FR-014), the four search-type tabs (Party Name, Case Number, Court Number, Order Date) and the idle prompt (depends on T007)
- [X] T011 Register the page in `src/App.tsx`: import `CourtOrdersPage`, add the sidebar entry "Court orders", add it to the `PAGES` map, and route top-search text containing "court order" to it (depends on T009, T010)
- [X] T012 [P] Add "Court orders (demo)" to the portal index in `src/features/portal/search.ts` and set `page: 'courtOrders'` on the Court Orders entry of `SEARCH_MENU_LINKS` in `src/features/caseStatus/referenceData.ts` (FR-019)
- [X] T013 Run `npm test` and `npm run build`; all 72 existing tests must still pass and the build must succeed

**Checkpoint**: foundation ready; user stories can begin.

---

## Phase 3: User Story 1 - Find the orders in a known case (Priority: P1) MVP

**Goal**: search by case number or party name with an order-type filter and a captcha, and see the matching orders newest first.

**Independent Test**: quickstart scenarios 1, 2, 3, 7, 8 and 9.

### Tests for User Story 1 (write first, confirm they fail)

- [X] T014 [P] [US1] Validation tests in `src/features/courtOrders/validation.test.ts`: party name needs 3+ characters and a year; case number needs type, 1-7 digits and a year; state, district and complex required; establishment optional; default filter is Both
- [X] T015 [P] [US1] Search tests in `src/features/courtOrders/search.test.ts`: party match on petitioner or respondent but not on advocates; case-number match; Interim, Final and Both filters; empty result is an empty list, not an error; newest-first ordering; abort rejects
- [X] T016 [P] [US1] Render tests in `src/features/courtOrders/render.test.tsx` for the Party Name and Case Number tabs: required markers, court selectors, order-type radios, captcha controls and the Go button

### Implementation for User Story 1

- [X] T017 [US1] Implement `validateOrderQuery` for the `party` and `caseNumber` modes in `src/features/courtOrders/validation.ts`, reusing the court and year rules from `src/features/caseStatus/validation.ts` (depends on T007)
- [X] T018 [US1] Implement matching, flattening, filtering and sorting for the `party` and `caseNumber` modes, plus `createMockOrderAdapter(latencyMs)` with abort support, in `src/features/courtOrders/courtOrders.ts` (depends on T003, T004, T007)
- [X] T019 [P] [US1] Build the controlled results table in `src/pages/courtOrders/OrderResults.tsx`: props `results`, `filter`, `sort`, `onFilter`, `onSort`, `onView`; columns per `contracts/page-ui-contract.md`; the document control disabled with an explanation (research D6)
- [X] T020 [US1] Add the Party Name and Case Number forms to `src/pages/CourtOrders.tsx`: `CourtPicker`, fields, order-type radios (Interim Orders, Final Orders, Both; default Both), `CaptchaField`, Go and Reset (depends on T006, T010)
- [X] T021 [US1] Wire the search lifecycle in `src/pages/CourtOrders.tsx`: validate, check the captcha and refresh it, abort on a new search, tab change or reset, states idle, loading, error with Retry and done, and hold filter and sort state in the page (depends on T017, T018, T019, T020)
- [X] T022 [US1] Show the empty-result wording "No matching order in the demonstration data. This does not mean no real order exists." and keep the "no demonstration data for this state" message in `src/pages/CourtOrders.tsx`

**Checkpoint**: User Story 1 works on its own; this is the minimum viable slice.

---

## Phase 4: User Story 4 - Understand what is demonstration data (Priority: P1)

**Goal**: nobody can mistake a demonstration order for a real one, in any page state.

**Independent Test**: quickstart scenario 11.

- [X] T023 [US4] Add render tests to `src/features/courtOrders/render.test.tsx` that assert the demonstration notice and its "not affiliated" wording appear in the idle, results, empty, error and case-view renderings (depends on T016)
- [X] T024 [US4] Confirm in `src/pages/CourtOrders.tsx` that the notice sits outside every conditional state block and that the case view and the error state still show it; fix any state that hides it (FR-014)

**Checkpoint**: Stories 1 and 4 together satisfy both P1 stories.

---

## Phase 5: User Story 2 - Browse orders by court or by date range (Priority: P2)

**Goal**: search by court number or by an inclusive date range.

**Independent Test**: quickstart scenarios 4, 5 and 6.

### Tests for User Story 2 (write first, confirm they fail)

- [X] T025 [P] [US2] Validation tests in `src/features/courtOrders/validation-modes.test.ts`: the court number must belong to the chosen complex and establishment; both dates required and valid; from later than to is rejected; equal dates accepted
- [X] T026 [P] [US2] Search tests in `src/features/courtOrders/search-modes.test.ts`: court-number match; inclusive date range; single-day range; a range with no orders returns an empty list

### Implementation for User Story 2

- [X] T027 [US2] Extend `validateOrderQuery` in `src/features/courtOrders/validation.ts` for the `courtNumber` and `orderDate` modes (depends on T017)
- [X] T028 [US2] Extend the matching in `src/features/courtOrders/courtOrders.ts` for the `courtNumber` and `orderDate` modes (depends on T018)
- [X] T029 [US2] Add the Court Number select (labels from `courtNumberLabel`, cleared when the court selection changes) and the From and To date inputs to `src/pages/CourtOrders.tsx` (depends on T005, T020)
- [X] T030 [US2] Extend `src/features/courtOrders/render.test.tsx` with checks for the Court Number and Order Date tabs (depends on T016)

**Checkpoint**: Stories 1, 4 and 2 all work independently.

---

## Phase 6: User Story 3 - Open the case behind an order (Priority: P3)

**Goal**: open the full case from a result and come back to the same list.

**Independent Test**: quickstart scenario 10.

- [X] T031 [P] [US3] Render tests in `src/features/courtOrders/results.test.tsx` showing that `OrderResults` renders exactly the rows implied by its `filter` and `sort` props and shows the disabled document control with its explanation (spec SC-006, FR-013)
- [X] T032 [US3] Handle `onView` in `src/pages/CourtOrders.tsx`: show the existing `CaseDetail` for the chosen row, and on Back restore the same results, filter and sort (depends on T008, T021)
- [X] T033 [US3] Verify against the spec that returning from a case keeps the order-type filter, the sort and the result list unchanged; fix any reset in `src/pages/CourtOrders.tsx`

**Checkpoint**: all four stories work independently.

---

## Phase 7: Polish and cross-cutting concerns

- [X] T034 [P] Add the "Other search services" panel to `src/pages/CourtOrders.tsx`: Caveat Search, Process Details and Location as external links through `ExternalLink`, and Cause List and Case Status as in-app links (FR-019)
- [X] T035 [P] Update `docs/ecourts-reference-analysis.md` (Court Orders page review of 2026-10-27), `docs/gap-analysis.md` (new rows, Court Orders now built) and `docs/prototype-guide.md` (a Court orders section with example searches)
- [X] T036 [P] Check keyboard-only use and phone width (about 360 px) against quickstart scenarios 12 and 13 and record the result in `specs/001-court-orders/validation-log.md`
- [X] T037 Run quickstart scenarios 1-11 and record each outcome with the date in `specs/001-court-orders/validation-log.md`
- [X] T038 Run `npm test` and `npm run build` and confirm both pass before committing
- [X] T039 Re-check the finished feature against constitution Principles I-V and note the result in `specs/001-court-orders/validation-log.md`

---

## Dependencies and execution order

### Phase dependencies
- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; blocks every story.
- **User stories (Phases 3-6)**: all depend on Foundational. Order by priority: US1, then US4, then US2, then US3. US2 and US3 extend files US1 creates (`validation.ts`, `courtOrders.ts`, `CourtOrders.tsx`), so run them after US1 rather than in parallel.
- **Polish (Phase 7)**: after the stories you intend to ship.

### Task-level dependencies
- T010 needs T007; T011 needs T009 and T010.
- T017 needs T007; T018 needs T003, T004, T007; T020 needs T006 and T010; T021 needs T017-T020.
- T027 needs T017; T028 needs T018; T029 needs T005 and T020.
- T032 needs T008 and T021.

### Within each story
- Tests first and failing, then validation, then matching and adapter, then page wiring.

### Parallel opportunities
- Phase 2: T005, T006, T007, T008, T009 and T012 touch different files and can run together.
- US1 tests T014, T015 and T016 are separate files; T019 (results table) can run alongside T017 and T018.
- US2 tests T025 and T026 can run together.
- Polish T034, T035 and T036 can run together.

## Parallel example: User Story 1

```text
Together:  T014 validation tests   T015 search tests   T016 render tests
Then:      T017 validation  ||  T018 matching and adapter  ||  T019 results table
Then:      T020 form  ->  T021 lifecycle  ->  T022 empty states
```

## Implementation strategy

### MVP first
1. Phases 1 and 2.
2. Phase 3 (US1) and Phase 4 (US4), the two P1 stories.
3. Stop and validate with quickstart scenarios 1-3, 7-9 and 11. Demo if ready.

### Incremental delivery
1. Add US2 (court and date search), validate scenarios 4-6.
2. Add US3 (open the case), validate scenario 10.
3. Polish: docs, accessibility checks, full quickstart run, constitution re-check.

## Notes
- [P] tasks touch different files. Several tasks edit `CourtOrders.tsx`; they are sequential on purpose.
- Out of scope: the existing Case Status results table resets its filter when a case is opened. Court Orders avoids this by keeping the state in the page (research D6); changing Case Status is a separate follow-up.
- Out of scope: real eCourts data, order documents, and the official results layout, which was not observed.
- Commit after each task or logical group, and stop at any checkpoint to validate.

## Implementation notes (2026-10-27)
- All 39 tasks are complete. Evidence is in `validation-log.md`: 128 automated tests passing, a 23-check browser run, and screenshots reviewed at desktop and 360 px width.
- T036 and T037 were done with scripted Chrome (`browser-check.mjs`), including real Tab key presses and a 360 px emulation. They were not done by a human or with a screen reader.
- T031 passed on its first run because the controlled results table already existed from US1; all other test groups were seen failing before their implementation.
- Added beyond the task list: `src/features/courtOrders/modes.ts` (labels and help text), an optional `initial` prop on the page so render tests can show every state, and `browser-check.mjs`.
- Defects found and fixed during validation: a weak focus ring on form fields (app-wide) and uneven field heights.
