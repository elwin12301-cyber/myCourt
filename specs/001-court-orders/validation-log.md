# Validation log: Court Orders Search

Run on 2026-10-27 against the dev server (`npm run dev`), after all tasks were implemented.

## Automated checks
| Check | Result |
|---|---|
| `npm test` | 128 tests in 11 files, all passing (72 existing + 56 for Court Orders) |
| `npm run build` | type-check and production build succeed |

Court Orders tests: validation (party, case number, court number, date range), matching and ordering, mock adapter and abort, controlled results table, and render checks for all four search types and all six page states.

## Browser check (quickstart scenarios 1-13)
Method: headless Google Chrome driven through the DevTools protocol by `browser-check.mjs`. It typed into the real page, clicked buttons, pressed the Tab key, and emulated a 360 px phone. Result: **23 of 23 checks passed.**

| Scenario | Outcome |
|---|---|
| 1 case-number search | 2 orders listed, newest first (order 2, then order 1) |
| 2 order-type filter | Final Orders on a case with only interim orders gives the empty message |
| 3 party name | 2 characters rejected with a message; "kumar" + 2025 returns the case's 2 orders |
| 4 court number | List shows `12 - Demo Judge A - Principal Sessions Judge (Jan 2024 - present)`; court 12 returns 2 orders; changing the court clears the court number |
| 5 date range | A single-day range returns the order of that day (inclusive) |
| 6 reversed dates | Rejected: "The to date must not be earlier than the from date" |
| 7 wrong captcha | Rejected with a captcha error, no search runs, a new 6-character code is issued |
| 8 empty result | "No matching order in the demonstration data. This does not mean no real order exists." |
| 9 state without demo data | Goa shows "No demonstration data exists for Goa" |
| 10 open and return | View opens the case record with orders; Back keeps the order-type filter (Interim), the sort (Oldest first) and the list |
| 11 demonstration notice | Present; also asserted for idle, loading, error, empty, results and case view by render tests |
| 12 keyboard only | Tab reaches district, complex, establishment, name, year, captcha, refresh, listen and Go; every control has a label; all 10 focused controls showed a focus ring |
| 13 phone width (360 px) | No horizontal page scroll on the idle page or the results page; the table scrolls inside its own box (592 px wide content in a 300 px box) |

Screenshots were reviewed at desktop width and at 360 px.

## Defects found and fixed during validation
1. **Weak keyboard focus ring on form fields (affects every form in the app).** Field styles set `outline: none` with a more specific selector than the app-wide focus ring, leaving only a faint glow. Fixed in `src/styles.css`; all focused controls now show a 3 px outline.
2. **Uneven field heights.** In rows where one field had a hint line, its neighbour stretched taller. Fixed by top-aligning the form grids in `CourtOrders.tsx`, `form.tsx` and `CauseList.tsx`.

## What was not done
- No human tester, real screen reader (for example NVDA or JAWS), real touch device or browser other than Chrome. The keyboard and phone checks are scripted or emulated.
- Contrast ratios were not measured.
- Test T031 (controlled results table) passed on first run because the table was already built in User Story 1, so a failing-first run was not observed for it. All other test groups were run and seen failing before implementation.

## Constitution re-check
| Principle | Evidence |
|---|---|
| I Demonstration data never presented as real | Notice in all six states (render tests); empty-result wording; fictional records; no real identifiers |
| II Advocate review before reliance | Nothing is sent, filed or acted on; results labelled demonstration |
| III Accessible and responsive | Labels, required markers, `role="alert"` errors, tab roles, scripted Tab check, focus ring fix, 360 px check |
| IV Tested, type-safe changes | Strict TypeScript; 56 new tests; build passes |
| V Confidentiality and secure integration | No real data or secrets; adapter boundary documented in `contracts/order-search-adapter.md`; captcha is a labelled demonstration only |
