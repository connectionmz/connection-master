import React, { useState } from "react";
import {
  Search,
  Message,
  AccountCircle,
  BusinessCenter,
  Article,
  House,
  People,
  Store,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { logo } from "../../utils/utils";
import { AppBar, Box, IconButton, InputBase, Toolbar, Typography, useMediaQuery } from "@mui/material";

const HeaderDesk = () => {
  const [searchQuery, setSearchQuery] = useState(""); // Estado para a pesquisa
  const navigate = useNavigate(); // Hook de navegação

  const navItems = [
    { to: "/stores", icon: <Store fontSize="large" />, label: "Lojas" },
    { to: "/concursos", icon: <BusinessCenter fontSize="large" />, label: "Concursos" },
    { to: "/explore", icon: <People fontSize="large" />, label: "Empresas" },
    { to: "/cotacoes", icon: <Article fontSize="large" />, label: "Cotações" },
    { to: "/inbox", icon: <Message fontSize="large" />, label: "Mensagens" },
    { to: "/app", icon: <AccountCircle fontSize="large" />, label: "Perfil do Usuário" },
  ];

  // Função para redirecionar com base na pesquisa
  const handleSearch = () => {
    if (searchQuery.trim() === "") return;

    // Lógica simples para determinar para onde redirecionar
    if (searchQuery.toLowerCase().includes("empresa")) {
      navigate("/explore"); // Redireciona para a página de Empresas
    } else if (searchQuery.toLowerCase().includes("cotação")) {
      navigate("/cotacoes"); // Redireciona para a página de Cotações
    } else if (searchQuery.toLowerCase().includes("concurso")) {
      navigate("/concursos"); // Redireciona para a página de Concursos
    } else {
      navigate("/stores"); // Redireciona para a página de Lojas, caso não encontre correspondência
    }
  };

  const isMobile = useMediaQuery("(max-width:600px)"); // Detecta dispositivos móveis

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#fff", boxShadow: 3 }}>
      <Toolbar sx={{ justifyContent: "space-between", paddingX: isMobile ? 2 : 4 }}>
        {/* Logo e Pesquisa */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
            <Link to="/" className="flex items-center space-x-2">
              <img src={logo} alt="Logo" style={{ width: "20%" }} />
            </Link>
          </Typography>

          {/* Caixa de pesquisa */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#f5f5f5",
              borderRadius: 2,
              padding: "0 12px",
              width: isMobile ? "200px" : "300px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <Search sx={{ color: "#888" }} />
            <InputBase
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // Atualiza a pesquisa enquanto digita
              placeholder="Pesquisar"
              sx={{
                ml: 1,
                fontSize: "14px",
                color: "#333",
              }}
            />
            {/* Botão de pesquisa */}
            <IconButton onClick={handleSearch} sx={{ color: "#888", padding: 0 }}>
              <Search />
            </IconButton>
          </Box>
        </Box>

        {/* Menu de Navegação */}
        <Box display="flex" alignItems="center" gap={3}>
          {navItems.map((item, index) => (
            <Link to={item.to} key={index} title={item.label}>
              <IconButton
                sx={{
                  color: "#444",
                  '&:hover': {
                    color: "#1976d2", // Cor de hover mais vibrante
                    transform: "scale(1.1)",
                    transition: "transform 0.3s ease, color 0.3s",
                  },
                }}
              >
                {item.icon}
              </IconButton>
            </Link>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderDesk;
