import { describe, expect, it } from 'vitest'
import { HELP, PAGE_ALIASES, parseCommand, parseNumber } from './commands'
import { bestMatch, normalise, score } from './match'

describe('voice command parser', () => {
  it.each([
    ['open calendar', { t: 'go', page: 'calendar' }],
    ['Go to the billing screen.', { t: 'go', page: 'billing' }],
    ['show client intake', { t: 'go', page: 'intake' }],
    ['please open high courts', { t: 'go', page: 'portalHighCourts' }],
    ['take me to cases and matters', { t: 'go', page: 'cases' }],
    ['dashboard', { t: 'go', page: 'dashboard' }],
    ['go back', { t: 'back' }], ['refresh the page', { t: 'reload' }],
    ['scroll down', { t: 'scroll', dir: 'down' }], ['go to the top', { t: 'scroll', dir: 'top' }], ['scroll to bottom', { t: 'scroll', dir: 'bottom' }],
    ['click save', { t: 'click', name: 'save' }], ['press the approve button', { t: 'click', name: 'the approve button' }],
    ['open the thing that does not exist', { t: 'click', name: 'the thing that does not exist' }],
    ['focus client name', { t: 'focus', name: 'client name' }],
    ['set hours to 2', { t: 'set', name: 'hours', value: '2' }],
    ['Set opposing party to Other Side (demo)', { t: 'set', name: 'opposing party', value: 'Other Side (demo)' }],
    ['choose Criminal in practice area', { t: 'set', name: 'practice area', value: 'Criminal' }],
    ['check voice commands', { t: 'check', name: 'voice commands', on: true }],
    ['untick high priority', { t: 'check', name: 'high priority', on: false }],
    ['clear field', { t: 'clear' }], ['next field', { t: 'next' }], ['previous field', { t: 'prev' }], ['submit', { t: 'submit' }],
    ['start dictation', { t: 'dictate', on: true }], ['stop dictation', { t: 'dictate', on: false }],
    ['make text bigger', { t: 'display', change: 'bigger' }], ['smaller text', { t: 'display', change: 'smaller' }],
    ['normal text size', { t: 'display', change: 'normal' }], ['high contrast on', { t: 'display', change: 'contrast-on' }],
    ['turn off high contrast', { t: 'display', change: 'contrast-off' }], ['reset display', { t: 'display', change: 'reset' }],
    ['show numbers', { t: 'numbers', on: true }], ['hide the numbers', { t: 'numbers', on: false }],
    ['click 12', { t: 'number', n: 12 }], ['12', { t: 'number', n: 12 }], ['press number twelve', { t: 'number', n: 12 }], ['open item 3', { t: 'number', n: 3 }],
    ['select twenty five', { t: 'number', n: 25 }],
    ['show replies', { t: 'replies', on: true }], ['hide replies', { t: 'replies', on: false }],
    ['sign out', { t: 'signout' }], ['what can I say', { t: 'help' }], ['stop listening', { t: 'stop' }], ['read page', { t: 'read' }],
  ])('"%s"', (phrase, action) => {
    const got = parseCommand(phrase)
    expect(got).toMatchObject(action as object)
  })

  it('keeps the original wording of what to type', () => {
    expect(parseCommand('type Sample Party v. State (demo)')).toEqual({ t: 'type', text: 'Sample Party v. State (demo)' })
    expect(parseCommand('Write the Hearing is on 14 November')).toEqual({ t: 'type', text: 'the Hearing is on 14 November' })
  })

  it('does not treat dictation words as commands', () => {
    expect(parseCommand('the hearing is listed tomorrow').t).toBe('unknown')
    expect(parseCommand('').t).toBe('unknown')
  })

  it('"turn off voice" stops voice control instead of unticking a box', () => {
    expect(parseCommand('turn off voice')).toEqual({ t: 'stop' })
  })

  it('every alias points at a real screen name and every help example parses to something other than unknown', () => {
    expect(Object.values(PAGE_ALIASES).every((p) => typeof p === 'string' && p.length > 0)).toBe(true)
    const bad: string[] = []
    for (const g of HELP) for (const i of g.items) for (const phrase of i.say.split(' / ')) {
      if (parseCommand(phrase.trim()).t === 'unknown') bad.push(phrase)
    }
    expect(bad).toEqual([])
  })
})

describe('numbers', () => {
  it.each([['5', 5], ['12', 12], ['twelve', 12], ['twenty five', 25], ['thirty-one', 31], ['ninety', 90]])('"%s" is %i', (t, n) => expect(parseNumber(t)).toBe(n))
  it.each(['', 'save', 'twenty twenty', '1234', 'zero zero'])('"%s" is not a number', (t) => expect(parseNumber(t)).toBeNull())
  it('a number word inside a longer phrase is not a number command', () => {
    expect(parseCommand('set hours to 3').t).toBe('set')
    expect(parseCommand('the hearing is on fourteen').t).toBe('unknown')
  })
})

describe('matching spoken names to controls', () => {
  const names = ['Add task', 'New task', 'Client name', 'Opposing party', 'Practice area', 'Save intake draft', 'Hours', 'Rate (₹)', 'Open matter: Sample']
  it('prefers exact, then prefix, then contains', () => {
    expect(names[bestMatch('hours', names)]).toBe('Hours')
    expect(names[bestMatch('save', names)]).toBe('Save intake draft')
    expect(names[bestMatch('client', names)]).toBe('Client name')
    expect(names[bestMatch('rate', names)]).toBe('Rate (₹)')
  })
  it('finds nothing for an unrelated phrase', () => {
    expect(bestMatch('quantum flux capacitor', names)).toBe(-1)
  })
  it('ignores case, punctuation and filler words', () => {
    expect(normalise('Rate (₹):')).toBe('rate ₹')
    expect(score('the client name field', 'Client name')).toBeGreaterThan(24)
  })
})
