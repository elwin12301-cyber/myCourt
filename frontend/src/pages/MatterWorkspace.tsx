import { useCallback, useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../api/auth'
import { messageOf } from '../api/client'
import * as W from '../api/workspace'
import { Card, Notice, PageHead, Pill } from '../components/ui'

/** The matter workspace shown when the backend is in use: real records, saved on the server, private to the people assigned. */

function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
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

function State({ loading, error, onRetry, empty, children }: { loading: boolean; error: string; onRetry: () => void; empty?: string; children: ReactNode }) {
  if (error) return <div role="alert" className="notice">{error} <button type="button" className="btn small" onClick={onRetry}>Retry</button></div>
  if (loading) return <div role="status" className="muted">Loading…</div>
  if (empty) return <div className="empty">{empty}</div>
  return <>{children}</>
}

function useAction() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true); setError('')
    try { await fn(); after?.() } catch (e) { setError(messageOf(e)) } finally { setBusy(false) }
  }
  return { error, busy, run, clear: () => setError('') }
}

const Err = ({ id, text }: { id: string; text: string }) => (text ? <div id={id} role="alert" className="notice">{text}</div> : null)
const day = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

// ---------- drafts (constitution II: always a draft until an advocate approves) ----------
export function DraftCard({ draft, canApprove, onApprove, busy }: { draft: W.Draft; canApprove: boolean; onApprove: () => void; busy?: boolean }) {
  return (
    <article className="card" aria-label={draft.title}>
      <div className="cardhead">
        <h4 style={{ margin: 0 }}>{draft.title}</h4>
        <Pill kind={draft.status === 'approved' ? 'green' : 'amber'}>{draft.status === 'approved' ? 'Approved' : 'Draft'}</Pill>
      </div>
      <p className="tiny"><strong>{draft.status === 'draft' ? 'Draft: advocate verification required' : 'Approved by an advocate'}</strong>
        {draft.isDemoContent ? ' · Demonstration content, not legal advice' : ''}</p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{draft.body}</p>
      {draft.sources.length === 0
        ? <p className="tiny muted">No sources listed.</p>
        : <ul>{draft.sources.map((s) => <li key={s.label}>{s.label}{s.reference ? ` — ${s.reference}` : ''}</li>)}</ul>}
      {draft.status === 'draft' && canApprove && (
        <button type="button" className="btn small primary" disabled={busy} onClick={onApprove}>Approve this draft</button>
      )}
    </article>
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
    <Card title="Matter overview">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); run(() => W.matters.update(m, { title, clientRef: ref, status }), reload) }}>
        <div className="field"><label htmlFor={`${id}t`}>Title</label><input id={`${id}t`} value={title} disabled={!edit} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label htmlFor={`${id}r`}>Client reference</label><input id={`${id}r`} value={ref} disabled={!edit} onChange={(e) => setRef(e.target.value)} /></div>
        <div className="field"><label htmlFor={`${id}s`}>Status</label>
          <select id={`${id}s`} value={status} disabled={!edit} onChange={(e) => setStatus(e.target.value as W.Matter['status'])}>
            <option value="open">Open</option><option value="on_hold">On hold</option><option value="closed">Closed</option>
          </select></div>
        <Err id="ov-err" text={error} />
        {edit ? <button className="btn primary" type="submit" disabled={busy}>Save changes</button> : <p className="tiny muted">You have view-only access to this matter.</p>}
      </form>
      <p className="tiny muted">Your access: <strong>{m.myLevel}</strong>{m.isDemo ? ' · demonstration matter (fictional data)' : ''}</p>
      {m.myLevel === 'owner' && (
        <details>
          <summary>Delete this matter</summary>
          <p>This permanently deletes the matter and everything under it. The audit trail is kept. Type the matter title to confirm.</p>
          <div className="field"><label htmlFor={`${id}d`}>Matter title</label><input id={`${id}d`} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          <button type="button" className="btn" disabled={busy || confirm !== m.title} onClick={() => run(() => W.matters.remove(m), onDeleted)}>Delete matter</button>
        </details>
      )}
    </Card>
  )
}

