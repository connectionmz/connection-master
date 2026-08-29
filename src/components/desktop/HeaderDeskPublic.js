import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Button, Container, Drawer, IconButton, List,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, useMediaQuery, useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import StoreMallDirectoryIcon from '@mui/icons-material/StoreMallDirectory';
import DomainIcon from '@mui/icons-material/Domain';
import FeedIcon from '@mui/icons-material/Feed';
import LoginIcon from '@mui/icons-material/Login';
import logo from '../../img/bg2.png';
import { useLanguage } from '../../context/LanguageContext';

const HeaderDeskPublic = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useLanguage();
  const navItems = [
    { to: '/explorar', icon: <DomainIcon />, label: t('nav.suppliers') },
    { to: '/lojas', icon: <StoreMallDirectoryIcon />, label: t('nav.stores') },
    { to: '/feed', icon: <FeedIcon />, label: t('nav.feed') },
  ];
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}>
          <Box component={Link} to="/" aria-label={t('nav.home')} sx={{ display: 'flex', alignItems: 'center', mr: 'auto' }}>
            <Box component="img" src={logo} alt="Connection Mozambique" sx={{ width: { xs: 104, md: 132 } }} />
          </Box>
          {!isMobile && (
            <Box component="nav" aria-label={t('nav.primary')} sx={{ display: 'flex', gap: 0.5 }}>
              {navItems.map((item) => (
                <Button key={item.to} component={Link} to={item.to} startIcon={item.icon} color={location.pathname === item.to ? 'primary' : 'inherit'} aria-current={location.pathname === item.to ? 'page' : undefined} sx={{ px: 1.5 }}>
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
          <Button component={Link} to="/auth" variant="contained" startIcon={<LoginIcon />}>
            {t('nav.signIn')}
          </Button>
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)} aria-label={t('nav.openMenu')} aria-controls="public-navigation-drawer" aria-expanded={drawerOpen}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </Container>
      <Drawer id="public-navigation-drawer" anchor="right" open={drawerOpen} onClose={closeDrawer} PaperProps={{ sx: { width: 'min(84vw, 320px)', bgcolor: 'background.paper' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={closeDrawer} aria-label={t('nav.closeMenu')}><CloseIcon /></IconButton>
        </Box>
        <List component="nav" aria-label={t('nav.primary')}>
          {navItems.map((item) => (
            <ListItemButton key={item.to} component={Link} to={item.to} selected={location.pathname === item.to} onClick={closeDrawer}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </AppBar>
  );
};

export default HeaderDeskPublic;
