import { createTheme } from '@mui/material/styles'

/**
 * Material UI theme for the screens that use it (sign-in, Cases, the Dashboard summary and the matter workspace).
 * Colours follow the existing myCourt palette; buttons and tabs keep sentence case so the text a screen reader or a test
 * sees is the text on the screen. CssBaseline is deliberately NOT used, so the older screens keep their own styles.
 */
export const theme = createTheme({
  palette: {
    primary: { main: '#2f4fc7' },
    success: { main: '#177245' },
    warning: { main: '#a35a00' },
    background: { default: '#f5f7fb' },
    text: { primary: '#1a2233', secondary: '#52607a' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'inherit',
    button: { textTransform: 'none', fontWeight: 600 },
    h2: { fontSize: '1.15rem', fontWeight: 700 },
    h3: { fontSize: '1rem', fontWeight: 700 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, minHeight: 44 } } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true, margin: 'dense' } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiAlert: { styleOverrides: { root: { alignItems: 'center' } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, whiteSpace: 'nowrap' } } },
  },
})
