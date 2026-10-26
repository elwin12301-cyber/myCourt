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
