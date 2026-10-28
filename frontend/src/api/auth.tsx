import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, apiEnabled, setCsrf } from './client'

export interface Person { id: string; email: string; displayName: string; isOperator: boolean }
type Status = 'loading' | 'out' | 'in'

interface AuthValue {
  /** True when VITE_API_URL is set and the workspace needs a signed-in person. */
  required: boolean
  status: Status
  person: Person | null
  signIn: (email: string, password: string) => Promise<void>
  register: (email: string, displayName: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

/** Screens that show a person's own work. Everything else (the Services-site demo, Case status, Cause list, Court orders and
 * the eCourts portal reference) holds only fictional public data and stays open without signing in (FR-020). */
export const PRIVATE_PAGES: readonly string[] = [
  'dashboard', 'cases', 'caseDetail', 'assistant', 'research', 'documents', 'mapping', 'voice', 'hearing', 'calendar', 'intake', 'billing',
]

/** What to show: the page, a loading note, or the sign-in screen. */
export function gateState(required: boolean, status: Status, page: string): 'open' | 'loading' | 'sign-in' {
  if (!required || !PRIVATE_PAGES.includes(page) || status === 'in') return 'open'
  return status === 'loading' ? 'loading' : 'sign-in'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const required = apiEnabled()
  const [status, setStatus] = useState<Status>(required ? 'loading' : 'in')
  const [person, setPerson] = useState<Person | null>(null)

  useEffect(() => {
    if (!required) return
    api<{ person: Person; csrfToken: string }>('GET', '/auth/me')
      .then((r) => { setCsrf(r.csrfToken); setPerson(r.person); setStatus('in') })
      .catch(() => setStatus('out'))
  }, [required])

  const signIn = useCallback(async (email: string, password: string) => {
    const r = await api<{ person: Person; csrfToken: string }>('POST', '/auth/login', { email, password })
    setCsrf(r.csrfToken); setPerson(r.person); setStatus('in')
  }, [])
  const register = useCallback(async (email: string, displayName: string, password: string) => {
    await api('POST', '/auth/register', { email, displayName, password })
    await signIn(email, password)
  }, [signIn])
  const signOut = useCallback(async () => {
    try { await api('POST', '/auth/logout') } finally { setCsrf(''); setPerson(null); setStatus('out') }
  }, [])

  const value = useMemo(() => ({ required, status, person, signIn, register, signOut }), [required, status, person, signIn, register, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}
