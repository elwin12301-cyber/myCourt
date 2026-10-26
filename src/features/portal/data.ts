/**
 * Public information transcribed from https://ecourts.gov.in/ecourts2.0/ on 2026-10-26.
 * Counters and lists are a snapshot and may be out of date. This is not official data.
 */
export const PORTAL_SNAPSHOT_DATE = '2026-10-26'
export const OFFICIAL_HOME = 'https://ecourts.gov.in/ecourts2.0/'

export const SLIDES = [
  { title: 'Citizen Centric Services', text: 'Efficient, time-bound delivery of services to citizens.' },
  { title: 'Decision Support Systems', text: 'Developing and implementing decision support systems in courts.' },
  { title: 'Transparency of Information Access', text: 'Automating information access for all stakeholders.' },
  { title: 'Justice Delivery System', text: 'Improving judicial productivity and making justice affordable, accessible, cost-effective and transparent.' },
  { title: 'Court Management and Case Management System', text: 'A policy for managing case loads.' },
  { title: 'Interoperability and Compatibility', text: 'Links with the National Case Management System, Interoperable Criminal Justice System, NALSA and other programmes.' },
]

export interface StatGroup { heading: string; items: { label: string; value: string }[] }
export const STATS: StatGroup[] = [
  { heading: 'High Courts', items: [
    { label: 'High Court complexes', value: '39' },
    { label: 'HC pending cases', value: '6.55M' },
    { label: 'HC disposed cases', value: '45.05M' },
    { label: 'HC cases listed today', value: '48.25K' },
  ] },
  { heading: 'District & Taluka Courts', items: [
    { label: 'District & Taluka court complexes', value: '3721' },
    { label: 'DC pending cases', value: '51.75M' },
    { label: 'DC disposed cases', value: '232.95M' },
    { label: 'DC cases listed today', value: '1.23M' },
  ] },
]

export type ServiceTarget =
  | { kind: 'external'; url: string }
  | { kind: 'internal'; page: 'portalHighCourts' | 'portalDistrict' | 'portalHelp' }
  | { kind: 'none' }

export interface Service { id: string; name: string; description: string; target: ServiceTarget }
export const SERVICES: Service[] = [
  { id: 'hc-services', name: 'High Court Services', description: 'Cause lists, case status, orders and judgments.', target: { kind: 'external', url: 'https://hcservices.ecourts.gov.in/' } },
  { id: 'dc-services', name: 'District Court Services', description: 'Cause lists, case status, orders and judgments.', target: { kind: 'external', url: 'https://services.ecourts.gov.in/' } },
  { id: 'virtual-court', name: 'Virtual Court', description: 'Online adjudication without the litigant or lawyer being present.', target: { kind: 'external', url: 'https://vcourts.gov.in/' } },
  { id: 'epay', name: 'ePay', description: 'Single point for court payments.', target: { kind: 'external', url: 'https://pay.ecourts.gov.in/' } },
  { id: 'hc-njdg', name: 'High Court NJDG', description: 'Monitoring tool for pendency.', target: { kind: 'external', url: 'https://njdg.ecourts.gov.in/hcnjdg_v2/' } },
  { id: 'dc-njdg', name: 'District Court NJDG', description: 'Monitoring tool for pendency.', target: { kind: 'external', url: 'https://njdg.ecourts.gov.in/njdg_v3/' } },
  { id: 'efiling', name: 'eFiling Services', description: 'Online case filing.', target: { kind: 'external', url: 'https://filing.ecourts.gov.in/' } },
  { id: 'judgments', name: 'Judgment Search', description: 'Access to judgments.', target: { kind: 'external', url: 'https://judgments.ecourts.gov.in/' } },
  { id: 'hcs', name: 'High Courts of India', description: 'Information for stakeholders.', target: { kind: 'internal', page: 'portalHighCourts' } },
  { id: 'dcs', name: 'District Courts of India', description: 'Cause lists, case status, orders and judgments by state.', target: { kind: 'internal', page: 'portalDistrict' } },
  { id: 'justice-clock', name: 'Justice Clock', description: 'Real-time pendency monitoring.', target: { kind: 'external', url: 'https://justiceclock.ecourts.gov.in' } },
  { id: 'km', name: 'Knowledge Management', description: 'Help videos, manuals and brochures.', target: { kind: 'internal', page: 'portalHelp' } },
  { id: 'nstep', name: 'NSTEP', description: 'Judicial data for High Court NJDG.', target: { kind: 'none' } },
  { id: 'legraa', name: 'LeGRAA', description: 'Information on District Court services.', target: { kind: 'none' } },
  { id: 'digital-court', name: 'Digital Court', description: 'Judicial data for District Court NJDG.', target: { kind: 'none' } },
]

