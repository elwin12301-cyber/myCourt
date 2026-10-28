import { useRef, useState } from 'react'
import { useApp } from '../context'
import { Btn, Card, Field, PageHead, Pill, Stat } from '../components/ui'

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
            <table>
              <thead><tr><th>Date</th><th>Matter / activity</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td>23 Oct</td><td><strong>CR/2025/0412</strong><small>Research and case review</small></td><td>1.4 h</td><td><Pill kind="amber">Unbilled</Pill></td></tr>
                <tr><td>22 Oct</td><td><strong>CS/2024/118</strong><small>Draft written submissions</small></td><td>2.0 h</td><td><Pill kind="amber">Unbilled</Pill></td></tr>
                <tr><td>21 Oct</td><td><strong>WP/2026/077</strong><small>Client conference</small></td><td>0.8 h</td><td><Pill kind="green">Invoiced</Pill></td></tr>
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="New time entry">
          <Field label="Matter">
            <select><option>CR/2025/0412 · State v. R. Kumar</option><option>CS/2024/118 · Mehta v. Rao</option></select>
          </Field>
          <Field label="Activity"><input ref={activityRef} placeholder="e.g. review order, legal research" /></Field>
          <div className="grid layout2">
            <Field label="Hours"><input type="number" min="0.1" step="0.1" value={hours} onChange={(e) => setHours(+e.target.value)} /></Field>
            <Field label="Rate (₹)"><input type="number" min="0" value={rate} onChange={(e) => setRate(+e.target.value)} /></Field>
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
