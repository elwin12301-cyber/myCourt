import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent, type KeyboardEvent } from 'react'
import { AppContext } from './context'
import type { ChatMessage, DocItem, ModalConfig, PageId, Task } from './types'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ListItemButton from '@mui/material/ListItemButton'
import OutlinedInput from '@mui/material/OutlinedInput'
import Snackbar from '@mui/material/Snackbar'
import { Modal, Pill, Row } from './components/ui'
import DisplaySettings from './components/DisplaySettings'
import Security from './components/Security'
import VoiceControl from './components/VoiceControl'
import { hashForPage, pageFromHash } from './router'
import { gateState, useAuth } from './api/auth'
import { apiEnabled } from './api/client'
import SignIn from './pages/SignIn'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CasesPage = lazy(() => import('./pages/Cases').then((m) => ({ default: m.CasesPage })))
const CaseDetailPage = lazy(() => import('./pages/Cases').then((m) => ({ default: m.CaseDetailPage })))
const AssistantPage = lazy(() => import('./pages/Assistant'))
const ResearchPage = lazy(() => import('./pages/Research'))
const DocumentsPage = lazy(() => import('./pages/Documents'))
const MappingPage = lazy(() => import('./pages/Mapping'))
const VoicePage = lazy(() => import('./pages/Voice'))
const HearingPage = lazy(() => import('./pages/Hearing'))
const CaseStatusPage = lazy(() => import('./pages/CaseStatus'))
const CauseListPage = lazy(() => import('./pages/CauseList'))
const CourtOrdersPage = lazy(() => import('./pages/CourtOrders'))
const live = () => import('./pages/live/LiveScreens')
const LiveAssistant = lazy(() => live().then((m) => ({ default: m.LiveAssistant })))
const LiveResearch = lazy(() => live().then((m) => ({ default: m.LiveResearch })))
const LiveDocuments = lazy(() => live().then((m) => ({ default: m.LiveDocuments })))
const LiveMapping = lazy(() => live().then((m) => ({ default: m.LiveMapping })))
const LiveVoice = lazy(() => live().then((m) => ({ default: m.LiveVoice })))
const LiveHearing = lazy(() => live().then((m) => ({ default: m.LiveHearing })))
const LiveCalendar = lazy(() => live().then((m) => ({ default: m.LiveCalendar })))
const LiveIntake = lazy(() => live().then((m) => ({ default: m.LiveIntake })))
const LiveBilling = lazy(() => live().then((m) => ({ default: m.LiveBilling })))
const ServicesApp = lazy(() => import('./pages/services/ServicesApp'))
const portalPages = () => import('./pages/PortalPages')
const PortalBrochures = lazy(() => portalPages().then((m) => ({ default: m.PortalBrochures })))
const PortalHelpVideos = lazy(() => portalPages().then((m) => ({ default: m.PortalHelpVideos })))
const PortalKnowledge = lazy(() => portalPages().then((m) => ({ default: m.PortalKnowledge })))
const PortalManuals = lazy(() => portalPages().then((m) => ({ default: m.PortalManuals })))
const PortalNewsletter = lazy(() => portalPages().then((m) => ({ default: m.PortalNewsletter })))
const PortalPolicy = lazy(() => portalPages().then((m) => ({ default: m.PortalPolicy })))
const PortalScreenReader = lazy(() => portalPages().then((m) => ({ default: m.PortalScreenReader })))
const PortalSitemap = lazy(() => portalPages().then((m) => ({ default: m.PortalSitemap })))
const PortalWebInfo = lazy(() => portalPages().then((m) => ({ default: m.PortalWebInfo })))
import ExternalLink from './components/ExternalLink'
import { MAIN_MENU, USEFUL_LINKS } from './features/portal/data'
const portal = () => import('./pages/Portal')
const PortalAbout = lazy(() => portal().then((m) => ({ default: m.PortalAbout })))
const PortalContact = lazy(() => portal().then((m) => ({ default: m.PortalContact })))
const PortalDistrict = lazy(() => portal().then((m) => ({ default: m.PortalDistrict })))
const PortalForms = lazy(() => portal().then((m) => ({ default: m.PortalForms })))
const PortalHelp = lazy(() => portal().then((m) => ({ default: m.PortalHelp })))
const PortalHighCourts = lazy(() => portal().then((m) => ({ default: m.PortalHighCourts })))
const PortalHome = lazy(() => portal().then((m) => ({ default: m.PortalHome })))
const PortalSearch = lazy(() => portal().then((m) => ({ default: m.PortalSearch })))
const CalendarPage = lazy(() => import('./pages/Calendar'))
const IntakePage = lazy(() => import('./pages/Intake'))
const BillingPage = lazy(() => import('./pages/Billing'))

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

