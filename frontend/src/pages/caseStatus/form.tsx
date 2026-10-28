import type { ReactNode } from 'react'
import { useT } from '../../i18n/context'
import { ACTS, CASE_STATES, CASE_TYPES, LOCATIONS, POLICE_STATIONS } from '../../features/caseStatus/referenceData'
import { normaliseBarCode, normaliseCnr, type FieldErrors } from '../../features/caseStatus/validation'
import type { AdvocateBy, CaseQuery, CourtSelection, SearchMode, StatusFilter } from '../../features/caseStatus/types'

export interface FormValues {
  cnr: string
  state: string; district: string; complex: string; establishment: string
  name: string; year: string; status: StatusFilter
  caseType: string; number: string
  by: AdvocateBy; barCode: string; date: string
  policeStation: string; firNumber: string; firYear: string
  actSearch: string; actType: string; section: string
}

export const EMPTY: FormValues = {
  cnr: '', state: '', district: '', complex: '', establishment: '',
  name: '', year: '', status: 'Both', caseType: '', number: '',
  by: 'name', barCode: '', date: '', policeStation: '', firNumber: '', firYear: '',
  actSearch: '', actType: '', section: '',
}

export function courtOf(v: FormValues): CourtSelection {
  return { state: v.state, district: v.district, complex: v.complex, establishment: v.establishment }
}

export function buildQuery(mode: SearchMode, v: FormValues): CaseQuery {
  const court = courtOf(v)
  const pd = v.status === 'Disposed' ? 'Disposed' : 'Pending'
  switch (mode) {
    case 'cnr': return { mode, cnr: normaliseCnr(v.cnr) }
    case 'party': return { mode, court, name: v.name, year: v.year, status: v.status }
    case 'caseNumber': return { mode, court, caseType: v.caseType, number: v.number, year: v.year }
    case 'filingNumber': return { mode, court, caseType: v.caseType, number: v.number, year: v.year }
    case 'advocate': return { mode, court, by: v.by, name: v.name, barCode: normaliseBarCode(v.barCode), date: v.date, status: v.status }
    case 'fir': return { mode, court, policeStation: v.policeStation, number: v.firNumber, year: v.firYear, status: v.status }
    case 'act': return { mode, court, actType: v.actType, section: v.section, status: pd }
    case 'caseType': return { mode, court, caseType: v.caseType, year: v.year, status: pd }
  }
}

export function Field({ id, label, required, error, hint, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  const t = useT()
  return (
    <div className="field">
      <label htmlFor={id}>{required && <span aria-hidden="true">* </span>}{t(label)}{required && <span className="sr-only">{` (${t('required')})`}</span>}</label>
      {children}
      {hint && <span className="tiny muted">{t(hint)}</span>}
      {error && <span id={`${id}-err`} role="alert" className="fielderr">{t(error)}</span>}
    </div>
  )
}

export function Radios<T extends string>({ legend, name, value, options, onChange, labels }: { legend: string; name: string; value: T; options: T[]; onChange: (v: T) => void; labels?: Record<string, string> }) {
  const t = useT()
  return (
    <fieldset className="radiogroup">
      <legend>{t(legend)}</legend>
      {options.map((o) => (
        <label key={o}><input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} /> {t(labels?.[o] ?? o)}</label>
      ))}
    </fieldset>
  )
}

export type Setter = (patch: Partial<FormValues>) => void

