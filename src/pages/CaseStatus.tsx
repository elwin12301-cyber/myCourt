import { useRef, useState, type FormEvent } from 'react'
import { Btn, Card, Notice, PageHead } from '../components/ui'
import ExternalLink from '../components/ExternalLink'
import { generateCaptcha, verifyCaptcha } from '../features/caseStatus/captcha'
import { createMockAdapter } from '../features/caseStatus/mockAdapter'
import { helpVideoUrl, MODES, SEARCH_MENU_LINKS } from '../features/caseStatus/referenceData'
import { validateQuery, type FieldErrors } from '../features/caseStatus/validation'
import type { CaseRecord, SearchMode } from '../features/caseStatus/types'
import CaptchaField from './caseStatus/Captcha'
import CaseDetail from './caseStatus/Detail'
import { buildQuery, EMPTY, ModeFields, type FormValues } from './caseStatus/form'
import Results from './caseStatus/Results'

const adapter = createMockAdapter()

type Phase = 'idle' | 'loading' | 'error' | 'done'

export default function CaseStatusPage({ initialMode = 'cnr' }: { initialMode?: SearchMode } = {}) {
  const [mode, setMode] = useState<SearchMode>(initialMode)
  const [v, setV] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [captcha, setCaptcha] = useState(() => generateCaptcha())
  const [captchaInput, setCaptchaInput] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [results, setResults] = useState<CaseRecord[]>([])
  const [selected, setSelected] = useState<CaseRecord | null>(null)
  const abortRef = useRef<AbortController>()

  const info = MODES.find((m) => m.id === mode)!
  const patch = (p: Partial<FormValues>) => setV((s) => ({ ...s, ...p }))
  const refreshCaptcha = () => { setCaptcha(generateCaptcha()); setCaptchaInput('') }

  const run = async (e?: FormEvent) => {
    e?.preventDefault()
    const q = buildQuery(mode, v)
    const errs = validateQuery(q)
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
      setResults(await adapter.search(q, ctl.signal))
      setPhase('done')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setPhase('error')
    }
  }

  const reset = () => {
    abortRef.current?.abort()
    setV(EMPTY); setErrors({}); setPhase('idle'); setResults([]); setSelected(null); refreshCaptcha()
  }

  const switchMode = (m: SearchMode) => {
    abortRef.current?.abort()
    setMode(m); setErrors({}); setPhase('idle'); setResults([]); setSelected(null); refreshCaptcha()
  }

  const resultTitle = mode === 'advocate' && v.by === 'caseListDate' ? `Cause list for ${v.date}` : 'Search results'

  return (
    <>
      <PageHead title="Case Status" sub="Search by CNR, party name, case number, filing number, advocate, FIR number, act or case type, then view the case history.">
        <Btn kind="soft" onClick={reset}>Reset</Btn>
      </PageHead>

      <div className="demobanner" role="note">
        <strong>Demonstration data.</strong> The form mirrors the structure of the official District Court Case Status service, but results come from a local mock adapter with fictional records. This prototype is not connected to eCourts, is not affiliated with the judiciary, and must not be used to check a real case.
      </div>

      <Card>
        <div className="tabrow" role="tablist" aria-label="Search by">
          {MODES.map((m) => (
            <button key={m.id} role="tab" id={`tab-${m.id}`} aria-selected={mode === m.id} aria-controls="searchpanel"
              className={`tab ${mode === m.id ? 'active' : ''}`} onClick={() => switchMode(m.id)}>{m.label}</button>
          ))}
        </div>

        <form id="searchpanel" role="tabpanel" aria-labelledby={`tab-${mode}`} onSubmit={run} noValidate>
          <h4 style={{ margin: '0 0 6px' }}>{info.heading}</h4>
          <details className="howto">
            <summary>How to search</summary>
            <p>{info.help}</p>
            <p className="tiny muted">Fields marked with * are required.</p>
            {info.videoKey && <ExternalLink href={helpVideoUrl(info.videoKey)}>Click here to view help video ↗</ExternalLink>}
          </details>

          <ModeFields mode={mode} v={v} set={patch} errors={errors} />
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
          <div className="empty">No matching record in the demonstration data. This does not mean a real case does not exist.</div>
        )}
        {phase === 'done' && results.length > 0 && !selected && <Results results={results} title={resultTitle} onView={setSelected} />}
        {selected && <CaseDetail c={selected} onBack={() => setSelected(null)} />}
      </div>

      <Card title="Other search services on the official site">
        <p className="tiny muted">The official Search menu also lists these services. They are not rebuilt here; each opens the official site.</p>
        <div className="actions">
          {SEARCH_MENU_LINKS.map((l) => <ExternalLink key={l.label} href={l.url}>{l.label} ↗</ExternalLink>)}
        </div>
      </Card>
    </>
  )
}
