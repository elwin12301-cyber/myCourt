import { useState, type FormEvent } from 'react'
import { useAuth } from '../api/auth'
import { api, ApiError, messageOf } from '../api/client'
import { Message } from './blocks'
import { Modal } from './ui'
import { Button, TextField, Typography } from './kit'

/** Turn two-step sign-in (an authenticator app) on or off for the signed-in person. */
export default function Security({ onClose }: { onClose: () => void }) {
  const { person, refresh } = useAuth()
  const [setup, setSetup] = useState<{ secret: string; otpauthUri: string } | null>(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const on = !!person?.mfaEnabled

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(''); setFields({})
    try { await fn() } catch (e) { setError(messageOf(e)); if (e instanceof ApiError) setFields(e.fields) } finally { setBusy(false) }
  }
  const start = () => run(async () => setSetup(await api('POST', '/auth/mfa/setup')))
  const enable = (e: FormEvent) => { e.preventDefault(); void run(async () => { await api('POST', '/auth/mfa/enable', { code }); await refresh(); setSetup(null); setCode('') }) }
  const disable = (e: FormEvent) => { e.preventDefault(); void run(async () => { await api('POST', '/auth/mfa/disable', { password, code }); await refresh(); setPassword(''); setCode('') }) }
  const codeProps = { autoComplete: 'one-time-code', slotProps: { htmlInput: { inputMode: 'numeric' as const, maxLength: 6 } } }

  return (
    <Modal onClose={onClose} titleId="sec-title" title="Two-step sign-in" closeLabel="Close" actions={<Button variant="outlined" onClick={onClose}>Close</Button>}>
      <Typography color="text.secondary" style={{ marginBottom: 8 }}>
        {on ? 'Two-step sign-in is on: signing in needs a code from your authenticator app as well as your password.' : 'Add a second step at sign-in with an authenticator app (any app that supports time-based codes).'}
      </Typography>
      {error && <Message severity="warning">{error}</Message>}
      {!on && !setup && <Button variant="contained" disabled={busy} onClick={() => void start()}>Set up an authenticator app</Button>}
      {!on && setup && (
        <form onSubmit={enable}>
          <Typography>Add this key in your authenticator app (choose “enter a setup key”, time-based):</Typography>
          <Typography component="code" style={{ display: 'block', marginTop: 8, marginBottom: 8, padding: 8, background: '#f1f3f7', wordBreak: 'break-all', fontWeight: 700 }}>{setup.secret}</Typography>
          <TextField id="mfa-code" label="Code from the app" value={code} onChange={(e) => setCode(e.target.value)} error={!!fields.code} helperText={fields.code} {...codeProps} />
          <Button type="submit" variant="contained" disabled={busy} style={{ marginTop: 8 }}>Turn on</Button>
        </form>
      )}
      {on && (
        <form onSubmit={disable}>
          <TextField id="mfa-pw" label="Your password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={!!fields.password} helperText={fields.password} />
          <TextField id="mfa-code" label="Code from the app" value={code} onChange={(e) => setCode(e.target.value)} error={!!fields.code} helperText={fields.code} {...codeProps} />
          <Button type="submit" variant="outlined" color="error" disabled={busy} style={{ marginTop: 8 }}>Turn off</Button>
        </form>
      )}
    </Modal>
  )
}
