import type { ReactNode } from 'react'
import Alert, { type AlertColor } from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TextField, { type TextFieldProps } from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

/** A titled card. The title is a real heading. */
export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h3" component="h3">{title}</Typography>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  )
}

/** Plain-language message. `error` is announced to screen readers (role="alert"). */
export function Message({ children, severity = 'info', onRetry }: { children: ReactNode; severity?: AlertColor; onRetry?: () => void }) {
  return (
    <Alert severity={severity} sx={{ my: 1 }} action={onRetry ? <Button color="inherit" size="small" onClick={onRetry}>Retry</Button> : undefined}>
      {children}
    </Alert>
  )
}

export type Kind = 'green' | 'amber' | 'blue' | ''
const COLORS: Record<Kind, 'success' | 'warning' | 'info' | 'default'> = { green: 'success', amber: 'warning', blue: 'info', '': 'default' }

/** A status label. The text is always shown, so colour is never the only signal. */
export function Status({ kind = '', children }: { kind?: Kind; children: ReactNode }) {
  return <Chip size="small" color={COLORS[kind]} variant={kind ? 'filled' : 'outlined'} label={children} />
}

/** A native select with a label: keyboard and screen-reader friendly everywhere. */
export function SelectField(props: TextFieldProps & { children: ReactNode }) {
  const { children, slotProps, ...rest } = props
  return <TextField select slotProps={{ ...slotProps, select: { native: true } }} {...rest}>{children}</TextField>
}

export const Row = ({ children }: { children: ReactNode }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, py: 1.25, borderTop: '1px solid', borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}>
    {children}
  </Box>
)
