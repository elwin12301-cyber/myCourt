import type { PageId } from './types'

export const PAGE_IDS: PageId[] = [
  'dashboard', 'cases', 'caseStatus', 'causeList', 'courtOrders', 'services', 'caseDetail', 'assistant', 'research', 'documents',
  'mapping', 'voice', 'hearing', 'calendar', 'intake', 'billing',
  'portalHome', 'portalAbout', 'portalHighCourts', 'portalDistrict', 'portalForms',
  'portalContact', 'portalHelp', 'portalSearch', 'portalHelpVideos', 'portalManuals',
  'portalBrochures', 'portalKnowledge', 'portalNewsletter', 'portalWebInfo', 'portalDisclaimer',
  'portalPrivacy', 'portalTerms', 'portalCopyright', 'portalHyperlink', 'portalAccessibility',
  'portalScreenReader', 'portalSitemap',
]

/** Parses "#/case-status"-style hashes; unknown values fall back to the dashboard. Only the first segment counts. */
export function pageFromHash(hash: string): PageId {
  const id = hash.replace(/^#\/?/, '').split('/')[0]
  return (PAGE_IDS.find((p) => p === id) ?? 'dashboard') as PageId
}

export function hashForPage(p: PageId): string {
  return `#/${p}`
}

/** `#/caseDetail/<matter id>` opens one matter from the backend. */
export function matterIdFromHash(hash: string): string {
  const m = /^#\/?caseDetail\/([^/?#]+)/.exec(hash)
  return m ? decodeURIComponent(m[1]) : ''
}

/** The eCourts Services site keeps its own sub-pages at `#/services/<slug>`. */
export function servicesHash(slug: string): string {
  return `#/services/${slug}`
}

export function servicesSlugFromHash(hash: string, valid: readonly string[], fallback: string): string {
  const m = /^#\/?services\/([^/?#]+)/.exec(hash)
  return m && valid.includes(m[1]) ? m[1] : fallback
}
