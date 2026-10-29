/**
 * The app's own small component kit: plain React, plain CSS (styles.css), no UI framework.
 * Prop names follow the ones the screens already used (variant, size, severity, label…) so screens read the same, but every
 * component renders ordinary HTML with a class name, and every look lives in the stylesheet.
 */
import {
  Children, cloneElement, createContext, forwardRef, isValidElement, useContext, useEffect, useId, useRef,
  type ButtonHTMLAttributes, type CSSProperties, type ElementType, type HTMLAttributes, type InputHTMLAttributes, type ReactElement, type ReactNode,
  type SelectHTMLAttributes, type TdHTMLAttributes, type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'

export const cx = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(' ')

// ---------------------------------------------------------------- layout and text
type Common = { className?: string; style?: CSSProperties; children?: ReactNode }

export function Box({ component, className, style, children, ...rest }: Common & { component?: ElementType } & Record<string, unknown>) {
  const Tag = (component ?? 'div') as ElementType
  return <Tag className={className} style={style} {...rest}>{children}</Tag>
}

/** A flex container. `row` lays out sideways; `spacing` is the gap in 8px steps. */
export function Stack({ direction = 'column', spacing = 0, className, style, children, useFlexGap: _u, ...rest }: Common & { direction?: 'row' | 'column'; spacing?: number; useFlexGap?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('kstack', direction === 'row' && 'krow', className)} style={{ gap: spacing * 8, ...style }} {...rest}>{children}</div>
}

type TypoProps = Common & {
  variant?: 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'caption'; component?: ElementType; color?: string; id?: string; role?: string
} & Record<string, unknown>

/** Text. `color="text.secondary"` is the muted grey. */
export function Typography({ variant = 'body1', component, color, className, style, children, ...rest }: TypoProps) {
  const Tag = (component ?? (variant === 'h2' ? 'h2' : variant === 'h3' ? 'h3' : variant === 'h4' ? 'h4' : variant === 'caption' ? 'span' : 'p')) as ElementType
  return <Tag className={cx(`ktext-${variant}`, color === 'text.secondary' && 'muted', className)} style={style} {...rest}>{children}</Tag>
}

export function Paper({ className, style, children, elevation: _e, ...rest }: Common & { elevation?: number } & HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('kpaper', className)} style={style} {...rest}>{children}</div>
}
export function Card({ component, className, style, children, ...rest }: Common & { component?: ElementType } & Record<string, unknown>) {
  const Tag = (component ?? 'div') as ElementType
  return <Tag className={cx('kcard', className)} style={style} {...rest}>{children}</Tag>
}
export const CardContent = ({ className, style, children }: Common) => <div className={cx('kcard-body', className)} style={style}>{children}</div>

export function Link({ className, children, ...rest }: Common & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cx('klink', className)} {...rest}>{children}</a>
}

export function Avatar({ className, style, children, ...rest }: Common & HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('avatar', className)} style={style} {...rest}>{children}</div>
}

// ---------------------------------------------------------------- icons (inline SVG, no icon package)
const Svg = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" fill="currentColor"><path d={d} /></svg>
)
export const AddIcon = () => <Svg d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
export const CheckIcon = () => <Svg d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
export const VerifiedIcon = () => <Svg d="M12 1 3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4zm-2 16-4-4 1.4-1.4L10 14.2l6.6-6.6L18 9l-8 8z" />
export const MicIcon = ({ size = 24 }: { size?: number }) => <Svg size={size} d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z" />

// ---------------------------------------------------------------- buttons
type BtnProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
  variant?: 'contained' | 'outlined' | 'text'; color?: 'primary' | 'error'; size?: 'small' | 'medium'; href?: string; target?: string; rel?: string
  startIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button({ variant = 'text', color = 'primary', size = 'medium', startIcon, href, className, children, type = 'button', target, rel, ...rest }, ref) {
  const cls = cx('btn', variant === 'contained' && 'primary', color === 'error' && 'danger', size === 'small' && 'small', variant === 'text' && 'text', className)
  const inner = <>{startIcon}{children}</>
  if (href) return <a className={cls} href={href} target={target} rel={rel} onClick={rest.onClick as never}>{inner}</a>
  return <button ref={ref} type={type} className={cls} {...rest}>{inner}</button>
})

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function IconButton({ className, type = 'button', ...rest }, ref) {
  return <button ref={ref} type={type} className={cx('iconbtn', className)} {...rest} />
})
export const ButtonBase = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function ButtonBase({ type = 'button', ...rest }, ref) {
  return <button ref={ref} type={type} {...rest} />
})
export const ButtonGroup = ({ className, children, ...rest }: Common & HTMLAttributes<HTMLDivElement> & { size?: string }) => {
  const { size: _s, ...r } = rest as Record<string, unknown>
  return <div role="group" className={cx('btngroup', className)} {...(r as object)}>{children}</div>
}

/** A sidebar entry. */
export const ListItemButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }>(function ListItemButton({ selected, className, type = 'button', ...rest }, ref) {
  return <button ref={ref} type={type} className={cx('navitem', selected && 'active', className)} {...rest} />
})

