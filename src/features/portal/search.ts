import type { PageId } from '../../types'
import { FORMS, HIGH_COURTS, SERVICES, STATES, USEFUL_LINKS, formLink } from './data'

export interface PortalHit {
  id: string
  title: string
  kind: 'Service' | 'High Court' | 'District Courts' | 'Form' | 'Page'
  description: string
  page?: PageId
  url?: string
}

const PAGES: PortalHit[] = [
  { id: 'p-home', title: 'Portal home', kind: 'Page', description: 'Services, statistics, mobile app and SMS service', page: 'portalHome' },
  { id: 'p-about', title: 'About the eCourts project', kind: 'Page', description: 'Project goals, Phase I and Phase II', page: 'portalAbout' },
  { id: 'p-hc', title: 'High Courts of India', kind: 'Page', description: 'List of 25 High Courts', page: 'portalHighCourts' },
  { id: 'p-dc', title: 'District Courts of India', kind: 'Page', description: 'Select a state or union territory', page: 'portalDistrict' },
  { id: 'p-contact', title: 'Contact us', kind: 'Page', description: 'e-Committee e-mail and High Court CPC contacts', page: 'portalContact' },
  { id: 'p-forms', title: 'Forms for Advocates', kind: 'Page', description: 'Vakalatnama, bail bond, memo of appearance and other forms', page: 'portalForms' },
  { id: 'p-help', title: 'Help, policies and accessibility', kind: 'Page', description: 'Useful links, manuals, policies, accessibility', page: 'portalHelp' },
  { id: 'p-status', title: 'Case status (demo)', kind: 'Page', description: 'Search by CNR, case number or party name using demonstration data', page: 'caseStatus' },
  ...USEFUL_LINKS.map((l): PortalHit => ({ id: `u-${l}`, title: l, kind: 'Page', description: 'Listed under Useful Links on the official portal', page: 'portalHelp' })),
]

export function buildIndex(): PortalHit[] {
  return [
    ...PAGES,
    ...SERVICES.map((s): PortalHit => ({
      id: `s-${s.id}`, title: s.name, kind: 'Service', description: s.description,
      url: s.target.kind === 'external' ? s.target.url : undefined,
      page: s.target.kind === 'internal' ? s.target.page : undefined,
    })),
    ...HIGH_COURTS.map((h): PortalHit => ({ id: `h-${h.name}`, title: `${h.name} High Court`, kind: 'High Court', description: h.jurisdiction, page: 'portalHighCourts' })),
    ...STATES.map((s): PortalHit => ({ id: `d-${s.code}`, title: `${s.name} district courts`, kind: 'District Courts', description: `State/UT code ${s.code}`, page: 'portalDistrict' })),
    ...FORMS.map((f): PortalHit => ({ id: `f-${f.file}`, title: f.title, kind: 'Form', description: `PDF · ${f.size}`, url: formLink(f.file) })),
  ]
}

/** All whitespace-separated terms must appear; title matches rank above description matches. */
export function searchPortal(query: string, index: PortalHit[] = buildIndex()): PortalHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  const scored: { hit: PortalHit; score: number }[] = []
  for (const hit of index) {
    const title = hit.title.toLowerCase()
    const hay = `${title} ${hit.description.toLowerCase()} ${hit.kind.toLowerCase()}`
    if (!terms.every((t) => hay.includes(t))) continue
    scored.push({ hit, score: terms.filter((t) => title.includes(t)).length })
  }
  return scored.sort((a, b) => b.score - a.score || a.hit.title.localeCompare(b.hit.title)).map((s) => s.hit)
}
