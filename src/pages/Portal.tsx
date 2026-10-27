import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useApp } from '../context'
import { Btn, Card, Notice, PageHead, Pill } from '../components/ui'
import ExternalLink from '../components/ExternalLink'
import type { PageId } from '../types'
import {
  COMMITTEE_EMAIL, DISTRICT_TOTALS, FORMS, HIGH_COURTS, LANGUAGES, OFFICIAL_HOME, PHASES, PORTAL_SNAPSHOT_DATE,
  PROJECT_GOALS, REFERENCES, SERVICES, SLIDES, SMS_FORMAT, SMS_NUMBER, STATS, STATES, USEFUL_LINKS,
  districtLink, formLink, highCourtsLink,
} from '../features/portal/data'
import { buildIndex, searchPortal } from '../features/portal/search'

function Shell({ title, sub, children }: { page?: PageId; title: string; sub: string; children: ReactNode }) {
  return (
    <>
      <div className="demobanner" role="note">
        <strong>Independent demonstration.</strong> This section reproduces the public information structure of the eCourts portal
        as reviewed on {PORTAL_SNAPSHOT_DATE}. It is not the official portal, is not affiliated with the Indian judiciary, and
        figures may be out of date. Verify everything on <ExternalLink href={OFFICIAL_HOME} className="linkbtn">ecourts.gov.in</ExternalLink>.
      </div>
      <div className="langrow">
        <label className="langsel tiny">
          <span className="sr-only">Language</span>
          <select aria-label="Language" defaultValue="English" onChange={(e) => { e.target.value = 'English' }}>
            {LANGUAGES.map((l) => <option key={l} disabled={l !== 'English'} title={l !== 'English' ? 'Translations are not available in this prototype' : undefined}>{l}</option>)}
          </select>
        </label>
      </div>
      <PageHead title={title} sub={sub} />
      {children}
    </>
  )
}

function Filter({ value, onChange, label, count }: { value: string; onChange: (v: string) => void; label: string; count: number }) {
  return (
    <div className="field">
      <label htmlFor="portal-filter">{label}</label>
      <input id="portal-filter" type="search" value={value} onChange={(e) => onChange(e.target.value)} />
      <span className="tiny muted" aria-live="polite">{count} shown</span>
    </div>
  )
}

/* ---------------------------------------------------------------- Home */

