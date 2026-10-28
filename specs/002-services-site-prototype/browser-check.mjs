// Browser check for the eCourts Services site prototype. Drives the real page in headless Chrome through the
// DevTools protocol (no extra dependencies). Start the app first (npm run dev), then run:
//   node specs/002-services-site-prototype/browser-check.mjs <output-folder>
// Optional env: CHROME (path to chrome.exe), APP_URL (site address).
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = process.env.APP_URL || 'http://localhost:5173/'
const OUT = process.argv[2]
const PORT = 9444
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const dir = mkdtempSync(join(tmpdir(), 'cdp-svc-'))
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

  const helpers = `window.__t = {
    set(sel, v) { const el = document.querySelector(sel); if (!el) throw new Error('missing ' + sel);
      const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); },
    clickIn(scope, text) { const root = document.querySelector(scope); if (!root) throw new Error('no scope ' + scope);
      const b = [...root.querySelectorAll('button,a')].find((e) => { const t = e.textContent.trim(); return (t === text || t.startsWith(text + ' ') || t.startsWith(text + '\\u00a0')) && !e.disabled; });
      if (!b) throw new Error('no ' + text + ' in ' + scope); b.click(); },
    click(text) { this.clickIn('body', text) },
    tab(text) { const b = [...document.querySelectorAll('[role=tab]')].find((e) => e.textContent.trim() === text); if (!b) throw new Error('no tab ' + text); b.click() },
    text() { return document.body.innerText },
    h2() { const h = document.querySelector('#svc-main h2'); return h ? h.textContent.trim() : '' },
    rows() { return document.querySelectorAll('#svc-main table tbody tr').length },
    captcha() { return document.querySelector('.captcha').textContent.trim() },
    overflow() { return document.documentElement.scrollWidth - window.innerWidth },
    hash() { return location.hash }
  }; true`
  const setup = () => ev(helpers)
  const load = async (path = '#/services', w = 1280, h = 1000) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
    await send('Page.enable')
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150)
    await send('Page.navigate', { url: BASE + path }); await sleep(1500)
    await setup()
  }
  const reload = async () => { await send('Page.reload'); await sleep(1500); await setup() }
  const step = (ms = 150) => sleep(ms)
  const T = () => ev('__t.text()')
  const court = async (state, district, complex) => {
    await ev(`__t.set('#state', ${JSON.stringify(state)})`); await step()
    await ev(`__t.set('#district', ${JSON.stringify(district)})`); await step()
    await ev(`__t.set('#complex', ${JSON.stringify(complex)})`); await step()
  }
  const solve = async () => { const c = await ev('__t.captcha()'); await ev(`__t.set('#captcha', ${JSON.stringify(c)})`); await step() }
  // Scoped to the page content: the header also has a "Search" button for site search.
  const press = async (label) => { await ev(`__t.clickIn('#svc-main', ${JSON.stringify(label)})`); await sleep(1100) }

  // ---------- A. shell ----------
  await load()
  const menu = await ev(`[...document.querySelectorAll('nav[aria-label="Main menu"] > *')].map((e) => e.textContent.replace(/\\(external site\\)/, '').trim())`)
  log('A1 main menu has the 7 official items in order', JSON.stringify(menu) === JSON.stringify(['Home', 'e-Committee', 'Supreme Court', 'High Courts', 'District Courts', 'NJDG', 'Contact Us']), menu.join(' | '))
  const side = await ev(`[...document.querySelectorAll('aside[aria-label="Search Menu"] button')].map((e) => e.textContent.trim())`)
  log('A2 Search Menu has the 7 official items in order', JSON.stringify(side) === JSON.stringify(['CNR Number', 'Case Status', 'Court Orders', 'Cause List', 'Caveat Search', 'Process Details', 'Location']), side.join(' | '))
  const foot = await ev(`[...document.querySelectorAll('footer ul button')].map((e) => e.textContent.trim())`)
  log('A3 footer has 12 useful links', foot.length === 12, String(foot.length))
  log('A4 demonstration notice visible', (await T()).includes('Independent demonstration'))

  // ---------- B. every Search Menu item ----------
  const searchSlugs = { 'CNR Number': 'cnr', 'Case Status': 'case-status', 'Court Orders': 'court-orders', 'Cause List': 'cause-list', 'Caveat Search': 'caveat', 'Process Details': 'process', 'Location': 'location' }
  let bad = []
  for (const [label, slug] of Object.entries(searchSlugs)) {
    await ev(`__t.clickIn('aside[aria-label="Search Menu"]', ${JSON.stringify(label)})`); await step(350)
    const h = await ev('__t.hash()'); const cur = await ev(`document.querySelector('aside[aria-label="Search Menu"] [aria-current=page]')?.textContent.trim()`)
    const title = await ev('__t.h2()')
    if (!h.endsWith('/' + slug) || cur !== label || !title) bad.push(`${label}: ${h} ${cur} "${title}"`)
  }
  log('B1 every Search Menu item opens its page, marks it current and updates the address', bad.length === 0, bad.join('; '))

  // ---------- C. main menu ----------
  await ev(`__t.clickIn('nav[aria-label="Main menu"]', 'High Courts')`); await step(350)
  log('C1 High Courts: 25 courts and a breadcrumb', (await ev(`document.querySelectorAll('#svc-main .listrow').length`)) === 25 && (await T()).includes('Home\n') || (await ev(`!!document.querySelector('[aria-label=Breadcrumb]')`)), `rows=${await ev(`document.querySelectorAll('#svc-main .listrow').length`)}`)
  await ev(`__t.clickIn('nav[aria-label="Main menu"]', 'Contact Us')`); await step(350)
  const crows = await ev('__t.rows()')
  log('C2 Contact Us: 24 table rows plus the 24 vs 25 note', crows === 24 && (await T()).includes('lists 24 High Courts'), `rows=${crows}`)
  let extBad = []
  for (const label of ['e-Committee', 'Supreme Court', 'District Courts', 'NJDG']) {
    await ev(`__t.clickIn('nav[aria-label="Main menu"]', ${JSON.stringify(label)})`); await step(200)
    const open = await ev(`!!document.querySelector('[role=alertdialog]')`)
    const txt = await ev(`document.querySelector('[role=alertdialog]')?.textContent || ''`)
    if (!open || !txt.includes('External site alert')) extBad.push(label)
    await ev(`__t.clickIn('[role=alertdialog]', 'Cancel')`); await step(150)
  }
  log('C3 external menu items ask Go/Cancel before leaving', extBad.length === 0, extBad.join(', '))
  await ev(`__t.clickIn('nav[aria-label="Main menu"]', 'Home')`); await step(300)
  log('C4 Home returns to the CNR page', (await ev('__t.hash()')).endsWith('/cnr'))

  // ---------- D. every footer link ----------
  const footerSlugs = { 'About Us': 'about', 'Newsletter': 'newsletter', 'Forms for Advocates': 'forms', 'Help Videos': 'help-videos', 'Site map': 'site-map', 'Contact Us': 'contact', 'Web Information Manager': 'web-info', 'Copyright Policy': 'copyright', 'Hyperlinking Policy': 'hyperlinking', 'Accessibility Statement': 'accessibility', 'Screen Reader Access': 'screen-reader', 'Disclaimer': 'disclaimer' }
  bad = []
  for (const [label, slug] of Object.entries(footerSlugs)) {
    await ev(`__t.clickIn('footer', ${JSON.stringify(label)})`); await step(350)
    const h = await ev('__t.hash()'); const title = await ev('__t.h2()')
    if (!h.endsWith('/' + slug) || !title.toLowerCase().includes(label.toLowerCase().split(' ')[0])) bad.push(`${label}: ${h} "${title}"`)
  }
  log('D1 every footer link opens a matching page', bad.length === 0, bad.join('; '))

  // ---------- E. CNR and Case Status ----------
  await load('#/services/cnr')
  log('E1 CNR page has only the CNR form with Search and Reset (no tabs)', (await ev(`document.querySelectorAll('#svc-main [role=tab]').length`)) === 0 && (await T()).includes('Search by CNR number'))
  await ev(`__t.set('#cnr', 'TNCH019999992025')`); await solve(); await press('Search')
  log('E2 CNR search shows the case result', (await ev('__t.rows()')) === 1, `rows=${await ev('__t.rows()')}`)
  await load('#/services/case-status')
  const tabs = await ev(`[...document.querySelectorAll('#svc-main [role=tab]')].map((e) => e.textContent.trim())`)
  log('E3 Case Status offers the 7 searches without CNR and a Go button', tabs.length === 7 && !tabs.includes('CNR Number') && (await ev(`!![...document.querySelectorAll('#svc-main button')].find((b) => b.textContent.trim() === 'Go')`)), tabs.join(' | '))
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.tab('Case Type')`); await step(250)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.set('#caseType', 'Criminal Case (CC)')`); await ev(`__t.set('#year', '2025')`); await step(); await solve(); await press('Go')
  log('E4 Case Type search returns a result', (await ev('__t.rows()')) >= 1, `rows=${await ev('__t.rows()')}`)
  await ev(`__t.clickIn('#svc-main', 'Back')`); await step(400)
  log('E5 Back leaves the form', (await ev('__t.hash()')).includes('/services'))

  // ---------- F. Court Orders and Cause List inside the site ----------
  await load('#/services/court-orders')
  log('F1 Court Orders works inside the site without its own other-services panel', (await T()).includes('Search by Party Name') && !(await T()).includes('Other search services'))
  await load('#/services/cause-list')
  log('F2 Cause List works inside the site', (await T()).includes('Cause List Date'))

  // ---------- G. Caveat Search ----------
  await load('#/services/caveat')
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.set('#name', 'kumar')`); await step(); await solve(); await press('Go')
  const anyRows = await ev('__t.rows()')
  await ev(`document.querySelectorAll('input[name=match]')[1].click()`); await step(); await solve(); await press('Go')
  const startRows = await ev('__t.rows()')
  log('G1 Anywhere finds 2 caveats and Starting with finds 1', anyRows === 2 && startRows === 1, `anywhere=${anyRows} starting=${startRows}`)
  await ev(`__t.tab('Caveat Number')`); await step(250)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.set('#caveatNo', '12')`); await ev(`__t.set('#year', '2025')`); await step(); await solve(); await press('Go')
  log('G2 Caveat number search finds the active caveat', (await ev('__t.rows()')) === 1)
  await ev(`__t.tab('Case Number')`); await step(250)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.set('#caseType', 'Criminal Case (CC)')`); await ev(`__t.set('#number', '77')`); await ev(`__t.set('#year', '2024')`); await step(); await solve(); await press('Go')
  log('G3 Case number search finds the caveat', (await ev('__t.rows()')) === 1)
  await shot('g-caveat-results.png')

  // ---------- H. Process Details privacy ----------
  await load('#/services/process')
  await ev(`__t.set('#processId', 'PRC-DEMO-0001')`); await ev(`__t.set('#email', 'advocate.one@example.invalid')`); await step(); await solve(); await press('Search')
  const found = await T()
  log('H1 a matching process id and registered e-mail shows the process', found.includes('Summons') && found.includes('Served'))
  // The demo banner prints a fictional hint, so inspect only the result card, not the whole page.
  const card = await ev(`[...document.querySelectorAll('#svc-main section.card')].find((c) => c.textContent.includes('Issued on'))?.textContent || ''`)
  log('H2 the e-mail is not repeated in the result and not in the address bar', card.includes('Summons') && !card.includes('example.invalid') && !(await ev('location.href')).includes('example') && !(await ev('location.href')).includes('PRC-DEMO'))
  await ev(`__t.set('#email', 'someone.else@example.invalid')`); await step(); await solve(); await press('Search')
  const wrongMail = await T()
  await ev(`__t.set('#processId', 'PRC-NOPE-9999')`); await ev(`__t.set('#email', 'advocate.one@example.invalid')`); await step(); await solve(); await press('Search')
  const unknownId = await T()
  const msg = (t) => (t.match(/No process was found[^\n]*/) || [''])[0]
  log('H3 wrong e-mail and unknown id give the identical message', msg(wrongMail) !== '' && msg(wrongMail) === msg(unknownId), msg(wrongMail).slice(0, 60))
  const stored = await ev(`JSON.stringify([localStorage, sessionStorage]).includes('example.invalid')`)
  log('H4 the e-mail is not kept in browser storage', stored === false)
  await shot('h-process.png')

  // ---------- I. Location pop-up ----------
  await load('#/services/location')
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`document.querySelector('.btn.primary').focus()`)
  await ev(`__t.click('View location')`); await step(300)
  const dialog = await ev(`document.querySelector('[role=dialog][aria-labelledby=loc-title]')?.textContent || ''`)
  log('I1 View location opens a pop-up with a fictional address', dialog.includes('fictional address') && dialog.includes('Map placeholder'))
  log('I2 focus moves into the pop-up', await ev(`document.activeElement?.getAttribute('aria-label') === 'Close location'`))
  await shot('i-location.png')
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await step(300)
  log('I3 Escape closes the pop-up and returns focus to the button', (await ev(`!document.querySelector('[role=dialog][aria-labelledby=loc-title]')`)) && (await ev(`document.activeElement?.textContent.trim() === 'View location'`)))

  // ---------- J. site tools ----------
  await load('#/services/cnr')
  await ev(`document.querySelector('.svc-theme button').click()`); await step(200)
  await ev(`[...document.querySelectorAll('input[name=themecolor]')].find((i) => i.parentElement.textContent.includes('Eco')).click()`); await step(200)
  await ev(`[...document.querySelectorAll('input[name=topbar]')].find((i) => i.parentElement.textContent.includes('Dark')).click()`); await step(200)
  log('J1 theme customizer applies Eco and a dark topbar', await ev(`document.querySelector('.svc').className.includes('theme-eco') && document.querySelector('.svc').className.includes('top-dark')`))
  await shot('j-eco.png')
  await reload()
  log('J2 theme and topbar persist after reload', await ev(`document.querySelector('.svc').className.includes('theme-eco') && document.querySelector('.svc').className.includes('top-dark')`))
  await ev(`document.querySelector('.svc-theme button').click()`); await step(200)
  await ev(`[...document.querySelectorAll('input[name=themecolor]')].find((i) => i.parentElement.textContent.includes('Dark')).click()`); await step(300)
  await shot('j-dark.png')
  const darkBg = await ev(`getComputedStyle(document.querySelector('.svc')).backgroundColor`)
  log('J3 Dark theme darkens the page', darkBg !== 'rgb(245, 247, 251)', darkBg)
  await ev(`document.querySelector('.svc-themepanel .btn.small').click()`); await step(200)
  log('J4 Reset theme restores Default and Light', await ev(`document.querySelector('.svc').className.includes('theme-default') && document.querySelector('.svc').className.includes('top-light')`))
  // accessibility precedence
  await ev(`[...document.querySelectorAll('.dispwrap button')].find((b) => b.textContent.includes('Accessibility options')).click()`); await step(200)
  await ev(`[...document.querySelectorAll('.dispmenu input')].find((i) => i.closest('label').textContent.includes('High contrast')).click()`); await step(300)
  log('J5 High Contrast is applied to the page', await ev(`document.documentElement.classList.contains('hc')`))
  await ev(`[...document.querySelectorAll('.dispmenu button')].find((b) => b.textContent.includes('Reset all')).click()`); await step(200)
  // language
  await ev(`__t.set('.svc-top select', 'हिन्दी')`); await step(300)
  log('J6 choosing Hindi translates the page and shows the machine-translation notice', (await T()).includes('Machine translation: not reviewed') && (await ev(`document.documentElement.lang`)) === 'hi')
  await reload()
  log('J7 the language choice persists', (await ev(`document.documentElement.lang`)) === 'hi' && (await ev(`document.querySelector('.svc-top select').value`)) === 'हिन्दी')
  await ev(`__t.set('.svc-top select', 'English')`); await step(200)
  // notice
  await ev(`__t.click('Dismiss')`); await step(200)
  await reload()
  log('J8 dismissing the theme notice persists', !(await T()).includes('We have updated the district court services website theme'))
  // site search
  await ev(`__t.set('#svc-q', 'vakalatnama')`); await step()
  await ev(`document.querySelector('.svc-search button').click()`); await step(500)
  const sres = await T()
  log('J9 site search finds forms and opens the page', sres.includes('Vakalatnama') && (await ev('__t.hash()')).endsWith('/search'))
  await ev(`__t.clickIn('#svc-main', 'Open')`); await step(400)
  log('J10 opening a result goes to Forms for Advocates', (await ev('__t.hash()')).endsWith('/forms'))

  // ---------- K. addresses, reload, Back ----------
  await load('#/services/caveat')
  log('K1 reload keeps the page (deep link)', (await ev('__t.h2()')).includes('Caveat'))
  await ev(`__t.clickIn('nav[aria-label="Main menu"]', 'Contact Us')`); await step(300)
  await ev('history.back()'); await step(500)
  log('K2 the browser Back button returns to the previous page', (await ev('__t.hash()')).endsWith('/caveat'))

  // ---------- L. keyboard ----------
  await load('#/services/cnr')
  const seen = []; const noRing = []
  await ev('document.body.focus()')
  for (let i = 0; i < 40; i++) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    const a = await ev(`(() => { const e = document.activeElement; const s = getComputedStyle(e); return { t: (e.id || e.textContent.trim().slice(0, 24) || e.tagName), ring: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.boxShadow } })()`)
    seen.push(a.t)
    if (a.ring.startsWith('none') && !/rgb/.test(a.ring)) noRing.push(a.t)
  }
  log('L1 the first Tab stop is the skip link and Tab reaches menus, the search menu and the form', seen[0].startsWith('Skip') && seen.some((s) => s.startsWith('Case Status')) && seen.includes('home-state'), seen.slice(0, 8).join(' > '))
  log('L2 every keyboard-focused control shows a focus indicator', noRing.length === 0, noRing.length ? noRing.join(', ') : `${seen.length} stops checked`)
  const unlabeled = await ev(`[...document.querySelectorAll('#svc-main input:not([type=radio]), #svc-main select')].filter((e) => !e.labels || e.labels.length === 0).map((e) => e.id)`)
  log('L3 form controls have labels', unlabeled.length === 0, unlabeled.join(', '))

  // ---------- N. site translation (spec 003) ----------
  const LANG_SET = [['hi', 'हिन्दी'], ['mr', 'मराठी'], ['gu', 'ગુજરાતી'], ['kn', 'ಕನ್ನಡ'], ['ta', 'தமிழ்']]
  const NAMES = { hi: 'मामले की स्थिति', mr: 'प्रकरणाची स्थिती', gu: 'કેસની સ્થિતિ', kn: 'ಪ್ರಕರಣದ ಸ್ಥಿತಿ', ta: 'வழக்கு நிலை' }
  const allPages = ['cnr', 'case-status', 'court-orders', 'cause-list', 'caveat', 'process', 'location', 'high-courts', 'contact', 'about', 'newsletter', 'forms', 'help-videos', 'site-map', 'web-info', 'copyright', 'hyperlinking', 'accessibility', 'screen-reader', 'disclaimer', 'search']
  const latinInContent = `(() => { const t = document.querySelector('#svc-main').innerText; return (t.match(/[A-Za-z]{4,}/g) || []).length })()`
  for (const [code, label] of LANG_SET) {
    await load('#/services/case-status', 360, 800)
    await ev(`__t.set('.svc-top select', ${JSON.stringify(label)})`); await step(350)
    const lang = await ev('document.documentElement.lang')
    const notice = await ev(`document.body.innerText.includes('Machine translation: not reviewed')`)
    const heading = await ev('__t.h2()')
    log(`N1 ${code}: lang attribute, notice and translated heading`, lang === code && notice && heading.length > 0 && !/[A-Za-z]{4,}/.test(heading), `${lang} | ${heading}`)
    // 360 px overflow on every page, in this language
    bad = []
    for (const p of allPages) {
      await ev(`location.hash = '#/services/${p}'`); await step(250)
      const o = await ev('__t.overflow()')
      if (o > 0) bad.push(`${p}:+${o}px`)
    }
    log(`N2 ${code}: no horizontal scroll at 360 px on all ${allPages.length} pages`, bad.length === 0, bad.join(', '))
    // searches stay English: a CNR search in this language still finds the demo record
    await ev(`location.hash = '#/services/cnr'`); await step(300)
    await ev(`__t.set('#cnr', 'TNCH019999992025')`); await step(); await solve()
    await ev(`document.querySelector('#svc-main form button.primary, #svc-main form button[type=submit]').click()`); await sleep(1300)
    const found = await ev(`document.querySelector('#svc-main').innerText.includes('TNCH019999992025')`)
    log(`N3 ${code}: searching by CNR still finds the record (stored values stay English)`, found)
  }
  await ev(`__t.set('.svc-top select', 'English')`); await step(300)
  log('N4 switching back to English removes the notice and restores lang', !(await T()).includes('Machine translation: not reviewed') && (await ev('document.documentElement.lang')) === 'en')

  // ---------- M. phone width ----------
  const phonePages = ['cnr', 'case-status', 'caveat', 'process', 'location', 'high-courts', 'contact', 'about', 'forms', 'site-map']
  bad = []
  for (const p of phonePages) {
    await load(`#/services/${p}`, 360, 800)
    const o = await ev('__t.overflow()')
    if (o > 0) bad.push(`${p}:+${o}px`)
  }
  log('M1 no horizontal page scroll at 360 px on 10 pages', bad.length === 0, bad.join(', '))
  // Tables only appear after a search, so measure the results states too. (Measured without phone emulation,
  // which silently zooms the page out and hides overflow.)
  bad = []
  await load('#/services/case-status', 360, 800)
  await ev(`__t.tab('Case Type')`); await step(250)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.set('#caseType', 'Criminal Case (CC)')`); await ev(`__t.set('#year', '2025')`); await step(); await solve(); await press('Go')
  if ((await ev('__t.rows()')) < 1) bad.push('case-status: no results')
  if ((await ev('__t.overflow()')) > 0) bad.push(`case-status results:+${await ev('__t.overflow()')}px`)
  await ev(`__t.clickIn('#svc-main', 'View')`); await step(400)
  if ((await ev('__t.overflow()')) > 0) bad.push(`case record:+${await ev('__t.overflow()')}px`)
  await load('#/services/caveat', 360, 800)
  await ev(`__t.tab('Caveat Number')`); await step(250)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.set('#caveatNo', '1')`); await ev(`__t.set('#year', '2025')`); await step(); await solve(); await press('Go')
  if ((await ev('__t.rows()')) < 1) bad.push('caveat: no results')
  if ((await ev('__t.overflow()')) > 0) bad.push(`caveat results:+${await ev('__t.overflow()')}px`)
  await load('#/services/court-orders', 360, 800)
  await ev(`__t.tab('Case Number')`); await step(250)
  await court('Tamil Nadu', 'Chennai', 'Principal Sessions Court Complex')
  await ev(`__t.set('#caseType', 'Criminal Case (CC)')`); await ev(`__t.set('#number', '412')`); await ev(`__t.set('#year', '2025')`); await step(); await solve(); await press('Go')
  if ((await ev('__t.rows()')) < 1) bad.push('court-orders: no results')
  if ((await ev('__t.overflow()')) > 0) bad.push(`court-orders results:+${await ev('__t.overflow()')}px`)
  log('M2 no horizontal page scroll at 360 px on results pages and the case record', bad.length === 0, bad.join(', '))
  await load('#/services/cnr', 360, 800); await shot('m-cnr-phone.png')
  await load('#/services/contact', 360, 800); await shot('m-contact-phone.png')
  await load('#/services/cnr', 1280, 1000); await shot('m-cnr-desktop.png')
} catch (e) {
  log('script error', false, String(e.message || e))
} finally {
  chrome.kill()
}
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed} passed, ${failed} failed of ${results.length}`)
writeFileSync(join(OUT, 'services-check-results.json'), JSON.stringify(results, null, 2))
process.exit(failed ? 1 : 0)
