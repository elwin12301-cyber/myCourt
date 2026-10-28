import { describe, expect, it } from 'vitest'
import { createMockCaveatAdapter, DEMO_CAVEATS, runCaveatQuery, validateCaveatQuery, type CaveatQuery } from './caveat'

const now = new Date('2026-10-27')
const chennai = { state: 'Tamil Nadu', district: 'Chennai', complex: 'Principal Sessions Court Complex', establishment: '' }
const civil = { ...chennai, complex: 'City Civil Court Complex' }
const none = { state: '', district: '', complex: '', establishment: '' }
const run = (q: CaveatQuery) => runCaveatQuery(q, DEMO_CAVEATS)

describe('validateCaveatQuery', () => {
  it('requires state, district and complex for every search', () => {
    const q: CaveatQuery = { mode: 'caveatNumber', court: none, caveatNumber: '12', year: '2025' }
    expect(Object.keys(validateCaveatQuery(q, now)).sort()).toEqual(['complex', 'district', 'state'])
  })
  it('name search needs 3 characters', () => {
    const q: CaveatQuery = { mode: 'name', court: chennai, role: 'caveator', match: 'anywhere', name: 'ab' }
    expect(validateCaveatQuery(q, now).name).toBeDefined()
    expect(validateCaveatQuery({ ...q, name: 'abc' }, now)).toEqual({})
  })
  it('case number search needs type, digits and year; decision date optional but checked', () => {
    const base: CaveatQuery = { mode: 'caseNumber', court: chennai, subordinateCourt: '', caseType: 'Criminal Case (CC)', number: '77', year: '2024', decisionDate: '' }
    expect(validateCaveatQuery(base, now)).toEqual({})
    expect(Object.keys(validateCaveatQuery({ ...base, caseType: '', number: 'x', year: '2030' }, now)).sort()).toEqual(['caseType', 'number', 'year'])
    expect(validateCaveatQuery({ ...base, decisionDate: '2026-13-40' }, now).decisionDate).toBeDefined()
    expect(validateCaveatQuery({ ...base, decisionDate: '2025-02-10' }, now)).toEqual({})
  })
  it('filing number search needs type, digits and year', () => {
    const q: CaveatQuery = { mode: 'filingNumber', court: chennai, subordinateCourt: '', caseType: '', number: '', year: '' }
    expect(Object.keys(validateCaveatQuery(q, now)).sort()).toEqual(['caseType', 'number', 'year'])
  })
  it('caveat number search needs digits and a year', () => {
    const q: CaveatQuery = { mode: 'caveatNumber', court: chennai, caveatNumber: 'a', year: '' }
    expect(Object.keys(validateCaveatQuery(q, now)).sort()).toEqual(['caveatNumber', 'year'])
  })
})

describe('runCaveatQuery', () => {
  it('matches a name anywhere or only at the start', () => {
    const base = { mode: 'name' as const, court: chennai, role: 'caveator' as const, name: 'kumar' }
    // In this court: "Kumar Brothers" (starts with) and "S. Kumar" (contains).
    expect(run({ ...base, match: 'anywhere' }).map((c) => c.caveatNumber).sort()).toEqual(['19', '21'])
    const starting = run({ ...base, match: 'startingWith' })
    expect(starting.map((c) => c.caveatNumber)).toEqual(['19'])
    expect(starting.every((c) => c.caveator.toLowerCase().startsWith('kumar'))).toBe(true)
  })
  it('anywhere finds a name that starting-with misses', () => {
    const base = { mode: 'name' as const, court: chennai, role: 'caveator' as const, name: 'venkat' }
    expect(run({ ...base, match: 'anywhere' })).toHaveLength(1)
    expect(run({ ...base, match: 'startingWith' })).toHaveLength(0)
  })
  it('searches the caveatee when asked', () => {
    expect(run({ mode: 'name', court: chennai, role: 'caveatee', match: 'anywhere', name: 'sundar' })).toHaveLength(1)
    expect(run({ mode: 'name', court: chennai, role: 'caveator', match: 'anywhere', name: 'sundar' })).toHaveLength(0)
  })
  it('finds by case number, with optional subordinate court and decision date', () => {
    const base = { mode: 'caseNumber' as const, court: chennai, caseType: 'Criminal Case (CC)', number: '77', year: '2024' }
    expect(run({ ...base, subordinateCourt: '', decisionDate: '' })).toHaveLength(1)
    expect(run({ ...base, subordinateCourt: 'Nowhere Court', decisionDate: '' })).toHaveLength(0)
    expect(run({ ...base, subordinateCourt: '', decisionDate: '2025-02-10' })).toHaveLength(1)
    expect(run({ ...base, subordinateCourt: '', decisionDate: '2025-02-11' })).toHaveLength(0)
  })
  it('finds by filing number', () => {
    expect(run({ mode: 'filingNumber', court: chennai, subordinateCourt: '', caseType: 'Criminal Case (CC)', number: '190', year: '2024' })).toHaveLength(1)
  })
  it('finds by part of the caveat number and the year', () => {
    expect(run({ mode: 'caveatNumber', court: chennai, caveatNumber: '1', year: '2025' }).map((c) => c.caveatNumber).sort()).toEqual(['12', '19', '21'])
    expect(run({ mode: 'caveatNumber', court: chennai, caveatNumber: '12', year: '2025' })).toHaveLength(1)
    expect(run({ mode: 'caveatNumber', court: chennai, caveatNumber: '12', year: '2024' })).toHaveLength(0)
  })
  it('shows only active caveats, as the official help says', () => {
    expect(DEMO_CAVEATS.some((c) => c.status === 'Expired')).toBe(true)
    const mumbai = { state: 'Maharashtra', district: 'Mumbai', complex: 'City Civil and Sessions Court', establishment: '' }
    expect(run({ mode: 'caveatNumber', court: mumbai, caveatNumber: '45', year: '2024' })).toEqual([])
  })
  it('stays inside the chosen court', () => {
    expect(run({ mode: 'caveatNumber', court: civil, caveatNumber: '12', year: '2025' })).toEqual([])
  })
})

describe('mock caveat adapter', () => {
  it('is flagged as demo, returns results and honours abort', async () => {
    const a = createMockCaveatAdapter(0)
    expect(a.isDemo).toBe(true)
    expect(await a.search({ mode: 'caveatNumber', court: chennai, caveatNumber: '12', year: '2025' })).toHaveLength(1)
    const ctl = new AbortController()
    const p = createMockCaveatAdapter(50).search({ mode: 'caveatNumber', court: chennai, caveatNumber: '12', year: '2025' }, ctl.signal)
    ctl.abort()
    await expect(p).rejects.toThrow()
  })
  it('uses only fictional names', () => {
    for (const c of DEMO_CAVEATS) expect(`${c.caveator}${c.caveatee}`).toMatch(/\(demo\)/)
  })
})
