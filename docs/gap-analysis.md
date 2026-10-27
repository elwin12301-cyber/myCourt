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

## Status update (second implementation pass)
| ID | Result |
|---|---|
| GAP-004 | **Fixed** — `Aa` display-settings menu: text size, high contrast, wider spacing, link highlight; saved in `localStorage`. Not yet checked against WCAG contrast ratios. |
| GAP-007 | **Fixed** — hash URLs (`#/caseStatus`); back button and deep links work (`src/router.ts`). |
| GAP-008 | **Fixed** — a site-wide "Prototype · demonstration data" bar replaces per-page labelling. |
| GAP-010 | **Partly fixed** — Case Status links out to the verified official services; no cause list, ePay or eFiling features were built. |
| GAP-011 | **Fixed** — calendar uses the current month and date; sample events are marked (demo). |
| Still open | GAP-005b (linter), GAP-009 (backend), modal focus trap, GAP-002 outside Case Status. |

## Third pass — full portal feature coverage
| ID | Reference feature (verified) | Status in myCourt |
|---|---|---|
| GAP-014 | Portal home: carousel, counters, service cards, references, app/SMS, login button | **Implemented** (`PortalHome`); login is a clearly marked non-functional stub; reports are listed but not hosted |
| GAP-015 | About page | **Implemented** (`PortalAbout`) |
| GAP-016 | High Courts list | **Implemented** with filter (`PortalHighCourts`) |
| GAP-017 | District Courts by state/UT | **Implemented** with filter; links to official state pages. Portal states 36, lists 37 — both shown |
| GAP-018 | Forms for Advocates (24 PDFs) | **Implemented** as an index linking to the official files; file addresses derived, not individually tested |
| GAP-019 | Contact Us | **Implemented**; e-mails kept in the portal's obfuscated form |
| GAP-020 | Site search | **Implemented** over this demo's own index (services, courts, forms, pages); does not search case records |
| GAP-021 | Accessibility toolbar (contrast, invert, saturation, text size/spacing/line height, hide images, big cursor, reset) | **Implemented** (`Aa` menu) |
| GAP-022 | External site alert (Go/Cancel) | **Implemented** (`ExternalLink`) |
| GAP-023 | Multi-language selector | **Partly**: selector shown, only English enabled; translations not built |
| GAP-024 | Knowledge Management, site map, help videos, manuals, brochures, policies, newsletter | **Not built**: contents could not be verified; listed by name on the Help page |
| GAP-025 | Live services (case status, cause list, ePay, eFiling, Virtual Court, NJDG, Justice Clock) | **Not replicated**: linked out. Case status has a separate demo |
| GAP-026 | Mobile app | **Not built**; only referenced |

## Fourth pass — menu and Useful Links audit
| ID | Finding | Status |
|---|---|---|
| GAP-027 | Official main menu has 8 items; the sidebar group had 5. Missing: e-Committee, NJDG, Supreme Court (all external) | **Fixed** — sidebar now follows the official order, plus Useful links and Search portal; externals use the exit alert |
| GAP-024 (update) | Useful Links were names only | **Fixed** — all 15 have a page: Site map (own map; official returned 500), Forms, Help Videos, Manuals, Disclaimer, Knowledge Management, Brochures, Web Information Manager, Newsletter, Privacy, Terms, Copyright, Hyperlinking, Accessibility Statement, Screen Reader Access |
| GAP-028 | Footer (owner, NIC hosting, version, last updated, partner links, YouTube) absent | **Fixed** — footer on every portal page |
| GAP-029 | Reference reports listed without links | **Fixed** — link to the official PDFs (addresses untested) |
| GAP-030 | Policy pages are paraphrases, not full text | Open by design; each links to the official page |
| GAP-031 | Help video files, app store links | Not available on the official page |

## Fifth pass — complete Case Status
| ID | Finding | Status |
|---|---|---|
| GAP-032 | Only CNR, case number and party name were built; the official page has 7 search types plus CNR | **Fixed** — all 8: CNR, Party Name, Case Number, Filing Number, Advocate (name, bar code, date case list), FIR Number, Act, Case Type |
| GAP-033 | No State/District/Court Complex/Establishment selector | **Fixed** — cascading selector; 36-entry state list as on the official page; district data exists only for Tamil Nadu, Maharashtra and Delhi (demo) |
| GAP-034 | No CAPTCHA step | **Fixed** — demonstration CAPTCHA (refresh, listen). It has no security purpose and is labelled as such |
| GAP-035 | No per-search help or help videos | **Fixed** — "How to search" panel with the official help text; help-video links for the six types that have them |
| GAP-036 | Case detail was minimal | **Fixed** — case details, status, parties and advocates, acts, FIR, history, IA business, orders |
| GAP-012 (update) | Party-name minimum of 3 characters | **Now verified** against the official help text. Year range, bar-code pattern and optional Establishment remain assumptions |
| GAP-037 | Court Orders, Cause List, Caveat Search, Process Details, Location | **Not rebuilt** — linked to the official site |
| GAP-038 | Results table columns and case-history layout | **Unverified** — not observable; the prototype's layout is its own design |

