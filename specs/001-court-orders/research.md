# Research: Court Orders Search

All items below were open in the spec's Assumptions or arose while planning. None required outside research beyond the official page already reviewed on 2026-10-27 (text only, nothing submitted).

## D1 - Technology and structure
- **Decision**: build on the existing stack (React 18, TypeScript strict, Vite, Vitest) with a `features/courtOrders` module and a `pages/CourtOrders.tsx` page.
- **Rationale**: matches the Case Status and Cause List services, needs no new dependency (constitution technology constraint), and keeps logic in pure, testable functions.
- **Alternatives considered**: a router library per service (rejected: out of scope, hash routing already works); putting the logic inside the page component (rejected: harder to test, breaks the project's feature-module pattern).

## D2 - Data source boundary
- **Decision**: define `OrderSearchAdapter` with a single `search(query, signal)` method and ship a mock implementation over the existing demo cases.
- **Rationale**: spec FR-015 and constitution Principle V require a replaceable, server-side-capable boundary; the same pattern already exists for Case Status and Cause List.
- **Alternatives considered**: reading demo data directly in the page (rejected: couples UI to fixtures); calling the official site (rejected: no authorised access, CAPTCHA must not be bypassed).

## D3 - Order record
- **Decision**: extend the existing order entry with `kind` (`Interim` or `Final`), `number` (sequence within the case) and `hasDocument` (always false in demo data). Orders stay nested in their case record; the service flattens them into result rows.
- **Rationale**: the interim/final filter and the order number are required by the spec; nesting avoids a second data store and keeps the Case view consistent.
- **Alternatives considered**: a separate orders table keyed by CNR (rejected: duplicates data, more to keep in sync for a fixture of about 15 orders).

## D4 - Meaning of "Year" and of dates
- **Decision**: in party-name search, "Year" is the case year; order dates are date-only ISO strings (`YYYY-MM-DD`) compared as strings, inclusive at both ends.
- **Rationale**: the official wording is unexplained (spec assumption). Date-only strings avoid time-zone shifts that `Date` objects introduce.
- **Alternatives considered**: registration year versus filing year (rejected: the demo data would give the same answer; revisit if the official meaning is confirmed).

## D5 - Which fields are required
- **Decision**: state, district and complex required; establishment optional; party name at least 3 characters (verified on the official page); year, case type and case number required where the official page marks them; both dates required with from not later than to.
- **Rationale**: follows the official required markers; establishment rules were not observed, so the least restrictive choice is used and documented.
- **Alternatives considered**: requiring establishment (rejected: unverified and would block more users).

## D6 - Keeping the list when a case is opened (spec SC-006)
- **Decision**: hold filter and sort state in the page and pass them to a controlled results table.
- **Rationale**: the existing Case Status results table keeps its filter in its own state and unmounts when a case is opened, so the filter resets on return. Court Orders must not repeat that. The Case Status table can adopt the same controlled design later; this is recorded as a follow-up, not part of this feature.
- **Alternatives considered**: keeping the table mounted but hidden (rejected: hidden content still reaches some screen readers and complicates focus).

## D7 - Court-number list
- **Decision**: reuse the existing court list; the dropdown shows `number - judge - designation (period)`; the list is the courts of the chosen complex, narrowed by establishment when chosen.
- **Rationale**: the official dropdown shows court number, judge name, designation and judge period. A `period` field is added to the existing court record (fictional value).
- **Alternatives considered**: a separate court list for orders (rejected: duplicates the Cause List data).

## D8 - Captcha
- **Decision**: reuse the demonstration captcha (6 letters/digits without look-alikes, refresh, listen); verify case-insensitively; refresh after every attempt.
- **Rationale**: matches the official flow without any security claim; the official help text gives both 5 and 6 characters, so 6 is a documented assumption.
- **Alternatives considered**: omitting the captcha (rejected: spec FR-008).

## D9 - Sorting and result shape
- **Decision**: one row per order, sorted by order date descending, then case type, year and number; each row carries its case so the case view can open.
- **Rationale**: spec FR-010 requires newest first. The official results layout was not observed, so columns are this prototype's design and are labelled as such.
- **Alternatives considered**: grouping by case (rejected: the spec lists orders as the unit).

## D10 - Cancellation and states
- **Decision**: use one `AbortController` per search; abort on a new search, on switching search type and on reset; states are idle, loading, error, done.
- **Rationale**: spec FR-017; identical to the existing services.

## D11 - Accessibility and testing
- **Decision**: labelled fields with required markers, `aria-invalid` and `role="alert"` messages, `role="tablist"` for search types, `aria-live` for result states; verify with unit tests, render tests for all four search types, and a manual keyboard check recorded in the quickstart.
- **Rationale**: constitution Principle III. No browser test runner or automated accessibility checker is configured; that gap is already recorded in `docs/gap-analysis.md` and is not widened here.
- **Alternatives considered**: adding a browser end-to-end tool (rejected: new dependency, outside this feature).

## D12 - Other Search-menu services
- **Decision**: the Court Orders entry in the Case Status "Other search services" panel becomes an in-app link; Caveat Search, Process Details and Location stay as external links with the exit alert.
- **Rationale**: spec FR-019.
