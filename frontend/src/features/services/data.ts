import { HELP_VIDEOS, HIGH_COURTS, type HighCourt } from '../portal/data'

/**
 * Structure and text of the eCourts District and Taluka Courts services site, read from
 * https://services.ecourts.gov.in/ecourtindia_v6/ on 2026-10-27 (text only; nothing submitted).
 * Not official data and not affiliated with the judiciary.
 */
export const SVC_REVIEWED = '2026-10-27'
export const SVC_OFFICIAL_HOME = 'https://services.ecourts.gov.in/ecourtindia_v6/'

export type SvcSlug =
  | 'cnr' | 'case-status' | 'court-orders' | 'cause-list' | 'caveat' | 'process' | 'location'
  | 'high-courts' | 'contact' | 'about' | 'newsletter' | 'forms' | 'help-videos' | 'site-map'
  | 'web-info' | 'copyright' | 'hyperlinking' | 'accessibility' | 'screen-reader' | 'disclaimer' | 'search'

export const DEFAULT_SLUG: SvcSlug = 'cnr'

export interface SvcMenuItem { label: string; slug?: SvcSlug; url?: string }

/** Top bar links (opened through the external-site alert). */
export const TOP_LINKS: SvcMenuItem[] = [
  { label: 'e-Committee, Supreme Court of India', url: 'https://ecommitteesci.gov.in/' },
]

/** Main menu, in the official order. */
export const SVC_MAIN_MENU: SvcMenuItem[] = [
  { label: 'Home', slug: 'cnr' },
  { label: 'e-Committee', url: 'https://ecommitteesci.gov.in/' },
  { label: 'Supreme Court', url: 'https://supremecourtofindia.nic.in/' },
  { label: 'High Courts', slug: 'high-courts' },
  { label: 'District Courts', url: 'https://ecourts.gov.in/ecourts2.0/' },
  { label: 'NJDG', url: 'https://njdg.ecourts.gov.in/njdg_public/' },
  { label: 'Contact Us', slug: 'contact' },
]

/** Left Search Menu, in the official order. */
export const SEARCH_MENU: SvcMenuItem[] = [
  { label: 'CNR Number', slug: 'cnr' },
  { label: 'Case Status', slug: 'case-status' },
  { label: 'Court Orders', slug: 'court-orders' },
  { label: 'Cause List', slug: 'cause-list' },
  { label: 'Caveat Search', slug: 'caveat' },
  { label: 'Process Details', slug: 'process' },
  { label: 'Location', slug: 'location' },
]

/** The 12 footer "Useful Links", in the official order. */
export const FOOTER_LINKS: SvcMenuItem[] = [
  { label: 'About Us', slug: 'about' },
  { label: 'Newsletter', slug: 'newsletter' },
  { label: 'Forms for Advocates', slug: 'forms' },
  { label: 'Help Videos', slug: 'help-videos' },
  { label: 'Site map', slug: 'site-map' },
  { label: 'Contact Us', slug: 'contact' },
  { label: 'Web Information Manager', slug: 'web-info' },
  { label: 'Copyright Policy', slug: 'copyright' },
  { label: 'Hyperlinking Policy', slug: 'hyperlinking' },
  { label: 'Accessibility Statement', slug: 'accessibility' },
  { label: 'Screen Reader Access', slug: 'screen-reader' },
  { label: 'Disclaimer', slug: 'disclaimer' },
]

export const SVC_SLUGS: SvcSlug[] = [
  'cnr', 'case-status', 'court-orders', 'cause-list', 'caveat', 'process', 'location', 'high-courts', 'contact', 'about',
  'newsletter', 'forms', 'help-videos', 'site-map', 'web-info', 'copyright', 'hyperlinking', 'accessibility', 'screen-reader',
  'disclaimer', 'search',
]

/** Page titles, used for breadcrumbs, the browser title and site search. */
export const SLUG_TITLES: Record<SvcSlug, string> = {
  cnr: 'CNR Number', 'case-status': 'Case Status', 'court-orders': 'Court Orders', 'cause-list': 'Cause List',
  caveat: 'Caveat Search', process: 'Process Details', location: 'Location', 'high-courts': 'High Courts', contact: 'Contact Us',
  about: 'About Us', newsletter: 'Newsletter', forms: 'Forms for Advocates', 'help-videos': 'Help Videos', 'site-map': 'Site map',
  'web-info': 'Web Information Manager', copyright: 'Copyright Policy', hyperlinking: 'Hyperlinking Policy',
  accessibility: 'Accessibility Statement', 'screen-reader': 'Screen Reader Access', disclaimer: 'Disclaimer', search: 'Search this site',
}

/** The six languages offered; only English is available in this prototype. */
export const SVC_LANGUAGES = ['English', 'हिन्दी', 'मराठी', 'ગુજરાતી', 'ಕನ್ನಡ', 'தமிழ்']

export const TOPBAR_OPTIONS = ['Light', 'Dark'] as const
export const THEME_OPTIONS = ['Default', 'Dark', 'Eco', 'Light'] as const

export const NOTICE_TEXT = 'We have updated the district court services website theme. Please clear your browser cache and refresh the page to see the changes.'
export const USAGE_WARNING = 'Do not use browser toolbar reload or back button'
export const USAGE_WARNING_NOTE = 'This prototype supports reload and the Back button.'
export const KEYBOARD_TIP = 'The best way to access combo boxes is by pressing Enter on the box, followed by Alt+Down Arrow.'
export const APP_LINE = 'Download eCourts Services App :'
export const APP_BADGES = ['Google Play', 'App Store']
export const CNR_EXAMPLE = 'MHAU019999992015'
export const CNR_NOTE = 'If you dont have CNR Number then use other options from Search Menu section.'
export const REGISTERED_EMAIL_NOTE = 'Email address should be registered with the court.'

