import ExternalLink from '../../components/ExternalLink'
import { Btn, Card, Notice, PageHead, Pill } from '../../components/ui'
import { FORMS, NEWSLETTERS, SCREEN_READERS, WEB_INFO, formLink, POLICIES } from '../../features/portal/data'
import {
  ABOUT, CONTACT_DISCREPANCY, CONTACT_EMAIL, CONTACT_NOTE, CONTACT_ROWS, HC_SITES, HELP_VIDEOS, SITE_MAP_GROUPS, SLUG_TITLES, type SvcSlug,
} from '../../features/services/data'
import type { PageId } from '../../types'

const FromPortal = () => (
  <Notice>Content shown here comes from the main eCourts portal (ecourts.gov.in). The services-site version of this page was not read, so it may differ.</Notice>
)

export function HighCourtsPage() {
  return (
    <>
      <PageHead title="High Courts" sub="E-Courts : High Courts. Each link opens the court's own website after an exit alert." />
      <Card>
        <div className="list">
          {HC_SITES.map((h, i) => (
            <div className="listrow" key={h.name}>
              <div><strong>{i + 1}. {h.name}</strong><small>{h.url}</small></div>
              <ExternalLink href={h.url}>Open website ↗</ExternalLink>
            </div>
          ))}
        </div>
        <p className="tiny muted">Addresses are exactly as the official page lists them; several use http. Court websites are run by the courts themselves.</p>
      </Card>
    </>
  )
}

