import { describe, expect, it } from 'vitest'
import { generateCaptcha, verifyCaptcha } from './captcha'
import { createMockAdapter, DEMO_CASES, DEMO_ERROR_CNR } from './mockAdapter'
import { ACTS, CASE_STATES, CASE_TYPES, LOCATIONS, MODES, POLICE_STATIONS } from './referenceData'
import type { CaseQuery, CourtSelection } from './types'
import { normaliseBarCode, normaliseCnr, validateQuery } from './validation'

const now = new Date('2026-10-26')
const chennai: CourtSelection = { state: 'Tamil Nadu', district: 'Chennai', complex: 'Principal Sessions Court Complex', establishment: '' }
const none: CourtSelection = { state: '', district: '', complex: '', establishment: '' }

describe('reference data', () => {
  it('lists 36 states/UTs with the merged Dadra/Daman UT', () => {
    expect(CASE_STATES).toHaveLength(36)
    expect(CASE_STATES).toContain('The Dadra And Nagar Haveli And Daman And Diu')
  })
  it('offers the 7 official search types plus CNR', () => {
    expect(MODES.map((m) => m.id)).toEqual(['cnr', 'party', 'caseNumber', 'filingNumber', 'advocate', 'fir', 'act', 'caseType'])
  })
  it('keeps every demo case inside the demo location tree and lists', () => {
    for (const c of DEMO_CASES) {
      expect(LOCATIONS[c.court.state]?.[c.court.district]?.[c.court.complex]).toContain(c.court.establishment)
      expect(CASE_TYPES).toContain(c.caseType)
      if (c.policeStation) expect(POLICE_STATIONS[c.court.district]).toContain(c.policeStation)
      for (const a of c.acts) expect(ACTS).toContain(a.act)
    }
  })
  it('uses unique 16-character CNRs', () => {
    expect(new Set(DEMO_CASES.map((c) => c.cnr)).size).toBe(DEMO_CASES.length)
    for (const c of DEMO_CASES) expect(c.cnr).toMatch(/^[A-Z0-9]{16}$/)
  })
})

describe('validateQuery', () => {
  it('validates CNR', () => {
    expect(validateQuery({ mode: 'cnr', cnr: '' }, now).cnr).toMatch(/Enter a CNR/)
    expect(validateQuery({ mode: 'cnr', cnr: 'ABC' }, now).cnr).toBeDefined()
    expect(validateQuery({ mode: 'cnr', cnr: 'TNCH019999992025' }, now)).toEqual({})
  })
  it('requires state, district and complex for court-based searches', () => {
    const q: CaseQuery = { mode: 'caseType', court: none, caseType: 'Civil Suit (CS)', year: '2024', status: 'Pending' }
    expect(Object.keys(validateQuery(q, now)).sort()).toEqual(['complex', 'district', 'state'])
  })
  it('party search needs 3 characters and a year', () => {
    const q: CaseQuery = { mode: 'party', court: chennai, name: 'ab', year: '', status: 'Both' }
    expect(Object.keys(validateQuery(q, now)).sort()).toEqual(['name', 'year'])
    expect(validateQuery({ ...q, name: 'abc', year: '2025' }, now)).toEqual({})
  })
  it('case and filing number need type, digits and a valid year', () => {
    for (const mode of ['caseNumber', 'filingNumber'] as const) {
      const bad = validateQuery({ mode, court: chennai, caseType: '', number: 'x', year: '2030' }, now)
      expect(Object.keys(bad).sort()).toEqual(['caseType', 'number', 'year'])
    }
  })
  it('advocate search validates per sub-mode', () => {
    const base = { mode: 'advocate' as const, court: chennai, name: '', barCode: '', date: '', status: 'Both' as const }
    expect(validateQuery({ ...base, by: 'name' }, now).name).toBeDefined()
    expect(validateQuery({ ...base, by: 'barCode', barCode: 'nope' }, now).barCode).toBeDefined()
    expect(validateQuery({ ...base, by: 'barCode', barCode: 'MAH/1234/1982' }, now)).toEqual({})
    expect(validateQuery({ ...base, by: 'caseListDate', name: 'kumar' }, now).date).toBeDefined()
    expect(validateQuery({ ...base, by: 'caseListDate', name: 'kumar', date: '2026-10-28' }, now)).toEqual({})
  })
  it('FIR search needs only a police station; number and year are optional but checked', () => {
    const q: CaseQuery = { mode: 'fir', court: chennai, policeStation: '', number: '', year: '', status: 'Both' }
    expect(Object.keys(validateQuery(q, now))).toEqual(['policeStation'])
    expect(validateQuery({ ...q, policeStation: 'x', number: 'abc', year: '1' }, now)).toMatchObject({ number: expect.any(String), year: expect.any(String) })
  })
  it('act search needs an act type; section is optional', () => {
    const q: CaseQuery = { mode: 'act', court: chennai, actType: '', section: '', status: 'Pending' }
    expect(Object.keys(validateQuery(q, now))).toEqual(['actType'])
    expect(validateQuery({ ...q, actType: 'Indian Penal Code' }, now)).toEqual({})
  })
})

