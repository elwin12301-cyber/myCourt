# Evidence: Case Status parity with the official eCourts page

**Official page compared:** <https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index>
**Checked:** 2026-10-29 · **Result:** 35 of 35 automated parity checks pass in real Chrome · **Reproduce:** see section 6

> myCourt is an independent prototype. It reproduces the structure of the official page with fictional data. It is not the official service and is not affiliated with the judiciary.

## 1. How this evidence was produced (and its limits)

1. The live official page was read three times (text of the public page only). Its lists are embedded, word for word, in `specs/006-casestatus-parity/browser-check.mjs` (the `OFFICIAL` object).
2. That script drives our Services-site Case Status page in headless Chrome and asserts every item. It writes `docs/evidence/casestatus/casestatus-parity-results.json` and screenshots of each search tab, the results list and the case history.
3. Older checks and unit tests cover the behaviour in more depth (section 5).

**What could not be verified, and why**

- The official **results table and case-history layout**: they appear only after solving the official CAPTCHA. The CAPTCHA was not bypassed, so those screens were never seen. Ours are our own design (row 41).
- The **content of the help videos** and the footer headings **PDF Viewer** and **Acknowledgement** (the page shows empty headings).
- Whether every **external link** is reachable (we link to the official addresses; reachability is not tested).
- A screenshot of the official page could not be captured automatically (it did not render in headless Chrome), so the comparison is text-based, not pixel-based.

## 2. Page chrome

| # | Official feature | Our implementation | Evidence | Status |
|---|---|---|---|---|
| A01 | Top bar links: "इ-कमिटी, उच्चतम न्यायालय, भारत" and "E-COMMITTEE, SUPREME COURT OF INDIA" (external, with exit alert) | `ServicesApp.tsx`, `TOP_LINKS` in `features/services/data.ts` | parity A01 | ✅ (Hindi link added in this review) |
| A02 | "Skip to main content" | `ServicesApp.tsx` | parity A02 | ✅ |
| A03 | Language list: English, हिन्दी, मराठी, ગુજરાતી, ಕನ್ನಡ, தமிழ் | `SVC_LANGUAGES`; whole site translated (spec 003) | parity A03; 211 render tests in `i18n/render.test.tsx` | ✅ (translations unreviewed, labelled as machine translation) |
| A04 | Header: "जिला न्यायालय सेवाएं", "eCourts Services", "District and Taluka Courts of India" | `ServicesApp.tsx` | parity A04 | ✅ (Hindi line added) |
| A05 | "Search this site" field and Search button | `SiteSearch.tsx`, `features/services/search.ts` | parity A05; `search.test.ts` (10 tests); `002` check J9 | ✅ |
| A06 | Main menu: Home, e-Committee, Supreme Court, High Courts, District Courts, NJDG, Contact Us | `MAIN_MENU` | parity A06; `002` A1 | ✅ |
| A07 | Search Menu: CNR Number, Case Status, Court Orders, Cause List, Caveat Search, Process Details, Location | `SEARCH_MENU` | parity A07; `002` A2 | ✅ |
| A08 | Notice: "We have updated the district court services website theme. Please clear your browser cache and refresh the page to view the updated theme properly." (dismissible) | `NOTICE_TEXT` | parity A08 | ✅ (wording matched exactly in this review) |
| A09 | Theme Customizer: Topbar Color (Light, Dark), Theme Color (Default, Dark, Eco, Light) | `ThemePanel` in `ServicesApp.tsx`; `features/services/prefs.ts` | parity A09; `prefs.test.ts`; `002` J1–J4 | ✅ (visible heading added in this review) |
| A10 | Accessibility Tools: Color Contrast (High Contrast, Normal Contrast, Highlight Links, Invert Saturation), Text Size (A+, A−, A, Text Spacing, Line Height), Others (Hide Images, Big Cursor), Reset all settings | `DisplaySettings.tsx` | parity A10, A11 | ✅ (labels and groups matched in this review; extras kept: Grayscale, Low saturation) |
| A11 | Those controls work and persist | `DisplaySettings.tsx`, `styles.css` | parity A11; `002` J5, J8 | ✅ |
| A12 | Footer Useful Links (12, in order) | `ServicesApp.tsx` footer, `FOOTER_LINKS` | parity A12; `002` D1 (every footer link opens a page) | ✅ |
| A13 | Footer statements: content owner, NIC hosting, Last Updated 2 January 2026, Version 1.0, Follow Us (YouTube) | `SITE_FACTS` | parity A13 | ✅ |
| A14 | Six partner logos/links, in order | `ServicesApp.tsx` | parity A14 | ✅ (links, not the official logos: see 4) |
| A15 | Combo-box keyboard tip (Enter, then Alt+Down Arrow) | `ServicesApp.tsx` | parity A15 | ✅ |
| A16 | External site alert with Go and Cancel | `ExternalLink.tsx` | parity A16; `002` C3 | ✅ |

