import type { PageId } from '../../types'

/** What a spoken or typed phrase asks the app to do. Parsing is pure; carrying it out is in dom.ts and VoiceControl. */
export type Action =
  | { t: 'go'; page: PageId } | { t: 'back' } | { t: 'forward' } | { t: 'reload' }
  | { t: 'scroll'; dir: 'up' | 'down' | 'top' | 'bottom' }
  | { t: 'click'; name: string } | { t: 'focus'; name: string }
  | { t: 'type'; text: string } | { t: 'set'; name: string; value: string }
  | { t: 'check'; name: string; on: boolean }
  | { t: 'clear' } | { t: 'next' } | { t: 'prev' } | { t: 'submit' }
  | { t: 'dictate'; on: boolean }
  | { t: 'display'; change: 'bigger' | 'smaller' | 'normal' | 'contrast-on' | 'contrast-off' | 'reset' }
  | { t: 'signout' } | { t: 'help' } | { t: 'stop' } | { t: 'read' }
  | { t: 'numbers'; on: boolean } | { t: 'number'; n: number } | { t: 'replies'; on: boolean }
  | { t: 'unknown'; heard: string }

/** Names people say for each screen. Longer phrases are tried first. */
export const PAGE_ALIASES: Record<string, PageId> = {
  dashboard: 'dashboard', home: 'dashboard', 'workspace home': 'dashboard', overview: 'dashboard',
  cases: 'cases', case: 'cases', matters: 'cases', matter: 'cases', 'cases and matters': 'cases', 'my matters': 'cases',
  'case status': 'caseStatus', status: 'caseStatus', 'cause list': 'causeList', 'court orders': 'courtOrders', orders: 'courtOrders',
  'services site': 'services', services: 'services', 'ecourts services': 'services',
  assistant: 'assistant', 'ai assistant': 'assistant', 'legal assistant': 'assistant', chat: 'assistant',
  research: 'research', 'rag research': 'research', documents: 'documents', 'documents and ocr': 'documents', ocr: 'documents',
  mapping: 'mapping', 'section mapping': 'mapping', 'legal section mapping': 'mapping', sections: 'mapping',
  voice: 'voice', dictation: 'voice', 'voice to text': 'voice', hearing: 'hearing', 'hearing preparation': 'hearing', 'hearing prep': 'hearing',
  calendar: 'calendar', 'calendar and follow up': 'calendar', schedule: 'calendar', diary: 'calendar',
  intake: 'intake', 'client intake': 'intake', 'new client': 'intake', billing: 'billing', 'time and billing': 'billing', invoices: 'billing', time: 'billing',
  'portal home': 'portalHome', portal: 'portalHome', 'ecourts portal': 'portalHome', about: 'portalAbout', 'about ecourts': 'portalAbout',
  'high courts': 'portalHighCourts', 'district courts': 'portalDistrict', forms: 'portalForms', 'forms for advocates': 'portalForms',
  contact: 'portalContact', 'contact us': 'portalContact', help: 'portalHelp', 'useful links': 'portalHelp', 'search portal': 'portalSearch',
  'site map': 'portalSitemap', sitemap: 'portalSitemap', 'help videos': 'portalHelpVideos', privacy: 'portalPrivacy', 'privacy policy': 'portalPrivacy',
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

/** "12", "twelve" and "twenty five" all give a number; anything else gives null. */
export function parseNumber(text: string): number | null {
  const t = text.trim().toLowerCase().replace(/-/g, ' ')
  if (/^\d{1,3}$/.test(t)) return Number(t)
  const w = t.split(' ')
  if (w.length === 1) { const i = ONES.indexOf(w[0]); if (i >= 0) return i; const k = TENS.indexOf(w[0]); return k >= 2 ? k * 10 : null }
  if (w.length === 2) { const k = TENS.indexOf(w[0]); const o = ONES.indexOf(w[1]); if (k >= 2 && o >= 1 && o <= 9) return k * 10 + o }
  return null
}

const clean = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[.!?]+$/g, '').replace(/^(?:hey |ok |okay |computer |please )+/g, '').replace(/\s+/g, ' ').trim()
const stripPage = (s: string) => s.replace(/^the /, '').replace(/ (?:page|screen|section|tab)$/, '').replace(/&/g, 'and').replace(/-/g, ' ')