export function ContactPage() {
  return (
    <>
      <PageHead title="Contact Us" sub="E-Courts : Contact Us. E-Committee, Supreme Court of India." />
      <div className="grid layout2" style={{ alignItems: 'start', marginBottom: 18 }}>
        <Card title="E-Committee Supreme Court of India">
          <div className="sourcebox"><h4>E-mail</h4><p>{CONTACT_EMAIL}</p></div>
          <Notice>Addresses are shown in the portal&apos;s anti-spam form: replace [at] with @ and [dot] with a full stop. The page lists no postal address, phone number or contact form.</Notice>
        </Card>
        <Card title="Who to contact">
          <p>{CONTACT_NOTE}</p>
        </Card>
      </div>
      <Card title="Contact Information">
        <div className="tablewrap">
          <table>
            <caption className="sr-only">High Court coordinator contacts</caption>
            <thead><tr><th scope="col">Sr. No.</th><th scope="col">High Court</th><th scope="col">Jurisdiction (State/UTs)</th><th scope="col">Contact</th></tr></thead>
            <tbody>
              {CONTACT_ROWS.map((c, i) => (
                <tr key={c.name}><td>{i + 1}</td><td><strong>{c.name}</strong></td><td>{c.jurisdiction}</td><td className="nowrap">{c.cpcEmail}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <Notice>{CONTACT_DISCREPANCY}</Notice>
      </Card>
    </>
  )
}

export function AboutPage() {
  return (
    <>
      <PageHead title="About Us" sub="E-Courts : About Us." />
      <div className="grid layout2" style={{ alignItems: 'start' }}>
        <Card title="The project">
          <p>{ABOUT.origin}</p>
          <p>{ABOUT.funding}</p>
          <h4>The Project Envisages</h4>
          <ol>{ABOUT.envisages.map((g) => <li key={g}>{g}</li>)}</ol>
          <p>{ABOUT.portal}</p>
          <Notice>This is a paraphrased summary of the official page; read the official page for the authoritative text.</Notice>
        </Card>
        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title="Phase-I"><p>{ABOUT.phase1}</p></Card>
          <Card title="Phase II"><p>{ABOUT.phase2}</p></Card>
          <Card title="Key facts">
            <div className="list">
              {ABOUT.facts.map(([k, v]) => <div className="listrow" key={k}><span>{k}</span><strong style={{ textAlign: 'right' }}>{v}</strong></div>)}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

export function NewsletterPage() {
  return (
    <>
      <PageHead title="Newsletter" sub={`${NEWSLETTERS.length} eCommittee newsletter issues, March to December 2016.`} />
      <Card>
        <div className="list">
          {NEWSLETTERS.map((n) => (
            <div className="listrow" key={n.url}><div><strong>{n.title}</strong><small>{n.date} · PDF</small></div><ExternalLink href={n.url}>Open PDF ↗</ExternalLink></div>
          ))}
        </div>
        <FromPortal />
      </Card>
    </>
  )
}

export function FormsPage() {
  return (
    <>
      <PageHead title="Forms for Advocates" sub={`${FORMS.length} PDF forms. Files are hosted by the official site.`} />
      <Card>
        <div className="tablewrap">
          <table>
            <caption className="sr-only">Forms for advocates</caption>
            <thead><tr><th scope="col">Form</th><th scope="col">Format</th><th scope="col">Size</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
            <tbody>
              {FORMS.map((f) => (
                <tr key={f.file}><td><strong>{f.title}</strong></td><td>PDF</td><td>{f.size}</td><td><ExternalLink href={formLink(f.file)}>Open on official site ↗</ExternalLink></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <FromPortal />
        <p className="tiny muted">File addresses were derived from the relative links on the forms page and not individually tested.</p>
      </Card>
    </>
  )
}

export function HelpVideosPage() {
  return (
    <>
      <PageHead title="Help Videos" sub={`${HELP_VIDEOS.length} help videos are listed on the official portal.`} />
      <Card>
        <ol className="svc-linklist" style={{ columns: 1 }}>{HELP_VIDEOS.map((v) => <li key={v}>{v}</li>)}</ol>
        <Notice>The official page lists these titles but showed no video addresses, so the videos cannot be played from here.</Notice>
        <FromPortal />
      </Card>
    </>
  )
}

export function WebInfoPage() {
  return (
    <>
      <PageHead title="Web Information Manager" sub="The contact role responsible for the web information of the portal." />
      <Card>
        <div className="sourcebox"><h4>{WEB_INFO.designation}</h4><p>{WEB_INFO.department}</p><p>{WEB_INFO.email}</p></div>
        <Notice>The official page also names an individual; the name is deliberately not reproduced here. Replace [at] with @ and [dot] with a full stop.</Notice>
        <FromPortal />
      </Card>
    </>
  )
}

const POLICY_FOR_SLUG: Partial<Record<SvcSlug, PageId>> = {
  copyright: 'portalCopyright', hyperlinking: 'portalHyperlink', accessibility: 'portalAccessibility', disclaimer: 'portalDisclaimer',
}

export function PolicyPage({ slug }: { slug: SvcSlug }) {
  const p = POLICY_FOR_SLUG[slug] ? POLICIES[POLICY_FOR_SLUG[slug]!] : undefined
  return (
    <>
      <PageHead title={SLUG_TITLES[slug]} sub="A paraphrased summary of the official page." />
      <Card>
        <ul>{(p?.bullets ?? []).map((b) => <li key={b} style={{ marginBottom: 8 }}>{b}</li>)}</ul>
        <Notice>This is a short paraphrase, not the policy text. Read the official page for the authoritative wording.</Notice>
        <FromPortal />
      </Card>
    </>
  )
}

export function ScreenReaderPage() {
  return (
    <>
      <PageHead title="Screen Reader Access" sub="Assistive technologies the official portal lists as compatible." />
      <Card>
        <div className="tablewrap">
          <table>
            <caption className="sr-only">Screen readers</caption>
            <thead><tr><th scope="col">#</th><th scope="col">Screen reader</th><th scope="col">Vendor site</th><th scope="col">Usage</th></tr></thead>
            <tbody>
              {SCREEN_READERS.map((s, i) => (
                <tr key={s.name}><td>{i + 1}</td><td><strong>{s.name}</strong></td><td>{s.site}</td><td><Pill kind={s.usage === 'Free' ? 'green' : ''}>{s.usage}</Pill></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <FromPortal />
      </Card>
    </>
  )
}

export function SiteMapPage({ navigate }: { navigate: (s: SvcSlug) => void }) {
  return (
    <>
      <PageHead title="Site map" sub="A map of this demonstration site." />
      <div className="grid layout3" style={{ alignItems: 'start' }}>
        {SITE_MAP_GROUPS.map((g) => (
          <Card key={g.heading} title={g.heading}>
            <div className="list">
              {g.items.map((m) => (
                <div className="listrow" key={m.label}>
                  <strong>{m.label}</strong>
                  {m.slug ? <Btn className="small" onClick={() => navigate(m.slug!)}>Open</Btn> : <ExternalLink href={m.url!}>External ↗</ExternalLink>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Notice>This is this prototype&apos;s own map of its pages. The official site map was not read from the services site.</Notice>
    </>
  )
}
