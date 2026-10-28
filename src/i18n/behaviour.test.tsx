import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppContext } from '../context'
import type { AppContextValue } from '../types'
import ServicesApp from '../pages/services/ServicesApp'
import { CASE_STATES, CASE_TYPES, ACTS } from '../features/caseStatus/referenceData'
import { HC_SITES } from '../features/services/data'
import { DICTIONARY } from './index'
import { LANGS, missed, resetMissed, translate, TRANSLATED } from './core'

vi.mock('../features/caseStatus/captcha', async (orig) => ({ ...(await orig<typeof import('../features/caseStatus/captcha')>()), generateCaptcha: () => '123456' }))

const noop = () => {}
const ctx: AppContextValue = {
  go: noop, toast: noop, openModal: noop, tasks: [], setTasks: noop, docs: [], setDocs: noop, messages: [], setMessages: noop,
  transcript: '', setTranscript: noop, researchQuery: '', setResearchQuery: noop, portalQuery: '', setPortalQuery: noop,
}
const label = (code: string) => LANGS.find((l) => l.code === code)!.label
const render = (slug: string, code: string) =>
  renderToString(<AppContext.Provider value={ctx}><ServicesApp initialSlug={slug as never} initialLanguage={label(code)} /></AppContext.Provider>)

afterEach(() => resetMissed())

describe('validation messages keep their values', () => {
  for (const code of TRANSLATED) {
    it(`${code}: numbers and inserted words survive translation`, () => {
      const year = translate(DICTIONARY, code, 'Enter a 4-digit year between 1950 and 2026.')
      expect(year).toContain('1950')
      expect(year).toContain('2026')
      expect(year).not.toContain('{')
      const filing = translate(DICTIONARY, code, 'Enter the filing number (1 to 7 digits).')
      const caseNo = translate(DICTIONARY, code, 'Enter the case number (1 to 7 digits).')
      expect(filing).not.toEqual(caseNo)
      expect(filing).toContain('7')
      expect(missed.size).toBe(0)
    })
  }
})

describe('machine-translation notice', () => {
  for (const code of TRANSLATED) {
    it(`${code}: shown in the language and in English`, () => {
      const html = render('cnr', code)
      expect(html).toContain('<span lang="en">Machine translation: not reviewed by a native speaker.')
      expect(html).toContain('role="note"')
    })
  }
  it('is absent in English', () => {
    expect(render('cnr', 'en')).not.toContain('Machine translation')
  })
})

describe('names are translated but stored values stay English', () => {
  it('translates every state, case type, act and High Court name in every language', () => {
    for (const code of TRANSLATED) {
      const same = [...CASE_STATES, ...CASE_TYPES, ...ACTS, ...HC_SITES.map((h) => h.name)]
        .filter((n) => translate(DICTIONARY, code, n) === n)
      expect(same, code).toEqual([])
    }
    expect(missed.size).toBe(0)
  })

  for (const code of TRANSLATED) {
    it(`${code}: option values on the search form are still English`, () => {
      const html = render('case-status', code)
      const values = [...html.matchAll(/<option value="([^"]+)"/g)].map((m) => m[1])
      expect(values).toContain('Tamil Nadu')
      expect(values.filter((v) => /[^\u0000-\u007f]/.test(v))).toEqual([])
    })
  }
})
