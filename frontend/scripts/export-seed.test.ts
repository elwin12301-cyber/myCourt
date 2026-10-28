// Developer aid, not part of the app: writes the fictional demonstration data the backend seeds its database with.
//   EXPORT_SEED=../backend/app/seed/demo_data.json npx vitest run scripts/export-seed.test.ts
import { writeFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { DEMO_CASES } from '../src/features/caseStatus/mockData'
import { COURT_ROOMS } from '../src/features/causeList/courtRooms'
import { DEMO_CAVEATS } from '../src/features/services/caveat'
import { COURT_LOCATIONS } from '../src/features/services/location'
import { DEMO_PROCESSES } from '../src/features/services/process'

const out = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.EXPORT_SEED

it.skipIf(!out)('exports the demonstration data', () => {
  writeFileSync(out!, JSON.stringify({
    cases: DEMO_CASES, courtRooms: COURT_ROOMS, caveats: DEMO_CAVEATS, processes: DEMO_PROCESSES, locations: COURT_LOCATIONS,
  }, null, 2))
  expect(DEMO_CASES.length).toBeGreaterThan(0)
})
