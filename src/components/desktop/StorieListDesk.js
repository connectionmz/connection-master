import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../../fb";
import { useNavigate } from "react-router-dom";
import { Add } from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";

const StorieListDesk = ({ user }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Detecta se a tela é pequena

  const defaultLogoUrl = "https://via.placeholder.com/150";

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesRef = ref(db, "company");
        const snapshot = await get(companiesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const companyList = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            .filter(
              (company) =>
                (company.provincia === user.provinciaTemp ||
                  company.provincia === user.provinciaTemp) &&
                company.id !== user.id
            );
          const randomCompanies = companyList
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);
          setStories(randomCompanies);
        }
      } catch (error) {
        setError("Erro ao carregar empresas: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, [user]);

  const handleCompanyClick = (companyId) => {
    navigate(`/perfil/${companyId}`);
  };

  const handleExploreClick = () => {
    navigate("/empresas");
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="200px"
        color="error.main"
      >
        <Typography variant="body2">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: isMobile ? 1 : 3, // Reduz o espaçamento em dispositivos móveis
        p: isMobile ? 1 : 2, // Reduz o padding em dispositivos móveis
        overflowX: "auto",
      }}
    >
      {stories.map((store) => (
        <Card
          key={store.id}
          sx={{
            width: isMobile ? 120 : 160, // Reduz a largura em dispositivos móveis
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
            boxShadow: 1,
            p: isMobile ? 1 : 2, // Reduz o padding em dispositivos móveis
            textAlign: "center",
          }}
        >
          <CardActionArea onClick={() => handleCompanyClick(store.id)}>
            <Avatar
              src={store.logoUrl || defaultLogoUrl}
              alt={`Logotipo de ${store.nome}`}
              sx={{
                width: isMobile ? 48 : 64, // Reduz o tamanho do avatar em dispositivos móveis
                height: isMobile ? 48 : 64,
                mb: 1,
                margin: "0 auto",
              }}
            />
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textTransform: "capitalize",
                  fontSize: isMobile ? 12 : 14, // Reduz o tamanho da fonte em dispositivos móveis
                }}
              >
                {store.sigla || store.nome}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: isMobile ? 10 : 12, // Reduz o tamanho da fonte em dispositivos móveis
                }}
              >
                {store.sector || "Setor não especificado"}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
      <Card
        sx={{
          width: isMobile ? 120 : 160, // Reduz a largura em dispositivos móveis
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          boxShadow: 1,
          p: isMobile ? 1 : 2, // Reduz o padding em dispositivos móveis
          textAlign: "center",
          cursor: "pointer",
        }}
        onClick={handleExploreClick}
      >
        <CardActionArea
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <Avatar
            sx={{
              width: isMobile ? 48 : 64, // Reduz o tamanho do avatar em dispositivos móveis
              height: isMobile ? 48 : 64,
              bgcolor: "grey.200",
              mb: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Add sx={{ fontSize: isMobile ? 24 : 32, color: "text.secondary" }} />
          </Avatar>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textTransform: "uppercase",
              fontWeight: 500,
              fontSize: isMobile ? 12 : 14, // Reduz o tamanho da fonte em dispositivos móveis
            }}
          >
            Ver mais
          </Typography>
        </CardActionArea>
      </Card>
    </Box>
  );
};

export default StorieListDesk;