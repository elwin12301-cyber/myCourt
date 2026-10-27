import { useState } from 'react'
import { Card } from '../../components/ui'
import { useApp } from '../../context'
import { CASE_STATES, LOCATIONS } from '../../features/caseStatus/referenceData'
import { CNR_NOTE } from '../../features/services/data'
import CaseStatusPage from '../CaseStatus'
import { Field } from '../caseStatus/form'

/** The official Home page is the CNR search. It also shows a Select State / Select District / Go row whose purpose the page does not state. */
export default function CnrHome({ onHelp, onBack }: { onHelp: () => void; onBack: () => void }) {
  const { toast } = useApp()
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const districts = Object.keys(LOCATIONS[state] ?? {})

  return (
    <>
      <Card title="Select location">
        <form onSubmit={(e) => { e.preventDefault(); toast(state ? `Location noted (demo): ${state}${district ? ` / ${district}` : ''}` : 'Select a state first') }}>
          <div className="grid layout3" style={{ alignItems: 'end', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
            <Field id="home-state" label="Select State">
              <select id="home-state" value={state} onChange={(e) => { setState(e.target.value); setDistrict('') }}>
                <option value="">Select State</option>
                {CASE_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field id="home-district" label="Select District">
              <select id="home-district" value={district} disabled={!districts.length} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">Select District</option>
                {districts.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <div className="field"><button className="btn" type="submit">Go</button></div>
          </div>
          <p className="tiny muted">The official Home page shows this row but does not say what it does; here it only notes your choice (unverified purpose).</p>
        </form>
      </Card>
      <div style={{ height: 18 }} />
      <CaseStatusPage
        modes={['cnr']}
        title="CNR Number"
        sub="Search a case by its 16-character CNR number to see its current status and history."
        submitLabel="Search"
        hideOtherServices
        onBack={onBack}
        footerNote={(
          <>
            <p className="tiny muted" style={{ marginTop: 12 }}>{CNR_NOTE}</p>
            <p className="tiny"><button type="button" className="svc-link" onClick={onHelp}>Click here to view help video</button></p>
          </>
        )}
      />
    </>
  )
}
