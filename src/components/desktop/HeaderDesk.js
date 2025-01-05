import React from "react";
import {
  Search,
  Message,
  AccountCircle,
  BusinessCenter,
  Article,
  House,
  People,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { logo } from "../../utils/utils";
import { AppBar, Box, IconButton, InputBase, Toolbar, Typography } from "@mui/material";

const HeaderDesk = () => {
  const navItems = [
    { to: "/concursos", icon: <BusinessCenter />, label: "Concursos" }, // Ícone de "Negócios" representa concursos empresariais.
    { to: "/explore", icon: <People />, label: "Empresas" }, // Ícone de "Pessoas" representa empresas ou organizações.
    { to: "/cotacoes", icon: <Article />, label: "Cotações" }, // Ícone de "Artigo" representa a listagem de cotações.
    { to: "/inbox", icon: <Message />, label: "Mensagens" }, // Ícone de "Mensagens" para a caixa de entrada.
    { to: "/app", icon: <AccountCircle />, label: "Perfil do Usuário" }, // Ícone de "Perfil" para a conta do usuário.
  ];
  

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#F1F1F1" }}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Logo e Barra de Pesquisa */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            <Link to="/" className="flex items-center space-x-2">
              <img src={logo} alt="Logo" style={{ width: "20%" }} />
            </Link>
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: 1,
              padding: "0 10px",
              width: 300,
            }}
          >
            <Search sx={{ color: "gray" }} />
            <InputBase placeholder="Pesquisar" sx={{ ml: 1 }} />
          </Box>
        </Box>

        {/* Ícones de Navegação */}
        <Box display="flex" alignItems="center" gap={3}>
          {navItems.map((item, index) => (
            <Link to={item.to} key={index} title={item.label}>
              <IconButton sx={{ color: "black" }}>{item.icon}</IconButton>
            </Link>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderDesk;
