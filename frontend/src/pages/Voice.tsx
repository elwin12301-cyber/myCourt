import { useState } from 'react'
import { useApp } from '../context'
import { Btn, Card, Field, Notice, PageHead, Pill, Select, Textarea } from '../components/ui'
import { commandFor, SPEECH_LANGUAGES, useSpeech } from '../features/speech'
import type { PageId } from '../types'

type RecState = 'ready' | 'recording' | 'paused' | 'stopped'

const STATUS: Record<RecState, string> = {
  ready: 'Ready to record',
  recording: 'Recording (simulated)',
  paused: 'Paused (simulated)',
  stopped: 'Stopped · transcript remains editable',
}

export default function VoicePage() {
  const { transcript, setTranscript, toast, go } = useApp()
  const [rec, setRec] = useState<RecState>('ready')
  const [lang, setLang] = useState('en-IN')
  const [consent, setConsent] = useState(false)
  const [commands, setCommands] = useState(false)
  const sp = useSpeech(lang, (said) => {
    const page = commands ? commandFor(said) : null
    if (page) { toast(`Opening ${page}`); go(page as PageId) } else if (said) setTranscript(`${transcript} ${said}`.trim())
  })
  const real = sp.supported && consent
  const [output, setOutput] = useState('Case note')
  const [result, setResult] = useState<{ type: string; text: string } | null>(null)

  return (
    <>
      <PageHead title="Voice-to-Text & Legal Dictation" sub="Capture client instructions and hearing notes, then review before converting to structured work.">
        <Btn kind="soft" to="caseDetail">Open matter</Btn>
      </PageHead>
      <div className="grid layout2">
        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title="Recorder">
            <div style={{ textAlign: 'center', padding: '15px 0' }}>
              <div className={`recordcircle ${rec === 'recording' || sp.listening ? 'recording' : ''}`}>●</div>
              <strong>{sp.listening ? 'Listening… speak now' : STATUS[rec]}</strong>
              <p className="muted tiny">{real ? 'Your browser\'s speech service transcribes the audio. Nothing is stored here.' : 'Demo recorder · no audio is captured'}</p>
              <div className="actions" style={{ justifyContent: 'center', marginTop: 18 }}>
                <Btn kind="primary" onClick={() => { setRec('recording'); if (real) sp.start(); else toast('Simulated recording started') }}>● Start recording</Btn>
                <Btn onClick={() => { setRec('paused'); sp.stop() }}>Ⅱ Pause</Btn>
                <Btn onClick={() => { setRec('stopped'); sp.stop() }}>■ Stop</Btn>
              </div>
            </div>
            <Field label="Dictation language">
              <Select value={lang} onChange={(e) => setLang(e.target.value)}>
                {SPEECH_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </Select>
            </Field>
            <label className="checkrow"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><div><strong>Use my browser's speech recognition</strong><small>In Chrome and Edge the audio is sent to the browser vendor to be transcribed. Demonstration material only.</small></div></label>
            <label className="checkrow"><input type="checkbox" checked={commands} onChange={(e) => setCommands(e.target.checked)} /><div><strong>Voice commands</strong><small>Say “open calendar”, “go to cases” or “show billing” while dictating.</small></div></label>
            {sp.error && <Notice>{sp.error}</Notice>}
            <Notice>{sp.supported ? 'Without the box above ticked this stays a simulated recorder and captures no audio.' : 'This browser has no speech recognition (use Chrome or Edge), so the recorder is simulated and captures no audio.'}</Notice>
          </Card>
          <Card title="Turn into useful work">
            <Field label="Output type">
              <Select value={output} onChange={(e) => setOutput(e.target.value)}>
                <option>Case note</option><option>Chronology</option><option>Client update draft</option><option>Tasks and dates</option><option>First draft for review</option>
              </Select>
            </Field>
            <Field label="Link to matter">
              <Select><option>CR/2025/0412 · State v. R. Kumar</option><option>CS/2024/118 · Mehta v. Rao</option></Select>
            </Field>
            <div className="actions">
              <Btn kind="primary" onClick={() => setResult({ type: output, text: transcript })}>Structure transcript</Btn>
              <Btn onClick={() => toast('Reviewed transcript saved in prototype session')}>Save reviewed note</Btn>
            </div>
            {result && (
              <div className="sourcebox">
                <h4>{result.type} · draft for review</h4>
                <p>{result.text}<br /><br /><b>Suggested follow-up:</b> confirm dates, case number and any extracted legal reference before creating a task.</p>
              </div>
            )}
          </Card>
        </div>
        <div>
          <Card title="Editable transcript">
            <div className="resultmeta"><Pill kind="green">Editable</Pill><Pill kind="amber">Verify names / dates</Pill></div>
            <Field label="Transcript (original wording)">
              <Textarea style={{ minHeight: 235 }} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
            </Field>
            <div className="sourcebox">
              <h4>Review checklist</h4>
              <p>Confirm case number, names, dates, legal section references, negations and amounts. Preserve the original transcript alongside any AI rewrite.</p>
            </div>
            <div style={{ marginTop: 10 }}>
              <Btn kind="soft" onClick={() => toast('Review flags: confirm date/year, case number, names and legal references')}>Check uncertain phrases</Btn>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
