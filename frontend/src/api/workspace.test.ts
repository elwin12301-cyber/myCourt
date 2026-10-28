import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as W from './workspace'
import { setCsrf } from './client'

let fetchMock: ReturnType<typeof vi.fn>
const lastCall = () => fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit]
const matter: W.Matter = { id: 'm1', version: 3, title: 'Alpha v. Beta (demo)', clientRef: '', status: 'open', courtCaseRef: '', isDemo: true, myLevel: 'owner', updatedAt: '' }

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:8000')
  setCsrf('csrf')
  fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('workspace API calls', () => {
  it('edits send the version that was read (so a stale edit gets a 409)', async () => {
    await W.matters.update(matter, { title: 'New title' })
    expect(lastCall()[0]).toBe('http://localhost:8000/api/matters/m1')
    expect(lastCall()[1].method).toBe('PATCH')
    expect(JSON.parse(lastCall()[1].body as string)).toEqual({ version: 3, title: 'New title' })
  })

  it('child records send their own version too', async () => {
    await W.tasks.update('m1', { id: 't1', version: 5, title: 'x', due: null, done: false }, { done: true })
    expect(lastCall()[0]).toBe('http://localhost:8000/api/matters/m1/tasks/t1')
    expect(JSON.parse(lastCall()[1].body as string)).toEqual({ version: 5, done: true })
  })

  it('finding a person to share with puts the e-mail in the body, never the address', async () => {
    await W.matters.findPerson('colleague@example.invalid')
    const [url, init] = lastCall()
    expect(url).not.toContain('colleague')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ email: 'colleague@example.invalid' })
  })

  it('sharing and unsharing use the assignment path', async () => {
    await W.matters.share('m1', 'p2', 'edit')
    expect(lastCall()[0]).toMatch(/\/matters\/m1\/assignments\/p2$/)
    expect(JSON.parse(lastCall()[1].body as string)).toEqual({ level: 'edit' })
    await W.matters.unshare('m1', 'p2')
    expect(lastCall()[1].method).toBe('DELETE')
  })

  it('deleting a matter repeats its title as the confirmation', async () => {
    await W.matters.remove(matter)
    expect(lastCall()[0]).toContain('confirm=Alpha%20v.%20Beta%20(demo)')
  })

  it('approving goes through the dedicated approve routes', async () => {
    await W.drafts.approve('m1', { id: 'd1' } as W.Draft)
    expect(lastCall()[0]).toMatch(/\/matters\/m1\/drafts\/d1\/approve$/)
    await W.calendar.action('m1', { id: 'c1', version: 1 } as W.CalendarEntry, 'approve')
    expect(lastCall()[0]).toMatch(/\/matters\/m1\/calendar\/c1\/approve$/)
    await W.invoices.approve('m1', { id: 'i1' } as W.Invoice)
    expect(lastCall()[0]).toMatch(/\/matters\/m1\/invoices\/i1\/approve$/)
  })

  it('formats paise as rupees and only edit/owner can edit', () => {
    expect(W.rupees(405000)).toBe('₹4,050.00')
    expect(W.canEdit('view')).toBe(false)
    expect(W.canEdit('edit')).toBe(true)
    expect(W.canEdit('owner')).toBe(true)
  })
})
