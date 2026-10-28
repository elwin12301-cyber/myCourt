import { useEffect, useState, type FormEvent } from 'react'
import { apiEnabled, messageOf } from '../api/client'
import * as W from '../api/workspace'
import { matterIdFromHash } from '../router'
import MatterWorkspace from './MatterWorkspace'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import { Message, Section, Status } from '../components/mui'
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
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(0)
  const load = () => { setLoading(true); W.matters.list().then((p) => { setItems(p.items); setError('') }).catch((e) => setError(messageOf(e))).finally(() => setLoading(false)) }
  useEffect(load, [])
  const create = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true)
    try { const m = await W.matters.create(title, ref); window.location.hash = `#/caseDetail/${m.id}` } catch (err) { setError(messageOf(err)) } finally { setBusy(false) }
  }
  const shown = items.filter((m) => `${m.title} ${m.clientRef} ${m.status} ${m.myLevel}`.toLowerCase().includes(filter.toLowerCase()))
  const PER = 10
  const last = Math.max(0, Math.ceil(shown.length / PER) - 1)
  const at = Math.min(page, last)
  const rows = shown.slice(at * PER, at * PER + PER)
  return (
    <>
      <PageHead title="Cases & matters" sub="Your matters, saved on the server and private to the people you share them with." />
      <Message severity="info">Demonstration mode: matters hold fictional data only. Do not enter real client information.</Message>
      <Section title="Create a matter">
        <Box component="form" onSubmit={create}>
          <TextField id="nm-title" label="Matter title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <TextField id="nm-ref" label="Client reference (optional)" value={ref} onChange={(e) => setRef(e.target.value)} />
          <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={busy} sx={{ mt: 1 }}>Create matter</Button>
        </Box>
      </Section>
      <Section title="Matter register">
        {error && <Message severity="error" onRetry={load}>{error}</Message>}
        {loading && <Typography role="status" color="text.secondary">Loading…</Typography>}
        {!loading && !error && items.length === 0 && <Typography color="text.secondary">You have no matters yet. Create one above.</Typography>}
        {items.length > 0 && (
          <>
            <TextField id="nm-filter" label="Filter matters" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0) }} placeholder="Title, reference, status or access" />
            <TableContainer>
              <Table size="small">
                <caption style={{ position: 'absolute', left: -9999 }}>Your matters</caption>
                <TableHead><TableRow><TableCell>Matter</TableCell><TableCell>Status</TableCell><TableCell>Your access</TableCell><TableCell><span className="sr-only">Actions</span></TableCell></TableRow></TableHead>
                <TableBody>
                  {rows.map((m) => (
                    <TableRow key={m.id} hover>
                      <TableCell><strong>{m.title}</strong><Typography variant="caption" component="div" color="text.secondary">{m.clientRef || 'No client reference'}{m.isDemo ? ' · demonstration' : ''}</Typography></TableCell>
                      <TableCell><Status kind={m.status === 'open' ? 'green' : m.status === 'on_hold' ? 'amber' : ''}>{m.status.replace('_', ' ')}</Status></TableCell>
                      <TableCell>{m.myLevel}</TableCell>
                      <TableCell align="right"><Button size="small" variant="outlined" href={`#/caseDetail/${m.id}`}>Open matter<span className="sr-only">: {m.title}</span></Button></TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && <TableRow><TableCell colSpan={4}>No matters match the filter.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={shown.length} page={at} rowsPerPage={PER} rowsPerPageOptions={[PER]} onPageChange={(_, p) => setPage(p)} />
          </>
        )}
      </Section>
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
