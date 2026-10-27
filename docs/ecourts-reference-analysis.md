# eCourts reference analysis

**Scope and honesty note.** Only two public pages were fetched on 2026-10-26: `https://ecourts.gov.in/ecourts2.0/` and `https://services.ecourts.gov.in/ecourtindia_v6/`. Page text was read through an automated fetch/summary tool, not a browser, so layout, screenshots, JavaScript behaviour and mobile rendering were **not observed**. Nothing below was tested against live case data. No CAPTCHA, login or access control was bypassed, and no screenshots were taken.

## Verified from the portal home page (`ecourts.gov.in/ecourts2.0/`)
| Item | Observation |
|---|---|
| Top navigation | Home, About, e-Committee, NJDG, Supreme Court, High Courts, District Courts, Contact Us |
| Service links | High Court Services (`hcservices.ecourts.gov.in`), District Court Services (`services.ecourts.gov.in`), Virtual Court (`vcourts.gov.in`), ePay (`pay.ecourts.gov.in`), eFiling (`filing.ecourts.gov.in`), Judgment Search (`judgments.ecourts.gov.in`), High Court NJDG, District Court NJDG, Justice Clock |
| Home search | Only a site-wide "Search this site" box. **No** case-status, CNR or cause-list form on the home page |
| CNR by SMS | Instruction: SMS `ECOURTS <CNR>` to 9766899899 |
| Accessibility | Skip-to-content link; contrast, font size, link highlight, text spacing, line height, big cursor, hide images, reset; Accessibility Statement and Screen Reader Access pages |
| Language | Only English offered on this page |
| Help | Help Videos, Manuals, Brochures; the Help dialog contained placeholder text |
| Login | "Login with JanParichay" button |

## Verified from the services landing page (`services.ecourts.gov.in/ecourtindia_v6/`)
| Item | Observation |
|---|---|
| CNR search | One CNR field; help text: "16 digit alphanumeric CNR Number without any hyphen or space"; example `MHAU019999992015` |
| Required fields | Marked with `*`; CAPTCHA required (image, audio, refresh) |
| Buttons | Search, Reset |
| Location pickers | Header has Select State / Select District / Go. Not verified whether they feed case-status search |
| Other search options | Text says "case registration number, party name, advocate name etc." exist on a separate Case Status page |

## Unverified (could not be observed)
Case Status page tabs and fields (FIR, filing number, act, case type), validation messages, court-complex selector, result and history layout, cause list, orders/judgment search flow, ePay/eFiling/Virtual Court workflows, error/empty/loading states, mobile behaviour, NJDG content. These are labelled **Unverified** wherever used in other documents.

## Feature inventory (relevance to myCourt)
| Feature | Intended user | Relevance | Status in prototype |
|---|---|---|---|
| CNR / case-number / party case status | Litigant, advocate | High — advocates track matters | **Implemented against mock data** |
| Case history and next hearing | Advocate | High | Implemented (mock) |
| Orders list | Advocate | High | Listed (mock, no documents) |
| Cause list | Advocate | Medium | Not implemented; link-out recommended |
| Judgment search | Advocate | Medium | Out of scope; overlaps RAG Research |
| eFiling, ePay, Virtual Court, NJDG | Advocate/litigant | Low–medium | Not implemented; external services |
| Accessibility toolbar | All | Medium | Partly: skip link, focus ring, ARIA; no toolbar |

## Second review pass (2026-10-26) — full home page and linked internal pages
Method unchanged: text read through a fetch tool, no browser, no screenshots, nothing tested live.

**Verified — Home page.** Language dropdown (English only on the home page; the District Courts page listed English, हिन्दी, मराठी, ಕನ್ನಡ, தமிழ்), skip link, full accessibility toolbar (high/normal contrast, highlight links, invert, saturation, A+/A−/normal, text spacing, line height, hide images, big cursor, reset), site search box, six-slide carousel with previous/next/pause, "Login with JanParichay", eight court statistics counters, 12 linked service cards plus 3 unlinked (NSTEP, LeGRAA, Digital Court), four downloadable reference reports with sizes, mobile app section and the SMS service (`ECOURTS <CNR>` to 9766899899), 15 Useful Links, an external-site alert (Go/Cancel), disclaimer, footer (content owned by eCommittee; hosted by NIC; version 2.0; last updated 11 April 2026).

**Verified — About.** Project origin and funding, four goals, Phase I (from 2007, extended to 30 March 2015) and Phase II (approved 8 Jan 2014, sanctioned 4 Aug 2015), portal launch on 7 August 2013, disclaimer that content is not legal evidence.

**Verified — High Courts.** 25 courts listed by name only (no URLs visible).

**Verified — District Courts.** "Total 36 States and Union Territories" and "743 District Courts & Special Courts / Tribunals", but the link list contains **37** entries. Link pattern `?p=dist_court/<code>`.

**Verified — Contact Us.** One general e-mail and 25 High Court CPC e-mails with jurisdictions (anti-spam `[at]`/`[dot]` form). No postal address, phone number, named person, or form.

