import { courtErrors, MIN_NAME_LENGTH, yearOk, type FieldErrors } from '../caseStatus/validation'
import { COURT_ROOMS, roomId, roomsFor, type CourtRoom } from '../causeList/courtRooms'
import type { OrderQuery } from './types'

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-30 and 2026-13-01). */
export function isIsoDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const t = new Date(Date.UTC(y, mo - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d
}

/** Returns field errors; an empty object means the query is valid. CAPTCHA is checked separately. */
export function validateOrderQuery(q: OrderQuery, now = new Date(), rooms: CourtRoom[] = COURT_ROOMS): FieldErrors {
  const e: FieldErrors = {}
  const max = now.getFullYear()
  const yearMsg = `Enter a 4-digit year between 1950 and ${max}.`
  courtErrors(q.court, e)

  switch (q.mode) {
    case 'party':
      if (q.name.trim().length < MIN_NAME_LENGTH) e.name = `Enter at least ${MIN_NAME_LENGTH} characters of the name.`
      if (!yearOk(q.year, max)) e.year = yearMsg
      break
    case 'caseNumber':
      if (!q.caseType) e.caseType = 'Select a case type.'
      if (!/^\d{1,7}$/.test(q.number)) e.number = 'Enter the case number (1 to 7 digits).'
      if (!yearOk(q.year, max)) e.year = yearMsg
      break
    case 'courtNumber':
      if (!q.roomId) e.roomId = 'Select a court number.'
      else if (!roomsFor(q.court, rooms).some((r) => roomId(r) === q.roomId)) e.roomId = 'The selected court is not in this court complex.'
      break
    case 'orderDate':
      if (!isIsoDate(q.from)) e.from = 'Select a valid from date.'
      if (!isIsoDate(q.to)) e.to = 'Select a valid to date.'
      else if (isIsoDate(q.from) && q.from > q.to) e.to = 'The to date must not be earlier than the from date.'
      break
  }
  return e
}
