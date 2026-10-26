import { useState } from 'react'
import { useApp } from '../context'
import { Btn, Card, Notice, PageHead, Pill, Quick, Stat } from '../components/ui'
import { newMatterModal } from './modals'

const MATTERS = [
  { title: 'State v. R. Kumar', id: 'CR/2025/0412', area: 'Criminal', court: 'Chennai · Sessions Court', next: '28 Oct 2026', status: 'Active', kind: 'green' as const },
  { title: 'Mehta v. Rao', id: 'CS/2024/118', area: 'Civil', court: 'Madras High Court', next: '30 Oct 2026', status: 'Drafting', kind: 'blue' as const },
  { title: 'Aruna Foundation v. State', id: 'WP/2026/077', area: 'Writ', court: 'Madras High Court', next: '04 Nov 2026', status: 'Review', kind: 'amber' as const },
]

export function CasesPage() {
  const app = useApp()
  const [q, setQ] = useState('')
  const rows = MATTERS.filter((m) => `${m.title} ${m.id} ${m.area} ${m.court} ${m.status}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHead title="Cases & matters" sub="A matter-centric workspace for case facts, documents, research, tasks and hearing history.">
        <Btn kind="primary" onClick={() => newMatterModal(app)}>+ Create matter</Btn>
      </PageHead>
      <div className="grid stats">
        <Stat label="Active" num="48" desc="All practice areas" ico="▣" />
        <Stat label="Need review" num="5" desc="Incomplete facts or docs" ico="!" />
        <Stat label="Next 7 days" num="7" desc="Hearings and deadlines" ico="◷" />
        <Stat label="Archived" num="126" desc="Read-only history" ico="▤" />
      </div>
      <Card title="Matter register">
        <div className="field">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by case number, party, court or practice area…" />
        </div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Matter</th><th>Jurisdiction</th><th>Next event</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.title}</strong><small>{m.id} · {m.area}</small></td>
                  <td>{m.court}</td>
                  <td>{m.next}</td>
                  <td><Pill kind={m.kind}>{m.status}</Pill></td>
                  <td><Btn className="small" to="caseDetail">Open matter</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

export function CaseDetailPage() {
  return (
    <>
      <PageHead title="State v. R. Kumar" sub="CR/2025/0412 · Criminal matter · Sessions Court, Chennai">
        <Btn kind="primary" to="hearing">Prepare hearing</Btn>
        <Btn to="assistant">Ask AI about this matter</Btn>
      </PageHead>
      <div className="grid layout2">
        <Card title="Matter overview">
          <div className="grid layout2">
            <div><div className="muted tiny">CASE STAGE</div><strong>Evidence and submissions</strong></div>
            <div><div className="muted tiny">NEXT HEARING</div><strong>28 October 2026 · 10:30 AM</strong></div>
            <div><div className="muted tiny">CLIENT</div><strong>R. Kumar</strong></div>
            <div><div className="muted tiny">COURT</div><strong>Sessions Court, Chennai</strong></div>
          </div>
          <Notice>Limitation and procedural dates require jurisdiction-specific validation and advocate confirmation.</Notice>
          <div className="actions">
            <Btn to="documents">Open documents</Btn>
            <Btn to="research">Research authorities</Btn>
            <Btn to="mapping">Map sections</Btn>
          </div>
        </Card>
        <Card title="Case timeline">
          <div className="timeline">
            <div className="event"><strong>Next hearing — preparation required</strong><small>28 Oct 2026 · Hearing brief not yet approved</small></div>
            <div className="event"><strong>Order uploaded</strong><small>02 Sep 2026 · OCR needs one phrase verified</small></div>
            <div className="event"><strong>Client conference</strong><small>24 Aug 2026 · Voice note transcribed and reviewed</small></div>
            <div className="event"><strong>Matter created</strong><small>12 Aug 2026 · Intake checklist partially complete</small></div>
          </div>
        </Card>
      </div>
      <div className="grid layout3" style={{ marginTop: 18 }}>
        <Quick ico="✦" title="Ask matter-aware AI" sub="Ask about facts and gaps" to="assistant" />
        <Quick ico="⌕" title="Research workspace" sub="Cited source retrieval" to="research" />
        <Quick ico="◉" title="Dictate case note" sub="Voice to reviewed notes" to="voice" />
      </div>
    </>
  )
}
