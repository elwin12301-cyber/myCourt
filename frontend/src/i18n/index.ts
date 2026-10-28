import { buildDictionary, type Row } from './core'
import { chromeRows } from './strings/chrome'
import { formsRows } from './strings/forms'
import { infoRows } from './strings/info'
import { messageRows } from './strings/messages'
import { namesRows } from './strings/names'
import { recordRows } from './strings/records'
import { servicesRows } from './strings/services'

// Rows are added area by area (chrome, forms, services, names).
const ROWS: Row[] = [...chromeRows, ...formsRows, ...servicesRows, ...messageRows, ...recordRows, ...infoRows, ...namesRows]

export const DICTIONARY = buildDictionary(ROWS)
export { ROWS }
