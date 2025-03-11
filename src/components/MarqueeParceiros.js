import React, { useEffect, useState } from "react";
import { db } from "../fb";
import { ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { Avatar, Box, Button, Typography } from "@mui/material";

const MarqueeParceiros = () => {
  const [parceiros, setParceiros] = useState([]);
  const navigate = useNavigate();

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
    navigate(`/vperfil/${companyId}`);
  };

  return (
    <Box
      display="flex"
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
        sx={{ mr: 2 }}
      >
        Parceiros / Investidores
      </Button>

      {/* Marquee de Parceiros */}
      <Box
        flexGrow={1}
        sx={{
          display: "flex",
          overflow: "hidden",
          whiteSpace: "nowrap",
          animation: "marquee 20s linear infinite",
        }}
      >
        {parceiros.map((parceiro, index) => (
          <Box
            key={index}
            display="flex"
            alignItems="center"
            sx={{ mx: 3, cursor: "pointer" }}
            onClick={() => handleCompanyClick(parceiro.companyId)}
          >
            <Avatar
              src={parceiro.logo}
              alt={parceiro.nome || "Logo da Empresa"}
              sx={{ width: 40, height: 40, mr: 1 }}
            />
            <Typography fontWeight="bold">
              {parceiro.nome || "Empresa Desconhecida"}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default MarqueeParceiros;
