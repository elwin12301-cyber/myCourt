import { createTheme } from '@mui/material/styles'

const SERIF = 'Georgia, "Times New Roman", "Noto Serif", serif'

/**
 * Classic legal look: deep navy, antique gold and ivory paper, with serif headings.
 * CssBaseline is deliberately NOT used, so the older style sheet keeps working beside it.
 * Buttons and tabs keep sentence case so the text a screen reader or a test sees is the text on the screen.
 */
export const theme = createTheme({
  palette: {
    primary: { main: '#1f3a6e', dark: '#14264d', light: '#4d6aa3' },
    secondary: { main: '#9a6f1e' },
    success: { main: '#1d6b45' },
    warning: { main: '#9a5a00' },
    background: { default: '#faf7f0', paper: '#ffffff' },
    text: { primary: '#1b2338', secondary: '#55607a' },
    divider: '#e7e0d0',
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: 'inherit',
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '.2px' },
    h2: { fontFamily: SERIF, fontSize: '1.25rem', fontWeight: 700 },
    h3: { fontFamily: SERIF, fontSize: '1.05rem', fontWeight: 700 },
    h4: { fontFamily: SERIF },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { contained: { '&:hover': { backgroundColor: '#14264d' } }, outlined: { borderColor: '#c9bfa8' } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, minHeight: 44 } } },
    MuiTabs: { styleOverrides: { indicator: { backgroundColor: '#b8893b', height: 3 } } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true, margin: 'dense' } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: '#fff', '& fieldset': { borderColor: '#d6cdb8' } } } },
    MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderColor: '#e7e0d0', boxShadow: '0 1px 2px #3a2f1410, 0 6px 18px #3a2f140a' } } },
    MuiAlert: { styleOverrides: { root: { alignItems: 'center' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 4 } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: '#f4efe3', color: '#3b3a33' } } },
  },
})
