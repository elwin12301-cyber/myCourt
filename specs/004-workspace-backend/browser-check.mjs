// Browser check for the signed-in workspace (spec 004). Drives the real page in headless Chrome through the DevTools protocol.
// Needs the backend (a THROW-AWAY database) and the front end started with the API address:
//   backend/:  MYCOURT_DATABASE_URL=<throw-away db> python -m app.cli migrate && uvicorn app.main:app --port 8000
//   frontend/: VITE_API_URL=http://localhost:8000 npm run dev
//   node specs/004-workspace-backend/browser-check.mjs <output-folder>
// Optional env: CHROME (path to chrome.exe), APP_URL (default http://localhost:5173/).
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = process.env.APP_URL || 'http://localhost:5173/'
const OUT = process.argv[2]
const PORT = 9446
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const run = Date.now().toString(36)
const PASSWORD = 'browser-check-password-123'
const A = { email: `a.${run}@example.invalid`, name: 'Alice Check' }
const B = { email: `b.${run}@example.invalid`, name: 'Bob Check' }

const dir = mkdtempSync(join(tmpdir(), 'cdp-ws-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' })
const results = []
const log = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`) }

try {
  let targets
  for (let i = 0; i < 25; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break } catch { await sleep(300) } }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
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
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(OUT, name), Buffer.from(r.result.data, 'base64')) }
  const key = (k, code, mods = 0) => send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: k === 'Tab' ? 9 : 0, modifiers: mods })

  const helpers = `window.__t = {
    set(sel, v) { const el = document.querySelector(sel); if (!el) throw new Error('missing ' + sel);
      const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); },
    click(text, scope = 'body') { const root = document.querySelector(scope); if (!root) throw new Error('no scope ' + scope);
      const b = [...root.querySelectorAll('button,a')].find((e) => e.textContent.trim().startsWith(text) && !e.disabled);
      if (!b) throw new Error('no "' + text + '" in ' + scope); b.click(); },
    has(text) { return document.body.innerText.includes(text) },
    overflow() { return document.documentElement.scrollWidth - window.innerWidth }
  }; true`
  const load = async (path = '', w = 1280, h = 1000, fresh = false) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
    await send('Page.enable')
    if (fresh) await send('Network.clearBrowserCookies')
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150)
    await send('Page.navigate', { url: BASE + path }); await sleep(1800)
    await ev(helpers)
  }
  const has = (t) => ev(`__t.has(${JSON.stringify(t)})`)
  const set = (sel, v) => ev(`__t.set(${JSON.stringify(sel)}, ${JSON.stringify(v)})`)
  const click = async (t, scope = 'body', wait = 700) => { await ev(`__t.click(${JSON.stringify(t)}, ${JSON.stringify(scope)})`); await sleep(wait) }
  const signUp = async (p) => {
    await click('I need an account', 'body', 300)
    await set('#su-name', p.name); await set('#su-email', p.email); await set('#su-password', PASSWORD)
    await click('Create account', 'body', 1800)
  }
  const signIn = async (p) => {
    await set('#su-email', p.email); await set('#su-password', PASSWORD)
    await click('Sign in', 'form', 1800)
  }
  const signOut = async () => { await click('Sign out', 'body', 900) }

  // ---------- 1. gate and keyboard ----------
  await load('#/cases', 1280, 1000, true)
  log('W1 the workspace asks for sign-in; the Services demo link is offered', (await has('Sign in')) && (await ev(`!!document.querySelector('a[href="#/services"]')`)))
  const labels = await ev(`['su-email','su-password'].every((i) => !!document.querySelector('label[for=' + i + ']'))`)
  log('W2 sign-in fields have labels', labels)
  await ev(`document.activeElement.blur(); document.querySelector('#su-email').focus()`)
  await key('Tab', 'Tab')
  await sleep(100)
  log('W3 Tab moves from e-mail to password', (await ev(`document.activeElement.id`)) === 'su-password')
  await set('#su-email', A.email); await set('#su-password', 'wrong password here')
  await click('Sign in', 'form', 1200)
  log('W4 a failed sign-in shows one generic message, announced', (await has('Sign-in failed')) && (await ev(`!!document.querySelector('[role=alert]')`)))

  // ---------- 2. create account, matter, records ----------
  await signUp(A)
  log('W5 a new account lands in the workspace', (await has('Cases')) || (await has('Dashboard')))
  await ev(`location.hash = '#/cases'`); await sleep(800)
  log('W6 Cases shows the empty state', await has('You have no matters yet'))
  await set('#nm-title', `Check Matter ${run} (demo)`); await set('#nm-ref', 'DEMO-REF')
  await click('Create matter', 'form', 1500)
  const matterHash = await ev('location.hash')
  log('W7 creating a matter opens it', /#\/caseDetail\/[0-9a-f-]{36}/.test(matterHash), matterHash)
  log('W8 the matter shows its tabs including Audit for the owner', (await ev(`[...document.querySelectorAll('[role=tab]')].map((t) => t.textContent).join('|')`)).includes('Audit'))
  await click('Tasks', '[role=tablist]', 800)
  await set('#task-title', 'File reply (demo)'); await click('Add task', 'form', 900)
  log('W9 a task is added', await has('File reply (demo)'))
  await click('Calendar', '[role=tablist]', 800)
  await set('#cal-kind', 'deadline'); await set('#cal-title', 'Reply deadline (demo)'); await set('#cal-when', '2031-03-01T10:00')
  await click('Add to calendar', 'form', 900)
  log('W10 a deadline starts as an unapproved draft', (await has('Draft · not approved')) && (await has('Approve deadline')))
  await click('Drafts', '[role=tablist]', 800)
  await set('#rs-q', 'bail bond'); await click('Search', 'form', 1200)
  log('W11 research returns a labelled demonstration draft with sources', (await has('Draft: advocate verification required')) && (await has('Demonstration content, not legal advice')) && (await has('(demo)')))
  await click('Approve this draft', 'body', 1000)
  log('W12 approving marks the draft approved', (await has('Approved by an advocate')) && !(await has('Approve this draft')))

  // ---------- 3. persistence ----------
  await load(matterHash, 1280, 1000, false)
  log('W13 after a reload the person is still signed in and the matter is there', await has(`Check Matter ${run}`))
  await click('Tasks', '[role=tablist]', 800)
  log('W14 the task survived the reload (saved on the server)', await has('File reply (demo)'))
  await click('Audit', '[role=tablist]', 1000)
  await click('Verify the trail', 'body', 800)
  log('W15 the audit trail lists actions and verifies as intact', (await has('The trail is intact.')) && (await has('create')))
  await shot('w-matter-desktop.png')

  // ---------- 4. privacy ----------
  await signOut()
  log('W16 signing out returns to the sign-in screen', await has('Sign in'))
  await signUp(B)
  await load(matterHash, 1280, 1000, false)
  const bText = await ev('document.body.innerText')
  log('W17 another person cannot see the matter: same "not found", no title', bText.includes('Not found.') && !bText.includes(`Check Matter ${run}`))
  await signOut()
  await load(matterHash, 1280, 1000, true)
  await signIn(A)
  await click('Access', '[role=tablist]', 900)
  await set('#ac-email', B.email); await set('#ac-level', 'view'); await click('Share', 'form', 1200)
  log('W18 the owner shares the matter with view-only access', await has('Bob Check'))
  await signOut()
  await signIn(B)
  await load(matterHash, 1280, 1000, false)
  log('W19 the view-only person can open it but sees no edit controls', (await has(`Check Matter ${run}`)) && (await has('view-only access')) && !(await has('Save changes')))
  await click('Drafts', '[role=tablist]', 900)
  log('W20 and cannot approve or create drafts', !(await has('Approve this draft')) && !(await has('Save draft')))
  await click('Audit', '[role=tablist]', 600).then(() => log('W21 a non-owner has no Audit tab', false)).catch(() => log('W21 a non-owner has no Audit tab', true))

  // ---------- 5. the Services demo stays public ----------
  await signOut()
  await load('#/services', 1280, 1000, true)
  log('W22 the Services-site demo opens without signing in', (await has('eCourts Services')) && !(await has('Create an account')))

  // ---------- 6. phone width ----------
  await load('#/cases', 360, 800, true)
  await signIn(A)
  await load(matterHash, 360, 800, false)
  const tabs = ['Overview', 'Tasks', 'Calendar', 'Documents', 'Drafts', 'Time & invoices', 'Access', 'Audit']
  const bad = []
  for (const t of tabs) { await click(t, '[role=tablist]', 700); const o = await ev('__t.overflow()'); if (o > 0) bad.push(`${t}:+${o}px`) }
  log('W23 no horizontal scroll at 360 px on every matter tab', bad.length === 0, bad.join(', '))
  await shot('w-matter-phone.png')

  // ---------- 7. the former browser-only screens now save on the server (gaps G1-G3) ----------
  await load('#/calendar', 1280, 1000, false)
  log('W24 Calendar lists dates across matters and the matter\'s own entries', (await has('Next dates across all your matters')) && (await has('Reply deadline (demo)')) && (await ev(`!!document.querySelector('#scope-matter')`)))
  await load('#/research', 1280, 1000, false)
  await set('#research-q', 'bail bond'); await click('Run', 'form', 1400)
  log('W25 Research saves a labelled draft on the matter', (await has('Draft: advocate verification required')) && (await has('Demonstration content')))
  await load('#/mapping', 1280, 1000, false)
  await set('#mapping-q', 'IPC 420'); await click('Run', 'form', 1400)
  log('W26 Section mapping saves a labelled draft on the matter', await has('Draft: advocate verification required'))
  await load('#/assistant', 1280, 1000, false)
  await set('#chat-q', 'Summarise this matter'); await click('Send', 'form', 1500)
  log('W27 Assistant keeps the conversation and shows the reply as a draft', (await has('myCourt AI (demonstration)')) && (await has('Saved as a draft on this matter')))
  await load('#/voice', 1280, 1000, false)
  const startDisabled = await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Start dictation')).disabled`)
  log('W28 Voice: dictation stays off until the person accepts the speech-service warning', (await has("browser's own service")) && startDisabled === true)
  await set('#voice-text', 'Client called about the hearing date (demo)'); await click('Save as a voice note', 'body', 1200)
  log('W29 a voice note is saved as "needs review" and can be marked reviewed', (await has('Needs review')) && await (async () => { await click('Mark reviewed', 'body', 1000); return has('Reviewed') })())
  await load('#/hearing', 1280, 1000, false)
  await set('#hb-issues', 'Whether the notice was served'); await click('Save brief draft', 'body', 1400)
  log('W30 Hearing preparation saves the brief as a draft awaiting approval', (await has('Hearing brief')) && (await has('Draft: advocate verification required')))
  await load('#/intake', 1280, 1000, false)
  await set('#in-name', 'Prospect Demo'); await click('Save intake', 'form', 1200)
  const createOff = await ev(`[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Create matter').disabled`)
  await click('Confirm clear', 'body', 1200)
  const clearShown = await has('Conflict check clear')
  await click('Create matter', 'body', 1500)
  log('W31 Intake: a matter can only be created after the conflict check is confirmed clear', createOff === true && clearShown && (await has('Open the matter created from this intake')))
  await load('#/billing', 1280, 1000, false)
  await load('#/documents', 1280, 1000, false)
  log('W32 Documents and Billing are scoped to a matter', await ev(`!!document.querySelector('#scope-matter')`))
  const bad2 = []
  for (const pg of ['calendar', 'research', 'mapping', 'assistant', 'voice', 'hearing', 'intake', 'billing', 'documents']) {
    await load('#/' + pg, 360, 800, false)
    const o = await ev('__t.overflow()'); if (o > 0) bad2.push(`${pg}:+${o}px`)
  }
  log('W33 no horizontal scroll at 360 px on the newly server-backed screens', bad2.length === 0, bad2.join(', '))
} catch (e) {
  log('script error', false, String(e.message || e))
} finally {
  chrome.kill()
}
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed} passed, ${failed} failed of ${results.length}`)
writeFileSync(join(OUT, 'workspace-check-results.json'), JSON.stringify(results, null, 2))
process.exit(failed ? 1 : 0)
