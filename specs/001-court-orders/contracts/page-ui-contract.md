# Contract: Court Orders Page (UI)

What a user, tester or assistive technology can rely on. Implementation details are in the plan.

## Entry points
- Sidebar entry "Court orders".
- Case Status page, panel "Other search services on the official site", entry "Court Orders (demo)".
- Top search box: typing a phrase containing "court order" opens this page.
- Hash address `#/courtOrders`.

## Layout, top to bottom
1. Page heading and a Reset button.
2. **Demonstration notice** (always visible, every state; FR-014).
3. Search-type tabs: Party Name, Case Number, Court Number, Order Date.
4. Search form for the active tab (fields below).
5. Result area (state-dependent).
6. Panel of other Search-menu services.

## Fields (all labelled; required fields marked `*` and announced as required)

| Tab | Fields |
|---|---|
| All | State, District, Court Complex (required); Establishment (optional); Order type radios: Interim Orders, Final Orders, Both (default Both); Enter Captcha (required) with Refresh and Listen buttons |
| Party Name | Petitioner/Respondent (3+ chars), Year |
| Case Number | Case Type, Case Number, Year |
| Court Number | Court Number (list shows number, judge, designation, period) |
| Order Date | From Date, To Date |

Primary button: **Go**. Secondary: **Reset**.

## States and what they show

| State | Content | Live region |
|---|---|---|
| idle | Prompt to choose a search type and fill the form | - |
| loading | Skeleton rows, Go disabled | "Loading results" |
| error | Message and **Retry**; entered values kept | polite |
| empty | "No matching order in the demonstration data. This does not mean no real order exists." | polite |
| results | Heading with count, order-type and sort controls, table | polite |
| case view | Full case record with orders; **Back to results** | - |

## Results table
Columns (this prototype's design; the official table was not observed): Sr No, Case Type/Case Number/Case Year, Petitioner versus Respondent, Order (number, type), Order date, Order document, View.
- Order document control is disabled with the explanation "No document exists in demonstration data".
- **View** opens the case view; **Back** returns to the same list with the same order-type filter and sort.

## Validation behaviour
- Blocked submissions name each invalid field with a message beside it (`aria-invalid`, `role="alert"`).
- A wrong or empty captcha shows a captcha error and issues a new code; no search runs.
- Changing State or District clears the dependent selections below it, and clears a chosen court number.

## Accessibility
- Every control reachable and operable by keyboard; tabs use `role="tablist"`/`tab`/`tabpanel`.
- Visible focus indicator; no information carried by colour alone.
- Layout usable at phone width (table scrolls inside its own container).

## Not in this contract
Order documents, official table layout, and any real eCourts data.