export function parseCommand(raw: string): Action {
  const p = clean(raw)
  // Values the person dictates keep their own capitals and punctuation; only the command words are matched loosely.
  const keep = raw.replace(/[.!?]+$/g, '').replace(/^\s*(?:(?:hey|ok|okay|computer|please) )+/i, '').replace(/\s+/g, ' ').trim()
  let m: RegExpMatchArray | null
  if (!p) return { t: 'unknown', heard: raw }
  if (/^(?:stop listening|voice off|turn off voice|stop voice|exit voice|switch off voice)$/.test(p)) return { t: 'stop' }
  if (/^(?:help|voice help|what can i say|show commands|list commands|show help|commands)$/.test(p)) return { t: 'help' }
  if (/^(?:start|begin|turn on) dictat(?:ing|ion)$|^dictation on$|^dictate$/.test(p)) return { t: 'dictate', on: true }
  if (/^(?:stop|end|finish|turn off) dictat(?:ing|ion)$|^dictation off$/.test(p)) return { t: 'dictate', on: false }
  if (/^(?:show|display|turn on|switch on|enable)(?: the)? numbers?$|^numbers? on$/.test(p)) return { t: 'numbers', on: true }
  if (/^(?:hide|remove|turn off|switch off|disable|clear)(?: the)? numbers?$|^numbers? off$/.test(p)) return { t: 'numbers', on: false }
  if (/^(?:show|display|open|turn on)(?: the)? (?:replies|reply history|conversation)$|^replies on$/.test(p)) return { t: 'replies', on: true }
  if (/^(?:hide|close|turn off)(?: the)? (?:replies|reply history|conversation)$|^replies off$/.test(p)) return { t: 'replies', on: false }
  {
    // "12", "click 12", "press number twelve", "open item 3"
    const rest = p.replace(/^(?:(?:click|press|tap|select|open|choose|pick|focus|go to|number|item|button|link)\s+)+/, '')
    const n = parseNumber(rest)
    if (n !== null && n >= 1) return { t: 'number', n }
  }
  if (/^(?:go )?back$|^previous page$|^navigate back$/.test(p)) return { t: 'back' }
  if (/^(?:go )?forward$|^next page$/.test(p)) return { t: 'forward' }
  if (/^(?:reload|refresh)(?: the)?(?: page)?$/.test(p)) return { t: 'reload' }
  if ((m = p.match(/^(?:scroll|page|move) (up|down)$/))) return { t: 'scroll', dir: m[1] as 'up' | 'down' }
  if (/^(?:scroll (?:to )?(?:the )?top|go to (?:the )?top|top of (?:the )?page)$/.test(p)) return { t: 'scroll', dir: 'top' }
  if (/^(?:scroll (?:to )?(?:the )?(?:bottom|end)|go to (?:the )?(?:bottom|end)|bottom of (?:the )?page)$/.test(p)) return { t: 'scroll', dir: 'bottom' }
  if (/^(?:make )?(?:the )?(?:text|font|letters?)(?: size)? (?:bigger|larger)$|^(?:increase|enlarge) (?:the )?(?:text|font)(?: size)?$|^zoom in$|^bigger text$|^larger text$/.test(p)) return { t: 'display', change: 'bigger' }
  if (/^(?:make )?(?:the )?(?:text|font|letters?)(?: size)? (?:smaller)$|^(?:decrease|reduce|shrink) (?:the )?(?:text|font)(?: size)?$|^zoom out$|^smaller text$/.test(p)) return { t: 'display', change: 'smaller' }
  if (/^(?:normal|default|reset) (?:text|font)(?: size)?$/.test(p)) return { t: 'display', change: 'normal' }
  if (/^(?:turn on|enable|switch on) high contrast$|^high contrast(?: on)?$/.test(p)) return { t: 'display', change: 'contrast-on' }
  if (/^(?:turn off|disable|switch off) high contrast$|^normal contrast$|^high contrast off$/.test(p)) return { t: 'display', change: 'contrast-off' }
  if (/^reset (?:display|display settings|accessibility|all settings)$/.test(p)) return { t: 'display', change: 'reset' }
  if (/^(?:sign|log) ?out$|^log me out$/.test(p)) return { t: 'signout' }
  if (/^read(?: this)?(?: page| screen| aloud)?$|^read (?:the )?headings?$|^where am i$/.test(p)) return { t: 'read' }
  if (/^(?:next|tab)(?: field| box| input)?$/.test(p)) return { t: 'next' }
  if (/^(?:previous|prior|last)(?: field| box| input)$|^shift tab$/.test(p)) return { t: 'prev' }
  if (/^(?:clear|empty|erase|delete)(?: this| the)?(?: field| box| text| input)?$/.test(p)) return { t: 'clear' }
  if (/^(?:submit|submit form|press enter|enter|go|send form|search now)$/.test(p)) return { t: 'submit' }
  if ((m = keep.match(/^(?:set|fill|fill in|put) (.+?) (?:to|as|with|equals) (.+)$/i))) return { t: 'set', name: m[1].toLowerCase(), value: m[2] }
  if ((m = keep.match(/^(?:choose|select|pick) (.+?) (?:in|for|from|on) (.+)$/i))) return { t: 'set', name: m[2].toLowerCase(), value: m[1] }
  if (/^(?:type|write|dictate|say|insert|input) .+$/.test(p)) return { t: 'type', text: raw.replace(/^\s*(?:hey |ok |okay |computer |please )*\w+\s+/i, '').trim() }
  if ((m = p.match(/^(?:uncheck|untick|un tick|deselect|turn off|disable|clear the box|switch off) (.+)$/))) return { t: 'check', name: m[1], on: false }
  if ((m = p.match(/^(?:check|tick|turn on|enable|switch on) (.+)$/))) return { t: 'check', name: m[1], on: true }
  if ((m = p.match(/^(?:go to|open|show|take me to|navigate to|switch to|visit) (.+)$/))) {
    const key = stripPage(m[1])
    if (PAGE_ALIASES[key]) return { t: 'go', page: PAGE_ALIASES[key] }
    const o = p.match(/^(?:open|show) (.+)$/)
    if (o) return { t: 'click', name: o[1] }
  }
  if ((m = p.match(/^(?:focus|edit|jump to|field|go to field|select field|click in) (.+)$/))) return { t: 'focus', name: m[1] }
  if ((m = p.match(/^(?:click|press|tap|push|hit|choose|select|pick|activate) (.+)$/))) return { t: 'click', name: m[1] }
  const direct = PAGE_ALIASES[stripPage(p)]
  if (direct) return { t: 'go', page: direct }
  return { t: 'unknown', heard: raw }
}

