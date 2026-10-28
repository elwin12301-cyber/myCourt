import { useMemo, useState } from 'react'
import { Btn, Card, Pill } from '../../components/ui'
import type { CaseRecord } from '../../features/caseStatus/types'
import { formatDate, useLang, useT } from '../../i18n/context'
import type { LangCode } from '../../i18n/core'

/** Formats a date for the active language (month names follow the language); English is unchanged. */
export const fmt = (iso: string | null, lang: LangCode = 'en') => formatDate(iso, lang)

export default function Results({ results, title, onView }: { results: CaseRecord[]; title: string; onView: (c: CaseRecord) => void }) {
  const t = useT()
  const lang = useLang()
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Disposed'>('All')
  const [sort, setSort] = useState<'hearing' | 'filing' | 'case'>('hearing')

  const shown = useMemo(() => {
    const list = results.filter((c) => filter === 'All' || c.status === filter)
    const key = (c: CaseRecord) => (sort === 'hearing' ? c.nextHearing ?? '9999' : sort === 'filing' ? c.filingDate : `${c.caseType}${c.year}${c.caseNumber.padStart(7, '0')}`)
    return [...list].sort((a, b) => key(a).localeCompare(key(b)))
  }, [results, filter, sort])

  const count = t(results.length === 1 ? '{n} of {m} result' : '{n} of {m} results', { n: shown.length, m: results.length })

  return (
    <Card title={`${title} · ${count}`}>
      <div className="actions" style={{ marginBottom: 12 }}>
        <label className="tiny">{t('Status')}{' '}
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="All">{t('All')}</option><option value="Pending">{t('Pending')}</option><option value="Disposed">{t('Disposed')}</option>
          </select>
        </label>
        <label className="tiny">{t('Sort by')}{' '}
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="hearing">{t('Next hearing')}</option><option value="filing">{t('Filing date')}</option><option value="case">{t('Case number')}</option>
          </select>
        </label>
      </div>
      <div className="tablewrap">
        <table>
          <caption className="sr-only">{t('Case search results (demonstration data)')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('Sr No')}</th><th scope="col">{t('Case Type/Case Number/Case Year')}</th><th scope="col">{t('Petitioner versus Respondent')}</th>
              <th scope="col">{t('Court')}</th><th scope="col">{t('Next hearing')}</th><th scope="col">{t('Status')}</th><th scope="col">{t('View')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c, i) => (
              <tr key={c.cnr}>
                <td>{i + 1}</td>
                <td><strong>{`${t(c.caseType)}/${c.caseNumber}/${c.year}`}</strong><small>{c.cnr}</small></td>
                <td>{`${c.petitioner} ${t('versus')} ${c.respondent}`}</td>
                <td>{t(c.court.establishment || c.court.complex)}<small>{`${t(c.court.district)}, ${t(c.court.state)}`}</small></td>
                <td>{fmt(c.nextHearing, lang)}</td>
                <td><Pill kind={c.status === 'Pending' ? 'amber' : 'green'}>{c.status}</Pill></td>
                <td><Btn className="small" onClick={() => onView(c)}>{t('View')}<span className="sr-only">{` ${t('case')} ${c.caseNumber}/${c.year}`}</span></Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <div className="empty">{t('No results match the selected status filter.')}</div>}
      </div>
      <p className="tiny muted">{t("Column layout is this prototype's design; the official results table was not observed.")}</p>
    </Card>
  )
}
