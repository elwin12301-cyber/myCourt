import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTER } from './modes'
import type { OrderQuery } from './types'
import { validateOrderQuery } from './validation'

const now = new Date('2026-10-27')
const court = { state: 'Tamil Nadu', district: 'Chennai', complex: 'Principal Sessions Court Complex', establishment: '' }
const none = { state: '', district: '', complex: '', establishment: '' }

describe('validateOrderQuery: party name', () => {
  const base: OrderQuery = { mode: 'party', court, name: 'kumar', year: '2025', filter: 'Both' }
  it('accepts a complete query', () => expect(validateOrderQuery(base, now)).toEqual({}))
  it('needs at least 3 characters and a year', () => {
    const bad = validateOrderQuery({ ...base, name: 'ab', year: '' }, now)
    expect(Object.keys(bad).sort()).toEqual(['name', 'year'])
  })
  it('ignores surrounding blanks when counting characters', () => {
    expect(validateOrderQuery({ ...base, name: ' ab ' }, now).name).toBeDefined()
  })
  it('rejects a future year and a non-numeric year', () => {
    expect(validateOrderQuery({ ...base, year: '2030' }, now).year).toBeDefined()
    expect(validateOrderQuery({ ...base, year: '20x5' }, now).year).toBeDefined()
  })
})

describe('validateOrderQuery: case number', () => {
  const base: OrderQuery = { mode: 'caseNumber', court, caseType: 'Civil Suit (CS)', number: '118', year: '2024', filter: 'Both' }
  it('accepts a complete query', () => expect(validateOrderQuery(base, now)).toEqual({}))
  it('needs a case type, 1-7 digits and a year', () => {
    const bad = validateOrderQuery({ ...base, caseType: '', number: 'x', year: '2030' }, now)
    expect(Object.keys(bad).sort()).toEqual(['caseType', 'number', 'year'])
    expect(validateOrderQuery({ ...base, number: '12345678' }, now).number).toBeDefined()
  })
})

describe('court selection and defaults', () => {
  it('requires state, district and complex but not establishment', () => {
    const q: OrderQuery = { mode: 'party', court: none, name: 'kumar', year: '2025', filter: 'Both' }
    expect(Object.keys(validateOrderQuery(q, now)).sort()).toEqual(['complex', 'district', 'state'])
    expect(validateOrderQuery({ ...q, court }, now)).toEqual({})
  })
  it('defaults the order type to Both', () => expect(DEFAULT_FILTER).toBe('Both'))
})
