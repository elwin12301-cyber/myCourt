import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { AppContext } from './context'
import type { ChatMessage, DocItem, ModalConfig, PageId, Task } from './types'
import { Pill, Row } from './components/ui'
import DisplaySettings from './components/DisplaySettings'
import { hashForPage, pageFromHash } from './router'
import Dashboard from './pages/Dashboard'
import { CasesPage, CaseDetailPage } from './pages/Cases'
import AssistantPage from './pages/Assistant'
import ResearchPage from './pages/Research'
import DocumentsPage from './pages/Documents'
import MappingPage from './pages/Mapping'
import VoicePage from './pages/Voice'
import HearingPage from './pages/Hearing'
import CaseStatusPage from './pages/CaseStatus'
import CauseListPage from './pages/CauseList'
import CourtOrdersPage from './pages/CourtOrders'
import ServicesApp from './pages/services/ServicesApp'
import {
  PortalBrochures, PortalHelpVideos, PortalKnowledge, PortalManuals, PortalNewsletter, PortalPolicy,
  PortalScreenReader, PortalSitemap, PortalWebInfo,
} from './pages/PortalPages'
import ExternalLink from './components/ExternalLink'
import { MAIN_MENU, USEFUL_LINKS } from './features/portal/data'
import {
  PortalAbout, PortalContact, PortalDistrict, PortalForms, PortalHelp, PortalHighCourts, PortalHome, PortalSearch,
} from './pages/Portal'
import CalendarPage from './pages/Calendar'
import IntakePage from './pages/Intake'
import BillingPage from './pages/Billing'

const NAV: { id: PageId; ico: string; label: string }[] = [
  { id: 'dashboard', ico: '▦', label: 'Dashboard' },
  { id: 'cases', ico: '▣', label: 'Cases & matters' },
  { id: 'caseStatus', ico: '⚑', label: 'Case status' },
  { id: 'causeList', ico: '☷', label: 'Cause list' },
  { id: 'courtOrders', ico: '❏', label: 'Court orders' },
  { id: 'services', ico: '⌂', label: 'eCourts Services site' },
  { id: 'assistant', ico: '✦', label: 'AI Legal Assistant' },
  { id: 'research', ico: '⌕', label: 'RAG Research' },
  { id: 'documents', ico: '▤', label: 'Documents & OCR' },
  { id: 'mapping', ico: '⇄', label: 'Legal section mapping' },
  { id: 'voice', ico: '◉', label: 'Voice-to-text' },
  { id: 'hearing', ico: '⚖', label: 'Hearing preparation' },
  { id: 'calendar', ico: '▦', label: 'Calendar & follow-up' },
  { id: 'intake', ico: '＋', label: 'Client intake' },
  { id: 'billing', ico: '₹', label: 'Time & billing' },
]

const MENU_ICONS: Record<string, string> = {
  Home: '⌂', About: 'ⓘ', 'e-Committee': '↗', NJDG: '↗', 'Supreme Court': '↗',
  'High Courts': '⚖', 'District Courts': '▥', 'Contact Us': '✉',
}
const PORTAL_NAV: { label: string; ico: string; id?: PageId; url?: string }[] = [
  ...MAIN_MENU.map((m) => ({ label: m.label, ico: MENU_ICONS[m.label] ?? '•', id: m.page, url: m.url })),
  { label: 'Useful links', ico: '☰', id: 'portalHelp' },
  { label: 'Search portal', ico: '⌕', id: 'portalSearch' },
]
const POLICY_PAGES: PageId[] = ['portalDisclaimer', 'portalPrivacy', 'portalTerms', 'portalCopyright', 'portalHyperlink', 'portalAccessibility']

