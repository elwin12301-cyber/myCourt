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
