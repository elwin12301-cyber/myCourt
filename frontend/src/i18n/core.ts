export type LangCode = 'en' | 'hi' | 'mr' | 'gu' | 'kn' | 'ta'
export type TranslatedLang = Exclude<LangCode, 'en'>

export interface LangInfo {
  code: LangCode
  /** The label shown in the language selector (and stored in the preferences). */
  label: string
  /** BCP 47 locale, used for dates and for the page `lang` attribute. */
  locale: string
  /** Unicode script letters expected in translated text; null for English. */
  script: RegExp | null
}

export const LANGS: LangInfo[] = [
  { code: 'en', label: 'English', locale: 'en-IN', script: null },
  { code: 'hi', label: 'हिन्दी', locale: 'hi-IN', script: /\p{Script=Devanagari}/u },
  { code: 'mr', label: 'मराठी', locale: 'mr-IN', script: /\p{Script=Devanagari}/u },
  { code: 'gu', label: 'ગુજરાતી', locale: 'gu-IN', script: /\p{Script=Gujarati}/u },
  { code: 'kn', label: 'ಕನ್ನಡ', locale: 'kn-IN', script: /\p{Script=Kannada}/u },
  { code: 'ta', label: 'தமிழ்', locale: 'ta-IN', script: /\p{Script=Tamil}/u },
]

export const TRANSLATED: TranslatedLang[] = ['hi', 'mr', 'gu', 'kn', 'ta']

/** One English text and its five translations, in this order. A missing language is a compile error. */
export type Row = readonly [en: string, hi: string, mr: string, gu: string, kn: string, ta: string]
export type Translation = Record<TranslatedLang, string>
export type Params = Record<string, string | number>
export type TFn = (text: string, params?: Params) => string

interface Template { regex: RegExp; names: string[]; tr: Translation }
export interface Dictionary {
  exact: Map<string, Translation>
  templates: Template[]
  /** English texts that appear in more than one row (a data error). */
  duplicates: string[]
}

const PLACEHOLDER = /\{([A-Za-z0-9_]+)\}/g

export function placeholdersOf(text: string): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1]))]
}

/** Replaces `{name}` with the given values; names without a value are left as they are. */
export function fill(text: string, params?: Params): string {
  if (!params) return text
  return text.replace(PLACEHOLDER, (whole, name: string) => (name in params ? String(params[name]) : whole))
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function toTemplate(english: string, tr: Translation): Template {
  const names: string[] = []
  const pattern = english.split(PLACEHOLDER).map((part, i) => {
    if (i % 2 === 1) { names.push(part); return '(.+?)' }
    return escapeRegex(part)
  }).join('')
  return { regex: new RegExp(`^${pattern}$`), names, tr }
}

export function buildDictionary(rows: readonly Row[]): Dictionary {
  const exact = new Map<string, Translation>()
  const templates: Template[] = []
  const duplicates: string[] = []
  for (const [en, hi, mr, gu, kn, ta] of rows) {
    const tr: Translation = { hi, mr, gu, kn, ta }
    if (exact.has(en)) duplicates.push(en)
    exact.set(en, tr)
    if (placeholdersOf(en).length) templates.push(toTemplate(en, tr))
  }
  return { exact, templates, duplicates }
}

/** English texts that were asked for in a language but had no translation (tests assert this stays empty). */
export const missed = new Set<string>()
export const resetMissed = () => missed.clear()

export function translate(dict: Dictionary, lang: LangCode, text: string, params?: Params): string {
  if (lang === 'en') return fill(text, params)
  // Text with no Latin letters (digits, punctuation, or text that is already translated) has nothing to translate.
  if (!/[A-Za-z]/.test(text)) return fill(text, params)
  const hit = dict.exact.get(text)
  if (hit) return fill(hit[lang], params)
  if (!params) {
    for (const t of dict.templates) {
      const m = t.regex.exec(text)
      if (!m) continue
      const values: Params = {}
      t.names.forEach((n, i) => {
        // A captured value may itself have a row (for example a state name); otherwise it is kept as typed.
        values[n] = dict.exact.get(m[i + 1])?.[lang] ?? m[i + 1]
      })
      return fill(t.tr[lang], values)
    }
  }
  missed.add(text)
  return fill(text, params)
}

export function langFromLabel(label: string): LangCode {
  return LANGS.find((l) => l.label === label)?.code ?? 'en'
}

export const localeOf = (lang: LangCode): string => LANGS.find((l) => l.code === lang)?.locale ?? 'en-IN'

/** Latin-letter words that may legitimately stay in a translation (abbreviations and technical terms). */
export const ALLOWED_LATIN = new Set([
  'CNR', 'PDF', 'NJDG', 'NIC', 'FIR', 'IA', 'URL', 'WCAG', 'AAA', 'JAWS', 'NVDA', 'SAFA', 'Supernova', 'Hal', 'NICSI', 'ICT',
  'CPC', 'CIS', 'ePay', 'eFiling', 'NSTEP', 'LeGRAA', 'at', 'dot', 'aij', 'gov', 'in', 'IPC', 'CrPC', 'BNS', 'BNSS', 'BSA',
  'CC', 'CS', 'WP', 'MP', 'CRL', 'A', 'No', 'II', 'I', 'CSV', 'SMS', 'ID',
  // Brand and keyboard key names that stay in Latin letters.
  'myCourt', 'Enter', 'Alt', 'Down', 'Arrow', 'Esc', 'Tab',
  // Example codes and a fictional name, typed as-is into the English-valued fields.
  'MHAU', 'TNCH', 'MAH', 'XXXX', 'ERROR', 'Kumar', 'STATE', 'NUMBER', 'YEAR', 'PRC', 'DEMO', 'advocate', 'one', 'example', 'invalid', 'KB', 'MB', 'http',
])
