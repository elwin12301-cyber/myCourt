import { createContext, forwardRef, useContext, useId, type ButtonHTMLAttributes, type FormEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Button from '@mui/material/Button'
import MuiCard from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import NativeSelect from '@mui/material/NativeSelect'
import OutlinedInput from '@mui/material/OutlinedInput'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { useApp } from '../context'
import { useT } from '../i18n/context'
import { useEyebrow } from './chrome'
import type { PageId } from '../types'

export function PageHead({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  const eyebrow = useEyebrow()
  const t = useT()
  return (
    <Stack direction="row" className="pagehead" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography className="eyebrow" sx={{ color: 'primary.main', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.2px' }}>{eyebrow}</Typography>
        <Typography variant="h4" component="h2" sx={{ fontSize: { xs: 22, sm: 27 }, fontWeight: 750, letterSpacing: '-.5px', mt: 0.5, mb: 0.75 }}>{t(title)}</Typography>
        <Typography className="sub" color="text.secondary">{t(sub)}</Typography>
      </Box>
      <Stack direction="row" className="actions" useFlexGap sx={{ gap: 1.1, flexWrap: 'wrap', ml: 'auto' }}>{children}</Stack>
    </Stack>
  )
}

type BtnProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & { kind?: string; to?: PageId }

/** `kind` keeps the old vocabulary: "primary", "soft", "danger", "small" (space separated). */
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn({ kind = '', to, onClick, className = '', children, ...rest }, ref) {
  const { go } = useApp()
  const t = useT()
  const k = kind.split(/\s+/)
  const soft = k.includes('soft')
  return (
    <Button
      ref={ref}
      type="button"
      variant={k.includes('primary') ? 'contained' : 'outlined'}
      color={k.includes('danger') ? 'error' : 'primary'}
      size={k.includes('small') ? 'small' : 'medium'}
      className={`btn ${kind} ${className}`.trim()}
      sx={soft ? { bgcolor: (th) => alpha(th.palette.primary.main, 0.08), borderColor: (th) => alpha(th.palette.primary.main, 0.25) } : undefined}
      onClick={(e) => { if (to) go(to); onClick?.(e) }}
      {...rest}
    >{typeof children === 'string' ? t(children) : children}</Button>
  )
})

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  const t = useT()
  return (
    <MuiCard component="section" className={`card ${className}`.trim()} sx={{ minWidth: 0 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {title && <Typography variant="h3" component="h3" sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>{t(title)}</Typography>}
        {children}
      </CardContent>
    </MuiCard>
  )
}

export function Stat({ label, num, desc, ico }: { label: string; num: string; desc: string; ico: string }) {
  return (
    <MuiCard className="stat" sx={{ minWidth: 0 }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', color: 'text.secondary', fontSize: 12 }}><span>{label}</span><span aria-hidden="true">{ico}</span></Stack>
        <Typography className="num" component="div" sx={{ fontSize: 29, fontWeight: 760, letterSpacing: '-1px', my: 1 }}>{num}</Typography>
        <Typography className="delta" variant="caption" sx={{ color: 'success.main' }}>{desc}</Typography>
      </CardContent>
    </MuiCard>
  )
}

export function Row({ title, sub, right }: { title: ReactNode; sub: string; right: ReactNode }) {
  return (
    <Box className="listrow" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', '&:first-of-type': { borderTop: 0, pt: 0.25 }, '& > *': { minWidth: 0, overflowWrap: 'anywhere' } }}>
      <div><Typography component="strong" sx={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{title}</Typography><Typography component="small" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: 12 }}>{sub}</Typography></div>
      <div>{right}</div>
    </Box>
  )
}

export function Quick({ ico, title, sub, to }: { ico: string; title: string; sub: string; to: PageId }) {
  const { go } = useApp()
  return (
    <ButtonBase className="quick" onClick={() => go(to)}
      sx={{ display: 'block', textAlign: 'left', p: 1.75, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', '&:hover': { borderColor: 'primary.light', bgcolor: (th) => alpha(th.palette.primary.main, 0.04) } }}>
      <Box className="qi" aria-hidden="true" sx={{ fontSize: 19, mb: 1 }}>{ico}</Box>
      <Typography component="strong" sx={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{title}</Typography>
      <Typography component="small" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: 12 }}>{sub}</Typography>
    </ButtonBase>
  )
}

const PILL: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = { '': 'default', blue: 'primary', green: 'success', amber: 'warning', red: 'error' }

export function Pill({ kind = '', children }: { kind?: '' | 'blue' | 'green' | 'amber' | 'red'; children: ReactNode }) {
  const t = useT()
  return <Chip size="small" className={`pill ${kind}`.trim()} color={PILL[kind]} variant={kind ? 'filled' : 'outlined'} label={typeof children === 'string' ? t(children) : children} />
}

export function Notice({ children }: { children: ReactNode }) {
  return <Alert severity="warning" variant="outlined" icon={false} className="notice" sx={{ my: 1.5, fontSize: 12, '& a': { color: 'inherit', fontWeight: 700 } }}>{children}</Alert>
}

export function Check({ title, sub, defaultChecked = false }: { title: string; sub: string; defaultChecked?: boolean }) {
  return (
    <Box className="checkrow" sx={{ py: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
      <FormControlLabel
        sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
        control={<Checkbox defaultChecked={defaultChecked} size="small" sx={{ pt: 0.75 }} />}
        label={<div><Typography component="strong" sx={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{title}</Typography><Typography component="small" color="text.secondary" sx={{ display: 'block', fontSize: 12 }}>{sub}</Typography></div>}
      />
    </Box>
  )
}

export function Banner({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: ReactNode }) {
  return (
    <Paper className="feature-banner" elevation={0} sx={{ background: 'linear-gradient(120deg,#10203f,#1f3a6e)', borderLeft: '4px solid #b8893b', color: '#fff', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2.5, mb: 2.5, borderRadius: 3 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography className="eyebrow" sx={{ color: '#bdccff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' }}>{eyebrow}</Typography>
        <Typography variant="h3" component="h3" sx={{ fontSize: 20, my: 0.75 }}>{title}</Typography>
        <Typography sx={{ color: '#d7e0f5', maxWidth: 650 }}>{text}</Typography>
      </Box>
      {children}
    </Paper>
  )
}

/** The Field gives its control an id so the label is really tied to it (the control picks it up from context). */
const FieldId = createContext<string | undefined>(undefined)

export function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  return (
    <FormControl fullWidth className="field" sx={{ mb: 1.75 }}>
      <FormLabel htmlFor={id} sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', mb: 0.75 }}>{label}</FormLabel>
      <FieldId.Provider value={id}>{children}</FieldId.Provider>
    </FormControl>
  )
}

/** Text-like inputs. Radios, checkboxes and files stay native; use <input> for those. */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ id, className, style, ...rest }, ref) {
  const fid = useContext(FieldId)
  return <OutlinedInput fullWidth size="small" id={id ?? fid} className={className} style={style} inputRef={ref} inputProps={rest} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ id, className, style, rows, ...rest }, ref) {
  const fid = useContext(FieldId)
  return <OutlinedInput fullWidth multiline minRows={rows ?? 4} size="small" id={id ?? fid} className={className} style={style} inputRef={ref} inputProps={rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ id, className, style, children, ...rest }, ref) {
  const fid = useContext(FieldId)
  return (
    <NativeSelect fullWidth className={className} style={style} input={<OutlinedInput size="small" inputRef={ref} />} inputProps={{ id: id ?? fid, ...rest }}>
      {children}
    </NativeSelect>
  )
})

export { default as Table } from '@mui/material/Table'
export { default as TableBody } from '@mui/material/TableBody'
export { default as TableCell } from '@mui/material/TableCell'
export { default as TableHead } from '@mui/material/TableHead'
export { default as TableRow } from '@mui/material/TableRow'
export { default as TableFooter } from '@mui/material/TableFooter'

/** A dialog with focus kept inside, Escape to close and focus returned to the opener. `role` may be "alertdialog". */
export function Modal({ open = true, onClose, title, titleId, role = 'dialog', describedBy, children, actions, onSubmit, closeLabel }: {
  open?: boolean; onClose: () => void; title: ReactNode; titleId: string; role?: 'dialog' | 'alertdialog'; describedBy?: string
  children: ReactNode; actions?: ReactNode; onSubmit?: (e: FormEvent<HTMLFormElement>) => void; closeLabel?: string
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby={titleId} aria-describedby={describedBy}
      slotProps={{ paper: { component: onSubmit ? 'form' : 'div', onSubmit, role, sx: { borderRadius: 3 } } as object }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 2.5, pb: 1 }}>
        <Typography variant="h3" component="h3" id={titleId}>{title}</Typography>
        {closeLabel && <IconButton aria-label={closeLabel} onClick={onClose} autoFocus>✕</IconButton>}
      </Stack>
      <DialogContent sx={{ pt: 1 }}>{children}</DialogContent>
      {actions && <DialogActions sx={{ px: 3, pb: 2.5 }}>{actions}</DialogActions>}
    </Dialog>
  )
}
