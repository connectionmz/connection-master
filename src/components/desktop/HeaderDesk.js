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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StoreMallDirectoryIcon from "@mui/icons-material/StoreMallDirectory";
import GavelIcon from "@mui/icons-material/Gavel";
import DomainIcon from "@mui/icons-material/Domain";
import DescriptionIcon from "@mui/icons-material/Description";
import ChatIcon from "@mui/icons-material/Chat";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import FeedIcon from "@mui/icons-material/Feed";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsIcon from "@mui/icons-material/Notifications"; // Novo ícone para notificações
import { logo } from "../../utils/utils";
import { db } from "../../fb";

const HeaderDesk = ({ user }) => {
  const [pendingConnections, setPendingConnections] = useState(0);
  const [pendingQuotes, setPendingQuotes] = useState(0);
  const [pendingContests, setPendingContests] = useState(0);
  const [pendingNotifications, setPendingNotifications] = useState(0); // Estado para notificações

  const navigate = useNavigate();
  const location = useLocation();
  const publicPanel = user?.publicPainel;
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    if (user?.id) {
      const targetUserConnectionRef = ref(db, `connections/${user.id}/`);
      const targetUserQuotesRef = ref(db, `cotacoes/`);
      const targetUserContestsRef = ref(db, `contests/${user.id}/`);
      const targetUserNotificationsRef = ref(db, `notifications/${user.id}/`); // Referência para notificações

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
        unsubscribeNotifications(); // Limpar o listener de notificações
      };
    }
  }, [user?.id, user?.sector]);

  const navItems = [
    { to: "/empresas", icon: <DomainIcon fontSize="large" />, label: "Empresas" },
    { to: "/lojas", icon: <StoreMallDirectoryIcon fontSize="large" />, label: "Lojas" },
    {
      to: "/concursos",
      icon: (
        <Badge badgeContent={pendingContests || 0} color="error" overlap="circular">
          <GavelIcon fontSize="large" />
        </Badge>
      ),
      label: "Concursos",
    },
    {
      to: "/cotacoes",
      icon: (
        <Badge badgeContent={pendingQuotes || 0} color="error" overlap="circular">
          <DescriptionIcon fontSize="large" />
        </Badge>
      ),
      label: "Cotações",
    },
    { to: "/feed", icon: <FeedIcon fontSize="large" />, label: "Feed" },
    {
      to: "/inbox",
      icon: (
        <Badge badgeContent={pendingNotifications || 0} color="error" overlap="circular">
          <NotificationsIcon fontSize="large" /> {/* Ícone de notificações */}
        </Badge>
      ),
      label: "Notificações",
    },
    {
      to: "/conexoes",
      icon: (
        <Badge badgeContent={pendingConnections || 0} color="error" overlap="circular">
          <PeopleIcon fontSize="large" />
        </Badge>
      ),
      label: "Conexões",
    },
    {
      to: "/app",
      icon: (
        <Avatar src={user.logoUrl || ""} alt="Perfil">
          {!user.logoUrl && <AccountCircleIcon fontSize="large" />}
        </Avatar>
      ),
      label: "Perfil",
    },
  ];

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#f1f1f1", boxShadow: 3 }}>
      <Toolbar sx={{ justifyContent: "space-between", paddingX: isMobile ? 2 : 4 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
            <Link to="/" className="flex items-center space-x-2">
              <img src={logo} alt="Logo" style={{ width: "20%" }} />
            </Link>
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={3}>
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.to;
            return (
              <Link to={item.to} key={index} title={item.label} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                <Typography variant="caption" sx={{ color: isActive ? "#1976d2" : "#444" }}>
                  {item.label}
                </Typography>
              </Link>
            );
          })}
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
      </Toolbar>
    </AppBar>
  );
};

export default HeaderDesk;