import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context'
import { Btn, Card, Check, Field, Notice, PageHead } from '../components/ui'
import { caseNoteModal } from './modals'

function answerFor(q: string): string {
  const low = q.toLowerCase()
  if (low.includes('missing') || low.includes('evidence'))
    return 'Potential gaps to verify: (1) certified copy of the latest order, (2) source document for the disputed date, (3) page-level confirmation of the OCR-flagged phrase, and (4) current treatment of any proposed authority. These are prompts to check against the actual file, not findings of fact.'
  if (low.includes('summar'))
    return 'Draft summary: State v. R. Kumar (CR/2025/0412) is shown as an active criminal matter with a hearing on 28 October 2026. An uploaded order has an OCR passage flagged for review. Confirm the procedural stage, facts, dates and source materials before using this summary.'
  if (low.includes('client'))
    return 'Draft client update: “We are reviewing the latest order and preparing for the upcoming hearing. We will confirm any additional documents required after completing our review.” Please check accuracy and approve before sending.'
  if (low.includes('draft'))
    return 'I can prepare a draft with clear placeholders and source citations. Please confirm the intended document, relief sought, forum, procedural posture and any facts that must not be inferred.'
  return 'I would start by checking the matter chronology, then retrieve the relevant passages from the authorised documents and legal sources. I would show citations and uncertainties before suggesting a draft.'
}

export default function AssistantPage() {
  const app = useApp()
  const { messages, setMessages } = app
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) }, [messages])

  const send = (text?: string) => {
    const q = (text ?? input).trim()
    if (!q) return
    setMessages((m) => [
      ...m,
      { role: 'user', title: 'You', text: q },
      { role: 'assistant', title: 'MrCourt AI', text: answerFor(q) },
    ])
    setInput('')
  }

  return (
    <>
      <PageHead title="AI Legal Assistant" sub="A matter-aware copilot for analysis, drafting and next-step planning.">
        <Btn kind="soft" to="research">View RAG sources</Btn>
        <Btn to="voice">Dictate prompt</Btn>
      </PageHead>
      <div className="feature-banner">
        <div>
          <div className="eyebrow" style={{ color: '#bdccff' }}>ACTIVE MATTER</div>
          <h3>State v. R. Kumar · CR/2025/0412</h3>
          <p>Context includes 12 uploaded documents, 4 saved authorities and 2 hearing notes. Change the scope before asking a matter-specific question.</p>
        </div>
        <Btn to="caseDetail">Open matter ↗</Btn>
      </div>
      <div className="grid layout2">
        <Card title="Conversation">
          <div className="chatbox">
            <div className="messages">
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.role === 'user' ? 'user' : ''}`}>
                  <strong>{m.title}</strong>
                  <p>{m.text}</p>
                  {m.role === 'assistant' && (
                    <div className="tiny" style={{ marginTop: 8, color: '#3157c8' }}>Source-aware prototype response · verify before relying</div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="chatinput">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                placeholder="Ask about facts, authorities, drafts or next steps…"
              />
              <Btn onClick={() => send()}>Send ↑</Btn>
            </div>
            <div className="actions" style={{ marginTop: 10 }}>
              <Btn className="small" onClick={() => send('Summarise this matter and highlight the next hearing preparation steps.')}>Summarise matter</Btn>
              <Btn className="small" onClick={() => send('Find missing evidence and facts that need confirmation.')}>Find missing evidence</Btn>
              <Btn className="small" onClick={() => send('Draft a client update for review.')}>Draft client update</Btn>
            </div>
          </div>
        </Card>
        <Card title="Matter context & controls">
          <Field label="Selected matter">
            <select>
              <option>CR/2025/0412 · State v. R. Kumar</option>
              <option>CS/2024/118 · Mehta v. Rao</option>
              <option>WP/2026/077 · Aruna Foundation v. State</option>
            </select>
          </Field>
          <Check defaultChecked title="Uploaded matter documents" sub="12 files · OCR and page references" />
          <Check defaultChecked title="Saved legal authorities" sub="4 authorities · treatment needs verification" />
          <Check defaultChecked title="Advocate notes" sub="2 notes · includes reviewed transcript" />
          <Notice>AI output is a draft. Verify citations, current law, facts and jurisdiction. No filing, message or deadline is committed without approval.</Notice>
          <div className="actions">
            <Btn kind="soft" onClick={() => caseNoteModal(app)}>Create case note</Btn>
            <Btn kind="primary" to="hearing">Prepare hearing brief</Btn>
          </div>
        </Card>
      </div>
    </>
  )
}
