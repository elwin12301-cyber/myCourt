import type { CaseQuery, CourtSelection } from './types'

/** Official help text: "16 digit alphanumeric CNR Number without any hyphen or space". */
export const CNR_PATTERN = /^[A-Z0-9]{16}$/
/** Official help text: enter at least 3 characters for party and advocate names. */
export const MIN_NAME_LENGTH = 3
/** Shaped after the official example "MAH/XXXX/1982"; the exact rule was not observed. */
export const BAR_CODE_PATTERN = /^[A-Z]{1,4}\/\d{1,6}\/\d{4}$/

export type FieldErrors = Record<string, string>

export function normaliseCnr(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase()
}

export function normaliseBarCode(raw: string): string {
  return raw.replace(/\s/g, '').toUpperCase()
}

export const yearOk = (y: string, max: number) => /^\d{4}$/.test(y) && +y >= 1950 && +y <= max

export function courtErrors(c: CourtSelection, e: FieldErrors) {
  if (!c.state) e.state = 'Select a state.'
  if (!c.district) e.district = 'Select a district.'
  if (!c.complex) e.complex = 'Select a court complex.'
  // Establishment is left optional: the official page shows the selector but its rules were not observed.
}

/** Returns field errors; an empty object means the query is valid. CAPTCHA is checked separately. */
export function validateQuery(q: CaseQuery, now = new Date()): FieldErrors {
  const e: FieldErrors = {}
  const max = now.getFullYear()
  const yearMsg = `Enter a 4-digit year between 1950 and ${max}.`

  if (q.mode === 'cnr') {
    if (!q.cnr) e.cnr = 'Enter a CNR number.'
    else if (!CNR_PATTERN.test(q.cnr)) e.cnr = 'CNR must be 16 letters or digits, with no spaces or hyphens.'
    return e
  }

  courtErrors(q.court, e)

  switch (q.mode) {
    case 'party':
      if (q.name.trim().length < MIN_NAME_LENGTH) e.name = `Enter at least ${MIN_NAME_LENGTH} characters of the name.`
      if (!yearOk(q.year, max)) e.year = yearMsg
      break
    case 'caseNumber':
    case 'filingNumber':
      if (!q.caseType) e.caseType = 'Select a case type.'
      if (!/^\d{1,7}$/.test(q.number)) e.number = `Enter the ${q.mode === 'filingNumber' ? 'filing' : 'case'} number (1 to 7 digits).`
      if (!yearOk(q.year, max)) e.year = yearMsg
      break
    case 'advocate':
      if (q.by === 'barCode') {
        if (!BAR_CODE_PATTERN.test(q.barCode)) e.barCode = 'Enter the bar code in the form STATE/NUMBER/YEAR, for example MAH/1234/1982.'
      } else {
        if (q.name.trim().length < MIN_NAME_LENGTH) e.name = `Enter at least ${MIN_NAME_LENGTH} characters of the advocate name.`
        if (q.by === 'caseListDate' && !/^\d{4}-\d{2}-\d{2}$/.test(q.date)) e.date = 'Select the case list date.'
      }
      break
    case 'fir':
      if (!q.policeStation) e.policeStation = 'Select a police station.'
      if (q.number && !/^\d{1,7}$/.test(q.number)) e.number = 'FIR number must be digits only.'
      if (q.year && !yearOk(q.year, max)) e.year = yearMsg
      break
    case 'act':
      if (!q.actType) e.actType = 'Select an act type.'
      break
    case 'caseType':
      if (!q.caseType) e.caseType = 'Select a case type.'
      if (!yearOk(q.year, max)) e.year = yearMsg
      break
  }
  return e
}
