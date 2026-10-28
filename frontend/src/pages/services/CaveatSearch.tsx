import { useRef, useState, type FormEvent } from 'react'
import { caveatAdapter } from '../../api/adapters'
import { Btn, Card, Notice, PageHead, Pill } from '../../components/ui'
import { useLang, useT } from '../../i18n/context'
import { generateCaptcha, verifyCaptcha } from '../../features/caseStatus/captcha'
import type { FieldErrors } from '../../features/caseStatus/validation'
import {
  SUBORDINATE_COURTS, validateCaveatQuery, type Caveat, type CaveatQuery, type CaveatRole, type NameMatch,
} from '../../features/services/caveat'
import CaptchaField from '../caseStatus/Captcha'
import { CaseTypeField, courtOf, CourtPicker, EMPTY, Field, Radios, YearField, type FormValues } from '../caseStatus/form'
import { fmt } from '../caseStatus/Results'

const adapter = caveatAdapter()
type Phase = 'idle' | 'loading' | 'error' | 'done'
type Mode = CaveatQuery['mode']

const TABS: { id: Mode; label: string; help: string }[] = [
  { id: 'name', label: 'Caveator/Caveatee Name', help: 'Choose Anywhere or Starting with, choose whether you are searching the caveator or the caveatee, and enter at least 3 characters of the name.' },
  { id: 'caseNumber', label: 'Case Number', help: 'Select the subordinate court if you know it, then the case type, case number and year. The date of decision is optional.' },
  { id: 'filingNumber', label: 'Filing Number', help: 'Select the subordinate court if you know it, then the case type, filing number and year.' },
  { id: 'caveatNumber', label: 'Caveat Number', help: 'The system will display the caveat when you enter a part of the Caveat Number and the year.' },
]

function build(mode: Mode, v: FormValues, x: { role: CaveatRole; match: NameMatch; sub: string; decision: string; caveatNo: string }): CaveatQuery {
  const court = courtOf(v)
  switch (mode) {
    case 'name': return { mode, court, role: x.role, match: x.match, name: v.name }
    case 'caseNumber': return { mode, court, subordinateCourt: x.sub, caseType: v.caseType, number: v.number, year: v.year, decisionDate: x.decision }
    case 'filingNumber': return { mode, court, subordinateCourt: x.sub, caseType: v.caseType, number: v.number, year: v.year }
    case 'caveatNumber': return { mode, court, caveatNumber: x.caveatNo, year: v.year }
  }
}

