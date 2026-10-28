import { afterEach, describe, expect, it } from 'vitest'
import {
  buildDictionary, fill, LANGS, langFromLabel, localeOf, missed, placeholdersOf, resetMissed, translate, type Row,
} from './core'

const rows: Row[] = [
  ['Search', 'खोजें', 'शोधा', 'શોધો', 'ಹುಡುಕಿ', 'தேடு'],
  ['Enter at least {n} characters of the name.', '{n} अक्षर दर्ज करें।', '{n} अक्षरे टाका.', '{n} અક્ષર દાખલ કરો.', '{n} ಅಕ್ಷರ ನಮೂದಿಸಿ.', '{n} எழுத்துகள் உள்ளிடவும்.'],
  ['Enter a 4-digit year between {from} and {to}.', '{from}–{to} का वर्ष', '{from}–{to} वर्ष', '{from}–{to} વર્ષ', '{from}–{to} ವರ್ಷ', '{from}–{to} ஆண்டு'],
  ['No data for {state}.', '{state} हेतु नहीं।', '{state} साठी नाही.', '{state} માટે નથી.', '{state}ಗೆ ಇಲ್ಲ.', '{state}க்கு இல்லை.'],
  ['Goa', 'गोवा', 'गोवा', 'ગોવા', 'ಗೋವಾ', 'கோவா'],
]
const dict = buildDictionary(rows)
afterEach(() => resetMissed())

describe('translate: exact rows', () => {
  it('returns English unchanged for English', () => expect(translate(dict, 'en', 'Search')).toBe('Search'))
  it('translates a known text', () => {
    expect(translate(dict, 'hi', 'Search')).toBe('खोजें')
    expect(translate(dict, 'ta', 'Search')).toBe('தேடு')
  })
  it('falls back to English and records the miss', () => {
    expect(translate(dict, 'hi', 'Unknown text')).toBe('Unknown text')
    expect([...missed]).toEqual(['Unknown text'])
  })
  it('leaves text without Latin letters alone and does not call it a miss', () => {
    expect(translate(dict, 'hi', '12 / 2025')).toBe('12 / 2025')
    expect(translate(dict, 'hi', 'खोजें · 3')).toBe('खोजें · 3')
    expect(missed.size).toBe(0)
  })
  it('does not record misses for English', () => {
    translate(dict, 'en', 'Anything at all')
    expect(missed.size).toBe(0)
  })
})

describe('translate: parameters and templates', () => {
  it('fills named parameters in a key', () => {
    expect(translate(dict, 'hi', 'Enter at least {n} characters of the name.', { n: 3 })).toBe('3 अक्षर दर्ज करें।')
  })
  it('translates a finished English sentence by matching its template', () => {
    expect(translate(dict, 'mr', 'Enter at least 3 characters of the name.')).toBe('3 अक्षरे टाका.')
  })
  it('handles several placeholders in order', () => {
    expect(translate(dict, 'gu', 'Enter a 4-digit year between 1950 and 2026.')).toBe('1950–2026 વર્ષ')
  })
  it('translates a captured value that has its own row', () => {
    expect(translate(dict, 'ta', 'No data for Goa.')).toBe('கோவாக்கு இல்லை.')
  })
  it('keeps a captured value that has no row', () => {
    expect(translate(dict, 'hi', 'No data for Atlantis.')).toBe('Atlantis हेतु नहीं।')
  })
  it('records a miss when no row or template fits', () => {
    translate(dict, 'kn', 'Enter at least characters')
    expect(missed.has('Enter at least characters')).toBe(true)
  })
  it('does not let an English sentence match unrelated templates', () => {
    expect(translate(dict, 'hi', 'Search the site')).toBe('Search the site')
  })
})

describe('helpers', () => {
  it('lists placeholders', () => expect(placeholdersOf('a {x} b {y} c {x}')).toEqual(['x', 'y']))
  it('fills only the names it is given and leaves the rest', () => {
    expect(fill('{a} and {b}', { a: 1 })).toBe('1 and {b}')
    expect(fill('no params')).toBe('no params')
  })
  it('maps the selector labels to codes and unknown values to English', () => {
    expect(langFromLabel('हिन्दी')).toBe('hi')
    expect(langFromLabel('தமிழ்')).toBe('ta')
    expect(langFromLabel('English')).toBe('en')
    expect(langFromLabel('Klingon')).toBe('en')
  })
  it('has six languages with locales and scripts for the five Indian ones', () => {
    expect(LANGS).toHaveLength(6)
    expect(localeOf('mr')).toBe('mr-IN')
    for (const l of LANGS.filter((x) => x.code !== 'en')) expect(l.script).toBeInstanceOf(RegExp)
  })
})

describe('buildDictionary', () => {
  it('reports duplicate English keys', () => {
    const d = buildDictionary([...rows, ['Search', 'a', 'b', 'c', 'd', 'e']])
    expect(d.duplicates).toEqual(['Search'])
  })
})
