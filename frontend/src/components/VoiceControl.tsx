import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import MicIcon from '@mui/icons-material/Mic'
import { useAuth } from '../api/auth'
import { useApp } from '../context'
import { parseCommand, HELP, type Action } from '../features/voice/commands'
import * as D from '../features/voice/dom'
import { SPEECH_LANGUAGES, useSpeech } from '../features/speech'
import { Message, SelectField } from './mui'
import { Modal } from './ui'

interface Reply { said: string; reply: string; ok: boolean }

const HINT = 'Say “what can I say” for help.'
const BAR_BUTTON = { color: '#fff', borderColor: '#ffffffb0', borderRadius: '14px', px: 2.5, py: 0.9, fontWeight: 700, fontSize: '0.95rem', '&:hover': { borderColor: '#fff', bgcolor: '#ffffff1a' } } as const

/**
 * App-wide voice control: say what to do ("open calendar", "focus client name", "type …", "click save", "click 12").
 * It uses the browser's speech recognition, which in Chrome and Edge sends audio to the browser vendor, so it is opt-in with a
 * plain warning and for demonstration material only. Every command can also be typed into the box in the help window (Alt+C), so
 * the same control works with no microphone and can be tested. `floating` shows a round launcher in the corner, for screens
 * that have no top bar (sign-in and the Services site).
 */
