import { useEffect, useRef, useState } from 'react'
import { Btn, Card, Notice, PageHead } from '../../components/ui'
import { useT } from '../../i18n/context'
import type { FieldErrors } from '../../features/caseStatus/validation'
import { findLocation, validateLocationQuery, type CourtLocation } from '../../features/services/location'
import { courtOf, CourtPicker, EMPTY, type FormValues } from '../caseStatus/form'

function LocationPopup({ location, onClose }: { location: CourtLocation; onClose: () => void }) {
  const t = useT()
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { closeRef.current?.focus() }, [])
  return (
    <div className="svc-popup" onClick={onClose}>
      <div
        className="modal" role="dialog" aria-modal="true" aria-labelledby="loc-title"
        onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      >
        <div className="modalhead">
          <h3 id="loc-title">{t(location.court.establishment || location.court.complex)}</h3>
          <button ref={closeRef} type="button" className="iconbtn" aria-label={t('Close location')} onClick={onClose}>✕</button>
        </div>
        <p style={{ margin: '0 0 6px' }}><strong>{t('Address')}</strong><br />{t('{place}, Demonstration Road, {district}, {state} (fictional address)', { place: [location.court.establishment, location.court.complex].filter(Boolean).map((x) => t(x)).join(', '), district: t(location.court.district), state: t(location.court.state) })}</p>
        <div className="svc-map" role="img" aria-label={t('Map placeholder: no map service is used in this prototype')}>{t('Map placeholder (no map service, no tracking)')}</div>
        <Notice>{t(location.note)}</Notice>
        <div className="actions" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn primary" onClick={onClose}>{t('Close')}</button></div>
      </div>
    </div>
  )
}

export default function LocationPage({ onBack }: { onBack?: () => void } = {}) {
  const t = useT()
  const [v, setV] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [location, setLocation] = useState<CourtLocation | null>(null)
  const [notFound, setNotFound] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)

  const patch = (p: Partial<FormValues>) => { setV((s) => ({ ...s, ...p })); setNotFound(false) }

  const view = () => {
    const sel = courtOf(v)
    const errs = validateLocationQuery(sel)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const found = findLocation(sel)
    setNotFound(!found)
    setLocation(found)
  }
  const close = () => { setLocation(null); opener.current?.focus() }

  return (
    <>
      <PageHead title="Location" sub="Choose a court to see where it is.">
        <Btn kind="soft" onClick={() => { setV(EMPTY); setErrors({}); setNotFound(false); setLocation(null) }}>Reset</Btn>
      </PageHead>

      <div className="demobanner" role="note">
        <strong>{t('Demonstration data.')}</strong> {t('The official page only says "Location: Refer popup new window to view location", so what it shows was not observed. This prototype shows a fictional address and a map placeholder in a pop-up. Nothing here is connected to eCourts or affiliated with the judiciary.')}
      </div>

      <Card>
        <CourtPicker v={v} set={patch} errors={errors} />
        <p className="muted">{t('Location: refer pop-up to view location.')}</p>
        <div className="actions">
          <button ref={opener} type="button" className="btn primary" onClick={view}>{t('View location')}</button>
          {onBack && <Btn onClick={onBack}>Back</Btn>}
        </div>
        {notFound && <div className="empty" role="status">{t('No location is available for this court in the demonstration data.')}</div>}
      </Card>

      {location && <LocationPopup location={location} onClose={close} />}
    </>
  )
}
