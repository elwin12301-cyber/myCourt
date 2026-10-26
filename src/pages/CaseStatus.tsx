import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Btn, Card, Notice, PageHead, Pill } from '../components/ui'
import { createMockAdapter, CASE_TYPES, DEMO_ERROR_CNR, LOCATIONS } from '../features/caseStatus/mockAdapter'
import { normaliseCnr, validateQuery, type FieldErrors } from '../features/caseStatus/validation'
import type { CaseQuery, CaseRecord, CaseStatusFilter, SearchMode } from '../features/caseStatus/types'

const adapter = createMockAdapter()

const TABS: { id: SearchMode; label: string }[] = [
  { id: 'cnr', label: 'CNR number' },
  { id: 'caseNumber', label: 'Case number' },
  { id: 'party', label: 'Party name' },
]

type Phase = 'idle' | 'loading' | 'error' | 'done'

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function F({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <span id={`${id}-err`} role="alert" className="fielderr">{error}</span>}
    </div>
  )
}

const OFFICIAL: [string, string][] = [
  ['District Court services', 'https://services.ecourts.gov.in/'],
  ['High Court services', 'https://hcservices.ecourts.gov.in/'],
  ['Judgment search', 'https://judgments.ecourts.gov.in/'],
  ['eFiling', 'https://filing.ecourts.gov.in/'],
  ['ePay', 'https://pay.ecourts.gov.in/'],
  ['Virtual Courts', 'https://vcourts.gov.in/'],
  ['NJDG (district)', 'https://njdg.ecourts.gov.in/njdg_v3/'],
]

