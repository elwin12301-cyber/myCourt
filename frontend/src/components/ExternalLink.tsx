import { useState, type ReactNode } from 'react'
import { useT } from '../i18n/context'
import { Btn, Modal } from './ui'
import { Button, ListItemButton } from './kit'

/** Mirrors the portal's "External site alert": confirm before leaving the app. `nav` renders it as a sidebar item. */
export default function ExternalLink({ href, className = 'btn small', nav = false, children }: { href: string; className?: string; nav?: boolean; children: ReactNode }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  let host = href
  try { host = new URL(href).host } catch { /* keep raw */ }
  const label = <>{children}<span className="sr-only">{` (${t('external site')})`}</span></>

  return (
    <>
      {nav
        ? <ListItemButton className={className} onClick={() => setOpen(true)}>{label}</ListItemButton>
        : /(^|\s)btn(\s|$)/.test(className)
          ? <Btn kind={className.replace(/^btn\s*/, '')} onClick={() => setOpen(true)}>{label}</Btn>
          : <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>}
      {open && (
        <Modal
          onClose={() => setOpen(false)} role="alertdialog" titleId="ext-title" describedBy="ext-desc" title={t('External site alert')}
          actions={<>
            <Button variant="outlined" autoFocus onClick={() => setOpen(false)}>{t('Cancel')}</Button>
            <Button variant="contained" href={href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>{t('Go')}</Button>
          </>}
        >
          <p id="ext-desc" style={{ margin: 0 }}>
            {t('This link leads to an external website')} (<strong>{host}</strong>). {t("myCourt is not responsible for its content; direct any queries to that site's webmaster.")}
          </p>
        </Modal>
      )}
    </>
  )
}
