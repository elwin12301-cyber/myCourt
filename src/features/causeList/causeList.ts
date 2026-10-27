import { DEMO_CASES } from '../caseStatus/mockData'
import type { CaseRecord, CourtSelection } from '../caseStatus/types'
import type { FieldErrors } from '../caseStatus/validation'
import { COURT_ROOMS, kindOf, roomId, roomKey, roomsFor, type CauseListKind, type CourtRoom } from './courtRooms'

export interface CauseListQuery { court: CourtSelection; roomId: string; date: string; kind: CauseListKind }
export interface CauseListEntry { serial: number; record: CaseRecord }
export interface CauseListResult { room: CourtRoom; date: string; kind: CauseListKind; entries: CauseListEntry[] }

export interface CauseListAdapter {
  readonly isDemo: boolean
  fetch(query: CauseListQuery, signal?: AbortSignal): Promise<CauseListResult>
}

/** Required fields follow the official page: court name and cause list date, plus the court selectors. CAPTCHA is checked separately. */
export function validateCauseList(q: CauseListQuery, rooms: CourtRoom[] = COURT_ROOMS): FieldErrors {
  const e: FieldErrors = {}
  if (!q.court.state) e.state = 'Select a state.'
  if (!q.court.district) e.district = 'Select a district.'
  if (!q.court.complex) e.complex = 'Select a court complex.'
  if (!q.roomId) e.roomId = 'Select a court name.'
  else if (!roomsFor(q.court, rooms).some((r) => roomId(r) === q.roomId)) e.roomId = 'The selected court is not in this court complex.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(q.date) || Number.isNaN(Date.parse(q.date))) e.date = 'Select the cause list date.'
  return e
}

const caseOrder = (a: CaseRecord, b: CaseRecord) =>
  a.caseType.localeCompare(b.caseType) || a.year.localeCompare(b.year) || Number(a.caseNumber) - Number(b.caseNumber)

export function buildCauseList(q: CauseListQuery, rooms: CourtRoom[] = COURT_ROOMS, data: CaseRecord[] = DEMO_CASES): CauseListResult {
  const room = rooms.find((r) => roomId(r) === q.roomId)
  if (!room) throw new Error('Unknown court')
  const records = data
    .filter((c) =>
      c.court.state === room.state && c.court.district === room.district && c.court.complex === room.complex &&
      c.court.establishment === room.establishment && c.courtNumberAndJudge === roomKey(room) &&
      c.nextHearing === q.date && kindOf(c.caseType) === q.kind)
    .sort(caseOrder)
  return { room, date: q.date, kind: q.kind, entries: records.map((record, i) => ({ serial: i + 1, record })) }
}

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) })
  })

/**
 * Integration boundary: a real implementation must read the cause list from an authorised
 * server-side source. The mock only reads the fictional demo cases.
 */
export function createMockCauseListAdapter(latencyMs = 600): CauseListAdapter {
  return {
    isDemo: true,
    async fetch(q, signal) {
      await delay(latencyMs, signal)
      return buildCauseList(q)
    },
  }
}
