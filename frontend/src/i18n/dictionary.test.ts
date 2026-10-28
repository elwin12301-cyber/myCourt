import { describe, expect, it } from 'vitest'
import { ALLOWED_LATIN, LANGS, placeholdersOf, TRANSLATED } from './core'
import { DICTIONARY, ROWS } from './index'

const script = (code: string) => LANGS.find((l) => l.code === code)!.script!

/** Latin-letter words in a translation, ignoring {placeholders}. */
const latinWords = (s: string) => (s.replace(/[\w.-]+\[at\][\w[\].-]+/g, ' ').replace(/\b[\w-]+(?:\.[\w-]+)+\b/g, ' ').replace(/\{[A-Za-z0-9_]+\}/g, ' ').match(/[A-Za-z]+/g) ?? [])

describe('translation rows', () => {
  it('have no duplicate English keys', () => expect(DICTIONARY.duplicates).toEqual([]))

  it('give every language a non-empty translation', () => {
    const bad: string[] = []
    for (const row of ROWS) {
      row.forEach((cell, i) => { if (!cell || !cell.trim() || cell !== cell.trim()) bad.push(`${row[0]} [${i}]`) })
    }
    expect(bad).toEqual([])
  })

  it('keep exactly the placeholders of the English text', () => {
    const bad: string[] = []
    for (const [en, ...rest] of ROWS) {
      const want = placeholdersOf(en).sort().join(',')
      rest.forEach((tr, i) => { if (placeholdersOf(tr).sort().join(',') !== want) bad.push(`${en} -> ${TRANSLATED[i]}`) })
    }
    expect(bad).toEqual([])
  })

  it('are written in the right script, or deliberately left as the English term', () => {
    const bad: string[] = []
    for (const [en, ...rest] of ROWS) {
      rest.forEach((tr, i) => {
        const code = TRANSLATED[i]
        const withoutPlaceholders = tr.replace(/\{[A-Za-z0-9_]+\}/g, '')
        const hasLetters = /\p{L}/u.test(withoutPlaceholders)
        if (hasLetters && !script(code).test(tr) && tr !== en) bad.push(`${en} -> ${code}: ${tr}`)
      })
    }
    expect(bad).toEqual([])
  })

  it('leave no stray English words except allowed technical terms', () => {
    const bad: string[] = []
    for (const [en, ...rest] of ROWS) {
      rest.forEach((tr, i) => {
        if (tr === en) return // kept deliberately (for example "CNR")
        const stray = latinWords(tr).filter((w) => !ALLOWED_LATIN.has(w))
        if (stray.length) bad.push(`${en} -> ${TRANSLATED[i]}: ${stray.join(' ')}`)
      })
    }
    expect(bad).toEqual([])
  })

  it('do not translate a text into itself in every language unless it is a term', () => {
    const same = ROWS.filter(([en, ...rest]) => rest.every((t) => t === en) && /[a-z]{3,}/.test(en.replace(/\{[A-Za-z0-9_]+\}/g, '')))
    expect(same.map((r) => r[0])).toEqual([])
  })
})
