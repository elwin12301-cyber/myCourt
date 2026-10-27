import { DEMO_CASES } from '../caseStatus/mockData'
import type { CaseRecord, CourtSelection } from '../caseStatus/types'
import { COURT_ROOMS, roomId, roomKey } from '../causeList/courtRooms'
import type { OrderFilter, OrderQuery, OrderResult, OrderSearchAdapter } from './types'

const inCourt = (c: CaseRecord, s: CourtSelection) =>
  c.court.state === s.state && c.court.district === s.district && c.court.complex === s.complex &&
  (!s.establishment || c.court.establishment === s.establishment)

const has = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.trim().toLowerCase())
const kindOk = (kind: string, filter: OrderFilter) => filter === 'Both' || kind === filter

/** Newest order first; ties by case type, year, numeric case number, then order number. */
export function compareResults(a: OrderResult, b: OrderResult): number {
  return (
    b.order.date.localeCompare(a.order.date) ||
    a.record.caseType.localeCompare(b.record.caseType) ||
    a.record.year.localeCompare(b.record.year) ||
    Number(a.record.caseNumber) - Number(b.record.caseNumber) ||
    Number(b.order.number) - Number(a.order.number)
  )
}

function casesFor(q: OrderQuery, data: CaseRecord[]): CaseRecord[] {
  const here = data.filter((c) => inCourt(c, q.court))
  switch (q.mode) {
    case 'party':
      // Petitioner or respondent only; advocate names are never matched (contract).
      return here.filter((c) => c.year === q.year && (has(c.petitioner, q.name) || has(c.respondent, q.name)))
    case 'caseNumber':
      return here.filter((c) => c.caseType === q.caseType && c.caseNumber === String(+q.number) && c.year === q.year)
    case 'courtNumber': {
      const room = COURT_ROOMS.find((r) => roomId(r) === q.roomId)
      if (!room) return []
      return here.filter((c) => c.court.establishment === room.establishment && c.courtNumberAndJudge === roomKey(room))
    }
    case 'orderDate':
      // Cases in the court; the date range is applied to each order below.
      return here
  }
}

const inRange = (date: string, q: OrderQuery) => q.mode !== 'orderDate' || (date >= q.from && date <= q.to)

/** Pure search over the given cases; the mock adapter wraps this with latency and abort handling. */
export function runOrderQuery(q: OrderQuery, data: CaseRecord[] = DEMO_CASES): OrderResult[] {
  return casesFor(q, data)
    .flatMap((record) => record.orders.filter((o) => kindOk(o.kind, q.filter) && inRange(o.date, q)).map((order) => ({ order, record })))
    .sort(compareResults)
}

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) })
  })

export function createMockOrderAdapter(latencyMs = 600, data: CaseRecord[] = DEMO_CASES): OrderSearchAdapter {
  return {
    isDemo: true,
    async search(q, signal) {
      await delay(latencyMs, signal)
      return runOrderQuery(q, data)
    },
  }
}
