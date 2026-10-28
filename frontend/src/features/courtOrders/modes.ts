import type { OrderFilter, OrderMode } from './types'

export interface OrderModeInfo { id: OrderMode; label: string; heading: string; help: string }

/** Labels and help follow the official Court Orders page (read 2026-10-27). */
export const ORDER_MODES: OrderModeInfo[] = [
  { id: 'party', label: 'Party Name', heading: 'Search by Party Name',
    help: 'Enter at least 3 characters of the name; it can be the petitioner, plaintiff, complainant, respondent, defendant, appellant, accused or extra party. Enter the year, choose the order type, complete the captcha and select Go.' },
  { id: 'caseNumber', label: 'Case Number', heading: 'Search by Case Number',
    help: 'Select the case type, then enter the case number and year. Choose the order type, complete the captcha and select Go.' },
  { id: 'courtNumber', label: 'Court Number', heading: 'Search by Court Number',
    help: 'Select the court number; each entry shows the court number, judge name, designation and judge period. Choose the order type, complete the captcha and select Go.' },
  { id: 'orderDate', label: 'Order Date', heading: 'Search by Order Date',
    help: 'Enter the from date and the to date; both are included. Choose the order type, complete the captcha and select Go.' },
]

export const DEFAULT_FILTER: OrderFilter = 'Both'
export const FILTER_OPTIONS: OrderFilter[] = ['Interim', 'Final', 'Both']
export const FILTER_LABELS: Record<OrderFilter, string> = { Interim: 'Interim Orders', Final: 'Final Orders', Both: 'Both' }