export function CourtPicker({ v, set, errors }: { v: FormValues; set: Setter; errors: FieldErrors }) {
  const t = useT()
  const districts = Object.keys(LOCATIONS[v.state] ?? {})
  const complexes = Object.keys(LOCATIONS[v.state]?.[v.district] ?? {})
  const establishments = LOCATIONS[v.state]?.[v.district]?.[v.complex] ?? []
  const aria = (k: string) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-err` : undefined })
  return (
    <>
      <div className="grid layout3" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
        <Field id="state" label="State" required error={errors.state}>
          <select id="state" value={v.state} {...aria('state')} onChange={(e) => set({ state: e.target.value, district: '', complex: '', establishment: '', policeStation: '' })}>
            <option value="">{t('Select State')}</option>
            {CASE_STATES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
          </select>
        </Field>
        <Field id="district" label="District" required error={errors.district}>
          <select id="district" value={v.district} disabled={!districts.length} {...aria('district')} onChange={(e) => set({ district: e.target.value, complex: '', establishment: '', policeStation: '' })}>
            <option value="">{t('Select District')}</option>
            {districts.map((d) => <option key={d} value={d}>{t(d)}</option>)}
          </select>
        </Field>
        <Field id="complex" label="Court Complex" required error={errors.complex}>
          <select id="complex" value={v.complex} disabled={!complexes.length} {...aria('complex')} onChange={(e) => set({ complex: e.target.value, establishment: '' })}>
            <option value="">{t('Select Court Complex')}</option>
            {complexes.map((c) => <option key={c} value={c}>{t(c)}</option>)}
          </select>
        </Field>
        <Field id="establishment" label="Establishment">
          <select id="establishment" value={v.establishment} disabled={!establishments.length} onChange={(e) => set({ establishment: e.target.value })}>
            <option value="">{t('Select Establishment')}</option>
            {establishments.map((x) => <option key={x} value={x}>{t(x)}</option>)}
          </select>
        </Field>
      </div>
      {v.state && !districts.length && (
        <p className="tiny muted" role="status">{t('No demonstration data exists for {state}. Try Tamil Nadu, Maharashtra or Delhi.', { state: t(v.state) })}</p>
      )}
    </>
  )
}

export function YearField({ v, set, errors, id = 'year', label, required }: { v: FormValues; set: Setter; errors: FieldErrors; id?: string; label: string; required?: boolean }) {
  const key = id === 'firYear' ? 'firYear' : 'year'
  return (
    <Field id={id} label={label} required={required} error={errors[id]}>
      <input id={id} inputMode="numeric" maxLength={4} value={v[key]} aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${id}-err` : undefined} onChange={(e) => set({ [key]: e.target.value } as Partial<FormValues>)} />
    </Field>
  )
}