// ---------------------------------------------------------------- messages and labels
const SEVERITY: Record<string, string> = { info: 'info', success: 'success', warning: 'warning', error: 'error' }

export function Alert({ severity = 'info', variant: _v, icon: _i, action, className, style, children }: Common & { severity?: string; variant?: string; icon?: unknown; action?: ReactNode }) {
  return (
    <div role="alert" className={cx('kalert', SEVERITY[severity] ?? 'info', className)} style={style}>
      <div className="kalert-body">{children}</div>
      {action}
    </div>
  )
}

const CHIP: Record<string, string> = { default: '', primary: 'blue', success: 'green', warning: 'amber', error: 'red', info: 'blue' }
export function Chip({ label, color = 'default', variant = 'filled', className }: { label: ReactNode; color?: string; size?: string; variant?: string; className?: string }) {
  return <span className={cx('pill', CHIP[color], variant === 'outlined' && 'outline', className)}>{label}</span>
}

export function Snackbar({ open, message }: { open: boolean; message: ReactNode; anchorOrigin?: unknown }) {
  return <div className={cx('toast', open && 'show')} role="status" aria-live="polite">{message}</div>
}

// ---------------------------------------------------------------- fields
type FieldBase = { id?: string; name?: string; label?: ReactNode; helperText?: ReactNode; error?: boolean; required?: boolean; className?: string; style?: CSSProperties; fullWidth?: boolean; margin?: string; size?: string }
type Slots = { slotProps?: { htmlInput?: Record<string, unknown>; formHelperText?: Record<string, unknown>; inputLabel?: unknown; select?: unknown } }

const FieldShell = ({ id, label, helperText, error, required, className, style, children, helperRole }: FieldBase & { children: ReactNode; helperRole?: string }) => (
  <div className={cx('kfield', error && 'has-error', className)} style={style}>
    {label != null && <label htmlFor={id} className="klabel">{label}{required && <span aria-hidden="true"> *</span>}</label>}
    {children}
    {helperText != null && helperText !== '' && <span id={id ? `${id}-help` : undefined} className={cx('khelp', error && 'err')} role={helperRole}>{helperText}</span>}
  </div>
)

