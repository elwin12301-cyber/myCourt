import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../api/auth'
import { useApp } from '../context'
import { parseCommand, HELP, PAGE_LABEL, type Action } from '../features/voice/commands'
import * as D from '../features/voice/dom'
import { SPEECH_LANGUAGES, useSpeech } from '../features/speech'
import { Message } from './blocks'
import { Checkbox, FormControlLabel, MicIcon, SelectField, TextField, cx } from './kit'
import { Modal } from './ui'

interface Reply { said: string; reply: string; ok: boolean }

const HINT = 'Say “what can I say” for help.'

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
  const [speakBack, setSpeakBack] = useState(false)  // turned on when voice control is turned on
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
      case 'go': go(a.page); return { ok: true, say: `Navigating to ${PAGE_LABEL[a.page]}.` }
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

  const run = useCallback((phrase: string, fromMic = false) => {
    const text = phrase.trim()
    if (!text) return
    if (fromMic && D.isSpeaking()) return  // that was the app's own voice
    const a = parseCommand(text)
    // While dictating everything is text, except the words that end dictation or voice control.
    if (dictRef.current && a.t !== 'dictate' && a.t !== 'stop') { say(D.type(text, true), text); return }
    say(carryOut(a), text)
  }, [carryOut, say])

  const sp = useSpeech(lang, (t) => run(t, true))
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

  // leave room under the page so the tray never covers the last thing on it
  useEffect(() => { document.body.classList.toggle('voice-on', enabled); return () => document.body.classList.remove('voice-on') }, [enabled])

  const turnOff = () => { setEnabled(false); setDictating(false); setNumbers(false); setRepliesOpen(false) }
  const toggle = () => {
    if (enabled) { turnOff(); return }
    if (!supported) { openHelp(); return }
    if (!consented) { setConsentOpen(true); return }
    setSpeakBack(true)
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
  const sub: ReactNode = error ? error : sp.interim ? `“${sp.interim}”` : last ? `${last.ok ? '' : '⚠ '}${last.reply}` : HINT

  return (
    <>
      {!floating && (
        <button type="button" className={cx('btn small', enabled && 'primary')} aria-pressed={enabled} onClick={toggle} title="Voice control (Alt+V)" id="voice-toggle">
          {enabled ? (listening ? '● Listening' : '◌ Voice on') : '🎙 Voice'}
        </button>
      )}
      {floating && !enabled && createPortal(
        <button type="button" id="voice-launcher" className="vlauncher" aria-label="Turn on voice control (Alt+V)" aria-pressed={false} onClick={toggle} title="Voice control (Alt+V)">
          <MicIcon />
        </button>,
        document.body,
      )}

      {consentOpen && (
        <Modal onClose={() => setConsentOpen(false)} titleId="vc-consent-title" title="Turn on voice control" closeLabel="Close"
          actions={<>
            <button type="button" className="btn" onClick={() => { setConsentOpen(false); openHelp() }}>Type commands instead</button>
            <button type="button" className="btn" onClick={() => setConsentOpen(false)}>Cancel</button>
            <button type="button" className="btn primary" disabled={!consented} onClick={() => { setConsentOpen(false); setSpeakBack(true); setEnabled(true) }}>Turn on</button>
          </>}>
          <Message severity="warning">
            Voice control uses your browser's speech recognition. In Chrome and Edge your audio is sent to the browser vendor to be turned into text.
            Use it for demonstration material only, never for real client information.
          </Message>
          <FormControlLabel control={<Checkbox checked={consented} onChange={(e) => setConsented(e.target.checked)} />} label="I understand and want to use voice control" />
          <p className="tiny muted">Say “what can I say” for the list of commands, “stop listening” to turn it off, or press Alt+V. Alt+C opens a box where you can type a command instead.</p>
        </Modal>
      )}

      {helpOpen && (
        <Modal onClose={() => setHelpOpen(false)} titleId="vc-help-title" title="What can I say?" closeLabel="Close help"
          actions={<button type="button" className="btn" onClick={() => setHelpOpen(false)}>Close</button>}>
          {!supported && <Message severity="info">This browser has no speech recognition (use Chrome or Edge). You can still type any command below.</Message>}
          <form onSubmit={submitTyped}>
            <TextField id="voice-cmd" label="Type a command" placeholder="e.g. open calendar" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
            <button type="submit" className="btn primary small">Run command</button>
          </form>
          <SelectField id="voice-language" label="Dictation language (commands are understood in English)" value={lang} onChange={(e) => setLang(e.target.value)} style={{ marginTop: 12 }}>
            {SPEECH_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </SelectField>
          <FormControlLabel control={<Checkbox checked={speakBack} onChange={(e) => setSpeakBack(e.target.checked)} />} label="Speak the answers aloud (on while voice control is on)" />
          {HELP.map((g) => (
            <div key={g.group} className="vhelp-group">
              <h4>{g.group}</h4>
              <ul>
                {g.items.map((i) => <li key={i.say}><strong>“{i.say}”</strong> <span className="muted">{i.does}</span></li>)}
              </ul>
            </div>
          ))}
        </Modal>
      )}

      {numbers && createPortal(
        <div id="voice-numbers" aria-hidden="true" className="vnumbers">
          {badges.map((b) => <div key={b.n} className="vbadge" style={{ left: b.x, top: b.y }}>{b.n}</div>)}
        </div>,
        document.body,
      )}

      {enabled && repliesOpen && createPortal(
        <div id="voice-replies" role="log" aria-label="Replies" aria-live="polite" className="vreplies">
          <span className="vreplies-title">REPLIES</span>
          {history.length === 0 && <p>Nothing yet. {HINT}</p>}
          {history.map((h, i) => (
            <div key={i} className="vreply">
              <p className="vsaid">You: “{h.said}”</p>
              <p className={h.ok ? 'vok' : 'vwarn'}>{h.reply}</p>
            </div>
          ))}
        </div>
      ,
        document.body,
      )}

      {enabled && createPortal(
        <div id="voice-status" role="region" aria-label="Voice control" className="vbar">
          <div aria-hidden="true" className="vbar-mic"><MicIcon /></div>
          <div role="status" aria-live="polite" className="vbar-text">
            <div className="vbar-title"><span aria-hidden="true" className={cx('vdot', state)} /><strong>{title}</strong></div>
            <div className="vbar-sub">{sub}</div>
          </div>
          <div className="vbar-buttons">
            <button type="button" aria-pressed={numbers} className={cx('vbtn', numbers && 'on')} onClick={() => setNumbers((n) => !n)}>Numbers</button>
            <button type="button" aria-pressed={repliesOpen} className={cx('vbtn', repliesOpen && 'on')} onClick={() => setRepliesOpen((r) => !r)}>Replies</button>
            <button type="button" className="vbtn" onClick={openHelp}>Help</button>
            <button type="button" className="vbtn stop" onClick={turnOff}>Stop</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
