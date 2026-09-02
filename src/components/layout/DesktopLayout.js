import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import HeaderDesk from '../desktop/HeaderDesk';
import HeaderDeskPublic from '../desktop/HeaderDeskPublic';
import HeaderDeskSingular from '../desktop/HeaderDeskSingular';
import FooterDesk from '../desktop/FooterDesk';
import { useTheme as useColorMode } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { isPersonalAccount } from '../../utils/accountType';

const FULLSCREEN_ROUTES = new Set([
  '/auth',
  '/email-verification',
  '/create',
  '/setup',
  '/setupUser',
  '/forget-password',
  '/select-account-type',
]);

const PreferenceControls = () => {
  const { theme, toggleTheme } = useColorMode();
  const { language, changeLanguage, t } = useLanguage();
  const isDarkMode = theme === 'dark';
  const nextLanguage = language === 'pt' ? 'en' : 'pt';

  return (
    <Paper
      component="aside"
      aria-label="Preferências / Preferences"
      elevation={6}
      sx={{
        position: 'fixed',
        right: { xs: 12, sm: 20 },
        bottom: { xs: 12, sm: 20 },
        zIndex: (muiTheme) => muiTheme.zIndex.snackbar - 1,
        borderRadius: 999,
        p: 0.5,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.25}>
        <Tooltip title={isDarkMode ? t('preferences.lightMode') : t('preferences.darkMode')}>
          <IconButton
            onClick={toggleTheme}
            color="primary"
            aria-label={isDarkMode ? t('preferences.lightMode') : t('preferences.darkMode')}
            size="small"
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
        <Button
          onClick={toggleTheme}
          size="small"
          aria-hidden="true"
          tabIndex={-1}
          sx={{ display: { xs: 'none', sm: 'inline-flex' }, minWidth: 0, px: 1 }}
        >
          {t('preferences.theme')}: {isDarkMode ? t('preferences.dark') : t('preferences.light')}
        </Button>
        <Tooltip title={language === 'pt'
          ? t('preferences.changeToEnglish')
          : t('preferences.changeToPortuguese')}
        >
          <Button
            onClick={() => changeLanguage(nextLanguage)}
            aria-label={language === 'pt'
              ? t('preferences.changeToEnglish')
              : t('preferences.changeToPortuguese')}
            size="small"
            sx={{ minWidth: 42, borderRadius: 999 }}
          >
            {nextLanguage.toUpperCase()}
          </Button>
        </Tooltip>
      </Stack>
    </Paper>
  );
};

const DesktopLayout = ({ authUser, profile, profileLoading, children }) => {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const isFullscreenRoute = FULLSCREEN_ROUTES.has(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const renderHeader = () => {
    if (isFullscreenRoute || (authUser && (profileLoading || !profile))) return null;
    if (!authUser) return <HeaderDeskPublic />;
    if (isPersonalAccount(profile)) return <HeaderDeskSingular user={profile} />;
    return <HeaderDesk user={profile} />;
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'fixed',
          top: 8,
          left: 8,
          zIndex: (muiTheme) => muiTheme.zIndex.tooltip + 1,
          transform: 'translateY(-150%)',
          bgcolor: 'background.paper',
          color: 'primary.main',
          px: 2,
          py: 1,
          borderRadius: 1,
          fontWeight: 700,
          '&:focus': { transform: 'translateY(0)' },
        }}
      >
        {t('layout.skipToContent')}
      </Box>

      {authUser && profileLoading && !isFullscreenRoute && (
        <LinearProgress aria-label={t('layout.loadingProfile')} />
      )}

      {renderHeader()}

      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{ flex: 1, width: '100%', minWidth: 0 }}
      >
        {children}
      </Box>

      {!isFullscreenRoute && <FooterDesk />}
      <PreferenceControls />
    </Box>
  );
};

export default DesktopLayout;
