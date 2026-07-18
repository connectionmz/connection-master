import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ref, onValue } from "firebase/database";
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Fade,
  Container,
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
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import VerifiedIcon from "@mui/icons-material/Verified";
import WarningIcon from "@mui/icons-material/Warning";
import logo from "../../img/bg2.png";
import { db } from "../../fb";
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
  backgroundImage:`linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg, rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize:'56px 56px',
};

const HeaderDeskSingular = ({ user }) => {
  const [pendingConnections, setPendingConnections] = useState(0);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [pendingNotifications, setPendingNotifications] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isVerify = user?.subscriptions?.isverify === "true";

  // URLs para download do APK
  const apkDownloadUrl = "https://firebasestorage.googleapis.com/v0/b/connectionmz.firebasestorage.app/o/apk%2Fconnectionmozambique.apk?alt=media&token=427059df-2af4-43e1-b9f8-99e882580a2e";
  const shortApkUrl = "https://bit.ly/connectionmz-apk";

  // Protected routes configuration
  const protectedRoutes = [
    "/explorar",
    "/lojas",
    "/feed",
    "/inbox",
    "/app",
    "/conexoes",
  ];

  // Buscar dados em tempo real
  useEffect(() => {
    if (!user?.id) return;

    // Conexões pendentes
    const connectionsRef = ref(db, `connections/${user.id}/`);
    const unsubscribeConnections = onValue(connectionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const pendingCount = Object.values(snapshot.val()).filter(
          (connection) => connection.status === "pending"
        ).length;
        setPendingConnections(pendingCount);
      } else {
        setPendingConnections(0);
      }
    });

    // Cotações pendentes
    const quotesRef = ref(db, `cotacoes/`);
    const unsubscribeQuotes = onValue(quotesRef, (snapshot) => {
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
    });

    // Notificações pendentes
    const notificationsRef = ref(db, `notifications/${user.id}/`);
    const unsubscribeNotifications = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const notifications = Object.values(snapshot.val());
        const pendingCount = notifications.filter(
          (notification) => notification.status === "unread"
        ).length;
        setPendingNotifications(pendingCount);
      } else {
        setPendingNotifications(0);
      }
    });

    return () => {
      unsubscribeConnections();
      unsubscribeQuotes();
      unsubscribeNotifications();
    };
  }, [user?.id, user?.sector]);

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleDownloadDialogClose = () => {
    setDownloadDialogOpen(false);
  };

  const handleDirectDownload = () => {
    const link = document.createElement('a');
    link.href = apkDownloadUrl;
    link.setAttribute('download', 'connectionmozambique.apk');
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadDialogOpen(false);
  };

  const handleOpenInNewTab = () => {
    window.open(apkDownloadUrl, '_blank', 'noopener,noreferrer');
    setDownloadDialogOpen(false);
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Connection Mozambique App',
        text: 'Baixe o app Connection Mozambique para Android',
        url: shortApkUrl,
      })
      .catch((error) => console.log('Erro ao compartilhar:', error));
    } else {
      navigator.clipboard.writeText(shortApkUrl)
        .then(() => alert('Link copiado para a área de transferência!'))
        .catch(() => {
          const textArea = document.createElement('textarea');
          textArea.value = shortApkUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Link copiado para a área de transferência!');
        });
    }
    setDownloadDialogOpen(false);
  };

  const handleNavigation = (path) => {
    if (!user) return true;
    
    if (!isVerify && protectedRoutes.includes(path)) {
      setShowVerificationAlert(true);
      return false;
    }
    return true;
  };

  const handleMobileNavigation = (path, e) => {
    if (e) e.preventDefault();
    
    if (!handleNavigation(path)) {
      setDrawerOpen(false);
      return;
    }
    
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = async () => {
    const { signOut } = await import("firebase/auth");
    const { auth } = await import("../../fb");
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleProfileMenuOpen = (event) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Itens de navegação principal
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
      to: "/feed", 
      icon: <FeedIcon />, 
      label: "Feed",
      requiresAuth: true,
      requiresVerify: true,
    },
  ];

  // Itens de notificação e conexões
  const notificationNavItems = [
    {
      to: "/inbox",
      icon: <NotificationsIcon />,
      label: "Notificações",
      badge: pendingNotifications,
      requiresAuth: true,
      requiresVerify: true,
    },
  ];

  // Itens do menu mobile (incluindo módulos e perfil)
  const mobileMenuItems = [
    ...mainNavItems,
    { type: "divider" },
    {
      to: "/perfil",
      icon: <PersonIcon />,
      label: "Meu Perfil",
      requiresAuth: true,
      requiresVerify: false,
    },
  ];

  const renderNavItems = () => (
    <Box display="flex" alignItems="center" gap={1}>
      {mainNavItems.map((item, index) => {
        const isActive = isActiveRoute(item.to);
        const isDisabled = item.requiresVerify && !isVerify;
        
        return (
          <Tooltip key={index} title={isDisabled ? "Verificação necessária" : ""} arrow>
            <span>
              <Button
                onClick={() => {
                  if (handleNavigation(item.to)) {
                    navigate(item.to);
                  }
                }}
                sx={{
                  color: isActive ? T.gold : T.darkText,
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: '0.85rem',
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
  );

  const renderNotificationIcons = () => (
    <Box display="flex" alignItems="center" gap={1}>
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
    </Box>
  );

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setDrawerOpen(open);
  };

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
              {!isMobile && renderNavItems()}
            </Box>

            {/* Right side - User actions */}
            <Box display="flex" alignItems="center" gap={1}>
              {/* Notifications & Connections - Desktop */}
              {!isMobile && user && isVerify && renderNotificationIcons()}

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
                      <ListItemText>Módulos</ListItemText>
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
                    
                    <Divider sx={{ borderColor: T.darkBorder, my: 1 }} />
                    
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
                onClick={() => handleMobileNavigation(item.to)}
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
                <ListItemText primary="Sair" sx={{ color: T.error }} />
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
            <DownloadIcon sx={{ color: T.gold, fontSize: 20 }} />
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
            startIcon={<DownloadIcon />}
            onClick={handleOpenInNewTab}
            sx={{
              mb: 2,
              borderColor: T.darkBorder,
              color: T.darkText,
              '&:hover': { borderColor: T.gold, color: T.gold },
            }}
          >
            Abrir em Nova Aba
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
              Conta em verificação
            </Typography>
            <Typography variant="body2" sx={{ color: T.darkTextSub, mt: 0.5 }}>
              Seus dados estão sendo verificados. Você receberá uma notificação quando o processo for concluído.
            </Typography>
          </Alert>
        </Snackbar>
      )}
      
      {/* Verification Banner */}
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

export default HeaderDeskSingular;