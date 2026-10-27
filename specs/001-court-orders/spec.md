# Feature Specification: Court Orders Search

**Feature Branch**: `001-court-orders` (no git branch created; the spec directory name is independent of any branch)

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "create separate spec" for the Court Orders service, one of the five services in the official District Court Search menu (Court Orders, Cause List, Caveat Search, Process Details, Location), reviewed at https://services.ecourts.gov.in/ecourtindia_v6/?p=courtorder/index on 2026-10-27.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find the orders in a known case (Priority: P1)

An advocate knows which case they need. They choose the court, then either enter the case type, number and year, or enter a party name and year. They also choose whether they want interim orders, final orders or both. They confirm a captcha and get a list of the matching orders with order number, type and date.

**Why this priority**: Looking up the orders of a specific case is the most common reason to use an orders service, and it is a complete, useful slice on its own.

**Independent Test**: Search by case number for a case that exists in the demonstration data and confirm its orders are listed with the right type filter; search for a case that does not exist and confirm a clear empty message.

**Acceptance Scenarios**:

1. **Given** a court is selected and a valid case type, number and year are entered with the captcha solved, **When** the user searches with "Both", **Then** every interim and final order of that case appears, newest first.
2. **Given** a party name of at least 3 characters and a year, **When** the user searches with "Final Orders", **Then** only final orders of cases whose petitioner or respondent matches appear.
3. **Given** a search with no matching case, **When** results return, **Then** the user sees a message that nothing was found in the demonstration data and that this does not mean no order exists.
4. **Given** the user types a wrong captcha, **When** they search, **Then** no search runs, an error is shown beside the captcha, and a new captcha is offered.

---

### User Story 2 - Browse orders by court or by date range (Priority: P2)

An advocate wants everything a particular court passed, or every order passed in a period. They choose the court and then either pick a court number (shown with its judge and designation) or enter a from-date and to-date, choose the order type, confirm the captcha, and see the orders.

**Why this priority**: Useful for monitoring a court or catching up after an absence, but it depends on the same court selection and result list as Story 1.

**Independent Test**: Search a court number that has orders and confirm they are listed; search a date range that contains known orders and one that contains none.

**Acceptance Scenarios**:

1. **Given** a court number is selected, **When** the user searches, **Then** orders from cases heard in that court appear.
2. **Given** a from-date and a to-date, **When** the user searches, **Then** only orders dated within the range (inclusive) appear.
3. **Given** a from-date later than the to-date, **When** the user searches, **Then** a message asks them to correct the dates and no search runs.

---

### User Story 3 - Open the case behind an order (Priority: P3)

From a result the user opens the full case record to see its history and all of its orders, and returns to the result list without losing it.

**Why this priority**: Adds context to a result but is not needed to find an order.

**Independent Test**: Open the case from any result, check that its details and order list are shown, go back, and confirm the list and filters are unchanged.

**Acceptance Scenarios**:

1. **Given** a result row, **When** the user chooses to view the case, **Then** the case record opens with its orders listed by number, type and date.
2. **Given** an order whose document does not exist in the demonstration data, **When** the user looks for its document, **Then** the control is clearly shown as unavailable instead of failing.

---

### User Story 4 - Understand what is demonstration data (Priority: P1)

Every screen makes plain that results are fictional and that the service is not connected to eCourts, so nobody mistakes a demo order for a real one.

**Why this priority**: A believable fake legal record is harmful (project constitution, Principle I), so this is required for the feature to be acceptable at all.

**Independent Test**: Visit the page in each state (idle, loading, results, empty, error, case view) and confirm a demonstration notice is visible.

**Acceptance Scenarios**:

1. **Given** any state of the page, **When** it is displayed, **Then** a notice states the data is fictional and the service is not affiliated with the judiciary.
2. **Given** an empty result, **When** it is displayed, **Then** it says the absence of a result does not mean no real order exists.

---

### Edge Cases

