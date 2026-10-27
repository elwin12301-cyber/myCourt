import { useRef, useState, type FormEvent } from 'react'
import { Btn, Card, Notice, PageHead } from '../components/ui'
import ExternalLink from '../components/ExternalLink'
import { useApp } from '../context'
import { SEARCH_MENU_LINKS } from '../features/caseStatus/referenceData'
import { generateCaptcha, verifyCaptcha } from '../features/caseStatus/captcha'
import type { CaseRecord } from '../features/caseStatus/types'
import type { FieldErrors } from '../features/caseStatus/validation'
import { createMockOrderAdapter } from '../features/courtOrders/courtOrders'
import { DEFAULT_FILTER, FILTER_LABELS, FILTER_OPTIONS, ORDER_MODES } from '../features/courtOrders/modes'
import type { OrderFilter, OrderMode, OrderQuery, OrderResult } from '../features/courtOrders/types'
import { validateOrderQuery } from '../features/courtOrders/validation'
import { courtNumberLabel, roomId, roomsFor } from '../features/causeList/courtRooms'
import CaptchaField from './caseStatus/Captcha'
import CaseDetail from './caseStatus/Detail'
import { CaseTypeField, CourtPicker, courtOf, EMPTY, Field, Radios, YearField, type FormValues } from './caseStatus/form'
import OrderResults, { type ResultFilter, type ResultSort } from './courtOrders/OrderResults'

const adapter = createMockOrderAdapter()
export type Phase = 'idle' | 'loading' | 'error' | 'done'

interface Extra { roomId: string; from: string; to: string }

function buildOrderQuery(mode: OrderMode, v: FormValues, filter: OrderFilter, x: Extra): OrderQuery {
  const court = courtOf(v)
  switch (mode) {
    case 'party': return { mode, court, name: v.name, year: v.year, filter }
    case 'caseNumber': return { mode, court, caseType: v.caseType, number: v.number, year: v.year, filter }
    case 'courtNumber': return { mode, court, roomId: x.roomId, filter }
    case 'orderDate': return { mode, court, from: x.from, to: x.to, filter }
  }
}

/** Optional starting state, used by render tests to show every page state without user input. */
export interface CourtOrdersInitial { phase?: Phase; results?: OrderResult[]; selected?: CaseRecord | null }

