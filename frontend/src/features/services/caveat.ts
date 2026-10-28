import { courtErrors, MIN_NAME_LENGTH, yearOk, type FieldErrors } from '../caseStatus/validation'
import type { CourtSelection } from '../caseStatus/types'
import { isIsoDate } from '../courtOrders/validation'

export type NameMatch = 'anywhere' | 'startingWith'
export type CaveatRole = 'caveator' | 'caveatee'

export interface Caveat {
  caveatNumber: string
  year: string
  caveator: string
  caveatee: string
  court: CourtSelection
  subordinateCourt: string
  caseType: string
  caseNumber: string
  caseYear: string
  filingNumber: string
  filingYear: string
  decisionDate: string | null
  status: 'Active' | 'Expired'
}

/**
 * The official page lists these fields without saying how they are grouped, so this prototype
 * groups them into four searches. That grouping is the prototype's own interpretation.
 */
export type CaveatQuery =
  | { mode: 'name'; court: CourtSelection; role: CaveatRole; match: NameMatch; name: string }
  | { mode: 'caseNumber'; court: CourtSelection; subordinateCourt: string; caseType: string; number: string; year: string; decisionDate: string }
  | { mode: 'filingNumber'; court: CourtSelection; subordinateCourt: string; caseType: string; number: string; year: string }
  | { mode: 'caveatNumber'; court: CourtSelection; caveatNumber: string; year: string }

export interface CaveatAdapter {
  readonly isDemo: boolean
  search(query: CaveatQuery, signal?: AbortSignal): Promise<Caveat[]>
}

const court = (state: string, district: string, complex: string, establishment: string): CourtSelection => ({ state, district, complex, establishment })

/** Fictional caveats; every name carries "(demo)". */
export const DEMO_CAVEATS: Caveat[] = [
  {
    caveatNumber: '12', year: '2025', caveator: 'R. Venkat (demo)', caveatee: 'M. Sundar (demo)',
    court: court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex', 'Sessions Court'), subordinateCourt: 'Magistrate Court No. 3 (demo)',
    caseType: 'Criminal Case (CC)', caseNumber: '77', caseYear: '2024', filingNumber: '190', filingYear: '2024', decisionDate: '2025-02-10', status: 'Active',
  },
  {
    caveatNumber: '19', year: '2025', caveator: 'Kumar Brothers (demo)', caveatee: 'L. Pandian (demo)',
    court: court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex', 'Sessions Court'), subordinateCourt: 'Magistrate Court No. 5 (demo)',
    caseType: 'Criminal Case (CC)', caseNumber: '301', caseYear: '2023', filingNumber: '612', filingYear: '2023', decisionDate: '2025-03-02', status: 'Active',
  },
  {
    caveatNumber: '21', year: '2025', caveator: 'S. Kumar (demo)', caveatee: 'T. Anand (demo)',
    court: court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex', 'Additional Sessions Court'), subordinateCourt: 'Magistrate Court No. 3 (demo)',
    caseType: 'Criminal Case (CC)', caseNumber: '18', caseYear: '2025', filingNumber: '44', filingYear: '2025', decisionDate: null, status: 'Active',
  },
  {
    caveatNumber: '3', year: '2026', caveator: 'Mehta Traders (demo)', caveatee: 'Rao Estates (demo)',
    court: court('Tamil Nadu', 'Chennai', 'City Civil Court Complex', 'City Civil Court'), subordinateCourt: 'City Civil Court (demo)',
    caseType: 'Civil Suit (CS)', caseNumber: '55', caseYear: '2025', filingNumber: '410', filingYear: '2025', decisionDate: null, status: 'Active',
  },
  {
    caveatNumber: '45', year: '2024', caveator: 'Aruna Foundation (demo)', caveatee: 'State (demo)',
    court: court('Maharashtra', 'Mumbai', 'City Civil and Sessions Court', 'Sessions Court'), subordinateCourt: 'Sessions Court (demo)',
    caseType: 'Criminal Appeal (CRL.A)', caseNumber: '77', caseYear: '2022', filingNumber: '510', filingYear: '2022', decisionDate: '2024-05-06', status: 'Expired',
  },
  {
    caveatNumber: '8', year: '2026', caveator: 'Kumar (demo)', caveatee: 'Singh (demo)',
    court: court('Delhi', 'New Delhi', 'Patiala House Court Complex', 'Magistrate Courts'), subordinateCourt: 'Magistrate Court No. 21 (demo)',
    caseType: 'Criminal Case (CC)', caseNumber: '905', caseYear: '2023', filingNumber: '2210', filingYear: '2023', decisionDate: null, status: 'Active',
  },
]

