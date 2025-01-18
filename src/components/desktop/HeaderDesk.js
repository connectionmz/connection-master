import React, { useState } from "react";
import {
  Search,
  Message,
  AccountCircle,
  BusinessCenter,
  Article,
  People,
  Store,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  IconButton,
  InputBase,
  Toolbar,
  Typography,
  useMediaQuery,
  Button,
} from "@mui/material";
import { logo } from "../../utils/utils";

const HeaderDesk = ({ user }) => {
  const navigate = useNavigate(); 
  const publicPanel = user?.publicPainel; 
  const [searchTerm, setSearchTerm] = useState(""); 
  const isMobile = useMediaQuery("(max-width:600px)"); 

  const navItems = [
    { to: "/search", icon: <Search fontSize="large" />, label: "Pesquisar" },
    { to: "/stores", icon: <Store fontSize="large" />, label: "Lojas" },
    { to: "/concursos", icon: <BusinessCenter fontSize="large" />, label: "Concursos" },
    { to: "/explore", icon: <People fontSize="large" />, label: "Empresas" },
    { to: "/cotacoes", icon: <Article fontSize="large" />, label: "Cotações" },
    { to: "/inbox", icon: <Message fontSize="large" />, label: "Mensagens" },
    { to: "/app", icon: <AccountCircle fontSize="large" />, label: "Perfil do Usuário" },
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
          {navItems.map((item, index) => (
            <Link to={item.to} key={index} title={item.label}>
              <IconButton
                sx={{
                  color: "#444",
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
          ))}

          {publicPanel && (
            <Button
              onClick={() => navigate("/painel")}
              sx={{
                backgroundColor: "#1976d2",
                color: "#fff",
                "&:hover": { backgroundColor: "#1565c0" },
                padding: "6px 12px",
                fontWeight: "bold",
              }}>
              Ir para Painel Público
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderDesk;
