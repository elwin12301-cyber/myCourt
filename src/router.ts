import type { PageId } from './types'

export const PAGE_IDS: PageId[] = [
  'dashboard', 'cases', 'caseStatus', 'caseDetail', 'assistant', 'research', 'documents',
  'mapping', 'voice', 'hearing', 'calendar', 'intake', 'billing',
  'portalHome', 'portalAbout', 'portalHighCourts', 'portalDistrict', 'portalForms',
  'portalContact', 'portalHelp', 'portalSearch', 'portalHelpVideos', 'portalManuals',
  'portalBrochures', 'portalKnowledge', 'portalNewsletter', 'portalWebInfo', 'portalDisclaimer',
  'portalPrivacy', 'portalTerms', 'portalCopyright', 'portalHyperlink', 'portalAccessibility',
  'portalScreenReader', 'portalSitemap',
]

/** Parses "#/case-status"-style hashes; unknown values fall back to the dashboard. */
export function pageFromHash(hash: string): PageId {
  const id = hash.replace(/^#\/?/, '')
  return (PAGE_IDS.find((p) => p === id) ?? 'dashboard') as PageId
}

export function hashForPage(p: PageId): string {
  return `#/${p}`
}
