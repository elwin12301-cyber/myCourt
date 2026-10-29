import { useCallback, useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../api/auth'
import { messageOf } from '../api/client'
import * as W from '../api/workspace'
import { Message, Row, Section, SelectField, Status } from '../components/blocks'
import { PageHead } from '../components/ui'
import { AddIcon, Box, Button, Card, CardContent, CheckIcon, Checkbox, FormControlLabel, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography, VerifiedIcon as VerifiedUserIcon, Skeleton } from '../components/kit'

/** The matter workspace shown when the backend is in use: real records, saved on the server, private to the people assigned. */

export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const reload = useCallback(() => {
    setLoading(true)
    load().then((d) => { setData(d); setError('') }).catch((e) => setError(messageOf(e))).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(reload, [reload])
  return { data, error, loading, reload }
}

export function State({ loading, error, onRetry, empty, children }: { loading: boolean; error: string; onRetry: () => void; empty?: string; children: ReactNode }) {
  if (error) return <Message severity="error" onRetry={onRetry}>{error}</Message>
  if (loading) return <Skeleton />
  if (empty) return <Typography color="text.secondary" style={{ paddingTop: 8, paddingBottom: 8 }}>{empty}</Typography>
  return <>{children}</>
}

export function useAction() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true); setError('')
    try { await fn(); after?.() } catch (e) { setError(messageOf(e)) } finally { setBusy(false) }
  }
  return { error, busy, run }
}

export const Err = ({ text }: { text: string }) => (text ? <Message severity="error">{text}</Message> : null)
export const day = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
export const Form = ({ onSubmit, children }: { onSubmit: (e: FormEvent) => void; children: ReactNode }) => (
  <Box component="form" onSubmit={onSubmit} style={{ marginTop: 12 }}>{children}</Box>
)