/** What the help window lists. Keep it in step with parseCommand (a test checks every example parses). */
export const HELP: { group: string; items: { say: string; does: string }[] }[] = [
  { group: 'Move around', items: [
    { say: 'open calendar', does: 'Go to a screen (cases, billing, intake, research, high courts, services site…)' },
    { say: 'go back / go forward / refresh', does: 'Browser history and reload' },
    { say: 'scroll down / scroll up / go to top / go to bottom', does: 'Scroll the page' },
    { say: 'read page', does: 'Read the heading aloud' },
  ] },
  { group: 'Use controls', items: [
    { say: 'click save', does: 'Press a button, link or tab by its name' },
    { say: 'focus client name', does: 'Move to a field by its label' },
    { say: 'type Sample Party v. State', does: 'Type into the field you are in' },
    { say: 'set hours to 2', does: 'Fill a named field, choose a list option or tick a box' },
    { say: 'choose Criminal in practice area', does: 'Pick an option from a list' },
    { say: 'check voice commands / uncheck voice commands', does: 'Tick or untick a box' },
    { say: 'next field / previous field / clear field / submit', does: 'Move between fields, empty one, send the form' },
  ] },
  { group: 'Numbers and replies', items: [
    { say: 'show numbers / hide numbers', does: 'Put a number on everything you can press, so you can say the number' },
    { say: 'click 12 / 12 / press number twelve', does: 'Press, or move into, the item with that number' },
    { say: 'show replies / hide replies', does: 'Show what you said and what the app answered' },
  ] },
  { group: 'Dictation', items: [
    { say: 'start dictation / stop dictation', does: 'Everything you say is typed into the current field until you stop' },
  ] },
  { group: 'Display and account', items: [
    { say: 'make text bigger / make text smaller / normal text size', does: 'Change the text size' },
    { say: 'high contrast on / high contrast off / reset display', does: 'Change contrast' },
    { say: 'sign out', does: 'Sign out of the workspace' },
  ] },
  { group: 'Voice control itself', items: [
    { say: 'what can I say', does: 'Show this list (Alt+C opens a box to type a command instead)' },
    { say: 'stop listening', does: 'Turn voice control off' },
  ] },
]