export const REFERENCES = [
  { title: 'Policy Action Plan Document of Phase II', size: '776 KB' },
  { title: 'Innovations in Phase II', size: '18.7 MB' },
  { title: 'Objectives Accomplishments Report-2019', size: '12.3 MB' },
  { title: 'Annexure to the Report-2019', size: '34.6 MB' },
]

export const SMS_NUMBER = '9766899899'
export const SMS_FORMAT = 'ECOURTS <your CNR Number>'

export const LANGUAGES = ['English', 'हिन्दी', 'मराठी', 'ಕನ್ನಡ', 'தமிழ்']

export const USEFUL_LINKS = [
  'Site map', 'Forms for Advocates', 'Help Videos', 'Manuals', 'Disclaimer', 'Knowledge Management', 'Brochures',
  'Web Information Manager', 'Newsletter', 'Privacy Policy', 'Terms and Conditions', 'Copyright Policy',
  'Hyperlinking Policy', 'Accessibility Statement', 'Screen Reader Access',
]

export const PROJECT_GOALS = [
  'Time-bound, citizen-centric service delivery under the eCourt Litigant\'s Charter',
  'Decision support systems for courts',
  'Automated processes for transparent information access',
  'Greater judicial productivity, affordability and predictability',
]

export const PHASES = [
  { name: 'Phase I (from 2007)', text: 'Court complexes, server rooms and Judicial Service Centres were prepared. Hardware, LAN and Case Information Software were installed, and judicial officers and staff were trained. The phase was extended to 30 March 2015.' },
  { name: 'Phase II', text: 'Approved by the Chief Justice of India on 8 January 2014 and sanctioned by the government on 4 August 2015. Uses cloud computing architecture and Free and Open Source Software with a unified National Core Case Information Software. Plans include video conferencing with jails, online certified copies, ePayment gateways, kiosks at every court complex, accessible websites and a Judicial Knowledge Management System.' },
]

