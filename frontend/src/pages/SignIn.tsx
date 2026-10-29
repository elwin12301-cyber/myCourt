import { useState, type FormEvent } from 'react'
import { useAuth } from '../api/auth'
import { ApiError, messageOf } from '../api/client'
import { Message } from '../components/blocks'
import { Button, Checkbox, FormControlLabel, Link, Stack, TextField, Typography } from '../components/kit'

/** Shown instead of the workspace when the backend is in use and nobody is signed in. */
export default function SignIn() {
  const { signIn, register } = useAuth()
  const [mode, setMode] = useState<'in' | 'new'>('in')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [needCode, setNeedCode] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setFields({})
    try {
      if (mode === 'in') await signIn(email, password, needCode ? code : undefined)
      else await register(email, name, password)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'mfa_required') { setNeedCode(true); setError('') }
      else setError(messageOf(err))
      if (err instanceof ApiError) setFields(err.fields)
    } finally { setBusy(false) }
  }

  return (
    <>
      <a className="skip" href="#signin-main">Skip to main content</a>
      <div className="protobar" role="note">Prototype · demonstration data only · do not enter real client information</div>
      <div className="authwrap">
        <aside className="authhero" aria-label="About myCourt">
          <div className="authbrand">
            <div className="brandmark" aria-hidden="true">M</div>
            <div><h1>myCourt</h1><small>LEGAL WORKSPACE</small></div>
          </div>
          <h2>Your practice, <em>organised</em> and always one step ahead.</h2>
          <p>Matters, hearings, documents and drafts in one private workspace. Everything generated is a draft until you approve it.</p>
          <ul className="authpoints">
            <li><i aria-hidden="true">🔒</i>Private by matter, with a tamper-evident audit trail</li>
            <li><i aria-hidden="true">⚖</i>Hearing preparation, deadlines and time billing</li>
            <li><i aria-hidden="true">🎙</i>Hands-free voice control throughout</li>
          </ul>
        </aside>
        <main className="authpanel" id="signin-main" tabIndex={-1}>
          <div className="authcard">
            <h2>{mode === 'in' ? 'Welcome back' : 'Create an account'}</h2>
            <p className="authsub">{mode === 'in' ? 'Sign in to your workspace.' : 'It takes a minute. Use demonstration details only.'}</p>
            <form onSubmit={submit} noValidate>
              {mode === 'new' && (
                <TextField id="su-name" label="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
                  error={!!fields.displayName} helperText={fields.displayName} slotProps={{ formHelperText: { role: 'alert' } }} />
              )}
              <TextField id="su-email" name="email" label={mode === 'in' ? 'E-mail or username' : 'E-mail address'} type="text" autoComplete="username"
                value={email} onChange={(e) => setEmail(e.target.value)} error={!!fields.email} helperText={fields.email}
                slotProps={{ htmlInput: { spellCheck: false, autoCapitalize: 'none', inputMode: 'email' }, formHelperText: { role: 'alert' } }} />
              <TextField id="su-password" name="password" label="Password" type={showPw ? 'text' : 'password'} autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                value={password} onChange={(e) => setPassword(e.target.value)} error={!!fields.password}
                helperText={fields.password || (mode === 'new' ? 'At least 12 characters.' : undefined)}
                slotProps={{ formHelperText: { role: fields.password ? 'alert' : undefined } }} />
              <FormControlLabel control={<Checkbox checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />} label="Show password" style={{ marginBottom: 8 }} />
              {needCode && mode === 'in' && (
                <TextField id="su-code" label="Authenticator code" autoFocus autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)}
                  helperText="Enter the 6-digit code from your authenticator app." slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }} />
              )}
              {error && <Message severity="warning">{error}</Message>}
              <Stack direction="row" spacing={1} useFlexGap style={{ marginTop: 16, flexWrap: 'wrap' }}>
                <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}</Button>
                <Button type="button" variant="outlined" onClick={() => { setMode(mode === 'in' ? 'new' : 'in'); setError(''); setFields({}) }}>
                  {mode === 'in' ? 'I need an account' : 'I already have an account'}
                </Button>
              </Stack>
            </form>
            <Typography variant="caption" color="text.secondary" component="p" style={{ marginTop: 18 }}>
              The eCourts Services-site demo does not need an account: <Link href="#/services">open it</Link>.
            </Typography>
          </div>
        </main>
      </div>
    </>
  )
}
