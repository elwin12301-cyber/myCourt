import type { CaseQuery } from './types'

/** Official help text: "16 digit alphanumeric CNR Number without any hyphen or space". */
export const CNR_PATTERN = /^[A-Z0-9]{16}$/

export const MIN_PARTY_NAME_LENGTH = 3 // prototype rule, not an official eCourts rule

export type FieldErrors = Record<string, string>

export function normaliseCnr(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase()
}

export function validateQuery(q: CaseQuery, now = new Date()): FieldErrors {
  const e: FieldErrors = {}
  const maxYear = now.getFullYear()
  const yearOk = (y: string) => /^\d{4}$/.test(y) && +y >= 1950 && +y <= maxYear

  if (q.mode === 'cnr') {
    if (!q.cnr) e.cnr = 'Enter a CNR number.'
    else if (!CNR_PATTERN.test(q.cnr)) e.cnr = 'CNR must be 16 letters or digits, with no spaces or hyphens.'
    return e
  }

  if (!q.state) e.state = 'Select a state.'
  if (!q.district) e.district = 'Select a district.'
  if (!q.court) e.court = 'Select a court complex.'

  if (q.mode === 'caseNumber') {
    if (!q.caseType) e.caseType = 'Select a case type.'
    if (!/^\d{1,7}$/.test(q.number)) e.number = 'Case number must be 1 to 7 digits.'
    if (!yearOk(q.year)) e.year = `Enter a 4-digit year between 1950 and ${maxYear}.`
  } else {
    if (q.name.trim().length < MIN_PARTY_NAME_LENGTH) e.name = `Enter at least ${MIN_PARTY_NAME_LENGTH} characters of the party name.`
    if (q.year && !yearOk(q.year)) e.year = `Enter a 4-digit year between 1950 and ${maxYear}.`
  }
  return e
}
