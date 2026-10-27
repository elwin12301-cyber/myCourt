export type SearchMode = 'cnr' | 'party' | 'caseNumber' | 'filingNumber' | 'advocate' | 'fir' | 'act' | 'caseType'
export type StatusFilter = 'Pending' | 'Disposed' | 'Both'
export type PendingDisposed = 'Pending' | 'Disposed'
export type AdvocateBy = 'name' | 'barCode' | 'caseListDate'

export interface CourtSelection { state: string; district: string; complex: string; establishment: string }

export type CaseQuery =
  | { mode: 'cnr'; cnr: string }
  | { mode: 'party'; court: CourtSelection; name: string; year: string; status: StatusFilter }
  | { mode: 'caseNumber'; court: CourtSelection; caseType: string; number: string; year: string }
  | { mode: 'filingNumber'; court: CourtSelection; caseType: string; number: string; year: string }
  | { mode: 'advocate'; court: CourtSelection; by: AdvocateBy; name: string; barCode: string; date: string; status: StatusFilter }
  | { mode: 'fir'; court: CourtSelection; policeStation: string; number: string; year: string; status: StatusFilter }
  | { mode: 'act'; court: CourtSelection; actType: string; section: string; status: PendingDisposed }
  | { mode: 'caseType'; court: CourtSelection; caseType: string; year: string; status: PendingDisposed }

export interface HearingEntry { date: string; businessOn: string; purpose: string; judge: string }
export interface OrderEntry { date: string; title: string }
export interface IaEntry { ia: string; party: string; date: string; status: string }
export interface AdvocateRef { name: string; barCode: string }
export interface ActRef { act: string; sections: string }

export interface CaseRecord {
  cnr: string
  caseType: string
  caseNumber: string
  year: string
  filingNumber: string
  filingYear: string
  filingDate: string
  registrationDate: string
  petitioner: string
  respondent: string
  petitionerAdvocate: AdvocateRef
  respondentAdvocate: AdvocateRef
  firNumber: string | null
  firYear: string | null
  policeStation: string | null
  acts: ActRef[]
  court: CourtSelection
  courtNumberAndJudge: string
  status: 'Pending' | 'Disposed'
  firstHearing: string
  nextHearing: string | null
  decisionDate: string | null
  stage: string
  history: HearingEntry[]
  orders: OrderEntry[]
  iaBusiness: IaEntry[]
}

/**
 * Integration boundary. The prototype ships a mock implementation; a real
 * implementation must call an authorised eCourts/NJDG integration from a
 * server-side service, never from the browser with scraped endpoints.
 */
export interface CaseSearchAdapter {
  readonly isDemo: boolean
  search(query: CaseQuery, signal?: AbortSignal): Promise<CaseRecord[]>
}
