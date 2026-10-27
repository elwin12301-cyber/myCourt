import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import DisplaySettings from '../../components/DisplaySettings'
import ExternalLink from '../../components/ExternalLink'
import { Card } from '../../components/ui'
import { EyebrowContext } from '../../components/chrome'
import { AppContext, useApp } from '../../context'
import { PARTNERS } from '../../features/portal/data'
import {
  APP_BADGES, APP_LINE, DEFAULT_SLUG, FOOTER_LINKS, KEYBOARD_TIP, NOTICE_TEXT, SEARCH_MENU, SITE_FACTS, SLUG_TITLES, SVC_LANGUAGES,
  SVC_MAIN_MENU, SVC_SLUGS, THEME_OPTIONS, TOP_LINKS, TOPBAR_OPTIONS, USAGE_WARNING, USAGE_WARNING_NOTE, type SvcMenuItem, type SvcSlug,
} from '../../features/services/data'
import { DEFAULT_PREFS, loadPrefs, savePrefs, themeClasses, type SitePrefs, type ThemeColor, type Topbar } from '../../features/services/prefs'
import { servicesHash, servicesSlugFromHash } from '../../router'
import type { PageId } from '../../types'
import CauseListPage from '../CauseList'
import CaseStatusPage from '../CaseStatus'
import CourtOrdersPage from '../CourtOrders'
import CaveatSearch from './CaveatSearch'
import {
  AboutPage, ContactPage, FormsPage, HelpVideosPage, HighCourtsPage, NewsletterPage, PolicyPage, ScreenReaderPage, SiteMapPage, WebInfoPage,
} from './InfoPages'
import SiteSearch from './SiteSearch'
import CnrHome from './CnrHome'
import LocationPage from './LocationPage'
import ProcessDetails from './ProcessDetails'

const ICONS: Record<string, string> = {
  cnr: '▣', 'case-status': '⚑', 'court-orders': '❏', 'cause-list': '☷', caveat: '⛉', process: '⇄', location: '⌖',
}
const ALL_BUT_CNR = ['party', 'caseNumber', 'filingNumber', 'advocate', 'fir', 'act', 'caseType'] as const
/** Workspace pages that live inside the site; links from reused pages are redirected to the site's own addresses. */
const SLUG_FOR_PAGE: Partial<Record<PageId, SvcSlug>> = { caseStatus: 'case-status', causeList: 'cause-list', courtOrders: 'court-orders' }

const readSlug = (): SvcSlug =>
  (typeof window === 'undefined' ? DEFAULT_SLUG : servicesSlugFromHash(window.location.hash, SVC_SLUGS, DEFAULT_SLUG)) as SvcSlug

function Pending({ slug, note }: { slug: SvcSlug; note?: string }) {
  return <Card title={SLUG_TITLES[slug]}><p className="muted">This page is not available.{note ? ` ${note}` : ''}</p></Card>
}

