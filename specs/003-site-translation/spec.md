# Feature Specification: Translation of the eCourts Services Site

**Feature Branch**: `003-site-translation` (no git branch created)

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Translate everything" (chosen in answer to: translate the five languages, or build another service). The services site prototype (spec `002-services-site-prototype`) lists six languages, English, हिन्दी, मराठी, ગુજરાતી, ಕನ್ನಡ and தமிழ், but only English works. The user chose the larger option: translate all interface text, not only menus and buttons.

**Scope decision**: "everything" means every piece of interface text on the services site: chrome, menus, forms, field labels, hints, help text, validation messages, notices, table headings, the information pages (About, policies, forms list, help videos, newsletters, contact, High Courts) and the footer. It does not include the fictional demonstration records (people, courts, case details), which are data. It does not include the myCourt workspace outside the services site.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use the whole site in my language (Priority: P1)

A user chooses one of the five Indian languages. Every page of the services site then shows its interface in that language, including menus, form labels, hints, errors and results headings, and the choice is remembered.

**Why this priority**: this is what the language selector promises; today it only shows a notice.

**Independent Test**: choose each language, open every page, and confirm no English interface text remains except the allowed exceptions (see Assumptions).

**Acceptance Scenarios**:

1. **Given** a language is chosen, **When** any site page is shown, **Then** its interface text is in that language and the choice persists after reload.
2. **Given** a form is submitted with mistakes, **When** errors appear, **Then** the messages are in the chosen language and still name the field.
3. **Given** English is chosen, **When** the page is shown, **Then** it is identical to today.

---

### User Story 2 - Know that the translation is machine-made (Priority: P1)

Whenever a non-English language is active, a notice (in that language and in English) says the text is machine-translated, has not been reviewed by a native speaker, and that the English text is authoritative. The site must never present the translation as official.

**Why this priority**: the project constitution forbids presenting unverified content as authoritative, and legal wording is sensitive.

**Independent Test**: choose each non-English language and confirm the notice is visible on every page in both languages.

**Acceptance Scenarios**:

1. **Given** a non-English language, **When** any page is shown, **Then** the notice is visible and says English is authoritative.
2. **Given** English, **Then** no notice is shown.

---

### User Story 3 - Dates, states and domain terms read naturally (Priority: P2)

Dates use the language's month names, and the 36 state and union-territory names, case types, act names and High Court names appear in the chosen language, while their stored values stay English so searches still work.

**Why this priority**: improves readability but searches work without it.

**Independent Test**: in each language open a case record and the state list and confirm local names and dates, then search and confirm the same results as in English.

**Acceptance Scenarios**:

1. **Given** a language, **When** a state is chosen in a list, **Then** the list shows local names and the search behaves exactly as in English.
2. **Given** a case record, **Then** dates show local month names.

---

### User Story 4 - Layout still works in every language (Priority: P2)

Longer text in Indian scripts does not break the layout: no horizontal page scroll at 360 px, readable fonts, and all controls still labelled for assistive technology in the chosen language.

**Why this priority**: translation that breaks the layout is unusable.

**Independent Test**: for each language open every page at 360 px and at desktop width.

**Acceptance Scenarios**:

1. **Given** any language and any page, **When** it is shown at 360 px, **Then** the page does not scroll horizontally.
2. **Given** a language, **Then** the page language is declared so screen readers pronounce it correctly.

---

### Edge Cases

