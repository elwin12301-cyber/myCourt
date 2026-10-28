import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useApp } from '../context'
import { useT } from '../i18n/context'
import { useEyebrow } from './chrome'
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

export function Btn({ kind = '', to, onClick, className = '', children, ...rest }: BtnProps) {
  const { go } = useApp()
  const t = useT()
  return (
    <button
      type="button"
      className={`btn ${kind} ${className}`.trim()}
      onClick={(e) => { if (to) go(to); onClick?.(e) }}
      {...rest}
    >{typeof children === 'string' ? t(children) : children}</button>
  )
}

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  const t = useT()
  return (
    <section className={`card ${className}`.trim()}>
      {title && <div className="cardhead"><h3>{t(title)}</h3></div>}
      {children}
    </section>
  )
}

export function Stat({ label, num, desc, ico }: { label: string; num: string; desc: string; ico: string }) {
  return (
    <div className="stat">
      <div className="stat-top"><span>{label}</span><span>{ico}</span></div>
      <div className="num">{num}</div>
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
    <button className="quick" onClick={() => go(to)}>
      <div className="qi">{ico}</div><strong>{title}</strong><small>{sub}</small>
    </button>
  )
}

export function Pill({ kind = '', children }: { kind?: '' | 'blue' | 'green' | 'amber' | 'red'; children: ReactNode }) {
  const t = useT()
  return <span className={`pill ${kind}`.trim()}>{typeof children === 'string' ? t(children) : children}</span>
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="notice">{children}</div>
}

export function Check({ title, sub, defaultChecked = false }: { title: string; sub: string; defaultChecked?: boolean }) {
  return (
    <div className="checkrow">
      <input type="checkbox" defaultChecked={defaultChecked} />
      <div><strong>{title}</strong><small>{sub}</small></div>
    </div>
  )
}

export function Banner({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="feature-banner">
      <div>
        <div className="eyebrow" style={{ color: '#bdccff' }}>{eyebrow}</div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      {children}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="field"><label>{label}</label>{children}</div>
}