describe('normalisers and captcha', () => {
  it('normalises CNR and bar codes', () => {
    expect(normaliseCnr(' tnch-0199 9999 2025 ')).toBe('TNCH019999992025')
    expect(normaliseBarCode(' mah/1234/1982 ')).toBe('MAH/1234/1982')
  })
  it('generates a code of the requested length without look-alike characters', () => {
    const code = generateCaptcha(() => 0.5, 6)
    expect(code).toHaveLength(6)
    expect(generateCaptcha(Math.random, 200)).not.toMatch(/[01OI]/)
  })
  it('verifies case-insensitively and never accepts an empty code', () => {
    expect(verifyCaptcha('AB12CD', ' ab12cd ')).toBe(true)
    expect(verifyCaptcha('AB12CD', 'AB12CE')).toBe(false)
    expect(verifyCaptcha('', '')).toBe(false)
  })
})

describe('mock adapter', () => {
  const a = createMockAdapter(0)
  const run = (q: CaseQuery) => a.search(q)
  it('is flagged as demo', () => expect(a.isDemo).toBe(true))
  it('CNR: found, empty, and simulated error', async () => {
    expect(await run({ mode: 'cnr', cnr: 'TNCH019999992025' })).toHaveLength(1)
    expect(await run({ mode: 'cnr', cnr: 'TNCH019999990000' })).toEqual([])
    await expect(run({ mode: 'cnr', cnr: DEMO_ERROR_CNR })).rejects.toThrow()
  })
  it('party: matches petitioner or respondent, respects year, status and court', async () => {
    const base = { mode: 'party' as const, court: chennai, name: 'kumar', year: '2025', status: 'Both' as const }
    expect(await run(base)).toHaveLength(1)
    expect(await run({ ...base, year: '2024' })).toHaveLength(0)
    expect(await run({ ...base, status: 'Disposed' })).toHaveLength(0)
    expect(await run({ ...base, court: { ...chennai, complex: 'City Civil Court Complex' } })).toHaveLength(0)
  })
  it('case number and filing number', async () => {
    const court = { ...chennai, complex: 'City Civil Court Complex' }
    expect(await run({ mode: 'caseNumber', court, caseType: 'Civil Suit (CS)', number: '118', year: '2024' })).toHaveLength(1)
    expect(await run({ mode: 'filingNumber', court, caseType: 'Civil Suit (CS)', number: '305', year: '2024' })).toHaveLength(1)
    expect(await run({ mode: 'filingNumber', court, caseType: 'Civil Suit (CS)', number: '118', year: '2024' })).toHaveLength(0)
  })
  it('advocate: by name, bar code and date case list', async () => {
    const mumbai = { state: 'Maharashtra', district: 'Mumbai', complex: 'City Civil and Sessions Court', establishment: '' }
    const base = { mode: 'advocate' as const, court: mumbai, name: '', barCode: '', date: '', status: 'Both' as const }
    expect(await run({ ...base, by: 'name', name: 'desai' })).toHaveLength(1)
    expect(await run({ ...base, by: 'barCode', barCode: 'MAH/0077/2005' })).toHaveLength(1)
    const pune = { state: 'Maharashtra', district: 'Pune', complex: 'District and Sessions Court', establishment: '' }
    expect(await run({ ...base, court: pune, by: 'caseListDate', name: 'kumar', date: '2026-10-28' })).toHaveLength(1)
    expect(await run({ ...base, court: pune, by: 'caseListDate', name: 'kumar', date: '2026-10-29' })).toHaveLength(0)
  })
  it('FIR: police station with optional number and year', async () => {
    const base = { mode: 'fir' as const, court: chennai, policeStation: 'Demo Police Station - Chennai Central', number: '', year: '', status: 'Both' as const }
    expect(await run(base)).toHaveLength(1)
    expect(await run({ ...base, number: '214', year: '2025' })).toHaveLength(1)
    expect(await run({ ...base, number: '999' })).toHaveLength(0)
  })
  it('act: filters by act, optional section and status', async () => {
    const base = { mode: 'act' as const, court: chennai, actType: 'Indian Penal Code', section: '', status: 'Pending' as const }
    expect(await run(base)).toHaveLength(1)
    expect(await run({ ...base, section: '420' })).toHaveLength(1)
    expect(await run({ ...base, section: '302' })).toHaveLength(0)
    expect(await run({ ...base, status: 'Disposed' })).toHaveLength(0)
  })
  it('case type: needs type, year and status', async () => {
    const base = { mode: 'caseType' as const, court: chennai, caseType: 'Criminal Case (CC)', year: '2025', status: 'Pending' as const }
    expect(await run(base)).toHaveLength(1)
    expect(await run({ ...base, status: 'Disposed' })).toHaveLength(0)
  })
  it('narrows by establishment when chosen', async () => {
    const q = { mode: 'caseType' as const, court: { ...chennai, establishment: 'Additional Sessions Court' }, caseType: 'Criminal Case (CC)', year: '2025', status: 'Pending' as const }
    expect(await run(q)).toHaveLength(0)
  })
  it('honours abort', async () => {
    const ctl = new AbortController()
    const p = createMockAdapter(50).search({ mode: 'cnr', cnr: 'TNCH019999992025' }, ctl.signal)
    ctl.abort()
    await expect(p).rejects.toThrow()
  })
})