## 3. Case Status searches

Common to every search: State, District, Court Complex, Establishment (cascading), CAPTCHA, required-field note, help text, "Click here to view help video", **Go**, **Back**.

| # | Official feature | Our implementation | Evidence | Status |
|---|---|---|---|---|
| B00 | State list: the 36 entries, in the official order | `CASE_STATES` in `features/caseStatus/referenceData.ts` | parity B00 | ✅ (explicit official order set in this review) |
| B01 | Placeholders: Select state / district / court complex / establishment | `CourtPicker` in `pages/caseStatus/form.tsx` | parity B01 | ✅ |
| B02 | Choosing a state enables the district list (cascade); says plainly when a state has no demonstration data | `CourtPicker` | parity B02; `caseStatus.test.ts` | ✅ (data only for Tamil Nadu, Maharashtra and Delhi: fictional) |
| B03 | Seven tabs: Party Name, Case Number, Filing Number, Advocate, FIR Number, Act, Case Type | `MODES` in `referenceData.ts`; `pages/CaseStatus.tsx` | parity B03 | ✅ |
| B04 | **Party Name**: heading "Case Status : Search by Petitioner/Respondent"; \*Petitioner/Respondent (min 3 characters), \*Registration Year; Pending, Disposed, Both | `form.tsx` `mode === 'party'` | parity B04; `validation.test` (name rules); `002` | ✅ |
| B05 | **Case Number**: \*Case Type ("Select case type"), \*Case Number, \*Year; View shows case history; help-video link | `form.tsx` | parity B05, C04 | ✅ (help-video link added in this review; like the official page it uses the Party Name video code) |
| B06 | **Filing Number**: \*Case Type, \*Filing Number, \*Year | `form.tsx` | parity B06 | ✅ (field renamed "Year" in this review) |
| B07 | **Advocate**: options Advocate Name, Bar Code, Date Case List; \*Advocate (min 3), \*Advocate Bar Code (MAH/XXXX/1982), \*Case List Date with a date picker; Pending, Disposed, Both | `form.tsx` `mode === 'advocate'`; `validation.ts` bar-code rule | parity B07, C06, C07; `caseStatus.test.ts` | ✅ (option renamed "Date Case List" in this review) |
| B08 | **FIR Number**: \*Police Station ("Select police station"), FIR Number and Year (both optional, as on the official page); Pending, Disposed, Both | `form.tsx` `mode === 'fir'` | parity B08 | ✅ |
| B09 | **Act**: Search Act, \*Act Type ("Select Act Type"), Under Section; Pending, Disposed (no Both); the list fills only after Search Act has 3+ characters and Search is pressed | `ActSearch` in `form.tsx` | parity B09, C08; `render.test.tsx` | ✅ (Search button added in an earlier pass) |
| B10 | **Case Type**: \*Case Type, \*Year; Pending, Disposed (no Both) | `form.tsx` | parity B10 | ✅ |
| B11 | Heading format "Case Status : Search by …" for every mode | `pages/CaseStatus.tsx` | parity B04–B10 | ✅ (prefix added in this review) |
| B12 | Search by **CNR Number** (Search Menu entry; its own page) | `CnrHome.tsx`; 16 letters or digits, no hyphen or space | `002` E1, E2; `caseStatus.test.ts` | ✅ |

