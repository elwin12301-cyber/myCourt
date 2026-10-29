import { bestMatch, normalise } from './match'

/** Carrying out voice actions on the page the person is looking at. Every function says what happened, so it can be shown and spoken. */
export interface Outcome { ok: boolean; say: string }

const CONTROLS = 'button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="checkbox"], summary, input, select, textarea, [role="combobox"]'

const visible = (el: Element): boolean => {
  const h = el as HTMLElement
  if (h.hidden || el.closest('[hidden], [aria-hidden="true"], .sr-only, #voice-status, #voice-numbers, #voice-replies, #voice-launcher')) return false
  if ((h as HTMLButtonElement).disabled) return false
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

const textOf = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim()

/** The name a person would say for a control: its label, aria-label, own text or placeholder. */
export function nameOf(el: Element): string {
  const e = el as HTMLInputElement
  const aria = el.getAttribute('aria-label')
  const by = el.getAttribute('aria-labelledby')
  const parts: string[] = []
  if (aria) parts.push(aria)
  if (by) parts.push(by.split(' ').map((id) => textOf(document.getElementById(id))).join(' '))
  if (e.labels && e.labels.length) parts.push([...e.labels].map((l) => textOf(l)).join(' '))
  if (el.tagName === 'INPUT' && ['button', 'submit'].includes(e.type)) parts.push(e.value)
  if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) parts.push(textOf(el))
  if (e.placeholder) parts.push(e.placeholder)
  if (el.getAttribute('title')) parts.push(el.getAttribute('title') as string)
  if (e.name) parts.push(e.name.replace(/([A-Z])/g, ' $1'))
  if (e.id) parts.push(e.id.replace(/[-_]/g, ' '))
  return parts.filter(Boolean).join(' ')
}

export function controls(root: ParentNode = document): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(CONTROLS)].filter(visible)
}

export function findControl(name: string, kinds?: string): HTMLElement | null {
  const list = controls().filter((el) => !kinds || el.matches(kinds))
  const i = bestMatch(name, list.map(nameOf))
  return i < 0 ? null : list[i]
}

const flash = (el: HTMLElement) => {
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  const old = el.style.outline
  el.style.outline = '3px solid #b8893b'
  window.setTimeout(() => { el.style.outline = old }, 900)
}

/** React ignores `el.value = x`; the native setter plus an input event is what its onChange listens to. */
export function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value)
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
}

const isText = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement =>
  !!el && ((el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'file', 'range', 'color'].includes((el as HTMLInputElement).type)) || el.tagName === 'TEXTAREA')

/** Presses a control, or moves into it when it is a field or list. */
export function activate(el: HTMLElement, name = ''): Outcome {
  flash(el)
  const label = nameOf(el).split(' ').slice(0, 5).join(' ') || name
  if (isText(el) || el.tagName === 'SELECT') { el.focus(); return { ok: true, say: `In ${label}.` } }
  el.click()
  return { ok: true, say: `Pressed ${label}.` }
}

export function click(name: string): Outcome {
  const el = findControl(name)
  if (!el) return { ok: false, say: `I could not find “${name}” on this screen.` }
  return activate(el, name)
}

export function focus(name: string): Outcome {
  const el = findControl(name, 'input, select, textarea, [role="combobox"]')
  if (!el) return { ok: false, say: `I could not find a field called “${name}”.` }
  flash(el); el.focus()
  return { ok: true, say: `In ${name}. Say what to type.` }
}

export function type(text: string, append = false): Outcome {
  const el = document.activeElement
  if (!isText(el)) return { ok: false, say: 'Say “focus” and a field name first, so I know where to type.' }
  setNativeValue(el, append && el.value ? `${el.value} ${text}` : text)
  return { ok: true, say: 'Typed.' }
}

export function clear(): Outcome {
  const el = document.activeElement
  if (!isText(el)) return { ok: false, say: 'No field is selected.' }
  setNativeValue(el, '')
  return { ok: true, say: 'Cleared.' }
}

