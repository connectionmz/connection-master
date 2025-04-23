import React, { useEffect, useState } from "react";
import { db } from "../fb";
import { ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { Avatar, Box, Button, Typography, useTheme, useMediaQuery } from "@mui/material";
import { keyframes } from "@emotion/react";

// Animação do marquee
const marquee = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

const MarqueeParceiros = () => {
  const [parceiros, setParceiros] = useState([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  useEffect(() => {
    const fetchParceiros = async () => {
      try {
        const snapshot = await get(ref(db, "parceiros"));
        if (snapshot.exists()) {
          setParceiros(Object.values(snapshot.val()));
        }
      } catch (error) {
        console.error("Erro ao buscar parceiros:", error);
      }
    };

    fetchParceiros();
  }, []);

  const handleNavigateToTabs = () => {
    navigate("/parceiros-investidores");
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/perfil/${companyId}`);
  };

  // Duplica os parceiros para criar um efeito de loop contínuo
  const duplicatedParceiros = [...parceiros, ...parceiros];

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", sm: "row" }}
      alignItems="center"
      bgcolor="white"
      p={2}
      mb={3}
      borderRadius={2}
      boxShadow={1}
    >
      {/* Botão para Parceiros / Investidores */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleNavigateToTabs}
        sx={{ 
          mr: { sm: 2 },
          mb: { xs: 2, sm: 0 },
          width: { xs: "100%", sm: "auto" },
          fontSize: { xs: "0.875rem", sm: "1rem" }
        }}
      >
        {isMobile ? "Parceiros" : "Parceiros / Investidores"}
      </Button>

      {/* Marquee de Parceiros */}
      <Box
        flexGrow={1}
        sx={{
          display: "flex",
          overflow: "hidden",
          position: "relative",
          height: "60px",
          width: { xs: "100%", sm: "auto" }
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            animation: `${marquee} ${isMobile ? 30 : 20}s linear infinite`,
            "&:hover": {
              animationPlayState: "paused"
            }
          }}
        >
          {duplicatedParceiros.map((parceiro, index) => (
            <Box
              key={`${parceiro.companyId}-${index}`}
              display="flex"
              alignItems="center"
              sx={{ 
                mx: isMobile ? 2 : 3,
                cursor: "pointer",
                minWidth: "max-content" // Evita que os itens quebrem
              }}
              onClick={() => handleCompanyClick(parceiro.companyId)}
            >
              <Avatar
                src={parceiro.logo}
                alt={parceiro.nome || "Logo da Empresa"}
                sx={{ 
                  width: isMobile ? 32 : 40, 
                  height: isMobile ? 32 : 40, 
                  mr: 1 
                }}
              />
              <Typography 
                fontWeight="bold"
                fontSize={{ xs: "0.875rem", sm: "1rem" }}
              >
                {parceiro.nome || "Empresa Desconhecida"}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default MarqueeParceiros;