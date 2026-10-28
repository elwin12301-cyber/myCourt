import { useEffect, useRef, useState, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import * as W from '../../api/workspace'
import { Message, Row, Section, SelectField, Status } from '../../components/mui'
import { PageHead } from '../../components/ui'
import { useApp } from '../../context'
import { commandFor, SPEECH_LANGUAGES, useSpeech } from '../../features/speech'
import type { PageId } from '../../types'
import { BillingTab, CalendarTab, DocumentsTab, DraftCard, Err, Form, State, TasksTab, day, useAction, useLoad } from '../MatterWorkspace'
import { Scoped } from './Scope'

const NOTICE = 'Demonstration content only. Everything generated is a draft: an advocate must verify it before it is relied on, filed or sent.'

// ---------- Calendar & follow-up ----------
export function LiveCalendar() {
  const next = useLoad(() => W.calendarAll(), [])
  return (
    <Scoped title="Calendar & Follow-up" sub="Hearings, deadlines, tasks and follow-ups across the matters you can see, saved on the server.">
      {(m) => (
        <>
          <Section title="Next dates across all your matters">
            <State loading={next.loading} error={next.error} onRetry={next.reload} empty={next.data && next.data.items.length === 0 ? 'Nothing is scheduled in the next two months.' : undefined}>
              {next.data?.items.slice(0, 10).map((e) => (
                <Row key={e.id}><span><strong>{e.title}</strong> <Typography component="span" variant="caption" color="text.secondary">{e.kind} · {day(e.startsAt)}</Typography></span>
                  {e.kind === 'deadline' && <Status kind={e.approvedAt ? 'green' : 'amber'}>{e.approvedAt ? 'Approved' : 'Needs approval'}</Status>}</Row>
              ))}
            </State>
          </Section>
          <CalendarTab m={m} />
          <TasksTab m={m} />
        </>
      )}
    </Scoped>
  )
}

// ---------- Documents & OCR ----------
export const LiveDocuments = () => (
  <Scoped title="Documents & OCR" sub="Register documents and keep their extracted text with a recorded review.">{(m) => <DocumentsTab m={m} />}</Scoped>
)

// ---------- Time & billing ----------
export const LiveBilling = () => (
  <Scoped title="Time & Billing" sub="Time entries and invoices per matter. Totals are computed on the server; an invoice is a draft until approved.">{(m) => <BillingTab m={m} />}</Scoped>
)

// ---------- Research and section mapping (both return a labelled draft from the demonstration provider) ----------
function Generate({ kind, title, sub, label, placeholder }: { kind: 'research' | 'mapping'; title: string; sub: string; label: string; placeholder: string }) {
  return (
    <Scoped title={title} sub={sub}>
      {(m) => <GenerateBody m={m} kind={kind} label={label} placeholder={placeholder} />}
    </Scoped>
  )
}

function GenerateBody({ m, kind, label, placeholder }: { m: W.Matter; kind: 'research' | 'mapping'; label: string; placeholder: string }) {
  const past = useLoad(() => W.drafts.list(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [query, setQuery] = useState('')
  const edit = W.canEdit(m.myLevel)
  const mine = (past.data?.items ?? []).filter((d) => d.kind === kind)
  const approve = (d: W.Draft) => run(() => W.drafts.approve(m.id, d), past.reload)
  return (
    <>
      <Message severity="warning">{NOTICE} Not finding a source never proves that none exists.</Message>
      {edit && (
        <Section title={label}>
          <Form onSubmit={(e: FormEvent) => { e.preventDefault(); void run(() => (kind === 'research' ? W.drafts.research(m.id, query) : W.drafts.mapping(m.id, query)), () => { setQuery(''); past.reload() }) }}>
            <TextField id={`${kind}-q`} label={label} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} required />
            <Err text={error} />
            <Button type="submit" variant="contained" disabled={busy} sx={{ mt: 1 }}>{busy ? 'Working…' : 'Run'}</Button>
          </Form>
        </Section>
      )}
      <State loading={past.loading} error={past.error} onRetry={past.reload} empty={past.data && mine.length === 0 ? 'No results saved on this matter yet.' : undefined}>
        {mine.map((d) => <DraftCard key={d.id} draft={d} canApprove={edit} busy={busy} onApprove={() => approve(d)} />)}
      </State>
    </>
  )
}

export const LiveResearch = () => <Generate kind="research" title="RAG Research" sub="Source-backed research results, saved on the matter as drafts." label="Research question" placeholder="e.g. bail conditions for economic offences" />
export const LiveMapping = () => <Generate kind="mapping" title="Legal Section Mapping" sub="Map old provisions to new ones. Results are drafts for advocate verification." label="Provision to map" placeholder="e.g. IPC 420" />

// ---------- AI Legal Assistant ----------
export function LiveAssistant() {
  return <Scoped title="AI Legal Assistant" sub="A matter-aware assistant. Each reply is saved on the matter as a draft awaiting approval.">{(m) => <AssistantBody m={m} />}</Scoped>
}

function AssistantBody({ m }: { m: W.Matter }) {
  const list = useLoad(() => W.conversations.list(), [])
  const [conv, setConv] = useState<W.Conversation | null>(null)
  const [text, setText] = useState('')
  const { error, busy, run } = useAction()
  const end = useRef<HTMLDivElement>(null)
  const edit = W.canEdit(m.myLevel)
  const mine = (list.data?.items ?? []).filter((c) => c.matterId === m.id)
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [conv?.messages?.length])

  const open = (id: string) => { if (!id) { setConv(null); return } void run(async () => setConv(await W.conversations.get(id))) }
  const send = (e: FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    void run(async () => {
      const c = conv ?? await W.conversations.create(body.slice(0, 60), m.id)
      setConv(await W.conversations.send(c.id, body)); setText(''); list.reload()
    })
  }
  return (
    <>
      <Message severity="warning">{NOTICE}</Message>
      <Section title="Conversation">
        <SelectField id="conv" label="Conversation" value={conv?.id ?? ''} onChange={(e) => open(e.target.value)}>
          <option value="">New conversation</option>
          {mine.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </SelectField>
        <Stack spacing={1.5} sx={{ my: 2 }} aria-live="polite">
          {(conv?.messages ?? []).map((x) => (
            <Box key={x.position} sx={{ alignSelf: x.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', p: 1.5, borderRadius: 2, bgcolor: x.role === 'user' ? 'action.selected' : 'action.hover' }}>
              <Typography variant="caption" component="strong" sx={{ display: 'block', mb: 0.5 }}>{x.role === 'user' ? 'You' : 'myCourt AI (demonstration)'}</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{x.body}</Typography>
              {x.role === 'assistant' && <Typography variant="caption" color="text.secondary">Saved as a draft on this matter · verify before relying</Typography>}
            </Box>
          ))}
          <div ref={end} />
        </Stack>
        {edit ? (
          <Form onSubmit={send}>
            <TextField id="chat-q" label="Ask about facts, authorities, drafts or next steps" value={text} onChange={(e) => setText(e.target.value)} />
            <Err text={error} />
            <Button type="submit" variant="contained" disabled={busy} sx={{ mt: 1 }}>{busy ? 'Working…' : 'Send'}</Button>
          </Form>
        ) : <Typography color="text.secondary">View-only access: you can read conversations but not add to them.</Typography>}
      </Section>
    </>
  )
}

// ---------- Voice-to-text (browser speech recognition, opt-in) ----------
export function LiveVoice() {
  return <Scoped title="Voice-to-Text & Legal Dictation" sub="Dictate, review and save a transcript on a matter. Say “open calendar” to move around.">{(m) => <VoiceBody m={m} />}</Scoped>
}

function VoiceBody({ m }: { m: W.Matter }) {
  const { go, toast } = useApp()
  const notes = useLoad(() => W.voiceNotes.list(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [lang, setLang] = useState('en-IN')
  const [consent, setConsent] = useState(false)
  const [commands, setCommands] = useState(false)
  const [transcript, setTranscript] = useState('')
  const edit = W.canEdit(m.myLevel)

  const sp = useSpeech(lang, (said) => {
    const page = commands ? commandFor(said) : null
    if (page) { toast(`Opening ${page}`); go(page as PageId) } else if (said) setTranscript((t) => (t ? `${t} ${said}` : said))
  })
  const save = () => run(() => W.voiceNotes.create(m.id, { transcript, language: lang }), () => { setTranscript(''); notes.reload() })

  return (
    <>
      <Message severity="warning">
        Speech recognition here is your browser's own service. In Chrome and Edge the audio is sent to the browser vendor to be transcribed. Use it for demonstration material only,
        never for real client information, and only if you accept that.
      </Message>
      <Section title="Dictation">
        <FormControlLabel control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />} label="I understand my audio is processed by my browser's speech service" />
        <SelectField id="voice-lang" label="Dictation language" value={lang} onChange={(e) => setLang(e.target.value)}>
          {SPEECH_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </SelectField>
        <FormControlLabel control={<Checkbox checked={commands} onChange={(e) => setCommands(e.target.checked)} />} label="Voice commands (“open calendar”, “go to cases”, “show billing”)" />
        {!sp.supported && <Message severity="info">This browser does not offer speech recognition. You can still type or paste a transcript below.</Message>}
        <Stack direction="row" spacing={1} sx={{ my: 1 }}>
          <Button variant="contained" disabled={!sp.supported || !consent || sp.listening} onClick={sp.start}>● Start dictation</Button>
          <Button variant="outlined" disabled={!sp.listening} onClick={sp.stop}>■ Stop</Button>
          {sp.listening && <Status kind="amber">Listening…</Status>}
        </Stack>
        {sp.error && <Message severity="error">{sp.error}</Message>}
        <TextField id="voice-text" label="Transcript (editable, original wording)" multiline minRows={6} value={transcript + (sp.interim ? ` ${sp.interim}` : '')} onChange={(e) => setTranscript(e.target.value)} />
        <Typography variant="caption" color="text.secondary" component="p">Confirm case numbers, names, dates, legal references, negations and amounts before relying on it.</Typography>
        <Err text={error} />
        {edit && <Button variant="contained" disabled={busy || !transcript.trim()} onClick={() => void save()} sx={{ mt: 1 }}>Save as a voice note</Button>}
      </Section>
      <Section title="Saved voice notes">
        <State loading={notes.loading} error={notes.error} onRetry={notes.reload} empty={notes.data && notes.data.items.length === 0 ? 'No voice notes on this matter yet.' : undefined}>
          {notes.data?.items.map((n) => (
            <Row key={n.id}>
              <span style={{ whiteSpace: 'pre-wrap' }}>{n.transcript}</span>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Status kind={n.reviewStatus === 'reviewed' ? 'green' : 'amber'}>{n.reviewStatus === 'reviewed' ? 'Reviewed' : 'Needs review'}</Status>
                {edit && n.reviewStatus !== 'reviewed' && <Button size="small" variant="outlined" onClick={() => void run(() => W.voiceNotes.action(m.id, n, 'review'), notes.reload)}>Mark reviewed</Button>}
              </Stack>
            </Row>
          ))}
        </State>
      </Section>
    </>
  )
}

// ---------- Hearing preparation ----------
const CHECKS = ['Review latest order', 'Confirm issues for determination', 'Verify authorities and treatment', 'Check exhibit / evidence list', 'Prepare questions and submissions', 'Confirm hearing logistics']

export const LiveHearing = () => (
  <Scoped title="Hearing Preparation" sub="Assemble a brief with issues, evidence gaps and authorities. It is saved on the matter as a draft until approved.">{(m) => <HearingBody m={m} />}</Scoped>
)

function HearingBody({ m }: { m: W.Matter }) {
  const cal = useLoad(() => W.calendar.list(m.id), [m.id])
  const drafts = useLoad(() => W.drafts.list(m.id), [m.id])
  const { error, busy, run } = useAction()
  const [done, setDone] = useState<boolean[]>(CHECKS.map(() => false))
  const [issues, setIssues] = useState('')
  const [gaps, setGaps] = useState('')
  const [authorities, setAuthorities] = useState('')
  const edit = W.canEdit(m.myLevel)
  const nextHearing = (cal.data?.items ?? []).filter((e) => e.kind === 'hearing' && new Date(e.startsAt) >= new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
  const briefs = (drafts.data?.items ?? []).filter((d) => d.kind === 'brief')
  const generate = () => run(() => W.drafts.create(m.id, {
    kind: 'brief', title: `Hearing brief${nextHearing ? ` · ${day(nextHearing.startsAt)}` : ''}`,
    body: `Issues for determination\n${issues || '(none entered)'}\n\nEvidence gaps\n${gaps || '(none entered)'}\n\nAuthorities (verify before use)\n${authorities || '(none entered)'}`, sources: [],
  }), () => { setIssues(''); setGaps(''); setAuthorities(''); drafts.reload() })
  return (
    <>
      <Message severity={nextHearing ? 'info' : 'warning'}>{nextHearing ? `Next hearing: ${nextHearing.title}, ${day(nextHearing.startsAt)}.` : 'No upcoming hearing is on this matter\'s calendar. Add one on the Calendar screen.'}</Message>
      <Section title="Preparation checklist">
        {CHECKS.map((c, i) => <div key={c}><FormControlLabel control={<Checkbox checked={done[i]} onChange={(e) => setDone((d) => d.map((v, j) => (j === i ? e.target.checked : v)))} />} label={c} /></div>)}
        <Typography variant="caption" color="text.secondary">{done.filter(Boolean).length} of {CHECKS.length} complete (this checklist is for your own use and is not saved).</Typography>
      </Section>
      {edit && (
        <Section title="Draft hearing brief">
          <TextField id="hb-issues" label="Issues for determination" multiline minRows={3} value={issues} onChange={(e) => setIssues(e.target.value)} />
          <TextField id="hb-gaps" label="Evidence gaps" multiline minRows={3} value={gaps} onChange={(e) => setGaps(e.target.value)} />
          <TextField id="hb-auth" label="Authorities (verify before use)" multiline minRows={3} value={authorities} onChange={(e) => setAuthorities(e.target.value)} />
          <Message severity="warning">Do not use placeholder issues or authorities in court. Replace them with matter-specific, verified material.</Message>
          <Err text={error} />
          <Button variant="contained" disabled={busy || !(issues || gaps || authorities)} onClick={() => void generate()}>Save brief draft</Button>
        </Section>
      )}
      <State loading={drafts.loading} error={drafts.error} onRetry={drafts.reload}>
        {briefs.map((d) => <DraftCard key={d.id} draft={d} canApprove={edit} busy={busy} onApprove={() => void run(() => W.drafts.approve(m.id, d), drafts.reload)} />)}
      </State>
    </>
  )
}

// ---------- Client intake ----------
export function LiveIntake() {
  const l = useLoad(() => W.intake.list(), [])
  const { error, busy, run } = useAction()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [summary, setSummary] = useState('')
  const [note, setNote] = useState<Record<string, string>>({})
  return (
    <>
      <PageHead title="Client Intake & Matter Setup" sub="Record a prospective client, confirm the conflict check and then create the matter." />
      <Message severity="warning">Use demonstration details only. A conflict check can only be cleared by an advocate confirming it; editing the details withdraws a confirmation.</Message>
      <Section title="New intake">
        <Form onSubmit={(e) => { e.preventDefault(); void run(() => W.intake.create(name, contact, summary), () => { setName(''); setContact(''); setSummary(''); l.reload() }) }}>
          <TextField id="in-name" label="Prospective client (full legal name)" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField id="in-contact" label="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />
          <TextField id="in-summary" label="Summary of facts and urgency" multiline minRows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
          <Err text={error} />
          <Button type="submit" variant="contained" disabled={busy} sx={{ mt: 1 }}>Save intake</Button>
        </Form>
      </Section>
      <Section title="Your intake records">
        <State loading={l.loading} error={l.error} onRetry={l.reload} empty={l.data && l.data.items.length === 0 ? 'No intake records yet.' : undefined}>
          {l.data?.items.map((r) => (
            <Box key={r.id} sx={{ py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <strong>{r.prospectName}</strong>
                <Status kind={r.conflictCheck === 'clear' ? 'green' : 'amber'}>{r.conflictCheck === 'clear' ? 'Conflict check clear' : r.conflictCheck === 'needs_review' ? 'Needs review' : 'Not checked'}</Status>
              </Stack>
              <Typography variant="caption" color="text.secondary" component="p">{r.contact || 'No contact'}{r.confirmedAt ? ` · confirmed ${day(r.confirmedAt)}` : ''}</Typography>
              {r.summary && <Typography sx={{ whiteSpace: 'pre-wrap' }}>{r.summary}</Typography>}
              {r.matterId ? <Typography><a href={`#/caseDetail/${r.matterId}`}>Open the matter created from this intake</a></Typography> : (
                <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TextField id={`note-${r.id}`} label="Conflict check note" size="small" sx={{ maxWidth: 320 }} value={note[r.id] ?? ''} onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))} />
                  <Button size="small" variant="outlined" disabled={busy} onClick={() => void run(() => W.intake.confirm(r.id, 'clear', note[r.id] ?? ''), l.reload)}>Confirm clear</Button>
                  <Button size="small" variant="outlined" disabled={busy} onClick={() => void run(() => W.intake.confirm(r.id, 'needs_review', note[r.id] ?? ''), l.reload)}>Needs review</Button>
                  <Button size="small" variant="contained" disabled={busy || r.conflictCheck !== 'clear'} onClick={() => void run(() => W.intake.convert(r.id), l.reload)}>Create matter</Button>
                </Stack>
              )}
            </Box>
          ))}
        </State>
      </Section>
    </>
  )
}

