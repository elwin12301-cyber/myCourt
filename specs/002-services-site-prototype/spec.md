# Feature Specification: eCourts Services Site Prototype (District and Taluka Courts)

**Feature Branch**: `002-services-site-prototype` (no git branch created)

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "from the site https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index - take full control of it, and create the complete prototype design. Don't miss anything." The whole District and Taluka Courts services site was reviewed on 2026-10-27 (text only, nothing submitted): Case Status, CNR Number (home), Caveat Search, Process Details, Location, High Courts, Contact Us, About Us and the shared page chrome. Court Orders and Cause List were reviewed earlier (spec `001-court-orders` and the Cause List work).

**Interpretation of "take full control"**: the user wants the prototype to reproduce the whole site completely. It does not mean operating or automating the real site; no live access is attempted and the official CAPTCHA is never bypassed (project constitution, Principle V).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use the services site as one coherent site (Priority: P1)

A user opens "eCourts Services" and lands on a full-page site that looks and navigates like the official services site: a top bar, a branded header, a main menu, a left Search Menu of seven services, breadcrumbs, a footer, and a way back to the myCourt workspace. Every menu entry leads to a working page.

**Why this priority**: the site shell is what turns separate pages into one prototype, and every other story depends on it.

**Independent Test**: open the site, click every main-menu, Search Menu and footer link, and confirm each opens a page that matches its label and shows the current location.

**Acceptance Scenarios**:

1. **Given** the site is open, **When** the user chooses any of the 7 main-menu items or 7 Search Menu items, **Then** the matching page opens (or an external-site alert for external destinations) and the current item is marked.
2. **Given** any inner page, **When** it is shown, **Then** a breadcrumb reads Home > page name and Home returns to the CNR Number page.
3. **Given** a demonstration notice must always be visible, **When** any page is shown, **Then** a notice states the site is an independent, fictional demonstration.

---

### User Story 2 - Search for a case every official way (Priority: P1)

The user can search by CNR number on the home page, and on the Case Status page by Party Name, Case Number, Filing Number, Advocate, FIR Number, Act or Case Type, each with the official fields, required markers, help text, captcha and results. The CNR page and the Case Status page are separate, as on the official site.

**Why this priority**: case lookup is the core purpose of the site. The forms already exist in the workspace; this story places them in the site with the official separation, labels and buttons.

**Independent Test**: CNR search from the home page; each of the seven Case Status searches; Back and Reset behave as described.

**Acceptance Scenarios**:

1. **Given** the CNR Number page, **When** the user enters a valid CNR and captcha and selects Search, **Then** the case record opens; **When** they select Reset, **Then** the form clears.
2. **Given** the Case Status page, **Then** exactly seven search types are offered (no CNR tab) and the submit button is labelled Go.
3. **Given** any search form, **When** the user selects Back, **Then** they return to the previous screen without losing the site context.

---

### User Story 3 - Use the remaining services: Court Orders, Cause List, Caveat Search, Process Details, Location (Priority: P2)

Court Orders and Cause List appear inside the site. Caveat Search lets the user find a caveat by caveator or caveatee name (matching "anywhere" or "starting with"), by case number, by filing number or by caveat number. Process Details lets the user look up a process by process ID and registered e-mail. Location lets the user choose a court and see where it is in a pop-up.

**Why this priority**: they complete the Search Menu but each is used less often than case lookup.

**Independent Test**: run one search per service with demonstration data and confirm results, empty and error states.

**Acceptance Scenarios**:

1. **Given** a caveator name and a court, **When** the user searches with "Starting with", **Then** only caveats whose name begins with the text appear.
2. **Given** a process ID and the e-mail registered for it, **When** the user searches, **Then** the process status appears; **When** the e-mail does not match, **Then** the user sees a not-found message that does not reveal whether the process ID exists.
3. **Given** a court selection on Location, **When** the user asks for the location, **Then** a pop-up shows the demonstration court address and can be closed with the keyboard.

---

### User Story 4 - Site-wide tools: language, accessibility, theme, site search (Priority: P2)

The user can pick a language from the six listed, adjust accessibility options (contrast, highlight links, text size, spacing, line height, hide images, big cursor, reset), change the topbar colour (Light or Dark) and the theme colour (Default, Dark, Eco or Light), dismiss the theme-update notice, and search the site.

**Why this priority**: these are visible on every official page and affect usability, but pages work without them.

**Independent Test**: change each tool and confirm the page reflects it and remembers the choice after reload.

**Acceptance Scenarios**:

