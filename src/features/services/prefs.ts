import { SVC_LANGUAGES, THEME_OPTIONS, TOPBAR_OPTIONS } from './data'

export type Topbar = (typeof TOPBAR_OPTIONS)[number]
export type ThemeColor = (typeof THEME_OPTIONS)[number]

export interface SitePrefs {
  language: string
  topbar: Topbar
  theme: ThemeColor
  noticeDismissed: boolean
}

export const DEFAULT_PREFS: SitePrefs = { language: 'English', topbar: 'Light', theme: 'Default', noticeDismissed: false }
export const PREFS_KEY = 'mycourt.services.prefs'

type ReadStore = Pick<Storage, 'getItem'>
type WriteStore = Pick<Storage, 'setItem'>

/** Keeps only valid values; anything else falls back to the default for that field. */
export function sanitizePrefs(raw: unknown): SitePrefs {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
  return {
    language: pick(r.language, SVC_LANGUAGES, DEFAULT_PREFS.language),
    topbar: pick(r.topbar, TOPBAR_OPTIONS, DEFAULT_PREFS.topbar),
    theme: pick(r.theme, THEME_OPTIONS, DEFAULT_PREFS.theme),
    noticeDismissed: r.noticeDismissed === true,
  }
}

function defaultStore(): Storage | undefined {
  try { return typeof window !== 'undefined' ? window.localStorage : undefined } catch { return undefined }
}

export function loadPrefs(store: ReadStore | undefined = defaultStore()): SitePrefs {
  try {
    const raw = store?.getItem(PREFS_KEY)
    return raw ? sanitizePrefs(JSON.parse(raw)) : DEFAULT_PREFS
  } catch { return DEFAULT_PREFS }
}

export function savePrefs(p: SitePrefs, store: WriteStore | undefined = defaultStore()): void {
  try { store?.setItem(PREFS_KEY, JSON.stringify(p)) } catch { /* storage unavailable: the choice lasts for this visit only */ }
}

/** CSS classes for the site root; accessibility classes live on <html> and take precedence. */
export function themeClasses(p: SitePrefs): string {
  return `theme-${p.theme.toLowerCase()} top-${p.topbar.toLowerCase()}`
}