- No state, district or court complex chosen: the search is blocked and each missing field is named.
- A state with no demonstration data is chosen: the page says so and lists no districts, instead of showing an empty, unexplained dropdown.
- Party name shorter than 3 characters, or a year that is not four digits or is in the future: field-level messages.
- Case number that is not numeric, or very long.
- Date range that is a single day, spans many years, or is reversed.
- The user changes the court after choosing a court number: the chosen court number is cleared.
- The user starts a second search while one is running: the earlier one is cancelled.
- The service fails: an error with a retry action, and the entered values are kept.
- A case has no orders: the case view says so.
- Switching between the four search types keeps the court selection but clears results and errors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST offer four ways to search for orders: by party name, by case number, by court number, and by order date range.
- **FR-002**: For all four, the user MUST choose a court by state, district and court complex; choosing an establishment MUST be optional.
- **FR-003**: Every search MUST let the user filter by order type: interim orders, final orders, or both.
- **FR-004**: Party-name search MUST require at least 3 characters of a petitioner or respondent name and a year, and MUST match either side of the case.
- **FR-005**: Case-number search MUST require a case type, a case number and a year.
- **FR-006**: Court-number search MUST require a court chosen from the courts of the selected complex, each shown with court number, judge name, designation and judge period.
- **FR-007**: Order-date search MUST require a from-date and a to-date, MUST reject a from-date later than the to-date, and MUST treat both dates as inclusive.
- **FR-008**: Every search MUST require the user to solve a captcha first; a wrong or empty captcha MUST block the search, show an error, and issue a fresh captcha. A fresh captcha MUST also be issued after each search attempt.
- **FR-009**: The system MUST show an error beside each invalid field, identifying the field and the problem, and MUST announce errors to assistive technology.
- **FR-010**: Results MUST list, per order: case type/number/year, petitioner versus respondent, order number, order type and order date, sorted newest first.
- **FR-011**: The system MUST show distinct loading, empty, error-with-retry and results states.
- **FR-012**: From a result the user MUST be able to open the full case record and return to the unchanged result list.
- **FR-013**: Where an order document does not exist, the system MUST show the document control as unavailable with an explanation.
- **FR-014**: The system MUST display a demonstration-data notice in every state of the page and MUST NOT present a demonstration order as a real one.
- **FR-015**: Searches MUST go through a replaceable data source so that fictional data can later be swapped for an authorised real source without changing the screens; no real court data or unauthorised access is in scope.
- **FR-016**: The four search types, all fields, the captcha (including a way to hear it and refresh it) and the results MUST be usable by keyboard alone and expose labels and required markers to screen readers.
- **FR-017**: A search in progress MUST be cancelled when a new one starts, when the search type changes, or when the form is reset.
- **FR-018**: The page MUST provide a Reset that clears all entries, errors and results.
- **FR-019**: The page MUST link to the other Search-menu services that are not built (Caveat Search, Process Details, Location) as external links with an exit alert, and to the existing Cause List and Case Status demonstrations.

### Key Entities *(include if feature involves data)*

- **Order**: a ruling in a case, with an order number within the case, a type (interim or final), a date, a title, and whether a document exists.
- **Case**: the matter an order belongs to, with case type, number and year, petitioner, respondent, status and court. It already exists in the Case Status feature.
- **Court**: a courtroom within an establishment of a court complex, with a number, judge name, designation and judge period. It already exists in the Cause List feature.
- **Order Search**: the user's chosen search type, court selection, criteria and order-type filter.
- **Captcha**: a demonstration challenge that has no security purpose and exists to match the official flow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user who knows the case type, number, year and court can reach that case's order list in under 60 seconds on the first attempt.
- **SC-002**: 100% of invalid submissions are stopped before any search runs and name every invalid field.
- **SC-003**: For demonstration data, results appear within 2 seconds of submission in at least 95% of searches.
- **SC-004**: All four search types can be completed using only a keyboard.
- **SC-005**: A demonstration notice is present in 100% of the page's states, and 0 screens present demonstration orders as real.
- **SC-006**: When the user returns from a case record, the result list and filters are exactly as they were left.

## Assumptions

- This is a prototype: all orders, cases and judges are fictional and no document files exist. A real data source is out of scope and, when added, must be authorised and server-side (project constitution, Principle V).
- The official page was read as text only, with no browser and nothing submitted. The following official details are verified: the four search types, their required fields, the 3-character minimum for party names, the interim/final/both filter, the captcha controls and the shared State, District, Court Complex and Establishment selectors.
- Not observed and therefore designed independently: the results table columns, validation wording, date format and range limits, the pagination of long lists, the order document viewer, and whether Establishment is required (treated as optional).
- "Year" in party-name search is taken to mean the case year; the official wording was not explained.
- The official help text gives the captcha length as both 5 and 6 characters; the prototype uses 6 letters and digits.
- Demonstration data covers Tamil Nadu, Maharashtra and Delhi only; other states show a "no demonstration data" message.
- The official Search menu also contains Court Orders-adjacent services (Cause List, Caveat Search, Process Details, Location); only Cause List and Case Status exist as demonstrations.
- Existing Case Status and Cause List features, their demo cases, the court list and the captcha are reused rather than duplicated.
