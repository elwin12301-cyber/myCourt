import { useRef, useState, type FormEvent } from 'react'
import { Btn, Card, Notice, PageHead, Pill } from '../components/ui'
import { generateCaptcha, verifyCaptcha } from '../features/caseStatus/captcha'
import type { CaseRecord } from '../features/caseStatus/types'
import type { FieldErrors } from '../features/caseStatus/validation'
import { createMockCauseListAdapter, validateCauseList, type CauseListResult } from '../features/causeList/causeList'
import { roomId, roomLabel, roomsFor, type CauseListKind } from '../features/causeList/courtRooms'
import CaptchaField from './caseStatus/Captcha'
import CaseDetail from './caseStatus/Detail'
import { courtOf, CourtPicker, EMPTY, Field, type FormValues } from './caseStatus/form'
import { fmt } from './caseStatus/Results'

const adapter = createMockCauseListAdapter()
type Phase = 'idle' | 'loading' | 'error' | 'done'

export default function CauseListPage() {
  const [v, setV] = useState<FormValues>(EMPTY)
  const [roomSel, setRoomSel] = useState('')
  const [date, setDate] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [captcha, setCaptcha] = useState(() => generateCaptcha())
  const [captchaInput, setCaptchaInput] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<CauseListResult | null>(null)
  const [selected, setSelected] = useState<CaseRecord | null>(null)
  const lastKind = useRef<CauseListKind>('Civil')
  const abortRef = useRef<AbortController>()

  const court = courtOf(v)
  const rooms = roomsFor(court)
  const patch = (p: Partial<FormValues>) => {
    setV((s) => ({ ...s, ...p }))
    if ('state' in p || 'district' in p || 'complex' in p || 'establishment' in p) setRoomSel('')
  }
  const refreshCaptcha = () => { setCaptcha(generateCaptcha()); setCaptchaInput('') }

  const run = async (kind: CauseListKind) => {
    lastKind.current = kind
    const q = { court, roomId: roomSel, date, kind }
    const errs = validateCauseList(q)
    if (!verifyCaptcha(captcha, captchaInput)) errs.captcha = captchaInput.trim() ? 'The captcha text does not match. Try the new one.' : 'Enter the captcha.'
    setErrors(errs)
    if (errs.captcha) refreshCaptcha()
    if (Object.keys(errs).length) return
    refreshCaptcha()
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    setPhase('loading'); setSelected(null)
    try {
      setResult(await adapter.fetch(q, ctl.signal))
      setPhase('done')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setPhase('error')
    }
  }

  const reset = () => {
    abortRef.current?.abort()
    setV(EMPTY); setRoomSel(''); setDate(''); setErrors({}); setPhase('idle'); setResult(null); setSelected(null); refreshCaptcha()
  }

  const submit = (e: FormEvent) => e.preventDefault()

  return (
    <>
      <PageHead title="Cause List" sub="Choose a court and a date, then show its Civil or Criminal cause list.">
        <Btn kind="soft" onClick={reset}>Reset</Btn>
      </PageHead>

      <div className="demobanner" role="note">
        <strong>Demonstration data.</strong> The form mirrors the structure of the official District Court Cause List service, but lists come from a local mock adapter with fictional cases and judges. This prototype is not connected to eCourts and is not affiliated with the judiciary.
        <br />As the official page says: cause list displayed may differ from the actual cause list; for further queries, contact the court administrator.
      </div>

      <Card>
        <form onSubmit={submit} noValidate>
          <details className="howto">
            <summary>How to search</summary>
            <p>Select the state, district and court complex, then the court name and the cause list date. Enter the captcha, then select Civil or Criminal to show that list.</p>
            <p className="tiny muted">Fields marked with * are required. Try Tamil Nadu › Chennai › Principal Sessions Court Complex › court 12 › 2026-10-28 › Criminal.</p>
          </details>

          <CourtPicker v={v} set={patch} errors={errors} />

          <div className="grid layout2" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
            <Field id="roomId" label="Court Name" required error={errors.roomId} hint="Court number, judge name and designation.">
              <select id="roomId" value={roomSel} disabled={!rooms.length} aria-invalid={!!errors.roomId} aria-describedby={errors.roomId ? 'roomId-err' : undefined} onChange={(e) => setRoomSel(e.target.value)}>
                <option value="">Select court</option>
                {rooms.map((r) => <option key={roomId(r)} value={roomId(r)}>{roomLabel(r)}</option>)}
              </select>
            </Field>
            <Field id="date" label="Cause List Date" required error={errors.date}>
              <input id="date" type="date" value={date} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'date-err' : undefined} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          <CaptchaField code={captcha} value={captchaInput} onChange={setCaptchaInput} onRefresh={refreshCaptcha} error={errors.captcha} />

          <div className="actions">
            <button type="button" className="btn primary" disabled={phase === 'loading'} onClick={() => run('Civil')}>Civil</button>
            <button type="button" className="btn primary" disabled={phase === 'loading'} onClick={() => run('Criminal')}>Criminal</button>
            <Btn onClick={reset}>Reset</Btn>
          </div>
        </form>
      </Card>

      <div style={{ marginTop: 18 }} aria-live="polite">
        {phase === 'idle' && <div className="empty">Select a court and date, then choose Civil or Criminal.</div>}
        {phase === 'loading' && (
          <Card><div className="skeleton" /><div className="skeleton" /><div className="skeleton short" /><span className="sr-only">Loading cause list</span></Card>
        )}
        {phase === 'error' && <Notice>The demonstration service is unavailable. <Btn className="small" onClick={() => run(lastKind.current)}>Retry</Btn></Notice>}

        {phase === 'done' && result && !selected && (
          <Card title={`${result.kind} cause list · ${fmt(result.date)}`}>
            <p className="muted">Court {result.room.number} · {result.room.judge} · {result.room.designation}<br />{result.room.establishment}, {result.room.complex}, {result.room.district}, {result.room.state}</p>
            {result.entries.length === 0 ? (
              <div className="empty">No {result.kind.toLowerCase()} matters are listed for this court on this date in the demonstration data. This does not mean none are listed in reality.</div>
            ) : (
              <>
                <div className="actions" style={{ marginBottom: 10 }}>
                  <Pill kind="blue">{result.entries.length} matter{result.entries.length === 1 ? '' : 's'}</Pill>
                  <Btn className="small" onClick={() => window.print()}>Print</Btn>
                </div>
                <div className="tablewrap">
                  <table>
                    <caption className="sr-only">Cause list (demonstration data)</caption>
                    <thead><tr><th scope="col">Sr No</th><th scope="col">Case Type/Case Number/Case Year</th><th scope="col">Petitioner versus Respondent</th><th scope="col">Advocates</th><th scope="col">Purpose</th><th scope="col">View</th></tr></thead>
                    <tbody>
                      {result.entries.map(({ serial, record: c }) => (
                        <tr key={c.cnr}>
                          <td>{serial}</td>
                          <td><strong>{c.caseType}/{c.caseNumber}/{c.year}</strong><small>{c.cnr}</small></td>
                          <td>{c.petitioner} versus {c.respondent}</td>
                          <td>{c.petitionerAdvocate.name}<small>{c.respondentAdvocate.name}</small></td>
                          <td>{c.stage}</td>
                          <td><Btn className="small" onClick={() => setSelected(c)}>View<span className="sr-only"> case {c.caseNumber}/{c.year}</span></Btn></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <p className="tiny muted">Column layout is this prototype&apos;s design; the official cause list table was not observed. Print is an addition; the official page shows no print or PDF control.</p>
          </Card>
        )}
        {selected && <CaseDetail c={selected} onBack={() => setSelected(null)} />}
      </div>
    </>
  )
}
