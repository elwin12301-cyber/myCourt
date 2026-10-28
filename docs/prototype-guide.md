# Prototype guide — Case Status

## Run
```
npm install
npm run dev      # http://localhost:5173 (Vite picks the next free port if busy)
npm test         # Vitest unit tests
npm run build    # type-check + production build
```

## Where
Sidebar → **Case status** (or Dashboard → *Check case status*; or type `cnr`/`status` in the top search and press Enter).

## Try these (all fictional demo data)
| Search | Input | Expected |
|---|---|---|
| CNR | `TNCH019999992025` | 1 result (pending, next hearing 28 Oct 2026) |
| CNR | `TNCH019999990000` | Empty state |
| CNR | `ERROR00000000000` | Simulated outage with Retry |
| CNR | `abc` | Validation error |
| Case number | Tamil Nadu / Chennai / City Civil Court Complex / Civil Suit (CS) / 118 / 2024 | 1 result |
| Party name | Maharashtra / Mumbai / City Civil and Sessions Court / `aruna` / status Disposed | 1 result |

Open **View details** for case history (timeline) and orders. Order downloads are disabled because no documents exist in demo data. Results can be filtered by status and sorted by next hearing or filing date.

## Design and accessibility notes
Navy primary with a saffron demo banner; labelled fields, `aria-invalid` and `role="alert"` errors, tab roles on the search-type and detail tabs, skip link, visible focus ring, reduced-motion support, keyboard-operable controls. Not yet verified with a screen reader or automated audit.

## Structure
```
src/features/caseStatus/
  types.ts         query/record types and the CaseSearchAdapter interface
  validation.ts    CNR normalisation and per-mode validation
  mockAdapter.ts   fictional records, simulated latency and error
  caseStatus.test.ts
src/pages/CaseStatus.tsx
```

## Limitations
Mock data only; no connection to eCourts; no CAPTCHA (omitted because no live service is called); some validation rules are prototype assumptions (see GAP-012). Not affiliated with the Indian judiciary.

## eCourts portal reference section
Sidebar → **ECOURTS PORTAL (REFERENCE)** (Portal overview, About, High Courts, District Courts, Forms for advocates, Contact, Help & policies, Search portal). Data lives in `src/features/portal/data.ts` and is a snapshot of the public portal dated 2026-10-26; counters may be outdated. Every portal page carries an "independent demonstration" banner. External links go through an "External site alert" (Go/Cancel). Try the **Aa** menu for the accessibility options and "Search portal" for `vakalatnama`, `Madras` or `ePay`.

## Cause List
Sidebar -> **Cause list**. Try: Tamil Nadu > Chennai > Principal Sessions Court Complex > court 12 - Demo Judge A > date 2026-10-28 > **Criminal** (2 matters). Civil example: City Civil Court Complex > court 4 > 2026-10-30 > **Civil** (2 matters). Any other court or date shows an empty-list message. Code: `src/features/causeList/`, `src/pages/CauseList.tsx`. All judges, courts and cases are fictional.

## Court Orders
Sidebar -> **Court orders**. All data is fictional. Examples (solve the on-screen captcha each time):
- **Case Number** tab: Tamil Nadu > Chennai > Principal Sessions Court Complex; Criminal Case (CC), 412, 2025; Both -> 2 orders, newest first.
- **Party Name** tab: same court; "kumar", 2025 -> the same case's orders.
- **Court Number** tab: choose `12 - Demo Judge A - ...` -> orders heard in that court.
- **Order Date** tab: from and to `2025-08-20` -> one order (both dates are included).
- Use **View** to open the case, **Back to results** to return with the same filter and sort.
Specification, plan, tasks and the validation log are in `specs/001-court-orders/`. The browser check can be re-run with `node specs/001-court-orders/browser-check.mjs <output-folder>` while `npm run dev` is running (needs Google Chrome).

## eCourts Services site
Sidebar -> **eCourts Services site** (address `#/services`). It replaces the workspace layout with a full site: top bar, header, theme notice, main menu, Search Menu, footer. Everything is fictional.
- **Home** is the CNR search (try `TNCH019999992025`). **Case Status** has the seven other searches. Court Orders and Cause List work inside the site.
- **Caveat Search:** Tamil Nadu > Chennai > Principal Sessions Court Complex, name "kumar", Anywhere (2 results) or Starting with (1). Caveat number `1`, year `2025` lists three.
- **Process Details:** `PRC-DEMO-0001` with `advocate.one@example.invalid`. A wrong e-mail and an unknown ID show the same message.
- **Location:** choose a court, then View location (pop-up; Escape closes).
- **Tools:** gear icon (theme), Aa (accessibility), language selector (translates the whole site; a notice says the translation is unreviewed), notice Dismiss, Search this site. Choices are remembered.
- Code: `src/features/services/`, `src/pages/services/`. Check it with `node specs/002-services-site-prototype/browser-check.mjs <output-folder>` while `npm run dev` is running (needs Google Chrome).
