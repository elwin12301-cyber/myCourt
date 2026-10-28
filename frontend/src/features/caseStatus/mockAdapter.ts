import { DEMO_CASES } from './mockData'
import type { CaseQuery, CaseRecord, CaseSearchAdapter, CourtSelection, StatusFilter } from './types'

export { DEMO_CASES }

/** Searching for this CNR simulates a service outage so the error/retry state can be exercised. */
export const DEMO_ERROR_CNR = 'ERROR00000000000'

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) })
  })

const inCourt = (c: CaseRecord, s: CourtSelection) =>
  c.court.state === s.state && c.court.district === s.district && c.court.complex === s.complex &&
  (!s.establishment || c.court.establishment === s.establishment)

const statusOk = (c: CaseRecord, f: StatusFilter) => f === 'Both' || c.status === f
const has = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.trim().toLowerCase())

export function runQuery(q: CaseQuery, data: CaseRecord[]): CaseRecord[] {
  if (q.mode === 'cnr') return data.filter((c) => c.cnr === q.cnr)
  const here = data.filter((c) => inCourt(c, q.court))
  switch (q.mode) {
    case 'party':
      return here.filter((c) => statusOk(c, q.status) && c.year === q.year && (has(c.petitioner, q.name) || has(c.respondent, q.name)))
    case 'caseNumber':
      return here.filter((c) => c.caseType === q.caseType && c.caseNumber === String(+q.number) && c.year === q.year)
    case 'filingNumber':
      return here.filter((c) => c.caseType === q.caseType && c.filingNumber === String(+q.number) && c.filingYear === q.year)
    case 'advocate': {
      const advocates = (c: CaseRecord) => [c.petitionerAdvocate, c.respondentAdvocate]
      if (q.by === 'barCode') return here.filter((c) => statusOk(c, q.status) && advocates(c).some((a) => a.barCode === q.barCode))
      if (q.by === 'name') return here.filter((c) => statusOk(c, q.status) && advocates(c).some((a) => has(a.name, q.name)))
      return here.filter((c) => c.nextHearing === q.date && advocates(c).some((a) => has(a.name, q.name)))
    }
    case 'fir':
      return here.filter((c) =>
        statusOk(c, q.status) && c.policeStation === q.policeStation &&
        (!q.number || c.firNumber === String(+q.number)) && (!q.year || c.firYear === q.year))
    case 'act':
      return here.filter((c) =>
        c.status === q.status && c.acts.some((a) => a.act === q.actType && (!q.section.trim() || has(a.sections, q.section))))
    case 'caseType':
      return here.filter((c) => c.status === q.status && c.caseType === q.caseType && c.year === q.year)
  }
}

export function createMockAdapter(latencyMs = 600, data: CaseRecord[] = DEMO_CASES): CaseSearchAdapter {
  return {
    isDemo: true,
    async search(q: CaseQuery, signal?: AbortSignal) {
      await delay(latencyMs, signal)
      if (q.mode === 'cnr' && q.cnr === DEMO_ERROR_CNR) throw new Error('Demo service unavailable')
      return runQuery(q, data)
    },
  }
}
