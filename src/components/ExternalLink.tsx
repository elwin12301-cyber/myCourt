import { useState, type ReactNode } from 'react'

/** Mirrors the portal's "External site alert": confirm before leaving the app. */
export default function ExternalLink({ href, className = 'btn small', children }: { href: string; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  let host = href
  try { host = new URL(href).host } catch { /* keep raw */ }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{children}<span className="sr-only"> (external site)</span></button>
      {open && (
        <div className="modalback show" onClick={() => setOpen(false)}>
          <div
            className="modal" role="alertdialog" aria-modal="true" aria-labelledby="ext-title" aria-describedby="ext-desc"
            onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
          >
            <div className="modalhead"><h3 id="ext-title">External site alert</h3></div>
            <p id="ext-desc">
              This link leads to an external website (<strong>{host}</strong>). myCourt is not responsible for its content;
              direct any queries to that site&apos;s webmaster.
            </p>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn" autoFocus onClick={() => setOpen(false)}>Cancel</button>
              <a className="btn primary" href={href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Go</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
