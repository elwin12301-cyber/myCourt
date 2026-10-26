import { useState, type FormEvent } from 'react'
import { useApp } from '../context'
import { Btn, Card, Field, Notice, PageHead, Pill, Row } from '../components/ui'

export default function IntakePage() {
  const { toast } = useApp()
  const [saved, setSaved] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSaved(true)
    toast('Intake draft saved')
  }

  return (
    <>
      <PageHead title="Client Intake & Matter Setup" sub="Capture conflict checks, facts, jurisdiction, documents, engagement terms and missing information.">
        <Btn kind="soft" to="cases">Open cases</Btn>
      </PageHead>
      <div className="grid layout2">
        <Card title="New client / matter intake">
          <form onSubmit={submit}>
            <div className="grid layout2">
              <Field label="Client name"><input required placeholder="Full legal name" /></Field>
              <Field label="Opposing party"><input required placeholder="Name / entity" /></Field>
            </div>
            <Field label="Potential conflict check">
              <select required defaultValue="">
                <option value="">Select status</option>
                <option>Clear — checked by advocate</option>
                <option>Potential conflict — needs review</option>
                <option>Not yet checked</option>
              </select>
            </Field>
            <div className="grid layout2">
              <Field label="Practice area">
                <select><option>Criminal</option><option>Civil</option><option>Writ</option><option>Family</option><option>Commercial</option></select>
              </Field>
              <Field label="Jurisdiction / court"><input placeholder="Court, state, jurisdiction" /></Field>
            </div>
            <Field label="Key facts and important dates"><textarea placeholder="Chronology, dates, notices, orders, known deadlines…" /></Field>
            <Field label="Documents received"><textarea placeholder="List documents supplied and missing documents" /></Field>
            <Field label="Engagement / fee terms status">
              <select><option>Needs discussion</option><option>Drafted for review</option><option>Agreed and documented</option></select>
            </Field>
            <button className="btn primary" type="submit">Save intake draft</button>
          </form>
          {saved && <div className="successnote">Intake draft saved in this prototype session. Conflict check and urgency review still require completion.</div>}
        </Card>
        <Card title="Intake completeness">
          <div className="list">
            <Row title="Client identity and contact" sub="Confirm securely" right={<Pill kind="amber">Pending</Pill>} />
            <Row title="Conflict check" sub="Must be completed before engagement" right={<Pill kind="amber">Required</Pill>} />
            <Row title="Facts and chronology" sub="Capture source and date" right={<Pill>Incomplete</Pill>} />
            <Row title="Limitation / urgency review" sub="Advocate must validate" right={<Pill kind="red">High priority</Pill>} />
            <Row title="Missing documents" sub="Generate request list" right={<Pill>Open</Pill>} />
          </div>
          <Notice>Use access controls and secure storage for client data. Do not place privileged or sensitive client information in an unapproved service.</Notice>
          <Btn to="voice">Dictate intake notes</Btn>
        </Card>
      </div>
    </>
  )
}