const PAGES: Record<PageId, ComponentType> = {
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
  assistant: () => (apiEnabled() ? <LiveAssistant /> : <AssistantPage />),
  research: () => (apiEnabled() ? <LiveResearch /> : <ResearchPage />),
  documents: () => (apiEnabled() ? <LiveDocuments /> : <DocumentsPage />),
  mapping: () => (apiEnabled() ? <LiveMapping /> : <MappingPage />),
  voice: () => (apiEnabled() ? <LiveVoice /> : <VoicePage />),
  hearing: () => (apiEnabled() ? <LiveHearing /> : <HearingPage />),
  calendar: () => (apiEnabled() ? <LiveCalendar /> : <CalendarPage />),
  intake: () => (apiEnabled() ? <LiveIntake /> : <IntakePage />),
  billing: () => (apiEnabled() ? <LiveBilling /> : <BillingPage />),
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
  const auth = useAuth()
  const [page, setPage] = useState<PageId>(() => pageFromHash(window.location.hash))
  const [menuOpen, setMenuOpen] = useState(false)
  const [securityOpen, setSecurityOpen] = useState(false)
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

  // With the backend in use the workspace needs a signed-in person. The Services-site demo stays public.
  const gate = gateState(auth.required, auth.status, page)
  if (gate === 'loading') return <div role="status" className="page">Loading…</div>
  if (gate === 'sign-in') return <AppContext.Provider value={ctx}><SignIn /><VoiceControl floating /></AppContext.Provider>
  const activeNav = page === 'caseDetail' ? 'cases' : page

  // The eCourts Services site is a full-page prototype with its own chrome, so it replaces the workspace layout.
  if (page === 'services') {
    return (
      <AppContext.Provider value={ctx}>
        <Suspense fallback={<div role="status" className="page">Loading…</div>}><ServicesApp /></Suspense>
        <VoiceControl floating />
        <Snackbar open={toastShow} message={toastMsg} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} />
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
              <ListItemButton key={n.id} selected={activeNav === n.id} aria-current={activeNav === n.id ? 'page' : undefined} className={activeNav === n.id ? 'active' : ''} onClick={() => go(n.id)}>
                <span className="ico">{n.ico}</span>{n.label}
              </ListItemButton>
            ))}
          </nav>
          <div className="navlabel">ECOURTS PORTAL (REFERENCE)</div>
          <nav className="nav" aria-label="eCourts portal reference">
            {PORTAL_NAV.map((n) => {
              const active = n.id === page || (n.id === 'portalHelp' && (USEFUL_LINKS.some((l) => l.page === page) || POLICY_PAGES.includes(page)))
              return n.url ? (
                <ExternalLink key={n.label} nav className="" href={n.url}><span className="ico">{n.ico}</span>{n.label}</ExternalLink>
              ) : (
                <ListItemButton key={n.label} selected={active} aria-current={active ? 'page' : undefined} className={active ? 'active' : ''} onClick={() => go(n.id!)}>
                  <span className="ico">{n.ico}</span>{n.label}
                </ListItemButton>
              )
            })}
          </nav>
          <div className="sidebottom">
            <Avatar sx={{ bgcolor: '#dbe6ff', color: '#2947a2', fontWeight: 700 }}>{auth.person ? auth.person.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'AK'}</Avatar>
            <div><strong>{auth.person ? auth.person.displayName : 'Adv. A. Kumar'}</strong><small>Advocate workspace</small></div>
          </div>
        </aside>
        <main className="main" id="main-content" tabIndex={-1}>
          <header className="topbar">
            <IconButton className="mobilemenu" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>☰</IconButton>
            <div className="search">
              <OutlinedInput fullWidth size="small" placeholder="Search matters, documents, authorities…" inputProps={{ 'aria-label': 'Search' }} onKeyDown={onSearch as never} />
            </div>
            <div className="topactions">
              <Button variant="outlined" size="small" className="hide-sm" onClick={() => go('calendar')}>◷ Upcoming: 3</Button>
              <VoiceControl />
              <DisplaySettings />
              <IconButton title="Notifications" aria-label="Notifications" onClick={showNotifications}>♧</IconButton>
              <Avatar title={auth.person?.displayName} sx={{ bgcolor: '#dbe6ff', color: '#2947a2', fontWeight: 700, width: 36, height: 36 }}>{(auth.person?.displayName ?? 'AK').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</Avatar>
              {auth.required && auth.status === 'in' && <Button size="small" variant="outlined" onClick={() => setSecurityOpen(true)}>Security</Button>}
              {auth.required && auth.status === 'in' && <Button size="small" variant="outlined" onClick={() => void auth.signOut()}>Sign out</Button>}
            </div>
          </header>
          <div className="page"><Suspense fallback={<div role="status">Loading…</div>}><Page /></Suspense></div>
        </main>
      </div>

      <Snackbar open={toastShow} message={toastMsg} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} />

      {securityOpen && <Security onClose={() => setSecurityOpen(false)} />}
      <Modal
        open={!!modal} onClose={() => setModal(null)} titleId="modal-title" title={modal?.title} closeLabel="Close dialog" onSubmit={submitModal}
        actions={<><Button variant="outlined" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" variant="contained">Save</Button></>}
      >
        {modal?.body}
      </Modal>
    </AppContext.Provider>
  )
}