export default function CaveatSearch({ initialMode = 'name', onBack }: { initialMode?: Mode; onBack?: () => void } = {}) {
  const t = useT()
  const lang = useLang()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [v, setV] = useState<FormValues>(EMPTY)
  const [role, setRole] = useState<CaveatRole>('caveator')
  const [match, setMatch] = useState<NameMatch>('anywhere')
  const [sub, setSub] = useState('')
  const [decision, setDecision] = useState('')
  const [caveatNo, setCaveatNo] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [captcha, setCaptcha] = useState(() => generateCaptcha())
  const [captchaInput, setCaptchaInput] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [results, setResults] = useState<Caveat[]>([])
  const abortRef = useRef<AbortController>()

  const tab = TABS.find((x) => x.id === mode)!
  const patch = (p: Partial<FormValues>) => setV((s) => ({ ...s, ...p }))
  const refreshCaptcha = () => { setCaptcha(generateCaptcha()); setCaptchaInput('') }
  const cancel = () => abortRef.current?.abort()

  const run = async (e?: FormEvent) => {
    e?.preventDefault()
    const q = build(mode, v, { role, match, sub, decision, caveatNo })
    const errs = validateCaveatQuery(q)
    if (!verifyCaptcha(captcha, captchaInput)) errs.captcha = captchaInput.trim() ? 'The captcha text does not match. Try the new one.' : 'Enter the captcha.'
    setErrors(errs)
    if (errs.captcha) refreshCaptcha()
    if (Object.keys(errs).length) return
    refreshCaptcha()
    cancel()
    const ctl = new AbortController()
    abortRef.current = ctl
    setPhase('loading')
    try { setResults(await adapter.search(q, ctl.signal)); setPhase('done') } catch (err) { if ((err as Error).name !== 'AbortError') setPhase('error') }
  }

  const reset = () => { cancel(); setV(EMPTY); setRole('caveator'); setMatch('anywhere'); setSub(''); setDecision(''); setCaveatNo(''); setErrors({}); setPhase('idle'); setResults([]); refreshCaptcha() }
  const switchMode = (m: Mode) => { cancel(); setMode(m); setErrors({}); setPhase('idle'); setResults([]); refreshCaptcha() }

  const subordinate = (
    <Field id="sub" label="Subordinate Court">
      <select id="sub" value={sub} onChange={(e) => setSub(e.target.value)}>
        <option value="">{t('Select subordinate court')}</option>
        {SUBORDINATE_COURTS.map((c) => <option key={c} value={c}>{t(c)}</option>)}
      </select>
    </Field>
  )
  const grid = { alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' } as const

  return (
    <>
      <PageHead title="Caveat Search" sub="Find an active caveat by caveator or caveatee name, case number, filing number or caveat number.">
        <Btn kind="soft" onClick={reset}>Reset</Btn>
      </PageHead>

      <div className="demobanner" role="note">
        <strong>{t('Demonstration data.')}</strong> {t('The fields follow the official Caveat Search page, but the official page does not say how they are grouped, so this prototype groups them into four searches. Caveats are fictional; nothing here is connected to eCourts or affiliated with the judiciary.')}
      </div>

      <Card>
        <div className="tabrow" role="tablist" aria-label={t('Search by')}>
          {TABS.map((x) => (
            <button key={x.id} role="tab" id={`ctab-${x.id}`} aria-selected={mode === x.id} aria-controls="caveatpanel"
              className={`tab ${mode === x.id ? 'active' : ''}`} onClick={() => switchMode(x.id)}>{t(x.label)}</button>
          ))}
        </div>

        <form id="caveatpanel" role="tabpanel" aria-labelledby={`ctab-${mode}`} onSubmit={run} noValidate>
          <details className="howto">
            <summary>{t('How to search')}</summary>
            <p>{t('Select the state, district and court complex, then complete the fields below, enter the captcha and select Go.')} {t(tab.help)}</p>
            <p className="tiny muted">{t('Only active caveats that match are displayed. The official help text also mentions Soundex matching, which the form does not offer. Fields marked with * are required.')}</p>
          </details>

          <CourtPicker v={v} set={patch} errors={errors} />

          {mode === 'name' && (
            <>
              <Radios legend="Name matching" name="match" value={match} options={['anywhere', 'startingWith']} labels={{ anywhere: 'Anywhere', startingWith: 'Starting with' }} onChange={setMatch} />
              <div className="grid layout2" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                <Field id="name" label="Caveator/Caveatee Name" required error={errors.name} hint="At least 3 characters.">
                  <input id="name" value={v.name} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-err' : undefined} onChange={(e) => patch({ name: e.target.value })} />
                </Field>
                <Radios legend="Search in" name="role" value={role} options={['caveator', 'caveatee']} labels={{ caveator: 'Caveator', caveatee: 'Caveatee' }} onChange={setRole} />
              </div>
            </>
          )}
          {(mode === 'caseNumber' || mode === 'filingNumber') && (
            <div className="grid layout3" style={grid}>
              {subordinate}
              <CaseTypeField v={v} set={patch} errors={errors} />
              <Field id="number" label={mode === 'filingNumber' ? 'Filing Number' : 'Case Number'} required error={errors.number}>
                <input id="number" inputMode="numeric" value={v.number} aria-invalid={!!errors.number} aria-describedby={errors.number ? 'number-err' : undefined} onChange={(e) => patch({ number: e.target.value })} />
              </Field>
              <YearField v={v} set={patch} errors={errors} label="Year" required />
              {mode === 'caseNumber' && (
                <Field id="decision" label="Date of Decision" error={errors.decisionDate} hint="Optional.">
                  <input id="decision" type="date" value={decision} aria-invalid={!!errors.decisionDate} aria-describedby={errors.decisionDate ? 'decision-err' : undefined} onChange={(e) => setDecision(e.target.value)} />
                </Field>
              )}
            </div>
          )}
          {mode === 'caveatNumber' && (
            <div className="grid layout2" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
              <Field id="caveatNo" label="Caveat Number" required error={errors.caveatNumber} hint="A part of the number is enough.">
                <input id="caveatNo" inputMode="numeric" value={caveatNo} aria-invalid={!!errors.caveatNumber} aria-describedby={errors.caveatNumber ? 'caveatNo-err' : undefined} onChange={(e) => setCaveatNo(e.target.value)} />
              </Field>
              <YearField v={v} set={patch} errors={errors} label="Year" required />
            </div>
          )}

          <CaptchaField code={captcha} value={captchaInput} onChange={setCaptchaInput} onRefresh={refreshCaptcha} error={errors.captcha} />
          <div className="actions">
            <button className="btn primary" type="submit" disabled={phase === 'loading'}>{phase === 'loading' ? t('Searching…') : t('Go')}</button>
            <Btn onClick={reset}>Reset</Btn>
            {onBack && <Btn onClick={onBack}>Back</Btn>}
          </div>
        </form>
      </Card>

      <div style={{ marginTop: 18 }} aria-live="polite">
        {phase === 'idle' && <div className="empty">{t('Choose a search type, fill in the details and select {action}.', { action: t('Go') })}</div>}
        {phase === 'loading' && <Card><div className="skeleton" /><div className="skeleton" /><div className="skeleton short" /><span className="sr-only">{t('Loading results')}</span></Card>}
        {phase === 'error' && <Notice>{t('The demonstration service is unavailable.')} <Btn className="small" onClick={() => run()}>Retry</Btn></Notice>}
        {phase === 'done' && results.length === 0 && <div className="empty">{t('No active caveat matches in the demonstration data. This does not mean no real caveat exists.')}</div>}
        {phase === 'done' && results.length > 0 && (
          <Card title={t('Active caveats · {n}', { n: results.length })}>
            <div className="tablewrap">
              <table>
                <caption className="sr-only">{t('Caveats (demonstration data)')}</caption>
                <thead><tr>{['Sr No', 'Caveat Number/Year', 'Caveator versus Caveatee', 'Court', 'Subordinate case', 'Date of decision', 'Status'].map((h) => <th key={h} scope="col">{t(h)}</th>)}</tr></thead>
                <tbody>
                  {results.map((c, i) => (
                    <tr key={`${c.caveatNumber}-${c.year}`}>
                      <td>{i + 1}</td>
                      <td><strong>{c.caveatNumber}/{c.year}</strong></td>
                      <td>{`${c.caveator} ${t('versus')} ${c.caveatee}`}</td>
                      <td>{t(c.court.establishment)}<small>{`${t(c.court.complex)}, ${t(c.court.district)}`}</small></td>
                      <td>{`${t(c.caseType)}/${c.caseNumber}/${c.caseYear}`}<small>{t('{court} · filing {number}', { court: t(c.subordinateCourt), number: `${c.filingNumber}/${c.filingYear}` })}</small></td>
                      <td>{fmt(c.decisionDate, lang)}</td>
                      <td><Pill kind="green">{t(c.status)}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="tiny muted">{t("Column layout is this prototype's design; the official results were not observed.")}</p>
          </Card>
        )}
      </div>
    </>
  )
}