/** Fills a named field: text goes in, a list gets the closest option, a box gets ticked. */
export function set(name: string, value: string): Outcome {
  const el = findControl(name, 'input, select, textarea')
  if (!el) return { ok: false, say: `I could not find a field called “${name}”.` }
  flash(el)
  if (el instanceof HTMLSelectElement) {
    const opts = [...el.options]
    const i = bestMatch(value, opts.map((o) => o.text))
    if (i < 0) return { ok: false, say: `“${value}” is not one of the choices in ${name}.` }
    setNativeValue(el, opts[i].value)
    return { ok: true, say: `${name}: ${opts[i].text}.` }
  }
  if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
    const on = !/^(no|off|false|untick|unchecked)$/i.test(value.trim())
    if (el.checked !== on) el.click()
    return { ok: true, say: `${name} ${on ? 'ticked' : 'cleared'}.` }
  }
  if (isText(el)) {
    const v = el.type === 'number' ? (value.replace(/[^\d.-]/g, '') || value) : value
    setNativeValue(el, v)
    return { ok: true, say: `${name} set.` }
  }
  return { ok: false, say: `I cannot fill ${name}.` }
}

export function check(name: string, on: boolean): Outcome {
  const el = findControl(name, 'input[type="checkbox"], [role="checkbox"], input[type="radio"]')
  if (!el) return { ok: false, say: `I could not find a box called “${name}”.` }
  flash(el)
  const now = (el as HTMLInputElement).checked ?? el.getAttribute('aria-checked') === 'true'
  if (now !== on) el.click()
  return { ok: true, say: `${name} ${on ? 'ticked' : 'cleared'}.` }
}

/** Moves to the next or previous control in tab order. */
export function step(dir: 1 | -1): Outcome {
  const list = controls().filter((el) => el.tabIndex >= 0 && (isText(el) || el.tagName === 'SELECT' || el.tagName === 'BUTTON' || el.tagName === 'A'))
  const i = list.indexOf(document.activeElement as HTMLElement)
  const next = list[(i + dir + list.length) % list.length]
  if (!next) return { ok: false, say: 'Nothing to move to.' }
  flash(next); next.focus()
  return { ok: true, say: nameOf(next).split(' ').slice(0, 4).join(' ') || 'Next.' }
}

export function submit(): Outcome {
  const active = document.activeElement as HTMLElement | null
  const form = (active?.closest('form') ?? document.querySelector('main form')) as HTMLFormElement | null
  if (!form) return { ok: false, say: 'There is no form to submit here.' }
  const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]:not(:disabled)')
  if (btn) btn.click(); else form.requestSubmit()
  return { ok: true, say: 'Submitted.' }
}

export function scroll(dir: 'up' | 'down' | 'top' | 'bottom'): Outcome {
  const h = window.innerHeight * 0.8
  if (dir === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
  else if (dir === 'bottom') window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  else window.scrollBy({ top: dir === 'down' ? h : -h, behavior: 'smooth' })
  return { ok: true, say: `Scrolled ${dir}.` }
}

/** The current screen's heading and sub-heading, for "read page". */
export function pageSummary(): string {
  const main = document.querySelector('main') ?? document.body
  const h = textOf(main.querySelector('h1, h2'))
  const sub = textOf(main.querySelector('.sub'))
  return [h, sub].filter(Boolean).join('. ') || 'This screen has no heading.'
}

let spokeAt = 0

/** True while the app is talking and for a moment after, so the microphone does not mistake the app's own voice for a command. */
export function isSpeaking(): boolean {
  try { return window.speechSynthesis?.speaking === true || Date.now() - spokeAt < 800 } catch { return false }
}

export function speak(text: string) {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text); u.rate = 1.05
    u.onend = () => { spokeAt = Date.now() }
    u.onerror = () => { spokeAt = Date.now() }
    window.speechSynthesis.speak(u)
  } catch { /* speech output is optional */ }
}

export { normalise }
