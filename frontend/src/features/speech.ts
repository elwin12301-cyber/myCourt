import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Browser speech recognition (the Web Speech API, Chrome and Edge). It is the browser's own service: in these browsers the
 * audio is sent to the browser vendor to be transcribed. Screens must say so and let the person choose before it starts.
 */
interface Recognition {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void; stop: () => void; abort: () => void
}
type Ctor = new () => Recognition

export function speechCtor(w: Window = window): Ctor | null {
  const x = w as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor }
  return x.SpeechRecognition ?? x.webkitSpeechRecognition ?? null
}

/**
 * What to tell the person about a recognition error, or null when it is harmless. Chrome ends listening with "no-speech" after a few
 * quiet seconds and "aborted" whenever we stop it ourselves; neither is a problem, listening just starts again.
 */
export function speechErrorMessage(code: string): string | null {
  if (code === 'no-speech' || code === 'aborted') return null
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'Microphone access was refused. Allow it in the browser address bar and try again.'
  if (code === 'audio-capture') return 'No microphone was found. Plug one in or check the browser settings.'
  if (code === 'network') return 'The browser speech service could not be reached. Check your internet connection.'
  return `Speech recognition stopped: ${code}.`
}

export const SPEECH_LANGUAGES: { code: string; label: string }[] = [
  { code: 'en-IN', label: 'English (India)' }, { code: 'hi-IN', label: 'हिन्दी (Hindi)' }, { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)' }, { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' }, { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
]

/** Spoken phrases that move around the app ("open calendar"). Returns the page id, or null when the phrase is not a command. */
export function commandFor(phrase: string): string | null {
  const p = phrase.toLowerCase().trim().replace(/[.!?]+$/, '')
  const m = /^(?:go to|open|show)\s+(?:the\s+)?(.+)$/.exec(p)
  if (!m) return null
  const table: Record<string, string> = {
    dashboard: 'dashboard', cases: 'cases', matters: 'cases', calendar: 'calendar', billing: 'billing', 'time and billing': 'billing',
    intake: 'intake', 'client intake': 'intake', documents: 'documents', research: 'research', assistant: 'assistant',
    mapping: 'mapping', hearing: 'hearing', 'hearing preparation': 'hearing', voice: 'voice', 'case status': 'caseStatus',
    'cause list': 'causeList', 'court orders': 'courtOrders', 'services site': 'services',
  }
  return table[m[1]] ?? null
}

export function useSpeech(lang: string, onFinal: (text: string) => void) {
  const supported = typeof window !== 'undefined' && speechCtor() !== null
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const rec = useRef<Recognition | null>(null)
  const cb = useRef(onFinal)
  cb.current = onFinal

  const stop = useCallback(() => { rec.current?.stop() }, [])
  const start = useCallback(() => {
    const C = speechCtor()
    if (!C) { setError('This browser does not support speech recognition. Use Chrome or Edge.'); return }
    const r = new C()
    r.lang = lang; r.continuous = true; r.interimResults = true
    r.onresult = (e) => {
      let live = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        const text = res[0].transcript
        if (res.isFinal) cb.current(text.trim()); else live += text
      }
      setInterim(live)
    }
    r.onerror = (e) => { const m = speechErrorMessage(e.error); if (m) setError(m) }
    r.onend = () => { setListening(false); setInterim('') }
    setError(''); rec.current = r
    try { r.start(); setListening(true) } catch { setError('Could not start the microphone.') }
  }, [lang])
  useEffect(() => () => rec.current?.abort(), [])
  return { supported, listening, interim, error, start, stop }
}