export default function VoiceControl({ floating = false }: { floating?: boolean }) {
  const { go, toast } = useApp()
  const auth = useAuth()
  const [enabled, setEnabled] = useState(false)
  const [consented, setConsented] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [dictating, setDictating] = useState(false)
  const [speakBack, setSpeakBack] = useState(false)
  const [numbers, setNumbers] = useState(false)
  const [repliesOpen, setRepliesOpen] = useState(false)
  const [lang, setLang] = useState('en-IN')
  const [history, setHistory] = useState<Reply[]>([])
  const [typed, setTyped] = useState('')
  const dictRef = useRef(false)
  dictRef.current = dictating
  const prevFocus = useRef<HTMLElement | null>(null)
  const numberEls = useRef<HTMLElement[]>([])
  const [badges, setBadges] = useState<{ n: number; x: number; y: number }[]>([])
  const last = history[history.length - 1]

  /** Remembers where the person was, so a typed command acts on that field and not on the button that opened the box. */
  const openHelp = useCallback(() => { prevFocus.current = document.activeElement as HTMLElement | null; setHelpOpen(true) }, [])

  const say = useCallback((o: D.Outcome, heard: string) => {
    setHistory((h) => [...h.slice(-29), { said: heard, reply: o.say, ok: o.ok }])
    toast(o.say)
    if (speakBack) D.speak(o.say)
  }, [speakBack, toast])

  const carryOut = useCallback((a: Action): D.Outcome => {
    switch (a.t) {
      case 'go': go(a.page); return { ok: true, say: `Opening ${a.page.replace(/([A-Z])/g, ' $1').toLowerCase()}.` }
      case 'back': window.history.back(); return { ok: true, say: 'Going back.' }
      case 'forward': window.history.forward(); return { ok: true, say: 'Going forward.' }
      case 'reload': window.location.reload(); return { ok: true, say: 'Reloading.' }
      case 'scroll': return D.scroll(a.dir)
      case 'click': return D.click(a.name)
      case 'focus': return D.focus(a.name)
      case 'type': return D.type(a.text, true)
      case 'set': return D.set(a.name, a.value)
      case 'check': return D.check(a.name, a.on)
      case 'clear': return D.clear()
      case 'next': return D.step(1)
      case 'prev': return D.step(-1)
      case 'submit': return D.submit()
      case 'dictate': setDictating(a.on); return { ok: true, say: a.on ? 'Dictating. Say “stop dictation” when done.' : 'Dictation off.' }
      case 'display': window.dispatchEvent(new CustomEvent('mycourt:display', { detail: a.change })); return { ok: true, say: 'Display changed.' }
      case 'signout': if (auth.required && auth.status === 'in') { void auth.signOut(); return { ok: true, say: 'Signing out.' } } return { ok: false, say: 'You are not signed in.' }
      case 'help': openHelp(); return { ok: true, say: 'Here is what you can say.' }
      case 'stop': setEnabled(false); setDictating(false); setNumbers(false); setRepliesOpen(false); return { ok: true, say: 'Voice control is off.' }
      case 'read': { const t = D.pageSummary(); D.speak(t); return { ok: true, say: t } }
      case 'numbers': setNumbers(a.on); return { ok: true, say: a.on ? 'Numbers shown. Say “click” and a number.' : 'Numbers hidden.' }
      case 'replies': setRepliesOpen(a.on); return { ok: true, say: a.on ? 'Showing replies.' : 'Replies hidden.' }
      case 'number': {
        const el = numberEls.current[a.n - 1]
        if (!el || !document.contains(el)) return { ok: false, say: numbers ? `There is no number ${a.n} on this screen.` : 'No numbers are showing. Say “show numbers” first.' }
        return D.activate(el)
      }
      default: return { ok: false, say: `I did not understand “${a.heard}”. ${HINT}` }
    }
  }, [go, auth, openHelp, numbers])

  const run = useCallback((phrase: string) => {
    const text = phrase.trim()
    if (!text) return
    const a = parseCommand(text)
    // While dictating everything is text, except the words that end dictation or voice control.
    if (dictRef.current && a.t !== 'dictate' && a.t !== 'stop') { say(D.type(text, true), text); return }
    say(carryOut(a), text)
  }, [carryOut, say])

  const sp = useSpeech(lang, run)
  const { supported, listening, error, start, stop } = sp

  // Chrome ends recognition after a pause; keep listening while voice control is on.
  useEffect(() => {
    if (!enabled || !supported || listening || error) return
    const id = window.setTimeout(start, 400)
    return () => window.clearTimeout(id)
  }, [enabled, supported, listening, error, start])
  useEffect(() => { if (!enabled) stop() }, [enabled, stop])

  // Numbers: a badge on every control that can be pressed, kept in step with the page.
  useEffect(() => {
    if (!numbers) { numberEls.current = []; setBadges([]); return }
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const inView = D.controls().filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth }).slice(0, 99)
        numberEls.current = inView
        const next = inView.map((el, i) => { const r = el.getBoundingClientRect(); return { n: i + 1, x: Math.round(r.left), y: Math.round(r.top) } })
        setBadges((old) => (JSON.stringify(old) === JSON.stringify(next) ? old : next))
      })
    }
    update()
    window.addEventListener('scroll', update, true); window.addEventListener('resize', update)
    const mo = new MutationObserver((recs) => { if (!recs.every((r) => (r.target as Element).closest?.('#voice-numbers'))) update() })
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'aria-hidden', 'disabled'] })
    const iv = window.setInterval(update, 1200)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); mo.disconnect(); window.clearInterval(iv) }
  }, [numbers])

  const turnOff = () => { setEnabled(false); setDictating(false); setNumbers(false); setRepliesOpen(false) }
  const toggle = () => {
    if (enabled) { turnOff(); return }
    if (!supported) { openHelp(); return }
    if (!consented) { setConsentOpen(true); return }
    setEnabled(true)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'v') { e.preventDefault(); toggle() }
      if (k === 'c') { e.preventDefault(); openHelp() }  // Alt+C: type a command
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // The help window hides the page from assistive technology, so close it first and then act on the page behind it.
  const submitTyped = (e: FormEvent) => {
    e.preventDefault()
    const phrase = typed
    setTyped('')
    if (parseCommand(phrase).t !== 'help') setHelpOpen(false)
    window.setTimeout(() => {
      const f = prevFocus.current
      if (f && f !== document.body && document.contains(f)) f.focus()
      run(phrase)
    }, 350)
  }

  const state = error ? 'error' : dictating ? 'dictating' : listening ? 'listening' : 'starting'
  const title = { error: 'Microphone problem', dictating: 'Dictating…', listening: 'Listening…', starting: 'Starting the microphone…' }[state]
  const dot = { error: '#ff8a80', dictating: '#ffd180', listening: '#5ad19a', starting: '#ffd180' }[state]
  const sub: ReactNode = error ? error : sp.interim ? `“${sp.interim}”` : last ? `${last.ok ? '' : '⚠ '}${last.reply}` : HINT

  return (
    <>
      {!floating && (
        <Button size="small" variant={enabled ? 'contained' : 'outlined'} aria-pressed={enabled} onClick={toggle} title="Voice control (Alt+V)" id="voice-toggle">
          {enabled ? (listening ? '● Listening' : '◌ Voice on') : '🎙 Voice'}
        </Button>
      )}
      {floating && !enabled && (
        <Button id="voice-launcher" aria-label="Turn on voice control (Alt+V)" aria-pressed={false} onClick={toggle} title="Voice control (Alt+V)"
          sx={{ position: 'fixed', left: 16, bottom: 16, zIndex: 1300, width: 52, height: 52, minWidth: 0, borderRadius: '50%', bgcolor: '#c79a4a', color: '#0a1020', boxShadow: 6, '&:hover': { bgcolor: '#d9b46a' } }}>
          <MicIcon />
        </Button>
      )}

      {consentOpen && (
        <Modal onClose={() => setConsentOpen(false)} titleId="vc-consent-title" title="Turn on voice control" closeLabel="Close"
          actions={<>
            <Button variant="outlined" onClick={() => { setConsentOpen(false); openHelp() }}>Type commands instead</Button>
            <Button variant="outlined" onClick={() => setConsentOpen(false)}>Cancel</Button>
            <Button variant="contained" disabled={!consented} onClick={() => { setConsentOpen(false); setEnabled(true) }}>Turn on</Button>
          </>}>
          <Message severity="warning">
            Voice control uses your browser's speech recognition. In Chrome and Edge your audio is sent to the browser vendor to be turned into text.
            Use it for demonstration material only, never for real client information.
          </Message>
          <FormControlLabel control={<Checkbox checked={consented} onChange={(e) => setConsented(e.target.checked)} />} label="I understand and want to use voice control" />
          <Typography variant="caption" color="text.secondary" component="p">Say “what can I say” for the list of commands, “stop listening” to turn it off, or press Alt+V. Alt+C opens a box where you can type a command instead.</Typography>
        </Modal>
      )}

      {helpOpen && (
        <Modal onClose={() => setHelpOpen(false)} titleId="vc-help-title" title="What can I say?" closeLabel="Close help"
          actions={<Button variant="outlined" onClick={() => setHelpOpen(false)}>Close</Button>}>
          {!supported && <Message severity="info">This browser has no speech recognition (use Chrome or Edge). You can still type any command below.</Message>}
          <Box component="form" onSubmit={submitTyped} sx={{ mb: 1 }}>
            <TextField id="voice-cmd" label="Type a command" placeholder="e.g. open calendar" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
            <Button type="submit" variant="contained" size="small" sx={{ mt: 0.5 }}>Run command</Button>
          </Box>
          <SelectField id="voice-language" label="Dictation language (commands are understood in English)" value={lang} onChange={(e) => setLang(e.target.value)}>
            {SPEECH_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </SelectField>
          <FormControlLabel control={<Checkbox checked={speakBack} onChange={(e) => setSpeakBack(e.target.checked)} />} label="Speak the answers aloud" />
          {HELP.map((g) => (
            <Box key={g.group} sx={{ mt: 1.5 }}>
              <Typography variant="h3" component="h4" sx={{ fontSize: '0.95rem', mb: 0.5 }}>{g.group}</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {g.items.map((i) => <li key={i.say}><strong>“{i.say}”</strong> <Typography component="span" variant="body2" color="text.secondary">{i.does}</Typography></li>)}
              </Box>
            </Box>
          ))}
        </Modal>
      )}

      {numbers && (
        <Box id="voice-numbers" aria-hidden="true" sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1390 }}>
          {badges.map((b) => (
            <Box key={b.n} sx={{ position: 'fixed', left: b.x, top: b.y, transform: 'translate(-35%, -55%)', minWidth: 20, height: 20, px: '5px', borderRadius: '10px', bgcolor: '#c79a4a', color: '#0a1020', fontSize: 12, fontWeight: 800, lineHeight: '20px', textAlign: 'center', boxShadow: '0 0 0 2px #0a1020' }}>{b.n}</Box>
          ))}
        </Box>
      )}

      {enabled && repliesOpen && (
        <Paper id="voice-replies" role="log" aria-label="Replies" aria-live="polite" elevation={8}
          sx={{ position: 'fixed', left: '50%', bottom: 112, transform: 'translateX(-50%)', zIndex: 1400, width: 'min(560px, calc(100vw - 24px))', maxHeight: '42vh', overflow: 'auto', p: 1.5, bgcolor: '#0a1020', color: '#fff', borderRadius: '18px', border: '1px solid #ffffff22' }}>
          <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 1 }}>REPLIES</Typography>
          {history.length === 0 && <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>Nothing yet. {HINT}</Typography>}
          {history.map((h, i) => (
            <Box key={i} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.75 }}>You: “{h.said}”</Typography>
              <Typography variant="body2" sx={{ color: h.ok ? '#bfe8cf' : '#ffd7a0' }}>{h.reply}</Typography>
            </Box>
          ))}
        </Paper>
      )}

      {enabled && (
        <Paper id="voice-status" role="region" aria-label="Voice control" elevation={10}
          sx={{ position: 'fixed', left: '50%', bottom: 16, transform: 'translateX(-50%)', zIndex: 1400, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, p: 1.25, pr: 1.75, width: 'max-content', maxWidth: 'calc(100vw - 24px)', bgcolor: '#0a1020', color: '#fff', borderRadius: '24px', border: '1px solid #ffffff22' }}>
          <Box aria-hidden="true" sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: '#c79a4a', display: 'grid', placeItems: 'center', flexShrink: 0 }}><MicIcon sx={{ color: '#0a1020' }} /></Box>
          <Box role="status" aria-live="polite" sx={{ flex: '1 1 190px', minWidth: 190, maxWidth: 320 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box aria-hidden="true" sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: dot, boxShadow: `0 0 0 3px ${dot}33` }} />
              <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.85, overflowWrap: 'anywhere' }}>{sub}</Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button variant="outlined" aria-pressed={numbers} onClick={() => setNumbers((n) => !n)} sx={{ ...BAR_BUTTON, bgcolor: numbers ? '#ffffff26' : 'transparent' }}>Numbers</Button>
            <Button variant="outlined" aria-pressed={repliesOpen} onClick={() => setRepliesOpen((r) => !r)} sx={{ ...BAR_BUTTON, bgcolor: repliesOpen ? '#ffffff26' : 'transparent' }}>Replies</Button>
            <Button variant="outlined" onClick={openHelp} sx={BAR_BUTTON}>Help</Button>
            <Button variant="contained" onClick={turnOff} sx={{ ...BAR_BUTTON, bgcolor: '#c79a4a', color: '#0a1020', borderColor: '#c79a4a', '&:hover': { bgcolor: '#d9b46a' } }}>Stop</Button>
          </Stack>
        </Paper>
      )}
    </>
  )
}