## 4. Behaviour

| # | Official feature | Our implementation | Evidence | Status |
|---|---|---|---|---|
| C01 | Missing required fields are reported | Inline error beside each field, announced to screen readers | parity C01; `validation` tests | ✅ (different presentation: see 4a) |
| C02 | Party name needs at least 3 characters | `validation.ts` | parity C02 | ✅ |
| C03 | A valid search returns a list of cases | `mockAdapter.ts` and the API (`POST /api/cases/search`) | parity C03; backend `test_services_site.py` | ✅ (fictional records) |
| C04 | View opens the case history: case details, status, acts, FIR, history, IA business, orders | `pages/caseStatus/Detail.tsx` | parity C04; `render.test.tsx` | ✅ |
| C05 | Return to the results list | "Back to results" keeps the search and the status filter | parity C05 | ✅ |
| C06–C08 | Advocate sub-options and the Act search work | `form.tsx` | parity C06, C07, C08 | ✅ |
| — | CAPTCHA with refresh and audio | `Captcha.tsx` (a demonstration CAPTCHA with no security purpose) | `caseStatus.test.ts` (captcha) | ✅ |
| — | Help text and help-video link per search | `MODES[].help`, `videoKey` | parity B04–B10 | ✅ |

### 4a. Differences kept on purpose

| Official | Ours | Why |
|---|---|---|
| Validation errors in an "OK" pop-up | Errors beside each field, announced to assistive technology | Accessibility (constitution III) |
| "Loading..." text | Placeholder bars with a visible "Loading results" line | Same information, calmer design |
| Official emblems and partner logos | Text links and a generic mark | We must not reproduce official emblems or imply affiliation (constitution I) |
| Real court data | Fictional data in a demonstration court hierarchy | We have no authorised source; scraping is not allowed (constitution V) |
| No form **Reset** button seen | A Reset button | Extra convenience |
| Captcha length stated as 5 and as 6, "Bar Code" also called "Bar Registration Number" | One consistent captcha and label | The official text contradicts itself |

## 5. Other evidence in the repository

| Evidence | What it proves | Latest result |
|---|---|---|
| `specs/006-casestatus-parity/browser-check.mjs` | This document's parity checks, in real Chrome | 35 / 35 pass |
| `specs/002-services-site-prototype/browser-check.mjs` | The whole Services site: menus, footer, tools, every service | 60 / 60 pass |
| `specs/001-court-orders/browser-check.mjs` | Court Orders | 23 / 23 pass |
| `frontend/src/features/caseStatus/*.test.ts(x)` | Validation rules, search modes, rendering of every form and the case detail | pass (606 frontend tests in total) |
| `backend/tests/test_services_site.py` | The search API behind the forms | pass (123 backend tests in total) |
| `docs/gap-analysis.md` | Every earlier gap, with status | passes 1–9 plus this review |

## 6. Reproduce

```bash
# frontend in mock mode
cd frontend && npm install && npm run dev -- --port 5174
# in another terminal, from the repository root
node specs/006-casestatus-parity/browser-check.mjs docs/evidence/casestatus
```

Screenshots of our pages, written by the check: `docs/evidence/casestatus/ours-casestatus-*.png` (one per search tab, plus the results list and the case history).

## 7. Changes made during this review

Compared with the previous state, this review found and fixed: the accessibility panel wording and grouping (Normal Contrast, Invert Saturation, Color Contrast / Text Size / Others, "Reset all settings"); the Hindi top-bar link and Hindi header line; the exact notice wording; the visible "Theme Customizer" heading; the "Case Status :" heading prefix; the help-video link on Case Number; the "Year" label on Filing Number; the "Date Case List" option; and the official order of the 36-state list. Each now has a passing parity check.
