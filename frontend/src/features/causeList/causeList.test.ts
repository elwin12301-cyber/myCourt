import { describe, expect, it } from 'vitest'
import { DEMO_CASES } from '../caseStatus/mockData'
import { buildCauseList, createMockCauseListAdapter, validateCauseList, type CauseListQuery } from './causeList'
import { COURT_ROOMS, kindOf, roomId, roomKey, roomLabel, roomsFor } from './courtRooms'

const sessions = COURT_ROOMS.find((r) => r.number === '12')!
const chennai = { state: sessions.state, district: sessions.district, complex: sessions.complex, establishment: '' }
const q = (over: Partial<CauseListQuery> = {}): CauseListQuery => ({ court: chennai, roomId: roomId(sessions), date: '2026-10-28', kind: 'Criminal', ...over })

describe('court rooms', () => {
  it('gives every demo case a matching court room', () => {
    for (const c of DEMO_CASES) {
      expect(COURT_ROOMS.some((r) => r.state === c.court.state && r.district === c.court.district && r.complex === c.court.complex && r.establishment === c.court.establishment && roomKey(r) === c.courtNumberAndJudge)).toBe(true)
    }
  })
  it('has unique room ids and labels with number, judge and designation', () => {
    expect(new Set(COURT_ROOMS.map(roomId)).size).toBe(COURT_ROOMS.length)
    expect(roomLabel(sessions)).toBe('12 - Demo Judge A - Principal Sessions Judge')
  })
  it('lists courts for a complex and narrows by establishment', () => {
    expect(roomsFor(chennai)).toHaveLength(2)
    expect(roomsFor({ ...chennai, establishment: 'Additional Sessions Court' })).toHaveLength(1)
    expect(roomsFor({ state: 'Goa', district: 'x', complex: 'y', establishment: '' })).toEqual([])
  })
  it('classifies case types', () => {
    expect(kindOf('Criminal Case (CC)')).toBe('Criminal')
    expect(kindOf('Criminal Appeal (CRL.A)')).toBe('Criminal')
    expect(kindOf('Civil Suit (CS)')).toBe('Civil')
    expect(kindOf('Writ Petition (WP)')).toBe('Civil')
  })
})

describe('validateCauseList', () => {
  it('accepts a complete query', () => expect(validateCauseList(q())).toEqual({}))
  it('requires court selectors, court name and date', () => {
    const bad = validateCauseList({ court: { state: '', district: '', complex: '', establishment: '' }, roomId: '', date: '', kind: 'Civil' })
    expect(Object.keys(bad).sort()).toEqual(['complex', 'date', 'district', 'roomId', 'state'])
  })
  it('rejects a court that is not in the chosen complex', () => {
    const other = COURT_ROOMS.find((r) => r.state === 'Delhi')!
    expect(validateCauseList(q({ roomId: roomId(other) })).roomId).toMatch(/not in this court complex/)
  })
  it('rejects malformed or impossible dates', () => {
    expect(validateCauseList(q({ date: '28/10/2026' })).date).toBeDefined()
    expect(validateCauseList(q({ date: '2026-13-45' })).date).toBeDefined()
  })
})

describe('buildCauseList', () => {
  it('lists the matters for a court, date and kind with serial numbers', () => {
    const r = buildCauseList(q())
    // Ordered by case type, then year, then number: 412/2025 before 98/2026.
    expect(r.entries.map((e) => e.record.caseNumber)).toEqual(['412', '98'])
    expect(r.entries.map((e) => e.serial)).toEqual([1, 2])
  })
  it('separates civil from criminal', () => {
    expect(buildCauseList(q({ kind: 'Civil' })).entries).toHaveLength(0)
    const civil = COURT_ROOMS.find((r) => r.number === '4')!
    const r = buildCauseList(q({ court: { ...chennai, complex: civil.complex }, roomId: roomId(civil), date: '2026-10-30', kind: 'Civil' }))
    expect(r.entries.map((e) => e.record.caseNumber)).toEqual(['77', '118'])
  })
  it('returns an empty list for a date with no hearings', () => {
    expect(buildCauseList(q({ date: '2026-10-29' })).entries).toEqual([])
  })
  it('throws for an unknown court', () => {
    expect(() => buildCauseList(q({ roomId: 'nope' }))).toThrow()
  })
  it('adapter is demo and honours abort', async () => {
    const a = createMockCauseListAdapter(0)
    expect(a.isDemo).toBe(true)
    expect((await a.fetch(q())).entries).toHaveLength(2)
    const ctl = new AbortController()
    const p = createMockCauseListAdapter(50).fetch(q(), ctl.signal)
    ctl.abort()
    await expect(p).rejects.toThrow()
  })
})
