import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode = 'light') => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#6EA8FE' : '#1A73E8',
      light: '#8AB4F8',
      dark: '#0D47A1',
      contrastText: mode === 'dark' ? '#08192E' : '#FFFFFF',
    },
    secondary: {
      main: mode === 'dark' ? '#F4B860' : '#C47F17',
    },
    background: {
      default: mode === 'dark' ? '#071525' : '#F5F7FA',
      paper: mode === 'dark' ? '#10243B' : '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#F3F7FC' : '#0F1C2D',
      secondary: mode === 'dark' ? '#B8C7D9' : '#4C6178',
    },
    divider: mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(15,28,45,0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { scrollBehavior: 'smooth' },
        body: { overflowX: 'hidden' },
        'a, button, input, textarea, select, [tabindex]': {
          '&:focus-visible': {
            outline: `3px solid ${mode === 'dark' ? '#F4B860' : '#1A73E8'}`,
            outlineOffset: 2,
          },
        },
        '@media (prefers-reduced-motion: reduce)': {
          html: { scrollBehavior: 'auto' },
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: false },
    },
    MuiTooltip: {
      defaultProps: { arrow: true, enterTouchDelay: 0 },
    },
  },
});
