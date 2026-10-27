---

description: "Task list for the eCourts Services Site Prototype"
---

# Tasks: eCourts Services Site Prototype

**Input**: `/specs/002-services-site-prototype/` (spec.md, plan.md)

**Tests**: INCLUDED (constitution Principle IV). Write each group's tests first and confirm they fail.

**Format**: `[ID] [P?] [Story] Description` with file paths relative to the repository root.

## Phase 1: Setup

- [ ] T001 Run `npm test` and `npm run build`; record the baseline (128 tests, build ok)
- [ ] T002 [P] Create folders `src/features/services/` and `src/pages/services/`

## Phase 2: Foundational

- [ ] T003 [P] Create `src/components/chrome.ts` (eyebrow context, default "myCourt workspace") and make `PageHead` in `src/components/ui.tsx` read it
- [ ] T004 [P] Add page id `'services'` to `src/types.ts` and `src/router.ts`; add `servicesSlugFromHash` and `servicesHash` helpers in `src/router.ts` (D1)
- [ ] T005 [P] Create `src/features/services/data.ts`: 7 main-menu items, 7 Search-Menu items, 12 footer links, 6 languages, theme options, notice text, tips, 25 High Court websites, the 24-row contact table, About text, mobile-app line, site facts
- [ ] T006 [P] Create `src/features/services/prefs.ts`: load, save and apply site preferences (language, topbar, theme, notice) with guarded storage
- [ ] T007 Add props to `src/pages/CaseStatus.tsx` (`modes`, `submitLabel`, `onBack`, `hideOtherServices`) and `hideOtherServices` to `src/pages/CourtOrders.tsx` (D2)
- [ ] T008 Add the `.svc` shell, theme and topbar styles to `src/styles.css` (D4)
- [ ] T009 Create the shell `src/pages/services/ServicesApp.tsx`: top bar, header, notice, main menu, Search Menu, breadcrumb, footer, theme customizer, language selector, accessibility options, site search box, route map, remapped `go`, demonstration notice, back-to-workspace link (depends on T003-T008)
- [ ] T010 Register the page in `src/App.tsx` (import, sidebar entry "eCourts Services", map entry, full-page render without the workspace sidebar) (depends on T004, T009)
- [ ] T011 Run `npm test` and `npm run build`

**Checkpoint**: the site shell opens with the CNR page.

## Phase 3: US1 - One coherent site (P1) MVP

- [ ] T012 [P] [US1] Tests in `src/features/services/data.test.ts`: menu orders and counts, every internal item has a slug, external URLs are https on government hosts, footer has 12 links, 25 High Courts, 24 contact rows, 6 languages
- [ ] T013 [P] [US1] Router tests in `src/features/services/router.test.ts`: slug parsing, unknown slug falls back to CNR, workspace hashes unaffected
- [ ] T014 [P] [US1] Render tests in `src/features/services/shell.test.tsx`: top bar, 7 main-menu items, 7 Search-Menu items, breadcrumb, 12 footer links, notice, demonstration notice
- [ ] T015 [US1] Complete shell behaviour in `ServicesApp.tsx`: current-item marking, breadcrumbs, external-site alerts, Home returns to CNR, 360 px layout (menu collapses above content)

## Phase 4: US2 - Search for a case every official way (P1)

- [ ] T016 [P] [US2] Render tests in `src/features/services/case-pages.test.tsx`: CNR page has only the CNR form with Search and Reset and the "Search Menu" note; Case Status page has exactly 7 tabs and Go; Back present
- [ ] T017 [US2] Wire the CNR home (modes `['cnr']`, label Search, extra note, State/District/Go row) and the Case Status page (7 modes, label Go, Back) in `ServicesApp.tsx`
- [ ] T018 [US2] Add Back button and the combo-box keyboard tip to reused forms where the official page shows them

## Phase 5: US3 - Remaining services (P2)

