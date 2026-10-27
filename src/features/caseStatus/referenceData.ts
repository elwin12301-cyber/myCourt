import { STATES } from '../portal/data'
import type { PageId } from '../../types'
import type { SearchMode } from './types'

/** The official Case Status page lists 36 states/UTs, with Dadra and Nagar Haveli and Daman and Diu merged. */
export const MERGED_UT = 'The Dadra And Nagar Haveli And Daman And Diu'
export const CASE_STATES: string[] = STATES.map((s) => s.name)
  .filter((n) => n !== 'Dadra and Nagar Haveli' && n !== 'Daman and Diu')
  .concat(MERGED_UT)
  .sort((a, b) => a.localeCompare(b))

/**
 * Demo court hierarchy: state -> district -> court complex -> establishments.
 * Only these states have demonstration data; the real hierarchy is far larger.
 */
export const LOCATIONS: Record<string, Record<string, Record<string, string[]>>> = {
  'Tamil Nadu': {
    Chennai: { 'Principal Sessions Court Complex': ['Sessions Court', 'Additional Sessions Court'], 'City Civil Court Complex': ['City Civil Court'] },
    Madurai: { 'District Court Complex': ['District Court'] },
  },
  Maharashtra: {
    Mumbai: { 'City Civil and Sessions Court': ['Sessions Court', 'Civil Court'] },
    Pune: { 'District and Sessions Court': ['Sessions Court'] },
  },
  Delhi: { 'New Delhi': { 'Patiala House Court Complex': ['Magistrate Courts'] } },
}

export const CASE_TYPES = ['Criminal Case (CC)', 'Civil Suit (CS)', 'Criminal Appeal (CRL.A)', 'Writ Petition (WP)', 'Miscellaneous Petition (MP)']

/** Fictional police station names, keyed by district. */
export const POLICE_STATIONS: Record<string, string[]> = {
  Chennai: ['Demo Police Station - Chennai Central', 'Demo Police Station - Chennai North'],
  Madurai: ['Demo Police Station - Madurai Town'],
  Mumbai: ['Demo Police Station - Mumbai Fort'],
  Pune: ['Demo Police Station - Pune Camp'],
  'New Delhi': ['Demo Police Station - New Delhi One'],
}

export const ACTS = [
  'Bharatiya Nyaya Sanhita', 'Code of Civil Procedure', 'Code of Criminal Procedure', 'Indian Penal Code',
  'Negotiable Instruments Act', 'Protection of Women from Domestic Violence Act',
]

export interface ModeInfo { id: SearchMode; label: string; heading: string; help: string; videoKey?: string }

/** Labels and help text follow the official page (read 2026-10-27). */
export const MODES: ModeInfo[] = [
  { id: 'cnr', label: 'CNR Number', heading: 'Search by CNR Number',
    help: 'Enter the 16 digit alphanumeric CNR number without any hyphen or space. Example: MHAU019999992015.' },
  { id: 'party', label: 'Party Name', heading: 'Search by Petitioner/Respondent', videoKey: 'CSPartyNameHelp',
    help: 'Enter at least 3 characters. The name can be the petitioner, plaintiff, complainant, respondent, defendant, appellant, accused or extra party. Choose Both if the status is unknown. After searching, select View to see the case history.' },
  { id: 'caseNumber', label: 'Case Number', heading: 'Search by Case Number',
    help: 'Select the case type, then enter the case number and year. Select View in the results to see the case history.' },
  { id: 'filingNumber', label: 'Filing Number', heading: 'Search by Filing Number', videoKey: 'CSFilingNumberHelp',
    help: 'Select the case type, then enter the filing number and the filing year. Select View to see the case history.' },
  { id: 'advocate', label: 'Advocate', heading: 'Search by Advocate', videoKey: 'CSAdvocateHelp',
    help: 'Choose Advocate Name, Bar Code or Date Case List. A partial name search needs at least 3 characters. Example bar code: MAH/XXXX/1982. Date Case List returns a date-wise cause list.' },
  { id: 'fir', label: 'FIR Number', heading: 'Search by FIR number', videoKey: 'CSFIRNumberHelp',
    help: 'Select the police station. FIR number and year are optional. Choose Pending, Disposed or Both.' },
  { id: 'act', label: 'Act', heading: 'Search by Act Type', videoKey: 'CSActHelp',
    help: 'Type at least 3 characters in Search Act to narrow the list, then select the Act Type. Under Section is optional; if blank, all sections are listed.' },
  { id: 'caseType', label: 'Case Type', heading: 'Search by Case Type', videoKey: 'CSCaseTypeHelp',
    help: 'Select the case type and year, then choose Pending or Disposed.' },
]

export const helpVideoUrl = (key: string) =>
  `https://services.ecourts.gov.in/ecourtindia_v6/?p=view_help_videos/show_help_videos&caseSearchType=${key}`

/** Other items in the official Search menu; linked out, not rebuilt. */
export const SEARCH_MENU_LINKS: { label: string; url: string; page?: PageId }[] = [
  { label: 'Court Orders', url: 'https://services.ecourts.gov.in/ecourtindia_v6/?p=courtorder/index', page: 'courtOrders' },
  { label: 'Cause List', url: 'https://services.ecourts.gov.in/ecourtindia_v6/?p=cause_list/index', page: 'causeList' },
  { label: 'Caveat Search', url: 'https://services.ecourts.gov.in/ecourtindia_v6/?p=caveat_search/index' },
  { label: 'Process Details', url: 'https://services.ecourts.gov.in/ecourtindia_v6/?p=processDetails/processData' },
  { label: 'Location', url: 'https://services.ecourts.gov.in/ecourtindia_v6/?p=location/index' },
]
