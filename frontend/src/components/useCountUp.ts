import { useEffect, useState } from 'react'

/** "48", "₹2.4L", "32.5 h", "6.55M" -> the same text, counting up from zero once when it first shows. First render is the final text. */
export function useCountUp(text: string, ms = 900): string {
  const [shown, setShown] = useState(text)
  useEffect(() => {
    const m = /^(\D*)(\d[\d,]*\.?\d*)(.*)$/.exec(text)
    const calm = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!m || calm) { setShown(text); return }
    const target = parseFloat(m[2].replace(/,/g, ''))
    const decimals = (m[2].split('.')[1] ?? '').length
    const grouped = m[2].includes(',')
    const fmt = (v: number) => (grouped ? v.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : v.toFixed(decimals))
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(p >= 1 ? text : `${m[1]}${fmt(target * eased)}${m[3]}`)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, ms])
  return shown
}
