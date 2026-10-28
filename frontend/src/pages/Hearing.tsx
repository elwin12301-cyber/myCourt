import { useState } from 'react'
import { useApp } from '../context'
import { Btn, Card, Field, Notice, PageHead, Pill, Input, Textarea } from '../components/ui'

const CHECKS: [string, string][] = [
  ['Review latest order', 'Document review'],
  ['Confirm issues for determination', 'Case analysis'],
  ['Verify authorities and treatment', 'RAG research'],
  ['Check exhibit / evidence list', 'Evidence'],
  ['Prepare questions and submissions', 'Advocate notes'],
  ['Confirm hearing logistics', 'Calendar'],
]

interface Brief { issues: string; gaps: string; authorities: string }

function Lines({ text }: { text: string }) {
  return <p>{text.split('\n').map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</p>
}

export default function HearingPage() {
  const { toast, openModal, setTasks } = useApp()
  const [done, setDone] = useState<boolean[]>(CHECKS.map(() => false))
  const [issues, setIssues] = useState('1. Identify the elements requiring proof on the pleaded/alleged facts.\n2. Confirm admissibility and provenance of disputed material.')
  const [gaps, setGaps] = useState('Certified copy of the latest order to be obtained. Verify page 4 OCR against the original.')
  const [authorities, setAuthorities] = useState('Add source-backed authorities with pinpoint citations and current treatment status.')
  const [brief, setBrief] = useState<Brief | null>(null)

  const count = done.filter(Boolean).length

  const recordOutcome = () => openModal({
    title: 'Record hearing outcome',
    body: (
      <>
        <Field label="Outcome / order summary"><Textarea name="outcome" placeholder="Enter verified order outcome…" /></Field>
        <Field label="Next date (if ordered)"><Input name="nextDate" type="date" /></Field>
        <Field label="Follow-up task"><Input name="task" placeholder="Task to create" /></Field>
      </>
    ),
    onSave: (fd) => {
      const t = String(fd.get('task') ?? '').trim()
      if (t) setTasks((all) => [...all, { title: t, due: String(fd.get('nextDate') ?? '') || 'Confirm date', done: false }])
      toast('Hearing outcome draft saved in prototype session')
    },
  })

  return (
    <>
      <PageHead title="Hearing Preparation" sub="Assemble a reviewed brief with issues, evidence, authorities, questions and post-hearing actions.">
        <Btn kind="soft" onClick={() => { toast('Print or use browser Save as PDF to export this demo view'); window.print() }}>Export brief</Btn>
        <Btn kind="primary" onClick={recordOutcome}>Record hearing outcome</Btn>
      </PageHead>
      <div className="feature-banner">
        <div>
          <div className="eyebrow" style={{ color: '#bdccff' }}>NEXT HEARING · 28 OCT 2026</div>
          <h3>State v. R. Kumar · CR/2025/0412</h3>
          <p>Brief status: draft. Review source citations, confirm dates and assign outstanding preparation tasks.</p>
        </div>
        <Pill kind="amber">Awaiting advocate review</Pill>
      </div>
      <div className="grid layout2">
        <Card title="Preparation checklist">
          {CHECKS.map(([title, sub], i) => (
            <label className="checkrow" key={title}>
              <input type="checkbox" checked={done[i]} onChange={(e) => setDone((d) => d.map((v, j) => (j === i ? e.target.checked : v)))} />
              <div><strong>{title}</strong><small>{sub}</small></div>
            </label>
          ))}
          <div className="progress" style={{ margin: '15px 0' }}><span style={{ width: `${(count / CHECKS.length) * 100}%` }} /></div>
          <div className="tiny muted">{count} of {CHECKS.length} complete</div>
        </Card>
        <Card title="Draft hearing brief">
          <Field label="Issues for determination"><Textarea value={issues} onChange={(e) => setIssues(e.target.value)} /></Field>
          <Field label="Evidence gaps"><Textarea value={gaps} onChange={(e) => setGaps(e.target.value)} /></Field>
          <Field label="Authorities (verify before use)"><Textarea value={authorities} onChange={(e) => setAuthorities(e.target.value)} /></Field>
          <Notice>Do not use placeholder issues or authorities in court. Replace with matter-specific, verified material.</Notice>
          <div className="actions">
            <Btn to="research">Open RAG research</Btn>
            <Btn kind="primary" onClick={() => setBrief({ issues, gaps, authorities })}>Generate brief draft</Btn>
          </div>
        </Card>
      </div>
      {brief && (
        <section className="card" style={{ marginTop: 18 }}>
          <div className="cardhead"><h3>Hearing brief draft</h3><Pill kind="amber">Requires review</Pill></div>
          <h4>Issues for determination</h4><Lines text={brief.issues} />
          <h4>Evidence gaps</h4><Lines text={brief.gaps} />
          <h4>Authorities</h4><Lines text={brief.authorities} />
          <Notice>Draft generated from the text in this prototype only. No authorities or facts have been independently verified.</Notice>
          <div className="actions">
            <Btn kind="primary" onClick={() => toast('Demo approval recorded; no filing or external action occurred')}>Approve draft (demo)</Btn>
            <Btn onClick={() => setBrief(null)}>Return for edits</Btn>
          </div>
        </section>
      )}
    </>
  )
}
