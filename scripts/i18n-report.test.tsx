// Developer aid, not part of the app or its type-check. Lists what is still missing from the translations:
//   I18N_REPORT=<file> npx vitest run scripts/i18n-report.test.tsx
// Writes <file> (English texts asked for but not translated) and <file>.stray.json (English words left on each Hindi page).
import { writeFileSync } from 'node:fs'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppContext } from '../src/context'
import { SVC_SLUGS } from '../src/features/services/data'
import { LANGS, missed, resetMissed, TRANSLATED } from '../src/i18n/core'
import { strayEnglish } from '../src/i18n/stray'
import ServicesApp from '../src/pages/services/ServicesApp'

const noop = () => {}
const ctx = {
  go: noop, toast: noop, openModal: noop, tasks: [], setTasks: noop, docs: [], setDocs: noop, messages: [], setMessages: noop,
  transcript: '', setTranscript: noop, researchQuery: '', setResearchQuery: noop, portalQuery: '', setPortalQuery: noop,
}
const label = (code: string) => LANGS.find((l) => l.code === code)!.label
const render = (slug: string, code: string) =>
  renderToString(<AppContext.Provider value={ctx}><ServicesApp initialSlug={slug as never} initialLanguage={label(code)} /></AppContext.Provider>)

describe.skipIf(!process.env.I18N_REPORT)('missing-text report', () => {
  it('writes the lists', () => {
    const all = new Set<string>()
    for (const code of TRANSLATED) for (const slug of SVC_SLUGS) { resetMissed(); render(slug, code); missed.forEach((m) => all.add(m)) }
    writeFileSync(process.env.I18N_REPORT!, JSON.stringify([...all], null, 1))
    const stray: Record<string, string[]> = {}
    for (const slug of SVC_SLUGS) stray[slug] = strayEnglish(render(slug, 'hi'))
    writeFileSync(process.env.I18N_REPORT! + '.stray.json', JSON.stringify(stray, null, 1))
    expect(true).toBe(true)
  })
})