export interface HighCourt { name: string; jurisdiction: string; cpcEmail: string }
/** Names, jurisdictions and CPC e-mails as shown on the Contact Us page (kept in the portal's obfuscated form). */
export const HIGH_COURTS: HighCourt[] = [
  { name: 'Allahabad', jurisdiction: 'Uttar Pradesh', cpcEmail: 'cpc-all[at]aij[dot]gov[dot]in' },
  { name: 'Andhra Pradesh', jurisdiction: 'Andhra Pradesh', cpcEmail: 'cpc-ap[at]aij[dot]gov[dot]in' },
  { name: 'Bombay', jurisdiction: 'Maharashtra, Goa, Dadra and Nagar Haveli, Daman and Diu', cpcEmail: 'cpc-bom[at]aij[dot]gov[dot]in' },
  { name: 'Calcutta', jurisdiction: 'West Bengal, Andaman and Nicobar Islands', cpcEmail: 'cpc-cal[at]aij[dot]gov[dot]in' },
  { name: 'Chhattisgarh', jurisdiction: 'Chhattisgarh', cpcEmail: 'cpc-cg[at]aij[dot]gov[dot]in' },
  { name: 'Delhi', jurisdiction: 'National Capital Territory of Delhi', cpcEmail: 'cpc-del[at]aij[dot]gov[dot]in' },
  { name: 'Gauhati', jurisdiction: 'Arunachal Pradesh, Assam, Nagaland, Mizoram', cpcEmail: 'cpc-asm[at]aij[dot]gov[dot]in' },
  { name: 'Gujarat', jurisdiction: 'Gujarat', cpcEmail: 'cpc-guj[at]aij[dot]gov[dot]in' },
  { name: 'Himachal Pradesh', jurisdiction: 'Himachal Pradesh', cpcEmail: 'cpc-hp[at]aij[dot]gov[dot]in' },
  { name: 'Jammu and Kashmir', jurisdiction: 'Jammu and Kashmir', cpcEmail: 'cpc-jk[at]aij[dot]gov[dot]in' },
  { name: 'Jharkhand', jurisdiction: 'Jharkhand', cpcEmail: 'cpc-jhr[at]aij[dot]gov[dot]in' },
  { name: 'Karnataka', jurisdiction: 'Karnataka', cpcEmail: 'cpc-kar[at]aij[dot]gov[dot]in' },
  { name: 'Kerala', jurisdiction: 'Kerala, Lakshadweep', cpcEmail: 'cpc-ker[at]aij[dot]gov[dot]in' },
  { name: 'Madhya Pradesh', jurisdiction: 'Madhya Pradesh', cpcEmail: 'cpc-mp[at]aij[dot]gov[dot]in' },
  { name: 'Madras', jurisdiction: 'Tamil Nadu, Puducherry', cpcEmail: 'cpc-tn[at]aij[dot]gov[dot]in' },
  { name: 'Manipur', jurisdiction: 'Manipur', cpcEmail: 'cpc-mnp[at]aij[dot]gov[dot]in' },
  { name: 'Meghalaya', jurisdiction: 'Meghalaya', cpcEmail: 'cpc-mgl[at]aij[dot]gov[dot]in' },
  { name: 'Orissa', jurisdiction: 'Odisha', cpcEmail: 'cpc-ori[at]aij[dot]gov[dot]in' },
  { name: 'Patna', jurisdiction: 'Bihar', cpcEmail: 'cpc-pat[at]aij[dot]gov[dot]in' },
  { name: 'Punjab and Haryana', jurisdiction: 'Punjab, Haryana, Chandigarh', cpcEmail: 'cpc-phc[at]aij[dot]gov[dot]in' },
  { name: 'Rajasthan', jurisdiction: 'Rajasthan', cpcEmail: 'cpc-raj[at]aij[dot]gov[dot]in' },
  { name: 'Sikkim', jurisdiction: 'Sikkim', cpcEmail: 'cpc-sik[at]aij[dot]gov[dot]in' },
  { name: 'Tripura', jurisdiction: 'Tripura', cpcEmail: 'cpc-trp[at]aij[dot]gov[dot]in' },
  { name: 'Uttarakhand', jurisdiction: 'Uttarakhand', cpcEmail: 'cpc-uk[at]aij[dot]gov[dot]in' },
  { name: 'Telangana', jurisdiction: 'Telangana', cpcEmail: 'cpc-tshc[at]aij[dot]gov[dot]in' },
]

export const COMMITTEE_EMAIL = 'ecommittee[at]aij[dot]gov[dot]in'

