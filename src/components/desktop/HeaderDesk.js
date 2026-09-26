import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ref, onValue, off } from "firebase/database";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  Button,
  Badge,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Container,
  Tooltip,
  Fade,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import StoreMallDirectoryIcon from "@mui/icons-material/StoreMallDirectory";
import DomainIcon from "@mui/icons-material/Domain";
import DescriptionIcon from "@mui/icons-material/Description";
import GavelIcon from "@mui/icons-material/Gavel";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DownloadIcon from "@mui/icons-material/Download";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import logo from "../../img/bg2.png";
import { db, auth } from "../../fb";
import { signOut } from "firebase/auth";
import { ShareIcon } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme as useColorMode } from "../../context/ThemeContext";

/* ── Design tokens — consistente com StoresDesk. O cabeçalho respeita o
   toggle de tema claro/escuro do site (ao contrário das páginas de
   listagem tipo Cotações/Concursos, que são sempre navy/dourado por
   design); DARK_T é a paleta original, LIGHT_T é o equivalente claro. ── */
const BASE_T = {
  gold:        '#C8903A',
  goldLight:   '#E8B96A',
  goldPale:    '#FDF3E3',
  text:        '#0F1C2D',
  textSub:     '#6B89A5',
  border:      '#E0E8F0',
  borderMid:   '#C5D4E3',
  surface:     '#F4F7FB',
  success:     '#10b981',
  error:       '#ef4444',
  warning:     '#f59e0b',
};

const DARK_T = {
  ...BASE_T,
  navy:        '#08192E',
  navyMid:     '#0E2849',
  navyLight:   '#183A63',
  navyCard:    '#0D2240',
  white:       '#FFFFFF',
  darkBorder:  'rgba(255,255,255,0.08)',
  darkBorderMid:'rgba(255,255,255,0.14)',
  darkText:    'rgba(255,255,255,0.88)',
  darkTextSub: 'rgba(255,255,255,0.52)',
  darkMuted:   'rgba(255,255,255,0.30)',
};

const LIGHT_T = {
  ...BASE_T,
  navy:        '#FFFFFF',
  navyMid:     '#FAFAF8',
  navyLight:   BASE_T.surface,
  navyCard:    '#FFFFFF',
  white:       BASE_T.text,
  darkBorder:  BASE_T.border,
  darkBorderMid:BASE_T.borderMid,
  darkText:    BASE_T.text,
  darkTextSub: BASE_T.textSub,
  darkMuted:   'rgba(15,28,45,0.35)',
};

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @keyframes pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50% { opacity:.6; transform:scale(1.1); }
  }
  .notification-badge {
    animation: pulse 2s ease infinite;
  }
`;

const getBgGrid = (mode) => ({
  position:'absolute', inset:0, pointerEvents:'none', opacity:0.02,
  backgroundImage: mode === 'light'
    ? `linear-gradient(rgba(0,0,0,1) 1px,transparent 1px),linear-gradient(90deg, rgba(0,0,0,1) 1px,transparent 1px)`
    : `linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg, rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize:'56px 56px',
});

