/**
 * Adapters that call the myCourt backend (see /backend). They are used only when VITE_API_URL is set; otherwise the
 * pages keep using the in-browser mock adapters, so the front end still runs on its own.
 *
 * Process Details sends the process ID and e-mail with POST, never in the address, and the e-mail is not returned.
 */
import { createMockAdapter } from '../features/caseStatus/mockAdapter'
import type { CaseSearchAdapter } from '../features/caseStatus/types'
import { createMockCauseListAdapter, type CauseListAdapter } from '../features/causeList/causeList'
import { createMockOrderAdapter } from '../features/courtOrders/courtOrders'
import type { OrderSearchAdapter } from '../features/courtOrders/types'
import { createMockCaveatAdapter, type CaveatAdapter } from '../features/services/caveat'
import { createMockProcessAdapter, type ProcessAdapter } from '../features/services/process'

const base = (): string => ((import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_URL ?? '').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(readonly status: number) { super(`API error ${status}`) }
}

export async function post<T>(url: string, path: string, body: unknown, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<T> {
  const res = await fetcher(`${url}/api${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal,
  })
  if (!res.ok) throw new ApiError(res.status)
  return (await res.json()) as T
}

export function createApiCaseAdapter(url: string, fetcher?: typeof fetch): CaseSearchAdapter {
  return { isDemo: true, search: (query, signal) => post(url, '/cases/search', { query }, signal, fetcher) }
}

export function createApiOrderAdapter(url: string, fetcher?: typeof fetch): OrderSearchAdapter {
  return { isDemo: true, search: (query, signal) => post(url, '/orders/search', { query }, signal, fetcher) }
}

export function createApiCauseListAdapter(url: string, fetcher?: typeof fetch): CauseListAdapter {
  return {
    isDemo: true,
    fetch: ({ roomId, date, kind }, signal) => post(url, '/cause-lists', { roomId, date, kind }, signal, fetcher),
  }
}

export function createApiCaveatAdapter(url: string, fetcher?: typeof fetch): CaveatAdapter {
  return { isDemo: true, search: (query, signal) => post(url, '/caveats/search', { query }, signal, fetcher) }
}

export function createApiProcessAdapter(url: string, fetcher?: typeof fetch): ProcessAdapter {
  return {
    isDemo: true,
    lookup: async (q, signal) => (await post<{ process: Awaited<ReturnType<ProcessAdapter['lookup']>> }>(url, '/processes/lookup', q, signal, fetcher)).process,
  }
}

/** The backend when VITE_API_URL is set, the in-browser mock otherwise. */
export const caseAdapter = (): CaseSearchAdapter => (base() ? createApiCaseAdapter(base()) : createMockAdapter())
export const orderAdapter = (): OrderSearchAdapter => (base() ? createApiOrderAdapter(base()) : createMockOrderAdapter())
export const causeListAdapter = (): CauseListAdapter => (base() ? createApiCauseListAdapter(base()) : createMockCauseListAdapter())
export const caveatAdapter = (): CaveatAdapter => (base() ? createApiCaveatAdapter(base()) : createMockCaveatAdapter())
export const processAdapter = (): ProcessAdapter => (base() ? createApiProcessAdapter(base()) : createMockProcessAdapter())
