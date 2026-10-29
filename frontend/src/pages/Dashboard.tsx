import { useApp } from '../context'
import { Banner, Btn, Card, PageHead, Pill, Quick, Row, Stat } from '../components/ui'
import { useEffect, useState } from 'react'
import { apiEnabled } from '../api/client'
import { Message, Section } from '../components/blocks'
import * as W from '../api/workspace'
import { newMatterModal } from './modals'
import { Box, Card as KitCard, CardContent, Typography } from '../components/kit'

function LiveSummary() {
  const [d, setD] = useState<W.DashboardData | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => { W.dashboard().then(setD).catch(() => setFailed(true)) }, [])
  if (failed) return <Message severity="error">Your workspace summary could not be loaded.</Message>
  if (!d) return <Typography role="status" color="text.secondary">Loading your workspace…</Typography>
  const tiles: [string, number, string][] = [
    ['Matters', d.matters, 'You can open'], ['Open tasks', d.openTasks, 'Across your matters'],
    ['Drafts to approve', d.draftsAwaitingApproval, 'Advocate review needed'], ['Unapproved deadlines', d.unapprovedDeadlines, 'Confirm each date'],
  ]
  return (
    <Section title="Your workspace (saved on the server)">
      <Box style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {tiles.map(([label, n, hint]) => (
          <KitCard key={label}><CardContent>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="h4" component="p" style={{ fontWeight: 700 }}>{n}</Typography>
            <Typography variant="caption" color="text.secondary">{hint}</Typography>
          </CardContent></KitCard>
        ))}
      </Box>
      {d.nextDates.length > 0 && (
        <Box component="ul" style={{ listStyle: 'none', padding: 0, margin: 0, marginTop: 12 }}>
          {d.nextDates.map((e) => <li key={e.id}><strong>{e.title}</strong> <Typography variant="caption" color="text.secondary">{e.kind} · {new Date(e.startsAt).toLocaleString('en-IN')}</Typography></li>)}
        </Box>
      )}
    </Section>
  )
}

export default function Dashboard() {
  const app = useApp()
  return (
    <>
      {apiEnabled() && <LiveSummary />}
      <PageHead title="Good morning, Advocate Kumar" sub="Here is your practice at a glance. Your next action is always one click away.">
        <Btn kind="primary" onClick={() => newMatterModal(app)}>+ New matter</Btn>
      </PageHead>
      <div className="grid stats">
        <Stat label="Active matters" num="48" desc="↑ 6 this month" ico="▣" />
        <Stat label="Upcoming hearings" num="7" desc="3 require preparation" ico="⚖" />
        <Stat label="Tasks due" num="12" desc="4 due today" ico="✓" />
        <Stat label="Research notes" num="26" desc="Across 11 matters" ico="⌕" />
      </div>
      <Banner eyebrow="YOUR AI LEGAL WORKSPACE" title="Move from case facts to a reviewed next step." text="Ask matter-aware questions, retrieve evidence-linked authorities, dictate notes, and prepare hearings without losing source provenance.">
        <Btn kind="primary" to="assistant">Open AI assistant</Btn>
      </Banner>
      <div className="grid layout2">
        <Card title="Quick actions">
          <div className="quickgrid">
            <Quick ico="✦" title="Ask AI assistant" sub="Grounded in matter context" to="assistant" />
            <Quick ico="⚑" title="Check case status" sub="CNR, case number, party" to="caseStatus" />
            <Quick ico="⌕" title="Research with RAG" sub="Search cited sources" to="research" />
            <Quick ico="◉" title="Dictate a note" sub="Transcribe and structure" to="voice" />
            <Quick ico="▤" title="Upload documents" sub="OCR and extract facts" to="documents" />
            <Quick ico="⇄" title="Map legal sections" sub="Verify old and new law" to="mapping" />
            <Quick ico="⚖" title="Prepare a hearing" sub="Brief, issues and checklist" to="hearing" />
          </div>
        </Card>
        <Card title="Upcoming deadlines">
          <div className="list">
            <Row title="Obtain certified copy" sub="Criminal · CR/2025/0412" right={<Pill kind="amber">Today</Pill>} />
            <Row title="State v. R. Kumar — hearing" sub="Madras High Court · 28 Oct" right={<Pill kind="blue">5 days</Pill>} />
            <Row title="Review written submissions" sub="Civil · CS/2024/118" right={<Pill>30 Oct</Pill>} />
          </div>
          <div style={{ marginTop: 12 }}><Btn kind="soft" to="calendar">Open calendar</Btn></div>
        </Card>
      </div>
      <div className="grid layout2" style={{ marginTop: 18 }}>
        <Card title="Recent matters">
          <div className="list">
            <Row title={<><span className="caseid">CR/2025/0412</span> State v. R. Kumar</>} sub="Criminal · Chennai · Updated 18 min ago" right={<Pill kind="green">Active</Pill>} />
            <Row title={<><span className="caseid">CS/2024/118</span> Mehta v. Rao</>} sub="Civil · Chennai · Updated yesterday" right={<Pill kind="blue">Drafting</Pill>} />
            <Row title={<><span className="caseid">WP/2026/077</span> Aruna Foundation v. State</>} sub="Writ · Madras High Court" right={<Pill kind="amber">Review</Pill>} />
          </div>
          <div style={{ marginTop: 12 }}><Btn to="cases">View all cases</Btn></div>
        </Card>
        <Card title="Practice health">
          <div className="list">
            <Row title="Documents awaiting review" sub="3 items" right={<Pill kind="amber">Review</Pill>} />
            <Row title="AI drafts awaiting approval" sub="2 drafts" right={<Pill kind="blue">Pending</Pill>} />
            <Row title="Follow-up confirmations" sub="1 reminder" right={<Pill>Open</Pill>} />
          </div>
        </Card>
      </div>
    </>
  )
}
