import { describe, expect, it } from 'vitest'
import { createMockProcessAdapter, DEMO_PROCESSES, lookupProcess, validateProcessQuery } from './process'

const good = { processId: 'PRC-DEMO-0001', email: 'advocate.one@example.invalid' }

describe('validateProcessQuery', () => {
  it('accepts a process id and an e-mail', () => expect(validateProcessQuery(good)).toEqual({}))
  it('requires both fields', () => {
    expect(Object.keys(validateProcessQuery({ processId: '', email: '' })).sort()).toEqual(['email', 'processId'])
  })
  it('rejects a malformed e-mail and unsafe process ids', () => {
    expect(validateProcessQuery({ ...good, email: 'not-an-email' }).email).toBeDefined()
    expect(validateProcessQuery({ ...good, processId: '<script>' }).processId).toBeDefined()
    expect(validateProcessQuery({ ...good, processId: 'ab' }).processId).toBeDefined()
  })
  it('trims whitespace before checking', () => {
    expect(validateProcessQuery({ processId: '  PRC-DEMO-0001 ', email: ' advocate.one@example.invalid ' })).toEqual({})
  })
})

describe('lookupProcess', () => {
  it('returns the record when the id and the registered e-mail match, ignoring case', () => {
    expect(lookupProcess(good, DEMO_PROCESSES)?.processId).toBe('PRC-DEMO-0001')
    expect(lookupProcess({ processId: 'prc-demo-0001', email: 'ADVOCATE.ONE@example.invalid' }, DEMO_PROCESSES)).not.toBeNull()
  })
  it('does not reveal whether an id exists: wrong e-mail and unknown id give the same result', () => {
    const wrongEmail = lookupProcess({ ...good, email: 'someone.else@example.invalid' }, DEMO_PROCESSES)
    const unknownId = lookupProcess({ processId: 'PRC-NOPE-9999', email: good.email }, DEMO_PROCESSES)
    expect(wrongEmail).toBeNull()
    expect(unknownId).toBeNull()
    expect(wrongEmail).toEqual(unknownId)
  })
  it('never hands back the e-mail address', () => {
    expect(JSON.stringify(lookupProcess(good, DEMO_PROCESSES))).not.toContain('example.invalid')
  })
})

describe('process data and adapter', () => {
  it('uses only fictional addresses on an invalid domain', () => {
    for (const p of DEMO_PROCESSES) expect(p.email).toMatch(/@example\.invalid$/)
  })
  it('adapter is demo, resolves a record or null, and honours abort', async () => {
    const a = createMockProcessAdapter(0)
    expect(a.isDemo).toBe(true)
    expect((await a.lookup(good))?.type).toBeTruthy()
    expect(await a.lookup({ ...good, email: 'x@example.invalid' })).toBeNull()
    const ctl = new AbortController()
    const p = createMockProcessAdapter(50).lookup(good, ctl.signal)
    ctl.abort()
    await expect(p).rejects.toThrow()
  })
})