**Verified — Forms for Advocates.** 24 PDFs with sizes.

**Unverified.** Knowledge Management page, site map, Help Videos, Manuals, Brochures, Newsletter, policy pages, app store links, whether counters update live, and everything behind the linked services (case status, cause lists, ePay, eFiling, Virtual Court, NJDG, Justice Clock). Two guessed internal addresses (`?p=knowledge_management`, `?p=sitemap`) returned HTTP 400, so they are not treated as real.

## Third review pass (2026-10-27) — menus, Useful Links and footer
Addresses were read from the official home page source; each Useful Links page was then read (text only, no browser). **Correction:** two internal addresses guessed earlier were wrong; the real ones are `?p=about_us/knowledge_mgmt` and `/view/sitemap.php`.

| Item | Verified content |
|---|---|
| Main menu (8) | Home, About, e-Committee (ecommitteesci.gov.in), NJDG (njdg.ecourts.gov.in), Supreme Court (sci.gov.in), High Courts, District Courts, Contact Us |
| Help Videos | 15 titles, no video addresses or languages |
| Manuals | 9 PDFs under `static/manuals/`; no language or size shown |
| Brochures | 3 PDFs (ePay, NSTEP, eCourts Project) |
| Knowledge Management | Hub page linking Help Videos, User Manuals, Brochures; no files |
| Newsletter | 9 monthly eCommittee issues, March–December 2016, full PDF addresses, no sizes |
| Web Information Manager | Role, department and an e-mail in anti-spam form (an individual is also named; not reproduced here) |
| Disclaimer, Privacy, Terms, Copyright, Hyperlinking | Read and summarised (paraphrase) |
| Accessibility Statement | Targets WCAG 2.0 level AAA; PDFs not yet accessible; 12 listed features |
| Screen Reader Access | Table of 5 screen readers (NVDA, System Access To Go, Hal, JAWS, Supernova) |
| Footer | Content owner, NIC hosting, version 2.0, last updated 11 April 2026, six partner links, YouTube channel |
| References | 4 PDFs under `static/docs/` |
| App badges | Not links on the official page |
| **Site map** | Returned HTTP 500 when read — **Unverified** |
| Change Password dialog | Hidden login-only dialog; not replicated |

## Fourth review pass (2026-10-27) — District Court Case Status page
Source: `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index` (text read through a fetch tool; no browser, no screenshots, nothing submitted).

| Item | Verified content |
|---|---|
| Search menu (sidebar) | CNR Number, Case Status, Court Orders, Cause List, Caveat Search, Process Details, Location |
| Case Status search types (7) | Party Name, Case Number, Filing Number, Advocate, FIR Number, Act, Case Type |
| Court selection | State (36 entries; Dadra/Daman merged as "The Dadra And Nagar Haveli And Daman And Diu"), District, Court Complex, Establishment. No "Court Name" field |
| Party Name | *Petitioner/Respondent (min 3 characters), *Registration Year, Pending / Disposed / Both |
| Case Number | *Case Type, *Case Number, *Year |
| Filing Number | *Case Type, *Filing Number, *Year (filing year) |
| Advocate | Radio: Advocate Name, Bar Code, Date Case List. *Advocate (min 3 characters), *Advocate Bar Code (example MAH/XXXX/1982), Pending/Disposed/Both, *Case List Date |
| FIR Number | *Police Station, FIR Number and Year (not marked required), Pending/Disposed/Both |
| Act | Search Act (min 3 characters), *Act Type, Under Section (optional; blank lists all), Pending/Disposed only |
| Case Type | *Case Type, *Year, Pending/Disposed only |
| All forms | CAPTCHA (image, audio, refresh), "Go" button, "Back" button, help text, "How to" help-video link, "Fields marked with * are required" |
| Other | Six languages (English, हिन्दी, मराठी, ગુજરાતી, ಕನ್ನಡ, தமிழ்), accessibility tools, theme customizer, 12 footer links, version 1.0, last updated 2 January 2026 |
| Page inconsistency | Help text gives CAPTCHA length as 5 and as 6 characters in different places |

**Not observed (Unverified):** the CAPTCHA image, dropdown option lists (districts, complexes, establishments, case types, police stations, acts), validation messages, results table columns, case-history layout (only empty headings "History", "IA Business", "PDF Viewer" and "Acknowledgement" were visible), and behaviour after Go or View.

## Fifth review pass (2026-10-27) — District Court Cause List page
Source: `https://services.ecourts.gov.in/ecourtindia_v6/?p=cause_list/index` (text read through a fetch tool; no browser, nothing submitted).

| Item | Verified content |
|---|---|
| Court selection | Select State, Select District, Select Court Complex, Select Establishment (cascading; the role of Establishment is not explained) |
| Required fields | *Court Name (dropdown "Select court"; each entry shows court number, judge name and designation), *Cause List Date (calendar control), *Enter Captcha |
| CAPTCHA | Image, "Play CAPTCHA Audio", "Refresh Image"; help text says 5 digits in one place and 6 alphanumeric characters in another |
| Actions | **Civil** and **Criminal** buttons, each showing that list for the chosen court and date. No Reset, Search, Print or PDF control visible |
| Notes | Disclaimer: "Cause list displayed may differ from the actual cause list. For further queries, contact court administrator." Step-by-step help and a help-video link |