const HeaderDesk = ({ user }) => {
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  // Refs para controlar os listeners
  const listenersRef = useRef([]);
  const isMountedRef = useRef(true);

  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isVerify = user?.subscriptions?.isverify === "true";
  const { t } = useLanguage();
  const { mode } = useColorMode();
  const T = mode === 'light' ? LIGHT_T : DARK_T;
  const BG_GRID = getBgGrid(mode);

  // URLs
  const apkDownloadUrl = "https://firebasestorage.googleapis.com/v0/b/connectionmz.firebasestorage.app/o/apk%2Fconnectionmozambique.apk?alt=media&token=427059df-2af4-43e1-b9f8-99e882580a2e";
  const shortApkUrl = "https://bit.ly/connectionmz-apk";

  const handlePendingQuotes = useCallback((snapshot) => {
    if (!isMountedRef.current || !user?.sector) return;
    if (snapshot.exists()) {
      const quotes = Object.values(snapshot.val());
      const pendingCount = quotes.filter((quote) => {
        return (
          quote.sector === user.sector &&
          !(quote.views && quote.views[user.id]) &&
          quote.company?.id !== user.id
        );
      }).length;
      setPendingQuotes(pendingCount);
    } else {
      setPendingQuotes(0);
    }
  }, [user?.sector, user?.id]);

  useEffect(() => {
    isMountedRef.current = true;

    // Limpar listeners anteriores
    listenersRef.current.forEach(({ ref, listener }) => {
      off(ref, 'value', listener);
    });
    listenersRef.current = [];

    if (user?.id) {
      const targetUserQuotesRef = ref(db, `cotacoes/`);

      onValue(targetUserQuotesRef, handlePendingQuotes);

      listenersRef.current = [
        { ref: targetUserQuotesRef, listener: handlePendingQuotes },
      ];
    }

    return () => {
      isMountedRef.current = false;
      listenersRef.current.forEach(({ ref, listener }) => {
        off(ref, 'value', listener);
      });
      listenersRef.current = [];
    };
  }, [user?.id, user?.sector, handlePendingQuotes]);

  const toggleDrawer = useCallback((open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setDrawerOpen(open);
  }, []);

  const handleDownloadClose = useCallback(() => {
    setDownloadAnchorEl(null);
  }, []);

  const handleDownloadDialogClose = useCallback(() => {
    setDownloadDialogOpen(false);
  }, []);

  const handleDirectDownload = useCallback(() => {
    window.open(apkDownloadUrl, "_blank", "noopener,noreferrer");
    setDownloadDialogOpen(false);
  }, [apkDownloadUrl]);

  const handleShareApp = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Connection Mozambique",
          text: "Baixe o app Connection Mozambique",
          url: shortApkUrl,
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      await navigator.clipboard.writeText(shortApkUrl);
    }
    setDownloadDialogOpen(false);
  }, [shortApkUrl]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, [navigate]);

  const handleNavigation = useCallback((path, requiresAuth, requiresVerify) => {
    if (requiresAuth && !user) {
      navigate("/auth");
      return false;
    }

    if (requiresVerify && !isVerify) {
      setShowVerificationAlert(true);
      return false;
    }

    navigate(path);
    return true;
  }, [user, isVerify, navigate]);

  const handleMobileNavigation = useCallback((path, requiresAuth, requiresVerify) => {
    if (requiresAuth && !user) {
      navigate("/auth");
      setDrawerOpen(false);
      return;
    }

    if (requiresVerify && !isVerify) {
      setShowVerificationAlert(true);
      setDrawerOpen(false);
      return;
    }

    navigate(path);
    setDrawerOpen(false);
  }, [user, isVerify, navigate]);

  const handleProfileMenuOpen = useCallback((event) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setProfileMenuAnchor(event.currentTarget);
  }, [user, navigate]);

  const handleProfileMenuClose = useCallback(() => {
    setProfileMenuAnchor(null);
  }, []);

  const isActiveRoute = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  // Menu items estruturados (fora do componente para evitar recriação)
  // Escopo atual: plataforma de fornecedores nacional + loja (Mercado + Cotações)
  const mainNavItems = [
    {
      to: "/explorar",
      icon: <DomainIcon />,
      label: t('nav.suppliers'),
      requiresAuth: false,
      requiresVerify: false,
    },
    {
      to: "/lojas",
      icon: <StoreMallDirectoryIcon />,
      label: t('nav.stores'),
      requiresAuth: false,
      requiresVerify: false,
    },
     {
      to: "/feed",
      icon: <StoreMallDirectoryIcon />,
      label: t('nav.feed'),
      requiresAuth: false,
      requiresVerify: false,
    },
    {
      to: "/cotacoes",
      icon: <DescriptionIcon />,
      label: t('nav.quotes'),
      badge: pendingQuotes,
      requiresAuth: true,
      requiresVerify: true,
    },
    {
      to: "/concursos",
      icon: <GavelIcon />,
      label: t('nav.tenders'),
      requiresAuth: true,
      requiresVerify: true,
    },
    {
      to: "/concursos-empresas",
      icon: <GavelIcon />,
      label: t('nav.companyTenders'),
      requiresAuth: true,
      requiresVerify: false,
    },
    {
      to: "/minhas-cotacoes",
      icon: <ReceiptLongIcon />,
      label: t('nav.sentQuotes'),
      requiresAuth: true,
      requiresVerify: false,
    },
  ];

  // Itens para o menu mobile
  const mobileMenuItems = [
    ...mainNavItems,
    { type: "divider" },
    {
      to: "/app",
      icon: <DashboardIcon />,
      label: t('nav.dashboard'),
      requiresAuth: true,
      requiresVerify: true,
    },
    {
      to: "/perfil",
      icon: <PersonIcon />,
      label: t('nav.profile'),
      requiresAuth: true,
      requiresVerify: false,
    },
  ];

  return (
    <>
      <style>{KEYFRAMES}</style>

      <AppBar
        position="sticky"
        sx={{
          bgcolor: T.navy,
          background: `linear-gradient(180deg, ${T.navy} 0%, ${T.navyMid} 100%)`,
          borderBottom: `1px solid ${T.darkBorder}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Grid overlay */}
        <Box sx={BG_GRID} />

        <Container maxWidth="xl">
          <Toolbar
            sx={{
              justifyContent: "space-between",
              px: { xs: 0, sm: 2 },
              minHeight: { xs: '64px', md: '72px' },
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Logo */}
            <Box display="flex" alignItems="center" gap={2}>
              <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <img
                  src={logo}
                  alt="Logo"
                  style={{
                    width: isMobile ? "90px" : "120px",
                    filter: mode === 'dark' ? 'brightness(1.2)' : 'none',
                  }}
                />
              </Link>

              {/* Desktop Navigation */}
              {!isMobile && (
                <Box display="flex" alignItems="center" gap={1} sx={{ ml: 3 }}>
                  {mainNavItems.map((item, index) => {
                    const isActive = isActiveRoute(item.to);
                    const isDisabled = item.requiresVerify && !isVerify;

                    return (
                      <Tooltip key={index} title={isDisabled ? t('nav.verificationRequired') : ""} arrow>
                        <span>
                          <Button
                            onClick={() => handleNavigation(item.to, item.requiresAuth, item.requiresVerify)}
                            sx={{
                              color: isActive ? T.gold : T.white,
                              fontFamily: '"Plus Jakarta Sans", sans-serif',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              textTransform: 'none',
                              px: 1.5,
                              py: 0.8,
                              borderRadius: '8px',
                              position: 'relative',
                              opacity: isDisabled ? 0.5 : 1,
                              '&:hover': {
                                bgcolor: 'rgba(200,144,58,0.08)',
                                color: T.gold,
                              },
                              '&::after': isActive ? {
                                content: '""',
                                position: 'absolute',
                                bottom: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '20px',
                                height: '2px',
                                bgcolor: T.gold,
                                borderRadius: '2px',
                              } : {},
                            }}
                          >
                            {item.label}
                            {item.badge > 0 && (
                              <Badge
                                badgeContent={item.badge}
                                color="error"
                                sx={{ ml: 1 }}
                                classes={{ badge: 'notification-badge' }}
                              />
                            )}
                          </Button>
                        </span>
                      </Tooltip>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Right side - User actions */}
            <Box display="flex" alignItems="center" gap={1}>
              {/* Profile / Login button */}
              {user ? (
                <>
                  <Tooltip title="Perfil" arrow>
                    <IconButton
                      onClick={handleProfileMenuOpen}
                      sx={{
                        p: 0.5,
                        border: `2px solid ${isVerify ? T.gold : T.darkBorder}`,
                        borderRadius: '12px',
                        transition: 'border-color 0.2s',
                        '&:hover': {
                          borderColor: T.gold,
                        },
                      }}
                    >
                      <Avatar
                        src={user?.logoUrl || ""}
                        alt={user?.nome || "Perfil"}
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: T.navyCard,
                          color: T.gold,
                          fontWeight: 600,
                        }}
                      >
                        {!user?.logoUrl && (user?.nome?.[0] || <AccountCircleIcon />)}
                      </Avatar>
                    </IconButton>
                  </Tooltip>

                  {/* Profile Menu */}
                  <Menu
                    anchorEl={profileMenuAnchor}
                    open={Boolean(profileMenuAnchor)}
                    onClose={handleProfileMenuClose}
                    TransitionComponent={Fade}
                    PaperProps={{
                      sx: {
                        bgcolor: T.navyCard,
                        border: `1px solid ${T.darkBorder}`,
                        borderRadius: '12px',
                        mt: 1,
                        minWidth: 200,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                      }
                    }}
                  >
                    <MenuItem
                      onClick={() => { handleProfileMenuClose(); navigate(`/app`); }}
                      sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
                    >
                      <ListItemIcon>
                        <DashboardIcon sx={{ color: T.gold, fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText>{t('nav.dashboard')}</ListItemText>
                    </MenuItem>

                    <MenuItem
                      onClick={() => { handleProfileMenuClose(); navigate(`/perfil`); }}
                      sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
                    >
                      <ListItemIcon>
                        <AccountCircleIcon sx={{ color: T.gold, fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText>{t('nav.profile')}</ListItemText>
                    </MenuItem>

                    {!isVerify && (
                      <MenuItem
                        disabled
                        sx={{ color: T.darkMuted, opacity: 0.7 }}
                      >
                        <ListItemIcon>
                          <WarningIcon sx={{ color: T.warning, fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText secondary="Verificação pendente" />
                      </MenuItem>
                    )}

                    <Box sx={{ borderTop: `1px solid ${T.darkBorder}`, my: 1 }} />

                    <MenuItem
                      onClick={() => { handleProfileMenuClose(); handleLogout(); }}
                      sx={{ color: T.error, '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}
                    >
                      <ListItemIcon>
                        <LogoutIcon sx={{ color: T.error, fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText>{t('nav.signOut')}</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  variant="outlined"
                  sx={{
                    borderColor: T.darkBorder,
                    color: T.darkText,
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontWeight: 600,
                    borderRadius: '10px',
                    px: 2.5,
                    py: 0.8,
                    '&:hover': {
                      borderColor: T.gold,
                      bgcolor: 'rgba(200,144,58,0.08)',
                      color: T.gold,
                    },
                  }}
                >
                  {t('nav.signIn')}
                </Button>
              )}

              {/* Mobile menu button */}
              {isMobile && (
                <IconButton
                  onClick={toggleDrawer(true)}
                  sx={{
                    color: T.darkText,
                    bgcolor: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${T.darkBorder}`,
                    borderRadius: '10px',
                    ml: 1,
                    '&:hover': {
                      bgcolor: 'rgba(200,144,58,0.15)',
                      color: T.gold,
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            bgcolor: T.navyCard,
            width: 300,
            borderLeft: `1px solid ${T.darkBorder}`,
          }
        }}
      >
        <Box sx={{
          p: 2,
          borderBottom: `1px solid ${T.darkBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(90deg, ${T.navyCard} 0%, ${T.navy} 100%)`,
        }}>
          <Typography sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 700,
            color: T.white
          }}>
            Menu
          </Typography>
          <IconButton onClick={toggleDrawer(false)} sx={{ color: T.darkMuted }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <List sx={{ pt: 0 }}>
          {/* User info if logged in */}
          {user && (
            <Box sx={{
              p: 2,
              bgcolor: 'rgba(255,255,255,0.02)',
              mb: 1,
              borderBottom: `1px solid ${T.darkBorder}`,
            }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar
                  src={user?.logoUrl}
                  sx={{
                    width: 48,
                    height: 48,
                    border: `2px solid ${isVerify ? T.gold : T.darkBorder}`,
                  }}
                >
                  {user?.nome?.[0]}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 600, color: T.white, fontSize: '0.95rem' }}>
                    {user?.nome || "Usuário"}
                  </Typography>
                  <Typography sx={{ color: T.darkTextSub, fontSize: '0.8rem' }}>
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
              {!isVerify && (
                <Box sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: 'rgba(245,158,11,0.12)',
                  borderRadius: 1,
                  border: '1px solid rgba(245,158,11,0.25)'
                }}>
                  <Typography sx={{ color: T.warning, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WarningIcon sx={{ fontSize: 14 }} />
                    Verificação pendente
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Menu items para mobile */}
          {mobileMenuItems.map((item, index) => {
            if (item.type === "divider") {
              return <Divider key={index} sx={{ borderColor: T.darkBorder, my: 1 }} />;
            }

            const isDisabled = item.requiresVerify && !isVerify;
            const isActive = isActiveRoute(item.to);

            // Verificar se deve mostrar o item (requer autenticação e o usuário não está logado)
            if (item.requiresAuth && !user) return null;

            return (
              <ListItem
                button
                key={index}
                onClick={() => handleMobileNavigation(item.to, item.requiresAuth, item.requiresVerify)}
                sx={{
                  opacity: isDisabled ? 0.5 : 1,
                  bgcolor: isActive ? 'rgba(200,144,58,0.12)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${T.gold}` : 'none',
                  '&:hover': { bgcolor: 'rgba(200,144,58,0.08)' },
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{
                  color: isActive ? T.gold : T.darkText,
                  minWidth: 40,
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={item.badge > 0 ? `${item.badge} pendente` : null}
                  secondaryTypographyProps={{ color: T.gold }}
                  sx={{
                    color: T.white,
                    '& .MuiListItemText-primary': { color: isActive ? T.gold : T.white }
                  }}
                />
              </ListItem>
            );
          })}

          {/* Logout para mobile */}
          {user && (
            <>
              <Divider sx={{ borderColor: T.darkBorder, my: 1 }} />
              <ListItem
                button
                onClick={() => {
                  handleLogout();
                  setDrawerOpen(false);
                }}
                sx={{
                  py: 1.5,
                  color: T.error,
                  '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' }
                }}
              >
                <ListItemIcon sx={{ color: T.error, minWidth: 40 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary={t('nav.signOut')} sx={{ color: T.error }} />
              </ListItem>
            </>
          )}

          {/* Login/Register para mobile (usuário não autenticado) */}
          {!user && (
            <ListItem
              button
              onClick={() => {
                navigate("/auth");
                setDrawerOpen(false);
              }}
              sx={{
                bgcolor: 'rgba(200,144,58,0.12)',
                mt: 2,
                py: 1.5,
                borderRadius: 1,
              }}
            >
              <ListItemIcon sx={{ color: T.gold, minWidth: 40 }}>
                <AccountCircleIcon />
              </ListItemIcon>
              <ListItemText primary={t('nav.signInOrRegister')} sx={{ color: T.gold }} />
            </ListItem>
          )}
        </List>
      </Drawer>

      {/* Download Menu (Desktop) */}
      <Menu
        anchorEl={downloadAnchorEl}
        open={Boolean(downloadAnchorEl)}
        onClose={handleDownloadClose}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: '12px',
            mt: 1,
            minWidth: 200,
          }
        }}
      >
        <MenuItem
          onClick={handleDownloadClose}
          component="a"
          href={apkDownloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download="connectionmozambique.apk"
          sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
        >
          <ListItemIcon>
            <DownloadIcon sx={{ color: T.gold, fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText>Versão Android (APK)</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={handleDownloadClose}
          component="a"
          href={shortApkUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
        >
          <ListItemIcon>
            <ShareIcon sx={{ color: T.gold, fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText>Link Alternativo</ListItemText>
        </MenuItem>
      </Menu>

      {/* Download Dialog para mobile */}
      <Dialog
        open={downloadDialogOpen}
        onClose={handleDownloadDialogClose}
        PaperProps={{
          sx: {
            bgcolor: T.navyCard,
            borderRadius: '16px',
            border: `1px solid ${T.darkBorder}`,
          }
        }}
      >
        <DialogTitle sx={{ color: T.white, fontFamily: '"Playfair Display", serif' }}>
          Baixar App Connection Mozambique
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: T.darkTextSub, mb: 2 }}>
            Escolha uma opção para baixar o aplicativo:
          </DialogContentText>
          <Button
            fullWidth
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDirectDownload}
            sx={{
              mb: 2,
              bgcolor: T.gold,
              color: T.navy,
              '&:hover': { bgcolor: T.goldLight },
            }}
          >
            Baixar APK Diretamente
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShareApp}
            sx={{
              borderColor: T.darkBorder,
              color: T.darkText,
              '&:hover': { borderColor: T.gold, color: T.gold },
            }}
          >
            Compartilhar Link
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownloadDialogClose} sx={{ color: T.darkMuted }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verification Alert */}
      {user && (
        <Snackbar
          open={showVerificationAlert}
          autoHideDuration={8000}
          onClose={() => setShowVerificationAlert(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="warning"
            onClose={() => setShowVerificationAlert(false)}
            icon={<WarningIcon />}
            sx={{
              bgcolor: T.navyCard,
              color: T.white,
              border: `1px solid ${T.warning}`,
              borderRadius: '12px',
              '& .MuiAlert-icon': { color: T.warning },
            }}
          >
            <Typography variant="body1" fontWeight="bold" sx={{ color: T.warning }}>
              {t('verification.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: T.darkTextSub, mt: 0.5 }}>
              {t('verification.description')}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ color: T.error }}
              >
                {t('nav.signOut')}
              </Button>
            </Box>
          </Alert>
        </Snackbar>
      )}

      {/* Verification Banner for Desktop */}
      {user && !isVerify && !isMobile && (
        <Box
          sx={{
            bgcolor: 'rgba(245,158,11,0.12)',
            borderBottom: `1px solid ${T.warning}`,
            p: 1,
            textAlign: 'center',
          }}>
          <Container maxWidth="xl">
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap'
            }}>
              <Typography sx={{ color: T.warning, fontSize: '0.9rem' }}>
                ⚠️ {t('verification.limited')}
              </Typography>

              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                  color: T.error,
                  borderColor: T.error,
                  '&:hover': {
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    borderColor: T.error
                  }
                }}
              >
                {t('nav.signOut')}
              </Button>
            </Box>
          </Container>
        </Box>
      )}
    </>
  );
};

export default HeaderDesk;
