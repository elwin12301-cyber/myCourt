import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppContext } from '../../context'
import type { AppContextValue } from '../../types'
import ServicesApp from '../../pages/services/ServicesApp'
import { FOOTER_LINKS, NOTICE_TEXT, SEARCH_MENU, SVC_MAIN_MENU, type SvcSlug } from './data'

const noop = () => {}
const ctx: AppContextValue = {
  go: noop, toast: noop, openModal: noop, tasks: [], setTasks: noop, docs: [], setDocs: noop, messages: [], setMessages: noop,
  transcript: '', setTranscript: noop, researchQuery: '', setResearchQuery: noop, portalQuery: '', setPortalQuery: noop,
}
const render = (slug: SvcSlug) => renderToString(<AppContext.Provider value={ctx}><ServicesApp initialSlug={slug} /></AppContext.Provider>)

describe('services site shell', () => {
  const html = render('cnr')
  it('shows the top bar, branding and the demonstration notice', () => {
    expect(html).toContain('e-Committee, Supreme Court of India')
    expect(html).toContain('eCourts Services')
    expect(html).toContain('District and Taluka Courts of India')
    expect(html.toLowerCase()).toContain('independent demonstration')
    expect(html).toContain('not affiliated with the judiciary')
  })
  it('shows all 7 main-menu items in order', () => {
    const nav = html.slice(html.indexOf('aria-label="Main menu"'), html.indexOf('aria-label="Search Menu"'))
    const at = SVC_MAIN_MENU.map((m) => nav.indexOf(`>${m.label}`))
    expect(at.every((i) => i > -1)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
  })
  it('shows all 7 Search Menu items in order', () => {
    const area = html.slice(html.indexOf('Search Menu'))
    const at = SEARCH_MENU.map((m) => area.indexOf(m.label))
    expect(at.every((i) => i > -1)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
  })
  it('shows the 12 footer links and the official footer facts', () => {
    const foot = html.slice(html.indexOf('<footer'))
    for (const l of FOOTER_LINKS) expect(foot).toContain(l.label)
    for (const s of ['2 January 2026', 'Version', 'Follow Us', 'YouTube', 'Digital India', 'India Code', 'NIC']) expect(foot).toContain(s)
  })
  it('shows the theme notice, language selector, tools and way back to the workspace', () => {
    for (const s of [NOTICE_TEXT, 'Select language', 'Search this site', 'Accessibility options', 'Theme Customizer', 'Back to myCourt workspace', 'Skip to main content']) {
      expect(html).toContain(s)
    }
  })
  it('marks the current Search Menu item', () => {
    expect(render('case-status')).toMatch(/aria-current="page"[^>]*>(?:<[^>]*>)*Case Status/)
  })
  it('shows a breadcrumb on inner pages but not on Home', () => {
    expect(render('high-courts')).toContain('aria-label="Breadcrumb"')
    expect(html).not.toContain('aria-label="Breadcrumb"')
  })
})
