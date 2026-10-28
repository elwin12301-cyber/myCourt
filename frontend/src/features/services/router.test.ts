import { describe, expect, it } from 'vitest'
import { pageFromHash, servicesHash, servicesSlugFromHash } from '../../router'
import { DEFAULT_SLUG, SVC_SLUGS } from './data'

describe('services routing', () => {
  it('maps every services address to the services page', () => {
    expect(pageFromHash('#/services')).toBe('services')
    expect(pageFromHash('#/services/case-status')).toBe('services')
  })
  it('reads the slug after services/', () => {
    expect(servicesSlugFromHash('#/services/caveat', SVC_SLUGS, DEFAULT_SLUG)).toBe('caveat')
    expect(servicesSlugFromHash('#services/high-courts', SVC_SLUGS, DEFAULT_SLUG)).toBe('high-courts')
  })
  it('falls back to the CNR home for missing or unknown slugs', () => {
    expect(servicesSlugFromHash('#/services', SVC_SLUGS, DEFAULT_SLUG)).toBe('cnr')
    expect(servicesSlugFromHash('#/services/nope', SVC_SLUGS, DEFAULT_SLUG)).toBe('cnr')
    expect(servicesSlugFromHash('#/dashboard', SVC_SLUGS, DEFAULT_SLUG)).toBe('cnr')
  })
  it('round-trips', () => {
    for (const s of SVC_SLUGS) expect(servicesSlugFromHash(servicesHash(s), SVC_SLUGS, DEFAULT_SLUG)).toBe(s)
  })
  it('does not disturb workspace addresses', () => {
    expect(pageFromHash('#/caseStatus')).toBe('caseStatus')
    expect(pageFromHash('#/courtOrders')).toBe('courtOrders')
    expect(pageFromHash('#/nope')).toBe('dashboard')
    expect(pageFromHash('')).toBe('dashboard')
  })
})
