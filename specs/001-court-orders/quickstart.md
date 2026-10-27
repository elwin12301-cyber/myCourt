# Quickstart: Validating Court Orders

A run-and-check guide for the finished feature. It names the scenarios and expected outcomes; the field rules are in [data-model.md](data-model.md) and the screen behaviour in [contracts/page-ui-contract.md](contracts/page-ui-contract.md).

## Prerequisites
- Node.js 18 or newer and npm (see the project README)
- Dependencies installed: `npm install`

## Automated checks
```bash
npm test          # all unit and render tests must pass
npm run build     # type-check and production build must succeed
```
Expected: no failing tests, no type errors.

## Manual scenarios
Start the app with `npm run dev` and open **Court orders** in the sidebar. All data is fictional.

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | Case-number search (Story 1) | Tamil Nadu > Chennai > Principal Sessions Court Complex; Case Number tab; Criminal Case (CC), 412, 2025; order type Both; solve captcha; Go | Orders of that case are listed, newest first, each with number and type |
| 2 | Order-type filter | Repeat scenario 1 with Final Orders | Only final orders (or the empty message if none) |
| 3 | Party-name search | Party Name tab; "kumar", 2025; Both | The case with a matching party appears; a 2-character name is rejected with a message |
| 4 | Court-number search (Story 2) | Court Number tab; choose court 12 | Orders from cases heard in court 12 |
| 5 | Date range | Order Date tab; a range containing 2026-09-02 | Orders dated inside the range, inclusive |
| 6 | Reversed dates | From later than To | Error asks to correct the dates; no search runs |
| 7 | Wrong captcha | Type a wrong code | Captcha error, new code issued, no search |
| 8 | Empty result | Case number that does not exist | Message that this does not mean no real order exists |
| 9 | State without demo data | Choose Goa | Message that no demonstration data exists; no districts offered |
| 10 | Open and return (Story 3) | From any result, View, then Back | Same list, filter and sort as before; document control shown as unavailable |
| 11 | Demo notice (Story 4) | Visit idle, loading, results, empty, error and case view | Notice visible in all |
| 12 | Keyboard only | Complete scenario 1 using Tab, Shift+Tab, Enter, arrow keys | Every step possible; focus always visible |
| 13 | Phone width | Narrow the window to about 360 px | No horizontal page scroll; table scrolls inside its box |

## Done when
- Automated checks pass.
- Scenarios 1-13 behave as expected, recorded in the change description with the date and who ran them.
- `docs/gap-analysis.md` and `docs/ecourts-reference-analysis.md` are updated.