function Carousel() {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(!reduce)
  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => setI((n) => (n + 1) % SLIDES.length), 6000)
    return () => window.clearInterval(t)
  }, [playing])
  const s = SLIDES[i]
  return (
    <section className="feature-banner carousel" aria-roledescription="carousel" aria-label="Programme highlights">
      <div aria-live={playing ? 'off' : 'polite'} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`}>
        <div className="eyebrow" style={{ color: '#bdccff' }}>HIGHLIGHT {i + 1} / {SLIDES.length}</div>
        <h3>{s.title}</h3>
        <p>{s.text}</p>
      </div>
      <div className="carctl">
        <button className="btn small" aria-label="Previous slide" onClick={() => setI((n) => (n + SLIDES.length - 1) % SLIDES.length)}>‹</button>
        <button className="btn small" aria-label={playing ? 'Pause slideshow' : 'Play slideshow'} onClick={() => setPlaying((p) => !p)}>{playing ? 'Ⅱ' : '▶'}</button>
        <button className="btn small" aria-label="Next slide" onClick={() => setI((n) => (n + 1) % SLIDES.length)}>›</button>
      </div>
    </section>
  )
}

export function PortalHome() {
  const app = useApp()
  const { go, toast, openModal } = app

  const copySms = async () => {
    try { await navigator.clipboard.writeText(`${SMS_FORMAT} to ${SMS_NUMBER}`); toast('SMS format copied') }
    catch { toast('Copy is not available in this browser') }
  }

  return (
    <Shell page="portalHome" title="eCourts portal overview" sub="Services, statistics and citizen information, as listed on the public portal home page.">
      <div className="actions" style={{ marginBottom: 16 }}>
        <Btn kind="primary" onClick={() => openModal({
          title: 'Login with JanParichay',
          body: <Notice>Single sign-on is operated by the government and is not connected to this prototype. No credentials are collected here.</Notice>,
        })}>Login with JanParichay</Btn>
        <Btn to="caseStatus">Try case status (demo data)</Btn>
      </div>

      <Carousel />

      <div className="grid layout2" style={{ marginBottom: 18 }}>
        {STATS.map((g) => (
          <Card key={g.heading} title={g.heading}>
            <div className="quickgrid">
              {g.items.map((s) => (
                <div className="quick" key={s.label} style={{ cursor: 'default' }}>
                  <div className="num" style={{ fontSize: 24, fontWeight: 760 }}>{s.value}</div>
                  <small>{s.label}</small>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <p className="tiny muted" style={{ marginTop: -8, marginBottom: 18 }}>Counters are a snapshot from {PORTAL_SNAPSHOT_DATE}; the official portal may update them.</p>

      <Card title="Services">
        <div className="grid layout3">
          {SERVICES.map((s) => (
            <div className="result" key={s.id}>
              <h4>{s.name}</h4>
              <p>{s.description}</p>
              {s.target.kind === 'external' && <ExternalLink href={s.target.url}>Open official service ↗</ExternalLink>}
              {s.target.kind === 'internal' && <Btn className="small" onClick={() => go((s.target as { page: PageId }).page)}>Open</Btn>}
              {s.target.kind === 'none' && <Pill>No link on the official page</Pill>}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid layout2" style={{ marginTop: 18 }}>
        <Card title="References">
          <div className="list">
            {REFERENCES.map((r) => (
              <div className="listrow" key={r.title}>
                <div><strong>{r.title}</strong><small>PDF · {r.size}</small></div>
                <span className="pill" title="Download from the official portal">Official portal only</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="eCourts services app and SMS">
          <p>Mobile app for Android and iOS is listed on the portal (store links were not visible when reviewed).</p>
          <div className="sourcebox">
            <h4>Know your case status by return SMS</h4>
            <p>SMS <strong>{SMS_FORMAT}</strong> to <strong>{SMS_NUMBER}</strong>. Separate the word and the number with a space.</p>
          </div>
          <div className="actions" style={{ marginTop: 12 }}>
            <Btn kind="soft" onClick={copySms}>Copy SMS format</Btn>
          </div>
        </Card>
      </div>
    </Shell>
  )
}

/* --------------------------------------------------------------- About */

export function PortalAbout() {
  return (
    <Shell page="portalAbout" title="About the eCourts project" sub="Summary of the About page on the official portal.">
      <div className="grid layout2">
        <Card title="Background">
          <p>The eCourts project is based on the eCommittee of the Supreme Court of India's <em>National Policy and Action Plan for Implementation of Information and Communication Technology</em> in the judiciary.</p>
          <p>The Department of Justice, Ministry of Law and Justice, monitors and funds the project for District Courts; High Courts act as implementing agencies in their jurisdictions. The national portal was launched on 7 August 2013.</p>
          <h4>The project envisages</h4>
          <ul>{PROJECT_GOALS.map((g) => <li key={g}>{g}</li>)}</ul>
          <Notice>The portal states that its information is not meant as legal evidence and should be verified with the relevant authorities or records.</Notice>
        </Card>
        <Card title="Phases">
          <div className="timeline">
            {PHASES.map((p) => <div className="event" key={p.name}><strong>{p.name}</strong><small>{p.text}</small></div>)}
          </div>
        </Card>
      </div>
    </Shell>
  )
}

/* ---------------------------------------------------------- High Courts */

export function PortalHighCourts() {
  const [q, setQ] = useState('')
  const rows = HIGH_COURTS.filter((h) => `${h.name} ${h.jurisdiction}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Shell page="portalHighCourts" title="High Courts of India" sub={`${HIGH_COURTS.length} High Courts as listed on the portal, with their jurisdictions from the Contact page.`}>
      <Card>
        <Filter value={q} onChange={setQ} label="Filter by High Court or state" count={rows.length} />
        <div className="tablewrap">
          <table>
            <caption className="sr-only">High Courts</caption>
            <thead><tr><th scope="col">High Court</th><th scope="col">Jurisdiction</th></tr></thead>
            <tbody>{rows.map((h) => <tr key={h.name}><td><strong>{h.name}</strong></td><td>{h.jurisdiction}</td></tr>)}</tbody>
          </table>
          {rows.length === 0 && <div className="empty">No High Court matches “{q}”.</div>}
        </div>
        <p className="tiny muted">The portal page lists court names only; individual court websites were not visible when reviewed.</p>
        <ExternalLink href={highCourtsLink}>Open the official High Courts page ↗</ExternalLink>
      </Card>
    </Shell>
  )
}

/* ------------------------------------------------------ District Courts */

export function PortalDistrict() {
  const [q, setQ] = useState('')
  const rows = STATES.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <Shell page="portalDistrict" title="District Courts of India" sub={`Select a state or union territory. The portal reports ${DISTRICT_TOTALS.statedStatesAndUts} states/UTs and ${DISTRICT_TOTALS.districtCourts} district courts and special courts/tribunals, but lists ${DISTRICT_TOTALS.listedLinks} links; all are shown.`}>
      <Card>
        <Filter value={q} onChange={setQ} label="Filter states and union territories" count={rows.length} />
        <div className="grid layout3">
          {rows.map((s) => (
            <div className="listrow" key={s.code} style={{ borderTop: 0 }}>
              <strong>{s.name}</strong>
              <ExternalLink href={districtLink(s.code)}>Official page ↗</ExternalLink>
            </div>
          ))}
        </div>
        {rows.length === 0 && <div className="empty">No state or union territory matches “{q}”.</div>}
      </Card>
    </Shell>
  )
}

/* --------------------------------------------------------------- Forms */

