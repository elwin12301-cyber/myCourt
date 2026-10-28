import { useEffect, useState, type FormEvent } from 'react'
import { apiEnabled, messageOf } from '../api/client'
import * as W from '../api/workspace'
import { matterIdFromHash } from '../router'
import MatterWorkspace from './MatterWorkspace'
import { useApp } from '../context'
import { Btn, Card, Notice, PageHead, Pill, Quick, Stat } from '../components/ui'
import { newMatterModal } from './modals'

const MATTERS = [
  { title: 'State v. R. Kumar', id: 'CR/2025/0412', area: 'Criminal', court: 'Chennai · Sessions Court', next: '28 Oct 2026', status: 'Active', kind: 'green' as const },
  { title: 'Mehta v. Rao', id: 'CS/2024/118', area: 'Civil', court: 'Madras High Court', next: '30 Oct 2026', status: 'Drafting', kind: 'blue' as const },
  { title: 'Aruna Foundation v. State', id: 'WP/2026/077', area: 'Writ', court: 'Madras High Court', next: '04 Nov 2026', status: 'Review', kind: 'amber' as const },
]


function LiveMatters() {
  const [items, setItems] = useState<W.Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false)
  const load = () => { setLoading(true); W.matters.list().then((p) => { setItems(p.items); setError('') }).catch((e) => setError(messageOf(e))).finally(() => setLoading(false)) }
  useEffect(load, [])
  const create = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true)
    try { const m = await W.matters.create(title, ref); window.location.hash = `#/caseDetail/${m.id}` } catch (err) { setError(messageOf(err)) } finally { setBusy(false) }
  }
  return (
    <>
      <PageHead title="Cases & matters" sub="Your matters, saved on the server and private to the people you share them with." />
      <Notice>Demonstration mode: matters hold fictional data only. Do not enter real client information.</Notice>
      <Card title="Create a matter">
        <form onSubmit={create}>
          <div className="field"><label htmlFor="nm-title">Matter title</label><input id="nm-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="field"><label htmlFor="nm-ref">Client reference (optional)</label><input id="nm-ref" value={ref} onChange={(e) => setRef(e.target.value)} /></div>
          <button className="btn primary" type="submit" disabled={busy}>Create matter</button>
        </form>
      </Card>
      <Card title="Matter register">
        {error && <div role="alert" className="notice">{error} <button type="button" className="btn small" onClick={load}>Retry</button></div>}
        {loading && <div role="status" className="muted">Loading…</div>}
        {!loading && !error && items.length === 0 && <div className="empty">You have no matters yet. Create one above.</div>}
        {items.length > 0 && (
          <div className="tablewrap"><table>
            <caption className="sr-only">Your matters</caption>
            <thead><tr><th scope="col">Matter</th><th scope="col">Status</th><th scope="col">Your access</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{items.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.title}</strong><small>{m.clientRef || 'No client reference'}{m.isDemo ? ' · demonstration' : ''}</small></td>
                <td><Pill kind={m.status === 'open' ? 'green' : m.status === 'on_hold' ? 'amber' : ''}>{m.status.replace('_', ' ')}</Pill></td>
                <td>{m.myLevel}</td>
                <td><a className="btn small" href={`#/caseDetail/${m.id}`}>Open matter<span className="sr-only">: {m.title}</span></a></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Card>
    </>
  )
}

export function CasesPage() {
  if (apiEnabled()) return <LiveMatters />
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
  const live = apiEnabled() ? matterIdFromHash(window.location.hash) : ''
  if (apiEnabled()) return live ? <MatterWorkspace id={live} /> : <LiveMatters />
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
