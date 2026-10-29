// Parity check: our Services-site Case Status against the official page https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index
// The OFFICIAL lists below were read from the live public page (text only; the CAPTCHA was not bypassed and results pages were not reached).
// Needs the frontend in mock mode:  frontend/: npm run dev -- --port 5174     then:  node specs/006-casestatus-parity/browser-check.mjs <output-folder>
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = process.env.APP_URL || 'http://localhost:5174/'
const OUT = process.argv[2] || tmpdir()
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9541
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- what the official page shows
const OFFICIAL = {
  topLinks: ['इ-कमिटी, उच्चतम न्यायालय, भारत', 'E-COMMITTEE, SUPREME COURT OF INDIA'],
  languages: ['English', 'हिन्दी', 'मराठी', 'ગુજરાતી', 'ಕನ್ನಡ', 'தமிழ்'],
  accessibility: ['Accessibility Tools', 'Color Contrast', 'High Contrast', 'Normal Contrast', 'Highlight Links', 'Invert Saturation', 'Text Size', 'A+ Font Size Increase',
    'A− Font Size Decrease', 'A Normal Font', 'Text Spacing', 'Line Height', 'Others', 'Hide Images', 'Big Cursor', 'Reset all settings'],
  header: ['जिला न्यायालय सेवाएं', 'eCourts Services', 'District and Taluka Courts of India'],
  notice: 'We have updated the district court services website theme. Please clear your browser cache and refresh the page to view the updated theme properly.',
  mainMenu: ['Home', 'e-Committee', 'Supreme Court', 'High Courts', 'District Courts', 'NJDG', 'Contact Us'],
  searchMenu: ['CNR Number', 'Case Status', 'Court Orders', 'Cause List', 'Caveat Search', 'Process Details', 'Location'],
  theme: { topbar: ['Light', 'Dark'], color: ['Default', 'Dark', 'Eco', 'Light'] },
  usefulLinks: ['About Us', 'Newsletter', 'Forms for Advocates', 'Help Videos', 'Site map', 'Contact Us', 'Web Information Manager', 'Copyright Policy', 'Hyperlinking Policy', 'Accessibility Statement', 'Screen Reader Access', 'Disclaimer'],
  partners: ['Digital India', 'National Portal of India', 'Department of Justice', 'e-Committee', 'India Code', 'NIC'],
  states: ['Andaman and Nicobar', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
    'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'The Dadra And Nagar Haveli And Daman And Diu', 'Tripura', 'Uttarakhand', 'Uttar Pradesh', 'West Bengal'],
  // [tab label, heading, [field label, required?], radios, select placeholders]
  modes: [
    ['Party Name', 'Case Status : Search by Petitioner/Respondent', [['Petitioner/Respondent', true], ['Registration Year', true]], ['Pending', 'Disposed', 'Both'], []],
    ['Case Number', 'Case Status : Search by Case Number', [['Case Type', true], ['Case Number', true], ['Year', true]], [], ['Select case type']],
    ['Filing Number', 'Case Status : Search by Filing Number', [['Case Type', true], ['Filing Number', true], ['Year', true]], [], ['Select case type']],
    ['Advocate', 'Case Status : Search by Advocate', [['Advocate', true]], ['Advocate Name', 'Bar Code', 'Date Case List', 'Pending', 'Disposed', 'Both'], []],
    ['FIR Number', 'Case Status : Search by FIR number', [['Police Station', true], ['FIR Number', false], ['Year', false]], ['Pending', 'Disposed', 'Both'], ['Select police station']],
    ['Act', 'Case Status : Search by Act Type', [['Search Act', false], ['Act Type', true], ['Under Section', false]], ['Pending', 'Disposed'], ['Select Act Type']],
    ['Case Type', 'Case Status : Search by Case Type', [['Case Type', true], ['Year', true]], ['Pending', 'Disposed'], ['Select case type']],
  ],
  common: { placeholders: ['Select state', 'Select district', 'Select court complex', 'Select establishment'], captcha: 'Enter Captcha', required: 'Fields marked with * are required', help: 'Click here to view help video' },
}

const dir = mkdtempSync(join(tmpdir(), 'cdp-par-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' })
const results = []
const log = (id, name, ok, detail = '') => { results.push({ id, name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${name}${detail ? '  -> ' + detail : ''}`) }
const norm = (s) => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()

try {
  let targets
  for (let i = 0; i < 25; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break } catch { await sleep(300) } }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r))
  let id = 0; const pending = new Map()
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } })
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval error'); return r.result.result.value }
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); writeFileSync(join(OUT, name), Buffer.from(r.result.data, 'base64')) }
  const helpers = `window.__t = {
    set(sel, v) { const el = document.querySelector(sel); if (!el) throw new Error('missing ' + sel);
      const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })) },
    clickIn(scope, text) { const root = document.querySelector(scope); if (!root) throw new Error('no scope ' + scope);
      const b = [...root.querySelectorAll('button,a,summary')].find((e) => { const t = e.textContent.replace(/\\u00a0/g, ' ').trim(); return (t === text || t.startsWith(text + ' ')) && !e.disabled }); if (!b) throw new Error('no ' + text + ' in ' + scope); b.click() },
    tab(text) { const b = [...document.querySelectorAll('#svc-main [role=tab]')].find((e) => e.textContent.trim() === text); if (!b) throw new Error('no tab ' + text); b.click() },
    captcha() { return document.querySelector('.captcha').textContent.trim() }
  }; true`
  const load = async (path, w = 1280, h = 1000) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
    await send('Page.enable'); await send('Page.navigate', { url: 'about:blank' }); await sleep(150)
    await send('Page.navigate', { url: BASE + path }); await sleep(2500); await ev(helpers)
  }
  const step = (ms = 250) => sleep(ms)
  const text = () => ev('document.body.innerText')
  const inOrder = (hay, needles) => { let at = -1; for (const n of needles) { const i = hay.indexOf(norm(n), at + 1); if (i < 0) return n; at = i } return null }

  // ---------------------------------------------------------------- A. page chrome
  await load('#/services/case-status')
  const T0 = norm(await text())
  log('A01', 'Top bar: Hindi and English e-Committee links', OFFICIAL.topLinks.every((l) => T0.includes(norm(l))))
  log('A02', 'Skip to main content link', await ev(`!!document.querySelector('a.skip[href="#svc-main"]') && document.querySelector('a.skip').textContent.trim() === 'Skip to main content'`))
  const langs = await ev(`[...document.querySelectorAll('.svc-top select option')].map((o) => o.textContent.trim())`)
  log('A03', 'Language list: English, हिन्दी, मराठी, ગુજરાતી, ಕನ್ನಡ, தமிழ் in order', JSON.stringify(langs) === JSON.stringify(OFFICIAL.languages), langs.join(' | '))
  const hdr = OFFICIAL.header.filter((h) => !T0.includes(norm(h)))
  log('A04', 'Header text (Hindi title, eCourts Services, District and Taluka Courts of India)', hdr.length === 0, hdr.join(', '))
  log('A05', 'Search this site field with a Search button', await ev(`!!document.querySelector('#svc-q') && [...document.querySelectorAll('.svc-search button')].some((b) => b.textContent.trim() === 'Search')`))
  const mm = await ev(`[...document.querySelectorAll('nav[aria-label="Main menu"] > *')].map((e) => e.textContent.replace(/\\(external site\\)/, '').trim())`)
  log('A06', 'Main menu in the official order (7 items)', JSON.stringify(mm) === JSON.stringify(OFFICIAL.mainMenu), mm.join(' | '))
  const sm = await ev(`[...document.querySelectorAll('aside[aria-label="Search Menu"] button')].map((e) => e.textContent.trim())`)
  log('A07', 'Search Menu in the official order (7 items)', JSON.stringify(sm) === JSON.stringify(OFFICIAL.searchMenu), sm.join(' | '))
  log('A08', 'Theme-update notice, word for word, and it can be dismissed', T0.includes(norm(OFFICIAL.notice)) && (await ev(`[...document.querySelectorAll('.svc-notice button')].some((b) => b.textContent.trim() === 'Dismiss')`)))
  await ev(`document.querySelector('.svc-theme button').click()`); await step()
  const th = await ev(`document.querySelector('.svc-themepanel').innerText`)
  const thMiss = ['Theme Customizer', 'Topbar Color', 'Theme Color', ...OFFICIAL.theme.topbar, ...OFFICIAL.theme.color].filter((x) => !norm(th).includes(norm(x)))
  log('A09', 'Theme Customizer: Topbar Color (Light, Dark) and Theme Color (Default, Dark, Eco, Light)', thMiss.length === 0, thMiss.join(', '))
  await ev(`document.querySelector('.svc-theme button').click()`); await step(200)
  await ev(`document.querySelector('.dispwrap button').click()`); await step()
  const ac = norm(await ev(`document.querySelector('#dispmenu').innerText`))
  const acMiss = OFFICIAL.accessibility.filter((x) => !ac.includes(norm(x)))
  log('A10', 'Accessibility Tools: all 16 official controls, same wording and groups', acMiss.length === 0, acMiss.join(', '))
  await ev(`[...document.querySelectorAll('#dispmenu input')].find((i) => i.closest('label').textContent.includes('High Contrast')).click()`); await step()
  const hcOn = await ev(`document.documentElement.classList.contains('hc')`)
  await ev(`[...document.querySelectorAll('#dispmenu button')].find((b) => b.textContent.trim() === 'Normal Contrast').click()`); await step()
  const hcOff = await ev(`!document.documentElement.classList.contains('hc')`)
  await ev(`[...document.querySelectorAll('#dispmenu button')].find((b) => b.textContent.includes('A+')).click()`); await step()
  const big = await ev(`document.documentElement.style.fontSize`)
  await ev(`[...document.querySelectorAll('#dispmenu button')].find((b) => b.textContent.trim() === 'Reset all settings').click()`); await step()
  log('A11', 'Accessibility controls work: High Contrast on, Normal Contrast off, A+ grows text, Reset all settings', hcOn && hcOff && big === '110%' && (await ev(`document.documentElement.style.fontSize`)) === '100%', `big=${big}`)
  await ev(`document.querySelector('.dispwrap button').click()`); await step(200)
  const foot = norm(await ev(`document.querySelector('footer').innerText`))
  const fo = inOrder(foot, OFFICIAL.usefulLinks)
  log('A12', 'Footer: the 12 Useful Links in the official order', fo === null, fo ? 'out of order at ' + fo : '')
  const stm = ['Supreme Court of India', 'National Informatics Centre', 'Last Updated', '2 January 2026', 'Version', '1.0', 'Follow Us'].filter((x) => !foot.includes(norm(x)))
  log('A13', 'Footer statements: owner, NIC hosting, Last Updated 2 January 2026, Version 1.0, Follow Us', stm.length === 0, stm.join(', '))
  const pa = inOrder(foot, OFFICIAL.partners)
  log('A14', 'Footer: the 6 partner links in the official order', pa === null, pa ? 'out of order at ' + pa : '')
  log('A15', 'Keyboard tip for combo boxes (Enter, then Alt+Down Arrow)', norm(await text()).includes('alt') && norm(await text()).includes('down arrow'))
  await ev(`__t.clickIn('nav[aria-label="Main menu"]', 'e-Committee')`); await step(400)
  const ext = await ev(`(() => { const d = document.querySelector('[role=alertdialog]'); return d ? [...d.querySelectorAll('button,a')].map((b) => b.textContent.trim()).join('|') : '' })()`)
  log('A16', 'External site alert opens with Go and Cancel', /Cancel/.test(ext) && /Go/.test(ext), ext)
  await ev(`__t.clickIn('[role=alertdialog]', 'Cancel')`); await step(300)

  // ---------------------------------------------------------------- B. every Case Status search mode
  await load('#/services/case-status')
  await shot('ours-casestatus-party.png')
  const stateOpts = await ev(`[...document.querySelectorAll('#state option')].slice(1).map((o) => o.textContent.trim())`)
  log('B00', 'State list: the official 36 entries in the official order', JSON.stringify(stateOpts) === JSON.stringify(OFFICIAL.states), `ours=${stateOpts.length}`)
  const ph = await ev(`['state', 'district', 'complex', 'establishment'].map((i) => document.querySelector('#' + i + ' option')?.textContent.trim().toLowerCase())`)
  log('B01', 'Dropdown placeholders: Select state / district / court complex / establishment', JSON.stringify(ph) === JSON.stringify(OFFICIAL.common.placeholders.map((x) => x.toLowerCase())), ph.join(' | '))
  await ev(`__t.set('#state', 'Tamil Nadu')`); await step()
  log('B02', 'Cascade works: choosing a state enables the district list', await ev(`!document.querySelector('#district').disabled && document.querySelectorAll('#district option').length > 1`))
  const tabsNow = await ev(`[...document.querySelectorAll('#svc-main [role=tab]')].map((e) => e.textContent.trim())`)
  log('B03', 'Seven search tabs: Party Name, Case Number, Filing Number, Advocate, FIR Number, Act, Case Type', JSON.stringify(tabsNow) === JSON.stringify(OFFICIAL.modes.map((m) => m[0])), tabsNow.join(' | '))
  let n = 4
  for (const [tabLabel, heading, fields, radios, placeholders] of OFFICIAL.modes) {
    const tag = `B${String(n++).padStart(2, '0')}`
    await ev(`__t.tab(${JSON.stringify(tabLabel)})`); await step(350)
    await ev(`document.querySelector('#searchpanel details')?.setAttribute('open', '')`)
    const panel = await ev(`(() => { const f = document.querySelector('#searchpanel'); const labels = [...f.querySelectorAll('label')].filter((l) => !l.querySelector('input[type=radio]')).map((l) => ({ t: l.textContent.replace(/\\u00a0/g, ' '), req: /^\\s*\\*/.test(l.textContent) })); return { text: f.innerText, h: f.querySelector('h4')?.textContent.trim(), labels, radios: [...f.querySelectorAll('input[type=radio]')].map((r) => r.closest('label').textContent.trim()), selects: [...f.querySelectorAll('select')].map((s) => s.options[0]?.textContent.trim()), go: [...f.querySelectorAll('button')].map((b) => b.textContent.trim()) } })()`)
    const problems = []
    if (norm(panel.h) !== norm(heading)) problems.push(`heading "${panel.h}"`)
    for (const [name, req] of fields) {
      const lab = panel.labels.find((l) => norm(l.t.replace(/^\s*\*\s*/, '').replace(/\(required\)/i, '')).startsWith(norm(name)))
      if (!lab) problems.push(`missing field "${name}"`); else if (lab.req !== req) problems.push(`"${name}" required=${lab.req}, official ${req}`)
    }
    for (const r of radios) if (!panel.radios.some((x) => norm(x) === norm(r))) problems.push(`missing option "${r}"`)
    for (const p of placeholders) if (!panel.selects.some((s) => norm(s) === norm(p))) problems.push(`missing placeholder "${p}"`)
    if (tabLabel === 'Act' && panel.radios.some((x) => norm(x) === 'both')) problems.push('Act must not offer Both')
    if (tabLabel === 'Case Type' && panel.radios.some((x) => norm(x) === 'both')) problems.push('Case Type must not offer Both')
    if (!norm(panel.text).includes(norm(OFFICIAL.common.captcha))) problems.push('no Enter Captcha')
    if (!(await ev(`!!document.querySelector('#searchpanel .captcha')`))) problems.push('no captcha image')
    if (!norm(panel.text).includes(norm(OFFICIAL.common.required))) problems.push('no required-fields note')
    if (!norm(panel.text).includes(norm(OFFICIAL.common.help))) problems.push('no help-video link')
    if (!panel.go.includes('Go') || !panel.go.includes('Back')) problems.push('Go/Back buttons')
    if (tabLabel === 'Act' && !panel.go.includes('Search')) problems.push('Search button beside Search Act')
    log(tag, `${tabLabel}: heading "${heading}", fields, options, captcha, Go and Back`, problems.length === 0, problems.join('; '))
    await shot(`ours-casestatus-${tabLabel.toLowerCase().replace(/\W+/g, '-')}.png`)
  }

  // ---------------------------------------------------------------- C. behaviour: validation, a real search, case history
  await ev(`__t.tab('Party Name')`); await step(300)
  await ev(`__t.clickIn('#searchpanel', 'Go')`); await step(400)
  const errs = await ev(`document.querySelectorAll('#searchpanel [role=alert]').length`)
  log('C01', 'Pressing Go with nothing filled lists errors beside the fields (announced as alerts)', errs >= 3, `${errs} alerts`)
  await ev(`__t.set('#state', 'Tamil Nadu')`); await step(); await ev(`__t.set('#district', 'Chennai')`); await step(); await ev(`__t.set('#complex', 'Principal Sessions Court Complex')`); await step()
  await ev(`__t.set('#name', 'ab')`); await ev(`__t.set('#year', '2025')`); await step()
  await ev(`__t.set('#captcha', ${JSON.stringify(await ev('__t.captcha()'))})`); await ev(`__t.clickIn('#searchpanel', 'Go')`); await step(500)
  log('C02', 'Party name shorter than 3 characters is refused with a message', norm(await text()).includes('at least 3'))
  await ev(`__t.set('#name', 'kumar')`); await step()
  await ev(`__t.set('#captcha', ${JSON.stringify(await ev('__t.captcha()'))})`); await ev(`__t.clickIn('#searchpanel', 'Go')`); await step(1300)
  const rows = await ev(`document.querySelectorAll('#svc-main table tbody tr').length`)
  log('C03', 'A valid Party Name search returns a results list', rows > 0, `${rows} rows`)
  await shot('ours-casestatus-results.png')
  await ev(`__t.clickIn('#svc-main table', 'View')`); await step(700)
  const det = norm(await text())
  const dm = ['Case details', 'Case status', 'Acts', 'FIR details', 'History', 'IA business', 'Orders'].filter((x) => !det.includes(norm(x)))
  log('C04', 'View opens the case history with Case details, Case status, Acts, FIR details, History, IA business, Orders', dm.length === 0, dm.join(', '))
  await shot('ours-casestatus-case-history.png')
  await ev(`__t.clickIn('#svc-main', '← Back to results')`); await step(500)
  log('C05', 'Back returns to the results list with the search kept', (await ev(`document.querySelectorAll('#svc-main table tbody tr').length`)) === rows)
  await ev(`__t.tab('Advocate')`); await step(300)
  await ev(`[...document.querySelectorAll('#searchpanel input[name=by]')].find((r) => r.closest('label').textContent.includes('Bar Code'))?.click()`); await step(300)
  const adv = norm(await ev(`document.querySelector('#searchpanel').innerText`))
  log('C06', 'Advocate: choosing Bar Code shows the Advocate Bar Code field with the MAH/XXXX/1982 format', adv.includes('advocate bar code') && adv.includes('mah/'))
  await ev(`[...document.querySelectorAll('#searchpanel input[name=by]')].find((r) => r.closest('label').textContent.includes('Date Case List'))?.click()`); await step(300)
  log('C07', 'Advocate: choosing Date Case List shows Case List Date (with a date picker)', (await ev(`!!document.querySelector('#searchpanel input[type=date]')`)) && norm(await ev(`document.querySelector('#searchpanel').innerText`)).includes('case list date'))
  await ev(`__t.tab('Act')`); await step(300)
  await ev(`__t.set('#actSearch', 'ma')`); await ev(`__t.clickIn('#searchpanel', 'Search')`); await step(300)
  const hint3 = norm(await text()).includes('at least 3 characters')
  await ev(`__t.set('#actSearch', 'penal')`); await ev(`__t.clickIn('#searchpanel', 'Search')`); await step(300)
  const acts = await ev(`document.querySelectorAll('#actType option').length`)
  log('C08', 'Act: "Search Act" needs 3 characters and the Search button fills the Act Type list', hint3 && acts > 1, `${acts - 1} acts listed`)
} catch (e) {
  log('ERR', 'script error', false, String(e.message || e))
} finally { chrome.kill() }
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed} passed, ${failed} failed of ${results.length}`)
writeFileSync(join(OUT, 'casestatus-parity-results.json'), JSON.stringify({ officialSource: 'https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index', checkedAt: new Date().toISOString(), results }, null, 2))
process.exit(failed ? 1 : 0)