export const SUBORDINATE_COURTS = [...new Set(DEMO_CAVEATS.map((c) => c.subordinateCourt))]

/** Returns field errors; an empty object means the query is valid. CAPTCHA is checked separately. */
export function validateCaveatQuery(q: CaveatQuery, now = new Date()): FieldErrors {
  const e: FieldErrors = {}
  const max = now.getFullYear()
  const yearMsg = `Enter a 4-digit year between 1950 and ${max}.`
  courtErrors(q.court, e)
  switch (q.mode) {
    case 'name':
      if (q.name.trim().length < MIN_NAME_LENGTH) e.name = `Enter at least ${MIN_NAME_LENGTH} characters of the name.`
      break
    case 'caseNumber':
    case 'filingNumber':
      if (!q.caseType) e.caseType = 'Select a case type.'
      if (!/^\d{1,7}$/.test(q.number)) e.number = `Enter the ${q.mode === 'filingNumber' ? 'filing' : 'case'} number (1 to 7 digits).`
      if (!yearOk(q.year, max)) e.year = yearMsg
      if (q.mode === 'caseNumber' && q.decisionDate && !isIsoDate(q.decisionDate)) e.decisionDate = 'Enter a valid date of decision.'
      break
    case 'caveatNumber':
      if (!/^\d{1,7}$/.test(q.caveatNumber)) e.caveatNumber = 'Enter the caveat number or part of it (digits only).'
      if (!yearOk(q.year, max)) e.year = yearMsg
      break
  }
  return e
}

const inCourt = (c: Caveat, s: CourtSelection) =>
  c.court.state === s.state && c.court.district === s.district && c.court.complex === s.complex &&
  (!s.establishment || c.court.establishment === s.establishment)

const lower = (s: string) => s.trim().toLowerCase()

/** Only active caveats are shown, as the official help text says. Newest year first, then caveat number. */
export function runCaveatQuery(q: CaveatQuery, data: Caveat[] = DEMO_CAVEATS): Caveat[] {
  const here = data.filter((c) => c.status === 'Active' && inCourt(c, q.court))
  let rows: Caveat[]
  switch (q.mode) {
    case 'name': {
      const needle = lower(q.name)
      rows = here.filter((c) => {
        const hay = lower(q.role === 'caveator' ? c.caveator : c.caveatee)
        return q.match === 'startingWith' ? hay.startsWith(needle) : hay.includes(needle)
      })
      break
    }
    case 'caseNumber':
      rows = here.filter((c) =>
        c.caseType === q.caseType && c.caseNumber === String(+q.number) && c.caseYear === q.year &&
        (!q.subordinateCourt || c.subordinateCourt === q.subordinateCourt) && (!q.decisionDate || c.decisionDate === q.decisionDate))
      break
    case 'filingNumber':
      rows = here.filter((c) =>
        c.caseType === q.caseType && c.filingNumber === String(+q.number) && c.filingYear === q.year &&
        (!q.subordinateCourt || c.subordinateCourt === q.subordinateCourt))
      break
    case 'caveatNumber':
      // The official help says a part of the caveat number plus the year is enough.
      rows = here.filter((c) => c.caveatNumber.includes(String(+q.caveatNumber)) && c.year === q.year)
      break
  }
  return rows.sort((a, b) => b.year.localeCompare(a.year) || Number(a.caveatNumber) - Number(b.caveatNumber))
}

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) })
  })

export function createMockCaveatAdapter(latencyMs = 600, data: Caveat[] = DEMO_CAVEATS): CaveatAdapter {
  return {
    isDemo: true,
    async search(q, signal) {
      await delay(latencyMs, signal)
      return runCaveatQuery(q, data)
    },
  }
}
