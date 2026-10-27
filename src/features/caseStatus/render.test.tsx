import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppContext } from '../../context'
import type { AppContextValue } from '../../types'
import CaseStatusPage from '../../pages/CaseStatus'
import CaseDetail from '../../pages/caseStatus/Detail'
import Results from '../../pages/caseStatus/Results'
import { DEMO_CASES } from './mockAdapter'
import { MODES } from './referenceData'

const noop = () => {}
const ctx: AppContextValue = {
  go: noop, toast: noop, openModal: noop, tasks: [], setTasks: noop, docs: [], setDocs: noop, messages: [], setMessages: noop,
  transcript: '', setTranscript: noop, researchQuery: '', setResearchQuery: noop, portalQuery: '', setPortalQuery: noop,
}
const wrap = (node: JSX.Element) => renderToString(<AppContext.Provider value={ctx}>{node}</AppContext.Provider>)

describe('Case Status rendering', () => {
  it.each(MODES.map((m) => m.id))('renders the %s search form with a captcha and a Go button', (id) => {
    const html = wrap(<CaseStatusPage initialMode={id} />)
    expect(html).toContain('Demonstration data')
    expect(html).toContain('Enter Captcha')
    expect(html).toContain('>Go<')
    expect(html).toContain('Fields marked with * are required')
  })
  it('shows the court selector for court-based searches but not for CNR', () => {
    expect(wrap(<CaseStatusPage initialMode="cnr" />)).not.toContain('Select Court Complex')
    expect(wrap(<CaseStatusPage initialMode="party" />)).toContain('Select Court Complex')
  })
  it('renders results and every detail section for a demo case', () => {
    expect(wrap(<Results results={DEMO_CASES} title="Search results" onView={noop} />)).toContain('Petitioner versus Respondent')
    const html = wrap(<CaseDetail c={DEMO_CASES[0]} onBack={noop} />)
    for (const s of ['Case details', 'Case status', 'Acts', 'FIR details', 'History', 'IA business', 'Orders']) expect(html).toContain(s)
  })
})
