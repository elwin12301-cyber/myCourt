import type { CaseQuery, CaseRecord, CaseSearchAdapter } from './types'

/** Location options for the demo selectors. Not a complete or official list. */
export const LOCATIONS: Record<string, Record<string, string[]>> = {
  'Tamil Nadu': { Chennai: ['Principal Sessions Court Complex', 'City Civil Court Complex'], Madurai: ['District Court Complex'] },
  Maharashtra: { Mumbai: ['City Civil and Sessions Court'], Pune: ['District and Sessions Court'] },
  Delhi: { 'New Delhi': ['Patiala House Court Complex'] },
}

export const CASE_TYPES = ['Criminal Case (CC)', 'Civil Suit (CS)', 'Writ Petition (WP)', 'Criminal Appeal (CRL.A)']

/** Fictional records. Identifiers deliberately use the 99999x pattern and are not real cases. */
export const DEMO_CASES: CaseRecord[] = [
  {
    cnr: 'TNCH019999992025', caseType: 'Criminal Case (CC)', caseNumber: '412', year: '2025',
    petitioner: 'State (demo)', respondent: 'R. Kumar (demo)', advocate: 'A. Kumar (demo)',
    state: 'Tamil Nadu', district: 'Chennai', court: 'Principal Sessions Court Complex',
    status: 'Pending', filingDate: '2025-08-12', registrationDate: '2025-08-14', nextHearing: '2026-10-28', stage: 'Evidence',
    history: [
      { date: '2026-09-02', businessOn: '2026-09-02', purpose: 'Arguments', judge: 'Demo Judge A' },
      { date: '2026-07-15', businessOn: '2026-09-02', purpose: 'Evidence', judge: 'Demo Judge A' },
      { date: '2025-08-20', businessOn: '2025-09-30', purpose: 'First hearing', judge: 'Demo Judge A' },
    ],
    orders: [{ date: '2026-09-02', title: 'Interim order (demo)' }, { date: '2025-08-20', title: 'Order on first hearing (demo)' }],
  },
  {
    cnr: 'TNCH019999992024', caseType: 'Civil Suit (CS)', caseNumber: '118', year: '2024',
    petitioner: 'Mehta (demo)', respondent: 'Rao (demo)', advocate: 'S. Iyer (demo)',
    state: 'Tamil Nadu', district: 'Chennai', court: 'City Civil Court Complex',
    status: 'Pending', filingDate: '2024-03-04', registrationDate: '2024-03-06', nextHearing: '2026-10-30', stage: 'Written statement',
    history: [{ date: '2026-08-10', businessOn: '2026-10-30', purpose: 'Written statement', judge: 'Demo Judge B' }],
    orders: [{ date: '2026-08-10', title: 'Order granting time (demo)' }],
  },
  {
    cnr: 'MHMU019999992022', caseType: 'Criminal Appeal (CRL.A)', caseNumber: '77', year: '2022',
    petitioner: 'Aruna Foundation (demo)', respondent: 'State (demo)', advocate: 'P. Desai (demo)',
    state: 'Maharashtra', district: 'Mumbai', court: 'City Civil and Sessions Court',
    status: 'Disposed', filingDate: '2022-01-19', registrationDate: '2022-01-21', nextHearing: null, stage: 'Judgment pronounced',
    history: [{ date: '2024-05-06', businessOn: '2024-05-06', purpose: 'Judgment', judge: 'Demo Judge C' }],
    orders: [{ date: '2024-05-06', title: 'Final judgment (demo)' }],
  },
]

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) })
  })

/** Searching for this CNR simulates a service outage so the error/retry state can be exercised. */
export const DEMO_ERROR_CNR = 'ERROR00000000000'

export function createMockAdapter(latencyMs = 600, data: CaseRecord[] = DEMO_CASES): CaseSearchAdapter {
  return {
    isDemo: true,
    async search(q: CaseQuery, signal?: AbortSignal) {
      await delay(latencyMs, signal)
      if (q.mode === 'cnr') {
        if (q.cnr === DEMO_ERROR_CNR) throw new Error('Demo service unavailable')
        return data.filter((c) => c.cnr === q.cnr)
      }
      const inPlace = (c: CaseRecord) => c.state === q.state && c.district === q.district && c.court === q.court
      if (q.mode === 'caseNumber') {
        return data.filter((c) => inPlace(c) && c.caseType === q.caseType && c.caseNumber === String(+q.number) && c.year === q.year)
      }
      const needle = q.name.trim().toLowerCase()
      return data.filter((c) =>
        inPlace(c) &&
        (`${c.petitioner} ${c.respondent} ${c.advocate}`.toLowerCase().includes(needle)) &&
        (!q.year || c.year === q.year) &&
        (q.status === 'Both' || c.status === q.status))
    },
  }
}