export function CaseTypeField({ v, set, errors }: { v: FormValues; set: Setter; errors: FieldErrors }) {
  const t = useT()
  return (
    <Field id="caseType" label="Case Type" required error={errors.caseType}>
      <select id="caseType" value={v.caseType} aria-invalid={!!errors.caseType} aria-describedby={errors.caseType ? 'caseType-err' : undefined} onChange={(e) => set({ caseType: e.target.value })}>
        <option value="">{t('Select case type')}</option>
        {CASE_TYPES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
      </select>
    </Field>
  )
}

export function ModeFields({ mode, v, set, errors }: { mode: SearchMode; v: FormValues; set: Setter; errors: FieldErrors }) {
  const t = useT()
  const num = (id: string, label: string, key: 'number', required = true) => (
    <Field id={id} label={label} required={required} error={errors.number}>
      <input id={id} inputMode="numeric" value={v[key]} aria-invalid={!!errors.number} aria-describedby={errors.number ? `${id}-err` : undefined} onChange={(e) => set({ [key]: e.target.value })} />
    </Field>
  )

  if (mode === 'cnr') {
    return (
      <Field id="cnr" label="CNR Number" required error={errors.cnr} hint="16 letters or digits, no hyphen or space. Try TNCH019999992025 (found), TNCH019999990000 (no result) or ERROR00000000000 (simulated error).">
        <input id="cnr" value={v.cnr} maxLength={24} autoComplete="off" placeholder={t('e.g. TNCH019999992025')} aria-invalid={!!errors.cnr} aria-describedby={errors.cnr ? 'cnr-err' : undefined} onChange={(e) => set({ cnr: e.target.value })} />
      </Field>
    )
  }

  return (
    <>
      <CourtPicker v={v} set={set} errors={errors} />
      {mode === 'party' && (
        <>
          <div className="grid layout2" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
            <Field id="name" label="Petitioner/Respondent" required error={errors.name}>
              <input id="name" value={v.name} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-err' : undefined} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <YearField v={v} set={set} errors={errors} label="Registration Year" required />
          </div>
          <Radios legend="Case status" name="status" value={v.status} options={['Pending', 'Disposed', 'Both']} onChange={(status) => set({ status })} />
        </>
      )}
      {(mode === 'caseNumber' || mode === 'filingNumber') && (
        <div className="grid layout3" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
          <CaseTypeField v={v} set={set} errors={errors} />
          {num('number', mode === 'filingNumber' ? 'Filing Number' : 'Case Number', 'number')}
          <YearField v={v} set={set} errors={errors} label={mode === 'filingNumber' ? 'Filing Year' : 'Year'} required />
        </div>
      )}
      {mode === 'advocate' && (
        <>
          <Radios legend="Search by" name="by" value={v.by} options={['name', 'barCode', 'caseListDate']} labels={{ name: 'Advocate Name', barCode: 'Bar Code', caseListDate: "Date Case List (Advocate's Cause List)" }} onChange={(by) => set({ by })} />
          {v.by === 'barCode' ? (
            <Field id="barCode" label="Advocate Bar Code" required error={errors.barCode} hint="Example format: MAH/XXXX/1982. Try MAH/0077/2005 (demo).">
              <input id="barCode" value={v.barCode} aria-invalid={!!errors.barCode} aria-describedby={errors.barCode ? 'barCode-err' : undefined} onChange={(e) => set({ barCode: e.target.value })} />
            </Field>
          ) : (
            <div className="grid layout2" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
              <Field id="name" label="Advocate" required error={errors.name} hint="At least 3 characters.">
                <input id="name" value={v.name} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-err' : undefined} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              {v.by === 'caseListDate' && (
                <Field id="date" label="Case List Date" required error={errors.date} hint="Try 2026-10-28 with the advocate name Kumar in Pune.">
                  <input id="date" type="date" value={v.date} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'date-err' : undefined} onChange={(e) => set({ date: e.target.value })} />
                </Field>
              )}
            </div>
          )}
          {v.by !== 'caseListDate' && (
            <Radios legend="Case status" name="status" value={v.status} options={['Pending', 'Disposed', 'Both']} onChange={(status) => set({ status })} />
          )}
        </>
      )}
      {mode === 'fir' && (
        <>
          <div className="grid layout3" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
            <Field id="policeStation" label="Police Station" required error={errors.policeStation}>
              <select id="policeStation" value={v.policeStation} disabled={!POLICE_STATIONS[v.district]} aria-invalid={!!errors.policeStation} aria-describedby={errors.policeStation ? 'policeStation-err' : undefined} onChange={(e) => set({ policeStation: e.target.value })}>
                <option value="">{t('Select police station')}</option>
                {(POLICE_STATIONS[v.district] ?? []).map((p) => <option key={p} value={p}>{t(p)}</option>)}
              </select>
            </Field>
            <Field id="firNumber" label="FIR Number" error={errors.number}>
              <input id="firNumber" inputMode="numeric" value={v.firNumber} aria-invalid={!!errors.number} aria-describedby={errors.number ? 'firNumber-err' : undefined} onChange={(e) => set({ firNumber: e.target.value })} />
            </Field>
            <YearField v={v} set={set} errors={errors} id="firYear" label="Year" />
          </div>
          <Radios legend="Case status" name="status" value={v.status} options={['Pending', 'Disposed', 'Both']} onChange={(status) => set({ status })} />
        </>
      )}
      {mode === 'act' && (
        <>
          <div className="grid layout3" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
            <Field id="actSearch" label="Search Act" hint="Type at least 3 characters to narrow the list.">
              <input id="actSearch" value={v.actSearch} onChange={(e) => set({ actSearch: e.target.value, actType: '' })} />
            </Field>
            <Field id="actType" label="Act Type" required error={errors.actType}>
              <select id="actType" value={v.actType} aria-invalid={!!errors.actType} aria-describedby={errors.actType ? 'actType-err' : undefined} onChange={(e) => set({ actType: e.target.value })}>
                <option value="">{t('Select Act Type')}</option>
                {(v.actSearch.trim().length >= 3 ? ACTS.filter((a) => `${a} ${t(a)}`.toLowerCase().includes(v.actSearch.trim().toLowerCase())) : ACTS).map((a) => <option key={a} value={a}>{t(a)}</option>)}
              </select>
            </Field>
            <Field id="section" label="Under Section" hint="Optional. Blank lists all sections.">
              <input id="section" value={v.section} onChange={(e) => set({ section: e.target.value })} />
            </Field>
          </div>
          <Radios legend="Case status" name="status" value={(v.status === 'Both' ? 'Pending' : v.status) as 'Pending' | 'Disposed'} options={['Pending', 'Disposed']} onChange={(status) => set({ status })} />
        </>
      )}
      {mode === 'caseType' && (
        <>
          <div className="grid layout2" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
            <CaseTypeField v={v} set={set} errors={errors} />
            <YearField v={v} set={set} errors={errors} label="Year" required />
          </div>
          <Radios legend="Case status" name="status" value={(v.status === 'Both' ? 'Pending' : v.status) as 'Pending' | 'Disposed'} options={['Pending', 'Disposed']} onChange={(status) => set({ status })} />
        </>
      )}
    </>
  )
}
