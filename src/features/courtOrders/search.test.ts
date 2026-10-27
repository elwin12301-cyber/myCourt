import { describe, expect, it } from 'vitest'
import { createMockOrderAdapter, runOrderQuery } from './courtOrders'
import type { OrderQuery } from './types'
import { DEMO_CASES } from '../caseStatus/mockData'

const chennai = { state: 'Tamil Nadu', district: 'Chennai', complex: 'Principal Sessions Court Complex', establishment: '' }
const civil = { ...chennai, complex: 'City Civil Court Complex' }
const mumbai = { state: 'Maharashtra', district: 'Mumbai', complex: 'City Civil and Sessions Court', establishment: '' }
const run = (q: OrderQuery) => runOrderQuery(q, DEMO_CASES)

describe('runOrderQuery: party name', () => {
  const base: OrderQuery = { mode: 'party', court: chennai, name: 'kumar', year: '2025', filter: 'Both' }
  it('matches the respondent and lists that case\'s orders', () => {
    const rows = run(base)
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.record.caseNumber === '412')).toBe(true)
  })
  it('matches the petitioner too', () => {
    expect(run({ ...base, name: 'state', year: '2025' }).length).toBeGreaterThan(0)
  })
  it('does not match advocate names', () => {
    expect(run({ mode: 'party', court: civil, name: 'iyer', year: '2024', filter: 'Both' })).toEqual([])
    expect(run({ ...base, name: 'prosecutor' })).toEqual([])
  })
  it('respects the year and the court', () => {
    expect(run({ ...base, year: '2024' })).toEqual([])
    expect(run({ ...base, court: civil })).toEqual([])
  })
})

describe('runOrderQuery: case number', () => {
  it('finds the orders of one case', () => {
    const rows = run({ mode: 'caseNumber', court: civil, caseType: 'Civil Suit (CS)', number: '118', year: '2024', filter: 'Both' })
    expect(rows).toHaveLength(1)
    expect(rows[0].order.number).toBe('1')
  })
  it('returns an empty list, not an error, when nothing matches', () => {
    expect(run({ mode: 'caseNumber', court: civil, caseType: 'Civil Suit (CS)', number: '9999', year: '2024', filter: 'Both' })).toEqual([])
  })
})

describe('order type filter', () => {
  const base = { mode: 'caseNumber' as const, court: mumbai, caseType: 'Criminal Appeal (CRL.A)', number: '77', year: '2022' }
  it('returns both kinds for Both, one kind otherwise', () => {
    expect(run({ ...base, filter: 'Both' })).toHaveLength(2)
    expect(run({ ...base, filter: 'Interim' }).map((r) => r.order.kind)).toEqual(['Interim'])
    expect(run({ ...base, filter: 'Final' }).map((r) => r.order.kind)).toEqual(['Final'])
  })
})

describe('ordering', () => {
  it('lists the newest order first', () => {
    const rows = run({ mode: 'party', court: chennai, name: 'kumar', year: '2025', filter: 'Both' })
    expect(rows.map((r) => r.order.date)).toEqual(['2026-09-02', '2025-08-20'])
    expect(rows.map((r) => r.order.number)).toEqual(['2', '1'])
  })
})

describe('mock adapter', () => {
  it('is flagged as demo and returns results', async () => {
    const a = createMockOrderAdapter(0)
    expect(a.isDemo).toBe(true)
    const rows = await a.search({ mode: 'caseNumber', court: civil, caseType: 'Civil Suit (CS)', number: '118', year: '2024', filter: 'Both' })
    expect(rows).toHaveLength(1)
  })
  it('honours abort', async () => {
    const ctl = new AbortController()
    const p = createMockOrderAdapter(50).search({ mode: 'party', court: chennai, name: 'kumar', year: '2025', filter: 'Both' }, ctl.signal)
    ctl.abort()
    await expect(p).rejects.toThrow()
  })
})
