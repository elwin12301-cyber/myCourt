import { createContext, forwardRef, useContext, useId, type ButtonHTMLAttributes, type FormEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { useApp } from '../context'
import { useT } from '../i18n/context'
import { useEyebrow } from './chrome'
import { Dialog, cx } from './kit'
import { useCountUp } from './useCountUp'
import type { PageId } from '../types'

export function PageHead({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  const eyebrow = useEyebrow()
  const t = useT()
  return (
    <div className="pagehead">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{t(title)}</h2>
        <p className="sub">{t(sub)}</p>
      </div>
      <div className="actions">{children}</div>
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { kind?: string; to?: PageId }

/** `kind` is a space separated list: "primary", "soft", "danger", "small". */
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn({ kind = '', to, onClick, className = '', children, ...rest }, ref) {
  const { go } = useApp()
  const t = useT()
  return (
    <button
      ref={ref}
      type="button"
      className={cx('btn', kind, className)}
      onClick={(e) => { if (to) go(to); onClick?.(e) }}
      {...rest}
    >{typeof children === 'string' ? t(children) : children}</button>
  )
})

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  const t = useT()
  return (
    <section className={cx('card', className)}>
      {title && <div className="cardhead"><h3>{t(title)}</h3></div>}
      {children}
    </section>
  )
}

export function Stat({ label, num, desc, ico }: { label: string; num: string; desc: string; ico: string }) {
  const shown = useCountUp(num)
  return (
    <div className="stat">
      <div className="stat-top"><span>{label}</span><span aria-hidden="true">{ico}</span></div>
      <div className="num" aria-label={num}>{shown}</div>
      <div className="delta">{desc}</div>
    </div>
  )
}

export function Row({ title, sub, right }: { title: ReactNode; sub: string; right: ReactNode }) {
  return (
    <div className="listrow">
      <div><strong>{title}</strong><small>{sub}</small></div>
      <div>{right}</div>
    </div>
  )
}

export function Quick({ ico, title, sub, to }: { ico: string; title: string; sub: string; to: PageId }) {
  const { go } = useApp()
  return (
    <button type="button" className="quick" onClick={() => go(to)}>
      <div className="qi" aria-hidden="true">{ico}</div><strong>{title}</strong><small>{sub}</small>
    </button>
  )
}

export function Pill({ kind = '', children }: { kind?: '' | 'blue' | 'green' | 'amber' | 'red'; children: ReactNode }) {
  const t = useT()
  return <span className={cx('pill', kind)}>{typeof children === 'string' ? t(children) : children}</span>
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="notice">{children}</div>
}

export function Check({ title, sub, defaultChecked = false }: { title: string; sub: string; defaultChecked?: boolean }) {
  return (
    <label className="checkrow">
      <input type="checkbox" defaultChecked={defaultChecked} />
      <div><strong>{title}</strong><small>{sub}</small></div>
    </label>
  )
}

export function Banner({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="feature-banner">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      {children}
    </div>
  )
}

/** The Field gives its control an id so the label is really tied to it (the control picks it up from context). */
const FieldId = createContext<string | undefined>(undefined)

export function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <FieldId.Provider value={id}>{children}</FieldId.Provider>
    </div>
  )
}

/** Text-like inputs. Radios, checkboxes and files stay as plain <input>. */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ id, className, ...rest }, ref) {
  const fid = useContext(FieldId)
  return <input ref={ref} id={id ?? fid} className={cx('ctl', className)} {...rest} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ id, className, rows, ...rest }, ref) {
  const fid = useContext(FieldId)
  return <textarea ref={ref} id={id ?? fid} className={cx('ctl', className)} rows={rows ?? 4} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ id, className, children, ...rest }, ref) {
  const fid = useContext(FieldId)
  return <select ref={ref} id={id ?? fid} className={cx('ctl', className)} {...rest}>{children}</select>
})

export { Table, TableBody, TableCell, TableHead, TableRow, TableFooter } from './kit'

/** A dialog with a heading and an optional close button and action row. `role` may be "alertdialog". */
export function Modal({ open = true, onClose, title, titleId, role = 'dialog', describedBy, children, actions, onSubmit, closeLabel }: {
  open?: boolean; onClose: () => void; title: ReactNode; titleId: string; role?: 'dialog' | 'alertdialog'; describedBy?: string
  children: ReactNode; actions?: ReactNode; onSubmit?: (e: FormEvent<HTMLFormElement>) => void; closeLabel?: string
}) {
  return (
    <Dialog open={open} onClose={onClose} titleId={titleId} role={role} describedBy={describedBy} onSubmit={onSubmit}>
      <div className="modalhead">
        <h3 id={titleId}>{title}</h3>
        {closeLabel && <button type="button" className="iconbtn" aria-label={closeLabel} onClick={onClose} autoFocus>✕</button>}
      </div>
      <div className="modalbody">{children}</div>
      {actions && <div className="actions modalactions">{actions}</div>}
    </Dialog>
  )
}
