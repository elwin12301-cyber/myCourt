import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppContext } from '../context'
import type { AppContextValue } from '../types'
import ServicesApp from '../pages/services/ServicesApp'
import { SVC_SLUGS, type SvcSlug } from '../features/services/data'
import { LANGS, missed, resetMissed, TRANSLATED } from './core'
import { strayEnglish } from './stray'

// A random captcha would put random Latin letters on the page.
vi.mock('../features/caseStatus/captcha', async (orig) => ({ ...(await orig<typeof import('../features/caseStatus/captcha')>()), generateCaptcha: () => '123456' }))

const noop = () => {}
const ctx: AppContextValue = {
  go: noop, toast: noop, openModal: noop, tasks: [], setTasks: noop, docs: [], setDocs: noop, messages: [], setMessages: noop,
  transcript: '', setTranscript: noop, researchQuery: '', setResearchQuery: noop, portalQuery: '', setPortalQuery: noop,
}
const label = (code: string) => LANGS.find((l) => l.code === code)!.label
export const render = (slug: SvcSlug, code: string) =>
  renderToString(<AppContext.Provider value={ctx}><ServicesApp initialSlug={slug} initialLanguage={label(code)} /></AppContext.Provider>)

afterEach(() => resetMissed())

describe('every site page is fully translated', () => {
  for (const code of TRANSLATED) {
    it.each(SVC_SLUGS)(`${code}: %s has no untranslated interface text`, (slug) => {
      render(slug, code)
      expect([...missed]).toEqual([])
    })
  }
})

describe('no English interface text is left on translated pages', () => {
  for (const code of TRANSLATED) {
    it.each(SVC_SLUGS)(`${code}: %s`, (slug) => {
      expect(strayEnglish(render(slug, code))).toEqual([])
    })
  }
})

describe('English is unchanged', () => {
  it('records no misses and shows no machine-translation notice', () => {
    for (const slug of SVC_SLUGS) {
      const html = render(slug, 'en')
      expect(html).not.toContain('machine-translated')
    }
    expect([...missed]).toEqual([])
  })
})