**Not observed (Unverified):** results table columns, case details in a list, date format and range limits, validation messages, the PDF viewer content (heading only), and the function of Establishment.

## Sixth review pass (2026-10-27) — District Court Court Orders page
Source: `https://services.ecourts.gov.in/ecourtindia_v6/?p=courtorder/index` (text read through a fetch tool; no browser; nothing submitted).

| Item | Verified content |
|---|---|
| Search types (4) | Party Name, Case Number, Court Number, Order Date. No FIR, advocate or free-text judgment search |
| Court selection | State, District, Court Complex, Establishment, shared above the forms |
| Party Name | *Petitioner/Respondent (min 3 characters; example "Ramesh Narayan Yadav"), *Year; matches petitioner, plaintiff, complainant, respondent, defendant, appellant, accused or extra party |
| Case Number | *Case Type, *Case Number, *Year |
| Court Number | *Court Number; each entry shows court number, judge name, designation and judge period |
| Order Date | *From Date, *To Date (format not shown) |
| All forms | Order type radios: Interim Orders, Final Orders, Both; CAPTCHA (image, audio, refresh, 5 or 6 characters); Go button; "How to" help; help-video links on three forms |
| Results | Help text says results link to the order or judgment PDF ("Order on Exhibit or Copy of Judgement" or "Order No."); the list itself was not visible |

**Not observed (Unverified):** results columns, pagination, PDF viewer, validation messages, date format, and whether Establishment is required.

## Seventh review pass (2026-10-27) — the whole District and Taluka Courts services site
Source: `https://services.ecourts.gov.in/ecourtindia_v6/` (pages `home/index`, `casestatus/index`, `caveat_search/index`, `processDetails/processData`, `location/index`, `high_court/index`, `contact_us/index`, `about_us/index`). Text read through a fetch tool; no browser, no screenshots, nothing submitted.

| Item | Verified content |
|---|---|
| Top bar | Link to the e-Committee and the Supreme Court; "Skip to main content" |
| Language selector | English, हिन्दी, मराठी, ગુજરાતી, ಕನ್ನಡ, தமிழ் (six; the main portal home page showed English only) |
| Accessibility options | High Contrast, Normal Contrast, Highlight Links, Invert Saturation; A+, A-, A, Text Spacing, Line Height; Hide Images, Big Cursor; Reset all settings |
| Branding and search | State emblem with "eCourts Services District and Taluka Courts of India"; "Search this site" box; eCourts and Digital India logos |
| Notice | A theme-update message asking users to clear the browser cache |
| Main menu (7) | Home, e-Committee, Supreme Court, High Courts, District Courts, NJDG, Contact Us |
| Theme Customizer | Topbar Color: Light, Dark. Theme Color: Default, Dark, Eco, Light |
| Search Menu (7) | CNR Number, Case Status, Court Orders, Cause List, Caveat Search, Process Details, Location |
| Other chrome | "Download eCourts Services App" with store badges that are placeholder links; "Do not use browser toolbar reload or back button"; combo-box keyboard tip; footer with 12 Useful Links, ownership and NIC hosting statements, last updated 2 January 2026, version 1.0, YouTube, six partner logos |
| CNR page (home) | "Search by CNR number", example MHAU019999992015, Search and Reset buttons, Back, note "If you dont have CNR Number then use other options from Search Menu section.", help-video link; also a Select State, Select District and Go row whose purpose is not stated |
| Case Status | Seven searches (see the earlier pass); the CNR search is a separate page |
| Caveat Search | Match type Anywhere / Starting with (help text also mentions Soundex); *Caveator/Caveatee Name with Caveator and Caveatee options; Subordinate Court; *Case Type; *Case Number; *Filing Number; Date of Decision; *Year; *Caveat Number and year; captcha; Go. Help: a part of the caveat number plus the year is enough; active caveats are displayed |
| Process Details | "Search By Process ID": *Process ID, *Email Id, captcha, Search, Reset; note "Email address should be registered with the court." |
| Location | State, District, Court Complex, Establishment; note "Location: Refer popup new window to view location." |
| High Courts | Breadcrumb Home > High Courts; 25 courts, each an external link with its address |
| Contact Us | Breadcrumb; e-Committee e-mail; note to contact the High Court coordinator; "Contact Information" table of **24** courts (the main portal lists 25; Telangana is missing here) |
| About Us | Origin (2005 policy), funding, four goals, Phase I and II, portal launch 7 August 2013, key figures |

**Not observed (Unverified):** the visual design (colours, fonts, spacing), how Caveat Search fields are grouped, what Process Details and Location show after a search, results columns of every service, the Process Details page itself (its address returned the home page content), and the services-site versions of the other footer pages (the main-portal versions are reused and labelled).
