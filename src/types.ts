import type { ReactNode } from 'react'

export type PageId =
  | 'dashboard' | 'cases' | 'caseStatus' | 'caseDetail' | 'assistant' | 'research' | 'documents'
  | 'mapping' | 'voice' | 'hearing' | 'calendar' | 'intake' | 'billing'
  | 'portalHome' | 'portalAbout' | 'portalHighCourts' | 'portalDistrict' | 'portalForms'
  | 'portalContact' | 'portalHelp' | 'portalSearch'

export interface ChatMessage { role: 'user' | 'assistant'; title: string; text: string }
export interface Task { title: string; due: string; done: boolean }
export interface DocItem { name: string; type: string; status: string; confidence: string }

export interface ModalConfig {
  title: string
  body: ReactNode
  onSave?: (data: FormData) => void
}

export interface AppContextValue {
  go: (p: PageId) => void
  toast: (msg: string) => void
  openModal: (cfg: ModalConfig) => void
  tasks: Task[]
  setTasks: (updater: (t: Task[]) => Task[]) => void
  docs: DocItem[]
  setDocs: (updater: (d: DocItem[]) => DocItem[]) => void
  messages: ChatMessage[]
  setMessages: (updater: (m: ChatMessage[]) => ChatMessage[]) => void
  transcript: string
  setTranscript: (t: string) => void
  researchQuery: string
  setResearchQuery: (q: string) => void
}
