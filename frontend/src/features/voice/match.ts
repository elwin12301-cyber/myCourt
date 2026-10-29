/** Matching a spoken name ("client name", "save") to the controls on the screen. Pure, so it can be tested without a browser. */

export const normalise = (s: string): string =>
  s.toLowerCase().replace(/[↗↑↓←→✕●■★*:()?!.,;'"“”‘’·]/g, ' ').replace(/\s+/g, ' ').trim()

const STOP = new Set(['the', 'a', 'an', 'button', 'link', 'field', 'box', 'tab', 'option', 'please', 'to', 'of'])
const tokens = (s: string): string[] => normalise(s).split(' ').filter((t) => t && !STOP.has(t))

/** 0 = no match; higher is better. Exact > starts with > contains > shared words. */
export function score(query: string, name: string): number {
  const q = normalise(query), n = normalise(name)
  if (!q || !n) return 0
  if (q === n) return 100
  if (n.startsWith(q)) return 80 - Math.min(20, n.length - q.length)
  if (n.includes(q)) return 60 - Math.min(20, n.length - q.length)
  const qt = tokens(q), nt = tokens(n)
  if (!qt.length || !nt.length) return 0
  const hit = qt.filter((t) => nt.some((x) => x === t || x.startsWith(t) || t.startsWith(x))).length
  if (hit === 0) return 0
  const ratio = hit / qt.length
  return ratio === 1 ? 40 : ratio >= 0.6 ? 25 : 0
}

/** Index of the best name for `query`, or -1 when nothing is a convincing match. */
export function bestMatch(query: string, names: string[]): number {
  let best = -1, top = 0
  names.forEach((n, i) => { const s = score(query, n); if (s > top) { top = s; best = i } })
  return top >= 25 ? best : -1
}
