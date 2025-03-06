import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  Button,
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
import logo from "../../img/bg2.png";

const HeaderDeskPublic = () => {
  const [drawerOpen, setDrawerOpen] = useState(false); // Estado para controlar o drawer
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:600px)");

  const navItems = [
    { to: "/empresas", icon: <DomainIcon />, label: "Empresas" },
    { to: "/lojas", icon: <StoreMallDirectoryIcon />, label: "Lojas" },
    { to: "/concursos", icon: <GavelIcon />, label: "Concursos" },
    { to: "/cotacoes", icon: <DescriptionIcon />, label: "Cotações" },
    { to: "/feed", icon: <FeedIcon />, label: "Feed" },
    { to: "/inbox", icon: <NotificationsIcon />, label: "Notificações" },
    { to: "/conexoes", icon: <PeopleIcon />, label: "Conexões" },
    { to: "/login", icon: <AccountCircleIcon />, label: "Login" }, // Ponto de login
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
            <Button
              onClick={() => navigate("/login")} // Ponto de login
              sx={{
                backgroundColor: "#1976d2",
                color: "#fff",
                "&:hover": { backgroundColor: "#1565c0" },
                padding: "6px 12px",
                fontWeight: "bold",
              }}
            >
              Login
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default HeaderDeskPublic;