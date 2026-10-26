import { describe, expect, it } from 'vitest'
import { createMockAdapter, DEMO_ERROR_CNR } from './mockAdapter'
import { normaliseCnr, validateQuery } from './validation'

const now = new Date('2026-10-26')

describe('validateQuery', () => {
  it('requires a CNR', () => {
    expect(validateQuery({ mode: 'cnr', cnr: '' }, now).cnr).toMatch(/Enter a CNR/)
  })
  it('rejects wrong length or symbols', () => {
    expect(validateQuery({ mode: 'cnr', cnr: 'ABC' }, now).cnr).toBeDefined()
    expect(validateQuery({ mode: 'cnr', cnr: 'TNCH-1999999-2025!' }, now).cnr).toBeDefined()
  })
  it('accepts a 16 character alphanumeric CNR', () => {
    expect(validateQuery({ mode: 'cnr', cnr: 'TNCH019999992025' }, now)).toEqual({})
  })
  it('validates case number fields', () => {
    const e = validateQuery({ mode: 'caseNumber', state: '', district: '', court: '', caseType: '', number: 'x', year: '1800' }, now)
    expect(Object.keys(e).sort()).toEqual(['caseType', 'court', 'district', 'number', 'state', 'year'])
  })
  it('rejects future years', () => {
    const q = { mode: 'caseNumber' as const, state: 'a', district: 'b', court: 'c', caseType: 'd', number: '1', year: '2030' }
    expect(validateQuery(q, now).year).toBeDefined()
  })
  it('requires a minimum party name length', () => {
    const q = { mode: 'party' as const, state: 'a', district: 'b', court: 'c', name: 'ab', year: '', status: 'Both' as const }
    expect(validateQuery(q, now).name).toBeDefined()
    expect(validateQuery({ ...q, name: 'abc' }, now)).toEqual({})
  })
})

describe('normaliseCnr', () => {
  it('strips spaces and hyphens and upper-cases', () => {
    expect(normaliseCnr(' tnch-0199 9999 2025 ')).toBe('TNCH019999992025')
  })
})

describe('mock adapter', () => {
  const a = createMockAdapter(0)
  it('is flagged as demo', () => expect(a.isDemo).toBe(true))
  it('finds a case by CNR', async () => {
    expect(await a.search({ mode: 'cnr', cnr: 'TNCH019999992025' })).toHaveLength(1)
  })
  it('returns an empty list for an unknown CNR', async () => {
    expect(await a.search({ mode: 'cnr', cnr: 'TNCH019999990000' })).toEqual([])
  })
  it('simulates a service error', async () => {
    await expect(a.search({ mode: 'cnr', cnr: DEMO_ERROR_CNR })).rejects.toThrow()
  })
  it('finds by case number in the right court only', async () => {
    const base = { mode: 'caseNumber' as const, state: 'Tamil Nadu', district: 'Chennai', caseType: 'Civil Suit (CS)', number: '118', year: '2024' }
    expect(await a.search({ ...base, court: 'City Civil Court Complex' })).toHaveLength(1)
    expect(await a.search({ ...base, court: 'Principal Sessions Court Complex' })).toHaveLength(0)
  })
  it('filters party search by status', async () => {
    const base = { mode: 'party' as const, state: 'Maharashtra', district: 'Mumbai', court: 'City Civil and Sessions Court', name: 'aruna', year: '' }
    expect(await a.search({ ...base, status: 'Disposed' })).toHaveLength(1)
    expect(await a.search({ ...base, status: 'Pending' })).toHaveLength(0)
  })
  it('honours abort', async () => {
    const ctl = new AbortController()
    const slow = createMockAdapter(50)
    const p = slow.search({ mode: 'cnr', cnr: 'TNCH019999992025' }, ctl.signal)
    ctl.abort()
    await expect(p).rejects.toThrow()
  })
})
