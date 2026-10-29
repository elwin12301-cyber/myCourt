// Browser check for app-wide voice control (spec 005). Runs the frontend WITHOUT VITE_API_URL (mock data), so no backend is needed:
//   frontend/: npm run dev -- --port 5174
//   node specs/005-voice-control/browser-check.mjs <output-folder>      (APP_URL defaults to http://localhost:5174/)
// A microphone cannot be used in headless Chrome, so commands go through the typed-command box (Alt+C), which runs the same
// parser and the same page actions as spoken commands.
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = process.env.APP_URL || 'http://localhost:5174/'
const OUT = process.argv[2] || tmpdir()
const PORT = 9471
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const dir = mkdtempSync(join(tmpdir(), 'cdp-vc-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' })
const results = []
const log = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`) }

try {
  let targets
  for (let i = 0; i < 25; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break } catch { await sleep(300) } }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r))
  let id = 0; const pending = new Map()
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } })
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval error'); return r.result.result.value }
  const setup = `window.__t = {
    setv(sel, v) { const el = document.querySelector(sel); if (!el) throw new Error('missing ' + sel); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) },
    clickText(t) { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(t) && !x.disabled); if (!b) throw new Error('no button ' + t); b.click() },
    altKey(k) { window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: k, bubbles: true })) },
    toast() { return document.querySelector('.MuiSnackbarContent-message')?.textContent || '' }
  }; true`
  const load = async (hash = '', w = 1280, h = 1000) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
    await send('Page.enable'); await send('Page.navigate', { url: 'about:blank' }); await sleep(150)
    await send('Page.navigate', { url: BASE + hash }); await sleep(2200); await ev(setup)
  }
  /** Opens the typed-command box (Alt+C), types the phrase and runs it; then waits for the action and returns the message shown. */
  const say = async (phrase, wait = 900) => {
    await ev(`__t.altKey('c')`); await sleep(500)
    await ev(`__t.setv('#voice-cmd', ${JSON.stringify(phrase)})`); await ev(`__t.clickText('Run command')`)
    await sleep(wait)
    return ev('__t.toast()')
  }
  const hash = () => ev('location.hash')

  await load('#/intake')
  log('V1 a Voice button is in the top bar and is not pressed at start', await ev(`document.querySelector('#voice-toggle')?.getAttribute('aria-pressed') === 'false'`))
  await ev(`__t.altKey('c')`); await sleep(600)
  log('V2 Alt+C opens a box to type a command, with the list of commands', (await ev(`!!document.querySelector('#voice-cmd')`)) && (await ev(`document.body.innerText.includes('Move around')`)))
  await ev(`__t.setv('#voice-cmd', 'open calendar')`); await ev(`__t.clickText('Run command')`); await sleep(900)
  log('V3 "open calendar" goes to the calendar', (await hash()) === '#/calendar', await hash())
  await say('open client intake')
  log('V4 "open client intake" goes to intake', (await hash()) === '#/intake', await hash())

  await say('focus client name')
  log('V5 "focus client name" moves into that field', await ev(`document.activeElement?.placeholder === 'Full legal name'`))
  await say('type Test Client (demo)')
  log('V6 "type ..." fills the field', await ev(`document.activeElement?.value === 'Test Client (demo)'`), await ev('document.activeElement?.value'))
  await say('set opposing party to Other Side (demo)')
  log('V7 "set <field> to <value>" fills a named field', await ev(`[...document.querySelectorAll('input')].some((i) => i.placeholder === 'Name / entity' && i.value === 'Other Side (demo)')`))
  await say('set potential conflict check to clear')
  log('V8 "set <list> to <choice>" picks the closest option', await ev(`[...document.querySelectorAll('select')].some((s) => s.value.startsWith('Clear'))`))
  await say('click save intake draft', 1100)
  log('V9 "click <button name>" presses it', await ev(`document.body.innerText.includes('Intake draft saved')`))

  await say('open billing')
  await say('set hours to 3')
  log('V10 a number is entered and the screen reacts (3 h x 2500 = 7,500)', await ev(`document.body.innerText.includes('7,500')`))
  const miss = await say('click the flux capacitor')
  log('V11 an impossible target gets a plain "could not find" answer', miss.includes('could not find'), miss)
  const huh = await say('flibbertigibbet')
  log('V12 an unknown phrase says it did not understand', huh.includes('did not understand'), huh)

  await say('make text bigger')
  const big = await ev(`document.documentElement.style.fontSize`)
  await say('normal text size')
  const norm = await ev(`document.documentElement.style.fontSize`)
  log('V13 "make text bigger" and "normal text size" change the display', big === '110%' && norm === '100%', `${big} -> ${norm}`)
  await say('high contrast on')
  const hc = await ev(`document.documentElement.classList.contains('hc')`)
  await say('reset display')
  log('V14 "high contrast on" and "reset display" work', hc === true && (await ev(`!document.documentElement.classList.contains('hc')`)))

  await load('#/portalHome')
  await say('scroll down', 1300)
  log('V15 "scroll down" scrolls the page', (await ev('window.scrollY')) > 100, String(await ev('window.scrollY')))
  await say('go to top', 1300)
  log('V16 "go to top" scrolls back', (await ev('window.scrollY')) < 5)
  await load('#/intake')
  await say('focus jurisdiction'); await say('start dictation')
  await say('Madras High Court')
  log('V17 during dictation spoken words are typed into the field', await ev(`[...document.querySelectorAll('input')].some((i) => i.placeholder === 'Court, state, jurisdiction' && i.value.includes('Madras High Court'))`))
  await say('stop dictation')
  await say('read page', 600)
  log('V18 "read page" answers with the screen heading', (await ev('__t.toast()')).length > 5, await ev('__t.toast()'))

  // consent flow (needs a browser with speech recognition; Chrome has it)
  await load('#/dashboard')
  await ev(`document.querySelector('#voice-toggle').click()`); await sleep(700)
  const warned = await ev(`document.body.innerText.includes('sent to the browser vendor')`)
  const turnOnDisabled = await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Turn on')?.disabled === true`)
  log('V19 turning voice on first shows the privacy warning and needs agreement', warned && turnOnDisabled)

  // the bar, numbers and replies (agree to the privacy warning, then use the bar)
  await load('#/cases')
  await ev(`document.querySelector('#voice-toggle').click()`); await sleep(600)
  await ev(`document.querySelector('[role=dialog] input[type=checkbox]').click()`); await sleep(200)
  await ev(`__t.clickText('Turn on')`); await sleep(900)
  const barButtons = await ev(`[...document.querySelectorAll('#voice-status button')].map((b) => b.textContent.trim()).join('|')`)
  log('V20 once on, a bar shows with Numbers, Replies, Help and Stop buttons', barButtons === 'Numbers|Replies|Help|Stop', barButtons)
  await ev(`__t.clickText('Numbers')`); await sleep(900)
  const nBadges = await ev(`document.querySelectorAll('#voice-numbers > div').length`)
  log('V21 Numbers puts a numbered badge on the things that can be pressed', nBadges >= 5, String(nBadges))
  const pressed = await say('click 2', 1000)
  log('V22 "click 2" activates the item numbered 2', /^(Pressed|In) /.test(pressed), pressed)
  await ev(`__t.clickText('Replies')`); await sleep(500)
  log('V23 Replies shows what was said and the answer', await ev(`document.querySelector('#voice-replies')?.innerText.includes('click 2')`))
  await say('hide numbers', 700)
  log('V24 "hide numbers" removes the badges', (await ev(`document.querySelectorAll('#voice-numbers > div').length`)) === 0)
  await ev(`__t.clickText('Stop')`); await sleep(500)
  log('V25 Stop turns voice control off and removes the bar', await ev(`!document.querySelector('#voice-status')`))
  await load('#/services')
  log('V26 the full-page Services site also has a voice launcher', await ev(`!!document.querySelector('#voice-launcher')`))

  // phone width
  await load('#/dashboard', 360, 800)
  log('V27 the top bar with the Voice button has no sideways scroll at 360 px', (await ev('document.documentElement.scrollWidth - window.innerWidth')) <= 0, String(await ev('document.documentElement.scrollWidth - window.innerWidth')))
} catch (e) {
  log('script error', false, String(e.message || e))
} finally { chrome.kill() }
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed} passed, ${failed} failed of ${results.length}`)
writeFileSync(join(OUT, 'voice-check-results.json'), JSON.stringify(results, null, 2))
process.exit(failed ? 1 : 0)
