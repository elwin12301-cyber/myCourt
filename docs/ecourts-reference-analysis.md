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
