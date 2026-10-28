import { useCallback, useEffect, useMemo, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react'
import DisplaySettings from '../../components/DisplaySettings'
import ExternalLink from '../../components/ExternalLink'
import { Card, Btn, Input, Select } from '../../components/ui'
import { EyebrowContext } from '../../components/chrome'
import { AppContext, useApp } from '../../context'
import { PARTNERS } from '../../features/portal/data'
import {
  APP_BADGES, APP_LINE, DEFAULT_SLUG, FOOTER_LINKS, KEYBOARD_TIP, NOTICE_TEXT, SEARCH_MENU, SITE_FACTS, SLUG_TITLES, SVC_LANGUAGES,
  SVC_MAIN_MENU, SVC_SLUGS, THEME_OPTIONS, TOP_LINKS, TOPBAR_OPTIONS, USAGE_WARNING, USAGE_WARNING_NOTE, type SvcMenuItem, type SvcSlug,
} from '../../features/services/data'
import { DEFAULT_PREFS, loadPrefs, savePrefs, themeClasses, type SitePrefs, type ThemeColor, type Topbar } from '../../features/services/prefs'
import { formatDateLong, I18nProvider, useT } from '../../i18n/context'
import { langFromLabel, type LangCode } from '../../i18n/core'
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

const MT_NOTICE = 'This text is machine-translated and has not been reviewed by a native speaker. The English text is authoritative; do not rely on the translation for legal matters.'
const MT_NOTICE_EN = 'Machine translation: not reviewed by a native speaker. The English text is authoritative; do not rely on the translation for legal matters.'

const readSlug = (): SvcSlug =>
  (typeof window === 'undefined' ? DEFAULT_SLUG : servicesSlugFromHash(window.location.hash, SVC_SLUGS, DEFAULT_SLUG)) as SvcSlug

function Pending({ slug, note }: { slug: SvcSlug; note?: string }) {
  const t = useT()
  return <Card title={t(SLUG_TITLES[slug])}><p className="muted">{t('This page is not available.')}{note ? ` ${note}` : ''}</p></Card>
}

function ThemePanel({ prefs, set, onClose }: { prefs: SitePrefs; set: (p: SitePrefs) => void; onClose: () => void }) {
  const t = useT()
  return (
    <div className="svc-themepanel" role="dialog" aria-label={t('Theme Customizer')} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <fieldset>
        <legend>{t('Topbar Color')}</legend>
        {TOPBAR_OPTIONS.map((o) => (
          <label key={o}><input type="radio" name="topbar" checked={prefs.topbar === o} onChange={() => set({ ...prefs, topbar: o as Topbar })} /> {t(o)}</label>
        ))}
      </fieldset>
      <fieldset>
        <legend>{t('Theme Color')}</legend>
        {THEME_OPTIONS.map((o) => (
          <label key={o}><input type="radio" name="themecolor" checked={prefs.theme === o} onChange={() => set({ ...prefs, theme: o as ThemeColor })} /> {t(o)}</label>
        ))}
      </fieldset>
      <div className="actions">
        <Btn type="button" kind="small" onClick={() => set({ ...prefs, topbar: DEFAULT_PREFS.topbar, theme: DEFAULT_PREFS.theme })}>{t('Reset theme')}</Btn>
        <Btn type="button" kind="small" onClick={onClose}>{t('Close')}</Btn>
      </div>
    </div>
  )
}

interface ShellProps { initialSlug?: SvcSlug; prefs: SitePrefs; setPrefs: Dispatch<SetStateAction<SitePrefs>>; lang: LangCode }

function Shell({ initialSlug, prefs, setPrefs, lang }: ShellProps) {
  const app = useApp()
  const t = useT()
  const [slug, setSlug] = useState<SvcSlug>(() => initialSlug ?? readSlug())
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
  useEffect(() => {
    const before = document.title
    document.title = `${t(SLUG_TITLES[slug])} - ${t('eCourts Services (demonstration)')}`
    return () => { document.title = before }
  }, [slug, t])

  const mapped = useMemo(() => ({
    ...app,
    go: (p: PageId) => { const s = SLUG_FOR_PAGE[p]; if (s) navigate(s); else app.go(p) },
  }), [app, navigate])

  const submitSearch = (e: FormEvent) => { e.preventDefault(); setSiteQuery(query); navigate('search') }

  const menuItem = (m: SvcMenuItem) => m.url
    ? <ExternalLink key={m.label} href={m.url} className="svc-link">{t(m.label)}</ExternalLink>
    : <button key={m.label} type="button" aria-current={slug === m.slug ? 'page' : undefined} onClick={() => navigate(m.slug!)}>{t(m.label)}</button>

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
    <div className={`svc ${themeClasses(prefs)}`} lang={lang}>
      <a className="skip" href="#svc-main">{t('Skip to main content')}</a>
      <div className="protobar" role="note">{t('Independent demonstration of the eCourts services site structure · fictional data · not affiliated with the judiciary')}</div>

      <div className="svc-top">
        <div className="svc-tools">
          {TOP_LINKS.map((l) => <ExternalLink key={l.label} href={l.url!} className="svc-link">{t(l.label)}</ExternalLink>)}
          <button type="button" className="iconbtn" onClick={() => app.go('dashboard')}>{t('← Back to myCourt workspace')}</button>
        </div>
        <div className="svc-tools">
          <label>
            <span className="sr-only">{t('Select language')}</span>
            <Select value={prefs.language} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}>
              {SVC_LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </Select>
          </label>
          <DisplaySettings label={t('Accessibility options')} />
          <div className="svc-theme">
            <button type="button" className="iconbtn" aria-expanded={themeOpen} onClick={() => setThemeOpen((o) => !o)}>⚙<span className="sr-only"> {t('Theme Customizer')}</span></button>
            {themeOpen && <ThemePanel prefs={prefs} set={setPrefs} onClose={() => setThemeOpen(false)} />}
          </div>
          <form className="svc-search" role="search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="svc-q">{t('Search this site')}</label>
            <Input id="svc-q" type="search" placeholder={t('Search this site')} value={query} onChange={(e) => setQuery(e.target.value)} />
            <Btn type="submit" kind="small">{t('Search')}</Btn>
          </form>
        </div>
      </div>

      <header className="svc-head">
        <div className="svc-brand">
          <div className="brandmark">eC</div>
          <div>
            <h1>{t('eCourts Services')}</h1>
            <p>{t('District and Taluka Courts of India')}</p>
            <small>{t('Demonstration prototype')}</small>
          </div>
        </div>
        <div className="svc-app">
          <span>{t(APP_LINE)}</span>
          {APP_BADGES.map((b) => <span key={b} className="pill">{b}</span>)}
        </div>
      </header>

      {!prefs.noticeDismissed && (
        <div className="svc-notice" role="status">
          <span>{t(NOTICE_TEXT)}</span>
          <Btn type="button" kind="small" onClick={() => setPrefs({ ...prefs, noticeDismissed: true })}>{t('Dismiss')}</Btn>
        </div>
      )}
      {lang !== 'en' && (
        <div className="svc-notice" role="status">
          <span>{t(MT_NOTICE)}<br /><span lang="en">{MT_NOTICE_EN}</span></span>
        </div>
      )}

      <nav className="svc-menu" id="svc-mainmenu" aria-label={t('Main menu')}>{SVC_MAIN_MENU.map(menuItem)}</nav>

      <div className="svc-body">
        <aside className="svc-side" id="svc-sidebar" aria-label={t('Search Menu')}>
          <h2>{t('Search Menu')}</h2>
          <nav>
            {SEARCH_MENU.map((m) => (
              <button key={m.label} type="button" data-ico={ICONS[m.slug!]} aria-current={slug === m.slug ? 'page' : undefined} onClick={() => navigate(m.slug!)}>{t(m.label)}</button>
            ))}
          </nav>
        </aside>

        <main id="svc-main" tabIndex={-1}>
          {slug !== 'cnr' && (
            <nav className="svc-crumbs" aria-label={t('Breadcrumb')}>
              <ol>
                <li><button type="button" onClick={() => navigate('cnr')}>{t('Home')}</button></li>
                <li aria-current="page">{t(SLUG_TITLES[slug])}</li>
              </ol>
            </nav>
          )}
          {slug === 'cnr' && <p className="svc-usage">{t(USAGE_WARNING)}. <em>{t(USAGE_WARNING_NOTE)}</em></p>}
          <EyebrowContext.Provider value={t('eCourts Services')}>
            <AppContext.Provider value={mapped}>{renderPage()}</AppContext.Provider>
          </EyebrowContext.Provider>
          {isService && <p className="tiny muted" style={{ marginTop: 14 }}>{t(KEYBOARD_TIP)}</p>}
        </main>
      </div>

      <footer className="svc-foot">
        <h2>{t('Useful Links')}</h2>
        <ul>{FOOTER_LINKS.map((l) => <li key={l.label}><button type="button" className="svc-link" onClick={() => navigate(l.slug!)}>{t(l.label)}</button></li>)}</ul>
        <p>{t('As stated on the official site:')} {t(SITE_FACTS.owner)} {t(SITE_FACTS.host)}</p>
        <p>{t('Official site last updated: {date} · Version: {version}', { date: formatDateLong('2026-01-02', lang), version: SITE_FACTS.version })}</p>
        <p>{t('Follow Us')} <ExternalLink href={SITE_FACTS.youtube} className="svc-link">YouTube</ExternalLink></p>
        <p>{PARTNERS.map((p) => <span key={p.name}><ExternalLink href={p.url} className="svc-link">{t(p.name)}</ExternalLink>{' '}</span>)}</p>
      </footer>
    </div>
  )
}

/** Holds the site preferences (including the language) and provides the language to every component below. */
export default function ServicesApp({ initialSlug, initialLanguage }: { initialSlug?: SvcSlug; initialLanguage?: string } = {}) {
  const [prefs, setPrefs] = useState<SitePrefs>(() => {
    const p = loadPrefs()
    return initialLanguage ? { ...p, language: initialLanguage } : p
  })
  useEffect(() => { savePrefs(prefs) }, [prefs])
  const lang = langFromLabel(prefs.language)
  useEffect(() => {
    const before = document.documentElement.lang
    document.documentElement.lang = lang
    return () => { document.documentElement.lang = before }
  }, [lang])

  return (
    <I18nProvider lang={lang}>
      <Shell initialSlug={initialSlug} prefs={prefs} setPrefs={setPrefs} lang={lang} />
    </I18nProvider>
  )
}