function TasksTab({ m }: { m: W.Matter }) {
  const l = useLoad(() => W.tasks.list(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const edit = W.canEdit(m.myLevel)
  return (
    <Card title="Tasks">
      <State loading={l.loading} error={l.error} onRetry={l.reload} empty={l.data && l.data.items.length === 0 ? 'No tasks yet.' : undefined}>
        <ul className="list">{l.data?.items.map((t) => (
          <li className="listrow" key={t.id}>
            <label><input type="checkbox" checked={t.done} disabled={!edit || busy} onChange={() => run(() => W.tasks.update(m.id, t, { done: !t.done }), l.reload)} /> {t.title}{t.due ? ` · due ${t.due}` : ''}</label>
          </li>))}</ul>
      </State>
      {edit && (
        <form onSubmit={(e) => { e.preventDefault(); run(() => W.tasks.create(m.id, { title, due: due || null }), () => { setTitle(''); setDue(''); l.reload() }) }}>
          <div className="field"><label htmlFor="task-title">New task</label><input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="field"><label htmlFor="task-due">Due date (optional)</label><input id="task-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
          <Err id="task-err" text={error} />
          <button className="btn" type="submit" disabled={busy}>Add task</button>
        </form>
      )}
    </Card>
  )
}

function CalendarTab({ m }: { m: W.Matter }) {
  const l = useLoad(() => W.calendar.list(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [kind, setKind] = useState<'hearing' | 'deadline' | 'meeting'>('hearing')
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const edit = W.canEdit(m.myLevel)
  return (
    <Card title="Hearings and deadlines">
      <Notice>A deadline is a draft until an advocate approves it. Confirm limitation and procedural dates yourself.</Notice>
      <State loading={l.loading} error={l.error} onRetry={l.reload} empty={l.data && l.data.items.length === 0 ? 'Nothing scheduled.' : undefined}>
        <ul className="list">{l.data?.items.map((e) => (
          <li className="listrow" key={e.id}>
            <div><strong>{e.title}</strong><small>{e.kind} · {day(e.startsAt)}</small></div>
            <div className="actions">
              {e.kind === 'deadline' && (e.approvedAt ? <Pill kind="green">Approved</Pill> : <Pill kind="amber">Draft · not approved</Pill>)}
              {e.kind === 'deadline' && !e.approvedAt && edit && <button type="button" className="btn small" disabled={busy} onClick={() => run(() => W.calendar.action(m.id, e, 'approve'), l.reload)}>Approve deadline</button>}
            </div>
          </li>))}</ul>
      </State>
      {edit && (
        <form onSubmit={(e) => { e.preventDefault(); run(() => W.calendar.create(m.id, { kind, title, startsAt: new Date(when).toISOString() }), () => { setTitle(''); l.reload() }) }}>
          <div className="field"><label htmlFor="cal-kind">Type</label>
            <select id="cal-kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="hearing">Hearing</option><option value="deadline">Deadline</option><option value="meeting">Meeting</option></select></div>
          <div className="field"><label htmlFor="cal-title">Title</label><input id="cal-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="field"><label htmlFor="cal-when">Date and time</label><input id="cal-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required /></div>
          <Err id="cal-err" text={error} />
          <button className="btn" type="submit" disabled={busy}>Add to calendar</button>
        </form>
      )}
    </Card>
  )
}

function DocumentsTab({ m }: { m: W.Matter }) {
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
      <Card title="Documents">
        <State loading={docs.loading} error={docs.error} onRetry={docs.reload} empty={docs.data && docs.data.items.length === 0 ? 'No documents registered.' : undefined}>
          <ul className="list">{docs.data?.items.map((d) => (
            <li className="listrow" key={d.id}>
              <div><strong>{d.name}</strong><small>{d.fileType}{d.extractionConfidence != null ? ` · extraction confidence ${Math.round(d.extractionConfidence * 100)}%` : ''}</small></div>
              <div className="actions">
                <Pill kind={d.reviewStatus === 'reviewed' ? 'green' : 'amber'}>{d.reviewStatus === 'reviewed' ? 'Reviewed' : 'Needs review'}</Pill>
                {edit && d.reviewStatus !== 'reviewed' && <button type="button" className="btn small" disabled={busy} onClick={() => run(() => W.documents.action(m.id, d, 'review'), docs.reload)}>Mark reviewed</button>}
              </div>
            </li>))}</ul>
        </State>
        {edit && (
          <form onSubmit={(e) => { e.preventDefault(); run(() => W.documents.create(m.id, { name, fileType: type, extractedText: text }), () => { setName(''); setText(''); docs.reload() }) }}>
            <p className="tiny muted">Only the register entry and extracted text are stored; the file itself is not uploaded.</p>
            <div className="field"><label htmlFor="doc-name">Document name</label><input id="doc-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="field"><label htmlFor="doc-type">File type</label>
              <select id="doc-type" value={type} onChange={(e) => setType(e.target.value)}>{['pdf', 'docx', 'image', 'text', 'spreadsheet', 'other'].map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label htmlFor="doc-text">Extracted text (optional)</label><textarea id="doc-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} /></div>
            <Err id="doc-err" text={error} />
            <button className="btn" type="submit" disabled={busy}>Register document</button>
          </form>
        )}
      </Card>
      <Card title="Voice-note transcripts">
        <p className="tiny muted">Dictation happens in your browser; only the transcript text is sent to the server.</p>
        <State loading={notes.loading} error={notes.error} onRetry={notes.reload} empty={notes.data && notes.data.items.length === 0 ? 'No transcripts yet.' : undefined}>
          <ul className="list">{notes.data?.items.map((n) => (
            <li className="listrow" key={n.id}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{n.transcript}</div>
              <div className="actions"><Pill kind={n.reviewStatus === 'reviewed' ? 'green' : 'amber'}>{n.reviewStatus === 'reviewed' ? 'Reviewed' : 'Needs review'}</Pill>
                {edit && n.reviewStatus !== 'reviewed' && <button type="button" className="btn small" disabled={busy} onClick={() => run(() => W.voiceNotes.action(m.id, n, 'review'), notes.reload)}>Mark reviewed</button>}</div>
            </li>))}</ul>
        </State>
        {edit && (
          <form onSubmit={(e) => { e.preventDefault(); run(() => W.voiceNotes.create(m.id, { transcript }), () => { setTranscript(''); notes.reload() }) }}>
            <div className="field"><label htmlFor="vn-text">Transcript</label><textarea id="vn-text" rows={3} value={transcript} onChange={(e) => setTranscript(e.target.value)} required /></div>
            <button className="btn" type="submit" disabled={busy}>Save transcript</button>
          </form>
        )}
      </Card>
    </>
  )
}

function DraftsTab({ m }: { m: W.Matter }) {
  const l = useLoad(() => W.drafts.list(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const edit = W.canEdit(m.myLevel)
  return (
    <>
      <Notice>Everything here is a draft until an advocate approves it. This release uses demonstration content only: no matter text is sent to an AI service, and nothing here is legal advice.</Notice>
      {edit && (
        <Card title="Research (demonstration)">
          <form onSubmit={(e) => { e.preventDefault(); run(() => W.drafts.research(m.id, query), () => { setQuery(''); l.reload() }) }}>
            <div className="field"><label htmlFor="rs-q">Search the demonstration sources</label><input id="rs-q" value={query} onChange={(e) => setQuery(e.target.value)} required /></div>
            <Err id="rs-err" text={error} />
            <button className="btn" type="submit" disabled={busy}>Search</button>
          </form>
        </Card>
      )}
      <State loading={l.loading} error={l.error} onRetry={l.reload} empty={l.data && l.data.items.length === 0 ? 'No drafts yet.' : undefined}>
        {l.data?.items.map((d) => <DraftCard key={d.id} draft={d} canApprove={edit} busy={busy} onApprove={() => run(() => W.drafts.approve(m.id, d), l.reload)} />)}
      </State>
      {edit && (
        <Card title="Write a draft note">
          <form onSubmit={(e) => { e.preventDefault(); run(() => W.drafts.create(m.id, { kind: 'summary', title, body, sources: [] }), () => { setTitle(''); setBody(''); l.reload() }) }}>
            <div className="field"><label htmlFor="dr-title">Title</label><input id="dr-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div className="field"><label htmlFor="dr-body">Text</label><textarea id="dr-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} required /></div>
            <button className="btn" type="submit" disabled={busy}>Save draft</button>
          </form>
        </Card>
      )}
    </>
  )
}

function BillingTab({ m }: { m: W.Matter }) {
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
      <Card title="Time entries">
        <State loading={te.loading} error={te.error} onRetry={te.reload} empty={te.data && te.data.items.length === 0 ? 'No time recorded.' : undefined}>
          <ul className="list">{te.data?.items.map((t) => (
            <li className="listrow" key={t.id}>
              <label>{edit && <input type="checkbox" checked={picked.includes(t.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, t.id] : picked.filter((x) => x !== t.id))} />} {t.workedOn} · {t.minutes} min · {t.description || 'No description'}</label>
              <strong>{W.rupees(Math.round((t.minutes * t.ratePaise) / 60))}</strong>
            </li>))}</ul>
        </State>
        {edit && (
          <form onSubmit={(e) => { e.preventDefault(); run(() => W.timeEntries.create(m.id, { workedOn: day0, minutes: Number(minutes), ratePaise: Math.round(Number(rate) * 100), description: desc }), () => { setDesc(''); te.reload() }) }}>
            <div className="field"><label htmlFor="te-day">Date worked</label><input id="te-day" type="date" value={day0} onChange={(e) => setDay0(e.target.value)} required /></div>
            <div className="field"><label htmlFor="te-min">Minutes</label><input id="te-min" type="number" min={1} max={1440} value={minutes} onChange={(e) => setMinutes(e.target.value)} required /></div>
            <div className="field"><label htmlFor="te-rate">Rate per hour (₹)</label><input id="te-rate" type="number" min={0} value={rate} onChange={(e) => setRate(e.target.value)} required /></div>
            <div className="field"><label htmlFor="te-desc">Description</label><input id="te-desc" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <Err id="te-err" text={error} />
            <button className="btn" type="submit" disabled={busy}>Add time</button>
          </form>
        )}
      </Card>
      <Card title="Invoices">
        <Notice>Totals are calculated by the server from the time entries. An invoice is a draft until approved; approving records the decision but does not send anything.</Notice>
        <State loading={inv.loading} error={inv.error} onRetry={inv.reload} empty={inv.data && inv.data.items.length === 0 ? 'No invoices yet.' : undefined}>
          <ul className="list">{inv.data?.items.map((i) => (
            <li className="listrow" key={i.id}>
              <div><strong>{i.number}</strong><small>{i.lines.length} line(s) · {W.rupees(i.totalPaise)}</small></div>
              <div className="actions"><Pill kind={i.status === 'approved' ? 'green' : 'amber'}>{i.status === 'approved' ? 'Approved' : 'Draft'}</Pill>
                {edit && i.status === 'draft' && <button type="button" className="btn small" disabled={busy} onClick={() => run(() => W.invoices.approve(m.id, i), inv.reload)}>Approve invoice</button>}</div>
            </li>))}</ul>
        </State>
        {edit && (
          <form onSubmit={(e) => { e.preventDefault(); run(() => W.invoices.create(m.id, { number, timeEntryIds: picked }), () => { setNumber(''); setPicked([]); inv.reload() }) }}>
            <p className="tiny muted">Tick time entries above, then give the invoice a number.</p>
            <div className="field"><label htmlFor="inv-no">Invoice number</label><input id="inv-no" value={number} onChange={(e) => setNumber(e.target.value)} required /></div>
            <button className="btn" type="submit" disabled={busy || picked.length === 0}>Create invoice from {picked.length} entr{picked.length === 1 ? 'y' : 'ies'}</button>
          </form>
        )}
      </Card>
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
    <Card title="Who has access">
      <State loading={l.loading} error={l.error} onRetry={l.reload}>
        <ul className="list">{l.data?.map((a) => (
          <li className="listrow" key={a.personId}>
            <div><strong>{a.displayName}</strong><small>{a.level}</small></div>
            {owner && (
              <div className="actions">
                <label className="sr-only" htmlFor={`lv-${a.personId}`}>Access level for {a.displayName}</label>
                <select id={`lv-${a.personId}`} value={a.level} disabled={busy} onChange={(e) => run(() => W.matters.share(m.id, a.personId, e.target.value as W.Level), l.reload)}>
                  <option value="view">view</option><option value="edit">edit</option><option value="owner">owner</option>
                </select>
                <button type="button" className="btn small" disabled={busy} onClick={() => run(() => W.matters.unshare(m.id, a.personId), l.reload)}>Remove</button>
              </div>)}
          </li>))}</ul>
      </State>
      {owner && (
        <form onSubmit={(e) => { e.preventDefault(); run(async () => { const p = await W.matters.findPerson(email); await W.matters.share(m.id, p.id, level) }, () => { setEmail(''); l.reload() }) }}>
          <div className="field"><label htmlFor="ac-email">Share with (their account e-mail)</label><input id="ac-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="field"><label htmlFor="ac-level">Access level</label>
            <select id="ac-level" value={level} onChange={(e) => setLevel(e.target.value as W.Level)}><option value="view">view only</option><option value="edit">edit</option><option value="owner">owner</option></select></div>
          <Err id="ac-err" text={error} />
          <button className="btn" type="submit" disabled={busy}>Share</button>
        </form>
      )}
      {!owner && <p className="tiny muted">Only an owner can change who has access.</p>}
    </Card>
  )
}

export function AuditView({ matterId }: { matterId: string }) {
  const l = useLoad(() => W.matters.audit(matterId), [matterId])
  const { error, busy, run } = useAction()
  const [verdict, setVerdict] = useState('')
  return (
    <Card title="Audit trail">
      <p className="tiny muted">Who viewed, created, changed, shared or approved something on this matter. Entries cannot be edited or removed.</p>
      <button type="button" className="btn small" disabled={busy} onClick={() => run(async () => { const r = await W.matters.verifyAudit(matterId); setVerdict(r.ok ? 'The trail is intact.' : `The trail was altered at entry ${r.firstBadId}.`) })}>Verify the trail</button>
      <div role="status">{verdict}</div>
      <Err id="au-err" text={error} />
      <State loading={l.loading} error={l.error} onRetry={l.reload} empty={l.data && l.data.items.length === 0 ? 'No entries.' : undefined}>
        <div className="tablewrap"><table>
          <caption className="sr-only">Audit trail, newest first</caption>
          <thead><tr><th scope="col">When</th><th scope="col">Action</th><th scope="col">Item</th><th scope="col">Detail</th></tr></thead>
          <tbody>{l.data?.items.map((e) => <tr key={e.id}><td>{day(e.time)}</td><td>{e.action}</td><td>{e.targetType}</td><td>{e.detail}</td></tr>)}</tbody>
        </table></div>
      </State>
    </Card>
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
        <a className="btn" href="#/cases">All matters</a>
      </PageHead>
      <State loading={m.loading && !matter} error={m.error} onRetry={m.reload}>
        {matter && (
          <>
            <div className="tabrow" role="tablist" aria-label="Matter sections">
              {tabs.map((t) => (
                <button key={t} role="tab" id={`mt-${t}`} aria-selected={tab === t} aria-controls="mt-panel" className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
            <div id="mt-panel" role="tabpanel" aria-labelledby={`mt-${tab}`} style={{ marginTop: 16 }}>
              {tab === 'Overview' && <Overview m={matter} reload={m.reload} onDeleted={() => { window.location.hash = '#/cases' }} />}
              {tab === 'Tasks' && <TasksTab m={matter} />}
              {tab === 'Calendar' && <CalendarTab m={matter} />}
              {tab === 'Documents' && <DocumentsTab m={matter} />}
              {tab === 'Drafts' && <DraftsTab m={matter} />}
              {tab === 'Time & invoices' && <BillingTab m={matter} />}
              {tab === 'Access' && <AccessTab m={matter} />}
              {tab === 'Audit' && <AuditView matterId={matter.id} />}
            </div>
            <p className="tiny muted">Signed in as {person?.displayName}.</p>
          </>
        )}
      </State>
    </>
  )
}
