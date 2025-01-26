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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StoreMallDirectoryIcon from "@mui/icons-material/StoreMallDirectory";
import GavelIcon from "@mui/icons-material/Gavel";
import DomainIcon from "@mui/icons-material/Domain";
import DescriptionIcon from "@mui/icons-material/Description";
import ChatIcon from "@mui/icons-material/Chat";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import FeedIcon from "@mui/icons-material/Feed";
import { People } from "@mui/icons-material";
import { logo } from "../../utils/utils";
import { db } from "../../fb";

const HeaderDesk = ({ user }) => {
  const [pendingConnections, setPendingConnections] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const publicPanel = user?.publicPainel;
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    if (user?.id) {
      const targetUserConnectionRef = ref(db, `connections/${user.id}/`);
      const unsubscribe = onValue(targetUserConnectionRef, (snapshot) => {
        if (snapshot.exists()) {
          const pendingCount = Object.values(snapshot.val()).filter(
            (connection) => connection.status === "pending"
          ).length;
          setPendingConnections(pendingCount);
        } else {
          setPendingConnections(0);
        }
      });

      return () => unsubscribe(); // Cleanup
    }
  }, [user?.id]);

  const navItems = [
    { to: "/search", icon: <SearchIcon fontSize="large" />, label: "Pesquisar" },
    { to: "/stores", icon: <StoreMallDirectoryIcon fontSize="large" />, label: "Lojas" },
    { to: "/feed", icon: <FeedIcon fontSize="large" />, label: "Feed" },
    { to: "/concursos", icon: <GavelIcon fontSize="large" />, label: "Concursos" },
    { to: "/explore", icon: <DomainIcon fontSize="large" />, label: "Empresas" },
    { to: "/cotacoes", icon: <DescriptionIcon fontSize="large" />, label: "Cotações" },
    { to: "/inbox", icon: <ChatIcon fontSize="large" />, label: "Mensagens" },
    {
      to: "/conexoes",
      icon: (
        <Badge
          badgeContent={pendingConnections || 0}
          color="error"
          overlap="circular"
        >
          <People fontSize="large" />
        </Badge>
      ),
      label: "Conexões",
    },
    { to: "/app", icon: <AccountCircleIcon fontSize="large" />, label: "Perfil do Usuário" },
  ];

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#fff", boxShadow: 3 }}>
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
              <Link to={item.to} key={index} title={item.label}>
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
