export type SearchMode = 'cnr' | 'caseNumber' | 'party'
export type CaseStatusFilter = 'Pending' | 'Disposed' | 'Both'

export interface CnrQuery { mode: 'cnr'; cnr: string }
export interface CaseNumberQuery {
  mode: 'caseNumber'
  state: string
  district: string
  court: string
  caseType: string
  number: string
  year: string
}
export interface PartyQuery {
  mode: 'party'
  state: string
  district: string
  court: string
  name: string
  year: string
  status: CaseStatusFilter
}
export type CaseQuery = CnrQuery | CaseNumberQuery | PartyQuery

export interface HearingEntry { date: string; businessOn: string; purpose: string; judge: string }
export interface OrderEntry { date: string; title: string }

export interface CaseRecord {
  cnr: string
  caseType: string
  caseNumber: string
  year: string
  petitioner: string
  respondent: string
  advocate: string
  state: string
  district: string
  court: string
  status: 'Pending' | 'Disposed'
  filingDate: string
  registrationDate: string
  nextHearing: string | null
  stage: string
  history: HearingEntry[]
  orders: OrderEntry[]
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
