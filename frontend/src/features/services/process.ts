import type { FieldErrors } from '../caseStatus/validation'

export interface ProcessRecord {
  processId: string
  /** Fictional address registered with the court; never shown, stored or logged by the screen. */
  email: string
  caseRef: string
  type: 'Summons' | 'Notice' | 'Warrant'
  issuedOn: string
  status: 'Issued' | 'Served' | 'Returned' | 'Pending'
  court: string
}

/** What a successful lookup returns: the record without the e-mail address. */
export type PublicProcess = Omit<ProcessRecord, 'email'>

export interface ProcessQuery { processId: string; email: string }

export interface ProcessAdapter {
  readonly isDemo: boolean
  lookup(query: ProcessQuery, signal?: AbortSignal): Promise<PublicProcess | null>
}

/** Fictional processes. The e-mail domain `example.invalid` can never belong to a real person. */
export const DEMO_PROCESSES: ProcessRecord[] = [
  { processId: 'PRC-DEMO-0001', email: 'advocate.one@example.invalid', caseRef: 'Criminal Case (CC) 412/2025 (demo)', type: 'Summons', issuedOn: '2026-09-05', status: 'Served', court: 'Sessions Court, Chennai (demo)' },
  { processId: 'PRC-DEMO-0002', email: 'advocate.two@example.invalid', caseRef: 'Civil Suit (CS) 118/2024 (demo)', type: 'Notice', issuedOn: '2026-08-12', status: 'Issued', court: 'City Civil Court, Chennai (demo)' },
  { processId: 'PRC-DEMO-0003', email: 'clerk.demo@example.invalid', caseRef: 'Criminal Case (CC) 905/2023 (demo)', type: 'Warrant', issuedOn: '2026-07-01', status: 'Returned', court: 'Magistrate Courts, New Delhi (demo)' },
]

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\-/]{3,29}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateProcessQuery(q: ProcessQuery): FieldErrors {
  const e: FieldErrors = {}
  const id = q.processId.trim()
  const mail = q.email.trim()
  if (!id) e.processId = 'Enter the process ID.'
  else if (!ID_PATTERN.test(id)) e.processId = 'The process ID may contain only letters, digits, hyphens and slashes (4 to 30 characters).'
  if (!mail) e.email = 'Enter the e-mail address registered with the court.'
  else if (!EMAIL_PATTERN.test(mail)) e.email = 'Enter a valid e-mail address.'
  return e
}

/**
 * Returns the process only when BOTH the id and the registered e-mail match. A wrong e-mail and an
 * unknown id give the same result (null), so the screen cannot reveal whether an id exists.
 */
export function lookupProcess(q: ProcessQuery, data: ProcessRecord[] = DEMO_PROCESSES): PublicProcess | null {
  const id = q.processId.trim().toLowerCase()
  const mail = q.email.trim().toLowerCase()
  const hit = data.find((p) => p.processId.toLowerCase() === id && p.email.toLowerCase() === mail)
  if (!hit) return null
  const { email: _email, ...pub } = hit
  void _email
  return pub
}

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) })
  })

export function createMockProcessAdapter(latencyMs = 600, data: ProcessRecord[] = DEMO_PROCESSES): ProcessAdapter {
  return {
    isDemo: true,
    async lookup(q, signal) {
      await delay(latencyMs, signal)
      return lookupProcess(q, data)
    },
  }
}
