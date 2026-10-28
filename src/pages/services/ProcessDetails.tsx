import { useRef, useState, type FormEvent } from 'react'
import { Btn, Card, Notice, PageHead, Pill } from '../../components/ui'
import { useLang, useT } from '../../i18n/context'
import { generateCaptcha, verifyCaptcha } from '../../features/caseStatus/captcha'
import type { FieldErrors } from '../../features/caseStatus/validation'
import { REGISTERED_EMAIL_NOTE } from '../../features/services/data'
import { createMockProcessAdapter, validateProcessQuery, type PublicProcess } from '../../features/services/process'
import CaptchaField from '../caseStatus/Captcha'
import { Field } from '../caseStatus/form'
import { fmt } from '../caseStatus/Results'

const adapter = createMockProcessAdapter()
type Phase = 'idle' | 'loading' | 'error' | 'found' | 'notfound'

/**
 * Privacy: the process ID and e-mail live only in this component's state. They are never written to the
 * address bar (the form does not use GET), storage or the console, and the e-mail is never shown back.
 */
export default function ProcessDetails({ onBack }: { onBack?: () => void } = {}) {
  const t = useT()
  const lang = useLang()
  const [processId, setProcessId] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [captcha, setCaptcha] = useState(() => generateCaptcha())
  const [captchaInput, setCaptchaInput] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<PublicProcess | null>(null)
  const abortRef = useRef<AbortController>()

  const refreshCaptcha = () => { setCaptcha(generateCaptcha()); setCaptchaInput('') }

  const run = async (e?: FormEvent) => {
    e?.preventDefault()
    const errs = validateProcessQuery({ processId, email })
    if (!verifyCaptcha(captcha, captchaInput)) errs.captcha = captchaInput.trim() ? 'The captcha text does not match. Try the new one.' : 'Enter the captcha.'
    setErrors(errs)
    if (errs.captcha) refreshCaptcha()
    if (Object.keys(errs).length) return
    refreshCaptcha()
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    setPhase('loading')
    try {
      const r = await adapter.lookup({ processId, email }, ctl.signal)
      setResult(r)
      setPhase(r ? 'found' : 'notfound')
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setPhase('error')
    }
  }

  const reset = () => { abortRef.current?.abort(); setProcessId(''); setEmail(''); setErrors({}); setPhase('idle'); setResult(null); refreshCaptcha() }

  return (
    <>
      <PageHead title="Process Details" sub="Look up a process by its process ID and the e-mail address registered with the court.">
        <Btn kind="soft" onClick={reset}>Reset</Btn>
      </PageHead>

      <div className="demobanner" role="note">
        <strong>{t('Demonstration data.')}</strong> {t('The form follows the official "Search By Process ID" fields, but what the official page shows after a search was not observed. Processes are fictional (try PRC-DEMO-0001 with advocate.one@example.invalid). Nothing here is connected to eCourts or affiliated with the judiciary, and the e-mail address you type is never stored, logged or repeated in the result.')}
      </div>

      <Card>
        <form onSubmit={run} noValidate aria-label={t('Search By Process ID')}>
          <h4 style={{ margin: '0 0 8px' }}>{t('Search By Process ID')}</h4>
          <div className="grid layout2" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
            <Field id="processId" label="Process ID" required error={errors.processId}>
              <input id="processId" autoComplete="off" value={processId} aria-invalid={!!errors.processId} aria-describedby={errors.processId ? 'processId-err' : undefined} onChange={(e) => setProcessId(e.target.value)} />
            </Field>
            <Field id="email" label="Email Id" required error={errors.email} hint={REGISTERED_EMAIL_NOTE}>
              <input id="email" type="email" autoComplete="off" value={email} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-err' : undefined} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          <CaptchaField code={captcha} value={captchaInput} onChange={setCaptchaInput} onRefresh={refreshCaptcha} error={errors.captcha} />
          <div className="actions">
            <button className="btn primary" type="submit" disabled={phase === 'loading'}>{phase === 'loading' ? t('Searching…') : t('Search')}</button>
            <Btn onClick={reset}>Reset</Btn>
            {onBack && <Btn onClick={onBack}>Back</Btn>}
          </div>
        </form>
      </Card>

      <div style={{ marginTop: 18 }} aria-live="polite">
        {phase === 'idle' && <div className="empty">{t('Enter the process ID and the registered e-mail address, then select {action}.', { action: t('Search') })}</div>}
        {phase === 'loading' && <Card><div className="skeleton" /><div className="skeleton short" /><span className="sr-only">{t('Loading')}</span></Card>}
        {phase === 'error' && <Notice>{t('The demonstration service is unavailable.')} <Btn className="small" onClick={() => run()}>Retry</Btn></Notice>}
        {phase === 'notfound' && (
          <div className="empty">{t('No process was found for the details entered. Check the process ID and that the e-mail address is the one registered with the court.')}</div>
        )}
        {phase === 'found' && result && (
          <Card title={t('Process {id}', { id: result.processId })}>
            <div className="grid layout3" style={{ marginBottom: 12 }}>
              <div><div className="muted tiny">{t('Type')}</div><strong>{t(result.type)}</strong></div>
              <div><div className="muted tiny">{t('Status')}</div><Pill kind={result.status === 'Served' ? 'green' : result.status === 'Returned' ? 'blue' : 'amber'}>{t(result.status)}</Pill></div>
              <div><div className="muted tiny">{t('Issued on')}</div><strong>{fmt(result.issuedOn, lang)}</strong></div>
              <div><div className="muted tiny">{t('Case')}</div><strong>{result.caseRef}</strong></div>
              <div><div className="muted tiny">{t('Court')}</div><strong>{t(result.court)}</strong></div>
            </div>
            <Notice>{t('Demonstration record. The layout of the official result was not observed.')}</Notice>
          </Card>
        )}
      </div>
    </>
  )
}
