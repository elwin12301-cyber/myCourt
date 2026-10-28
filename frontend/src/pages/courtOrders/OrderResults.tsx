import { Btn, Card, Pill } from '../../components/ui'
import { compareResults } from '../../features/courtOrders/courtOrders'
import type { OrderResult } from '../../features/courtOrders/types'
import { useLang, useT } from '../../i18n/context'
import { fmt } from '../caseStatus/Results'

export type ResultFilter = 'All' | 'Interim' | 'Final'
export type ResultSort = 'newest' | 'oldest' | 'case'

/** Pure view of the results for the chosen filter and sort (kept pure so the page owns the state). */
export function visibleRows(results: OrderResult[], filter: ResultFilter, sort: ResultSort): OrderResult[] {
  const rows = results.filter((r) => filter === 'All' || r.order.kind === filter)
  if (sort === 'oldest') return [...rows].sort((a, b) => compareResults(b, a))
  if (sort === 'case') {
    const key = (r: OrderResult) => `${r.record.caseType}|${r.record.year}|${r.record.caseNumber.padStart(7, '0')}|${r.order.number.padStart(4, '0')}`
    return [...rows].sort((a, b) => key(a).localeCompare(key(b)))
  }
  return [...rows].sort(compareResults)
}

/** Controlled: the filter and sort live in the page, so they survive opening a case. */
export default function OrderResults({ results, filter, sort, onFilter, onSort, onView }: {
  results: OrderResult[]
  filter: ResultFilter
  sort: ResultSort
  onFilter: (f: ResultFilter) => void
  onSort: (s: ResultSort) => void
  onView: (r: OrderResult) => void
}) {
  const t = useT()
  const lang = useLang()
  const rows = visibleRows(results, filter, sort)
  const count = t(results.length === 1 ? '{n} of {m} order' : '{n} of {m} orders', { n: rows.length, m: results.length })
  return (
    <Card title={`${t('Search results')} · ${count}`}>
      <div className="actions" style={{ marginBottom: 12 }}>
        <label className="tiny">{t('Order type')}{' '}
          <select value={filter} onChange={(e) => onFilter(e.target.value as ResultFilter)}><option value="All">{t('All')}</option><option value="Interim">{t('Interim')}</option><option value="Final">{t('Final')}</option></select>
        </label>
        <label className="tiny">{t('Sort by')}{' '}
          <select value={sort} onChange={(e) => onSort(e.target.value as ResultSort)}>
            <option value="newest">{t('Newest order first')}</option><option value="oldest">{t('Oldest order first')}</option><option value="case">{t('Case number')}</option>
          </select>
        </label>
      </div>
      <div className="tablewrap">
        <table>
          <caption className="sr-only">{t('Court orders (demonstration data)')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('Sr No')}</th><th scope="col">{t('Case Type/Case Number/Case Year')}</th><th scope="col">{t('Petitioner versus Respondent')}</th>
              <th scope="col">{t('Order')}</th><th scope="col">{t('Order date')}</th><th scope="col">{t('Order document')}</th><th scope="col">{t('View')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.record.cnr}-${r.order.number}`}>
                <td>{i + 1}</td>
                <td><strong>{`${t(r.record.caseType)}/${r.record.caseNumber}/${r.record.year}`}</strong><small>{r.record.cnr}</small></td>
                <td>{`${r.record.petitioner} ${t('versus')} ${r.record.respondent}`}</td>
                <td><strong>{`${t('Order')} ${r.order.number}`}</strong><small>{t(r.order.title)}</small><Pill kind={r.order.kind === 'Final' ? 'green' : 'amber'}>{r.order.kind}</Pill></td>
                <td>{fmt(r.order.date, lang)}</td>
                <td>
                  <button className="btn small" disabled title={t('No document exists in demonstration data')}>{t('Unavailable')}</button>
                  <small>{t('No document exists in demonstration data')}</small>
                </td>
                <td><Btn className="small" onClick={() => onView(r)}>{t('View')}<span className="sr-only">{` ${t('case')} ${r.record.caseNumber}/${r.record.year}`}</span></Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty">{t('No orders match the selected order type.')}</div>}
      </div>
      <p className="tiny muted">{t("Column layout is this prototype's design; the official results list was not observed.")}</p>
    </Card>
  )
}