export const SITE_FACTS = {
  owner: 'Content owned by eCommittee, Supreme Court of India.',
  host: 'Designed, developed, hosted and maintained by the National Informatics Centre (NIC), Ministry of Electronics & Information Technology, Government of India.',
  lastUpdated: '2 January 2026',
  version: '1.0',
  youtube: 'https://www.youtube.com/channel/UCPMHFB1lou-P_YtErFFYjgw',
}

/** The 25 High Courts and their websites, exactly as listed on the services site (several use http). */
export const HC_SITES: { name: string; url: string }[] = [
  ['Allahabad High Court', 'http://allahabadhighcourt.in/'], ['Andhra Pradesh High Court', 'https://aphc.gov.in/'],
  ['Bombay High Court', 'https://bombayhighcourt.gov.in/bhc/'], ['Calcutta High Court', 'https://www.calcuttahighcourt.gov.in/'],
  ['Chhattisgarh High Court', 'http://highcourt.cg.gov.in/'], ['Delhi High Court', 'http://delhihighcourt.nic.in/'],
  ['Gauhati High Court', 'https://ghconline.gov.in/'], ['Gujarat High Court', 'http://gujarathighcourt.nic.in/'],
  ['Himachal Pradesh High Court', 'https://highcourt.hp.gov.in/'], ['Jammu & Kashmir and Ladakh High Court', 'http://jkhighcourt.nic.in/'],
  ['Jharkhand High Court', 'http://jharkhandhighcourt.nic.in/'], ['Karnataka High Court', 'https://judiciary.karnataka.gov.in/'],
  ['Kerala High Court', 'https://highcourt.kerala.gov.in/'], ['Madhya Pradesh High Court', 'http://mphc.gov.in/'],
  ['Madras High Court', 'https://hcmadras.tn.gov.in/'], ['Manipur High Court', 'http://hcmimphal.nic.in/'],
  ['Meghalaya High Court', 'http://meghalayahighcourt.nic.in/'], ['Orissa High Court', 'http://www.orissahighcourt.nic.in/'],
  ['Patna High Court', 'http://patnahighcourt.gov.in/'], ['Punjab & Haryana High Court', 'http://highcourtchd.gov.in/'],
  ['Rajasthan High Court', 'http://hcraj.nic.in/'], ['Sikkim High Court', 'http://hcs.gov.in/'],
  ['Telangana High Court', 'http://tshc.gov.in'], ['Tripura High Court', 'http://thc.nic.in/'],
  ['Uttarakhand High Court', 'http://highcourtofuttarakhand.gov.in/'],
].map(([name, url]) => ({ name, url }))

export const CONTACT_EMAIL = 'ecommittee[at]aij[dot]gov[dot]in'
export const CONTACT_NOTE = 'For queries or issues about the availability or updating of case data on this portal, contact the Central Project Coordinator (CPC) of the High Court that has jurisdiction over the court concerned.'
/** The services-site table lists 24 courts; the main portal's table also lists Telangana (25). */
export const CONTACT_ROWS: HighCourt[] = HIGH_COURTS.filter((h) => h.name !== 'Telangana')
export const CONTACT_DISCREPANCY = 'The services site table lists 24 High Courts. The main eCourts portal lists 25, including Telangana (cpc-tshc[at]aij[dot]gov[dot]in).'

export const ABOUT = {
  origin: 'The eCourts project grew out of the National Policy and Action Plan for implementation of ICT in the judiciary prepared in 2005 by the eCommittee of the Supreme Court of India. The eCommittee was set up by the Government of India at the request of the Chief Justice of India to advise on computerising the judiciary.',
  funding: 'The Department of Justice, Ministry of Law and Justice, monitors and funds the mission-mode project for district courts across the country.',
  envisages: [
    'Efficient, time-bound delivery of services to citizens',
    'Decision support systems for courts',
    'Automated processes for transparent access to information',
    'Greater judicial productivity',
  ],
  phase1: 'Phase I (from 2007): courts were equipped with hardware, local networks and Case Information Software; judges and staff were trained and pending case data was entered. The phase ran until 30 March 2015.',
  phase2: 'Phase II: more courts, cloud-based infrastructure, video conferencing with jails, online certified copies, online payment gateways and judicial knowledge management, with accessible websites, local-language content and mobile and SMS services. It uses free and open-source software, with a unified national core and state-specific extensions developed by NIC Pune.',
  portal: 'The national portal, ecourts.gov.in, was launched on 7 August 2013 and hosts case status, cause lists and some orders and judgments. The National Judicial Data Grid (NJDG) serves as a national data warehouse for analysis.',
  facts: [
    ['Phase II approved by the Chief Justice of India', '8 January 2014'],
    ['Phase II sanctioned by the Government', '4 August 2015'],
    ['Portal launched', '7 August 2013'],
    ['Courts and complexes on the portal', 'More than 2,852'],
    ['Pending and disposed cases on NJDG', 'More than 7 crore'],
    ['Orders and judgments on NJDG', '3.3 crore'],
    ['Hardware per court room, Phase II', '(1+3) systems for covered courts; (2+6) for new courts'],
  ] as [string, string][],
}

export { HELP_VIDEOS }

/** Links from a page to its siblings in other places; internal slugs for the site map. */
export const SITE_MAP_GROUPS: { heading: string; items: SvcMenuItem[] }[] = [
  { heading: 'Main menu', items: SVC_MAIN_MENU },
  { heading: 'Search menu', items: SEARCH_MENU },
  { heading: 'Useful links', items: FOOTER_LINKS },
]
