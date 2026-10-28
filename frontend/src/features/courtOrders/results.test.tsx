import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppContext } from '../../context'
import type { AppContextValue } from '../../types'
import OrderResults, { visibleRows } from '../../pages/courtOrders/OrderResults'
import { DEMO_CASES } from '../caseStatus/mockData'
import { runOrderQuery } from './courtOrders'

const noop = () => {}
const ctx: AppContextValue = {
  go: noop, toast: noop, openModal: noop, tasks: [], setTasks: noop, docs: [], setDocs: noop, messages: [], setMessages: noop,
  transcript: '', setTranscript: noop, researchQuery: '', setResearchQuery: noop, portalQuery: '', setPortalQuery: noop,
}
const wrap = (node: JSX.Element) => renderToString(<AppContext.Provider value={ctx}>{node}</AppContext.Provider>)

const mumbai = { state: 'Maharashtra', district: 'Mumbai', complex: 'City Civil and Sessions Court', establishment: '' }
// Case MHMU019999992022 has one interim (2023-06-12) and one final (2024-05-06) order.
const rows = runOrderQuery({ mode: 'caseNumber', court: mumbai, caseType: 'Criminal Appeal (CRL.A)', number: '77', year: '2022', filter: 'Both' }, DEMO_CASES)
const render = (filter: 'All' | 'Interim' | 'Final', sort: 'newest' | 'oldest' | 'case') =>
  wrap(<OrderResults results={rows} filter={filter} sort={sort} onFilter={noop} onSort={noop} onView={noop} />)

describe('visibleRows (the page owns filter and sort)', () => {
  it('filters by order type', () => {
    expect(visibleRows(rows, 'All', 'newest')).toHaveLength(2)
    expect(visibleRows(rows, 'Final', 'newest').map((r) => r.order.kind)).toEqual(['Final'])
    expect(visibleRows(rows, 'Interim', 'newest').map((r) => r.order.kind)).toEqual(['Interim'])
  })
  it('sorts newest first, oldest first, or by case and order number', () => {
    expect(visibleRows(rows, 'All', 'newest').map((r) => r.order.date)).toEqual(['2024-05-06', '2023-06-12'])
    expect(visibleRows(rows, 'All', 'oldest').map((r) => r.order.date)).toEqual(['2023-06-12', '2024-05-06'])
    expect(visibleRows(rows, 'All', 'case').map((r) => r.order.number)).toEqual(['1', '2'])
  })
  it('does not change the input array', () => {
    const before = rows.map((r) => r.order.number)
    visibleRows(rows, 'All', 'oldest')
    expect(rows.map((r) => r.order.number)).toEqual(before)
  })
})

describe('OrderResults renders exactly what its props say', () => {
  it('shows both orders for All and one for a type filter', () => {
    expect(render('All', 'newest')).toContain('2 of 2 orders')
    const final = render('Final', 'newest')
    expect(final).toContain('1 of 2 orders')
    expect(final).toContain('Final judgment (demo)')
    expect(final).not.toContain('Interim stay order (demo)')
  })
  it('puts the controls in the state given by the props', () => {
    expect(render('Interim', 'oldest')).toMatch(/<option value="oldest" selected/)
  })
  it('shows the document control as unavailable with an explanation', () => {
    const html = render('All', 'newest')
    expect(html).toContain('No document exists in demonstration data')
    expect(html).toContain('disabled')
  })
  it('shows an order type message when the filter leaves nothing', () => {
    expect(wrap(<OrderResults results={[]} filter="Final" sort="newest" onFilter={noop} onSort={noop} onView={noop} />)).toContain('No orders match the selected order type')
  })
})