- [ ] T019 [P] [US3] Tests `src/features/services/caveat.test.ts`: validation per search; Anywhere vs Starting with; case, filing and caveat-number matching; empty list; abort
- [ ] T020 [P] [US3] Tests `src/features/services/process.test.ts`: required fields, e-mail format, match returns the record, wrong e-mail and unknown ID give the same not-found result, nothing in the URL
- [ ] T021 [P] [US3] Tests `src/features/services/location.test.ts`: every demo court has a location; lookup by selection
- [ ] T022 [US3] Implement `src/features/services/caveat.ts` (types, fixtures, validation, matching, mock adapter)
- [ ] T023 [US3] Implement `src/features/services/process.ts` (fixtures, validation, non-revealing lookup, mock adapter)
- [ ] T024 [US3] Implement `src/features/services/location.ts` (fixtures, lookup)
- [ ] T025 [P] [US3] Build `src/pages/services/CaveatSearch.tsx` (four searches, match type, role, subordinate court, captcha, states, results)
- [ ] T026 [P] [US3] Build `src/pages/services/ProcessDetails.tsx` (Process ID, Email Id, captcha, Search, Reset, registered-email note, result and not-found states)
- [ ] T027 [P] [US3] Build `src/pages/services/LocationPage.tsx` (court selector, accessible pop-up closable with Escape, fictional address, map placeholder)
- [ ] T028 [US3] Route Court Orders, Cause List, Caveat Search, Process Details and Location in `ServicesApp.tsx`
- [ ] T029 [US3] Render tests for the three new pages in `src/features/services/service-pages.test.tsx`

## Phase 6: US4 - Site tools (P2)

- [ ] T030 [P] [US4] Tests `src/features/services/prefs.test.ts`: defaults, save and load, bad stored value ignored, storage unavailable, theme classes applied
- [ ] T031 [P] [US4] Tests `src/features/services/search.test.ts`: site search finds services, High Courts, footer pages; ranks titles; empty query
- [ ] T032 [US4] Implement `src/features/services/search.ts` (index of site pages, services, High Courts, footer pages)
- [ ] T033 [US4] Build `src/pages/services/SiteSearch.tsx` and wire the "Search this site" box
- [ ] T034 [US4] Finish the theme customizer, language notice (D5), notice dismissal and persistence in `ServicesApp.tsx`; check accessibility options override themes

## Phase 7: US5 - Information pages (P3)

- [ ] T035 [P] [US5] Build `src/pages/services/HighCourts.tsx` (25 courts, external alerts, breadcrumb)
- [ ] T036 [P] [US5] Build `src/pages/services/ContactUs.tsx` (e-mail, coordinator note, 24-row table, 25th-court note)
- [ ] T037 [P] [US5] Build `src/pages/services/AboutUs.tsx`
- [ ] T038 [US5] Build `src/pages/services/InfoPages.tsx`: Newsletter, Forms for Advocates, Help Videos, Site map, Web Information Manager, Copyright, Hyperlinking, Accessibility Statement, Screen Reader Access, Disclaimer
- [ ] T039 [US5] Render tests `src/features/services/info-pages.test.tsx` for High Courts (25), Contact (24 rows plus note), About and every footer page

## Phase 8: Polish

- [ ] T040 [P] Update `docs/ecourts-reference-analysis.md`, `docs/gap-analysis.md`, `docs/prototype-guide.md` and `README.md`
- [ ] T041 [P] Write `specs/002-services-site-prototype/browser-check.mjs` (all menu links, each service search, theme and language persistence after reload, keyboard focus, 360 px width)
- [ ] T042 Run the browser check and record results in `specs/002-services-site-prototype/validation-log.md`
- [ ] T043 Run `npm test` and `npm run build`
- [ ] T044 Re-check Principles I-V and note it in `validation-log.md`

## Dependencies and order

- Setup, then Foundational (blocks everything). Then US1, US2, US3, US4, US5 in priority order; US3 to US5 each extend `ServicesApp.tsx`, so they are not run in parallel with each other.
- T009 needs T003-T008; T010 needs T004 and T009; T017 needs T007 and T009; T028 needs T025-T027; T034 needs T006 and T009.

## MVP

Setup, Foundational, US1 and US2: the full site shell with the CNR and Case Status pages.

## Notes

- Out of scope: translation of the six languages, real data, official emblems, live calls, map service.
- The Process Details e-mail is never stored, logged or placed in the address.
