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
  Menu,
  MenuItem
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
import logo from "../../img/bg2.png";
import { db, auth } from "../../fb";
import { Dashboard } from "@mui/icons-material";
import { signOut } from "firebase/auth";

const HeaderDesk = ({ user }) => {
  const [pendingConnections, setPendingConnections] = useState(0);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [pendingContests, setPendingContests] = useState(0);
  const [pendingNotifications, setPendingNotifications] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const publicPanel = user?.publicPainel;
  const isMobile = useMediaQuery("(max-width:600px)");
  const isVerify = user?.subscriptions?.isverify === "true";

  const protectedRoutes = [
    "/empresas",
    "/lojas",
    "/concursos", 
    "/cotacoes",
    "/feed",
    "/inbox",
    "/conexoes",
    "/app"
  ];

  const handleDownloadClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleNavigation = (path) => {
    if (!user) {
      navigate("/auth");
      return false;
    }
    
    if (!isVerify && protectedRoutes.includes(path)) {
      setShowVerificationAlert(true);
      return false;
    }
    
    return true;
  };

  // Função específica para o menu mobile
  const handleMobileNavigation = (path, e) => {
    if (e) e.preventDefault();
    
    if (!handleNavigation(path)) {
      setDrawerOpen(false);
      return;
    }
    
    navigate(path);
    setDrawerOpen(false);
  };

  useEffect(() => {
    if (user?.id) {
      const targetUserConnectionRef = ref(db, `connections/${user.id}/`);
      const targetUserQuotesRef = ref(db, `cotacoes/`);
      const targetUserContestsRef = ref(db, `concursos/`);
      const targetUserNotificationsRef = ref(db, `notifications/${user.id}/`);

      const unsubscribeConnections = onValue(targetUserConnectionRef, (snapshot) => {
        if (snapshot.exists()) {
          const pendingCount = Object.values(snapshot.val()).filter(
            (connection) => connection.status === "pending"
          ).length;
          setPendingConnections(pendingCount);
        } else {
          setPendingConnections(0);
        }
      });

      const unsubscribeQuotes = onValue(targetUserQuotesRef, (snapshot) => {
        if (snapshot.exists()) {
          const quotes = Object.values(snapshot.val());
          const pendingCount = quotes.filter((quote) => {
            return (
              quote.sector === user.sector &&
              !(quote.views && quote.views[user.id]) &&
              quote.company.id !== user.id
            );
          }).length;
          setPendingQuotes(pendingCount);
        } else {
          setPendingQuotes(0);
        }
      });

      const unsubscribeContests = onValue(targetUserContestsRef, (snapshot) => {
        if (snapshot.exists()) {
          const pendingCount = Object.values(snapshot.val()).filter(
            (contest) => contest.status === "Aberta" && 
            user.sector === contest.setor &&
              !(contest.views && contest.views[user.id]) &&
              contest.company.id !== user.id
          ).length;
          setPendingContests(pendingCount);
        } else {
          setPendingContests(0);
        }
      });

      const unsubscribeNotifications = onValue(targetUserNotificationsRef, (snapshot) => {
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
        unsubscribeContests();
        unsubscribeNotifications();
      };
    }
  }, [user?.id, user?.sector]);

  const navItems = [
    { 
      to: "/empresas", 
      icon: <DomainIcon />, 
      label: "Empresas",
      onClick: (e) => {
        if (!handleNavigation("/empresas")) e.preventDefault();
      }
    },
    { 
      to: "/lojas", 
      icon: <StoreMallDirectoryIcon />, 
      label: "Lojas",
      onClick: (e) => {
        if (!handleNavigation("/lojas")) e.preventDefault();
      }
    },
    {
      to: user ? "/concursos" : "/auth",
      icon: (
        <Badge badgeContent={user ? pendingContests || 0 : 0} color="error" overlap="circular">
          <GavelIcon />
        </Badge>
      ),
      label: "Concursos",
      onClick: (e) => {
        if (user && !handleNavigation("/concursos")) e.preventDefault();
      }
    },
    {
      to: user ? "/cotacoes" : "/auth",
      icon: (
        <Badge badgeContent={user ? pendingQuotes || 0 : 0} color="error" overlap="circular">
          <DescriptionIcon />
        </Badge>
      ),
      label: "Cotações",
      onClick: (e) => {
        if (user && !handleNavigation("/cotacoes")) e.preventDefault();
      }
    },
    { 
      to: "/feed", 
      icon: <FeedIcon />, 
      label: "Feed",
      onClick: (e) => {
        if (!handleNavigation("/feed")) e.preventDefault();
      }
    },
    {
      to: user ? "/inbox" : "/auth",
      icon: (
        <Badge badgeContent={user ? pendingNotifications || 0 : 0} color="error" overlap="circular">
          <NotificationsIcon />
        </Badge>
      ),
      label: "Notificações",
      onClick: (e) => {
        if (user && !handleNavigation("/inbox")) e.preventDefault();
      }
    },
    {
      to: user ? "/conexoes" : "/auth",
      icon: (
        <Badge badgeContent={user ? pendingConnections || 0 : 0} color="error" overlap="circular">
          <PeopleIcon />
        </Badge>
      ),
      label: "Conexões",
      onClick: (e) => {
        if (user && !handleNavigation("/conexoes")) e.preventDefault();
      }
    },
    {
      to: user ? (isVerify ? "/app" : "#") : "/auth",
      icon: (
        <Avatar src={user?.logoUrl || ""} alt="Perfil" sx={{ width: 32, height: 32 }}>
          {!user?.logoUrl && <AccountCircleIcon />}
        </Avatar>
      ),
      label: "Perfil",
      onClick: (e) => {
        if (user && !isVerify) {
          e.preventDefault();
          setShowVerificationAlert(true);
        } else if (!user) {
          e.preventDefault();
          navigate("/auth");
        }
      }
    },
  ];

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const renderNavItems = () => (
    <Box display="flex" alignItems="center" gap={isMobile ? 1 : 3}>
      {navItems.map((item, index) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            to={item.to}
            key={index}
            title={item.label}
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textDecoration: "none",
              pointerEvents: item.to === "#" ? "none" : "auto",
              opacity: item.to === "#" ? 0.7 : 1
            }}
            onClick={item.onClick}>
            <IconButton
              sx={{
                color: isActive ? "#1976d2" : "#444",
                backgroundColor: isActive ? "#e3f2fd" : "transparent",
                "&:hover": {
                  color: item.to !== "#" ? "#1976d2" : "#444",
                  transform: item.to !== "#" ? "scale(1.1)" : "none",
                  transition: item.to !== "#" ? "transform 0.3s ease, color 0.3s" : "none",
                },
              }}>
              {item.icon}
            </IconButton>
            {!isMobile && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: isActive ? "#1976d2" : "#444",
                  opacity: item.to === "#" ? 0.7 : 1
                }}>
                {item.label}
              </Typography>
            )}
          </Link>
        );
      })}
      
      <Button
        variant="contained"
        color="success"
        startIcon={<DownloadIcon />}
        onClick={handleDownloadClick}
        sx={{
          ml: 1,
          backgroundColor: "#4caf50",
          "&:hover": {
            backgroundColor: "#388e3c",
          },
        }}
      >
        Baixar App
      </Button>

      <Menu
        anchorEl={downloadAnchorEl}
        open={Boolean(downloadAnchorEl)}
        onClose={handleDownloadClose}
      >
        <MenuItem 
          onClick={handleDownloadClose}
          component="a"
          href="https://firebasestorage.googleapis.com/v0/b/connectionmz.firebasestorage.app/o/apk%2Fconnectionmozambique.apk?alt=media&token=427059df-2af4-43e1-b9f8-99e882580a2e"
          target="_blank"
          rel="noopener noreferrer"
        >
          Versão Android (APK)
        </MenuItem>
      </Menu>
    </Box>
  );

  // Renderizar itens do menu mobile com lógica correta
  const renderMobileMenuItems = () => {
    return navItems.map((item, index) => {
      const isDisabled = item.to === "#";
      
      return (
        <ListItem
          button
          key={index}
          component={isDisabled ? "div" : Link}
          to={isDisabled ? undefined : item.to}
          onClick={(e) => {
            if (isDisabled) {
              e.preventDefault();
              setShowVerificationAlert(true);
              setDrawerOpen(false);
            } else {
              handleMobileNavigation(item.to, e);
            }
          }}
          sx={{
            opacity: isDisabled ? 0.7 : 1,
            pointerEvents: isDisabled ? "none" : "auto",
            backgroundColor: location.pathname === item.to ? "#e3f2fd" : "transparent",
            '&:hover': {
              backgroundColor: isDisabled ? "transparent" : "#f5f5f5",
            }
          }}
        >
          <ListItemIcon sx={{ color: isDisabled ? "#999" : "inherit" }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.label} 
            sx={{ color: isDisabled ? "#999" : "inherit" }} 
          />
        </ListItem>
      );
    });
  };

  return (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: "#FFF", boxShadow: 3 }}>
        <Toolbar sx={{ justifyContent: "space-between", paddingX: isMobile ? 2 : 4 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <img src={logo} alt="Logo" style={{ width: isMobile ? "100px" : "120px" }} />
              </Link>
            </Typography>
          </Box>
          
          {isMobile ? (
            <Box display="flex" alignItems="center">
              <IconButton 
                color="success" 
                onClick={handleDownloadClick}
                sx={{ mr: 1 }}
              >
                <DownloadIcon />
              </IconButton>
              
              <IconButton onClick={toggleDrawer(true)}>
                <MenuIcon />
              </IconButton>
              
              <Drawer 
                anchor="right" 
                open={drawerOpen} 
                onClose={toggleDrawer(false)}
                sx={{
                  '& .MuiDrawer-paper': {
                    width: 280,
                    boxSizing: 'border-box',
                  },
                }}
              >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Menu
                  </Typography>
                </Box>
                
                <List sx={{ pt: 0 }}>
                  {renderMobileMenuItems()}
                  
                  {/* Item de Download */}
                  <ListItem
                    button
                    onClick={() => {
                      handleDownloadClick();
                      setDrawerOpen(false);
                    }}
                  >
                    <ListItemIcon>
                      <DownloadIcon />
                    </ListItemIcon>
                    <ListItemText primary="Baixar App" />
                  </ListItem>
                  
                  {/* Painel Público */}
                  {publicPanel && (
                    <ListItem
                      button
                      onClick={() => handleMobileNavigation("/painel")}
                    >
                      <ListItemIcon>
                        <DomainIcon />
                      </ListItemIcon>
                      <ListItemText primary="Painel Público" />
                    </ListItem>
                  )}
                  
                  {/* Botão de Logout no Mobile */}
                  {user && (
                    <ListItem
                      button
                      onClick={() => {
                        handleLogout();
                        setDrawerOpen(false);
                      }}
                      sx={{
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: 'error.light',
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: 'error.main' }}>
                        <LogoutIcon />
                      </ListItemIcon>
                      <ListItemText primary="Sair" />
                    </ListItem>
                  )}
                  
                  {/* Informação de verificação */}
                  {user && !isVerify && (
                    <ListItem
                      sx={{
                        backgroundColor: 'warning.light',
                        m: 1,
                        borderRadius: 1,
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                        Conta não verificada
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'warning.dark' }}>
                        Acesso limitado a algumas funcionalidades
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </Drawer>
            </Box>
          ) : (
            <Box display="flex" alignItems="center" gap={2}>
              {renderNavItems()}
              {publicPanel && (
                <Button
                  onClick={() => navigate("/painel")}
                  sx={{
                    "&:hover": { backgroundColor: "#1565c0" },
                    padding: "6px 12px",
                    fontWeight: "bold",
                    minWidth: "40px",
                  }}
                >
                  Painel
                  <Dashboard />
                </Button>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

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
            sx={{ width: '100%', alignItems: 'center' }}
          >
            <Box>
              <Typography variant="body1" fontWeight="bold">
                Em processo de Verificação de conta
              </Typography>
              <Typography variant="body2">
                Os dados da sua empresa estão a ser verificados. Assim que o processo for concluído, o acesso será concedido.
                Você será notificado através do e-mail{' '}
                <Link href={`mailto:${user.email}`} style={{ color: '#1976d2' }}>{user.email}</Link>.
              </Typography>
              <Typography variant="body2">
                Para suporte use{' '}
                <a href="tel:+258866656104" style={{ color: '#1976d2' }}>+258 86 665 6104</a> ou pelo e-mail{' '}
                <a href="mailto:suporte@connectionmozambique.com" style={{ color: '#1976d2' }}>
                  suporte@connectionmozambique.com
                </a>.
              </Typography>
              
              {/* BOTÃO DE LOGOUT ALTERNATIVO */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{ mt: 1 }}
                >
                  Fazer Logout
                </Button>
              </Box>
            </Box>
          </Alert>
        </Snackbar>
      )}
      
      {user && !isVerify && !isMobile && (
        <Box 
          sx={{
            backgroundColor: 'warning.light',
            p: 1,
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'warning.dark' }}>
            Sua conta não está verificada. Acesso limitado a algumas funcionalidades.
          </Typography>
          
          {/* BOTÃO DE LOGOUT NA BARRA DE AVISO */}
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ 
              color: 'error.main',
              borderColor: 'error.main',
              '&:hover': {
                backgroundColor: 'error.light',
                borderColor: 'error.dark'
              }
            }}
          >
            Sair
          </Button>
        </Box>
      )}
    </>
  );
};

export default HeaderDesk;