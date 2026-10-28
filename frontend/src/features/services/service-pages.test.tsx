import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppContext } from '../../context'
import type { AppContextValue } from '../../types'
import CaveatSearch from '../../pages/services/CaveatSearch'
import LocationPage from '../../pages/services/LocationPage'
import ProcessDetails from '../../pages/services/ProcessDetails'
import ServicesApp from '../../pages/services/ServicesApp'
import { REGISTERED_EMAIL_NOTE } from './data'

const noop = () => {}
const ctx: AppContextValue = {
  go: noop, toast: noop, openModal: noop, tasks: [], setTasks: noop, docs: [], setDocs: noop, messages: [], setMessages: noop,
  transcript: '', setTranscript: noop, researchQuery: '', setResearchQuery: noop, portalQuery: '', setPortalQuery: noop,
}
const wrap = (node: JSX.Element) => renderToString(<AppContext.Provider value={ctx}>{node}</AppContext.Provider>)

describe('Caveat Search page', () => {
  it.each(['name', 'caseNumber', 'filingNumber', 'caveatNumber'] as const)('renders the %s search with court selectors, captcha and Go', (mode) => {
    const html = wrap(<CaveatSearch initialMode={mode} />)
    for (const s of ['Select Court Complex', 'Enter Captcha', '>Go<', '(required)', 'Demonstration data']) expect(html).toContain(s)
  })
  it('name search offers Anywhere / Starting with and Caveator / Caveatee', () => {
    const html = wrap(<CaveatSearch initialMode="name" />)
    for (const s of ['Anywhere', 'Starting with', 'Caveator', 'Caveatee']) expect(html).toContain(s)
  })
  it('case number search has subordinate court, case type and date of decision', () => {
    const html = wrap(<CaveatSearch initialMode="caseNumber" />)
    for (const s of ['Subordinate Court', 'Case Type', 'Case Number', 'Date of Decision']) expect(html).toContain(s)
  })
  it('caveat number search says a part of the number is enough', () => {
    expect(wrap(<CaveatSearch initialMode="caveatNumber" />)).toContain('A part of the number is enough')
  })
})

describe('Process Details page', () => {
  const html = wrap(<ProcessDetails />)
  it('has the official fields and buttons', () => {
    for (const s of ['Search By Process ID', 'Process ID', 'Email Id', 'Enter Captcha', '>Search<', '>Reset<']) expect(html).toContain(s)
  })
  it('shows the registered e-mail note and the privacy promise', () => {
    expect(html).toContain(REGISTERED_EMAIL_NOTE)
    expect(html).toContain('never stored, logged or repeated in the result')
  })
  it('does not submit through the address bar', () => {
    expect(html).not.toMatch(/<form[^>]*method="get"/i)
    expect(html).not.toMatch(/<form[^>]*action=/i)
  })
})

describe('Location page', () => {
  const html = wrap(<LocationPage />)
  it('has the four court selectors and a View location button', () => {
    for (const s of ['Select State', 'Select District', 'Select Court Complex', 'Select Establishment', 'View location']) expect(html).toContain(s)
  })
  it('keeps the pop-up closed until asked', () => expect(html).not.toContain('role="dialog"'))
})

describe('services site routes the new services', () => {
  const render = (slug: 'caveat' | 'process' | 'location') =>
    renderToString(<AppContext.Provider value={ctx}><ServicesApp initialSlug={slug} /></AppContext.Provider>)
  it('shows each page inside the site shell', () => {
    expect(render('caveat')).toContain('Caveat Search')
    expect(render('process')).toContain('Search By Process ID')
    expect(render('location')).toContain('View location')
  })
})
