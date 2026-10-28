import { useEffect, useState } from 'react'
import { useT } from '../i18n/context'

type Flag = 'contrast' | 'invert' | 'gray' | 'sat' | 'links' | 'spacing' | 'lines' | 'noimg' | 'cursor'
interface Prefs { size: number; flags: Flag[] }
const DEFAULTS: Prefs = { size: 0, flags: [] }
const FLAGS: { id: Flag; label: string; cls: string }[] = [
  { id: 'contrast', label: 'High contrast', cls: 'hc' },
  { id: 'invert', label: 'Invert colours', cls: 'inv' },
  { id: 'gray', label: 'Grayscale', cls: 'gray' },
  { id: 'sat', label: 'Low saturation', cls: 'lowsat' },
  { id: 'links', label: 'Highlight links', cls: 'hl' },
  { id: 'spacing', label: 'Wider text spacing', cls: 'wide' },
  { id: 'lines', label: 'Taller line height', cls: 'tall' },
  { id: 'noimg', label: 'Hide images', cls: 'noimg' },
  { id: 'cursor', label: 'Big cursor', cls: 'bigcur' },
]
const KEY = 'mycourt.display'

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && Array.isArray(parsed.flags) ? { size: Number(parsed.size) || 0, flags: parsed.flags } : DEFAULTS
  } catch { return DEFAULTS }
}

export default function DisplaySettings({ label }: { label?: string } = {}) {
  const t = useT()
  const shown = label ?? t('Display settings')
  const [open, setOpen] = useState(false)
  const [p, setP] = useState<Prefs>(load)

  useEffect(() => {
    const root = document.documentElement
    root.style.fontSize = `${100 + p.size * 10}%`
    FLAGS.forEach((f) => root.classList.toggle(f.cls, p.flags.includes(f.id)))
    try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* storage unavailable */ }
  }, [p])

  const toggle = (k: Flag) => setP((s) => ({ ...s, flags: s.flags.includes(k) ? s.flags.filter((x) => x !== k) : [...s.flags, k] }))
  const size = (d: number) => setP((s) => ({ ...s, size: Math.max(-1, Math.min(3, s.size + d)) }))

  return (
    <div className="dispwrap">
      <button className="iconbtn" aria-expanded={open} aria-controls="dispmenu" onClick={() => setOpen((o) => !o)}>Aa<span className="sr-only"> {shown}</span></button>
      {open && (
        <div className="dispmenu" id="dispmenu" role="group" aria-label={shown} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
          <div className="actions">
            <button className="btn small" onClick={() => size(-1)} aria-label={t('Decrease text size')}>A−</button>
            <button className="btn small" onClick={() => setP((s) => ({ ...s, size: 0 }))}>A</button>
            <button className="btn small" onClick={() => size(1)} aria-label={t('Increase text size')}>A+</button>
          </div>
          {FLAGS.map((f) => (
            <label className="checkrow" key={f.id}><input type="checkbox" checked={p.flags.includes(f.id)} onChange={() => toggle(f.id)} /><div><strong>{t(f.label)}</strong></div></label>
          ))}
          <button className="btn small" onClick={() => setP(DEFAULTS)}>{t('Reset all')}</button>
        </div>
      )}
    </div>
  )
}
