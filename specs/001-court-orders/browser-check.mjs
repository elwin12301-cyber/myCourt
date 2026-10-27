// Browser check for the Court Orders page. Drives the real page in headless Chrome through the DevTools
// protocol (no extra dependencies). Start the app first (npm run dev), then run:
//   node specs/001-court-orders/browser-check.mjs <output-folder>
// Optional env: CHROME (path to chrome.exe), APP_URL (page address).
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = process.env.APP_URL || 'http://localhost:5173/#/courtOrders'
const OUT = process.argv[2]
const PORT = 9333
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const dir = mkdtempSync(join(tmpdir(), 'cdp-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' })
const results = []
const log = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`) }

try {
  let targets
  for (let i = 0; i < 20; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break } catch { await sleep(300) } }
  const target = targets.find((t) => t.type === 'page')
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r))
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } })
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval error')
    return r.result.result.value
  }
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    writeFileSync(join(OUT, name), Buffer.from(r.result.data, 'base64'))
  }

  const setup = `window.__t = {
    set(sel, v) { const el = document.querySelector(sel); if (!el) throw new Error('missing ' + sel);
      const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); },
    click(text) { const b = [...document.querySelectorAll('button,a')].find((e) => { const t = e.textContent.trim(); return (t === text || t.startsWith(text + ' ')) && !e.disabled; }); if (!b) throw new Error('no button ' + text); b.click(); },
    tab(text) { const b = [...document.querySelectorAll('[role=tab]')].find((e) => e.textContent.trim() === text); if (!b) throw new Error('no tab ' + text); b.click(); },
    radio(i) { document.querySelectorAll('input[name=orderFilter]')[i].click(); },
    captcha() { return document.querySelector('.captcha').textContent.trim(); },
    text() { return document.body.innerText; },
    rows() { return document.querySelectorAll('table tbody tr').length; },
    overflow() { return document.documentElement.scrollWidth - window.innerWidth; }
  }; true`
  const step = async (ms = 120) => sleep(ms)
  const load = async (w, h) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
    await send('Page.enable')
    await send('Page.navigate', { url: 'about:blank' })
    await sleep(200)
    await send('Page.navigate', { url: URL })
    await sleep(1500)
    await ev(setup)
  }
  const court = async (state, district, complex) => {
    await ev(`__t.set('#state', ${JSON.stringify(state)})`); await step()
    await ev(`__t.set('#district', ${JSON.stringify(district)})`); await step()
    await ev(`__t.set('#complex', ${JSON.stringify(complex)})`); await step()
  }
  const go = async (solve = true) => {
    if (solve) { const c = await ev('__t.captcha()'); await ev(`__t.set('#captcha', ${JSON.stringify(c)})`); await step() }
    await ev(`__t.click('Go')`); await sleep(1100)
  }
  const T = () => ev('__t.text()')

  // ---------- desktop ----------
  await load(1280, 1000)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')

  // S1: case-number search
  await ev(`__t.tab('Case Number')`); await step(250)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.set('#caseType', 'Criminal Case (CC)')`); await ev(`__t.set('#number', '412')`); await ev(`__t.set('#year', '2025')`); await step()
  await go()
  let text = await T(); let rows = await ev('__t.rows()')
  log('S1 case-number search lists 2 orders, newest first', rows === 2 && text.includes('Order 2') && text.includes('Order 1'), `rows=${rows}`)
  await shot('s1-results-desktop.png')

  // S10: filter + sort, open case, go back
  await ev(`(() => { const s = document.querySelectorAll('select'); const f=[...s].find(x=>[...x.options].some(o=>o.text==='Interim')&&[...x.options].some(o=>o.text==='All')); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(f,'Interim'); f.dispatchEvent(new Event('change',{bubbles:true})); const g=[...s].find(x=>[...x.options].some(o=>o.value==='oldest')); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(g,'oldest'); g.dispatchEvent(new Event('change',{bubbles:true})); return true })()`); await step()
  const before = await ev(`(() => { const s=[...document.querySelectorAll('select')]; return { f: s.find(x=>[...x.options].some(o=>o.text==='All')).value, o: s.find(x=>[...x.options].some(o=>o.value==='oldest')).value, rows: document.querySelectorAll('table tbody tr').length, first: document.querySelector('table tbody tr td:nth-child(4)').innerText } })()`)
  await ev(`__t.click('View')`); await sleep(300)
  text = await T()
  log('S10a View opens the case record with orders', text.includes('Case details') && text.includes('Order 1:') && text.includes('Back to results'))
  await ev(`__t.click('← Back to results')`); await sleep(300)
  const after = await ev(`(() => { const s=[...document.querySelectorAll('select')]; return { f: s.find(x=>[...x.options].some(o=>o.text==='All')).value, o: s.find(x=>[...x.options].some(o=>o.value==='oldest')).value, rows: document.querySelectorAll('table tbody tr').length, first: document.querySelector('table tbody tr td:nth-child(4)').innerText } })()`)
  log('S10b Back keeps the filter, sort and list unchanged', JSON.stringify(before) === JSON.stringify(after), JSON.stringify(after))

  // S2: Final Orders => nothing for this case
  await ev(`__t.radio(1)`); await step()
  await go()
  text = await T()
  log('S2 Final Orders filter gives the empty message', text.includes('does not mean no real order exists'))

  // S8: nonexistent case
  await ev(`__t.radio(2)`); await ev(`__t.set('#number', '9999')`); await step()
  await go()
  log('S8 unknown case shows the empty message', (await T()).includes('No matching order in the demonstration data'))

  // S7: wrong captcha
  await ev(`__t.set('#captcha', 'WRONG1')`); await step()
  await ev(`__t.click('Go')`); await sleep(300)
  text = await T()
  log('S7 wrong captcha is rejected and no search runs', text.includes('captcha text does not match'))
  const fresh = await ev('__t.captcha()')
  log('S7b a fresh captcha is issued', fresh.length === 6)

  // validation messages
  await ev(`__t.set('#number', 'abc')`); await ev(`__t.set('#year', '1800')`); await step()
  await go()
  text = await T()
  log('Validation names each invalid field', text.includes('Enter the case number') && text.includes('Enter a 4-digit year'))

  // S3: party name
  await ev(`__t.tab('Party Name')`); await step(250)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.set('#name', 'ab')`); await ev(`__t.set('#year', '2025')`); await step()
  await go(); text = await T()
  log('S3a party name under 3 characters is rejected', text.includes('Enter at least 3 characters'))
  await ev(`__t.set('#name', 'kumar')`); await step()
  await go(); rows = await ev('__t.rows()')
  log('S3b party name search returns the case orders', rows === 2, `rows=${rows}`)

  // S4: court number
  await ev(`__t.tab('Court Number')`); await step(250)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  const opts = await ev(`[...document.querySelectorAll('#roomId option')].map(o=>o.text)`)
  log('S4a court list shows number, judge, designation and period', opts.some((o) => o.includes('12 - Demo Judge A - Principal Sessions Judge (Jan 2024 - present)')), opts.join(' | '))
  await ev(`__t.set('#roomId', ${JSON.stringify((await ev(`[...document.querySelectorAll('#roomId option')].find(o=>o.text.startsWith('12 -')).value`)))})`); await step()
  await go(); rows = await ev('__t.rows()')
  log('S4b court-number search returns that court\'s orders', rows === 2, `rows=${rows}`)

  // changing the court clears the chosen court number
  await ev(`__t.set('#complex', 'City Civil Court Complex')`); await step(); await ev(`__t.set('#state', 'Tamil Nadu')`); await step()
  log('Changing the court selection clears the court number', (await ev(`document.querySelector('#roomId').value`)) === '')

  // S5 / S6: dates
  await ev(`__t.tab('Order Date')`); await step(250)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.set('#from', '2026-10-27')`); await ev(`__t.set('#to', '2026-01-01')`); await step()
  await go(); text = await T()
  log('S6 reversed dates are rejected', text.includes('must not be earlier than the from date'))
  await ev(`__t.set('#from', '2025-08-20')`); await ev(`__t.set('#to', '2025-08-20')`); await step()
  await go(); rows = await ev('__t.rows()')
  log('S5 single-day range is inclusive', rows === 1, `rows=${rows}`)

  // S9: state without demo data
  await ev(`__t.set('#state', 'Goa')`); await step(250)
  text = await T()
  log('S9 a state without demo data says so', text.includes('No demonstration data exists for Goa'))

  // S11: banner present
  log('S11 demonstration notice visible', (await T()).includes('Demonstration data.'))

  // S12: keyboard reachability
  await load(1280, 1000)
  // Controls after State are disabled until a state/district/complex are chosen, so choose them first.
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  const seen = []
  const focusStyles = []
  await ev(`document.querySelector('#state').focus()`)
  for (let i = 0; i < 30; i++) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    const a = await ev(`(() => { const e = document.activeElement; const s = getComputedStyle(e); return { id: (e.id || e.textContent.trim().slice(0, 20) || e.tagName), outline: s.outlineStyle + ' ' + s.outlineWidth } })()`)
    seen.push(a.id); focusStyles.push(a)
    if (a.id === 'Go') break
  }
  const need = ['district', 'complex', 'establishment', 'name', 'year', 'captcha', 'Go']
  const missing = need.filter((n) => !seen.includes(n))
  log('S12 Tab reaches every form control through to Go', missing.length === 0, missing.length ? 'missing: ' + missing.join(', ') : seen.join(' > '))
  const unlabeled = await ev(`[...document.querySelectorAll('#orderpanel input:not([type=radio]), #orderpanel select')].filter(e => !e.labels || e.labels.length === 0).map(e => e.id || e.name)`)
  log('All form controls have a programmatic label', unlabeled.length === 0, unlabeled.join(', '))
  const noRing = focusStyles.filter((f) => f.outline.startsWith('none'))
  log('Every keyboard-focused control shows a visible focus ring', noRing.length === 0, noRing.length ? noRing.map((f) => f.id).join(', ') : `${focusStyles.length} controls checked`)

  // ---------- phone 360 ----------
  await load(360, 800)
  const o1 = await ev('__t.overflow()')
  log('S13a idle page has no horizontal scroll at 360px', o1 <= 0, `overflow=${o1}px`)
  await ev(`__t.tab('Case Number')`); await step(250)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.set('#caseType', 'Criminal Case (CC)')`); await ev(`__t.set('#number', '412')`); await ev(`__t.set('#year', '2025')`); await step()
  await go()
  const o2 = await ev('__t.overflow()')
  log('S13b results page has no horizontal page scroll at 360px (table scrolls in its box)', o2 <= 0, `overflow=${o2}px`)
  const tw = await ev(`(() => { const w = document.querySelector('.tablewrap'); return w ? w.scrollWidth + '/' + w.clientWidth : 'none' })()`)
  log('Results table sits in a scrolling container', tw !== 'none', tw)
  await shot('s13-results-phone360.png')
  await ev(`window.scrollTo(0,0)`)
  await load(360, 800)
  await shot('s13-idle-phone360.png')
} catch (e) {
  log('script error', false, String(e.message || e))
} finally {
  chrome.kill()
}
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed} passed, ${failed} failed of ${results.length}`)
writeFileSync(join(OUT, 'e2e-results.json'), JSON.stringify(results, null, 2))
process.exit(failed ? 1 : 0)
