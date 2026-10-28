import ExternalLink from '../../components/ExternalLink'
import { Btn, Card, Notice, PageHead, Pill, Table, TableBody, TableCell, TableHead, TableRow } from '../../components/ui'
import { FORMS, NEWSLETTERS, SCREEN_READERS, WEB_INFO, formLink, POLICIES } from '../../features/portal/data'
import {
  ABOUT, CONTACT_DISCREPANCY, CONTACT_EMAIL, CONTACT_NOTE, CONTACT_ROWS, HC_SITES, HELP_VIDEOS, SITE_MAP_GROUPS, SLUG_TITLES, type SvcSlug,
} from '../../features/services/data'
import { useT } from '../../i18n/context'
import type { PageId } from '../../types'

const FromPortal = () => {
  const t = useT()
  return <Notice>{t('Content shown here comes from the main eCourts portal (ecourts.gov.in). The services-site version of this page was not read, so it may differ.')}</Notice>
}

export function HighCourtsPage() {
  const t = useT()
  return (
    <>
      <PageHead title="High Courts" sub="E-Courts : High Courts. Each link opens the court's own website after an exit alert." />
      <Card>
        <div className="list">
          {HC_SITES.map((h, i) => (
            <div className="listrow" key={h.name}>
              <div><strong>{`${i + 1}. ${t(h.name)}`}</strong><small>{h.url}</small></div>
              <ExternalLink href={h.url}>{t('Open website ↗')}</ExternalLink>
            </div>
          ))}
        </div>
        <p className="tiny muted">{t('Addresses are exactly as the official page lists them; several use http. Court websites are run by the courts themselves.')}</p>
      </Card>
    </>
  )
}

