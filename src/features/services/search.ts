import { FORMS, NEWSLETTERS } from '../portal/data'
import {
  CONTACT_ROWS, HC_SITES, HELP_VIDEOS, SEARCH_MENU, SLUG_TITLES, SVC_MAIN_MENU, SVC_SLUGS, type SvcSlug,
} from './data'

export interface SiteHit {
  id: string
  title: string
  kind: 'Service' | 'Page' | 'Link' | 'High Court' | 'Contact' | 'Form' | 'Help video' | 'Newsletter'
  description: string
  slug?: SvcSlug
  url?: string
}

const DESCRIPTIONS: Record<SvcSlug, string> = {
  cnr: 'Search a case by its 16-character CNR number', 'case-status': 'Search by party name, case number, filing number, advocate, FIR number, act or case type',
  'court-orders': 'Find interim and final orders', 'cause-list': 'Show the civil or criminal cause list of a court', caveat: 'Find an active caveat by name, case, filing or caveat number',
  process: 'Look up a process by process ID and registered e-mail', location: 'See where a court is', 'high-courts': 'The 25 High Courts and their websites',
  contact: 'e-Committee e-mail and High Court coordinator contacts', about: 'About the eCourts project', newsletter: 'eCommittee newsletters',
  forms: 'Forms for advocates', 'help-videos': 'Help videos for the services', 'site-map': 'Every page of this site', 'web-info': 'The web information manager role',
  copyright: 'Copyright policy', hyperlinking: 'Hyperlinking policy', accessibility: 'Accessibility statement', 'screen-reader': 'Screen readers that work with the site',
  disclaimer: 'Disclaimer', search: 'Search this site',
}

export function buildSiteIndex(): SiteHit[] {
  const isService = (s: SvcSlug) => SEARCH_MENU.some((m) => m.slug === s)
  return [
    ...SVC_SLUGS.filter((s) => s !== 'search').map((s): SiteHit => ({
      id: `page-${s}`, title: SLUG_TITLES[s], kind: isService(s) ? 'Service' : 'Page', description: DESCRIPTIONS[s], slug: s,
    })),
    ...SVC_MAIN_MENU.filter((m) => m.url).map((m): SiteHit => ({ id: `link-${m.label}`, title: m.label, kind: 'Link', description: 'External site from the main menu', url: m.url })),
    ...HC_SITES.map((h): SiteHit => ({ id: `hc-${h.name}`, title: h.name, kind: 'High Court', description: 'External High Court website', url: h.url })),
    ...CONTACT_ROWS.map((c): SiteHit => ({ id: `contact-${c.name}`, title: `${c.name} High Court contact`, kind: 'Contact', description: c.jurisdiction, slug: 'contact' })),
    ...FORMS.map((f): SiteHit => ({ id: `form-${f.file}`, title: f.title, kind: 'Form', description: `PDF · ${f.size}`, slug: 'forms' })),
    ...HELP_VIDEOS.map((v): SiteHit => ({ id: `video-${v}`, title: v, kind: 'Help video', description: 'Help video', slug: 'help-videos' })),
    ...NEWSLETTERS.map((n): SiteHit => ({ id: `news-${n.url}`, title: n.title, kind: 'Newsletter', description: n.date, slug: 'newsletter' })),
  ]
}

/** All whitespace-separated terms must appear; title matches rank above description matches. */
export function searchSite(query: string, index: SiteHit[] = buildSiteIndex()): SiteHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  return index
    .map((hit) => {
      const title = hit.title.toLowerCase()
      const hay = `${title} ${hit.description.toLowerCase()} ${hit.kind.toLowerCase()}`
      return terms.every((t) => hay.includes(t)) ? { hit, score: terms.filter((t) => title.includes(t)).length } : null
    })
    .filter((x): x is { hit: SiteHit; score: number } => x !== null)
    .sort((a, b) => b.score - a.score || a.hit.title.localeCompare(b.hit.title))
    .map((x) => x.hit)
}
