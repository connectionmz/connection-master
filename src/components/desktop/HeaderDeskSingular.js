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

const HeaderDeskSingular = ({ user }) => {
  const [pendingConnections, setPendingConnections] = useState(0);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [pendingContests, setPendingContests] = useState(0);
  const [pendingNotifications, setPendingNotifications] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const publicPanel = user?.publicPainel;
  const isMobile = useMediaQuery("(max-width:600px)");
  const isVerify = user?.subscriptions?.isverify === "true";

  // URLs para download do APK
  const apkDownloadUrl = "https://firebasestorage.googleapis.com/v0/b/connectionmz.firebasestorage.app/o/apk%2Fconnectionmozambique.apk?alt=media&token=427059df-2af4-43e1-b9f8-99e882580a2e";
  const shortApkUrl = "https://bit.ly/connectionmz-apk";

  // Protected routes configuration
  const protectedRoutes = [
    "/empresas",
    "/lojas",
    "/feed",
    "/inbox",
  ];

  const handleDownloadClick = (event) => {
    if (isMobile) {
      // Em dispositivos móveis, abrir diálogo com instruções
      setDownloadDialogOpen(true);
    } else {
      // Em desktop, manter o menu original
      setDownloadAnchorEl(event.currentTarget);
    }
  };

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleDownloadDialogClose = () => {
    setDownloadDialogOpen(false);
  };

  const handleDirectDownload = () => {
    // Método mais confiável para download em mobile
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
      // Fallback para copiar link
      navigator.clipboard.writeText(shortApkUrl)
        .then(() => {
          alert('Link copiado para a área de transferência!');
        })
        .catch(() => {
          // Fallback mais básico
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

  useEffect(() => {
    if (user?.id) {
      const targetUserConnectionRef = ref(db, `connections/${user.id}/`);
      const targetUserQuotesRef = ref(db, `cotacoes/`);
      const targetUserContestsRef = ref(db, `contests/${user.id}/`);
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
            (contest) => contest.status === "pending"
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
      to: user ? "/meuperfil" : "/auth",
      icon: (
        <Avatar src={user?.logoUrl || ""} alt="Perfil" sx={{ width: 32, height: 32 }}>
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
      
      {/* Botão de Download para Desktop */}
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

      {/* Menu de Download para Desktop */}
      <Menu
        anchorEl={downloadAnchorEl}
        open={Boolean(downloadAnchorEl)}
        onClose={handleDownloadClose}
      >
        <MenuItem 
          onClick={handleDownloadClose}
          component="a"
          href={apkDownloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download="connectionmozambique.apk"
        >
          Versão Android (APK)
        </MenuItem>
        <MenuItem 
          onClick={handleDownloadClose}
          component="a"
          href={shortApkUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Link Alternativo
        </MenuItem>
      </Menu>
    </Box>
  );

  const renderMobileMenuItems = () => {
    return navItems.map((item, index) => (
      <ListItem
        button
        key={index}
        component={Link}
        to={item.to}
        onClick={(e) => {
          if (item.onClick) item.onClick(e);
          setDrawerOpen(false);
        }}
        sx={{
          backgroundColor: location.pathname === item.to ? "#e3f2fd" : "transparent",
        }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.label} />
      </ListItem>
    ));
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
              {/* Botão de Download no Mobile */}
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
                  
                  {/* Item de Download no Mobile */}
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
                      onClick={() => {
                        navigate("/painel");
                        setDrawerOpen(false);
                      }}
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
                    backgroundColor: "#1976d2",
                    color: "#fff",
                    "&:hover": { backgroundColor: "#1565c0" },
                    padding: "6px 12px",
                    fontWeight: "bold",
                  }}
                >
                  Ir para Painel Público
                </Button>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Diálogo de Download para Mobile */}
      <Dialog open={downloadDialogOpen} onClose={handleDownloadDialogClose}>
        <DialogTitle>Baixar App Connection Mozambique</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography variant="body1" gutterBottom>
              Para instalar o app no seu dispositivo Android:
            </Typography>
            <Box component="ol" sx={{ pl: 2, mt: 1 }}>
              <li>Clique em "Baixar Agora" para iniciar o download</li>
              <li>Após o download, toque no arquivo APK para instalar</li>
              <li>Permita a instalação de fontes desconhecidas se solicitado</li>
              <li>Siga as instruções de instalação</li>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
              Tamanho do arquivo: aproximadamente 15MB
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            onClick={handleDirectDownload}
            variant="contained" 
            color="success"
            startIcon={<DownloadIcon />}
            sx={{ m: 1 }}
          >
            Baixar Agora
          </Button>
          <Button 
            onClick={handleOpenInNewTab}
            variant="outlined"
            sx={{ m: 1 }}
          >
            Abrir em Nova Aba
          </Button>
          <Button 
            onClick={handleShareApp}
            variant="outlined"
            color="primary"
            sx={{ m: 1 }}
          >
            Compartilhar Link
          </Button>
          <Button 
            onClick={handleDownloadDialogClose}
            color="inherit"
            sx={{ m: 1 }}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

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
          }}
        >
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Sua conta não está verificada. Acesso limitado a algumas funcionalidades.
          </Typography>
          <Button 
            color="primary" 
            size="small" 
            sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}
            onClick={() => navigate("/app/verification")}
          >
            Completar verificação
          </Button>
        </Box>
      )}
    </>
  );
};

export default HeaderDeskSingular;