export default function CourtOrdersPage({ initialMode = 'party', initial }: { initialMode?: OrderMode; initial?: CourtOrdersInitial } = {}) {
  const { go } = useApp()
  const [mode, setMode] = useState<OrderMode>(initialMode)
  const [v, setV] = useState<FormValues>(EMPTY)
  const [orderFilter, setOrderFilter] = useState<OrderFilter>(DEFAULT_FILTER)
  const [roomSel, setRoomSel] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [captcha, setCaptcha] = useState(() => generateCaptcha())
  const [captchaInput, setCaptchaInput] = useState('')
  const [phase, setPhase] = useState<Phase>(initial?.phase ?? 'idle')
  const [results, setResults] = useState<OrderResult[]>(initial?.results ?? [])
  const [selected, setSelected] = useState<CaseRecord | null>(initial?.selected ?? null)
  // Result-table state lives here so it survives opening a case (spec SC-006).
  const [resultFilter, setResultFilter] = useState<ResultFilter>('All')
  const [resultSort, setResultSort] = useState<ResultSort>('newest')
  const abortRef = useRef<AbortController>()

  const info = ORDER_MODES.find((m) => m.id === mode)!
  const rooms = roomsFor(courtOf(v))
  const patch = (p: Partial<FormValues>) => {
    setV((s) => ({ ...s, ...p }))
    // Changing the court selection clears a chosen court number (spec edge case).
    if ('state' in p || 'district' in p || 'complex' in p || 'establishment' in p) setRoomSel('')
  }
  const refreshCaptcha = () => { setCaptcha(generateCaptcha()); setCaptchaInput('') }
  const cancel = () => abortRef.current?.abort()

  const run = async (e?: FormEvent) => {
    e?.preventDefault()
    const q = buildOrderQuery(mode, v, orderFilter, { roomId: roomSel, from, to })
    const errs = validateOrderQuery(q)
    if (!verifyCaptcha(captcha, captchaInput)) errs.captcha = captchaInput.trim() ? 'The captcha text does not match. Try the new one.' : 'Enter the captcha.'
    setErrors(errs)
    if (errs.captcha) refreshCaptcha()
    if (Object.keys(errs).length) return
    refreshCaptcha()
    cancel()
    const ctl = new AbortController()
    abortRef.current = ctl
    setPhase('loading'); setSelected(null)
    try {
      setResults(await adapter.search(q, ctl.signal))
      setResultFilter('All'); setResultSort('newest')
      setPhase('done')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setPhase('error')
    }
  }

  const reset = () => {
    cancel()
    setV(EMPTY); setOrderFilter(DEFAULT_FILTER); setRoomSel(''); setFrom(''); setTo(''); setErrors({}); setPhase('idle'); setResults([]); setSelected(null); refreshCaptcha()
  }

  const switchMode = (m: OrderMode) => {
    cancel()
    setMode(m); setErrors({}); setPhase('idle'); setResults([]); setSelected(null); refreshCaptcha()
  }

  return (
    <>
      <PageHead title="Court Orders" sub="Find interim and final orders by party name, case number, court number or order date.">
        <Btn kind="soft" onClick={reset}>Reset</Btn>
      </PageHead>

      <div className="demobanner" role="note">
        <strong>Demonstration data.</strong> The form mirrors the structure of the official District Court Orders service, but orders come from a local mock adapter with fictional cases. This prototype is not connected to eCourts, is not affiliated with the judiciary, and must not be used to look up a real order.
      </div>

      <Card>
        <div className="tabrow" role="tablist" aria-label="Search by">
          {ORDER_MODES.map((m) => (
            <button key={m.id} role="tab" id={`otab-${m.id}`} aria-selected={mode === m.id} aria-controls="orderpanel"
              className={`tab ${mode === m.id ? 'active' : ''}`} onClick={() => switchMode(m.id)}>{m.label}</button>
          ))}
        </div>

        <form id="orderpanel" role="tabpanel" aria-labelledby={`otab-${mode}`} onSubmit={run} noValidate>
          <h4 style={{ margin: '0 0 6px' }}>{info.heading}</h4>
          <details className="howto">
            <summary>How to search</summary>
            <p>{info.help}</p>
            <p className="tiny muted">Fields marked with * are required.</p>
          </details>

          <CourtPicker v={v} set={patch} errors={errors} />

          {mode === 'party' && (
            <div className="grid layout2" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
              <Field id="name" label="Petitioner/Respondent" required error={errors.name} hint="At least 3 characters.">
                <input id="name" value={v.name} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-err' : undefined} onChange={(e) => patch({ name: e.target.value })} />
              </Field>
              <YearField v={v} set={patch} errors={errors} label="Year" required />
            </div>
          )}
          {mode === 'caseNumber' && (
            <div className="grid layout3" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
              <CaseTypeField v={v} set={patch} errors={errors} />
              <Field id="number" label="Case Number" required error={errors.number}>
                <input id="number" inputMode="numeric" value={v.number} aria-invalid={!!errors.number} aria-describedby={errors.number ? 'number-err' : undefined} onChange={(e) => patch({ number: e.target.value })} />
              </Field>
              <YearField v={v} set={patch} errors={errors} label="Year" required />
            </div>
          )}

          {mode === 'courtNumber' && (
            <Field id="roomId" label="Court Number" required error={errors.roomId} hint="Court number, judge name, designation and judge period.">
              <select id="roomId" value={roomSel} disabled={!rooms.length} aria-invalid={!!errors.roomId} aria-describedby={errors.roomId ? 'roomId-err' : undefined} onChange={(e) => setRoomSel(e.target.value)}>
                <option value="">Select court number</option>
                {rooms.map((r) => <option key={roomId(r)} value={roomId(r)}>{courtNumberLabel(r)}</option>)}
              </select>
            </Field>
          )}
          {mode === 'orderDate' && (
            <div className="grid layout2" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
              <Field id="from" label="From Date" required error={errors.from}>
                <input id="from" type="date" value={from} aria-invalid={!!errors.from} aria-describedby={errors.from ? 'from-err' : undefined} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field id="to" label="To Date" required error={errors.to} hint="Both dates are included.">
                <input id="to" type="date" value={to} aria-invalid={!!errors.to} aria-describedby={errors.to ? 'to-err' : undefined} onChange={(e) => setTo(e.target.value)} />
              </Field>
            </div>
          )}

          <Radios legend="Order type" name="orderFilter" value={orderFilter} options={FILTER_OPTIONS} labels={FILTER_LABELS} onChange={setOrderFilter} />
          <CaptchaField code={captcha} value={captchaInput} onChange={setCaptchaInput} onRefresh={refreshCaptcha} error={errors.captcha} />

          <div className="actions">
            <button className="btn primary" type="submit" disabled={phase === 'loading'}>{phase === 'loading' ? 'Searching…' : 'Go'}</button>
            <Btn onClick={reset}>Reset</Btn>
          </div>
        </form>
      </Card>

      <div style={{ marginTop: 18 }} aria-live="polite">
        {phase === 'idle' && <div className="empty">Choose a search type, fill in the details and select Go.</div>}
        {phase === 'loading' && (
          <Card><div className="skeleton" /><div className="skeleton" /><div className="skeleton short" /><span className="sr-only">Loading results</span></Card>
        )}
        {phase === 'error' && (
          <Notice>The demonstration service is unavailable. <Btn className="small" onClick={() => run()}>Retry</Btn></Notice>
        )}
        {phase === 'done' && results.length === 0 && (
          <div className="empty">No matching order in the demonstration data. This does not mean no real order exists.</div>
        )}
        {phase === 'done' && results.length > 0 && !selected && (
          <OrderResults results={results} filter={resultFilter} sort={resultSort} onFilter={setResultFilter} onSort={setResultSort} onView={(r) => setSelected(r.record)} />
        )}
        {selected && <CaseDetail c={selected} onBack={() => setSelected(null)} />}
      </div>

      <Card title="Other search services">
        <p className="tiny muted">Cause List and Case Status have demonstrations here. Caveat Search, Process Details and Location are not rebuilt and open the official site.</p>
        <div className="actions">
          <Btn className="small" onClick={() => go('caseStatus')}>Case Status (demo)</Btn>
          {SEARCH_MENU_LINKS.filter((l) => l.page !== 'courtOrders').map((l) => (l.page
            ? <Btn key={l.label} className="small" onClick={() => go(l.page!)}>{l.label} (demo)</Btn>
            : <ExternalLink key={l.label} href={l.url}>{l.label} ↗</ExternalLink>))}
        </div>
      </Card>
    </>
  )
}
