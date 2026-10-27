import { describe, expect, it } from 'vitest'
import { DISTRICT_TOTALS, FORMS, HIGH_COURTS, SERVICES, SLIDES, STATES, districtLink, formLink } from './data'
import { buildIndex, searchPortal } from './search'

describe('portal snapshot data', () => {
  it('matches the counts shown on the official pages', () => {
    expect(HIGH_COURTS).toHaveLength(25)
    // The portal states 36 but its link list has 37 entries; we keep what it lists.
    expect(STATES).toHaveLength(DISTRICT_TOTALS.listedLinks)
    expect(DISTRICT_TOTALS.statedStatesAndUts).toBe(36)
    expect(FORMS).toHaveLength(24)
    expect(SLIDES).toHaveLength(6)
    expect(SERVICES).toHaveLength(15)
  })
  it('has unique state codes and service ids', () => {
    expect(new Set(STATES.map((s) => s.code)).size).toBe(STATES.length)
    expect(new Set(SERVICES.map((s) => s.id)).size).toBe(SERVICES.length)
  })
  it('only links to https URLs on the official domains', () => {
    const urls = SERVICES.flatMap((s) => (s.target.kind === 'external' ? [s.target.url] : []))
    urls.push(districtLink('tn'), formLink('Bail Bond.pdf'))
    for (const u of urls) expect(u).toMatch(/^https:\/\/[a-z.]*(ecourts\.gov\.in|vcourts\.gov\.in)(\/|$)/)
  })
  it('encodes form file names', () => expect(formLink('Bail Bond.pdf')).toContain('Bail%20Bond.pdf'))
  it('does not expose e-mail addresses in a harvestable form', () => {
    expect(HIGH_COURTS.every((h) => !h.cpcEmail.includes('@'))).toBe(true)
  })
})

describe('searchPortal', () => {
  const idx = buildIndex()
  it('returns nothing for an empty query', () => expect(searchPortal('  ', idx)).toEqual([]))
  it('finds a service by name', () => {
    expect(searchPortal('epay', idx).map((h) => h.title)).toContain('ePay')
  })
  it('requires all terms', () => {
    expect(searchPortal('vakalatnama zzzz', idx)).toEqual([])
    expect(searchPortal('bail bond', idx).length).toBeGreaterThanOrEqual(3)
  })
  it('ranks title matches first', () => {
    expect(searchPortal('madras', idx)[0].title).toMatch(/Madras/)
  })
  it('finds courts by jurisdiction', () => {
    expect(searchPortal('puducherry', idx).some((h) => h.kind === 'High Court')).toBe(true)
  })
})

import { PAGE_IDS } from '../../router'
import {
  BROCHURES, HELP_VIDEOS, MAIN_MENU, MANUALS, NEWSLETTERS, PARTNERS, POLICIES, SCREEN_READERS, USEFUL_LINKS,
  manualLink, referenceLink, REFERENCES,
} from './data'

describe('menus and useful links', () => {
  it('keeps the main menu in the official order', () => {
    expect(MAIN_MENU.map((m) => m.label)).toEqual([
      'Home', 'About', 'e-Committee', 'NJDG', 'Supreme Court', 'High Courts', 'District Courts', 'Contact Us',
    ])
  })
  it('gives every menu item exactly one destination', () => {
    for (const m of MAIN_MENU) expect(Boolean(m.page) !== Boolean(m.url)).toBe(true)
  })
  it('lists the 15 useful links, each mapped to a real page id', () => {
    expect(USEFUL_LINKS).toHaveLength(15)
    for (const l of USEFUL_LINKS) expect(PAGE_IDS).toContain(l.page)
    expect(new Set(USEFUL_LINKS.map((l) => l.page)).size).toBe(15)
  })
  it('has a policy summary for each policy page', () => {
    for (const l of USEFUL_LINKS.filter((x) => POLICIES[x.page])) expect(POLICIES[l.page]!.bullets.length).toBeGreaterThan(2)
    expect(Object.keys(POLICIES)).toHaveLength(6)
  })
})

describe('documents and footer data', () => {
  it('matches the counts on the official pages', () => {
    expect(HELP_VIDEOS).toHaveLength(15)
    expect(MANUALS).toHaveLength(9)
    expect(BROCHURES).toHaveLength(3)
    expect(NEWSLETTERS).toHaveLength(9)
    expect(REFERENCES).toHaveLength(4)
    expect(PARTNERS).toHaveLength(6)
    expect(SCREEN_READERS).toHaveLength(5)
  })
  it('only uses https links on government hosts', () => {
    const urls = [
      ...MAIN_MENU.flatMap((m) => (m.url ? [m.url] : [])), ...PARTNERS.map((p) => p.url), ...NEWSLETTERS.map((n) => n.url),
      manualLink('Court User Manual.pdf'), referenceLink('FINAL_INNOVATIONS_IN_PHASE_II.pdf'),
    ]
    for (const u of urls) expect(u).toMatch(/^https:\/\/[a-z.]+\.(gov\.in|nic\.in)(\/|$)/)
  })
  it('encodes spaces in document file names', () => {
    expect(manualLink('Court User Manual.pdf')).toContain('Court%20User%20Manual.pdf')
  })
  it('finds documents through portal search', () => {
    expect(searchPortal('vakalatnama').length).toBeGreaterThan(0)
    expect(searchPortal('brochure').some((h) => h.kind === 'Document')).toBe(true)
    expect(searchPortal('newsletter 2016').length).toBeGreaterThanOrEqual(9)
    expect(searchPortal('supreme court').some((h) => h.url?.includes('sci.gov.in'))).toBe(true)
  })
})
