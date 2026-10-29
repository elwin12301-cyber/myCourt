// Responsive audit: real-phone emulation (touch, mobile viewport) of every page, signed in.
// Needs the frontend with VITE_API_URL and the backend running, and an account (MC_USER / MC_PASS; defaults are the demo account).
// Usage: node scripts/mobile-audit.mjs <baseUrl> <outDir> [widths, default 360,390,430,768,1024]
// Reports, per page and width: sideways scroll, controls under 36 px, and text fields under 16 px on phones (iOS zooms on those).
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const PORT = 9521, BASE = process.argv[2], OUT = process.argv[3]
const WIDTHS = (process.argv[4] || '360,390,430,768,1024').split(',').map(Number)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const dir = mkdtempSync(join(tmpdir(), 'cdp-mb-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' })
const PAGES = ['dashboard', 'cases', 'caseStatus', 'causeList', 'courtOrders', 'assistant', 'research', 'documents', 'mapping', 'voice', 'hearing', 'calendar', 'intake', 'billing', 'portalHome', 'portalAbout', 'portalHighCourts', 'portalForms', 'portalContact', 'services']
const probe = `(() => {
  const W = window.innerWidth, out = { scrollW: document.documentElement.scrollWidth, W, small: [], tiny: [], offscreen: [] }
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('.sr-only') && !e.closest('[aria-hidden=true]') }
  for (const e of document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=tab]')) {
    if (!vis(e)) continue
    if (e.tagName === 'INPUT' && (e.type === 'checkbox' || e.type === 'radio')) { const r = e.closest('label')?.getBoundingClientRect() || e.getBoundingClientRect(); if (r.height < 28) out.small.push('cb:' + (e.closest('label')?.textContent || e.name || '').trim().slice(0, 24) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); continue }
    if (e.tagName === 'A' && e.closest('p, li, .sub, small, .tiny, .muted') && getComputedStyle(e).display === 'inline') continue
    const r = e.getBoundingClientRect()
    if (r.height < 36 || r.width < 36) out.small.push(e.tagName + ':' + (e.textContent || e.getAttribute('aria-label') || e.placeholder || e.id || '').trim().slice(0, 24) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height))
    if ((e.tagName === 'INPUT' || e.tagName === 'SELECT' || e.tagName === 'TEXTAREA') && parseFloat(getComputedStyle(e).fontSize) < 16) out.tiny.push(e.tagName + '#' + (e.id || e.name || '') + ' ' + getComputedStyle(e).fontSize)
  }
  for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if (cs.position === 'fixed' || !vis(e)) continue; const r = e.getBoundingClientRect(); if (r.right > W + 2 && !e.closest('.tablewrap, .tabrow, .sidebar')) { out.offscreen.push(e.tagName + '.' + String(e.className).slice(0, 30) + ' ' + Math.round(r.right)); if (out.offscreen.length > 4) break } }
  out.small = [...new Set(out.small)].slice(0, 8); out.tiny = [...new Set(out.tiny)].slice(0, 5)
  return out })()`
try {
  let targets
  for (let i = 0; i < 25; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break } catch { await sleep(300) } }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r))
  let id = 0; const pending = new Map()
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } })
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const ev = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value
  const setv = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })) })()`)
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, name), Buffer.from(r.result.data, 'base64')) }
  await send('Page.enable')
  const phone = async (w) => { const mobile = w <= 820; await send('Emulation.setDeviceMetricsOverride', { width: w, height: mobile ? 844 : 800, deviceScaleFactor: 2, mobile }); await send('Emulation.setTouchEmulationEnabled', { enabled: mobile }) }
  await phone(390)
  await send('Page.navigate', { url: BASE + '#/dashboard' }); await sleep(2500)
  await setv('#su-email', process.env.MC_USER || 'mycourtadmin'); await setv('#su-password', process.env.MC_PASS || 'admin@123')
  await ev(`[...document.querySelectorAll('form button')].find((b) => b.textContent.trim() === 'Sign in').click()`); await sleep(3000)
  const sheet = {}
  for (const w of WIDTHS) {
    await phone(w)
    for (const p of PAGES) {
      await send('Page.navigate', { url: BASE + '#/' + p }); await sleep(1700)
      await ev('location.reload()'); await sleep(2200)
      const r = await ev(probe)
      const problems = []
      if (r.scrollW > r.W + 1) problems.push(`SIDEWAYS +${r.scrollW - r.W}px`)
      if (r.offscreen.length) problems.push('offscreen: ' + r.offscreen.join('; '))
      if (r.small.length) problems.push('small targets: ' + r.small.join(' | '))
      if (w <= 430 && r.tiny.length) problems.push('inputs <16px (iOS zoom): ' + r.tiny.join(', '))
      sheet[`${w} ${p}`] = problems
      if (p === 'dashboard' || p === 'billing' || p === 'cases') await shot(`m_${w}_${p}.png`)
    }
  }
  for (const [k, v] of Object.entries(sheet)) if (v.length) console.log(k.padEnd(24), v.join('  ||  '))
  console.log('\npages with problems:', Object.values(sheet).filter((v) => v.length).length, 'of', Object.keys(sheet).length)
  // mobile menu flow at 390
  await phone(390)
  await send('Page.navigate', { url: BASE + '#/dashboard' }); await sleep(1500); await ev('location.reload()'); await sleep(2500)
  const side0 = await ev(`(() => { const r = document.querySelector('.sidebar').getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) } })()`)
  await ev(`document.querySelector('.mobilemenu').click()`); await sleep(600)
  const side1 = await ev(`(() => { const r = document.querySelector('.sidebar').getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width), open: document.querySelector('.sidebar').classList.contains('open') } })()`)
  await shot('m_menu_open.png')
  await ev(`[...document.querySelectorAll('.nav button')].find((b) => b.textContent.includes('Cases')).click()`); await sleep(900)
  const side2 = await ev(`(() => { const r = document.querySelector('.sidebar').getBoundingClientRect(); return { x: Math.round(r.left), open: document.querySelector('.sidebar').classList.contains('open'), hash: location.hash } })()`)
  console.log('menu closed:', JSON.stringify(side0), 'open:', JSON.stringify(side1), 'after choosing Cases:', JSON.stringify(side2))
} finally { chrome.kill() }