export default function CaseStatusPage() {
  const [mode, setMode] = useState<SearchMode>('cnr')
  const [v, setV] = useState({
    cnr: '', state: '', district: '', court: '', caseType: '', number: '', year: '', name: '', status: 'Both' as CaseStatusFilter,
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [phase, setPhase] = useState<Phase>('idle')
  const [results, setResults] = useState<CaseRecord[]>([])
  const [selected, setSelected] = useState<CaseRecord | null>(null)
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Disposed'>('All')
  const [sort, setSort] = useState<'hearing' | 'filing'>('hearing')
  const [detailTab, setDetailTab] = useState<'history' | 'orders'>('history')
  const abortRef = useRef<AbortController>()

  const districts = v.state ? Object.keys(LOCATIONS[v.state] ?? {}) : []
  const courts = v.state && v.district ? LOCATIONS[v.state]?.[v.district] ?? [] : []
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }))

  const buildQuery = (): CaseQuery => {
    if (mode === 'cnr') return { mode, cnr: normaliseCnr(v.cnr) }
    const base = { state: v.state, district: v.district, court: v.court, year: v.year }
    return mode === 'caseNumber'
      ? { mode, ...base, caseType: v.caseType, number: v.number }
      : { mode, ...base, name: v.name, status: v.status }
  }

  const run = async (e?: FormEvent) => {
    e?.preventDefault()
    const q = buildQuery()
    const errs = validateQuery(q)
    setErrors(errs)
    if (Object.keys(errs).length) return
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    setPhase('loading'); setSelected(null)
    try {
      const r = await adapter.search(q, ctl.signal)
      setResults(r); setPhase('done')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setPhase('error')
    }
  }

  const reset = () => {
    abortRef.current?.abort()
    setV({ cnr: '', state: '', district: '', court: '', caseType: '', number: '', year: '', name: '', status: 'Both' })
    setErrors({}); setPhase('idle'); setResults([]); setSelected(null)
  }

  const shown = useMemo(() => {
    const list = results.filter((c) => filter === 'All' || c.status === filter)
    const key = (c: CaseRecord) => (sort === 'hearing' ? c.nextHearing ?? '9999' : c.filingDate)
    return [...list].sort((a, b) => key(a).localeCompare(key(b)))
  }, [results, filter, sort])

  const err = (k: string) => errors[k]
  const aria = (k: string) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-err` : undefined })

  const location = (
    <>
      <div className="grid layout3">
        <F id="state" label="State" error={err('state')}>
          <select id="state" value={v.state} {...aria('state')} onChange={(e) => setV((p) => ({ ...p, state: e.target.value, district: '', court: '' }))}>
            <option value="">Select state</option>{Object.keys(LOCATIONS).map((s) => <option key={s}>{s}</option>)}
          </select>
        </F>
        <F id="district" label="District" error={err('district')}>
          <select id="district" value={v.district} disabled={!v.state} {...aria('district')} onChange={(e) => setV((p) => ({ ...p, district: e.target.value, court: '' }))}>
            <option value="">Select district</option>{districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </F>
        <F id="court" label="Court complex" error={err('court')}>
          <select id="court" value={v.court} disabled={!v.district} {...aria('court')} onChange={set('court')}>
            <option value="">Select court complex</option>{courts.map((c) => <option key={c}>{c}</option>)}
          </select>
        </F>
      </div>
    </>
  )

  return (
    <>
      <PageHead title="Case Status" sub="Search a case by CNR, case number or party name, then review its hearing history and orders.">
        <Btn kind="soft" onClick={reset}>Reset</Btn>
      </PageHead>

      <div className="demobanner" role="note">
        <strong>Demonstration data.</strong> Results come from a local mock adapter with fictional records. This prototype is not connected to eCourts, is not affiliated with the judiciary, and must not be used to check a real case.
      </div>

      <Notice>
        For real case information use the official services: {OFFICIAL.map(([l, u], i) => (
          <span key={u}>{i > 0 && ' · '}<a href={u} target="_blank" rel="noopener noreferrer">{l}<span className="sr-only"> (opens in a new tab)</span></a></span>
        ))}
      </Notice>

      <Card>
        <div className="tabrow" role="tablist" aria-label="Search by">
          {TABS.map((t) => (
            <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={mode === t.id} aria-controls="searchpanel"
              className={`tab ${mode === t.id ? 'active' : ''}`} onClick={() => { setMode(t.id); setErrors({}) }}>{t.label}</button>
          ))}
        </div>
        <form id="searchpanel" role="tabpanel" aria-labelledby={`tab-${mode}`} onSubmit={run} noValidate>
          {mode === 'cnr' && (
            <F id="cnr" label="CNR number (16 letters/digits, no hyphen or space)" error={err('cnr')}>
              <input id="cnr" value={v.cnr} maxLength={24} autoComplete="off" placeholder="e.g. TNCH019999992025" {...aria('cnr')} onChange={set('cnr')} />
              <span className="tiny muted">Try TNCH019999992025 (found), TNCH019999990000 (no result) or {DEMO_ERROR_CNR} (simulated error).</span>
            </F>
          )}
          {mode === 'caseNumber' && (
            <>
              {location}
              <div className="grid layout3">
                <F id="caseType" label="Case type" error={err('caseType')}>
                  <select id="caseType" value={v.caseType} {...aria('caseType')} onChange={set('caseType')}>
                    <option value="">Select case type</option>{CASE_TYPES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </F>
                <F id="number" label="Case number" error={err('number')}>
                  <input id="number" inputMode="numeric" value={v.number} {...aria('number')} onChange={set('number')} />
                </F>
                <F id="year" label="Year" error={err('year')}>
                  <input id="year" inputMode="numeric" maxLength={4} value={v.year} {...aria('year')} onChange={set('year')} />
                </F>
              </div>
            </>
          )}
          {mode === 'party' && (
            <>
              {location}
              <div className="grid layout3">
                <F id="name" label="Petitioner / respondent / advocate name" error={err('name')}>
                  <input id="name" value={v.name} {...aria('name')} onChange={set('name')} />
                </F>
                <F id="year" label="Year (optional)" error={err('year')}>
                  <input id="year" inputMode="numeric" maxLength={4} value={v.year} {...aria('year')} onChange={set('year')} />
                </F>
                <F id="status" label="Case status">
                  <select id="status" value={v.status} onChange={set('status')}><option>Both</option><option>Pending</option><option>Disposed</option></select>
                </F>
              </div>
            </>
          )}
          <p className="tiny muted">The official service also requires a CAPTCHA. The prototype omits it because no live service is called.</p>
          <div className="actions">
            <button className="btn primary" type="submit" disabled={phase === 'loading'}>{phase === 'loading' ? 'Searching…' : 'Search'}</button>
            <Btn onClick={reset}>Reset</Btn>
          </div>
        </form>
      </Card>

      <div style={{ marginTop: 18 }} aria-live="polite">
        {phase === 'idle' && <div className="empty">Choose a search type, fill in the details and select Search.</div>}
        {phase === 'loading' && (
          <Card><div className="skeleton" /><div className="skeleton" /><div className="skeleton short" /><span className="sr-only">Loading results</span></Card>
        )}
        {phase === 'error' && (
          <Notice>The demonstration service is unavailable. <Btn className="small" onClick={() => run()}>Retry</Btn></Notice>
        )}
        {phase === 'done' && results.length === 0 && (
          <div className="empty">No matching record in the demonstration data. This does not mean a real case does not exist.</div>
        )}
        {phase === 'done' && results.length > 0 && !selected && (
          <Card title={`${shown.length} of ${results.length} result${results.length === 1 ? '' : 's'}`}>
            <div className="actions" style={{ marginBottom: 12 }}>
              <label className="tiny">Status{' '}
                <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option>All</option><option>Pending</option><option>Disposed</option></select>
              </label>
              <label className="tiny">Sort by{' '}
                <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="hearing">Next hearing</option><option value="filing">Filing date</option></select>
              </label>
            </div>
            <div className="tablewrap">
              <table>
                <caption className="sr-only">Case search results (demonstration data)</caption>
                <thead><tr><th scope="col">Case</th><th scope="col">Parties</th><th scope="col">Court</th><th scope="col">Next hearing</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {shown.map((c) => (
                    <tr key={c.cnr}>
                      <td><strong>{c.caseType} {c.caseNumber}/{c.year}</strong><small>{c.cnr}</small></td>
                      <td>{c.petitioner} v. {c.respondent}</td>
                      <td>{c.court}<small>{c.district}, {c.state}</small></td>
                      <td>{fmt(c.nextHearing)}</td>
                      <td><Pill kind={c.status === 'Pending' ? 'amber' : 'green'}>{c.status}</Pill></td>
                      <td><Btn className="small" onClick={() => { setSelected(c); setDetailTab('history') }}>View details</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shown.length === 0 && <div className="empty">No results match the selected status filter.</div>}
            </div>
          </Card>
        )}
        {selected && (
          <Card>
            <div className="cardhead">
              <h3>{selected.caseType} {selected.caseNumber}/{selected.year} <Pill kind="blue">Demo</Pill></h3>
              <Btn className="small" onClick={() => setSelected(null)}>← Back to results</Btn>
            </div>
            <div className="grid layout3" style={{ marginBottom: 14 }}>
              <div><div className="muted tiny">CNR</div><strong>{selected.cnr}</strong></div>
              <div><div className="muted tiny">Status / stage</div><strong>{selected.status} · {selected.stage}</strong></div>
              <div><div className="muted tiny">Next hearing</div><strong>{fmt(selected.nextHearing)}</strong></div>
              <div><div className="muted tiny">Filed / registered</div><strong>{fmt(selected.filingDate)} / {fmt(selected.registrationDate)}</strong></div>
              <div><div className="muted tiny">Court</div><strong>{selected.court}, {selected.district}</strong></div>
              <div><div className="muted tiny">Petitioner · Respondent</div><strong>{selected.petitioner} · {selected.respondent}</strong></div>
            </div>
            <div className="tabrow" role="tablist" aria-label="Case details">
              {(['history', 'orders'] as const).map((t) => (
                <button key={t} role="tab" aria-selected={detailTab === t} className={`tab ${detailTab === t ? 'active' : ''}`} onClick={() => setDetailTab(t)}>
                  {t === 'history' ? 'Case history' : 'Orders'}
                </button>
              ))}
            </div>
            {detailTab === 'history' ? (
              <div className="timeline">
                {selected.history.map((h, i) => (
                  <div className="event" key={i}><strong>{fmt(h.date)} · {h.purpose}</strong><small>Business on date: {fmt(h.businessOn)} · {h.judge}</small></div>
                ))}
              </div>
            ) : (
              <div className="list">
                {selected.orders.map((o, i) => (
                  <div className="listrow" key={i}>
                    <div><strong>{o.title}</strong><small>{fmt(o.date)}</small></div>
                    <button className="btn small" disabled title="No document exists in demonstration data">Download unavailable</button>
                  </div>
                ))}
              </div>
            )}
            <Notice>Demonstration record. Always verify case information on the official eCourts service.</Notice>
          </Card>
        )}
      </div>
    </>
  )
}