const PAGES: Record<PageId, () => JSX.Element> = {
  portalHelpVideos: PortalHelpVideos,
  portalManuals: PortalManuals,
  portalBrochures: PortalBrochures,
  portalKnowledge: PortalKnowledge,
  portalNewsletter: PortalNewsletter,
  portalWebInfo: PortalWebInfo,
  portalDisclaimer: () => <PortalPolicy page="portalDisclaimer" />,
  portalPrivacy: () => <PortalPolicy page="portalPrivacy" />,
  portalTerms: () => <PortalPolicy page="portalTerms" />,
  portalCopyright: () => <PortalPolicy page="portalCopyright" />,
  portalHyperlink: () => <PortalPolicy page="portalHyperlink" />,
  portalAccessibility: () => <PortalPolicy page="portalAccessibility" />,
  portalScreenReader: PortalScreenReader,
  portalSitemap: PortalSitemap,
  portalHome: PortalHome,
  portalAbout: PortalAbout,
  portalHighCourts: PortalHighCourts,
  portalDistrict: PortalDistrict,
  portalForms: PortalForms,
  portalContact: PortalContact,
  portalHelp: PortalHelp,
  portalSearch: PortalSearch,
  dashboard: Dashboard,
  cases: CasesPage,
  caseDetail: CaseDetailPage,
  caseStatus: CaseStatusPage,
  causeList: CauseListPage,
  courtOrders: () => <CourtOrdersPage />,
  services: () => <ServicesApp />,
  assistant: AssistantPage,
  research: ResearchPage,
  documents: DocumentsPage,
  mapping: MappingPage,
  voice: VoicePage,
  hearing: HearingPage,
  calendar: CalendarPage,
  intake: IntakePage,
  billing: BillingPage,
}

const INITIAL_MESSAGES: ChatMessage[] = [{
  role: 'assistant',
  title: 'myCourt AI',
  text: 'Hello, Advocate. I can help review your matter, find source-backed legal authorities, prepare a hearing brief, or turn dictation into structured notes. Choose a matter to begin.',
}]

const INITIAL_TASKS: Task[] = [
  { title: 'Obtain certified copy of order', due: 'Today', done: false },
  { title: 'Verify current treatment of cited authority', due: 'Tomorrow', done: false },
  { title: 'Send reviewed client update', due: '27 Oct', done: true },
]

const INITIAL_DOCS: DocItem[] = [
  { name: 'Petition and supporting affidavit.pdf', type: 'PDF · 18 pages', status: 'OCR complete', confidence: '98%' },
  { name: 'Order dated 02 Sep 2026.pdf', type: 'Scanned PDF · 6 pages', status: 'Review needed', confidence: '84%' },
  { name: 'Client voice note transcript.txt', type: 'Transcript · 2 min', status: 'Reviewed', confidence: '—' },
]

