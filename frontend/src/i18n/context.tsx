import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { fill, localeOf, translate, type LangCode, type TFn } from './core'
import { DICTIONARY } from './index'

interface I18n { lang: LangCode; t: TFn }

/** The default is English, so components outside the services site (the workspace) are unaffected. */
const I18nContext = createContext<I18n>({ lang: 'en', t: (text, params) => fill(text, params) })

export function I18nProvider({ lang, children }: { lang: LangCode; children: ReactNode }) {
  const value = useMemo<I18n>(() => ({ lang, t: (text, params) => translate(DICTIONARY, lang, text, params) }), [lang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useT = (): TFn => useContext(I18nContext).t
export const useLang = (): LangCode => useContext(I18nContext).lang

/** Long date in the active language: "2 January 2026" in English, with local month names otherwise. */
export function formatDateLong(iso: string, lang: LangCode): string {
  return new Date(iso).toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Date formatter for the active language, for example "02 Sept 2026" or "02 सित॰ 2026". */
export function formatDate(iso: string | null, lang: LangCode): string {
  return iso ? new Date(iso).toLocaleDateString(localeOf(lang), { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}
