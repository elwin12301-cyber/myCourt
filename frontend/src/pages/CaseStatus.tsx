import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Btn, Card, Notice, PageHead } from '../components/ui'
import { useApp } from '../context'
import { useT } from '../i18n/context'
import ExternalLink from '../components/ExternalLink'
import { generateCaptcha, verifyCaptcha } from '../features/caseStatus/captcha'
import { caseAdapter } from '../api/adapters'
import { helpVideoUrl, MODES, SEARCH_MENU_LINKS } from '../features/caseStatus/referenceData'
import { validateQuery, type FieldErrors } from '../features/caseStatus/validation'
import type { CaseRecord, SearchMode } from '../features/caseStatus/types'
import CaptchaField from './caseStatus/Captcha'
import CaseDetail from './caseStatus/Detail'
import { buildQuery, EMPTY, ModeFields, type FormValues } from './caseStatus/form'
import Results from './caseStatus/Results'

const adapter = caseAdapter()

type Phase = 'idle' | 'loading' | 'error' | 'done'

/** Options that let the eCourts Services site reuse this page with the official separation of CNR and Case Status. */
export interface CaseStatusOptions {
  initialMode?: SearchMode
  /** Which searches to offer; with a single mode the tab row is hidden. */
  modes?: SearchMode[]
  title?: string
  sub?: string
  submitLabel?: string
  onBack?: () => void
  hideOtherServices?: boolean
  footerNote?: ReactNode
}

export default function CaseStatusPage({
  initialMode, modes, title = 'Case Status',
  sub = 'Search by CNR, party name, case number, filing number, advocate, FIR number, act or case type, then view the case history.',
  submitLabel = 'Go', onBack, hideOtherServices = false, footerNote,
}: CaseStatusOptions = {}) {
  const { go } = useApp()
  const t = useT()
  const visibleModes = modes?.length ? MODES.filter((m) => modes.includes(m.id)) : MODES
  const [mode, setMode] = useState<SearchMode>(initialMode ?? visibleModes[0].id)
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

  const resultTitle = mode === 'advocate' && v.by === 'caseListDate' ? t('Cause list for {date}', { date: v.date }) : t('Search results')

  return (
    <>
      <PageHead title={title} sub={sub}>
        <Btn kind="soft" onClick={reset}>Reset</Btn>
      </PageHead>

      <div className="demobanner" role="note">
        <strong>{t('Demonstration data.')}</strong> {t('The form mirrors the structure of the official District Court Case Status service, but results come from a local mock adapter with fictional records. This prototype is not connected to eCourts, is not affiliated with the judiciary, and must not be used to check a real case.')}
      </div>

      <Card>
        {visibleModes.length > 1 && (
          <div className="tabrow" role="tablist" aria-label={t('Search by')}>
            {visibleModes.map((m) => (
              <button key={m.id} role="tab" id={`tab-${m.id}`} aria-selected={mode === m.id} aria-controls="searchpanel"
                className={`tab ${mode === m.id ? 'active' : ''}`} onClick={() => switchMode(m.id)}>{t(m.label)}</button>
            ))}
          </div>
        )}

        <form id="searchpanel" role={visibleModes.length > 1 ? 'tabpanel' : undefined} aria-labelledby={visibleModes.length > 1 ? `tab-${mode}` : undefined} aria-label={visibleModes.length > 1 ? undefined : t(info.heading)} onSubmit={run} noValidate>
          <h4 style={{ margin: '0 0 6px' }}>{t('Case Status')} : {t(info.heading)}</h4>
          <details className="howto">
            <summary>{t('How to search')}</summary>
            <p>{t(info.help)}</p>
            <p className="tiny muted">{t('Fields marked with * are required.')}</p>
            {info.videoKey && <ExternalLink href={helpVideoUrl(info.videoKey)}>{t('Click here to view help video')} ↗</ExternalLink>}
          </details>

          <ModeFields mode={mode} v={v} set={patch} errors={errors} />
          <CaptchaField code={captcha} value={captchaInput} onChange={setCaptchaInput} onRefresh={refreshCaptcha} error={errors.captcha} />

          <div className="actions">
            <Btn kind="primary" type="submit" disabled={phase === 'loading'}>{phase === 'loading' ? t('Searching…') : t(submitLabel)}</Btn>
            <Btn onClick={reset}>Reset</Btn>
            {onBack && <Btn onClick={onBack}>Back</Btn>}
          </div>
          {footerNote}
        </form>
      </Card>

      <div style={{ marginTop: 18 }} aria-live="polite">
        {phase === 'idle' && <div className="empty">{t('Choose a search type, fill in the details and select {action}.', { action: t(submitLabel) })}</div>}
        {phase === 'loading' && (
          <Card><div className="skeleton" /><div className="skeleton" /><div className="skeleton short" /><span role="status" className="muted">{t('Loading results')}</span></Card>
        )}
        {phase === 'error' && (
          <Notice>{t('The demonstration service is unavailable.')} <Btn className="small" onClick={() => run()}>Retry</Btn></Notice>
        )}
        {phase === 'done' && results.length === 0 && (
          <div className="empty">{t('No matching record in the demonstration data. This does not mean a real case does not exist.')}</div>
        )}
        {phase === 'done' && results.length > 0 && <div hidden={!!selected}><Results results={results} title={resultTitle} onView={setSelected} /></div>}
        {selected && <CaseDetail c={selected} onBack={() => setSelected(null)} />}
      </div>

      {!hideOtherServices && (
        <Card title="Other search services on the official site">
          <p className="tiny muted">{t('The official Search menu also lists these services. Cause List and Court Orders have demos here; the others are not rebuilt and open the official site.')}</p>
          <div className="actions">
            {SEARCH_MENU_LINKS.map((l) => (l.page
              ? <Btn key={l.label} className="small" onClick={() => go(l.page!)}>{`${t(l.label)} (${t('demo')})`}</Btn>
              : <ExternalLink key={l.label} href={l.url}>{t(l.label)} ↗</ExternalLink>))}
          </div>
        </Card>
      )}
    </>
  )
}
