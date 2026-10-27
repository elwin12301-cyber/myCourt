# Data Model: Court Orders Search

Entities from the spec, with fields and rules. Types live in `src/features/courtOrders/types.ts` and `src/features/caseStatus/types.ts`.

## Order (extends the existing order entry)

| Field | Meaning | Rule |
|---|---|---|
| `number` | Order number within its case | Text of a positive integer; unique per case; assigned in date order |
| `kind` | `Interim` or `Final` | Required |
| `date` | Date of the order | `YYYY-MM-DD`, not in the future of the demo date set |
| `title` | Short description | Non-empty, ends with "(demo)" in fixtures |
| `hasDocument` | Whether a document file exists | Always `false` in demonstration data; drives the "unavailable" control (FR-013) |

Orders belong to exactly one **Case**; a case may have none.

## Case (existing)

Unchanged apart from carrying the extended orders. Fields used by this feature: `cnr`, `caseType`, `caseNumber`, `year`, `petitioner`, `respondent`, `status`, `court` (state, district, complex, establishment), `courtNumberAndJudge`, `orders`.

## Court (existing court-room record, extended)

| Field | Meaning | Rule |
|---|---|---|
| `state`, `district`, `complex`, `establishment` | Where the court sits | Must exist in the demo location tree |
| `number` | Court number | Unique within an establishment |
| `judge`, `designation` | Presiding judge | Fictional |
| `period` | Judge period (new) | Fictional text, for example "Jan 2024 - present" |

Display label for the Court Number dropdown: `number - judge - designation (period)`.

## Order Search (transient, never stored)

A discriminated union on `mode`:

| `mode` | Required fields | Optional fields |
|---|---|---|
| `party` | court, `name` (3+ characters), `year` | none |
| `caseNumber` | court, `caseType`, `number`, `year` | none |
| `courtNumber` | court, `roomId` | none |
| `orderDate` | court, `from`, `to` | none |

Every mode also carries `filter`: `Interim`, `Final` or `Both` (default `Both`).

Court selection: `state`, `district` and `complex` required; `establishment` optional.

Validation rules (all enforced before any search; each returns a field-keyed message):
- `name`: at least 3 non-blank characters.
- `year`: four digits, 1950 to the current year.
- `number`: 1 to 7 digits.
- `roomId`: must belong to the chosen complex (and establishment, if chosen).
- `from`, `to`: valid `YYYY-MM-DD`; `from` not after `to`; equal dates allowed.

## Order Result (derived)

One row per matching order: `{ order, case }`. Sorted by `order.date` descending, then `case.caseType`, `case.year`, numeric `case.caseNumber`, then `order.number`.

## Captcha (transient)

A 6-character code from an alphabet without look-alike characters, regenerated after every submission attempt. It has no security purpose.

## State transitions (page)

```text
idle --valid submit--> loading --success--> done (results | empty)
                          |--failure--> error --retry--> loading
any --reset--> idle          any --change search type--> idle
done --open case--> done+case view --back--> done (same filter and sort)
```
