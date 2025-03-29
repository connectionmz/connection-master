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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu"; // Ícone do menu hambúrguer
import SearchIcon from "@mui/icons-material/Search";
import StoreMallDirectoryIcon from "@mui/icons-material/StoreMallDirectory";
import GavelIcon from "@mui/icons-material/Gavel";
import DomainIcon from "@mui/icons-material/Domain";
import DescriptionIcon from "@mui/icons-material/Description";
import FeedIcon from "@mui/icons-material/Feed";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import logo  from "../../img/bg2.png";
import { db } from "../../fb";

const HeaderDesk = ({ user }) => {
  const [pendingConnections, setPendingConnections] = useState(0);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [pendingContests, setPendingContests] = useState(0);
  const [pendingNotifications, setPendingNotifications] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false); // Estado para controlar o drawer

  const navigate = useNavigate();
  const location = useLocation();
  const publicPanel = user?.publicPainel;
  const isMobile = useMediaQuery("(max-width:600px)");

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
    { to: "/empresas", icon: <DomainIcon />, label: "Empresas" },
    { to: "/lojas", icon: <StoreMallDirectoryIcon />, label: "Lojas" },
    {
      to: user ? "/concursos" : "/auth",
      icon: (
        <Badge badgeContent={user ? pendingContests || 0 : 0} color="error" overlap="circular">
          <GavelIcon />
        </Badge>
      ),
      label: "Concursos",
    },
    {
      to: user ? "/cotacoes" : "/auth",
      icon: (
        <Badge badgeContent={user ? pendingQuotes || 0 : 0} color="error" overlap="circular">
          <DescriptionIcon />
        </Badge>
      ),
      label: "Cotações",
    },
    { to: "/feed", icon: <FeedIcon />, label: "Feed" },
    {
      to: user ? "/inbox" : "/auth",
      icon: (
        <Badge badgeContent={user ? pendingNotifications || 0 : 0} color="error" overlap="circular">
          <NotificationsIcon />
        </Badge>
      ),
      label: "Notificações",
    },
    {
      to: user ? "/conexoes" : "/auth",
      icon: (
        <Badge badgeContent={user ? pendingConnections || 0 : 0} color="error" overlap="circular">
          <PeopleIcon />
        </Badge>
      ),
      label: "Conexões",
    },
    {
      to: user ? "/app" : "/auth",
      icon: (
        <Avatar src={user?.logoUrl || ""} alt="Perfil">
          {!user?.logoUrl && <AccountCircleIcon />}
        </Avatar>
      ),
      label: "Perfil",
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
    </Box>
  );

  return (
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
          <>
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
                    onClick={toggleDrawer(false)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItem>
                ))}
              </List>
            </Drawer>
          </>
        ) : (
          <>
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
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default HeaderDesk;