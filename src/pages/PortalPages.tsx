import { useApp } from '../context'
import { Btn, Card, Notice, Pill } from '../components/ui'
import ExternalLink from '../components/ExternalLink'
import { Shell } from './Portal'
import type { PageId } from '../types'
import {
  BROCHURES, HELP_VIDEOS, MAIN_MENU, MANUALS, NEWSLETTERS, OFFICIAL_SITEMAP, POLICIES, SCREEN_READERS, USEFUL_LINKS,
  WEB_INFO, manualLink, officialAbout,
} from '../features/portal/data'

const UNTESTED = 'File addresses were read from the official page and not individually tested. If a file does not open, use the official page.'

function OfficialPage({ slug }: { slug: string }) {
  return <ExternalLink href={officialAbout(slug)}>Open the official page ↗</ExternalLink>
}

function DocTable({ caption, rows }: { caption: string; rows: { title: string; meta?: string; url: string }[] }) {
  return (
    <div className="tablewrap">
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead><tr><th scope="col">Title</th><th scope="col">Details</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.url}><td><strong>{r.title}</strong></td><td>{r.meta ?? 'PDF'}</td><td><ExternalLink href={r.url}>Open on official site ↗</ExternalLink></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PortalHelpVideos() {
  return (
    <Shell back title="Help Videos" sub={`${HELP_VIDEOS.length} help videos are listed on the official portal.`}>
      <Card>
        <ol className="linklist" style={{ columns: 1 }}>
          {HELP_VIDEOS.map((v) => <li key={v}>{v}</li>)}
        </ol>
        <Notice>The official page lists these titles but showed no video addresses or languages when reviewed, so the videos cannot be linked from here.</Notice>
        <OfficialPage slug="help_videos" />
      </Card>
    </Shell>
  )
}

export function PortalManuals() {
  return (
    <Shell back title="Manuals" sub={`${MANUALS.length} user manuals (PDF).`}>
      <Card>
        <DocTable caption="Manuals" rows={MANUALS.map((m) => ({ title: m.title, url: manualLink(m.file) }))} />
        <Notice>{UNTESTED} The official page states no language or size for these files.</Notice>
        <OfficialPage slug="manuals" />
      </Card>
    </Shell>
  )
}

export function PortalBrochures() {
  return (
    <Shell back title="Brochures" sub={`${BROCHURES.length} brochures (PDF).`}>
      <Card>
        <DocTable caption="Brochures" rows={BROCHURES.map((m) => ({ title: m.title, url: manualLink(m.file) }))} />
        <Notice>{UNTESTED}</Notice>
        <OfficialPage slug="brochures" />
      </Card>
    </Shell>
  )
}

export function PortalKnowledge() {
  const { go } = useApp()
  const items: { label: string; text: string; page: PageId }[] = [
    { label: 'Help Videos', text: `${HELP_VIDEOS.length} videos`, page: 'portalHelpVideos' },
    { label: 'User Manuals', text: `${MANUALS.length} manuals`, page: 'portalManuals' },
    { label: 'Brochures', text: `${BROCHURES.length} brochures`, page: 'portalBrochures' },
  ]
  return (
    <Shell back title="Knowledge Management" sub="A hub page on the official portal that links to help videos, user manuals and brochures.">
      <div className="grid layout3">
        {items.map((i) => (
          <button key={i.page} className="quick" onClick={() => go(i.page)}><strong>{i.label}</strong><small>{i.text}</small></button>
        ))}
      </div>
    </Shell>
  )
}

export function PortalNewsletter() {
  return (
    <Shell back title="Newsletter" sub={`${NEWSLETTERS.length} eCommittee newsletter issues, March to December 2016.`}>
      <Card>
        <DocTable caption="Newsletters" rows={NEWSLETTERS.map((n) => ({ title: n.title, meta: `PDF · ${n.date}`, url: n.url }))} />
        <Notice>The official page gives these addresses with http; https is used here and was not tested. File sizes are not listed on the official page.</Notice>
        <OfficialPage slug="newsletter" />
      </Card>
    </Shell>
  )
}

export function PortalWebInfo() {
  return (
    <Shell back title="Web Information Manager" sub="The contact role responsible for the portal's web information.">
      <Card>
        <div className="sourcebox">
          <h4>{WEB_INFO.designation}</h4>
          <p>{WEB_INFO.department}</p>
          <p>{WEB_INFO.email}</p>
        </div>
        <Notice>The official page also names an individual; the name is deliberately not reproduced here. Replace [at] with @ and [dot] with a full stop.</Notice>
        <OfficialPage slug="webinfo" />
      </Card>
    </Shell>
  )
}

export function PortalPolicy({ page }: { page: PageId }) {
  const p = POLICIES[page]
  if (!p) return <Shell back title="Page not found" sub="">{null}</Shell>
  return (
    <Shell back title={p.title} sub="A paraphrased summary of the official page.">
      <Card>
        <ul>{p.bullets.map((b) => <li key={b} style={{ marginBottom: 8 }}>{b}</li>)}</ul>
        <Notice>This is a short paraphrase, not the policy text. Read the official page for the authoritative wording.</Notice>
        <OfficialPage slug={p.slug} />
      </Card>
    </Shell>
  )
}

export function PortalScreenReader() {
  return (
    <Shell back title="Screen Reader Access" sub="Assistive technologies the official portal lists as compatible.">
      <Card>
        <p>The official page says the portal can be used with screen readers by people with visual impairments, and names JAWS, NVDA, SAFA, Supernova and Window-Eyes as compatible. Its table lists five products:</p>
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
        <Notice>SAFA and Window-Eyes are named in the introduction but do not appear in the table. The page has no direct download links.</Notice>
        <OfficialPage slug="screen_recorder" />
      </Card>
    </Shell>
  )
}

export function PortalSitemap() {
  const { go } = useApp()
  return (
    <Shell back title="Site map" sub="A map of the portal reference section in this demonstration.">
      <div className="grid layout2">
        <Card title="Main menu (official order)">
          <div className="list">
            {MAIN_MENU.map((m) => (
              <div className="listrow" key={m.label}>
                <strong>{m.label}</strong>
                {m.page ? <Btn className="small" onClick={() => go(m.page!)}>Open</Btn> : <ExternalLink href={m.url!}>External site ↗</ExternalLink>}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Useful links">
          <div className="list">
            {USEFUL_LINKS.map((l) => (
              <div className="listrow" key={l.label}><strong>{l.label}</strong><Btn className="small" onClick={() => go(l.page)}>Open</Btn></div>
            ))}
          </div>
        </Card>
      </div>
      <Notice>This is this prototype&apos;s own map. The official site map returned a server error (HTTP 500) when reviewed, so its contents are unverified. <ExternalLink href={OFFICIAL_SITEMAP} className="linkbtn">Try the official site map</ExternalLink>.</Notice>
    </Shell>
  )
}