// ---------- drafts (constitution II: always a draft until an advocate approves) ----------
export function DraftCard({ draft, canApprove, onApprove, busy }: { draft: W.Draft; canApprove: boolean; onApprove: () => void; busy?: boolean }) {
  return (
    <Card component="article" aria-label={draft.title} style={{ marginBottom: 16 }}>
      <CardContent>
        <Stack direction="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Typography variant="h3" component="h4">{draft.title}</Typography>
          <Status kind={draft.status === 'approved' ? 'green' : 'amber'}>{draft.status === 'approved' ? 'Approved' : 'Draft'}</Status>
        </Stack>
        <Typography variant="caption" component="p" style={{ marginTop: 8, marginBottom: 8 }}>
          <strong>{draft.status === 'draft' ? 'Draft: advocate verification required' : 'Approved by an advocate'}</strong>
          {draft.isDemoContent ? ' · Demonstration content, not legal advice' : ''}
        </Typography>
        <Typography style={{ whiteSpace: 'pre-wrap' }}>{draft.body}</Typography>
        {draft.sources.length === 0
          ? <Typography variant="caption" color="text.secondary" component="p" style={{ marginTop: 8 }}>No sources listed.</Typography>
          : <ul>{draft.sources.map((s) => <li key={s.label}>{s.label}{s.reference ? ` — ${s.reference}` : ''}</li>)}</ul>}
        {draft.status === 'draft' && canApprove && (
          <Button size="small" variant="contained" startIcon={<CheckIcon />} disabled={busy} onClick={onApprove} style={{ marginTop: 12 }}>Approve this draft</Button>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- tabs ----------
function Overview({ m, reload, onDeleted }: { m: W.Matter; reload: () => void; onDeleted: () => void }) {
  const { error, busy, run } = useAction()
  const [title, setTitle] = useState(m.title)
  const [ref, setRef] = useState(m.clientRef)
  const [status, setStatus] = useState(m.status)
  const [confirm, setConfirm] = useState('')
  const edit = W.canEdit(m.myLevel)
  const id = useId()
  return (
    <Section title="Matter overview">
      <Box component="form" onSubmit={(e: FormEvent) => { e.preventDefault(); run(() => W.matters.update(m, { title, clientRef: ref, status }), reload) }}>
        <TextField id={`${id}t`} label="Title" value={title} disabled={!edit} onChange={(e) => setTitle(e.target.value)} />
        <TextField id={`${id}r`} label="Client reference" value={ref} disabled={!edit} onChange={(e) => setRef(e.target.value)} />
        <SelectField id={`${id}s`} label="Status" value={status} disabled={!edit} onChange={(e) => setStatus(e.target.value as W.Matter['status'])}>
          <option value="open">Open</option><option value="on_hold">On hold</option><option value="closed">Closed</option>
        </SelectField>
        <Err text={error} />
        {edit
          ? <Button type="submit" variant="contained" disabled={busy} style={{ marginTop: 8 }}>Save changes</Button>
          : <Typography variant="caption" color="text.secondary" component="p">You have view-only access to this matter.</Typography>}
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" style={{ marginTop: 12 }}>
        Your access: <strong>{m.myLevel}</strong>{m.isDemo ? ' · demonstration matter (fictional data)' : ''}
      </Typography>
      {m.myLevel === 'owner' && (
        <details style={{ marginTop: 12 }}>
          <summary>Delete this matter</summary>
          <Typography style={{ marginTop: 8, marginBottom: 8 }}>This permanently deletes the matter and everything under it. The audit trail is kept. Type the matter title to confirm.</Typography>
          <TextField id={`${id}d`} label="Matter title" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button color="error" variant="outlined" disabled={busy || confirm !== m.title} onClick={() => run(() => W.matters.remove(m), onDeleted)} style={{ marginTop: 8 }}>Delete matter</Button>
        </details>
      )}
    </Section>
  )
}

export function TasksTab({ m }: { m: W.Matter }) {
  const l = useLoad(() => W.tasks.list(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const edit = W.canEdit(m.myLevel)
  return (
    <Section title="Tasks">
      <State loading={l.loading} error={l.error} onRetry={l.reload} empty={l.data && l.data.items.length === 0 ? 'No tasks yet.' : undefined}>
        {l.data?.items.map((t) => (
          <Row key={t.id}>
            <FormControlLabel
              control={<Checkbox checked={t.done} disabled={!edit || busy} onChange={() => run(() => W.tasks.update(m.id, t, { done: !t.done }), l.reload)} />}
              label={`${t.title}${t.due ? ` · due ${t.due}` : ''}`} />
          </Row>
        ))}
      </State>
      {edit && (
        <Form onSubmit={(e) => { e.preventDefault(); run(() => W.tasks.create(m.id, { title, due: due || null }), () => { setTitle(''); setDue(''); l.reload() }) }}>
          <TextField id="task-title" label="New task" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <TextField id="task-due" label="Due date (optional)" type="date" value={due} onChange={(e) => setDue(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <Err text={error} />
          <Button type="submit" variant="outlined" startIcon={<AddIcon />} disabled={busy} style={{ marginTop: 8 }}>Add task</Button>
        </Form>
      )}
    </Section>
  )
}

export function CalendarTab({ m }: { m: W.Matter }) {
  const l = useLoad(() => W.calendar.list(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [kind, setKind] = useState<'hearing' | 'deadline' | 'meeting'>('hearing')
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const edit = W.canEdit(m.myLevel)
  return (
    <Section title="Hearings and deadlines">
      <Message severity="info">A deadline is a draft until an advocate approves it. Confirm limitation and procedural dates yourself.</Message>
      <State loading={l.loading} error={l.error} onRetry={l.reload} empty={l.data && l.data.items.length === 0 ? 'Nothing scheduled.' : undefined}>
        {l.data?.items.map((e) => (
          <Row key={e.id}>
            <div><strong>{e.title}</strong><Typography variant="caption" component="div" color="text.secondary">{e.kind} · {day(e.startsAt)}</Typography></div>
            <Stack direction="row" spacing={1} style={{ alignItems: 'center' }}>
              {e.kind === 'deadline' && (e.approvedAt ? <Status kind="green">Approved</Status> : <Status kind="amber">Draft · not approved</Status>)}
              {e.kind === 'deadline' && !e.approvedAt && edit && <Button size="small" variant="outlined" disabled={busy} onClick={() => run(() => W.calendar.action(m.id, e, 'approve'), l.reload)}>Approve deadline</Button>}
            </Stack>
          </Row>
        ))}
      </State>
      {edit && (
        <Form onSubmit={(e) => { e.preventDefault(); run(() => W.calendar.create(m.id, { kind, title, startsAt: new Date(when).toISOString() }), () => { setTitle(''); l.reload() }) }}>
          <SelectField id="cal-kind" label="Type" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="hearing">Hearing</option><option value="deadline">Deadline</option><option value="meeting">Meeting</option>
          </SelectField>
          <TextField id="cal-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <TextField id="cal-when" label="Date and time" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required slotProps={{ inputLabel: { shrink: true } }} />
          <Err text={error} />
          <Button type="submit" variant="outlined" startIcon={<AddIcon />} disabled={busy} style={{ marginTop: 8 }}>Add to calendar</Button>
        </Form>
      )}
    </Section>
  )
}

export function DocumentsTab({ m }: { m: W.Matter }) {
  const docs = useLoad(() => W.documents.list(m.id), [m.id])
  const notes = useLoad(() => W.voiceNotes.list(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [name, setName] = useState('')
  const [type, setType] = useState('pdf')
  const [text, setText] = useState('')
  const [transcript, setTranscript] = useState('')
  const edit = W.canEdit(m.myLevel)
  return (
    <>
      <Section title="Documents">
        <State loading={docs.loading} error={docs.error} onRetry={docs.reload} empty={docs.data && docs.data.items.length === 0 ? 'No documents registered.' : undefined}>
          {docs.data?.items.map((d) => (
            <Row key={d.id}>
              <div><strong>{d.name}</strong><Typography variant="caption" component="div" color="text.secondary">{d.fileType}{d.extractionConfidence != null ? ` · extraction confidence ${Math.round(d.extractionConfidence * 100)}%` : ''}</Typography></div>
              <Stack direction="row" spacing={1} style={{ alignItems: 'center' }}>
                <Status kind={d.reviewStatus === 'reviewed' ? 'green' : 'amber'}>{d.reviewStatus === 'reviewed' ? 'Reviewed' : 'Needs review'}</Status>
                {edit && d.reviewStatus !== 'reviewed' && <Button size="small" variant="outlined" disabled={busy} onClick={() => run(() => W.documents.action(m.id, d, 'review'), docs.reload)}>Mark reviewed</Button>}
              </Stack>
            </Row>
          ))}
        </State>
        {edit && (
          <Form onSubmit={(e) => { e.preventDefault(); run(() => W.documents.create(m.id, { name, fileType: type, extractedText: text }), () => { setName(''); setText(''); docs.reload() }) }}>
            <Typography variant="caption" color="text.secondary" component="p">Only the register entry and extracted text are stored; the file itself is not uploaded.</Typography>
            <TextField id="doc-name" label="Document name" value={name} onChange={(e) => setName(e.target.value)} required />
            <SelectField id="doc-type" label="File type" value={type} onChange={(e) => setType(e.target.value)}>
              {['pdf', 'docx', 'image', 'text', 'spreadsheet', 'other'].map((t) => <option key={t}>{t}</option>)}
            </SelectField>
            <TextField id="doc-text" label="Extracted text (optional)" multiline rows={3} value={text} onChange={(e) => setText(e.target.value)} />
            <Err text={error} />
            <Button type="submit" variant="outlined" startIcon={<AddIcon />} disabled={busy} style={{ marginTop: 8 }}>Register document</Button>
          </Form>
        )}
      </Section>
      <Section title="Voice-note transcripts">
        <Typography variant="caption" color="text.secondary" component="p">Dictation happens in your browser; only the transcript text is sent to the server.</Typography>
        <State loading={notes.loading} error={notes.error} onRetry={notes.reload} empty={notes.data && notes.data.items.length === 0 ? 'No transcripts yet.' : undefined}>
          {notes.data?.items.map((n) => (
            <Row key={n.id}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{n.transcript}</div>
              <Stack direction="row" spacing={1} style={{ alignItems: 'center' }}>
                <Status kind={n.reviewStatus === 'reviewed' ? 'green' : 'amber'}>{n.reviewStatus === 'reviewed' ? 'Reviewed' : 'Needs review'}</Status>
                {edit && n.reviewStatus !== 'reviewed' && <Button size="small" variant="outlined" disabled={busy} onClick={() => run(() => W.voiceNotes.action(m.id, n, 'review'), notes.reload)}>Mark reviewed</Button>}
              </Stack>
            </Row>
          ))}
        </State>
        {edit && (
          <Form onSubmit={(e) => { e.preventDefault(); run(() => W.voiceNotes.create(m.id, { transcript }), () => { setTranscript(''); notes.reload() }) }}>
            <TextField id="vn-text" label="Transcript" multiline rows={3} value={transcript} onChange={(e) => setTranscript(e.target.value)} required />
            <Button type="submit" variant="outlined" disabled={busy} style={{ marginTop: 8 }}>Save transcript</Button>
          </Form>
        )}
      </Section>
    </>
  )
}

export function DraftsTab({ m }: { m: W.Matter }) {
  const l = useLoad(() => W.drafts.list(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const edit = W.canEdit(m.myLevel)
  return (
    <>
      <Message severity="warning">Everything here is a draft until an advocate approves it. This release uses demonstration content only: no matter text is sent to an AI service, and nothing here is legal advice.</Message>
      {edit && (
        <Section title="Research (demonstration)">
          <Box component="form" onSubmit={(e: FormEvent) => { e.preventDefault(); run(() => W.drafts.research(m.id, query), () => { setQuery(''); l.reload() }) }}>
            <TextField id="rs-q" label="Search the demonstration sources" value={query} onChange={(e) => setQuery(e.target.value)} required />
            <Err text={error} />
            <Button type="submit" variant="contained" disabled={busy} style={{ marginTop: 8 }}>Search</Button>
          </Box>
        </Section>
      )}
      <State loading={l.loading} error={l.error} onRetry={l.reload} empty={l.data && l.data.items.length === 0 ? 'No drafts yet.' : undefined}>
        {l.data?.items.map((d) => <DraftCard key={d.id} draft={d} canApprove={edit} busy={busy} onApprove={() => run(() => W.drafts.approve(m.id, d), l.reload)} />)}
      </State>
      {edit && (
        <Section title="Write a draft note">
          <Box component="form" onSubmit={(e: FormEvent) => { e.preventDefault(); run(() => W.drafts.create(m.id, { kind: 'summary', title, body, sources: [] }), () => { setTitle(''); setBody(''); l.reload() }) }}>
            <TextField id="dr-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <TextField id="dr-body" label="Text" multiline rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
            <Button type="submit" variant="outlined" disabled={busy} style={{ marginTop: 8 }}>Save draft</Button>
          </Box>
        </Section>
      )}
    </>
  )
}

export function BillingTab({ m }: { m: W.Matter }) {
  const te = useLoad(() => W.timeEntries.list(m.id), [m.id])
  const inv = useLoad(() => W.invoices.list(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [day0, setDay0] = useState('')
  const [minutes, setMinutes] = useState('60')
  const [rate, setRate] = useState('2000')
  const [desc, setDesc] = useState('')
  const [number, setNumber] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const edit = W.canEdit(m.myLevel)
  return (
    <>
      <Section title="Time entries">
        <State loading={te.loading} error={te.error} onRetry={te.reload} empty={te.data && te.data.items.length === 0 ? 'No time recorded.' : undefined}>
          {te.data?.items.map((t) => (
            <Row key={t.id}>
              <FormControlLabel
                control={edit ? <Checkbox checked={picked.includes(t.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, t.id] : picked.filter((x) => x !== t.id))} /> : <span />}
                label={`${t.workedOn} · ${t.minutes} min · ${t.description || 'No description'}`} />
              <strong>{W.rupees(Math.round((t.minutes * t.ratePaise) / 60))}</strong>
            </Row>
          ))}
        </State>
        {edit && (
          <Form onSubmit={(e) => { e.preventDefault(); run(() => W.timeEntries.create(m.id, { workedOn: day0, minutes: Number(minutes), ratePaise: Math.round(Number(rate) * 100), description: desc }), () => { setDesc(''); te.reload() }) }}>
            <TextField id="te-day" label="Date worked" type="date" value={day0} onChange={(e) => setDay0(e.target.value)} required slotProps={{ inputLabel: { shrink: true } }} />
            <TextField id="te-min" label="Minutes" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} required slotProps={{ htmlInput: { min: 1, max: 1440 } }} />
            <TextField id="te-rate" label="Rate per hour (₹)" type="number" value={rate} onChange={(e) => setRate(e.target.value)} required slotProps={{ htmlInput: { min: 0 } }} />
            <TextField id="te-desc" label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <Err text={error} />
            <Button type="submit" variant="outlined" startIcon={<AddIcon />} disabled={busy} style={{ marginTop: 8 }}>Add time</Button>
          </Form>
        )}
      </Section>
      <Section title="Invoices">
        <Message severity="info">Totals are calculated by the server from the time entries. An invoice is a draft until approved; approving records the decision but does not send anything.</Message>
        <State loading={inv.loading} error={inv.error} onRetry={inv.reload} empty={inv.data && inv.data.items.length === 0 ? 'No invoices yet.' : undefined}>
          {inv.data?.items.map((i) => (
            <Row key={i.id}>
              <div><strong>{i.number}</strong><Typography variant="caption" component="div" color="text.secondary">{i.lines.length} line(s) · {W.rupees(i.totalPaise)}</Typography></div>
              <Stack direction="row" spacing={1} style={{ alignItems: 'center' }}>
                <Status kind={i.status === 'approved' ? 'green' : 'amber'}>{i.status === 'approved' ? 'Approved' : 'Draft'}</Status>
                {edit && i.status === 'draft' && <Button size="small" variant="outlined" disabled={busy} onClick={() => run(() => W.invoices.approve(m.id, i), inv.reload)}>Approve invoice</Button>}
              </Stack>
            </Row>
          ))}
        </State>
        {edit && (
          <Form onSubmit={(e) => { e.preventDefault(); run(() => W.invoices.create(m.id, { number, timeEntryIds: picked }), () => { setNumber(''); setPicked([]); inv.reload() }) }}>
            <Typography variant="caption" color="text.secondary" component="p">Tick time entries above, then give the invoice a number.</Typography>
            <TextField id="inv-no" label="Invoice number" value={number} onChange={(e) => setNumber(e.target.value)} required />
            <Button type="submit" variant="outlined" disabled={busy || picked.length === 0} style={{ marginTop: 8 }}>Create invoice from {picked.length} entr{picked.length === 1 ? 'y' : 'ies'}</Button>
          </Form>
        )}
      </Section>
    </>
  )
}

function AccessTab({ m }: { m: W.Matter }) {
  const l = useLoad(() => W.matters.assignments(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [email, setEmail] = useState('')
  const [level, setLevel] = useState<W.Level>('view')
  const owner = m.myLevel === 'owner'
  return (
    <Section title="Who has access">
      <State loading={l.loading} error={l.error} onRetry={l.reload}>
        {l.data?.map((a) => (
          <Row key={a.personId}>
            <div><strong>{a.displayName}</strong><Typography variant="caption" component="div" color="text.secondary">{a.level}</Typography></div>
            {owner && (
              <Stack direction="row" spacing={1} style={{ alignItems: 'center' }}>
                <SelectField id={`lv-${a.personId}`} label={`Access level for ${a.displayName}`} value={a.level} disabled={busy} fullWidth={false} margin="none"
                  onChange={(e) => run(() => W.matters.share(m.id, a.personId, e.target.value as W.Level), l.reload)}>
                  <option value="view">view</option><option value="edit">edit</option><option value="owner">owner</option>
                </SelectField>
                <Button size="small" variant="outlined" disabled={busy} onClick={() => run(() => W.matters.unshare(m.id, a.personId), l.reload)}>Remove</Button>
              </Stack>
            )}
          </Row>
        ))}
      </State>
      {owner && (
        <Form onSubmit={(e) => { e.preventDefault(); run(async () => { const p = await W.matters.findPerson(email); await W.matters.share(m.id, p.id, level) }, () => { setEmail(''); l.reload() }) }}>
          <TextField id="ac-email" label="Share with (their account e-mail)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <SelectField id="ac-level" label="Access level" value={level} onChange={(e) => setLevel(e.target.value as W.Level)}>
            <option value="view">view only</option><option value="edit">edit</option><option value="owner">owner</option>
          </SelectField>
          <Err text={error} />
          <Button type="submit" variant="contained" disabled={busy} style={{ marginTop: 8 }}>Share</Button>
        </Form>
      )}
      {!owner && <Typography variant="caption" color="text.secondary" component="p">Only an owner can change who has access.</Typography>}
    </Section>
  )
}

export function AuditView({ matterId }: { matterId: string }) {
  const l = useLoad(() => W.matters.audit(matterId), [matterId])
  const { error, busy, run } = useAction()
  const [verdict, setVerdict] = useState('')
  return (
    <Section title="Audit trail">
      <Typography variant="caption" color="text.secondary" component="p" style={{ marginBottom: 8 }}>Who viewed, created, changed, shared or approved something on this matter. Entries cannot be edited or removed.</Typography>
      <Button size="small" variant="outlined" startIcon={<VerifiedUserIcon />} disabled={busy}
        onClick={() => run(async () => { const r = await W.matters.verifyAudit(matterId); setVerdict(r.ok ? 'The trail is intact.' : `The trail was altered at entry ${r.firstBadId}.`) })}>Verify the trail</Button>
      <div role="status" style={{ minHeight: 24 }}>{verdict}</div>
      <Err text={error} />
      <State loading={l.loading} error={l.error} onRetry={l.reload} empty={l.data && l.data.items.length === 0 ? 'No entries.' : undefined}>
        <TableContainer>
          <Table size="small">
            <caption style={{ position: 'absolute', left: -9999 }}>Audit trail, newest first</caption>
            <TableHead><TableRow><TableCell>When</TableCell><TableCell>Action</TableCell><TableCell>Item</TableCell><TableCell>Detail</TableCell></TableRow></TableHead>
            <TableBody>{l.data?.items.map((e) => (
              <TableRow key={e.id}><TableCell>{day(e.time)}</TableCell><TableCell>{e.action}</TableCell><TableCell>{e.targetType}</TableCell><TableCell>{e.detail}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </TableContainer>
      </State>
    </Section>
  )
}

const TABS = ['Overview', 'Tasks', 'Calendar', 'Documents', 'Drafts', 'Time & invoices', 'Access', 'Audit'] as const

export default function MatterWorkspace({ id }: { id: string }) {
  const { person } = useAuth()
  const m = useLoad(() => W.matters.get(id), [id])
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const matter = m.data
  const tabs = TABS.filter((t) => t !== 'Audit' || matter?.myLevel === 'owner')
  return (
    <>
      <PageHead title={matter?.title ?? 'Matter'} sub={matter ? `${matter.clientRef || 'No client reference'} · ${matter.status.replace('_', ' ')}` : 'Loading the matter…'}>
        <Button variant="outlined" href="#/cases">All matters</Button>
      </PageHead>
      <State loading={m.loading && !matter} error={m.error} onRetry={m.reload}>
        {matter && (
          <>
            <Box style={{ borderBottom: '1px solid var(--line)' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v as (typeof TABS)[number])} variant="scrollable" scrollButtons="auto" aria-label="Matter sections">
                {tabs.map((t) => <Tab key={t} value={t} label={t} id={`mt-${t}`} aria-controls="mt-panel" />)}
              </Tabs>
            </Box>
            <Box id="mt-panel" role="tabpanel" aria-labelledby={`mt-${tab}`} style={{ marginTop: 16 }}>
              {tab === 'Overview' && <Overview m={matter} reload={m.reload} onDeleted={() => { window.location.hash = '#/cases' }} />}
              {tab === 'Tasks' && <TasksTab m={matter} />}
              {tab === 'Calendar' && <CalendarTab m={matter} />}
              {tab === 'Documents' && <DocumentsTab m={matter} />}
              {tab === 'Drafts' && <DraftsTab m={matter} />}
              {tab === 'Time & invoices' && <BillingTab m={matter} />}
              {tab === 'Access' && <AccessTab m={matter} />}
              {tab === 'Audit' && <AuditView matterId={matter.id} />}
            </Box>
            <Typography variant="caption" color="text.secondary" component="p" style={{ marginTop: 8 }}>Signed in as {person?.displayName}.</Typography>
          </>
        )}
      </State>
    </>
  )
}
