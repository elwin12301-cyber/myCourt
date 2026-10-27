import type { CourtSelection } from '../caseStatus/types'

export type CauseListKind = 'Civil' | 'Criminal'

export interface CourtRoom {
  state: string; district: string; complex: string; establishment: string
  number: string; judge: string; designation: string
  /** Fictional judge period, shown in the Court Orders court-number list. */
  period: string
}

/** Fictional judges. The official Court Name list shows court number, judge name and designation. */
export const COURT_ROOMS: CourtRoom[] = [
  { state: 'Tamil Nadu', district: 'Chennai', complex: 'Principal Sessions Court Complex', establishment: 'Sessions Court', number: '12', judge: 'Demo Judge A', designation: 'Principal Sessions Judge', period: 'Jan 2024 - present' },
  { state: 'Tamil Nadu', district: 'Chennai', complex: 'Principal Sessions Court Complex', establishment: 'Additional Sessions Court', number: '15', judge: 'Demo Judge G', designation: 'Additional Sessions Judge', period: 'Jan 2024 - present' },
  { state: 'Tamil Nadu', district: 'Chennai', complex: 'City Civil Court Complex', establishment: 'City Civil Court', number: '4', judge: 'Demo Judge B', designation: 'Additional Judge', period: 'Jan 2024 - present' },
  { state: 'Tamil Nadu', district: 'Madurai', complex: 'District Court Complex', establishment: 'District Court', number: '3', judge: 'Demo Judge E', designation: 'District Judge', period: 'Jan 2024 - present' },
  { state: 'Maharashtra', district: 'Mumbai', complex: 'City Civil and Sessions Court', establishment: 'Sessions Court', number: '7', judge: 'Demo Judge C', designation: 'Sessions Judge', period: 'Jan 2024 - present' },
  { state: 'Maharashtra', district: 'Mumbai', complex: 'City Civil and Sessions Court', establishment: 'Civil Court', number: '2', judge: 'Demo Judge H', designation: 'Civil Judge', period: 'Jan 2024 - present' },
  { state: 'Maharashtra', district: 'Pune', complex: 'District and Sessions Court', establishment: 'Sessions Court', number: '9', judge: 'Demo Judge F', designation: 'Additional Sessions Judge', period: 'Jan 2024 - present' },
  { state: 'Delhi', district: 'New Delhi', complex: 'Patiala House Court Complex', establishment: 'Magistrate Courts', number: '21', judge: 'Demo Judge D', designation: 'Metropolitan Magistrate', period: 'Jan 2024 - present' },
]

export const roomId = (r: CourtRoom) => `${r.state}|${r.district}|${r.complex}|${r.establishment}|${r.number}`
export const roomLabel = (r: CourtRoom) => `${r.number} - ${r.judge} - ${r.designation}`
/** Court Orders court-number list: also shows the judge period. */
export const courtNumberLabel = (r: CourtRoom) => `${r.number} - ${r.judge} - ${r.designation} (${r.period})`
/** Matches the `courtNumberAndJudge` field on demo case records. */
export const roomKey = (r: CourtRoom) => `${r.number} - ${r.judge}`

/** Courts under the chosen complex, narrowed to one establishment when it is chosen. */
export function roomsFor(s: CourtSelection, rooms: CourtRoom[] = COURT_ROOMS): CourtRoom[] {
  return rooms.filter((r) => r.state === s.state && r.district === s.district && r.complex === s.complex && (!s.establishment || r.establishment === s.establishment))
}

export const kindOf = (caseType: string): CauseListKind => (caseType.startsWith('Criminal') ? 'Criminal' : 'Civil')
