import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppContext } from '../../context'
import type { AppContextValue } from '../../types'
import CourtOrdersPage from '../../pages/CourtOrders'

const noop = () => {}
const ctx: AppContextValue = {
  go: noop, toast: noop, openModal: noop, tasks: [], setTasks: noop, docs: [], setDocs: noop, messages: [], setMessages: noop,
  transcript: '', setTranscript: noop, researchQuery: '', setResearchQuery: noop, portalQuery: '', setPortalQuery: noop,
}
const wrap = (node: JSX.Element) => renderToString(<AppContext.Provider value={ctx}>{node}</AppContext.Provider>)

import { DEMO_CASES } from '../caseStatus/mockData'
import { runOrderQuery } from './courtOrders'

const court = { state: 'Tamil Nadu', district: 'Chennai', complex: 'Principal Sessions Court Complex', establishment: '' }
const someResults = runOrderQuery({ mode: 'party', court, name: 'kumar', year: '2025', filter: 'Both' }, DEMO_CASES)

describe('Court Orders: demonstration notice in every state (US4)', () => {
  const states: [string, JSX.Element][] = [
    ['idle', <CourtOrdersPage />],
    ['loading', <CourtOrdersPage initial={{ phase: 'loading' }} />],
    ['error', <CourtOrdersPage initial={{ phase: 'error' }} />],
    ['empty', <CourtOrdersPage initial={{ phase: 'done', results: [] }} />],
    ['results', <CourtOrdersPage initial={{ phase: 'done', results: someResults }} />],
    ['case view', <CourtOrdersPage initial={{ phase: 'done', results: someResults, selected: DEMO_CASES[0] }} />],
  ]
  it.each(states)('shows the notice in the %s state', (_name, node) => {
    const html = wrap(node)
    expect(html).toContain('Demonstration data')
    expect(html).toContain('not affiliated with the judiciary')
  })
  it('says an empty result does not mean no real order exists', () => {
    expect(wrap(<CourtOrdersPage initial={{ phase: 'done', results: [] }} />)).toContain('does not mean no real order exists')
  })
  it('offers retry in the error state and a back button in the case view', () => {
    expect(wrap(<CourtOrdersPage initial={{ phase: 'error' }} />)).toContain('Retry')
    expect(wrap(<CourtOrdersPage initial={{ phase: 'done', results: someResults, selected: DEMO_CASES[0] }} />)).toContain('Back to results')
  })
})

describe('Court Orders: court number and order date forms (US2)', () => {
  it('renders the court number form with the shared controls', () => {
    const html = wrap(<CourtOrdersPage initialMode="courtNumber" />)
    for (const s of ['Court Number', 'Select Court Complex', 'Interim Orders', 'Enter Captcha', '>Go<', 'judge period']) expect(html).toContain(s)
    expect(html).not.toContain('Petitioner/Respondent')
  })
  it('renders the order date form with from and to dates', () => {
    const html = wrap(<CourtOrdersPage initialMode="orderDate" />)
    for (const s of ['From Date', 'To Date', 'Both dates are included', 'Enter Captcha', '>Go<']) expect(html).toContain(s)
    expect(html).not.toContain('Petitioner/Respondent')
  })
})

describe('Court Orders: party name and case number forms', () => {
  it.each(['party', 'caseNumber'] as const)('renders the %s form with court selectors, order type, captcha and Go', (mode) => {
    const html = wrap(<CourtOrdersPage initialMode={mode} />)
    for (const s of ['Select Court Complex', 'Interim Orders', 'Final Orders', 'Both', 'Enter Captcha', '>Go<', '(required)', 'Refresh', 'Listen']) {
      expect(html).toContain(s)
    }
  })
  it('shows party fields only on the party tab', () => {
    expect(wrap(<CourtOrdersPage initialMode="party" />)).toContain('Petitioner/Respondent')
    expect(wrap(<CourtOrdersPage initialMode="caseNumber" />)).not.toContain('Petitioner/Respondent')
  })
  it('shows case-number fields only on the case number tab', () => {
    const html = wrap(<CourtOrdersPage initialMode="caseNumber" />)
    expect(html).toContain('Case Type')
    expect(html).toContain('Case Number')
  })
})
