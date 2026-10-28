import { describe, expect, it } from 'vitest'
import { commandFor, speechCtor } from './speech'

describe('voice commands', () => {
  it.each([
    ['open calendar', 'calendar'], ['Go to the cases.', 'cases'], ['show billing', 'billing'], ['open client intake', 'intake'],
    ['go to hearing preparation', 'hearing'], ['Open Case Status', 'caseStatus'],
  ])('"%s" opens %s', (phrase, page) => expect(commandFor(phrase)).toBe(page))

  it.each(['the hearing is on 14 November', 'open the pod bay doors', 'calendar', ''])('"%s" is dictation, not a command', (phrase) => {
    expect(commandFor(phrase)).toBeNull()
  })
})

describe('speech support', () => {
  it('is reported as missing when the browser has no recogniser', () => {
    expect(speechCtor({} as Window)).toBeNull()
  })
  it('finds the prefixed constructor used by Chrome and Edge', () => {
    class Fake {}
    expect(speechCtor({ webkitSpeechRecognition: Fake } as unknown as Window)).toBe(Fake)
  })
})
