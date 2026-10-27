# Validation log: eCourts Services Site Prototype

Run on 2026-10-27 against the dev server after all tasks were implemented.

## Automated checks
| Check | Result |
|---|---|
| `npm test` | 234 tests in 21 files, all passing (128 before this feature, 106 new) |
| `npm run build` | type-check and production build succeed |

New tests cover: menu orders and counts, external links, routing, preferences storage (including corrupt and blocked storage), the site shell, Caveat Search validation and matching, Process Details validation and the non-revealing lookup, Location lookup, site search, and render checks for every page.

## Browser check
Method: headless Google Chrome driven through the DevTools protocol by `browser-check.mjs`; it typed, clicked, reloaded, pressed Back and Tab, and measured layout at 360 px without phone emulation. Result: **44 of 44 checks passed.**

| Area | Outcome |
|---|---|
| Shell | Main menu (7), Search Menu (7) and footer (12 links) are in the official order; demonstration notice visible |
| Search Menu | Each of the 7 items opens its page, is marked current and updates the address |
| Main menu | High Courts lists 25 courts; Contact Us shows 24 rows and the 24 vs 25 note; the four external items show Go/Cancel before leaving; Home returns to CNR |
| Footer | All 12 links open matching pages |
| CNR and Case Status | CNR page has only the CNR form (Search, Reset, no tabs) and returns the case; Case Status has exactly 7 tabs, a Go button and no CNR tab; Back leaves the form |
| Court Orders, Cause List | Work inside the site; Court Orders hides its own other-services panel |
| Caveat Search | Anywhere finds 2, Starting with finds 1; caveat number and case number searches find the active caveat |
| Process Details | Match shows the process; the e-mail is not repeated in the result, not in the address and not in browser storage; wrong e-mail and unknown ID give the identical message |
| Location | Pop-up shows a fictional address and map placeholder; focus moves into it; Escape closes it and returns focus to the button |
| Site tools | Eco theme and dark topbar apply and persist after reload; Dark theme darkens the page; Reset restores defaults; High Contrast applies; choosing Hindi shows the translation notice and persists; dismissing the notice persists |
| Site search | "vakalatnama" finds forms and opens Forms for Advocates |
| Addresses | Reload keeps the page (deep link); the browser Back button returns to the previous page |
| Keyboard | First Tab stop is the skip link; Tab reaches the menus, Search Menu and form; all 40 focused controls show a focus indicator; form controls have labels |
| Phone width (360 px) | No horizontal page scroll on 10 pages, and none on the results pages and case record |

Screenshots were reviewed at desktop and 360 px, in the Default and Dark themes.

## Defects found and fixed during validation
1. **Search Menu widened the page by about 600 px at 360 px.** The grid column grew to fit the 7-item strip. Fixed by letting grid children shrink.
2. **Hidden screen-reader text widened pages sideways.** `sr-only` text is absolutely positioned and escaped table scroll boxes (Forms page: +156 px at 360 px). It also affected existing workspace tables. Fixed in `src/styles.css`.
3. **Dark theme form labels were too dim.** Fixed.
4. **Process Details banner overstated privacy** ("never shown again" while the input keeps what you typed). Reworded to "never stored, logged or repeated in the result".
5. **My own check scripts used phone emulation**, which zooms the page out and hid defects 1 and 2 at first. Both scripts (this feature and `001-court-orders`) now measure without it and were re-run; both pass. Whether the Court Orders results page overflowed before fix 2 was not tested.

## What was not done
- No human tester, real screen reader, real touch device or browser other than Chrome.
- Contrast ratios were not measured (including in the Eco and Dark themes).
- Visual design (colours, fonts, spacing) is this prototype's own; the official look was not observed.
- Translations, real data and official results layouts are out of scope (see the gap analysis).

## Constitution re-check
| Principle | Evidence |
|---|---|
| I Demonstration data never presented as real | Notice on every site page; fictional records; no emblems or logos; the 24 vs 25 discrepancy stated |
| II Advocate review before reliance | Nothing is sent or filed; results labelled demonstration |
| III Accessible and responsive | Skip link, labels, focus indicator on all 40 stops, keyboard-closable pop-up, 360 px checks, accessibility options override themes |
| IV Tested, type-safe changes | Strict TypeScript; 106 new tests; browser check; build passes |
| V Confidentiality and secure integration | Process e-mail never stored, logged, put in the address or repeated; non-revealing not-found result; adapters documented; demonstration captcha only |
