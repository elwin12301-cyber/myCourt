import type { PageId } from '../../types'
import {
  BROCHURES, FORMS, HELP_VIDEOS, HIGH_COURTS, MAIN_MENU, MANUALS, NEWSLETTERS, SERVICES, STATES, USEFUL_LINKS,
  formLink, manualLink,
} from './data'

export interface PortalHit {
  id: string
  title: string
  kind: 'Service' | 'High Court' | 'District Courts' | 'Form' | 'Page' | 'Document'
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
  { id: 'p-orders', title: 'Court orders (demo)', kind: 'Page', description: 'Find interim and final orders by party name, case number, court number or order date using demonstration data', page: 'courtOrders' },
  { id: 'p-cause', title: 'Cause list (demo)', kind: 'Page', description: 'Show the Civil or Criminal cause list of a court on a date using demonstration data', page: 'causeList' },
  { id: 'p-status', title: 'Case status (demo)', kind: 'Page', description: 'Search by CNR, case number or party name using demonstration data', page: 'caseStatus' },
  ...USEFUL_LINKS.map((l): PortalHit => ({ id: `u-${l.label}`, title: l.label, kind: 'Page', description: 'Listed under Useful Links on the official portal', page: l.page })),
  ...MAIN_MENU.filter((m) => m.url).map((m): PortalHit => ({ id: `m-${m.label}`, title: m.label, kind: 'Page', description: 'Main menu link to an external site', url: m.url })),
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
    ...MANUALS.map((m): PortalHit => ({ id: `man-${m.file}`, title: m.title, kind: 'Document', description: 'Manual (PDF)', url: manualLink(m.file) })),
    ...BROCHURES.map((m): PortalHit => ({ id: `bro-${m.file}`, title: m.title, kind: 'Document', description: 'Brochure (PDF)', url: manualLink(m.file) })),
    ...NEWSLETTERS.map((n): PortalHit => ({ id: `nl-${n.url}`, title: n.title, kind: 'Document', description: `Newsletter · ${n.date}`, url: n.url })),
    ...HELP_VIDEOS.map((v): PortalHit => ({ id: `hv-${v}`, title: v, kind: 'Document', description: 'Help video', page: 'portalHelpVideos' })),
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
