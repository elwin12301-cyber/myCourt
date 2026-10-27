import { useMemo, useState } from 'react'
import { Btn, Card, Pill } from '../../components/ui'
import type { CaseRecord } from '../../features/caseStatus/types'

export const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function Results({ results, title, onView }: { results: CaseRecord[]; title: string; onView: (c: CaseRecord) => void }) {
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Disposed'>('All')
  const [sort, setSort] = useState<'hearing' | 'filing' | 'case'>('hearing')

  const shown = useMemo(() => {
    const list = results.filter((c) => filter === 'All' || c.status === filter)
    const key = (c: CaseRecord) => (sort === 'hearing' ? c.nextHearing ?? '9999' : sort === 'filing' ? c.filingDate : `${c.caseType}${c.year}${c.caseNumber.padStart(7, '0')}`)
    return [...list].sort((a, b) => key(a).localeCompare(key(b)))
  }, [results, filter, sort])

  return (
    <Card title={`${title} · ${shown.length} of ${results.length} result${results.length === 1 ? '' : 's'}`}>
      <div className="actions" style={{ marginBottom: 12 }}>
        <label className="tiny">Status{' '}
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option>All</option><option>Pending</option><option>Disposed</option></select>
        </label>
        <label className="tiny">Sort by{' '}
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="hearing">Next hearing</option><option value="filing">Filing date</option><option value="case">Case number</option>
          </select>
        </label>
      </div>
      <div className="tablewrap">
        <table>
          <caption className="sr-only">Case search results (demonstration data)</caption>
          <thead>
            <tr>
              <th scope="col">Sr No</th><th scope="col">Case Type/Case Number/Case Year</th><th scope="col">Petitioner versus Respondent</th>
              <th scope="col">Court</th><th scope="col">Next hearing</th><th scope="col">Status</th><th scope="col">View</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c, i) => (
              <tr key={c.cnr}>
                <td>{i + 1}</td>
                <td><strong>{c.caseType}/{c.caseNumber}/{c.year}</strong><small>{c.cnr}</small></td>
                <td>{c.petitioner} versus {c.respondent}</td>
                <td>{c.court.establishment || c.court.complex}<small>{c.court.district}, {c.court.state}</small></td>
                <td>{fmt(c.nextHearing)}</td>
                <td><Pill kind={c.status === 'Pending' ? 'amber' : 'green'}>{c.status}</Pill></td>
                <td><Btn className="small" onClick={() => onView(c)}>View<span className="sr-only"> case {c.caseNumber}/{c.year}</span></Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <div className="empty">No results match the selected status filter.</div>}
      </div>
      <p className="tiny muted">Column layout is this prototype&apos;s design; the official results table was not observed.</p>
    </Card>
  )
}
