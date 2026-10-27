# Implementation Plan: Court Orders Search

**Branch**: `001-court-orders` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-court-orders/spec.md`

## Summary

Add a **Court Orders** service to the myCourt front end that searches orders by party name, case number, court number or order-date range, with an interim/final/both filter, a demonstration captcha and the shared State/District/Court Complex/Establishment selector. Results list orders newest first and open the existing case record. All data is fictional and comes through a replaceable adapter, so a real authorised source can later be swapped in. The approach reuses what Case Status and Cause List already provide (court selector, captcha, case record, court list) and adds only the order-specific pieces: an extended order record, a query/validation module, an adapter, and one page. Details are in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.6 (strict), React 18, as in the existing project

**Primary Dependencies**: none new (React, Vite 6, Vitest already installed)

**Storage**: N/A (in-memory fictional data; nothing is persisted)

**Testing**: Vitest unit tests for validation, matching and the adapter; Vitest plus `react-dom/server` render checks for each search type, as used by Case Status and Cause List. No browser end-to-end tool is configured.

**Target Platform**: Modern desktop and mobile browsers, served by the Vite dev server or a static build

**Project Type**: Single-page web front end (no backend)

**Performance Goals**: Demonstration results in under 2 s (spec SC-003); the mock adapter's simulated latency is 600 ms

**Constraints**: No new runtime dependencies; no real court data; no scraping or captcha bypass; keyboard-operable; must work at phone width

**Scale/Scope**: 4 search types, 1 page, about 8 demo cases with 1-3 orders each; 8 fictional courts

No `NEEDS CLARIFICATION` items remain; the spec's open points are recorded as assumptions and resolved in research.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Result |
|---|---|---|
| I. Demonstration data never presented as real | Banner in every page state; empty result says absence is not proof; no real identifiers | PASS (FR-014, UI contract) |
| II. Advocate review before reliance | No order is sent, filed or acted on; results are labelled demonstration | PASS |
| III. Accessible and responsive | Labelled fields, `role="alert"` errors, keyboard-only flows, tab roles, phone width, loading/empty/error states | PASS (FR-009, FR-011, FR-016) |
| IV. Tested, type-safe changes | Strict TS kept; unit and render tests added; `npm test` and `npm run build` required before merge | PASS (testing plan) |
| V. Confidentiality and secure integration | No real data or secrets; adapter boundary documented; no CAPTCHA bypass; no logging of case data | PASS (FR-015, contracts/) |
| Technology constraints | No new runtime dependency; adapter pattern used; assumptions documented in `docs/` | PASS |

**Re-check after Phase 1 design**: PASS, no violations. One design point needed care: Principle III and spec SC-006 require the result list and filters to survive opening a case. The design keeps filter and sort state in the page, not in the results table (see research D6). Complexity Tracking is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-court-orders/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── order-search-adapter.md   # data-source contract
│   └── page-ui-contract.md       # screen, states and accessibility contract
├── checklists/requirements.md    # spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks - not created here)
```

### Source Code (repository root)

```text
src/
├── features/
│   ├── caseStatus/
│   │   ├── types.ts            # CHANGE: OrderEntry gains kind, number, hasDocument
│   │   ├── mockData.ts         # CHANGE: orders gain kind and number
│   │   └── referenceData.ts    # CHANGE: Court Orders menu entry becomes an internal page
│   ├── causeList/
│   │   └── courtRooms.ts       # CHANGE: CourtRoom gains period; courtNumberLabel helper
│   └── courtOrders/            # NEW
│       ├── types.ts            # OrderQuery, OrderFilter, OrderResult, OrderSearchAdapter
│       ├── validation.ts       # validateOrderQuery (pure)
│       ├── courtOrders.ts      # matching, sorting, mock adapter
│       └── courtOrders.test.ts # unit tests
├── pages/
│   ├── CourtOrders.tsx         # NEW: page (form, states, results, case view)
│   ├── courtOrders/
│   │   └── OrderResults.tsx    # NEW: results table (controlled filter/sort)
│   └── caseStatus/
│       ├── Detail.tsx          # CHANGE: show order number and type
│       └── form.tsx            # CHANGE: export Radios, YearField, CaseTypeField, Setter
├── types.ts, router.ts, App.tsx        # CHANGE: register the 'courtOrders' page and sidebar entry
└── features/portal/search.ts           # CHANGE: add the page to portal search
src/features/caseStatus/render.test.tsx # CHANGE: add Court Orders render checks
docs/                                   # CHANGE: reference analysis, gap analysis, prototype guide
```

**Structure Decision**: single front-end project, following the existing `features/<service>` plus `pages/<Service>.tsx` layout used by Case Status and Cause List. Shared pieces are reused and exported, not copied.

## Complexity Tracking

No constitution violations; nothing to justify.
