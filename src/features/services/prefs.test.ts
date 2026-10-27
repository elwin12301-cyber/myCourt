import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFS, loadPrefs, PREFS_KEY, sanitizePrefs, savePrefs, themeClasses } from './prefs'

const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v) } }
}

describe('site preferences', () => {
  it('uses defaults when nothing is stored', () => expect(loadPrefs(memory())).toEqual(DEFAULT_PREFS))
  it('saves and loads a choice', () => {
    const s = memory()
    savePrefs({ language: 'தமிழ்', topbar: 'Dark', theme: 'Eco', noticeDismissed: true }, s)
    expect(loadPrefs(s)).toEqual({ language: 'தமிழ்', topbar: 'Dark', theme: 'Eco', noticeDismissed: true })
  })
  it('ignores invalid stored values field by field', () => {
    const s = memory()
    s.setItem(PREFS_KEY, JSON.stringify({ language: 'Klingon', topbar: 'Dark', theme: 'Neon', noticeDismissed: 'yes' }))
    expect(loadPrefs(s)).toEqual({ ...DEFAULT_PREFS, topbar: 'Dark' })
  })
  it('survives corrupt JSON and unusable storage', () => {
    const bad = { getItem: () => '{not json' }
    expect(loadPrefs(bad)).toEqual(DEFAULT_PREFS)
    const throwing = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(loadPrefs(throwing)).toEqual(DEFAULT_PREFS)
    expect(() => savePrefs(DEFAULT_PREFS, throwing)).not.toThrow()
  })
  it('sanitises non-objects', () => {
    expect(sanitizePrefs(null)).toEqual(DEFAULT_PREFS)
    expect(sanitizePrefs('x')).toEqual(DEFAULT_PREFS)
  })
  it('turns choices into css classes', () => {
    expect(themeClasses({ ...DEFAULT_PREFS, topbar: 'Dark', theme: 'Eco' })).toBe('theme-eco top-dark')
    expect(themeClasses(DEFAULT_PREFS)).toBe('theme-default top-light')
  })
})
