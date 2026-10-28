import { describe, expect, it } from 'vitest'
import { LOCATIONS } from '../caseStatus/referenceData'
import { COURT_LOCATIONS, findLocation, validateLocationQuery } from './location'

const sel = { state: 'Tamil Nadu', district: 'Chennai', complex: 'Principal Sessions Court Complex', establishment: '' }

describe('location lookup', () => {
  it('has a fictional location for every demo court complex and establishment', () => {
    for (const [state, districts] of Object.entries(LOCATIONS)) {
      for (const [district, complexes] of Object.entries(districts)) {
        for (const [complex, establishments] of Object.entries(complexes)) {
          expect(findLocation({ state, district, complex, establishment: '' })).not.toBeNull()
          for (const establishment of establishments) expect(findLocation({ state, district, complex, establishment })).not.toBeNull()
        }
      }
    }
  })
  it('finds a complex without an establishment', () => {
    expect(findLocation(sel)?.address).toContain('Principal Sessions Court Complex')
  })
  it('finds the establishment when it is chosen', () => {
    expect(findLocation({ ...sel, establishment: 'Additional Sessions Court' })?.address).toContain('Additional Sessions Court')
  })
  it('returns null for unknown courts', () => {
    expect(findLocation({ ...sel, complex: 'Nowhere' })).toBeNull()
    expect(findLocation({ state: 'Goa', district: 'x', complex: 'y', establishment: '' })).toBeNull()
  })
  it('says every address is fictional', () => {
    for (const l of COURT_LOCATIONS) expect(`${l.address} ${l.note}`.toLowerCase()).toContain('fictional')
  })
})

describe('validateLocationQuery', () => {
  it('requires state, district and complex', () => {
    expect(Object.keys(validateLocationQuery({ state: '', district: '', complex: '', establishment: '' })).sort()).toEqual(['complex', 'district', 'state'])
    expect(validateLocationQuery(sel)).toEqual({})
  })
})
