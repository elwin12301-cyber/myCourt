import { describe, expect, it } from 'vitest'
import { ACTS, CASE_STATES, CASE_TYPES, LOCATIONS, MODES, POLICE_STATIONS } from '../features/caseStatus/referenceData'
import { DEMO_CASES } from '../features/caseStatus/mockData'
import { validateQuery } from '../features/caseStatus/validation'
import type { CaseQuery } from '../features/caseStatus/types'
import { COURT_ROOMS } from '../features/causeList/courtRooms'
import { validateCauseList } from '../features/causeList/causeList'
import { validateOrderQuery } from '../features/courtOrders/validation'
import { DEMO_CAVEATS, validateCaveatQuery } from '../features/services/caveat'
import { COURT_LOCATIONS } from '../features/services/location'
import { DEMO_PROCESSES, validateProcessQuery } from '../features/services/process'
import { DICTIONARY } from './index'
import { missed, resetMissed, translate, TRANSLATED } from './core'

const empty = { state: '', district: '', complex: '', establishment: '' }

/** Texts that only appear after a search, a validation error or a mode change, so page rendering at rest never reaches them. */
function dataTexts(): string[] {
  const out: string[] = []
  const add = (...s: (string | null | undefined)[]) => s.forEach((x) => { if (x) out.push(x) })

  add(...CASE_STATES, ...CASE_TYPES, ...ACTS, ...Object.values(POLICE_STATIONS).flat())
  for (const [state, ds] of Object.entries(LOCATIONS)) {
    add(state)
    for (const [d, cs] of Object.entries(ds)) { add(d); for (const [c, es] of Object.entries(cs)) add(c, ...es) }
  }
  for (const m of MODES) add(m.label, m.heading, m.help)
  for (const r of COURT_ROOMS) add(r.designation, r.period)

  for (const c of DEMO_CASES) {
    add(c.caseType, c.stage, c.status, ...c.acts.map((a) => a.act))
    c.history.forEach((h) => add(h.businessOn, h.purpose))
    c.orders.forEach((o) => add(o.title, o.kind))
    c.iaBusiness.forEach((i) => add(i.status))
  }

  const queries: CaseQuery[] = [
    { mode: 'cnr', cnr: '' }, { mode: 'cnr', cnr: 'bad' },
    { mode: 'party', court: empty, name: '', year: '', status: 'Both' },
    { mode: 'caseNumber', court: empty, caseType: '', number: '', year: '' },
    { mode: 'filingNumber', court: empty, caseType: '', number: '', year: '' },
    { mode: 'advocate', court: empty, by: 'name', name: '', barCode: '', date: '' },
    { mode: 'advocate', court: empty, by: 'barCode', name: '', barCode: 'x', date: '' },
    { mode: 'advocate', court: empty, by: 'caseListDate', name: '', barCode: '', date: '' },
    { mode: 'fir', court: empty, policeStation: '', number: 'x', year: 'x', status: 'Both' },
    { mode: 'act', court: empty, actType: '', section: '', status: 'Both' },
    { mode: 'caseType', court: empty, caseType: '', year: '', status: 'Pending' },
  ] as unknown as CaseQuery[]
  for (const q of queries) add(...Object.values(validateQuery(q)))

  add(...Object.values(validateCauseList({ court: empty, roomId: '', date: '', kind: 'Civil' })))
  add(...Object.values(validateCauseList({ court: { ...COURT_ROOMS[0] }, roomId: 'nope', date: '', kind: 'Civil' })))
  for (const mode of ['party', 'caseNumber', 'courtNumber', 'orderDate'] as const) {
    add(...Object.values(validateOrderQuery({ mode, court: empty, name: '', year: '', caseType: '', number: '', roomId: 'x', from: 'x', to: 'y', kind: 'Interim' } as never)))
  }
  add(...Object.values(validateOrderQuery({ mode: 'orderDate', court: empty, from: '2026-02-01', to: '2026-01-01', kind: 'Interim' } as never)))

  for (const mode of ['name', 'caseNumber', 'filingNumber', 'caveatNumber'] as const) {
    add(...Object.values(validateCaveatQuery({ mode, court: empty, name: '', caseType: '', number: '', year: '', caveatNumber: '', decisionDate: 'x', subordinateCourt: '' } as never)))
  }
  add(...Object.values(validateProcessQuery({ processId: '', email: '' })), ...Object.values(validateProcessQuery({ processId: '!', email: 'x' })))

  for (const c of DEMO_CAVEATS) add(c.caseType, c.subordinateCourt, c.status)
  for (const p of DEMO_PROCESSES) add(p.caseRef, p.type, p.status, p.court)
  add(COURT_LOCATIONS[0].note)
  return [...new Set(out)]
}

describe('texts that appear after a search or an error are translated', () => {
  for (const code of TRANSLATED) {
    it(`${code}: no data text or validation message is missing`, () => {
      resetMissed()
      for (const text of dataTexts()) translate(DICTIONARY, code, text)
      expect([...missed]).toEqual([])
    })
  }
})
