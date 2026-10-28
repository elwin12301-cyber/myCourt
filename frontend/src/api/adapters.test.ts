import { describe, expect, it, vi } from 'vitest'
import { ApiError, createApiCauseListAdapter, createApiCaseAdapter, createApiProcessAdapter } from './adapters'

const reply = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('API adapters', () => {
  it('posts the query as JSON to the right path', async () => {
    const f = reply([])
    await createApiCaseAdapter('http://api.test', f).search({ mode: 'cnr', cnr: 'TNCH019999992025' })
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://api.test/api/cases/search')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ query: { mode: 'cnr', cnr: 'TNCH019999992025' } })
  })

  it('turns an error status into an ApiError (the page shows its retry state)', async () => {
    await expect(createApiCaseAdapter('http://api.test', reply({}, 503)).search({ mode: 'cnr', cnr: 'x' })).rejects.toBeInstanceOf(ApiError)
  })

  it('sends only room, date and kind for a cause list', async () => {
    const f = reply({ room: {}, date: '2026-10-28', kind: 'Civil', entries: [] })
    await createApiCauseListAdapter('http://api.test', f).fetch({ court: { state: 'a', district: 'b', complex: 'c', establishment: '' }, roomId: 'r', date: '2026-10-28', kind: 'Civil' })
    const init = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({ roomId: 'r', date: '2026-10-28', kind: 'Civil' })
  })

  it('process lookup posts the id and e-mail in the body, never the address, and returns null when not found', async () => {
    const f = reply({ process: null })
    const result = await createApiProcessAdapter('http://api.test', f).lookup({ processId: 'PRC-DEMO-0001', email: 'a@example.invalid' })
    const [url] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string]
    expect(result).toBeNull()
    expect(url).not.toContain('PRC-DEMO')
    expect(url).not.toContain('example.invalid')
  })
})