export function PortalForms() {
  const [q, setQ] = useState('')
  const rows = FORMS.filter((f) => f.title.toLowerCase().includes(q.toLowerCase()))
  return (
    <Shell page="portalForms" title="Forms for Advocates" sub={`${FORMS.length} PDF forms listed on the portal. Files are hosted by the official site.`}>
      <Card>
        <Filter value={q} onChange={setQ} label="Filter forms" count={rows.length} />
        <div className="tablewrap">
          <table>
            <caption className="sr-only">Forms for advocates</caption>
            <thead><tr><th scope="col">Form</th><th scope="col">Format</th><th scope="col">Size</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.file}><td><strong>{f.title}</strong></td><td>PDF</td><td>{f.size}</td>
                  <td><ExternalLink href={formLink(f.file)}>Open on official site ↗</ExternalLink></td></tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty">No form matches “{q}”.</div>}
        </div>
        <Notice>File addresses were derived from the relative links on the forms page and not individually tested. If a file does not open, use the forms page on the official portal.</Notice>
      </Card>
    </Shell>
  )
}

/* ------------------------------------------------------------- Contact */

export function PortalContact() {
  const [q, setQ] = useState('')
  const rows = HIGH_COURTS.filter((h) => `${h.name} ${h.jurisdiction}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Shell page="portalContact" title="Contact" sub="The portal lists one general e-mail and the Central Project Coordinator (CPC) of each High Court.">
      <div className="grid layout2">
        <Card title="Contacts by High Court">
          <Filter value={q} onChange={setQ} label="Filter by High Court or state" count={rows.length} />
          <div className="tablewrap">
            <table>
              <caption className="sr-only">High Court CPC contacts</caption>
              <thead><tr><th scope="col">High Court</th><th scope="col">Jurisdiction</th><th scope="col">CPC e-mail</th></tr></thead>
              <tbody>{rows.map((h) => <tr key={h.name}><td><strong>{h.name}</strong></td><td>{h.jurisdiction}</td><td>{h.cpcEmail}</td></tr>)}</tbody>
            </table>
            {rows.length === 0 && <div className="empty">No High Court matches “{q}”.</div>}
          </div>
        </Card>
        <Card title="General">
          <div className="sourcebox"><h4>e-Committee, Supreme Court of India</h4><p>{COMMITTEE_EMAIL}</p></div>
          <Notice>Addresses are shown in the portal's anti-spam form: replace [at] with @ and [dot] with a full stop. CPC contacts are for issues with case-data availability or updates. The portal lists no postal address or phone number, and has no contact form.</Notice>
        </Card>
      </div>
    </Shell>
  )
}

/* ----------------------------------------------------------------- Help */

export function PortalHelp() {
  return (
    <Shell page="portalHelp" title="Help, policies and accessibility" sub="Useful links listed in the footer of the official portal.">
      <div className="grid layout2">
        <Card title="Useful links on the official portal">
          <ul className="linklist">{USEFUL_LINKS.map((l) => <li key={l}>{l}</li>)}</ul>
          <Notice>Destination addresses for these pages could not be confirmed (two guessed addresses returned errors), so they are listed by name only. Find them in the footer of <ExternalLink href={OFFICIAL_HOME} className="linkbtn">the official portal</ExternalLink>.</Notice>
        </Card>
        <Card title="Accessibility in this prototype">
          <p>The <strong>Aa</strong> button in the top bar offers: text size (A−, A, A+), high contrast, invert, grayscale, highlight links, wider text spacing, taller line height, hide images, big cursor, and reset. A skip link is available at the start of every page. Choices are remembered in this browser.</p>
          <p className="muted tiny">The official portal also offers a screen reader access page and an accessibility statement; those are not reproduced here.</p>
        </Card>
      </div>
    </Shell>
  )
}

/* --------------------------------------------------------------- Search */

export function PortalSearch() {
  const { go } = useApp()
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')
  const index = useMemo(buildIndex, [])
  const hits = useMemo(() => searchPortal(submitted, index), [submitted, index])
  return (
    <Shell page="portalSearch" title="Search this site" sub="Searches services, courts, forms and pages in this demonstration. It does not search case records.">
      <Card>
        <form role="search" onSubmit={(e) => { e.preventDefault(); setSubmitted(q) }}>
          <div className="field">
            <label htmlFor="psq">Search the portal</label>
            <input id="psq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. vakalatnama, Madras, ePay" />
          </div>
          <button className="btn primary" type="submit">Search</button>
        </form>
        <div style={{ marginTop: 16 }} aria-live="polite">
          {submitted && hits.length === 0 && <div className="empty">No results for “{submitted}”.</div>}
          {hits.length > 0 && <p className="tiny muted">{hits.length} result{hits.length === 1 ? '' : 's'}</p>}
          <div className="list">
            {hits.slice(0, 50).map((h) => (
              <div className="listrow" key={h.id}>
                <div><strong>{h.title}</strong><small>{h.description}</small></div>
                <div className="actions">
                  <Pill>{h.kind}</Pill>
                  {h.page && <Btn className="small" onClick={() => go(h.page!)}>Open</Btn>}
                  {h.url && <ExternalLink href={h.url}>Official ↗</ExternalLink>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Shell>
  )
}
