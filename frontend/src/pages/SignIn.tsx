import { useState, type FormEvent } from 'react'
import { useAuth } from '../api/auth'
import { ApiError, messageOf } from '../api/client'

/** Shown instead of the workspace when the backend is in use and nobody is signed in. */
export default function SignIn() {
  const { signIn, register } = useAuth()
  const [mode, setMode] = useState<'in' | 'new'>('in')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setFields({})
    try {
      if (mode === 'in') await signIn(email, password)
      else await register(email, name, password)
    } catch (err) {
      setError(messageOf(err))
      if (err instanceof ApiError) setFields(err.fields)
    } finally { setBusy(false) }
  }

  return (
    <>
      <a className="skip" href="#signin-main">Skip to main content</a>
      <div className="protobar" role="note">Prototype · demonstration data only · do not enter real client information</div>
      <main id="signin-main" tabIndex={-1} style={{ maxWidth: 440, margin: '40px auto', padding: '0 16px' }}>
        <div className="brand" style={{ marginBottom: 16 }}>
          <div className="brandmark">M</div>
          <div><h1>myCourt</h1><small>LEGAL WORKSPACE</small></div>
        </div>
        <section className="card">
          <div className="cardhead"><h2 style={{ fontSize: 18, margin: 0 }}>{mode === 'in' ? 'Sign in' : 'Create an account'}</h2></div>
          <form onSubmit={submit} noValidate aria-describedby={error ? 'signin-error' : undefined}>
            {mode === 'new' && (
              <div className="field">
                <label htmlFor="su-name">Your name</label>
                <input id="su-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!fields.displayName} aria-describedby={fields.displayName ? 'su-name-err' : undefined} />
                {fields.displayName && <span id="su-name-err" role="alert" className="fielderr">{fields.displayName}</span>}
              </div>
            )}
            <div className="field">
              <label htmlFor="su-email">E-mail address</label>
              <input id="su-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!fields.email} aria-describedby={fields.email ? 'su-email-err' : undefined} />
              {fields.email && <span id="su-email-err" role="alert" className="fielderr">{fields.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="su-password">Password</label>
              <input id="su-password" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!fields.password} aria-describedby={fields.password ? 'su-password-err' : 'su-password-hint'} />
              {mode === 'new' && <span id="su-password-hint" className="tiny muted">At least 12 characters.</span>}
              {fields.password && <span id="su-password-err" role="alert" className="fielderr">{fields.password}</span>}
            </div>
            {error && <div id="signin-error" role="alert" className="notice">{error}</div>}
            <div className="actions">
              <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}</button>
              <button className="btn" type="button" onClick={() => { setMode(mode === 'in' ? 'new' : 'in'); setError(''); setFields({}) }}>
                {mode === 'in' ? 'I need an account' : 'I already have an account'}
              </button>
            </div>
          </form>
          <p className="tiny muted">The eCourts Services-site demo does not need an account: <a href="#/services">open it</a>.</p>
        </section>
      </main>
    </>
  )
}
