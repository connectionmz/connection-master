import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { 
  CssBaseline,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
  Typography
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import DesktopRoutes from './components/routes/DesktopRoutes';
import { useUser } from './context/UserContext';
import { useTheme as useColorMode } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import { createAppTheme } from './theme/appTheme';

const App = () => {
  const {
    authUser,
    profile,
    isSessionLoading,
    isProfileLoading,
    error: sessionError,
  } = useUser();
  const { theme: colorMode } = useColorMode();
  const { t } = useLanguage();
  const theme = useMemo(() => createAppTheme(colorMode), [colorMode]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  useEffect(() => {
    if (!sessionError) return;

    setSnackbar({
      open: true,
      message: t('app.sessionError'),
      severity: 'error',
    });
  }, [sessionError, t]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Loading enquanto inicializa
  if (isSessionLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Backdrop open sx={{ color: '#fff', zIndex: 9999, flexDirection: 'column' }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>
            {t('app.loadingSession')}
          </Typography>
        </Backdrop>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <DesktopRoutes
          user={profile}
          authUser={authUser}
          profileLoading={isProfileLoading}
        />
      </Router>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;
