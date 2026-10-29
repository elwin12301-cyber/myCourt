import { useEffect, useState } from 'react'
import { useT } from '../i18n/context'
import { Button, ButtonGroup, Checkbox, FormControlLabel, Paper } from './kit'

type Flag = 'contrast' | 'invert' | 'gray' | 'sat' | 'links' | 'spacing' | 'lines' | 'noimg' | 'cursor'
interface Prefs { size: number; flags: Flag[] }
const DEFAULTS: Prefs = { size: 0, flags: [] }
/** Every option, with the official wording and its group. The class is put on <html>; styles.css does the rest. */
const FLAGS: { id: Flag; label: string; cls: string; group: 'color' | 'text' | 'other' }[] = [
  { id: 'contrast', label: 'High Contrast', cls: 'hc', group: 'color' },
  { id: 'links', label: 'Highlight Links', cls: 'hl', group: 'color' },
  { id: 'invert', label: 'Invert Saturation', cls: 'inv', group: 'color' },
  { id: 'spacing', label: 'Text Spacing', cls: 'wide', group: 'text' },
  { id: 'lines', label: 'Line Height', cls: 'tall', group: 'text' },
  { id: 'noimg', label: 'Hide Images', cls: 'noimg', group: 'other' },
  { id: 'cursor', label: 'Big Cursor', cls: 'bigcur', group: 'other' },
  { id: 'gray', label: 'Grayscale', cls: 'gray', group: 'other' },
  { id: 'sat', label: 'Low saturation', cls: 'lowsat', group: 'other' },
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

  // Voice control and other tools change the display through this event.
  useEffect(() => {
    const on = (e: Event) => {
      const c = (e as CustomEvent<string>).detail
      setP((s) => {
        const flags = (f: Flag, add: boolean) => (add ? [...new Set([...s.flags, f])] : s.flags.filter((x) => x !== f))
        if (c === 'bigger') return { ...s, size: Math.min(3, s.size + 1) }
        if (c === 'smaller') return { ...s, size: Math.max(-1, s.size - 1) }
        if (c === 'normal') return { ...s, size: 0 }
        if (c === 'contrast-on') return { ...s, flags: flags('contrast', true) }
        if (c === 'contrast-off') return { ...s, flags: flags('contrast', false) }
        if (c === 'reset') return DEFAULTS
        return s
      })
    }
    window.addEventListener('mycourt:display', on)
    return () => window.removeEventListener('mycourt:display', on)
  }, [])

  const toggle = (k: Flag) => setP((s) => ({ ...s, flags: s.flags.includes(k) ? s.flags.filter((x) => x !== k) : [...s.flags, k] }))
  const size = (d: number) => setP((s) => ({ ...s, size: Math.max(-1, Math.min(3, s.size + d)) }))

  const normalContrast = () => setP((s) => ({ ...s, flags: s.flags.filter((f) => f !== 'contrast' && f !== 'invert' && f !== 'gray' && f !== 'sat') }))
  const box = (f: (typeof FLAGS)[number]) => (
    <FormControlLabel key={f.id} style={{ display: 'flex', margin: 0 }} control={<Checkbox size="small" checked={p.flags.includes(f.id)} onChange={() => toggle(f.id)} />} label={<strong>{t(f.label)}</strong>} />
  )
  return (
    <div className="dispwrap">
      <Button variant="outlined" size="small" aria-expanded={open} aria-controls="dispmenu" onClick={() => setOpen((o) => !o)}>Aa<span className="sr-only"> {shown}</span></Button>
      {open && (
        <Paper className="dispmenu" id="dispmenu" role="group" aria-label={shown} elevation={4} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
          <h4 className="dispttl">{t('Accessibility Tools')}</h4>
          <fieldset className="dispgroup">
            <legend>{t('Color Contrast')}</legend>
            {FLAGS.filter((f) => f.group === 'color' && f.id === 'contrast').map(box)}
            <Button size="small" variant="outlined" style={{ margin: '4px 0' }} onClick={normalContrast}>{t('Normal Contrast')}</Button>
            {FLAGS.filter((f) => f.group === 'color' && f.id !== 'contrast').map(box)}
          </fieldset>
          <fieldset className="dispgroup">
            <legend>{t('Text Size')}</legend>
            <ButtonGroup size="small" aria-label={t('Text Size')} style={{ marginBottom: 6, flexWrap: 'wrap' }}>
              <Button onClick={() => size(1)}>{t('A+ Font Size Increase')}</Button>
              <Button onClick={() => size(-1)}>{t('A− Font Size Decrease')}</Button>
              <Button onClick={() => setP((s) => ({ ...s, size: 0 }))}>{t('A Normal Font')}</Button>
            </ButtonGroup>
            {FLAGS.filter((f) => f.group === 'text').map(box)}
          </fieldset>
          <fieldset className="dispgroup">
            <legend>{t('Others')}</legend>
            {FLAGS.filter((f) => f.group === 'other').map(box)}
          </fieldset>
          <Button size="small" variant="outlined" style={{ marginTop: 8 }} onClick={() => setP(DEFAULTS)}>{t('Reset all settings')}</Button>
        </Paper>
      )}
    </div>
  )
}
