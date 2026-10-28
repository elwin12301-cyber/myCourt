import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, apiEnabled, messageOf, setCsrf } from './client'
import { gateState } from './auth'

const reply = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch
const call = (f: typeof fetch) => (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]

afterEach(() => { vi.unstubAllEnvs(); setCsrf('') })

describe('api client', () => {
  it('is off unless VITE_API_URL is set', () => {
    expect(apiEnabled()).toBe(false)
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000/')
    expect(apiEnabled()).toBe(true)
  })

  it('sends the cookie and, on changing requests only, the CSRF token', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000')
    setCsrf('tok123')
    const get = reply({ ok: 1 })
    await api('GET', '/matters', undefined, get)
    expect(call(get)[0]).toBe('http://localhost:8000/api/matters')
    expect(call(get)[1].credentials).toBe('include')
    expect((call(get)[1].headers as Record<string, string>)['X-CSRF-Token']).toBeUndefined()
    const post = reply({ ok: 1 })
    await api('POST', '/matters', { title: 'x' }, post)
    expect((call(post)[1].headers as Record<string, string>)['X-CSRF-Token']).toBe('tok123')
    expect(JSON.parse(call(post)[1].body as string)).toEqual({ title: 'x' })
  })

  it('turns the server error body into an ApiError with field messages', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000')
    const f = reply({ code: 'validation_failed', message: 'Check the highlighted fields.', fields: { title: 'Enter a title.' } }, 422)
    const err = (await api('POST', '/matters', {}, f).catch((e: unknown) => e)) as ApiError
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(422)
    expect(err.code).toBe('validation_failed')
    expect(err.fields.title).toBe('Enter a title.')
  })

  it('gives plain-language messages for conflicts and network failures', () => {
    expect(messageOf(new ApiError(409, 'conflict', 'x'))).toMatch(/changed this item/)
    expect(messageOf(new TypeError('Failed to fetch'))).toMatch(/could not be reached/)
    expect(messageOf(new ApiError(404, 'not_found', 'Not found.'))).toBe('Not found.')
  })
})

describe('sign-in gate', () => {
  it('lets everything through when the backend is not in use', () => {
    expect(gateState(false, 'out', 'cases')).toBe('open')
  })
  it('keeps the Services-site demo and the public eCourts-style pages open', () => {
    for (const page of ['services', 'caseStatus', 'causeList', 'courtOrders', 'portalHome', 'portalForms']) {
      expect(gateState(true, 'out', page)).toBe('open')
    }
  })
  it('gates every private workspace screen', () => {
    for (const page of ['dashboard', 'cases', 'caseDetail', 'assistant', 'research', 'documents', 'mapping', 'voice', 'hearing', 'calendar', 'intake', 'billing']) {
      expect(gateState(true, 'out', page)).toBe('sign-in')
    }
  })
  it('asks for sign-in, and waits while checking', () => {
    expect(gateState(true, 'out', 'cases')).toBe('sign-in')
    expect(gateState(true, 'loading', 'dashboard')).toBe('loading')
    expect(gateState(true, 'in', 'cases')).toBe('open')
  })
})
