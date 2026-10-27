import { useMemo, useState, type FormEvent } from 'react'
import ExternalLink from '../../components/ExternalLink'
import { Btn, Card, PageHead, Pill } from '../../components/ui'
import { buildSiteIndex, searchSite } from '../../features/services/search'
import type { SvcSlug } from '../../features/services/data'

export default function SiteSearch({ query, navigate }: { query: string; navigate: (s: SvcSlug) => void }) {
  const [text, setText] = useState(query)
  const [submitted, setSubmitted] = useState(query)
  const index = useMemo(buildSiteIndex, [])
  const hits = useMemo(() => searchSite(submitted, index), [submitted, index])
  const submit = (e: FormEvent) => { e.preventDefault(); setSubmitted(text) }

  return (
    <>
      <PageHead title="Search this site" sub="Searches the pages, services, High Courts and footer pages of this demonstration site. It does not search case records." />
      <Card>
        <form role="search" onSubmit={submit}>
          <div className="field">
            <label htmlFor="site-search-page">Search this site</label>
            <input id="site-search-page" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. caveat, Madras, vakalatnama" />
          </div>
          <button className="btn primary" type="submit">Search</button>
        </form>
        <div style={{ marginTop: 16 }} aria-live="polite">
          {submitted && hits.length === 0 && (
            <div className="empty">No results for “{submitted}”. Try the <button type="button" className="svc-link" onClick={() => navigate('site-map')}>site map</button>.</div>
          )}
          {hits.length > 0 && <p className="tiny muted">{hits.length} result{hits.length === 1 ? '' : 's'}</p>}
          <div className="list">
            {hits.slice(0, 50).map((h) => (
              <div className="listrow" key={h.id}>
                <div><strong>{h.title}</strong><small>{h.description}</small></div>
                <div className="actions">
                  <Pill>{h.kind}</Pill>
                  {h.slug && <Btn className="small" onClick={() => navigate(h.slug!)}>Open</Btn>}
                  {h.url && <ExternalLink href={h.url}>Open site ↗</ExternalLink>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  )
}
