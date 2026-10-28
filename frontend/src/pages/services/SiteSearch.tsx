import { useMemo, useState, type FormEvent } from 'react'
import ExternalLink from '../../components/ExternalLink'
import { Btn, Card, PageHead, Pill, Input } from '../../components/ui'
import { useT } from '../../i18n/context'
import { buildSiteIndex, searchSite } from '../../features/services/search'
import type { SvcSlug } from '../../features/services/data'

export default function SiteSearch({ query, navigate }: { query: string; navigate: (s: SvcSlug) => void }) {
  const t = useT()
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
            <label htmlFor="site-search-page">{t('Search this site')}</label>
            <Input id="site-search-page" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('e.g. caveat, Madras, vakalatnama')} />
          </div>
          <Btn kind="primary" type="submit">{t('Search')}</Btn>
        </form>
        <div style={{ marginTop: 16 }} aria-live="polite">
          {submitted && hits.length === 0 && (
            <div className="empty">{t('No results for “{q}”.', { q: submitted })} <button type="button" className="svc-link" onClick={() => navigate('site-map')}>{t('Open the site map')}</button></div>
          )}
          {hits.length > 0 && <p className="tiny muted">{t(hits.length === 1 ? '{n} result' : '{n} results', { n: hits.length })}</p>}
          <div className="list">
            {hits.slice(0, 50).map((h) => (
              <div className="listrow" key={h.id}>
                <div><strong>{t(h.title)}</strong><small>{h.kind === 'Contact' ? h.description.split(', ').map((x) => t(x)).join(', ') : h.kind === 'Form' ? t('PDF · {size}', { size: h.description.replace('PDF · ', '') }) : t(h.description)}</small></div>
                <div className="actions">
                  <Pill>{h.kind}</Pill>
                  {h.slug && <Btn className="small" onClick={() => navigate(h.slug!)}>Open</Btn>}
                  {h.url && <ExternalLink href={h.url}>{t('Open site ↗')}</ExternalLink>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  )
}
