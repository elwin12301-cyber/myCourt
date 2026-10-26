import { describe, expect, it } from 'vitest'
import { hashForPage, pageFromHash } from '../router'
import { monthGrid, toIso } from './calendar'

describe('router', () => {
  it('parses known pages', () => expect(pageFromHash('#/caseStatus')).toBe('caseStatus'))
  it('falls back to dashboard', () => {
    expect(pageFromHash('')).toBe('dashboard')
    expect(pageFromHash('#/nope')).toBe('dashboard')
  })
  it('round-trips', () => expect(pageFromHash(hashForPage('billing'))).toBe('billing'))
})

describe('monthGrid', () => {
  it('starts October 2026 on Thursday (Monday-first offset 3) and has 31 days', () => {
    const g = monthGrid(2026, 9)
    expect(g.slice(0, 3).every((c) => c.day === null)).toBe(true)
    expect(g[3].iso).toBe('2026-10-01')
    expect(g.filter((c) => c.day).length).toBe(31)
    expect(g.length % 7).toBe(0)
  })
  it('handles leap-year February', () => {
    expect(monthGrid(2024, 1).filter((c) => c.day).length).toBe(29)
  })
  it('formats local dates', () => expect(toIso(new Date(2026, 9, 5))).toBe('2026-10-05'))
})
