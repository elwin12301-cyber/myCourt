/** Typed calls to the workspace API (contracts/api.md). Used only when VITE_API_URL is set. */
import { api } from './client'

export type Level = 'view' | 'edit' | 'owner'
export interface Page<T> { items: T[]; nextCursor: string | null }
export interface Matter {
  id: string; version: number; title: string; clientRef: string; status: 'open' | 'on_hold' | 'closed'
  courtCaseRef: string; isDemo: boolean; myLevel: Level; updatedAt: string
}
export interface Task { id: string; version: number; title: string; due: string | null; done: boolean }
export interface CalendarEntry {
  id: string; version: number; kind: 'hearing' | 'deadline' | 'meeting'; title: string; startsAt: string; endsAt: string | null
  note: string; approvedBy: string | null; approvedAt: string | null
}
export interface DocumentItem {
  id: string; version: number; name: string; fileType: string; reviewStatus: 'needs_review' | 'reviewed'
  extractedText: string; extractionConfidence: number | null; reviewedAt: string | null
}
export interface VoiceNote { id: string; version: number; transcript: string; language: string; reviewStatus: 'needs_review' | 'reviewed' }
export interface Source { label: string; reference: string }
export interface Draft {
  id: string; version: number; kind: string; title: string; body: string; sources: Source[]; status: 'draft' | 'approved'
  generatedBy: string; isDemoContent: boolean; label: string; approvals: { approvedBy: string; approvedAt: string; revokedAt: string | null }[]
}
export interface TimeEntry { id: string; version: number; workedOn: string; minutes: number; ratePaise: number; description: string }
export interface Invoice { id: string; version: number; number: string; status: 'draft' | 'approved'; totalPaise: number; lines: { description: string; amountPaise: number }[] }
export interface Assignment { personId: string; displayName: string; level: Level; grantedAt: string }
export interface AuditItem { id: string; time: string; personId: string | null; action: string; targetType: string; targetId: string; detail: string }
export interface DashboardData { matters: number; openTasks: number; draftsAwaitingApproval: number; unapprovedDeadlines: number; nextDates: CalendarEntry[] }

const q = (id: string) => encodeURIComponent(id)

export const matters = {
  list: () => api<Page<Matter>>('GET', '/matters?limit=200'),
  get: (id: string) => api<Matter>('GET', `/matters/${q(id)}`),
  create: (title: string, clientRef: string) => api<Matter>('POST', '/matters', { title, clientRef, isDemo: true }),
  update: (m: Matter, changes: Partial<Pick<Matter, 'title' | 'clientRef' | 'status'>>) => api<Matter>('PATCH', `/matters/${q(m.id)}`, { version: m.version, ...changes }),
  remove: (m: Matter) => api<{ status: string }>('DELETE', `/matters/${q(m.id)}?confirm=${encodeURIComponent(m.title)}`),
  assignments: (id: string) => api<Assignment[]>('GET', `/matters/${q(id)}/assignments`),
  findPerson: (email: string) => api<{ id: string; displayName: string }>('POST', '/people/lookup', { email }),
  share: (id: string, personId: string, level: Level) => api<Assignment>('PUT', `/matters/${q(id)}/assignments/${q(personId)}`, { level }),
  unshare: (id: string, personId: string) => api<{ status: string }>('DELETE', `/matters/${q(id)}/assignments/${q(personId)}`),
  audit: (id: string) => api<Page<AuditItem>>('GET', `/matters/${q(id)}/audit?limit=100`),
  verifyAudit: (id: string) => api<{ ok: boolean; firstBadId: string | null }>('GET', `/matters/${q(id)}/audit/verify`),
}

const child = <T extends { id: string; version: number }>(name: string) => ({
  list: (m: string) => api<Page<T>>('GET', `/matters/${q(m)}/${name}?limit=200`),
  create: (m: string, body: unknown) => api<T>('POST', `/matters/${q(m)}/${name}`, body),
  update: (m: string, item: T, body: unknown) => api<T>('PATCH', `/matters/${q(m)}/${name}/${q(item.id)}`, { version: item.version, ...(body as object) }),
  remove: (m: string, item: T) => api<{ status: string }>('DELETE', `/matters/${q(m)}/${name}/${q(item.id)}`),
  action: (m: string, item: T, action: string) => api<T>('POST', `/matters/${q(m)}/${name}/${q(item.id)}/${action}`, {}),
})

export const tasks = child<Task>('tasks')
export const calendar = child<CalendarEntry>('calendar')
export const documents = child<DocumentItem>('documents')
export const voiceNotes = child<VoiceNote>('voice-notes')
export const drafts = {
  ...child<Draft>('drafts'),
  approve: (m: string, d: Draft) => api<Draft>('POST', `/matters/${q(m)}/drafts/${q(d.id)}/approve`, {}),
  research: (m: string, query: string) => api<Draft>('POST', `/matters/${q(m)}/research`, { query }),
  mapping: (m: string, query: string) => api<Draft>('POST', `/matters/${q(m)}/mappings`, { query }),
}
export const timeEntries = child<TimeEntry>('time-entries')
export const invoices = {
  ...child<Invoice>('invoices'),
  approve: (m: string, inv: Invoice) => api<Invoice>('POST', `/matters/${q(m)}/invoices/${q(inv.id)}/approve`, {}),
}
export const dashboard = () => api<DashboardData>('GET', '/dashboard')

export const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const canEdit = (level: Level) => level === 'edit' || level === 'owner'

export interface ChatMessage { role: 'user' | 'assistant'; body: string; position: number }
export interface Conversation { id: string; title: string; matterId: string | null; messages?: ChatMessage[] }
export const conversations = {
  list: () => api<Page<Conversation>>('GET', '/conversations'),
  create: (title: string, matterId: string | null) => api<Conversation>('POST', '/conversations', { title, matterId }),
  get: (id: string) => api<Conversation>('GET', `/conversations/${q(id)}`),
  send: (id: string, body: string) => api<Conversation>('POST', `/conversations/${q(id)}/messages`, { body }),
}

export type Conflict = 'not_checked' | 'needs_review' | 'clear'
export interface Intake {
  id: string; version: number; prospectName: string; contact: string; summary: string
  conflictCheck: Conflict; conflictNote: string; confirmedAt: string | null; matterId: string | null
}
export const intake = {
  list: () => api<Page<Intake>>('GET', '/intake'),
  create: (prospectName: string, contact: string, summary: string) => api<Intake>('POST', '/intake', { prospectName, contact, summary }),
  confirm: (id: string, result: 'clear' | 'needs_review', note: string) => api<Intake>('POST', `/intake/${q(id)}/conflict-check/confirm`, { result, note }),
  convert: (id: string) => api<Matter>('POST', `/intake/${q(id)}/convert`, {}),
}

/** Calendar entries across every matter the person can see (default: from yesterday for about two months). */
export const calendarAll = () => api<Page<CalendarEntry & { matterId?: string }>>('GET', '/calendar')
