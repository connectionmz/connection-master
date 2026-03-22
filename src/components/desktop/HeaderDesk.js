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
import GavelIcon from "@mui/icons-material/Gavel";
import DomainIcon from "@mui/icons-material/Domain";
import DescriptionIcon from "@mui/icons-material/Description";
import FeedIcon from "@mui/icons-material/Feed";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DownloadIcon from "@mui/icons-material/Download";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CloseIcon from "@mui/icons-material/Close";
import VerifiedIcon from "@mui/icons-material/Verified";
import WarningIcon from "@mui/icons-material/Warning";
import logo from "../../img/bg2.png";
import { db, auth } from "../../fb";
import { signOut } from "firebase/auth";
import { ShareIcon } from "lucide-react";

/* ── Design tokens — consistente com StoresDesk ─────────────────────── */
const T = {
  navy:        '#08192E',
  navyMid:     '#0E2849',
  navyLight:   '#183A63',
  navyCard:    '#0D2240',
  gold:        '#C8903A',
  goldLight:   '#E8B96A',
  goldPale:    '#FDF3E3',
  white:       '#FFFFFF',
  text:        '#0F1C2D',
  textSub:     '#6B89A5',
  border:      '#E0E8F0',
  borderMid:   '#C5D4E3',
  surface:     '#F4F7FB',
  darkBorder:  'rgba(255,255,255,0.08)',
  darkBorderMid:'rgba(255,255,255,0.14)',
  darkText:    'rgba(255,255,255,0.88)',
  darkTextSub: 'rgba(255,255,255,0.52)',
  darkMuted:   'rgba(255,255,255,0.30)',
  success:     '#10b981',
  error:       '#ef4444',
  warning:     '#f59e0b',
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

const BG_GRID = {
  position:'absolute', inset:0, pointerEvents:'none', opacity:0.02,
  backgroundImage:`linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize:'56px 56px',
};

const HeaderDesk = ({ user }) => {
  const [pendingConnections, setPendingConnections] = useState(0);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [pendingContests, setPendingContests] = useState(0);
  const [pendingNotifications, setPendingNotifications] = useState(0);
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
  const publicPanel = user?.publicPainel;
  const isMobile = useMediaQuery("(max-width:600px)");
  const isVerify = user?.subscriptions?.isverify === "true";

  // URLs
  const apkDownloadUrl = "https://firebasestorage.googleapis.com/v0/b/connectionmz.firebasestorage.app/o/apk%2Fconnectionmozambique.apk?alt=media&token=427059df-2af4-43e1-b9f8-99e882580a2e";
  const shortApkUrl = "https://bit.ly/connectionmz-apk";

  // Memoizar as funções de callback para evitar recriação
  const handlePendingConnections = useCallback((snapshot) => {
    if (!isMountedRef.current) return;
    if (snapshot.exists()) {
      const pendingCount = Object.values(snapshot.val()).filter(
        (connection) => connection.status === "pending"
      ).length;
      setPendingConnections(pendingCount);
    } else {
      setPendingConnections(0);
    }
  }, []);

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

  const handlePendingNotifications = useCallback((snapshot) => {
    if (!isMountedRef.current) return;
    if (snapshot.exists()) {
      const notifications = Object.values(snapshot.val());
      const pendingCount = notifications.filter(
        (notification) => notification.status === "unread"
      ).length;
      setPendingNotifications(pendingCount);
    } else {
      setPendingNotifications(0);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Limpar listeners anteriores
    listenersRef.current.forEach(({ ref, listener }) => {
      off(ref, 'value', listener);
    });
    listenersRef.current = [];

    if (user?.id) {
      const targetUserConnectionRef = ref(db, `connections/${user.id}/`);
      const targetUserQuotesRef = ref(db, `cotacoes/`);
      const targetUserNotificationsRef = ref(db, `notifications/${user.id}/`);

      // Configurar novos listeners
      onValue(targetUserConnectionRef, handlePendingConnections);
      onValue(targetUserQuotesRef, handlePendingQuotes);
      onValue(targetUserNotificationsRef, handlePendingNotifications);

      // Armazenar referências para limpeza
      listenersRef.current = [
        { ref: targetUserConnectionRef, listener: handlePendingConnections },
        { ref: targetUserQuotesRef, listener: handlePendingQuotes },
        { ref: targetUserNotificationsRef, listener: handlePendingNotifications },
      ];
    }

    return () => {
      isMountedRef.current = false;
      // Limpar todos os listeners
      listenersRef.current.forEach(({ ref, listener }) => {
        off(ref, 'value', listener);
      });
      listenersRef.current = [];
    };
  }, [user?.id, user?.sector, handlePendingConnections, handlePendingQuotes, handlePendingNotifications]);

  const toggleDrawer = useCallback((open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setDrawerOpen(open);
  }, []);

  const handleDownloadClick = useCallback((event) => {
    if (isMobile) {
      setDownloadDialogOpen(true);
    } else {
      setDownloadAnchorEl(event.currentTarget);
    }
  }, [isMobile]);

  const handleDownloadClose = useCallback(() => {
    setDownloadAnchorEl(null);
  }, []);

  const handleDownloadDialogClose = useCallback(() => {
    setDownloadDialogOpen(false);
  }, []);

  const handleDirectDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = apkDownloadUrl;
    link.setAttribute('download', 'connectionmozambique.apk');
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadDialogOpen(false);
  }, [apkDownloadUrl]);

  const handleOpenInNewTab = useCallback(() => {
    window.open(apkDownloadUrl, '_blank', 'noopener,noreferrer');
    setDownloadDialogOpen(false);
  }, [apkDownloadUrl]);

  const handleShareApp = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'Connection Mozambique App',
        text: 'Baixe o app Connection Mozambique para Android',
        url: shortApkUrl,
      }).catch((error) => console.log('Erro ao compartilhar:', error));
    } else {
      navigator.clipboard.writeText(shortApkUrl)
        .then(() => alert('Link copiado!'))
        .catch(() => {
          const textArea = document.createElement('textarea');
          textArea.value = shortApkUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Link copiado!');
        });
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
  const mainNavItems = [
    {
      to: "/explorar",
      icon: <DomainIcon />,
      label: "Empresas",
      requiresAuth: false,
      requiresVerify: false,
    },
    {
      to: "/lojas",
      icon: <StoreMallDirectoryIcon />,
      label: "Lojas",
      requiresAuth: false,
      requiresVerify: false,
    },
    {
      to: "/cotacoes",
      icon: <DescriptionIcon />,
      label: "Cotações",
      badge: pendingQuotes,
      requiresAuth: true,
      requiresVerify: true,
    },
    {
      to: "/feed",
      icon: <FeedIcon />,
      label: "Feed",
      requiresAuth: true,
      requiresVerify: true,
    },
  ];

  const notificationNavItems = [
    {
      to: "/inbox",
      icon: <NotificationsIcon />,
      label: "Notificações",
      badge: pendingNotifications,
      requiresAuth: true,
      requiresVerify: true,
    },
    {
      to: "/conexoes",
      icon: <PeopleIcon />,
      label: "Conexões",
      badge: pendingConnections,
      requiresAuth: true,
      requiresVerify: true,
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
                    filter: 'brightness(1.2)',
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
                      <Tooltip key={index} title={isDisabled ? "Verificação necessária" : ""} arrow>
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
              {/* Notifications & Connections - Desktop */}
              {!isMobile && user && isVerify && (
                <>
                  {notificationNavItems.map((item, index) => (
                    <Tooltip key={index} title={item.label} arrow>
                      <IconButton
                        onClick={() => navigate(item.to)}
                        sx={{
                          color: isActiveRoute(item.to) ? T.gold : T.darkText,
                          bgcolor: 'rgba(255,255,255,0.06)',
                          border: `1px solid ${T.darkBorder}`,
                          borderRadius: '10px',
                          width: 40,
                          height: 40,
                          position: 'relative',
                          '&:hover': {
                            bgcolor: 'rgba(200,144,58,0.15)',
                            color: T.gold,
                            borderColor: T.gold,
                          },
                        }}
                      >
                        <Badge
                          badgeContent={item.badge}
                          color="error"
                          classes={{ badge: 'notification-badge' }}
                        >
                          {item.icon}
                        </Badge>
                      </IconButton>
                    </Tooltip>
                  ))}
                </>
              )}

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
                      <ListItemText>Configurações</ListItemText>
                    </MenuItem>
                    
                    <MenuItem 
                      onClick={() => { handleProfileMenuClose(); navigate(`/perfil`); }}
                      sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
                    >
                      <ListItemIcon>
                        <AccountCircleIcon sx={{ color: T.gold, fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText>Meu Perfil</ListItemText>
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
                      <ListItemText>Sair</ListItemText>
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
                  Entrar
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

          {/* Main nav items */}
          {mainNavItems.map((item, index) => {
            const isDisabled = item.requiresVerify && !isVerify;
            const isActive = isActiveRoute(item.to);
            
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

          <Divider sx={{ borderColor: T.darkBorder, my: 1 }} />

          {/* Notification items */}
          {notificationNavItems.map((item, index) => {
            const isActive = isActiveRoute(item.to);
            return (
              <ListItem
                button
                key={index}
                onClick={() => handleMobileNavigation(item.to, item.requiresAuth, item.requiresVerify)}
                sx={{
                  opacity: !user || !isVerify ? 0.5 : 1,
                  bgcolor: isActive ? 'rgba(200,144,58,0.12)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(200,144,58,0.08)' },
                  py: 1.5,
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? T.gold : T.darkText,
                  minWidth: 40,
                }}>
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  sx={{ 
                    color: T.white,
                    '& .MuiListItemText-primary': { color: isActive ? T.gold : T.white }
                  }} 
                />
              </ListItem>
            );
          })}

          <Divider sx={{ borderColor: T.darkBorder, my: 1 }} />

          {/* Download item */}
          <ListItem
            button
            onClick={() => {
              handleDownloadClick();
              setDrawerOpen(false);
            }}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon sx={{ color: T.gold, minWidth: 40 }}>
              <DownloadIcon />
            </ListItemIcon>
            <ListItemText primary="Baixar App" sx={{ color: T.white }} />
          </ListItem>

          {/* Logout */}
          {user && (
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
              <ListItemText primary="Sair" sx={{ color: T.error }} />
            </ListItem>
          )}

          {/* Login/Register for non-authenticated */}
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
              <ListItemText primary="Entrar / Registrar" sx={{ color: T.gold }} />
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

      {/* Download Dialog (Mobile) */}
      <Dialog
        open={downloadDialogOpen}
        onClose={handleDownloadDialogClose}
        PaperProps={{
          sx: {
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: '16px',
            maxWidth: '90%',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: T.white, 
          fontFamily: '"Playfair Display", serif', 
          fontWeight: 700,
          borderBottom: `1px solid ${T.darkBorder}`,
        }}>
          Baixar App
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: T.darkTextSub }}>
            <Typography variant="body1" gutterBottom sx={{ color: T.darkText }}>
              Para instalar o app no seu dispositivo Android:
            </Typography>
            <Box component="ol" sx={{ pl: 2, mt: 1, color: T.darkTextSub }}>
              <li>Clique em "Baixar Agora" para iniciar o download</li>
              <li>Após o download, toque no arquivo APK para instalar</li>
              <li>Permita a instalação de fontes desconhecidas se solicitado</li>
              <li>Siga as instruções de instalação</li>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: T.darkMuted }}>
              Tamanho: ~15MB
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ 
          justifyContent: 'center', 
          flexWrap: 'wrap', 
          p: 3, 
          gap: 1,
          borderTop: `1px solid ${T.darkBorder}`,
        }}>
          <Button 
            onClick={handleDirectDownload}
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{
              bgcolor: T.gold,
              color: T.navy,
              '&:hover': { bgcolor: T.goldLight },
              borderRadius: '8px',
              px: 2,
            }}
          >
            Baixar Agora
          </Button>
          <Button 
            onClick={handleOpenInNewTab}
            variant="outlined"
            sx={{
              borderColor: T.darkBorder,
              color: T.darkText,
              '&:hover': { borderColor: T.gold, color: T.gold },
              borderRadius: '8px',
            }}
          >
            Abrir em Nova Aba
          </Button>
          <Button 
            onClick={handleShareApp}
            variant="outlined"
            sx={{
              borderColor: T.darkBorder,
              color: T.darkText,
              '&:hover': { borderColor: T.gold, color: T.gold },
              borderRadius: '8px',
            }}
          >
            Compartilhar
          </Button>
          <Button 
            onClick={handleDownloadDialogClose}
            sx={{ color: T.darkMuted }}
          >
            Cancelar
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
              Conta em verificação
            </Typography>
            <Typography variant="body2" sx={{ color: T.darkTextSub, mt: 0.5 }}>
              Seus dados estão sendo verificados. Você receberá uma notificação quando o processo for concluído.
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ color: T.error }}
              >
                Sair
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
                ⚠️ Sua conta não está verificada. Acesso limitado a algumas funcionalidades.
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
                Sair
              </Button>
            </Box>
          </Container>
        </Box>
      )}
    </>
  );
};

export default HeaderDesk;