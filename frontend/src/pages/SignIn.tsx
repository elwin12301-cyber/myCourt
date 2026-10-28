import { useState, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useAuth } from '../api/auth'
import { ApiError, messageOf } from '../api/client'
import { Message } from '../components/mui'

/** Shown instead of the workspace when the backend is in use and nobody is signed in. */
export default function SignIn() {
  const { signIn, register } = useAuth()
  const [mode, setMode] = useState<'in' | 'new'>('in')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [needCode, setNeedCode] = useState(false)
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
      <Box component="main" id="signin-main" tabIndex={-1} sx={{ maxWidth: 440, mx: 'auto', my: 5, px: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
          <div className="brandmark" aria-hidden="true">M</div>
          <div><Typography variant="h2" component="h1">myCourt</Typography><Typography variant="caption" color="text.secondary">LEGAL WORKSPACE</Typography></div>
        </Stack>
        <Card>
          <CardContent>
            <Typography variant="h2" component="h2" sx={{ mb: 1 }}>{mode === 'in' ? 'Sign in' : 'Create an account'}</Typography>
            <form onSubmit={submit} noValidate>
              {mode === 'new' && (
                <TextField id="su-name" label="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
                  error={!!fields.displayName} helperText={fields.displayName} slotProps={{ formHelperText: { role: 'alert' } }} />
              )}
              <TextField id="su-email" label="E-mail address" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
                error={!!fields.email} helperText={fields.email} slotProps={{ formHelperText: { role: 'alert' } }} />
              <TextField id="su-password" label="Password" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                value={password} onChange={(e) => setPassword(e.target.value)} error={!!fields.password}
                helperText={fields.password || (mode === 'new' ? 'At least 12 characters.' : undefined)}
                slotProps={{ formHelperText: { role: fields.password ? 'alert' : undefined } }} />
              {needCode && mode === 'in' && (
                <TextField id="su-code" label="Authenticator code" autoFocus autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)}
                  helperText="Enter the 6-digit code from your authenticator app." slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }} />
              )}
              {error && <Message severity="warning">{error}</Message>}
              <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, flexWrap: 'wrap' }}>
                <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}</Button>
                <Button type="button" variant="outlined" onClick={() => { setMode(mode === 'in' ? 'new' : 'in'); setError(''); setFields({}) }}>
                  {mode === 'in' ? 'I need an account' : 'I already have an account'}
                </Button>
              </Stack>
            </form>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2 }}>
              The eCourts Services-site demo does not need an account: <Link href="#/services">open it</Link>.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </>
  )
}
