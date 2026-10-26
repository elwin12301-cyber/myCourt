import { useState } from 'react'
import { Banner, Btn, Card, Check, Field, Notice, PageHead } from '../components/ui'

export default function MappingPage() {
  const [oldLaw, setOldLaw] = useState('IPC — Indian Penal Code, 1860')
  const [oldSection, setOldSection] = useState('IPC Section 420')
  const [newLaw, setNewLaw] = useState('BNS — Bharatiya Nyaya Sanhita, 2023')
  const [newSection, setNewSection] = useState('Potential BNS correspondence')
  const [facts, setFacts] = useState('')
  const [compared, setCompared] = useState<{ oldLaw: string; oldSection: string; newLaw: string; newSection: string } | null>(null)

  return (
    <>
      <PageHead title="Legal Section Mapping" sub="Compare legal references carefully across old and new enactments. Treat mappings as verification candidates.">
        <Btn kind="soft" onClick={() => window.alert('Mapping note export is simulated')}>Export mapping note</Btn>
      </PageHead>
      <Banner eyebrow="VERIFICATION WORKFLOW" title="Do not assume a section number is a one-to-one replacement." text="Check exact wording, scope, commencement, amendments, transitional provisions and facts before choosing the applicable provision.">
        <Btn to="caseDetail">Open matter</Btn>
      </Banner>
      <div className="card">
        <div className="grid layout2">
          <Field label="Old Act / section">
            <select value={oldLaw} onChange={(e) => setOldLaw(e.target.value)}>
              <option>IPC — Indian Penal Code, 1860</option>
              <option>CrPC — Code of Criminal Procedure, 1973</option>
              <option>Indian Evidence Act, 1872</option>
            </select>
            <input value={oldSection} onChange={(e) => setOldSection(e.target.value)} placeholder="Enter section / reference" />
          </Field>
          <Field label="New Act / section candidate">
            <select value={newLaw} onChange={(e) => setNewLaw(e.target.value)}>
              <option>BNS — Bharatiya Nyaya Sanhita, 2023</option>
              <option>BNSS — Bharatiya Nagarik Suraksha Sanhita, 2023</option>
              <option>BSA — Bharatiya Sakshya Adhiniyam, 2023</option>
            </select>
            <input value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="Candidate reference" />
          </Field>
        </div>
        <Field label="Relevant facts / date / procedural context">
          <textarea value={facts} onChange={(e) => setFacts(e.target.value)} placeholder="Describe alleged conduct date, case stage, relevant procedural facts and jurisdiction." />
        </Field>
        <div className="actions">
          <Btn kind="primary" onClick={() => setCompared({ oldLaw, oldSection, newLaw, newSection })}>Compare and flag issues</Btn>
          <Btn kind="soft" to="research">Ask RAG to find sources</Btn>
        </div>
        <div style={{ marginTop: 18 }}>
          {compared ? (
            <>
              <div className="mapping">
                <div className="mapbox"><span className="pill">Selected old reference</span><h3>{compared.oldSection}</h3><p className="muted tiny">{compared.oldLaw}</p></div>
                <div className="arrow">⇄</div>
                <div className="mapbox"><span className="pill amber">Candidate only</span><h3>{compared.newSection}</h3><p className="muted tiny">{compared.newLaw}</p></div>
              </div>
              <Notice><b>Status: Unverified.</b> This demo does not establish equivalence. Check official statutory text, commencement, transition/savings provisions, amendments and case-specific facts; obtain advocate sign-off.</Notice>
            </>
          ) : (
            <div className="empty">Enter the exact provision and context, then compare. This prototype does not certify legal equivalence.</div>
          )}
        </div>
      </div>
      <div className="grid layout3" style={{ marginTop: 18 }}>
        <Card title="Applicability checks">
          <Check title="Commencement date checked" sub="Check the official commencement notification." />
          <Check title="Transitional rules checked" sub="Review savings and pending proceedings." />
        </Card>
        <Card title="Jurisdiction">
          <Check title="Applicable court and state practice" sub="Confirm local rules and procedural context." />
          <Check title="Amendments / current text" sub="Verify official current source." />
        </Card>
        <Card title="Evidence status">
          <Check title="Exact wording compared" sub="Do not rely on number-only matching." />
          <Check title="Advocate sign-off" sub="Record verification before use." />
        </Card>
      </div>
    </>
  )
}
