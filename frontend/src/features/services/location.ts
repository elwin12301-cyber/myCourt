import { LOCATIONS } from '../caseStatus/referenceData'
import type { CourtSelection } from '../caseStatus/types'
import { courtErrors, type FieldErrors } from '../caseStatus/validation'

export interface CourtLocation {
  court: CourtSelection
  address: string
  note: string
}

const NOTE = 'Fictional address for demonstration; no real court is located here.'

/** One fictional location per demo court complex, and one per establishment inside it. */
export const COURT_LOCATIONS: CourtLocation[] = Object.entries(LOCATIONS).flatMap(([state, districts]) =>
  Object.entries(districts).flatMap(([district, complexes]) =>
    Object.entries(complexes).flatMap(([complex, establishments]): CourtLocation[] => [
      { court: { state, district, complex, establishment: '' }, address: `${complex}, Demonstration Road, ${district}, ${state} (fictional address)`, note: NOTE },
      ...establishments.map((establishment): CourtLocation => ({
        court: { state, district, complex, establishment },
        address: `${establishment}, ${complex}, Demonstration Road, ${district}, ${state} (fictional address)`,
        note: NOTE,
      })),
    ])))

export function validateLocationQuery(s: CourtSelection): FieldErrors {
  const e: FieldErrors = {}
  courtErrors(s, e)
  return e
}

export function findLocation(s: CourtSelection): CourtLocation | null {
  return COURT_LOCATIONS.find((l) =>
    l.court.state === s.state && l.court.district === s.district && l.court.complex === s.complex && l.court.establishment === (s.establishment || '')) ?? null
}
