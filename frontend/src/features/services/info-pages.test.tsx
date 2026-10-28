import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppContext } from '../../context'
import type { AppContextValue } from '../../types'
import ServicesApp from '../../pages/services/ServicesApp'
import { ABOUT, CONTACT_ROWS, FOOTER_LINKS, HC_SITES, SLUG_TITLES, type SvcSlug } from './data'

const noop = () => {}
const ctx: AppContextValue = {
  go: noop, toast: noop, openModal: noop, tasks: [], setTasks: noop, docs: [], setDocs: noop, messages: [], setMessages: noop,
  transcript: '', setTranscript: noop, researchQuery: '', setResearchQuery: noop, portalQuery: '', setPortalQuery: noop,
}
const render = (slug: SvcSlug) => renderToString(<AppContext.Provider value={ctx}><ServicesApp initialSlug={slug} /></AppContext.Provider>)
const main = (slug: SvcSlug) => { const h = render(slug); return h.slice(h.indexOf('id="svc-main"'), h.indexOf('<footer')) }

describe('High Courts page', () => {
  const html = main('high-courts')
  it('lists all 25 High Courts and has a breadcrumb', () => {
    // Two names contain "&", which the renderer writes as "&amp;".
    for (const h of HC_SITES) expect(html).toContain(h.name.replace(/&/g, '&amp;'))
    expect(html).toContain('aria-label="Breadcrumb"')
  })
  it('opens courts through the external-site alert (no direct links)', () => {
    expect(html).not.toMatch(/<a [^>]*href="https?:\/\/[^"]*highcourt/i)
    expect(html).toContain('(external site)')
  })
})

describe('Contact Us page', () => {
  const html = main('contact')
  it('shows the e-mail, the coordinator note and 24 table rows', () => {
    expect(html).toContain('ecommittee[at]aij[dot]gov[dot]in')
    expect(html).toContain('Central Project Coordinator')
    expect((html.match(/<tr[ >]/g) ?? []).length).toBe(CONTACT_ROWS.length + 1)
  })
  it('explains the 24 versus 25 difference and keeps addresses anti-spam', () => {
    expect(html).toContain('lists 24 High Courts')
    expect(html).not.toMatch(/[\w.-]+@aij/)
  })
})

describe('About Us page', () => {
  const html = main('about')
  it('carries the goals, phases and key dates', () => {
    for (const g of ABOUT.envisages) expect(html).toContain(g)
    for (const s of ['Phase I', 'Phase II', '7 August 2013', '8 January 2014']) expect(html).toContain(s)
  })
})

describe('footer pages', () => {
  it.each(FOOTER_LINKS.map((l) => l.slug as SvcSlug))('renders the %s page with its title', (slug) => {
    expect(main(slug)).toContain(SLUG_TITLES[slug])
  })
  it('says when content comes from the main portal', () => {
    for (const s of ['newsletter', 'forms', 'help-videos', 'web-info', 'copyright', 'hyperlinking', 'accessibility', 'screen-reader', 'disclaimer'] as SvcSlug[]) {
      expect(main(s)).toContain('main eCourts portal')
    }
  })
  it('site map lists every menu and footer link', () => {
    const html = main('site-map')
    for (const s of ['Main menu', 'Search menu', 'Useful links', 'Caveat Search', 'Screen Reader Access', 'NJDG']) expect(html).toContain(s)
  })
  it('web information manager shows the role and not a named person', () => {
    const html = main('web-info')
    expect(html).toContain('Member - Human Resources')
    expect(html).toContain('hr-ecommittee[at]aij[dot]gov[dot]in')
  })
})

describe('site search page', () => {
  it('renders with a search box', () => {
    const html = main('search')
    expect(html).toContain('Search this site')
  })
})
