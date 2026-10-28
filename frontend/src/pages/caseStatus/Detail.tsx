import { Btn, Card, Notice, Pill } from '../../components/ui'
import type { CaseRecord } from '../../features/caseStatus/types'
import { useLang, useT } from '../../i18n/context'
import { fmt } from './Results'

function KV({ k, v }: { k: string; v: string }) {
  const t = useT()
  return <div><div className="muted tiny">{t(k)}</div><strong>{v}</strong></div>
}

export default function CaseDetail({ c, onBack }: { c: CaseRecord; onBack: () => void }) {
  const t = useT()
  const lang = useLang()
  const d = (iso: string | null) => fmt(iso, lang)
  return (
    <Card>
      <div className="cardhead">
        <h3>{`${t(c.caseType)} ${c.caseNumber}/${c.year}`} <Pill kind="blue">Demo</Pill></h3>
        <div className="actions">
          <Btn className="small" onClick={() => window.print()}>Print</Btn>
          <Btn className="small" onClick={onBack}>← Back to results</Btn>
        </div>
      </div>

      <h4>{t('Case details')}</h4>
      <div className="grid layout3" style={{ marginBottom: 16 }}>
        <KV k="CNR number" v={c.cnr} />
        <KV k="Case type" v={t(c.caseType)} />
        <KV k="Filing number" v={`${c.filingNumber}/${c.filingYear}`} />
        <KV k="Filing date" v={d(c.filingDate)} />
        <KV k="Registration number" v={`${c.caseNumber}/${c.year}`} />
        <KV k="Registration date" v={d(c.registrationDate)} />
      </div>

      <h4>{t('Case status')}</h4>
      <div className="grid layout3" style={{ marginBottom: 16 }}>
        <KV k="First hearing date" v={d(c.firstHearing)} />
        <KV k="Next hearing date" v={d(c.nextHearing)} />
        <KV k="Decision date" v={d(c.decisionDate)} />
        <KV k="Case status" v={t(c.status)} />
        <KV k="Stage of case" v={t(c.stage)} />
        <KV k="Court number and judge" v={c.courtNumberAndJudge} />
      </div>
      <p className="tiny muted" style={{ marginTop: -8 }}>{[c.court.establishment, c.court.complex, c.court.district, c.court.state].map((x) => t(x)).join(', ')}</p>

      <div className="grid layout2" style={{ marginBottom: 16 }}>
        <div><h4>{t('Petitioner and advocate')}</h4><p>{c.petitioner}<br /><span className="muted">{`${t('Advocate')}: ${c.petitionerAdvocate.name} · ${c.petitionerAdvocate.barCode}`}</span></p></div>
        <div><h4>{t('Respondent and advocate')}</h4><p>{c.respondent}<br /><span className="muted">{`${t('Advocate')}: ${c.respondentAdvocate.name} · ${c.respondentAdvocate.barCode}`}</span></p></div>
      </div>

      <h4>{t('Acts')}</h4>
      <div className="tablewrap" style={{ marginBottom: 16 }}>
        <table>
          <caption className="sr-only">{t('Acts')}</caption>
          <thead><tr><th scope="col">{t('Under Act(s)')}</th><th scope="col">{t('Under Section(s)')}</th></tr></thead>
          <tbody>{c.acts.map((a) => <tr key={a.act}><td>{t(a.act)}</td><td>{a.sections}</td></tr>)}</tbody>
        </table>
      </div>

      {c.firNumber && (
        <>
          <h4>{t('FIR details')}</h4>
          <div className="grid layout3" style={{ marginBottom: 16 }}>
            <KV k="Police station" v={c.policeStation ?? '—'} />
            <KV k="FIR number" v={c.firNumber} />
            <KV k="Year" v={c.firYear ?? '—'} />
          </div>
        </>
      )}

      <h4>{t('History')}</h4>
      <div className="tablewrap" style={{ marginBottom: 16 }}>
        <table>
          <caption className="sr-only">{t('Case history')}</caption>
          <thead><tr><th scope="col">{t('Judge')}</th><th scope="col">{t('Business on date')}</th><th scope="col">{t('Hearing date')}</th><th scope="col">{t('Purpose of hearing')}</th></tr></thead>
          <tbody>{c.history.map((h, i) => <tr key={i}><td>{h.judge}</td><td>{d(h.businessOn)}</td><td>{d(h.date)}</td><td>{t(h.purpose)}</td></tr>)}</tbody>
        </table>
      </div>

      <h4>{t('IA business')}</h4>
      {c.iaBusiness.length === 0 ? <p className="muted" style={{ marginBottom: 16 }}>{t('No interlocutory applications in the demonstration data.')}</p> : (
        <div className="tablewrap" style={{ marginBottom: 16 }}>
          <table>
            <caption className="sr-only">{t('IA business')}</caption>
            <thead><tr><th scope="col">{t('IA number')}</th><th scope="col">{t('Party')}</th><th scope="col">{t('Date of filing')}</th><th scope="col">{t('Status')}</th></tr></thead>
            <tbody>{c.iaBusiness.map((x) => <tr key={x.ia}><td>{x.ia}</td><td>{t(x.party)}</td><td>{d(x.date)}</td><td>{t(x.status)}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      <h4>{t('Orders')}</h4>
      {c.orders.length === 0 ? <p className="muted">{t('No orders in the demonstration data.')}</p> : (
        <div className="list">
          {c.orders.map((o, i) => (
            <div className="listrow" key={i}>
              <div><strong>{`${t('Order')} ${o.number}: ${t(o.title)}`}</strong><small>{`${t(`${o.kind} order`)} · ${d(o.date)}`}</small></div>
              {o.hasDocument
                ? <button className="btn small">{t('View PDF')}</button>
                : <button className="btn small" disabled title={t('No document exists in demonstration data')}>{t('View PDF unavailable')}</button>}
            </div>
          ))}
        </div>
      )}

      <Notice>{t("Demonstration record. Section names follow the official page's headings (History, IA Business, orders with a PDF viewer), but the official case-history layout was not observed. Always verify case information on the official eCourts service.")}</Notice>
    </Card>
  )
}
