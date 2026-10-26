# Implementation plan

| Gap | Change | Files | Effort | Acceptance criteria | State |
|---|---|---|---|---|---|
| GAP-001 | Case Status page: three search modes, results, detail with history and orders, mock adapter behind an interface | `src/pages/CaseStatus.tsx`, `src/features/caseStatus/*` | Medium | Valid search returns labelled demo data; invalid input shows field errors; empty, loading and error states render | Done |
| GAP-002 | Accessible field validation for Case Status | `validation.ts`, `CaseStatus.tsx` | Small | `aria-invalid`, `role="alert"` messages; unit-tested | Done |
| GAP-003 | Skip link, dialog semantics + Escape, `aria-current`, focus ring, labelled search, reduced motion | `App.tsx`, `styles.css` | Small | Keyboard users can skip nav, close modals with Escape | Done; focus trap pending |
| GAP-005 | Vitest + 14 unit tests | `package.json`, `caseStatus.test.ts` | Small | `npm test` passes | Done |
| GAP-006 | Route CNR/status keywords to Case Status | `App.tsx` | Small | Typing "cnr" + Enter opens Case Status | Done |
| GAP-007 | Add a router (e.g. React Router) with one URL per page | `main.tsx`, `App.tsx` | Medium | Back button and deep links work | Proposed |
| GAP-008 | "Demo data" badges on Dashboard and Cases | those pages | Small | Every figure shown is labelled | Proposed |
| GAP-004 | Display-settings toolbar (font size, contrast, spacing) persisted in `localStorage` | `App.tsx`, CSS | Medium | Settings apply app-wide and reset | Proposed |
| GAP-005b | ESLint + Prettier + a component test setup (Testing Library) | config, tests | Small | `npm run lint` passes in CI | Proposed |
| GAP-009 | Backend service: auth, per-matter authorisation, audit log, encrypted storage | new | Large | Needs its own spec (`/speckit-specify`) | Proposed |

## Real eCourts integration (not done)
Implement `CaseSearchAdapter` (`src/features/caseStatus/types.ts`) in a **server-side** service. Use only an officially authorised data source or API agreement; do not scrape, and do not circumvent the CAPTCHA. Keep credentials on the server, avoid logging CNRs and party names, and keep the demo banner until a verified integration exists.

## Dependencies
Added dev-only: `vitest`. No runtime dependencies added.