## Sixth pass — Cause List
| ID | Finding | Status |
|---|---|---|
| GAP-039 | No Cause List service (only a link-out) | **Fixed** — `Cause list` page: State/District/Court Complex/Establishment, required Court Name (number, judge, designation) and date, CAPTCHA, Civil and Criminal buttons, official disclaimer, list with serial numbers and case view |
| GAP-040 | Cause list table columns | **Unverified** — prototype design (Sr No, case, parties, advocates, purpose, View) |
| GAP-041 | Print control | Added beyond the official page (it shows none) |
| GAP-042 | Court rooms, judges and hearings | Fictional demonstration data for 8 courts in Tamil Nadu, Maharashtra and Delhi |
| GAP-037 (update) | Remaining unbuilt Search-menu services | Court Orders, Caveat Search, Process Details, Location (linked out) |

## Seventh pass — Court Orders (spec `001-court-orders`)
| ID | Finding | Status |
|---|---|---|
| GAP-044 | No Court Orders service | **Fixed** — four searches (party name, case number, court number, order date), order-type filter, captcha, results, case view, other-services panel |
| GAP-045 | Orders had no number, type or document flag | **Fixed** — `kind`, `number` and `hasDocument` on every order; case view shows them |
| GAP-046 | Form fields had a faint keyboard focus ring (found by browser check) | **Fixed** — visible 3 px ring on all form fields, app-wide |
| GAP-047 | Uneven field heights in form rows | **Fixed** on Court Orders, Case Status and Cause List forms |
| GAP-048 | Results table filter resets after opening a case (Case Status and Cause List) | **Open** — Court Orders keeps it in the page; the other two tables can adopt the same design |
| GAP-049 | Order documents, official results layout | **Unverified / not built** — no documents in demonstration data |
| GAP-037 (update) | Remaining unbuilt Search-menu services | Caveat Search, Process Details, Location (linked out) |

## Eighth pass — complete services site (spec `002-services-site-prototype`)
| ID | Finding | Status |
|---|---|---|
| GAP-050 | No full-page services site; services were separate workspace pages | **Fixed** — `eCourts Services` site with top bar, header, notice, 7-item main menu, 7-item Search Menu, breadcrumbs, 12-link footer; reload, Back and deep links work (`#/services/<page>`) |
| GAP-051 | CNR search mixed into Case Status | **Fixed** inside the site: CNR is its own Home page (Search, Reset, Back, note, help link); Case Status has exactly 7 searches with Go |
| GAP-052 | No Caveat Search | **Fixed** — four searches, Anywhere / Starting with, caveator or caveatee, subordinate court, date of decision, active caveats only. Field grouping is the prototype's interpretation |
| GAP-053 | No Process Details | **Fixed** — Process ID and registered e-mail; wrong e-mail and unknown ID give the same message; e-mail never stored, logged, put in the address or repeated in the result |
| GAP-054 | No Location | **Fixed** — court selector and an accessible pop-up (Escape closes, focus returns) with a fictional address and a map placeholder |
| GAP-055 | No theme customizer | **Fixed** — Topbar Light/Dark and Theme Default/Dark/Eco/Light, remembered after reload; accessibility options take precedence |
| GAP-056 | Language selector | **Partly**: six languages listed; choosing one shows a notice and the page stays English |
| GAP-057 | No site search | **Fixed** — searches pages, services, 25 High Courts, contact rows, forms, help videos and newsletters |
| GAP-058 | High Courts, Contact Us, About Us, 12 footer pages | **Fixed**. Contact shows the 24 rows the services page lists with a note about the 25th (Telangana); footer pages other than About and Contact reuse main-portal content and say so |
| GAP-059 | Hidden screen-reader text widened pages sideways (found by measuring without phone emulation) | **Fixed** app-wide in `src/styles.css`; it affected wide tables, for example Forms (+156 px at 360 px) |
| GAP-060 | Search Menu strip widened the whole site by about 600 px at 360 px | **Fixed** (grid children may shrink) |
| GAP-061 | Dark theme form labels too dim | **Fixed** |
| GAP-062 | Earlier 360 px checks used phone emulation, which zooms the page out and can hide overflow | **Corrected**: both browser-check scripts now measure without it; both re-run and pass |
| GAP-063 | Translations for the five other languages; real data; official colours and layout; help-video and store links; official results layouts | **Not built / Unverified** |
