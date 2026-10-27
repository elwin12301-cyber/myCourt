import { Btn, Card, Notice, Pill } from '../../components/ui'
import type { CaseRecord } from '../../features/caseStatus/types'
import { fmt } from './Results'

function KV({ k, v }: { k: string; v: string }) {
  return <div><div className="muted tiny">{k}</div><strong>{v}</strong></div>
}

export default function CaseDetail({ c, onBack }: { c: CaseRecord; onBack: () => void }) {
  return (
    <Card>
      <div className="cardhead">
        <h3>{c.caseType} {c.caseNumber}/{c.year} <Pill kind="blue">Demo</Pill></h3>
        <div className="actions">
          <Btn className="small" onClick={() => window.print()}>Print</Btn>
          <Btn className="small" onClick={onBack}>← Back to results</Btn>
        </div>
      </div>

      <h4>Case details</h4>
      <div className="grid layout3" style={{ marginBottom: 16 }}>
        <KV k="CNR number" v={c.cnr} />
        <KV k="Case type" v={c.caseType} />
        <KV k="Filing number" v={`${c.filingNumber}/${c.filingYear}`} />
        <KV k="Filing date" v={fmt(c.filingDate)} />
        <KV k="Registration number" v={`${c.caseNumber}/${c.year}`} />
        <KV k="Registration date" v={fmt(c.registrationDate)} />
      </div>

      <h4>Case status</h4>
      <div className="grid layout3" style={{ marginBottom: 16 }}>
        <KV k="First hearing date" v={fmt(c.firstHearing)} />
        <KV k="Next hearing date" v={fmt(c.nextHearing)} />
        <KV k="Decision date" v={fmt(c.decisionDate)} />
        <KV k="Case status" v={c.status} />
        <KV k="Stage of case" v={c.stage} />
        <KV k="Court number and judge" v={c.courtNumberAndJudge} />
      </div>
      <p className="tiny muted" style={{ marginTop: -8 }}>{c.court.establishment}, {c.court.complex}, {c.court.district}, {c.court.state}</p>

      <div className="grid layout2" style={{ marginBottom: 16 }}>
        <div><h4>Petitioner and advocate</h4><p>{c.petitioner}<br /><span className="muted">Advocate: {c.petitionerAdvocate.name} · {c.petitionerAdvocate.barCode}</span></p></div>
        <div><h4>Respondent and advocate</h4><p>{c.respondent}<br /><span className="muted">Advocate: {c.respondentAdvocate.name} · {c.respondentAdvocate.barCode}</span></p></div>
      </div>

      <h4>Acts</h4>
      <div className="tablewrap" style={{ marginBottom: 16 }}>
        <table>
          <caption className="sr-only">Acts</caption>
          <thead><tr><th scope="col">Under Act(s)</th><th scope="col">Under Section(s)</th></tr></thead>
          <tbody>{c.acts.map((a) => <tr key={a.act}><td>{a.act}</td><td>{a.sections}</td></tr>)}</tbody>
        </table>
      </div>

      {c.firNumber && (
        <>
          <h4>FIR details</h4>
          <div className="grid layout3" style={{ marginBottom: 16 }}>
            <KV k="Police station" v={c.policeStation ?? '—'} />
            <KV k="FIR number" v={c.firNumber} />
            <KV k="Year" v={c.firYear ?? '—'} />
          </div>
        </>
      )}

      <h4>History</h4>
      <div className="tablewrap" style={{ marginBottom: 16 }}>
        <table>
          <caption className="sr-only">Case history</caption>
          <thead><tr><th scope="col">Judge</th><th scope="col">Business on date</th><th scope="col">Hearing date</th><th scope="col">Purpose of hearing</th></tr></thead>
          <tbody>{c.history.map((h, i) => <tr key={i}><td>{h.judge}</td><td>{fmt(h.businessOn)}</td><td>{fmt(h.date)}</td><td>{h.purpose}</td></tr>)}</tbody>
        </table>
      </div>

      <h4>IA business</h4>
      {c.iaBusiness.length === 0 ? <p className="muted" style={{ marginBottom: 16 }}>No interlocutory applications in the demonstration data.</p> : (
        <div className="tablewrap" style={{ marginBottom: 16 }}>
          <table>
            <caption className="sr-only">IA business</caption>
            <thead><tr><th scope="col">IA number</th><th scope="col">Party</th><th scope="col">Date of filing</th><th scope="col">Status</th></tr></thead>
            <tbody>{c.iaBusiness.map((x) => <tr key={x.ia}><td>{x.ia}</td><td>{x.party}</td><td>{fmt(x.date)}</td><td>{x.status}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      <h4>Orders</h4>
      {c.orders.length === 0 ? <p className="muted">No orders in the demonstration data.</p> : (
        <div className="list">
          {c.orders.map((o, i) => (
            <div className="listrow" key={i}>
              <div><strong>Order {o.number}: {o.title}</strong><small>{o.kind} order · {fmt(o.date)}</small></div>
              {o.hasDocument
                ? <button className="btn small">View PDF</button>
                : <button className="btn small" disabled title="No document exists in demonstration data">View PDF unavailable</button>}
            </div>
          ))}
        </div>
      )}

      <Notice>Demonstration record. Section names follow the official page&apos;s headings (History, IA Business, orders with a PDF viewer), but the official case-history layout was not observed. Always verify case information on the official eCourts service.</Notice>
    </Card>
  )
}
