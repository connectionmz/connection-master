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
import logo from "../../img/bg2.png";
import { db } from "../../fb";
import { Dashboard } from "@mui/icons-material";

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
    "/conexoes"
  ];

  const handleDownloadClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleNavigation = (path) => {
    if (!user) return true;
    
    if (!isVerify && protectedRoutes.includes(path)) {
      setShowVerificationAlert(true);
      return false;
    }
    return true;
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
            user.sector ===contest.setor &&
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
      to: user ? "/app" : "/auth",
      icon: (
        <Avatar src={user?.logoUrl || ""} alt="Perfil">
          {!user?.logoUrl && <AccountCircleIcon />}
        </Avatar>
      ),
      label: "Perfil"
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
            }}
            onClick={item.onClick}
          >
            <IconButton
              sx={{
                color: isActive ? "#1976d2" : "#444",
                backgroundColor: isActive ? "#e3f2fd" : "transparent",
                "&:hover": {
                  color: "#1976d2",
                  transform: "scale(1.1)",
                  transition: "transform 0.3s ease, color 0.3s",
                },
              }}
            >
              {item.icon}
            </IconButton>
            {!isMobile && (
              <Typography variant="caption" sx={{ color: isActive ? "#1976d2" : "#444" }}>
                {item.label}
              </Typography>
            )}
          </Link>
        );
      })}
      
      {/* Botão de Download APK */}
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
      {/*  <MenuItem 
          onClick={handleDownloadClose}
          component="a"
          href="https://apps.apple.com/app/id/SEU_ID_NA_APP_STORE"
          target="_blank"
          rel="noopener noreferrer"
        >
          Versão iOS (App Store)
        </MenuItem>*/}
      </Menu>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: "#FFF", boxShadow: 3 }}>
        <Toolbar sx={{ justifyContent: "space-between", paddingX: isMobile ? 2 : 4 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
              <Link to="/" className="flex items-center space-x-2">
                <img src={logo} alt="Logo" style={{ width: isMobile ? "30%" : "20%" }} />
              </Link>
            </Typography>
          </Box>
          
          {isMobile ? (
            <Box display="flex" alignItems="center">
              {/* Botão de Download APK para mobile */}
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
              
              <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
                <List>
                  {navItems.map((item, index) => (
                    <ListItem
                      button
                      key={index}
                      component={Link}
                      to={item.to}
                      onClick={(e) => {
                        if (item.onClick) item.onClick(e);
                        toggleDrawer(false)();
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItem>
                  ))}
                  
                  {/* Item de Download no menu mobile */}
                  <ListItem
                    button
                    onClick={handleDownloadClick}
                  >
                    <ListItemIcon>
                      <DownloadIcon />
                    </ListItemIcon>
                    <ListItemText primary="Baixar App" />
                  </ListItem>
                  
                  {publicPanel && (
                    <ListItem
                      button
                      component={Link}
                      to="/painel"
                      onClick={toggleDrawer(false)}
                    >
                      <ListItemIcon>
                        <DomainIcon />
                      </ListItemIcon>
                      <ListItemText primary="Painel Público" />
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
                <Link href={`mailto:${user.email}`}>{user.email}</Link>.
              </Typography>
              <Typography variant="body2">
                Para suporte use{' '}
                <a href="tel:+258866656104">+258 86 665 6104</a> ou pelo e-mail{' '}
                <a href="mailto:suporte@connectionmozambique.com">
                  suporte@connectionmozambique.com
                </a>.
              </Typography>
            </Box>
          </Alert>
        </Snackbar>
      )}
      
      {user && !isVerify && (
        <Box 
          sx={{
            backgroundColor: 'warning.light',
            p: 1,
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Sua conta não está verificada. Acesso limitado a algumas funcionalidades.
          </Typography>
        </Box>
      )}
    </>
  );
};

export default HeaderDesk;