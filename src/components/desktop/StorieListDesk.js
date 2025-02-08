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
} from "@mui/material";

const StorieListDesk = ({ user }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
            .filter((company) =>
              (company.provincia === user.provincia || company.provincia === user.provinciaTemp) &&
              company.id !== user.id
            );
            
          const randomCompanies = companyList.sort(() => Math.random() - 0.5).slice(0, 5);
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
    navigate("/explore");
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
      <Box display="flex" justifyContent="center" alignItems="center" height="200px" color="error.main">
        <Typography variant="body2">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 3,
        p: 2,
        overflowX: "auto",
      }}
    >
      {stories.map((store) => (
       <Card
       key={store.id}
       sx={{
         width: 160,
         display: "flex",
         flexDirection: "column",
         alignItems: "center",
         justifyContent: "center", // Centraliza verticalmente
         borderRadius: 2,
         boxShadow: 1,
         p: 2,
         textAlign: "center",
       }}
     >
       <CardActionArea onClick={() => handleCompanyClick(store.id)}>
         <Avatar
           src={store.logoUrl || defaultLogoUrl}
           alt={`Logotipo de ${store.nome}`}
           sx={{
             width: 64,
             height: 64,
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
               fontSize: 12,
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
          width: 160,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 2,
          boxShadow: 1,
          p: 2,
          textAlign: "center"}}
        onClick={handleExploreClick}
      >
        <CardActionArea>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: "gray.200",
              mb: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Add sx={{ fontSize: 32, color: "text.secondary" }} />
          </Avatar>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textTransform: "uppercase",
              fontWeight: 500,
              fontSize: 14,
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
