import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
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
      <Button variant="outlined" size="small" aria-expanded={open} aria-controls="dispmenu" onClick={() => setOpen((o) => !o)}>Aa<span className="sr-only"> {shown}</span></Button>
      {open && (
        <Paper className="dispmenu" id="dispmenu" role="group" aria-label={shown} elevation={4} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
          <ButtonGroup size="small" aria-label={shown} sx={{ mb: 1 }}>
            <Button onClick={() => size(-1)} aria-label={t('Decrease text size')}>A−</Button>
            <Button onClick={() => setP((s) => ({ ...s, size: 0 }))}>A</Button>
            <Button onClick={() => size(1)} aria-label={t('Increase text size')}>A+</Button>
          </ButtonGroup>
          {FLAGS.map((f) => (
            <FormControlLabel key={f.id} sx={{ display: 'flex', m: 0 }} control={<Checkbox size="small" checked={p.flags.includes(f.id)} onChange={() => toggle(f.id)} />} label={<strong>{t(f.label)}</strong>} />
          ))}
          <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={() => setP(DEFAULTS)}>{t('Reset all')}</Button>
        </Paper>
      )}
    </div>
  )
}
