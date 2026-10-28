import { useT } from '../../i18n/context'
import { Field } from './form'

export default function CaptchaField({ code, value, onChange, onRefresh, error }: {
  code: string; value: string; onChange: (v: string) => void; onRefresh: () => void; error?: string
}) {
  const t = useT()
  const speak = () => {
    try {
      const u = new SpeechSynthesisUtterance(code.split('').join(' '))
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    } catch { /* speech not available */ }
  }
  return (
    <div className="captcharow">
      <div>
        <div className="captcha" aria-label={t('Demonstration captcha: {code}', { code: code.split('').join(' ') })}>{code}</div>
        <div className="actions" style={{ marginTop: 6 }}>
          <button type="button" className="btn small" onClick={onRefresh}>↻ {t('Refresh')}<span className="sr-only"> {t('captcha')}</span></button>
          <button type="button" className="btn small" onClick={speak}>🔊 {t('Listen')}</button>
        </div>
      </div>
      <Field id="captcha" label="Enter Captcha" required error={error} hint="Demonstration CAPTCHA with no security purpose; the official service uses its own.">
        <input id="captcha" value={value} autoComplete="off" maxLength={12} aria-invalid={!!error} aria-describedby={error ? 'captcha-err' : undefined} onChange={(e) => onChange(e.target.value)} />
      </Field>
    </div>
  )
}