1. **Given** a theme colour is chosen, **When** the page is reloaded, **Then** the same theme is applied.
2. **Given** a language other than English is chosen, **When** the page is shown, **Then** the user is told plainly that translation is not available in the prototype and the page stays in English.
3. **Given** the user types in "Search this site", **When** they submit, **Then** matching site pages, services, High Courts and footer pages are listed and open.

---

### User Story 5 - Information pages: High Courts, Contact Us, About Us and the footer links (Priority: P3)

The High Courts page lists the 25 High Courts with their external websites. Contact Us shows the e-Committee e-mail, the note about contacting the High Court coordinator, and the contact table. About Us summarises the project. The 12 footer links each open a page.

**Why this priority**: reference material, not needed to look up a case.

**Independent Test**: open each page and compare its headings and counts with the reviewed official page.

**Acceptance Scenarios**:

1. **Given** the High Courts page, **Then** 25 courts are listed, each opening its external site only after an exit alert.
2. **Given** the Contact Us page, **Then** the table lists the 24 courts that the official services page lists, and a note explains the main portal lists a 25th (Telangana).
3. **Given** the footer, **Then** it shows the 12 useful links, the ownership and hosting statements as stated officially, the YouTube link, six partner links, the official last-updated date and the site version.

---

### Edge Cases

- The user reloads or uses the browser Back button: the page and site context are restored (the official site warns against this; the prototype supports it).
- The user chooses a theme and then enables High Contrast or Invert: the accessibility option wins and the page stays readable.
- A language other than English is chosen, then the user navigates: the choice is remembered and the notice remains.
- Site search returns nothing: a clear message offers the site map.
- The Process ID or caveat number is not found, or the e-mail does not match.
- A state with no demonstration data is chosen on any court-based form.
- A narrow phone screen: the left Search Menu collapses above the content and the main menu wraps.
- The Location pop-up is opened and closed repeatedly, or the page is resized while it is open.
- The user opens the site without using the myCourt workspace first, then returns to it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a full-page "eCourts Services" site that is reachable from the myCourt workspace and has a visible way back to it.
- **FR-002**: Every site page MUST show a top bar (links to e-Committee and the Supreme Court as external links, language selector, accessibility options, site search), a branded header, a theme-update notice that can be dismissed, a main menu, a left Search Menu, a footer, and a demonstration notice.
- **FR-003**: The main menu MUST contain, in this order: Home, e-Committee, Supreme Court, High Courts, District Courts, NJDG, Contact Us. External entries MUST open only after an exit alert.
- **FR-004**: The Search Menu MUST contain, in this order: CNR Number, Case Status, Court Orders, Cause List, Caveat Search, Process Details, Location, and mark the current one.
- **FR-005**: The Home page MUST be the CNR Number search (heading "Search by CNR number", example CNR, Search and Reset buttons, Back, a note to use the Search Menu if the CNR is unknown, and a link to the help).
- **FR-006**: The Case Status page MUST offer exactly the seven official searches (Party Name, Case Number, Filing Number, Advocate, FIR Number, Act, Case Type) with the court selector, captcha, Go and Back buttons, and a "How to" panel with a help-video link where the official page has one.
- **FR-007**: Court Orders and Cause List MUST work inside the site with the same behaviour as in the workspace.
- **FR-008**: Caveat Search MUST offer: match type (Anywhere or Starting with), caveator or caveatee name, subordinate court, case type, case number, filing number, date of decision, year and caveat number, with required markers and a captcha, and MUST show caveats that match.
- **FR-009**: Process Details MUST require a Process ID and an e-mail registered with the court, plus a captcha, offer Search and Reset, and show the note "Email address should be registered with the court."
- **FR-010**: Process Details MUST NOT reveal whether a process ID exists when the e-mail does not match, MUST NOT store or log the e-mail, and MUST NOT write it to the address bar.
- **FR-011**: Location MUST let the user choose State, District, Court Complex and Establishment and MUST show the location in a pop-up that is keyboard-operable and closable with Escape.
- **FR-012**: The High Courts page MUST list the 25 High Courts with their websites and a breadcrumb; Contact Us MUST show the e-Committee e-mail, the coordinator note and the table as on the official services page.
- **FR-013**: The About Us page MUST summarise the project, its goals, Phase I and II, and the portal launch.
- **FR-014**: The footer MUST show the 12 useful links, the ownership and hosting statements, the official last-updated date and site version labelled as official facts, the YouTube link, and six partner links; each useful link MUST open a page.
- **FR-015**: Every court-based form MUST use the cascading State, District, Court Complex and Establishment selector with the official 36-entry state list, and MUST say plainly when a state has no demonstration data.
- **FR-016**: Language: the six languages (English, Hindi, Marathi, Gujarati, Kannada, Tamil) MUST be listed; choosing one other than English MUST tell the user that translation is unavailable and MUST NOT silently mislead.
- **FR-017**: Accessibility options MUST include: High Contrast, Normal Contrast, Highlight Links, Invert, Saturation, text size increase, decrease and normal, Text Spacing, Line Height, Hide Images, Big Cursor and Reset all; choices MUST persist across reloads.
- **FR-018**: A Theme Customizer MUST offer Topbar Color (Light, Dark) and Theme Color (Default, Dark, Eco, Light) and MUST persist the choice; accessibility options MUST take precedence over theme colours.
- **FR-019**: "Search this site" MUST search site pages, services, High Courts and footer pages and open the chosen result.
- **FR-020**: Every search form MUST show errors beside invalid fields, a demonstration captcha with refresh and audio, and distinct loading, empty, error-with-retry and results states.
- **FR-021**: The site MUST be usable by keyboard alone, expose labels and required markers to assistive technology, include the combo-box keyboard tip, and work from phone width to desktop width.
- **FR-022**: All data MUST be fictional, reached through replaceable data sources; the site MUST NOT claim affiliation with the judiciary, MUST NOT reproduce official emblems or logos, and MUST NOT present demonstration results as real.
- **FR-023**: Each page MUST have an address of its own so reload, the browser Back button and sharing a link work.

