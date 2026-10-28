import { describe, expect, it } from 'vitest'
import { DEMO_CASES } from '../caseStatus/mockData'
import { COURT_ROOMS, roomId } from '../causeList/courtRooms'
import { runOrderQuery } from './courtOrders'
import type { OrderQuery } from './types'

const chennai = { state: 'Tamil Nadu', district: 'Chennai', complex: 'Principal Sessions Court Complex', establishment: '' }
const run = (q: OrderQuery) => runOrderQuery(q, DEMO_CASES)
const room = (n: string) => COURT_ROOMS.find((r) => r.number === n)!

describe('runOrderQuery: court number', () => {
  it('lists orders of cases heard in that court', () => {
    const rows = run({ mode: 'courtNumber', court: chennai, roomId: roomId(room('12')), filter: 'Both' })
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.record.courtNumberAndJudge === '12 - Demo Judge A')).toBe(true)
  })
  it('returns nothing for a court with no orders', () => {
    expect(run({ mode: 'courtNumber', court: { ...chennai }, roomId: roomId(room('15')), filter: 'Both' })).toEqual([])
  })
  it('applies the order type filter', () => {
    expect(run({ mode: 'courtNumber', court: chennai, roomId: roomId(room('12')), filter: 'Final' })).toEqual([])
    expect(run({ mode: 'courtNumber', court: chennai, roomId: roomId(room('12')), filter: 'Interim' })).toHaveLength(2)
  })
  it('does not leak orders from a same-numbered court elsewhere', () => {
    const mumbai = { state: 'Maharashtra', district: 'Mumbai', complex: 'City Civil and Sessions Court', establishment: '' }
    const rows = run({ mode: 'courtNumber', court: mumbai, roomId: roomId(room('7')), filter: 'Both' })
    expect(rows.every((r) => r.record.court.district === 'Mumbai')).toBe(true)
  })
})

describe('runOrderQuery: order date range', () => {
  const base = { mode: 'orderDate' as const, court: chennai, filter: 'Both' as const }
  it('includes both ends of the range', () => {
    expect(run({ ...base, from: '2025-08-20', to: '2026-09-02' }).map((r) => r.order.date)).toEqual(['2026-09-02', '2025-08-20'])
  })
  it('supports a single-day range', () => {
    expect(run({ ...base, from: '2025-08-20', to: '2025-08-20' })).toHaveLength(1)
  })
  it('returns an empty list for a range with no orders', () => {
    expect(run({ ...base, from: '2020-01-01', to: '2020-12-31' })).toEqual([])
  })
  it('stays inside the chosen court complex', () => {
    const rows = run({ ...base, from: '2000-01-01', to: '2030-01-01' })
    expect(rows.every((r) => r.record.court.complex === chennai.complex)).toBe(true)
  })
})
