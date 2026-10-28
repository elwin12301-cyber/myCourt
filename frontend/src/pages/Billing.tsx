import { useRef, useState } from 'react'
import { useApp } from '../context'
import { Btn, Card, Field, PageHead, Pill, Stat, Input, Select, Table, TableBody, TableCell, TableHead, TableRow } from '../components/ui'

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export default function BillingPage() {
  const { toast } = useApp()
  const [hours, setHours] = useState(1)
  const [rate, setRate] = useState(2500)
  const activityRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <PageHead title="Time & Billing" sub="Track time, fees, expenses, invoices and payments with an auditable matter link.">
        <Btn kind="primary" onClick={() => activityRef.current?.focus()}>+ Add time entry</Btn>
      </PageHead>
      <div className="grid stats">
        <Stat label="Unbilled time" num="32.5 h" desc="Across 14 matters" ico="◷" />
        <Stat label="Draft invoices" num="6" desc="Awaiting review" ico="▤" />
        <Stat label="Outstanding" num="₹2.4L" desc="Illustrative demo data" ico="₹" />
        <Stat label="Paid this month" num="₹4.8L" desc="Illustrative demo data" ico="✓" />
      </div>
      <div className="grid layout2">
        <Card title="Time entries">
          <div className="tablewrap">
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Matter / activity</TableCell><TableCell>Time</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                <TableRow><TableCell>23 Oct</TableCell><TableCell><strong>CR/2025/0412</strong><small>Research and case review</small></TableCell><TableCell>1.4 h</TableCell><TableCell><Pill kind="amber">Unbilled</Pill></TableCell></TableRow>
                <TableRow><TableCell>22 Oct</TableCell><TableCell><strong>CS/2024/118</strong><small>Draft written submissions</small></TableCell><TableCell>2.0 h</TableCell><TableCell><Pill kind="amber">Unbilled</Pill></TableCell></TableRow>
                <TableRow><TableCell>21 Oct</TableCell><TableCell><strong>WP/2026/077</strong><small>Client conference</small></TableCell><TableCell>0.8 h</TableCell><TableCell><Pill kind="green">Invoiced</Pill></TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
        <Card title="New time entry">
          <Field label="Matter">
            <Select><option>CR/2025/0412 · State v. R. Kumar</option><option>CS/2024/118 · Mehta v. Rao</option></Select>
          </Field>
          <Field label="Activity"><Input ref={activityRef} placeholder="e.g. review order, legal research" /></Field>
          <div className="grid layout2">
            <Field label="Hours"><Input type="number" min="0.1" step="0.1" value={hours} onChange={(e) => setHours(+e.target.value)} /></Field>
            <Field label="Rate (₹)"><Input type="number" min="0" value={rate} onChange={(e) => setRate(+e.target.value)} /></Field>
          </div>
          <div className="sourcebox" style={{ marginBottom: 14 }}>
            <strong>Estimate: {inr.format(hours * rate)}</strong>
            <p>Demo calculation only; tax and fee terms not included.</p>
          </div>
          <Btn kind="primary" onClick={() => toast('Time entry saved in prototype session')}>Save time entry</Btn>
        </Card>
      </div>
    </>
  )
}
