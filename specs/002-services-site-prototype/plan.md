# Implementation Plan: eCourts Services Site Prototype

**Branch**: `002-services-site-prototype` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Scope note**: this plan is intentionally one file. Research decisions, data model, contracts and the validation guide are folded in below instead of separate files, because the feature reuses existing services and adds no new external interface.

## Summary

Add a full-page "eCourts Services" site to the front end, reachable from the sidebar, that reproduces the structure of the official District and Taluka Courts services site: shared chrome (top bar, header, notice, main menu, Search Menu, footer, theme customizer, language and accessibility tools, site search) and every page (CNR home, Case Status, Court Orders, Cause List, Caveat Search, Process Details, Location, High Courts, Contact Us, About Us, footer pages, site search, site map). Existing services are reused with small prop additions; Caveat Search, Process Details and Location are new, each behind a mock adapter.

## Technical Context

**Language/Version**: TypeScript 5.6 strict, React 18 (existing)

**Primary Dependencies**: none new

**Storage**: browser `localStorage` for site preferences only (theme, language, notice dismissed); wrapped in try/catch; nothing else persisted

**Testing**: Vitest unit and `react-dom/server` render tests; the Chrome DevTools-protocol browser check pattern from `specs/001-court-orders/browser-check.mjs`

**Target Platform**: modern browsers, phone to desktop

**Project Type**: single-page front end

**Constraints**: no new dependencies; no real data; no official emblems or logos; no storage or logging of Process Details e-mails; keyboard operable; 360 px width

**Scale/Scope**: about 22 site pages, 3 new mock services, about 10 demo records each

## Constitution Check

| Principle | Gate | Result |
|---|---|---|
| I Demonstration data never presented as real | Notice on every site page; fictional records; no emblems or logos; discrepancies in the source (24 vs 25 courts) stated | PASS |
| II Advocate review before reliance | Nothing is sent or filed; results labelled demonstration | PASS |
| III Accessible and responsive | Skip link, labels, keyboard, focus ring, 360 px, accessibility options take precedence over themes | PASS (verify in browser check) |
| IV Tested, type-safe | Strict TS; unit, render and browser checks; `npm test` and `npm run build` before merge | PASS (planned) |
| V Confidentiality and secure integration | Process e-mail never stored, logged or put in the URL; non-revealing not-found message; adapters documented; no captcha bypass | PASS (FR-010) |

Re-check after design: PASS. No complexity to justify.

## Design decisions (research)

- **D1 Routing**: one new page id `services`; the site's own sub-pages use the address `#/services/<slug>` (for example `#/services/case-status`). The site reads its slug from the address, so reload, Back and sharing work (FR-023). A page id per sub-page was rejected: it would add about 22 ids to the workspace router.
- **D2 Reuse by props, not copies**: `CaseStatusPage` gains `modes`, `submitLabel`, `onBack` and `hideOtherServices`; `CourtOrdersPage` gains `hideOtherServices`. The CNR home is Case Status restricted to `['cnr']` with the label "Search"; the Case Status page is the seven other modes with "Go". Links inside reused pages that call `go('causeList')` are remapped to site slugs by wrapping the site in a context whose `go` knows the site routes.
- **D3 Eyebrow**: `PageHead` reads an eyebrow from a small context so site pages say "eCourts Services" instead of "myCourt workspace".
- **D4 Theme**: a `.svc` root with `theme-*` and `top-*` classes redefines the existing colour variables, so buttons, tabs and links recolour without touching components. Dark gets explicit overrides for cards, fields and tables. Accessibility classes on `<html>` (contrast, invert, grayscale) apply after theme and win.
- **D5 Language**: six options; choosing one other than English shows a persistent notice, the page stays English. Translating is out of scope.
- **D6 Accessibility tools**: reuse the existing display-settings component (all official options exist there), labelled "Accessibility options".
- **D7 Site search**: reuse the portal search engine with an index of site pages, services, High Courts and footer pages; hits carry a site slug or an external URL.
- **D8 Footer pages**: About and Contact use text read on the services site; the other footer pages reuse the main-portal data (policies, newsletters, forms, help videos, web information manager, screen readers) and say so on the page.
- **D9 Caveat Search grouping**: the official field set is ambiguous, so it is grouped into four searches (Caveator/Caveatee name, Case number, Filing number, Caveat number), labelled as this prototype's interpretation.
- **D10 Process Details privacy**: the Process ID and e-mail live only in component state; the not-found message is identical whether the ID or the e-mail is wrong; nothing is written to the URL, storage or console.
- **D11 Location**: the official page only says the location opens in a pop-up; the prototype shows a fictional address and a plain map placeholder (no map service, no tracking).
- **D12 Stub honesty**: Process Details page content after search, Location pop-up content and all results columns are the prototype's own design and are labelled Unverified in the docs.

## Data model (summary)

- `SitePage { slug, title, group: 'search'|'menu'|'footer'|'info', external?: url }` and the three menus as ordered arrays (7 main, 7 search, 12 footer).
- `SitePrefs { language, topbar: 'light'|'dark', theme: 'default'|'dark'|'eco'|'light', noticeDismissed }`.
- `Caveat { caveatNumber, year, caveator, caveatee, court (state, district, complex, establishment), subordinateCourt, caseType, caseNumber, caseYear, filingNumber, filingYear, decisionDate|null, status }`.
- `ProcessRecord { processId, email (fictional, example.invalid), caseRef, type, issuedOn, status, court }`.
- `CourtLocation { court (state, district, complex, establishment), address, pin, note }` (fictional).
- Query validation rules: Caveat name 3+ characters; caveat number 1-7 digits and year; Process ID non-empty and matching a safe pattern, e-mail format valid; captcha always required.

## Project Structure

```text
specs/002-services-site-prototype/   spec.md, plan.md, tasks.md, checklists/, validation-log.md
src/
├── features/services/              NEW  data.ts (menus, tools, links), prefs.ts, caveat.ts, process.ts, location.ts, search.ts + tests
├── components/chrome.ts            NEW  eyebrow context
├── components/ui.tsx               CHANGE  PageHead reads the eyebrow
├── pages/services/                 NEW  ServicesApp.tsx (shell), CaveatSearch.tsx, ProcessDetails.tsx, LocationPage.tsx,
│                                        HighCourts.tsx, ContactUs.tsx, AboutUs.tsx, InfoPages.tsx, SiteSearch.tsx
├── pages/CaseStatus.tsx, CourtOrders.tsx   CHANGE  props (D2)
├── App.tsx, types.ts, router.ts            CHANGE  'services' page, sidebar entry
└── styles.css                              CHANGE  .svc shell, themes
docs/                                       CHANGE  reference analysis, gap analysis, prototype guide
```

**Structure Decision**: a `features/services` module for data and logic and a `pages/services` folder for screens, matching the existing layout.

## Validation guide (quickstart)

`npm test` and `npm run build` must pass. Then run `node specs/002-services-site-prototype/browser-check.mjs <folder>` with `npm run dev` running: it opens every menu, Search Menu and footer link, searches each service, changes the theme and language, reloads to check persistence, and checks keyboard focus and 360 px width. Results go in `validation-log.md`.

## Complexity Tracking

No violations.