function ThemePanel({ prefs, set, onClose }: { prefs: SitePrefs; set: (p: SitePrefs) => void; onClose: () => void }) {
  return (
    <div className="svc-themepanel" role="dialog" aria-label="Theme Customizer" onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <fieldset>
        <legend>Topbar Color</legend>
        {TOPBAR_OPTIONS.map((o) => (
          <label key={o}><input type="radio" name="topbar" checked={prefs.topbar === o} onChange={() => set({ ...prefs, topbar: o as Topbar })} /> {o}</label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Theme Color</legend>
        {THEME_OPTIONS.map((o) => (
          <label key={o}><input type="radio" name="themecolor" checked={prefs.theme === o} onChange={() => set({ ...prefs, theme: o as ThemeColor })} /> {o}</label>
        ))}
      </fieldset>
      <div className="actions">
        <button type="button" className="btn small" onClick={() => set({ ...prefs, topbar: DEFAULT_PREFS.topbar, theme: DEFAULT_PREFS.theme })}>Reset theme</button>
        <button type="button" className="btn small" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

export default function ServicesApp({ initialSlug }: { initialSlug?: SvcSlug } = {}) {
  const app = useApp()
  const [slug, setSlug] = useState<SvcSlug>(() => initialSlug ?? readSlug())
  const [prefs, setPrefs] = useState<SitePrefs>(() => loadPrefs())
  const [themeOpen, setThemeOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [siteQuery, setSiteQuery] = useState('')

  const navigate = useCallback((s: SvcSlug) => {
    setSlug(s)
    if (typeof window !== 'undefined') {
      if (window.location.hash !== servicesHash(s)) window.location.hash = servicesHash(s)
      window.scrollTo(0, 0)
    }
  }, [])
  const back = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) window.history.back()
    else navigate(DEFAULT_SLUG)
  }, [navigate])

  useEffect(() => {
    const onHash = () => setSlug(readSlug())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => { savePrefs(prefs) }, [prefs])
  useEffect(() => {
    const before = document.title
    document.title = `${SLUG_TITLES[slug]} - eCourts Services (demonstration)`
    return () => { document.title = before }
  }, [slug])

  const mapped = useMemo(() => ({
    ...app,
    go: (p: PageId) => { const s = SLUG_FOR_PAGE[p]; if (s) navigate(s); else app.go(p) },
  }), [app, navigate])

  const submitSearch = (e: FormEvent) => { e.preventDefault(); setSiteQuery(query); navigate('search') }

  const menuItem = (m: SvcMenuItem) => m.url
    ? <ExternalLink key={m.label} href={m.url} className="svc-link">{m.label}</ExternalLink>
    : <button key={m.label} type="button" aria-current={slug === m.slug ? 'page' : undefined} onClick={() => navigate(m.slug!)}>{m.label}</button>

  const renderPage = (): ReactNode => {
    switch (slug) {
      case 'cnr': return <CnrHome onHelp={() => navigate('help-videos')} onBack={back} />
      case 'case-status': return <CaseStatusPage modes={[...ALL_BUT_CNR]} submitLabel="Go" hideOtherServices onBack={() => navigate('cnr')} />
      case 'court-orders': return <CourtOrdersPage hideOtherServices />
      case 'cause-list': return <CauseListPage />
      case 'caveat': return <CaveatSearch onBack={back} />
      case 'process': return <ProcessDetails onBack={back} />
      case 'location': return <LocationPage onBack={back} />
      case 'high-courts': return <HighCourtsPage />
      case 'contact': return <ContactPage />
      case 'about': return <AboutPage />
      case 'newsletter': return <NewsletterPage />
      case 'forms': return <FormsPage />
      case 'help-videos': return <HelpVideosPage />
      case 'web-info': return <WebInfoPage />
      case 'copyright': case 'hyperlinking': case 'accessibility': case 'disclaimer': return <PolicyPage slug={slug} />
      case 'screen-reader': return <ScreenReaderPage />
      case 'site-map': return <SiteMapPage navigate={navigate} />
      case 'search': return <SiteSearch key={siteQuery} query={siteQuery} navigate={navigate} />
      default: return <Pending slug={slug} />
    }
  }

  const isService = SEARCH_MENU.some((m) => m.slug === slug)

  return (
    <div className={`svc ${themeClasses(prefs)}`}>
      <a className="skip" href="#svc-main">Skip to main content</a>
      <div className="protobar" role="note">Independent demonstration of the eCourts services site structure · fictional data · not affiliated with the judiciary</div>

      <div className="svc-top">
        <div className="svc-tools">
          {TOP_LINKS.map((l) => <ExternalLink key={l.label} href={l.url!} className="svc-link">{l.label}</ExternalLink>)}
          <button type="button" className="iconbtn" onClick={() => app.go('dashboard')}>← Back to myCourt workspace</button>
        </div>
        <div className="svc-tools">
          <label>
            <span className="sr-only">Select language</span>
            <select value={prefs.language} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}>
              {SVC_LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <DisplaySettings label="Accessibility options" />
          <div className="svc-theme">
            <button type="button" className="iconbtn" aria-expanded={themeOpen} onClick={() => setThemeOpen((o) => !o)}>⚙<span className="sr-only"> Theme Customizer</span></button>
            {themeOpen && <ThemePanel prefs={prefs} set={setPrefs} onClose={() => setThemeOpen(false)} />}
          </div>
          <form className="svc-search" role="search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="svc-q">Search this site</label>
            <input id="svc-q" type="search" placeholder="Search this site" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="submit" className="btn small">Search</button>
          </form>
        </div>
      </div>

      <header className="svc-head">
        <div className="svc-brand">
          <div className="brandmark">eC</div>
          <div>
            <h1>eCourts Services</h1>
            <p>District and Taluka Courts of India</p>
            <small>Demonstration prototype</small>
          </div>
        </div>
        <div className="svc-app">
          <span>{APP_LINE}</span>
          {APP_BADGES.map((b) => <span key={b} className="pill">{b}</span>)}
        </div>
      </header>

      {!prefs.noticeDismissed && (
        <div className="svc-notice" role="status">
          <span>{NOTICE_TEXT}</span>
          <button type="button" className="btn small" onClick={() => setPrefs({ ...prefs, noticeDismissed: true })}>Dismiss</button>
        </div>
      )}
      {prefs.language !== 'English' && (
        <div className="svc-notice" role="status">Translation into {prefs.language} is not available in this prototype; the pages stay in English.</div>
      )}

      <nav className="svc-menu" aria-label="Main menu">{SVC_MAIN_MENU.map(menuItem)}</nav>

      <div className="svc-body">
        <aside className="svc-side" aria-label="Search Menu">
          <h2>Search Menu</h2>
          <nav>
            {SEARCH_MENU.map((m) => (
              <button key={m.label} type="button" data-ico={ICONS[m.slug!]} aria-current={slug === m.slug ? 'page' : undefined} onClick={() => navigate(m.slug!)}>{m.label}</button>
            ))}
          </nav>
        </aside>

        <main id="svc-main" tabIndex={-1}>
          {slug !== 'cnr' && (
            <nav className="svc-crumbs" aria-label="Breadcrumb">
              <ol>
                <li><button type="button" onClick={() => navigate('cnr')}>Home</button></li>
                <li aria-current="page">{SLUG_TITLES[slug]}</li>
              </ol>
            </nav>
          )}
          {slug === 'cnr' && <p className="svc-usage">{USAGE_WARNING}. <em>{USAGE_WARNING_NOTE}</em></p>}
          <EyebrowContext.Provider value="eCourts Services">
            <AppContext.Provider value={mapped}>{renderPage()}</AppContext.Provider>
          </EyebrowContext.Provider>
          {isService && <p className="tiny muted" style={{ marginTop: 14 }}>{KEYBOARD_TIP}</p>}
        </main>
      </div>

      <footer className="svc-foot">
        <h2>Useful Links</h2>
        <ul>{FOOTER_LINKS.map((l) => <li key={l.label}><button type="button" className="svc-link" onClick={() => navigate(l.slug!)}>{l.label}</button></li>)}</ul>
        <p>As stated on the official site: {SITE_FACTS.owner} {SITE_FACTS.host}</p>
        <p>Official site last updated: {SITE_FACTS.lastUpdated} · Version: {SITE_FACTS.version}</p>
        <p>Follow Us <ExternalLink href={SITE_FACTS.youtube} className="svc-link">YouTube</ExternalLink></p>
        <p>{PARTNERS.map((p) => <span key={p.name}><ExternalLink href={p.url} className="svc-link">{p.name}</ExternalLink>{' '}</span>)}</p>
      </footer>
    </div>
  )
}
