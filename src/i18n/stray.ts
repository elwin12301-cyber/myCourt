import { ALLOWED_LATIN } from './core'

/** Words that may stay in Latin letters on a translated page. */
export const PAGE_LATIN = new Set([
  ...ALLOWED_LATIN, 'YouTube', 'Google', 'Play', 'App', 'Store', 'eC', 'http', 'https', 'www', 'com', 'org', 'nic', 'gov',
  'English', 'Aa', 'DEMO', 'demo', 'TNCH', 'MHAU', 'ERROR', 'PRC', 'MAH', 'example', 'invalid', 'advocate', 'one', 'e', 'g',
])

/** Text a user (or screen reader) meets: text nodes plus aria-label, placeholder, title and alt values. */
export function visibleText(html: string): string {
  const withoutEnglishLine = html.replace(/<span lang="en">[\s\S]*?<\/span>/g, ' ')
  const attrs = [...withoutEnglishLine.matchAll(/\b(?:aria-label|placeholder|title|alt)="([^"]*)"/g)].map((m) => m[1])
  const text = withoutEnglishLine.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  return [text, ...attrs].join(' ')
    .replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;|&gt;/g, ' ')
}

/** English words left on a translated page, ignoring URLs, e-mail forms, numbers and allowed technical terms. */
export function strayEnglish(html: string): string[] {
  const text = visibleText(html)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[\w.-]+\[at\][\w[\].-]+/g, ' ')
    .replace(/\b[\w-]+(?:\.[\w-]+)+\b/g, ' ')
    .replace(/\{[A-Za-z0-9_]+\}/g, ' ')
  return [...new Set((text.match(/[A-Za-z]+/g) ?? []).filter((w) => !PAGE_LATIN.has(w)))]
}