### Key Entities *(include if feature involves data)*

- **Site Page**: a page of the services site with a slug, a title, a place in the menus and a breadcrumb.
- **Menu Item**: a main-menu, Search-Menu or footer link; internal (a Site Page) or external (a URL).
- **Site Preferences**: the user's language, accessibility options, topbar colour, theme colour and dismissed notice, kept in the browser.
- **Caveat**: caveator, caveatee, caveat number and year, court, subordinate-court case details, decision date and status.
- **Process**: process ID, the e-mail registered for it, the case, the type (for example summons or notice), issue date and status.
- **Court Location**: a court complex and establishment with a fictional address.
- **Case, Order, Court**: already specified in the Case Status, Cause List and Court Orders features.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of main-menu, Search-Menu and footer links open a working page or an exit alert.
- **SC-002**: A user can reach any of the eight Case Status searches, including CNR, from the site home in at most 2 selections.
- **SC-003**: Every reviewed page element (menus, tools, forms, footer items, counts) is present or explicitly listed as not built with a reason in the gap analysis; none is silently dropped.
- **SC-004**: The demonstration notice is present on 100% of site pages and no screen presents demonstration data as real.
- **SC-005**: All site tools (theme, accessibility, language, search) keep the user's choice after a page reload.
- **SC-006**: Every page and every search form can be completed using only a keyboard, and no page scrolls horizontally at 360 px width.
- **SC-007**: A search in demonstration data returns results in under 2 seconds in at least 95% of attempts.

## Assumptions

- The official site was read as text only: no browser, no screenshots, nothing submitted. Layout, colours and exact wording of validation messages were not observed, so the visual design is this prototype's own while following the official structure.
- Verified from the official services site: the shared chrome (menus, tools, notice, theme options, footer), the Case Status and CNR forms, the 25 High Court links with addresses, the Contact table (24 rows), the About text, the Process ID form fields (Process ID, Email Id, captcha, Search, Reset) and the Caveat Search field labels.
- Not observed and therefore designed independently: the layout and grouping of the Caveat Search fields (grouped here into four searches), what the Process Details page shows after a search, what the Location pop-up contains, the results columns of every service, and the purpose of the Select State, District and Go row on the CNR page.
- The Process Details address returned the home page content in the review, so its page layout is Unverified.
- Footer pages other than About and Contact were not read on the services site; their content reuses the main-portal versions already in the project and is labelled as such.
- Translation of the six languages was out of scope here; it was built afterwards in `specs/003-site-translation`.
- The official site's warning "Do not use browser toolbar reload or back button" is shown for fidelity, with a note that this prototype supports reload and Back.
- Store badges for the mobile app are plain labels because the official ones are placeholder links.
- Existing features (Case Status forms, Cause List, Court Orders, portal data, display settings, captcha, court selector) are reused, not duplicated.
- No real eCourts data, no live service calls, and no storage of e-mails or case data beyond the browser's own preference storage for the tool settings.
