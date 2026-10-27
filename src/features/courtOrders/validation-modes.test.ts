import { describe, expect, it } from 'vitest'
import { COURT_ROOMS, roomId } from '../causeList/courtRooms'
import type { OrderQuery } from './types'
import { validateOrderQuery } from './validation'

const now = new Date('2026-10-27')
const court = { state: 'Tamil Nadu', district: 'Chennai', complex: 'Principal Sessions Court Complex', establishment: '' }
const sessions12 = COURT_ROOMS.find((r) => r.number === '12')!
const additional15 = COURT_ROOMS.find((r) => r.number === '15')!
const delhi = COURT_ROOMS.find((r) => r.state === 'Delhi')!

describe('validateOrderQuery: court number', () => {
  const base: OrderQuery = { mode: 'courtNumber', court, roomId: roomId(sessions12), filter: 'Both' }
  it('accepts a court inside the chosen complex', () => expect(validateOrderQuery(base, now)).toEqual({}))
  it('requires a court', () => expect(validateOrderQuery({ ...base, roomId: '' }, now).roomId).toBeDefined())
  it('rejects a court from another complex', () => {
    expect(validateOrderQuery({ ...base, roomId: roomId(delhi) }, now).roomId).toMatch(/not in this court complex/)
  })
  it('respects a chosen establishment', () => {
    const narrowed = { ...court, establishment: 'Additional Sessions Court' }
    expect(validateOrderQuery({ ...base, court: narrowed }, now).roomId).toBeDefined()
    expect(validateOrderQuery({ ...base, court: narrowed, roomId: roomId(additional15) }, now)).toEqual({})
  })
})

describe('validateOrderQuery: order date range', () => {
  const base: OrderQuery = { mode: 'orderDate', court, from: '2026-01-01', to: '2026-10-27', filter: 'Both' }
  it('accepts a valid range', () => expect(validateOrderQuery(base, now)).toEqual({}))
  it('accepts a single-day range', () => {
    expect(validateOrderQuery({ ...base, from: '2026-09-02', to: '2026-09-02' }, now)).toEqual({})
  })
  it('requires both dates', () => {
    expect(Object.keys(validateOrderQuery({ ...base, from: '', to: '' }, now)).sort()).toEqual(['from', 'to'])
  })
  it('rejects malformed or impossible dates', () => {
    expect(validateOrderQuery({ ...base, from: '01/01/2026' }, now).from).toBeDefined()
    expect(validateOrderQuery({ ...base, to: '2026-13-45' }, now).to).toBeDefined()
  })
  it('rejects a from-date later than the to-date', () => {
    const bad = validateOrderQuery({ ...base, from: '2026-10-27', to: '2026-01-01' }, now)
    expect(bad.to).toMatch(/earlier than/)
  })
})