export const TextField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FieldBase & Slots & {
  multiline?: boolean; rows?: number; minRows?: number; value?: string | number; defaultValue?: string; type?: string; placeholder?: string; disabled?: boolean
  autoComplete?: string; autoFocus?: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => void; onKeyDown?: React.KeyboardEventHandler
  inputProps?: Record<string, unknown>
}>(function TextField({ id, name, label, helperText, error, required, className, style, multiline, rows, minRows, slotProps, inputProps, fullWidth: _f, margin: _m, size: _s, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  const common = {
    id: fid, name, required, 'aria-invalid': error || undefined, 'aria-describedby': helperText ? `${fid}-help` : undefined,
    className: 'ctl', ...slotProps?.htmlInput, ...inputProps, ...rest,
  }
  const helperRole = (slotProps?.formHelperText as { role?: string } | undefined)?.role
  return (
    <FieldShell id={fid} label={label} helperText={helperText} error={error} required={required} className={className} style={style} helperRole={helperRole}>
      {multiline
        ? <textarea ref={ref as React.Ref<HTMLTextAreaElement>} rows={rows ?? minRows ?? 4} {...(common as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
        : <input ref={ref as React.Ref<HTMLInputElement>} {...(common as InputHTMLAttributes<HTMLInputElement>)} />}
    </FieldShell>
  )
})

/** A labelled native list. */
export function SelectField({ id, name, label, helperText, error, required, className, style, children, slotProps: _s, fullWidth: _f, margin: _m, size: _z, ...rest }:
  FieldBase & Slots & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <FieldShell id={fid} label={label} helperText={helperText} error={error} required={required} className={className} style={style}>
      <select id={fid} name={name} className="ctl" required={required} {...rest}>{children}</select>
    </FieldShell>
  )
}

export function Checkbox({ className, size: _s, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & { size?: string }) {
  return <input type="checkbox" className={cx('kcheck', className)} {...rest} />
}
export function FormControlLabel({ control, label, className, style, sx: _x }: { control: ReactElement; label: ReactNode; className?: string; style?: CSSProperties; sx?: unknown }) {
  return <label className={cx('kchecklabel', className)} style={style}>{control}<span>{label}</span></label>
}

// ---------------------------------------------------------------- tables
const InHead = createContext(false)
export const TableContainer = ({ children, className }: Common) => <div className={cx('tablewrap', className)}>{children}</div>
export const Table = ({ children, className, size: _s, ...rest }: Common & { size?: string } & HTMLAttributes<HTMLTableElement>) => <table className={cx('ktable', className)} {...rest}>{children}</table>
export const TableHead = ({ children }: Common) => <InHead.Provider value><thead>{children}</thead></InHead.Provider>
export const TableBody = ({ children }: Common) => <InHead.Provider value={false}><tbody>{children}</tbody></InHead.Provider>
export const TableFooter = ({ children }: Common) => <InHead.Provider value={false}><tfoot>{children}</tfoot></InHead.Provider>
export const TableRow = ({ children, hover: _h, className, ...rest }: Common & { hover?: boolean } & HTMLAttributes<HTMLTableRowElement>) => <tr className={className} {...rest}>{children}</tr>
export function TableCell({ children, align, component, scope, className, ...rest }: Common & { align?: 'left' | 'right' | 'center'; component?: 'th' | 'td'; scope?: string } & TdHTMLAttributes<HTMLTableCellElement>) {
  const head = useContext(InHead)
  const Tag = (component ?? (head ? 'th' : 'td')) as 'th' | 'td'
  return <Tag scope={scope ?? (Tag === 'th' && head ? 'col' : undefined)} className={cx(align === 'right' && 'right', className)} {...rest}>{children}</Tag>
}

export function TablePagination({ count, page, rowsPerPage, onPageChange }: { count: number; page: number; rowsPerPage: number; onPageChange: (e: unknown, page: number) => void; rowsPerPageOptions?: number[]; component?: string }) {
  const from = count === 0 ? 0 : page * rowsPerPage + 1
  const to = Math.min(count, (page + 1) * rowsPerPage)
  const last = Math.max(0, Math.ceil(count / rowsPerPage) - 1)
  return (
    <div className="kpager" role="navigation" aria-label="Pages">
      <span aria-live="polite">{from}–{to} of {count}</span>
      <Button size="small" variant="outlined" disabled={page <= 0} onClick={(e) => onPageChange(e, page - 1)} aria-label="Previous page">‹ Previous</Button>
      <Button size="small" variant="outlined" disabled={page >= last} onClick={(e) => onPageChange(e, page + 1)} aria-label="Next page">Next ›</Button>
    </div>
  )
}

// ---------------------------------------------------------------- tabs
const TabsCtx = createContext<{ value: string; onChange: (v: string) => void }>({ value: '', onChange: () => {} })
export function Tabs({ value, onChange, children, ...rest }: { value: string; onChange: (e: unknown, v: string) => void; children: ReactNode; variant?: string; scrollButtons?: string; 'aria-label'?: string }) {
  return (
    <TabsCtx.Provider value={{ value, onChange: (v) => onChange(null, v) }}>
      <div className="tabrow" role="tablist" aria-label={rest['aria-label']}>{children}</div>
    </TabsCtx.Provider>
  )
}
export function Tab({ value, label, id, ...rest }: { value: string; label: ReactNode; id?: string; 'aria-controls'?: string }) {
  const t = useContext(TabsCtx)
  const on = t.value === value
  return <button type="button" role="tab" id={id} aria-selected={on} aria-controls={rest['aria-controls']} tabIndex={on ? 0 : -1} className={cx('tab', on && 'active')} onClick={() => t.onChange(value)}>{label}</button>
}

// ---------------------------------------------------------------- dialog
let openDialogs = 0

/**
 * A dialog: focus moves into it and stays there, Escape closes it, focus returns to what opened it, and the rest of the page is
 * hidden from assistive technology while it is open. `role` may be "alertdialog".
 */
export function Dialog({ open = true, onClose, titleId, role = 'dialog', describedBy, onSubmit, children }: {
  open?: boolean; onClose: () => void; titleId: string; role?: 'dialog' | 'alertdialog'; describedBy?: string
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void; children: ReactNode
}) {
  const ref = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const root = document.getElementById('root')
    openDialogs += 1; root?.setAttribute('aria-hidden', 'true')
    const box = ref.current
    const first = box?.querySelector<HTMLElement>('[autofocus], input, select, textarea, button, a[href]') ?? box
    window.setTimeout(() => (box?.contains(document.activeElement) ? undefined : first?.focus()), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
      if (e.key !== 'Tab' || !box) return
      const items = [...box.querySelectorAll<HTMLElement>('input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])')].filter((x) => !(x as HTMLButtonElement).disabled && x.offsetParent !== null)
      if (!items.length) { e.preventDefault(); return }
      const a = items[0], z = items[items.length - 1]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      openDialogs -= 1; if (openDialogs <= 0) { openDialogs = 0; root?.removeAttribute('aria-hidden') }
      if (opener && document.contains(opener)) opener.focus()
    }
  }, [open, onClose])
  if (!open) return null
  const Tag = (onSubmit ? 'form' : 'div') as 'div'
  return createPortal(
    <div className="modalback show" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <Tag ref={ref as React.RefObject<HTMLDivElement>} className="modal" role={role} aria-modal="true" aria-labelledby={titleId} aria-describedby={describedBy} tabIndex={-1} onSubmit={onSubmit as never}>
        {children}
      </Tag>
    </div>,
    document.body,
  )
}

/** Placeholder bars shown while something loads; screen readers hear "Loading…". */
export const Skeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="skel" role="status" aria-live="polite">
    <span className="sr-only">Loading…</span>
    {Array.from({ length: rows }, (_, i) => <span key={i} aria-hidden="true" />)}
  </div>
)

/** Gives a single child element extra props (used where a wrapper needs to tag its control). */
export const withProps = (child: ReactNode, props: Record<string, unknown>) => (isValidElement(child) ? cloneElement(child as ReactElement<Record<string, unknown>>, props) : child)
export { Children }
