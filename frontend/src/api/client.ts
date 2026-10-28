/**
 * Client for the signed-in workspace API. It is used only when VITE_API_URL is set; without it the app keeps its
 * in-browser demonstration state. The session lives in an HttpOnly cookie (script cannot read it); the CSRF token that
 * sign-in returns is kept in memory only and sent on every changing request.
 */
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly fields: Record<string, string> = {}) {
    super(message)
  }
}

export const apiBase = (): string => ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/+$/, '')
export const apiEnabled = (): boolean => apiBase() !== ''

let csrf = ''
export const setCsrf = (token: string) => { csrf = token }

export async function api<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown, fetcher: typeof fetch = fetch): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') headers['X-CSRF-Token'] = csrf
  const res = await fetcher(`${apiBase()}/api${path}`, {
    method, credentials: 'include', headers, body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    let data: { code?: string; message?: string; fields?: Record<string, string> } = {}
    try { data = await res.json() } catch { /* not JSON */ }
    throw new ApiError(res.status, data.code ?? 'error', data.message ?? 'Something went wrong. Try again.', data.fields ?? {})
  }
  return (await res.json()) as T
}

/** A message safe to show a person: the server's plain-language text, or a generic one for network failures. */
export function messageOf(err: unknown): string {
  if (err instanceof ApiError) return err.status === 409 ? 'Someone else changed this item. Reload it and try again.' : err.message
  return 'The server could not be reached. Check your connection and try again.'
}
