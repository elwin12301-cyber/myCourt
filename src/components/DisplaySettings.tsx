import { useEffect, useState } from 'react'

interface Prefs { size: number; contrast: boolean; spacing: boolean; links: boolean }
const DEFAULTS: Prefs = { size: 0, contrast: false, spacing: false, links: false }
const KEY = 'mycourt.display'

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch { return DEFAULTS }
}

export default function DisplaySettings() {
  const [open, setOpen] = useState(false)
  const [p, setP] = useState<Prefs>(load)

  useEffect(() => {
    const root = document.documentElement
    root.style.fontSize = `${100 + p.size * 10}%`
    root.classList.toggle('hc', p.contrast)
    root.classList.toggle('wide', p.spacing)
    root.classList.toggle('hl', p.links)
    try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* storage unavailable */ }
  }, [p])

  const toggle = (k: 'contrast' | 'spacing' | 'links') => setP((s) => ({ ...s, [k]: !s[k] }))
  const size = (d: number) => setP((s) => ({ ...s, size: Math.max(-1, Math.min(3, s.size + d)) }))

  return (
    <div className="dispwrap">
      <button className="iconbtn" aria-expanded={open} aria-controls="dispmenu" onClick={() => setOpen((o) => !o)}>Aa<span className="sr-only"> Display settings</span></button>
      {open && (
        <div className="dispmenu" id="dispmenu" role="group" aria-label="Display settings" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
          <div className="actions">
            <button className="btn small" onClick={() => size(-1)} aria-label="Decrease text size">A−</button>
            <button className="btn small" onClick={() => setP((s) => ({ ...s, size: 0 }))}>A</button>
            <button className="btn small" onClick={() => size(1)} aria-label="Increase text size">A+</button>
          </div>
          <label className="checkrow"><input type="checkbox" checked={p.contrast} onChange={() => toggle('contrast')} /><div><strong>High contrast</strong></div></label>
          <label className="checkrow"><input type="checkbox" checked={p.spacing} onChange={() => toggle('spacing')} /><div><strong>Wider text spacing</strong></div></label>
          <label className="checkrow"><input type="checkbox" checked={p.links} onChange={() => toggle('links')} /><div><strong>Highlight links</strong></div></label>
          <button className="btn small" onClick={() => setP(DEFAULTS)}>Reset all</button>
        </div>
      )}
    </div>
  )
}