/** The page says 36 states/UTs but its list contains 37 links (Dadra and Nagar Haveli and Daman and Diu appear separately). */
export const DISTRICT_TOTALS = { statedStatesAndUts: 36, listedLinks: 37, districtCourts: 743 }
/** State/UT names and the code used in the portal's `?p=dist_court/<code>` links. */
export const STATES: { name: string; code: string }[] = [
  { name: 'Andaman and Nicobar', code: 'andaman' }, { name: 'Andhra Pradesh', code: 'ap' },
  { name: 'Arunachal Pradesh', code: 'arunachal' }, { name: 'Assam', code: 'assam' },
  { name: 'Bihar', code: 'bihar' }, { name: 'Chandigarh', code: 'chandigarh_district_court' },
  { name: 'Chhattisgarh', code: 'chhattisgarh' }, { name: 'Dadra and Nagar Haveli', code: 'dadra' },
  { name: 'Daman and Diu', code: 'damandiu' }, { name: 'Delhi', code: 'delhi' },
  { name: 'Goa', code: 'goa' }, { name: 'Gujarat', code: 'gujarat' },
  { name: 'Haryana', code: 'haryana' }, { name: 'Himachal Pradesh', code: 'hp' },
  { name: 'Jammu and Kashmir', code: 'jk' }, { name: 'Jharkhand', code: 'jharkhand' },
  { name: 'Karnataka', code: 'karnataka' }, { name: 'Kerala', code: 'kerala' },
  { name: 'Ladakh', code: 'ladakh' }, { name: 'Lakshadweep', code: 'lakshadweep' },
  { name: 'Madhya Pradesh', code: 'mp' }, { name: 'Maharashtra', code: 'maharashtra' },
  { name: 'Manipur', code: 'manipur' }, { name: 'Meghalaya', code: 'meghalaya' },
  { name: 'Mizoram', code: 'mizoram' }, { name: 'Nagaland', code: 'nagaland' },
  { name: 'Odisha', code: 'odisha' }, { name: 'Puducherry', code: 'puducherry' },
  { name: 'Punjab', code: 'punjab' }, { name: 'Rajasthan', code: 'rajasthan' },
  { name: 'Sikkim', code: 'sikkim' }, { name: 'Tamil Nadu', code: 'tn' },
  { name: 'Telangana', code: 'telangana' }, { name: 'Tripura', code: 'tripura' },
  { name: 'Uttar Pradesh', code: 'up' }, { name: 'Uttarakhand', code: 'uttarakhand' },
  { name: 'West Bengal', code: 'wb' },
]

export const districtLink = (code: string) => `https://ecourts.gov.in/ecourts2.0/?p=dist_court/${code}`
export const highCourtsLink = 'https://ecourts.gov.in/ecourts2.0/?p=about_us/highcourts'

/** Advocate forms list (titles and sizes as shown on the "Forms for Advocates" page). */
export const FORMS: { title: string; file: string; size: string }[] = [
  ['Address Form', 'Address Form.pdf', '375 KB'], ['Bail Bond', 'Bail Bond.pdf', '157 KB'],
  ['CA form 7', 'CA form 7.pdf', '382 KB'], ['Case Information Format', 'Case Information Format.pdf', '751 KB'],
  ['Check List 138 NI Act Matters', 'Check List 138 NI Act Matters.pdf', '216 KB'], ['Check List', 'Check List.pdf', '461 KB'],
  ['Commercial Court Rules and Forms', 'Commercial Court Rules and Forms.pdf', '71 KB'], ['E-Court Fee', 'E-Court Fee.pdf', '231 KB'],
  ['Filing Form', 'Filing Form.pdf', '31 KB'], ['Form for SMS and Mail Facility', 'Form for SMS and Mail Facility.pdf', '16 KB'],
  ['Form No 45 Bail Bond', 'Form No 45 Bail Bond_0.pdf', '591 KB'], ['Index form', 'Index form.pdf', '400 KB'],
  ['Inspection form', 'Inspection form.pdf', '459 KB'], ['List of documents', 'List of documents.pdf', '3 KB'],
  ['Litigant Form', 'Litigant Form.pdf', '50 KB'], ['Memo of Appearance', 'Memo of Appearance.pdf', '3 KB'],
  ['Memorandum of Appearance form', 'Memorandum of Appearance form_6.pdf', '378 KB'], ['Notice to produce documents', 'Notice to produce documents.pdf', '174 KB'],
  ['Personal bail bond form', 'Personal bail bond form.pdf', '575 KB'], ['Process fee form', 'Process fee form.pdf', '381 KB'],
  ['Process fee', 'Process fee.pdf', '4 KB'], ['Suriety bond', 'Suriety bond.pdf', '155 KB'],
  ['Vakalatnama form', 'Vakalatnama form.pdf', '390 KB'], ['Vakalatnama', 'Vakalatnama.pdf', '5 KB'],
].map(([title, file, size]) => ({ title, file, size }))

export const formLink = (file: string) => `https://ecourts.gov.in/ecourts2.0/forms/${encodeURIComponent(file)}`
