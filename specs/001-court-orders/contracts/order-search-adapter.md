# Contract: Order Search Adapter

The boundary between the Court Orders screen and any source of orders. The prototype ships a mock; a real implementation must satisfy the same contract.

## Interface (language-level shape)

```text
OrderSearchAdapter
  isDemo: boolean                       // true for the mock; the screen shows the demo notice when true
  search(query, signal?) -> Promise<OrderResult[]>
```

- `query` is the Order Search union in [data-model.md](../data-model.md).
- `signal` is an abort signal; the adapter MUST reject with an abort error when it fires.
- The adapter returns only orders the caller may see. Authorisation is the adapter's job, not the screen's.

## Behaviour

| Situation | Required behaviour |
|---|---|
| No match | Resolve with an empty list (not an error) |
| `filter` is `Interim` or `Final` | Return only that kind; `Both` returns all |
| `orderDate` range | Inclusive on both ends |
| `party` match | Case-insensitive substring on petitioner or respondent, never on advocates |
| Service failure | Reject with an error (the screen shows retry) |
| Ordering | Newest order first, ties by case then order number |

## Rules for any real implementation (constitution Principle V)

1. Runs server-side; the browser never holds credentials or scraped endpoints.
2. Uses only an authorised data source; it MUST NOT bypass or automate the official CAPTCHA or other access controls.
3. Does not write case identifiers or party names to logs.
4. Enforces per-matter authorisation on the server before returning any order.
5. While `isDemo` is true the demonstration notice stays; it may be removed only when a verified integration exists.

## Mock-only conveniences (not part of the contract)

- Simulated latency of 600 ms.
- Fictional data only; `hasDocument` is always false.
