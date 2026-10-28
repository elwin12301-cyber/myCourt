import { describe, expect, it } from 'vitest'
import {
  ABOUT, CONTACT_DISCREPANCY, CONTACT_ROWS, DEFAULT_SLUG, FOOTER_LINKS, HC_SITES, SEARCH_MENU, SITE_FACTS, SLUG_TITLES,
  SVC_LANGUAGES, SVC_MAIN_MENU, SVC_SLUGS, THEME_OPTIONS, TOPBAR_OPTIONS,
} from './data'

describe('menus follow the official site', () => {
  it('main menu: 7 items in the official order', () => {
    expect(SVC_MAIN_MENU.map((m) => m.label)).toEqual(['Home', 'e-Committee', 'Supreme Court', 'High Courts', 'District Courts', 'NJDG', 'Contact Us'])
  })
  it('search menu: 7 items in the official order', () => {
    expect(SEARCH_MENU.map((m) => m.label)).toEqual(['CNR Number', 'Case Status', 'Court Orders', 'Cause List', 'Caveat Search', 'Process Details', 'Location'])
  })
  it('footer: 12 useful links in the official order', () => {
    expect(FOOTER_LINKS.map((m) => m.label)).toEqual([
      'About Us', 'Newsletter', 'Forms for Advocates', 'Help Videos', 'Site map', 'Contact Us', 'Web Information Manager',
      'Copyright Policy', 'Hyperlinking Policy', 'Accessibility Statement', 'Screen Reader Access', 'Disclaimer',
    ])
  })
  it('every menu item has exactly one destination, and internal ones are real pages', () => {
    for (const m of [...SVC_MAIN_MENU, ...SEARCH_MENU, ...FOOTER_LINKS]) {
      expect(Boolean(m.slug) !== Boolean(m.url)).toBe(true)
      if (m.slug) expect(SVC_SLUGS).toContain(m.slug)
    }
  })
  it('home is the CNR page', () => {
    expect(DEFAULT_SLUG).toBe('cnr')
    expect(SVC_MAIN_MENU[0].slug).toBe('cnr')
  })
  it('has a title for every page and no duplicate slugs', () => {
    expect(new Set(SVC_SLUGS).size).toBe(SVC_SLUGS.length)
    for (const s of SVC_SLUGS) expect(SLUG_TITLES[s]).toBeTruthy()
  })
})

describe('external links', () => {
  it('main-menu external links are https on government hosts', () => {
    for (const m of SVC_MAIN_MENU.filter((x) => x.url)) expect(m.url).toMatch(/^https:\/\/[a-z.]+\.(gov\.in|nic\.in)(\/|$)/)
  })
  it('lists 25 High Court websites exactly as the official page gives them', () => {
    expect(HC_SITES).toHaveLength(25)
    expect(new Set(HC_SITES.map((h) => h.name)).size).toBe(25)
    for (const h of HC_SITES) expect(h.url).toMatch(/^https?:\/\/[\w.-]+\.in(\/|$)/)
  })
  it('keeps the YouTube channel link', () => expect(SITE_FACTS.youtube).toMatch(/^https:\/\/www\.youtube\.com\//))
})

describe('contact and about', () => {
  it('contact table has the 24 courts the services page lists, without Telangana', () => {
    expect(CONTACT_ROWS).toHaveLength(24)
    expect(CONTACT_ROWS.map((c) => c.name)).not.toContain('Telangana')
    expect(CONTACT_DISCREPANCY).toContain('Telangana')
  })
  it('contact e-mails stay in the anti-spam form', () => {
    for (const c of CONTACT_ROWS) expect(c.cpcEmail.includes('@')).toBe(false)
  })
  it('about page carries the four goals and the key dates', () => {
    expect(ABOUT.envisages).toHaveLength(4)
    expect(ABOUT.facts.map((f) => f[1])).toContain('7 August 2013')
  })
})

describe('site tools', () => {
  it('offers the six languages and the official theme options', () => {
    expect(SVC_LANGUAGES).toHaveLength(6)
    expect(SVC_LANGUAGES[0]).toBe('English')
    expect([...TOPBAR_OPTIONS]).toEqual(['Light', 'Dark'])
    expect([...THEME_OPTIONS]).toEqual(['Default', 'Dark', 'Eco', 'Light'])
  })
  it('records the official footer facts', () => {
    expect(SITE_FACTS.lastUpdated).toBe('2 January 2026')
    expect(SITE_FACTS.version).toBe('1.0')
  })
})
