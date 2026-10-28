import type { CaseRecord, CourtSelection, OrderEntry } from '../caseStatus/types'

export type OrderFilter = 'Interim' | 'Final' | 'Both'
export type OrderMode = 'party' | 'caseNumber' | 'courtNumber' | 'orderDate'

export type OrderQuery =
  | { mode: 'party'; court: CourtSelection; name: string; year: string; filter: OrderFilter }
  | { mode: 'caseNumber'; court: CourtSelection; caseType: string; number: string; year: string; filter: OrderFilter }
  | { mode: 'courtNumber'; court: CourtSelection; roomId: string; filter: OrderFilter }
  | { mode: 'orderDate'; court: CourtSelection; from: string; to: string; filter: OrderFilter }

/** One row per matching order, carrying its case so the case view can open. */
export interface OrderResult { order: OrderEntry; record: CaseRecord }

/**
 * Integration boundary. The prototype ships a mock implementation; a real implementation must
 * read orders from an authorised server-side source (see specs/001-court-orders/contracts).
 */
export interface OrderSearchAdapter {
  readonly isDemo: boolean
  search(query: OrderQuery, signal?: AbortSignal): Promise<OrderResult[]>
}