export default function App() {
  const [page, setPage] = useState<PageId>(() => pageFromHash(window.location.hash))
  const [menuOpen, setMenuOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastShow, setToastShow] = useState(false)
  const [modal, setModal] = useState<ModalConfig | null>(null)
  const [tasks, setTasksState] = useState<Task[]>(INITIAL_TASKS)
  const [docs, setDocsState] = useState<DocItem[]>(INITIAL_DOCS)
  const [messages, setMessagesState] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [transcript, setTranscript] = useState(
    'The matter is listed on 14 November. Check the certified copy of the order. Verify the section reference before drafting.',
  )
  const [researchQuery, setResearchQuery] = useState('')
  const [portalQuery, setPortalQuery] = useState('')
  const toastTimer = useRef<number>()

  const go = useCallback((p: PageId) => {
    setPage(p)
    setMenuOpen(false)
    if (window.location.hash !== hashForPage(p)) window.location.hash = hashForPage(p)
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const onHash = () => { setPage(pageFromHash(window.location.hash)); setMenuOpen(false) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    setToastShow(true)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastShow(false), 2600)
  }, [])
  const openModal = useCallback((cfg: ModalConfig) => setModal(cfg), [])

  const ctx = useMemo(() => ({
    go, toast, openModal,
    tasks, setTasks: (u: (t: Task[]) => Task[]) => setTasksState(u),
    docs, setDocs: (u: (d: DocItem[]) => DocItem[]) => setDocsState(u),
    messages, setMessages: (u: (m: ChatMessage[]) => ChatMessage[]) => setMessagesState(u),
    transcript, setTranscript,
    researchQuery, setResearchQuery,
    portalQuery, setPortalQuery,
  }), [go, toast, openModal, tasks, docs, messages, transcript, researchQuery, portalQuery])

  const onSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const q = e.currentTarget.value.toLowerCase()
    if (q.includes('court order')) go('courtOrders')
    else if (q.includes('cause')) go('causeList')
    else if (q.includes('cnr') || q.includes('status')) go('caseStatus')
    else if (q.includes('ecourts') || q.includes('portal') || q.includes('form') || q.includes('high court')) go('portalSearch')
    else if (q.includes('document') || q.includes('order')) go('documents')
    else if (q.includes('section') || q.includes('ipc') || q.includes('bns')) go('mapping')
    else if (q.includes('hearing') || q.includes('date')) go('calendar')
    else if (q.includes('research') || q.includes('judgment')) go('research')
    else if (q.includes('kumar') || q.includes('case')) go('cases')
    else go('assistant')
    toast('Search routed to the closest matching workspace')
  }

  const showNotifications = () => openModal({
    title: 'Notifications',
    body: (
      <div className="list">
        <Row title="Hearing preparation needed" sub="State v. R. Kumar · 28 Oct" right={<Pill kind="amber">Action</Pill>} />
        <Row title="OCR passage needs review" sub="Order dated 02 Sep · page 4" right={<Pill kind="amber">Review</Pill>} />
        <Row title="Client update draft" sub="Awaiting advocate approval" right={<Pill kind="blue">Draft</Pill>} />
      </div>
    ),
  })

  const submitModal = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    modal?.onSave?.(new FormData(e.currentTarget))
    setModal(null)
  }

  const Page = PAGES[page]
  const activeNav = page === 'caseDetail' ? 'cases' : page

  // The eCourts Services site is a full-page prototype with its own chrome, so it replaces the workspace layout.
  if (page === 'services') {
    return (
      <AppContext.Provider value={ctx}>
        <ServicesApp />
        <div className={`toast ${toastShow ? 'show' : ''}`}>{toastMsg}</div>
      </AppContext.Provider>
    )
  }

  return (
    <AppContext.Provider value={ctx}>
      <a className="skip" href="#main-content">Skip to main content</a>
      <div className="protobar" role="note">Prototype · all case, client and financial data shown is demonstration data</div>
      <div className="app">
        <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <div className="brand">
            <div className="brandmark">M</div>
            <div><h1>myCourt</h1><small>LEGAL WORKSPACE</small></div>
          </div>
          <div className="navlabel">WORKSPACE</div>
          <nav className="nav">
            {NAV.map((n) => (
              <button key={n.id} aria-current={activeNav === n.id ? 'page' : undefined} className={activeNav === n.id ? 'active' : ''} onClick={() => go(n.id)}>
                <span className="ico">{n.ico}</span>{n.label}
              </button>
            ))}
          </nav>
          <div className="navlabel">ECOURTS PORTAL (REFERENCE)</div>
          <nav className="nav" aria-label="eCourts portal reference">
            {PORTAL_NAV.map((n) => {
              const active = n.id === page || (n.id === 'portalHelp' && (USEFUL_LINKS.some((l) => l.page === page) || POLICY_PAGES.includes(page)))
              return n.url ? (
                <ExternalLink key={n.label} className="" href={n.url}><span className="ico">{n.ico}</span>{n.label}</ExternalLink>
              ) : (
                <button key={n.label} aria-current={active ? 'page' : undefined} className={active ? 'active' : ''} onClick={() => go(n.id!)}>
                  <span className="ico">{n.ico}</span>{n.label}
                </button>
              )
            })}
          </nav>
          <div className="sidebottom">
            <div className="avatar">AK</div>
            <div><strong>Adv. A. Kumar</strong><small>Advocate workspace</small></div>
          </div>
        </aside>
        <main className="main" id="main-content" tabIndex={-1}>
          <header className="topbar">
            <button className="iconbtn mobilemenu" onClick={() => setMenuOpen((o) => !o)}>☰</button>
            <div className="search">
              <input aria-label="Search" placeholder="Search matters, documents, authorities…" onKeyDown={onSearch} />
            </div>
            <div className="topactions">
              <button className="iconbtn hide-sm" onClick={() => go('calendar')}>◷ Upcoming: 3</button>
              <DisplaySettings />
              <button className="iconbtn" title="Notifications" aria-label="Notifications" onClick={showNotifications}>♧</button>
              <div className="avatar">AK</div>
            </div>
          </header>
          <div className="page"><Page /></div>
        </main>
      </div>

      <div className={`toast ${toastShow ? 'show' : ''}`}>{toastMsg}</div>

      <div className={`modalback ${modal ? 'show' : ''}`}>
        {modal && (
          <form className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onSubmit={submitModal} onKeyDown={(e) => { if (e.key === 'Escape') setModal(null) }}>
            <div className="modalhead">
              <h3 id="modal-title">{modal.title}</h3>
              <button type="button" className="iconbtn" aria-label="Close dialog" autoFocus onClick={() => setModal(null)}>✕</button>
            </div>
            <div>{modal.body}</div>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn primary">Save</button>
            </div>
          </form>
        )}
      </div>
    </AppContext.Provider>
  )
}