export function ContactPage() {
  const t = useT()
  return (
    <>
      <PageHead title="Contact Us" sub="E-Courts : Contact Us. E-Committee, Supreme Court of India." />
      <div className="grid layout2" style={{ alignItems: 'start', marginBottom: 18 }}>
        <Card title="E-Committee Supreme Court of India">
          <div className="sourcebox"><h4>{t('E-mail')}</h4><p>{CONTACT_EMAIL}</p></div>
          <Notice>{t("Addresses are shown in the portal's anti-spam form: replace [at] with @ and [dot] with a full stop. The page lists no postal address, phone number or contact form.")}</Notice>
        </Card>
        <Card title="Who to contact">
          <p>{t(CONTACT_NOTE)}</p>
        </Card>
      </div>
      <Card title="Contact Information">
        <div className="tablewrap">
          <Table size="small">
            <caption className="sr-only">{t('High Court coordinator contacts')}</caption>
            <TableHead><TableRow>{['Sr. No.', 'High Court', 'Jurisdiction (State/UTs)', 'Contact'].map((h) => <TableCell key={h} scope="col">{t(h)}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {CONTACT_ROWS.map((c, i) => (
                <TableRow key={c.name}><TableCell>{i + 1}</TableCell><TableCell><strong>{t(c.name)}</strong></TableCell><TableCell>{c.jurisdiction.split(', ').map((x) => t(x)).join(', ')}</TableCell><TableCell className="nowrap">{c.cpcEmail}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Notice>{t(CONTACT_DISCREPANCY)}</Notice>
      </Card>
    </>
  )
}

export function AboutPage() {
  const t = useT()
  return (
    <>
      <PageHead title="About Us" sub="E-Courts : About Us." />
      <div className="grid layout2" style={{ alignItems: 'start' }}>
        <Card title="The project">
          <p>{t(ABOUT.origin)}</p>
          <p>{t(ABOUT.funding)}</p>
          <h4>{t('The Project Envisages')}</h4>
          <ol>{ABOUT.envisages.map((g) => <li key={g}>{t(g)}</li>)}</ol>
          <p>{t(ABOUT.portal)}</p>
          <Notice>{t('This is a paraphrased summary of the official page; read the official page for the authoritative text.')}</Notice>
        </Card>
        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title="Phase-I"><p>{t(ABOUT.phase1)}</p></Card>
          <Card title="Phase II"><p>{t(ABOUT.phase2)}</p></Card>
          <Card title="Key facts">
            <div className="list">
              {ABOUT.facts.map(([k, v]) => <div className="listrow" key={k}><span>{t(k)}</span><strong style={{ textAlign: 'right' }}>{t(v)}</strong></div>)}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

export function NewsletterPage() {
  const t = useT()
  return (
    <>
      <PageHead title="Newsletter" sub={`${NEWSLETTERS.length} eCommittee newsletter issues, March to December 2016.`} />
      <Card>
        <div className="list">
          {NEWSLETTERS.map((n) => (
            <div className="listrow" key={n.url}><div><strong>{t(n.title)}</strong><small>{`${t(n.date)} · PDF`}</small></div><ExternalLink href={n.url}>{t('Open PDF ↗')}</ExternalLink></div>
          ))}
        </div>
        <FromPortal />
      </Card>
    </>
  )
}

export function FormsPage() {
  const t = useT()
  return (
    <>
      <PageHead title="Forms for Advocates" sub={`${FORMS.length} PDF forms. Files are hosted by the official site.`} />
      <Card>
        <div className="tablewrap">
          <Table size="small">
            <caption className="sr-only">{t('Forms for advocates')}</caption>
            <TableHead><TableRow><TableCell scope="col">{t('Form')}</TableCell><TableCell scope="col">{t('Format')}</TableCell><TableCell scope="col">{t('Size')}</TableCell><TableCell scope="col"><span className="sr-only">{t('Action')}</span></TableCell></TableRow></TableHead>
            <TableBody>
              {FORMS.map((f) => (
                <TableRow key={f.file}><TableCell><strong>{t(f.title)}</strong></TableCell><TableCell>PDF</TableCell><TableCell>{f.size}</TableCell><TableCell><ExternalLink href={formLink(f.file)}>{t('Open on official site ↗')}</ExternalLink></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <FromPortal />
        <p className="tiny muted">{t('File addresses were derived from the relative links on the forms page and not individually tested.')}</p>
      </Card>
    </>
  )
}

export function HelpVideosPage() {
  const t = useT()
  return (
    <>
      <PageHead title="Help Videos" sub={`${HELP_VIDEOS.length} help videos are listed on the official portal.`} />
      <Card>
        <ol className="svc-linklist" style={{ columns: 1 }}>{HELP_VIDEOS.map((v) => <li key={v}>{t(v)}</li>)}</ol>
        <Notice>{t('The official page lists these titles but showed no video addresses, so the videos cannot be played from here.')}</Notice>
        <FromPortal />
      </Card>
    </>
  )
}

export function WebInfoPage() {
  const t = useT()
  return (
    <>
      <PageHead title="Web Information Manager" sub="The contact role responsible for the web information of the portal." />
      <Card>
        <div className="sourcebox"><h4>{t(WEB_INFO.designation)}</h4><p>{t(WEB_INFO.department)}</p><p>{WEB_INFO.email}</p></div>
        <Notice>{t('The official page also names an individual; the name is deliberately not reproduced here. Replace [at] with @ and [dot] with a full stop.')}</Notice>
        <FromPortal />
      </Card>
    </>
  )
}

const POLICY_FOR_SLUG: Partial<Record<SvcSlug, PageId>> = {
  copyright: 'portalCopyright', hyperlinking: 'portalHyperlink', accessibility: 'portalAccessibility', disclaimer: 'portalDisclaimer',
}

export function PolicyPage({ slug }: { slug: SvcSlug }) {
  const t = useT()
  const p = POLICY_FOR_SLUG[slug] ? POLICIES[POLICY_FOR_SLUG[slug]!] : undefined
  return (
    <>
      <PageHead title={SLUG_TITLES[slug]} sub="A paraphrased summary of the official page." />
      <Card>
        <ul>{(p?.bullets ?? []).map((b) => <li key={b} style={{ marginBottom: 8 }}>{t(b)}</li>)}</ul>
        <Notice>{t('This is a short paraphrase, not the policy text. Read the official page for the authoritative wording.')}</Notice>
        <FromPortal />
      </Card>
    </>
  )
}

export function ScreenReaderPage() {
  const t = useT()
  return (
    <>
      <PageHead title="Screen Reader Access" sub="Assistive technologies the official portal lists as compatible." />
      <Card>
        <div className="tablewrap">
          <Table size="small">
            <caption className="sr-only">{t('Screen readers')}</caption>
            <TableHead><TableRow><TableCell scope="col">#</TableCell><TableCell scope="col">{t('Screen reader')}</TableCell><TableCell scope="col">{t('Vendor site')}</TableCell><TableCell scope="col">{t('Usage')}</TableCell></TableRow></TableHead>
            <TableBody>
              {SCREEN_READERS.map((s, i) => (
                <TableRow key={s.name}><TableCell>{i + 1}</TableCell><TableCell><strong>{t(s.name)}</strong></TableCell><TableCell>{s.site}</TableCell><TableCell><Pill kind={s.usage === 'Free' ? 'green' : ''}>{t(s.usage)}</Pill></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <FromPortal />
      </Card>
    </>
  )
}

export function SiteMapPage({ navigate }: { navigate: (s: SvcSlug) => void }) {
  const t = useT()
  return (
    <>
      <PageHead title="Site map" sub="A map of this demonstration site." />
      <div className="grid layout3" style={{ alignItems: 'start' }}>
        {SITE_MAP_GROUPS.map((g) => (
          <Card key={g.heading} title={g.heading}>
            <div className="list">
              {g.items.map((m) => (
                <div className="listrow" key={m.label}>
                  <strong>{t(m.label)}</strong>
                  {m.slug ? <Btn className="small" onClick={() => navigate(m.slug!)}>Open</Btn> : <ExternalLink href={m.url!}>{t('External ↗')}</ExternalLink>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Notice>{t("This is this prototype's own map of its pages. The official site map was not read from the services site.")}</Notice>
    </>
  )
}