- A text has no translation (a future change added English text): the English shows, never a blank, and the automated check fails so it gets fixed.
- A message carries numbers or names (for example a year range): the numbers appear in the translated sentence in the right place.
- A singular and a plural count ("1 result", "5 results").
- The language is changed while a form has errors or results: they update to the new language without losing what the user typed.
- Stored preferences contain an unknown language: English is used.
- Right-to-left scripts are not involved (all five are left-to-right).
- Searching the site in a non-English language matches the English page titles and the translated titles.
- A name or term that should stay in Latin letters (CNR, PDF, NJDG, NIC, e-mail) remains so.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show every interface text of the services site in the chosen language for Hindi, Marathi, Gujarati, Kannada and Tamil, and in English when English is chosen.
- **FR-002**: Translated text MUST cover: top bar and header text, notices, the three menus, breadcrumbs, the footer, accessibility and theme tools, external-site alerts, form headings, labels, options, placeholders, hints and help text, captcha text, buttons, validation messages, loading, empty and error messages, table headings, status words, the information pages and their paragraphs, and the site search.
- **FR-003**: Fictional demonstration records (names, courts, case details, process and caveat data) MUST remain unchanged; the surrounding labels MUST be translated.
- **FR-004**: Stored values (state names, case types, acts, court names) MUST stay English so that searching, filtering and routing behave identically in every language; only the displayed text changes.
- **FR-005**: Messages containing numbers, years or names MUST translate as whole sentences with the values inserted correctly.
- **FR-006**: Dates MUST be shown with the chosen language's month names.
- **FR-007**: Whenever a non-English language is active, a notice in that language and in English MUST state that the text is machine-translated, not reviewed by a native speaker, and that English is authoritative.
- **FR-008**: The chosen language MUST persist across reloads, MUST update the page immediately without losing entered data, and unknown stored values MUST fall back to English.
- **FR-009**: The page language MUST be declared for assistive technology while a language is active.
- **FR-010**: If any text lacks a translation, English MUST be shown instead of blank text, and the automated checks MUST fail until it is translated.
- **FR-011**: Placeholders, abbreviations and technical terms (CNR, PDF, NJDG, NIC, e-mail) MUST keep their Latin form where the official Indian-language sites do.
- **FR-012**: Every translation MUST keep the same placeholders as its English text, MUST NOT be empty, and MUST be written in the correct script for its language, apart from the allowed Latin terms.
- **FR-013**: The site MUST remain usable with no horizontal page scroll at 360 px in every language, and the previous English behaviour, tests and searches MUST be unchanged.
- **FR-014**: The workspace outside the services site MUST be unaffected.
- **FR-015**: The documentation MUST record the glossary used, that no native speaker reviewed the text, and how a reviewer can inspect and correct each language.

### Key Entities *(include if feature involves data)*

- **Language**: a code, its native label (as in the selector), a locale for dates, and a script.
- **Translation entry**: an English source text and one translation per language, possibly containing named placeholders.
- **Glossary**: the agreed translation of key legal and interface terms used for consistency.
- **Site Preferences**: already holds the chosen language.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the interface texts rendered on the 21 site pages, and of the validation messages, have a translation in all five languages (checked automatically).
- **SC-002**: 0 translations are empty, in the wrong script, or lose a placeholder (checked automatically).
- **SC-003**: Changing language updates the whole page in under 1 second and keeps what the user typed.
- **SC-004**: No site page scrolls horizontally at 360 px in any of the six languages.
- **SC-005**: Searches return the same results in every language as in English.
- **SC-006**: The machine-translation notice appears on 100% of site pages in every non-English language and on none in English.

## Assumptions

- No native speaker reviewed any translation. The text was produced by the assistant, so errors are possible. The site says so, and the documentation lists how a reviewer can inspect and correct each language. Legal wording needs professional review before any real use.
- Allowed English or Latin text: the demonstration records, product and organisation abbreviations (CNR, PDF, NJDG, NIC, e-Committee where the official Indian-language sites keep them), file names, e-mail addresses, and URLs.
- Terminology follows common usage on Indian government sites; where the official Indian-language wording is unknown, a plain translation or a transliteration is used. These choices are recorded in the glossary.
- The five languages are written left to right, so no layout mirroring is needed.
- Dates use each language's standard locale formatting for month names; digits stay Western Arabic.
- The workspace pages are shared with the site, so shared components become translatable, but outside the services site the language stays English.
- Voice, spoken captcha and browser speech are not translated.
- The official site's own translations were not read, so this prototype's wording is independent of them.
