import type { ReactNode } from 'react'
import { Alert, Button, Chip, SelectField } from './kit'

/** Building blocks shared by the signed-in screens. */

/** A titled card. The title is a real heading. */
export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card section">
      <div className="cardhead"><h3>{title}</h3>{action}</div>
      {children}
    </section>
  )
}

/** Plain-language message. It is announced to screen readers (role="alert"). */
export function Message({ children, severity = 'info', onRetry }: { children: ReactNode; severity?: 'info' | 'success' | 'warning' | 'error'; onRetry?: () => void }) {
  return (
    <Alert severity={severity} action={onRetry ? <Button size="small" onClick={onRetry}>Retry</Button> : undefined}>{children}</Alert>
  )
}

export type Kind = 'green' | 'amber' | 'blue' | 'red' | ''
const COLORS: Record<Kind, string> = { green: 'success', amber: 'warning', blue: 'primary', red: 'error', '': 'default' }

/** A status label. The text is always shown, so colour is never the only signal. */
export function Status({ kind = '', children }: { kind?: Kind; children: ReactNode }) {
  return <Chip label={children} color={COLORS[kind]} variant={kind ? 'filled' : 'outlined'} />
}

export { SelectField }

export const Row = ({ children }: { children: ReactNode }) => <div className="listrow">{children}</div>
