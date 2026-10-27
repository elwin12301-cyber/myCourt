import { describe, expect, it } from 'vitest'
import { HC_SITES, SLUG_TITLES, SVC_SLUGS } from './data'
import { buildSiteIndex, searchSite } from './search'

const idx = buildSiteIndex()

describe('site search index', () => {
  it('covers every page except the search page itself', () => {
    for (const s of SVC_SLUGS.filter((x) => x !== 'search')) {
      expect(idx.some((h) => h.slug === s && h.title === SLUG_TITLES[s])).toBe(true)
    }
  })
  it('covers all 25 High Courts and the external menu items', () => {
    expect(idx.filter((h) => h.kind === 'High Court')).toHaveLength(HC_SITES.length)
    for (const name of ['e-Committee', 'Supreme Court', 'District Courts', 'NJDG']) expect(idx.some((h) => h.title === name && h.url)).toBe(true)
  })
  it('every hit has exactly one destination', () => {
    for (const h of idx) expect(Boolean(h.slug) !== Boolean(h.url)).toBe(true)
  })
  it('has unique ids', () => expect(new Set(idx.map((h) => h.id)).size).toBe(idx.length))
})

describe('searchSite', () => {
  it('returns nothing for an empty or blank query', () => {
    expect(searchSite('', idx)).toEqual([])
    expect(searchSite('   ', idx)).toEqual([])
  })
  it('finds services by name', () => {
    expect(searchSite('caveat', idx)[0].slug).toBe('caveat')
    expect(searchSite('process', idx).some((h) => h.slug === 'process')).toBe(true)
  })
  it('finds a High Court and sends the user to its external site', () => {
    const hit = searchSite('madras', idx).find((h) => h.kind === 'High Court')
    expect(hit?.url).toBe('https://hcmadras.tn.gov.in/')
  })
  it('finds a contact row by jurisdiction', () => {
    expect(searchSite('puducherry', idx).some((h) => h.slug === 'contact')).toBe(true)
  })
  it('finds forms, manuals-style documents and help videos', () => {
    expect(searchSite('vakalatnama', idx).some((h) => h.slug === 'forms')).toBe(true)
    expect(searchSite('cause list search', idx).some((h) => h.slug === 'help-videos')).toBe(true)
    expect(searchSite('newsletter 2016', idx).length).toBeGreaterThan(0)
  })
  it('requires every term and ranks title matches first', () => {
    expect(searchSite('caveat zzzz', idx)).toEqual([])
    expect(searchSite('contact', idx)[0].title.toLowerCase()).toContain('contact')
  })
})
