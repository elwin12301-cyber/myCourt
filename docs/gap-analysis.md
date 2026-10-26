# Gap analysis

Priorities: P0 critical security/data/breakage · P1 high-impact · P2 important · P3 optional. "Reference" is only what `ecourts-reference-analysis.md` marks as verified. Status: **Fixed**, **Open**, or **Unverified**.

| ID | Area | Current implementation | Reference behaviour | Gap / finding | Evidence | Priority | Status |
|---|---|---|---|---|---|---|---|
| GAP-001 | Case status | None; Cases page was a static 3-row table | CNR search (16 alphanumeric, no hyphen/space) with Search/Reset; other search options exist on a separate page | No case-status search, history or orders workflow | `src/pages/Cases.tsx` (before change); services.ecourts.gov.in/ecourtindia_v6/ | P1 | Fixed (mock data) |
| GAP-002 | Validation | Intake form used bare `required`; no field messages | Required fields marked `*`; CNR format stated | No field-level, accessible validation | `src/pages/Intake.tsx` | P2 | Fixed for Case Status only; Open elsewhere |
| GAP-003 | Accessibility | No skip link, modal lacked dialog role/Escape/labels, no `aria-current`, no focus ring, search input unlabeled | Skip-to-content link and display-adjustment tools | WCAG gaps in shell | `src/App.tsx`, `src/styles.css` | P1 | Fixed (focus trap not done) |
| GAP-004 | Accessibility toolbar | None | Contrast, font size, text spacing, link highlight, big cursor | Missing display tools | ecourts.gov.in/ecourts2.0/ | P2 | Open |
| GAP-005 | Testing | No tests, linter or formatter | n/a | No regression safety net | `package.json` (before) | P1 | Partly fixed: Vitest, 14 tests on new feature; lint Open |
| GAP-006 | Global search | Keyword routing only (`onSearch`) | Site-wide search box | Does not search data | `src/App.tsx` | P2 | Partly fixed: routes CNR/status terms to Case Status |
| GAP-007 | Routing | State-only navigation | Real URLs per service | Back button and deep links broken | `src/App.tsx` (`useState<PageId>`) | P2 | Open |
| GAP-008 | Data labelling | Dashboard and Cases figures are hard-coded, not marked as demo | Distinction between official and non-official data required by brief | Possible to mistake sample data for real | `src/pages/Dashboard.tsx`, `Cases.tsx` | P2 | Open (Case Status labelled) |
| GAP-009 | Security / privacy | No backend, auth or persistence; client data lives only in browser memory | n/a (not observable) | Unsuitable for real client data; any production use needs server-side auth, authorisation and audit | whole repo | P0 for production, n/a for prototype | Open, by design |
| GAP-010 | Cause list, judgments, ePay, eFiling, NJDG, Virtual Court | None | Linked services on home page | Not provided | ecourts.gov.in/ecourts2.0/ | P3 | Open; link-out suggested |
| GAP-011 | Calendar | "Today" hard-coded to day 23 | n/a | Wrong highlight on any other date | `src/pages/Calendar.tsx` | P3 | Open |
| GAP-012 | Case-status field rules | Party-name minimum 3 characters and year range 1950–current are **prototype assumptions** | Not observed | Rules not confirmed against the official service | `validation.ts` | P3 | Unverified |
| GAP-013 | Languages | English only | Home page showed English only | No gap observed | — | — | No action |
