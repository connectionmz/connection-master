import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Container,
  Grid,
  Snackbar,
  Alert,
  useMediaQuery,
  Typography,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { get, limitToFirst, onValue, orderByKey, query, ref, set } from "firebase/database";
import { db } from "../fb";
import MarqueeParceiros from "./MarqueeParceiros";
import MarqueeAnuncios from "./MarqueeAnuncios";
import BannerDesk from "./desktop/BannerDesk";
import StorieListDesk from "./desktop/StorieListDesk";
import CategoriaList from "./desktop/CategoriasList";
import InqueritosList from "./desktop/InqueritosList";
import LatestBlogPost from "./desktop/LatestBlogPost";
import { LocationCity } from "@mui/icons-material";

const Dashboard = ({ user }) => {
  const [hasRespondedIds, setHasRespondedIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [campanhasAtivas, setCampanhasAtivas] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [hasRequestedDemo, setHasRequestedDemo] = useState(false); 
  const [latestBlog, setLatestBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width:600px)");


const navigate = useNavigate();



  useEffect(() => {
    const fetchCampanhasAtivas = async () => {
      try {
        const campanhasRef = ref(db, "campanhas");
        onValue(campanhasRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const campanhasArray = [];
            Object.keys(data).forEach((campanhaKey) => {
              const campanhasInternas = data[campanhaKey];
              Object.keys(campanhasInternas).forEach((subKey) => {
                const campanha = campanhasInternas[subKey];
                if (campanha.component === "home") {
                  if (!user || (user.provinciaTemp || user.provincia) === campanha.company?.provincia) {
                    campanhasArray.push({ id: subKey, ...campanha });
                  } else if (!user) {
                    campanhasArray.push({ id: subKey, ...campanha });
                  }
                }
              });
            });
            setCampanhasAtivas(campanhasArray);
          }
        });
      } catch (error) {
        console.error("Erro ao carregar campanhas ativas:", error);
        setError("Erro ao carregar campanhas");
      }
    };
  
    const fetchRespondedInqueritos = async () => {
      try {
        const responsesRef = ref(db, "survey_responses/");
        const snapshot = await get(responsesRef);
        if (snapshot.exists()) {
          const respondedIds = Object.keys(snapshot.val());
          setHasRespondedIds(new Set(respondedIds));
        }
      } catch (error) {
        console.error("Erro ao carregar inquéritos respondidos:", error);
      }
    };
  
    fetchCampanhasAtivas();
    fetchRespondedInqueritos();
  }, [user]);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box>
      <Container>
<Box 
  sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 2,
    p: 2,
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #1976d2',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  }}
>
  <LocationCity sx={{ color: '#1976d2' }} />
  <Typography 
    variant="subtitle1"
    sx={{ 
      fontWeight: 700, 
      color: '#1976d2',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      '& span': {
        color: '#333',
        fontWeight: 600,
        textTransform: 'none',
        ml: 1
      }
    }}
  >
    Exibindo conteúdo de: 
    <span>
      {user?.provinciaTemp || user?.provincia}
    </span>
  </Typography>
</Box>    
<MarqueeParceiros />
        <CategoriaList />
        <StorieListDesk user={user} />
        <Grid container spacing={2}>
        <LatestBlogPost/>
          <Grid item xs={12} sm={6}>
            <MarqueeAnuncios user={user} />
            <Box>
              <BannerDesk user={user} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
  <InqueritosList 
  user={user} />
        </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarMessage.includes("Erro") ? "error" : "success"}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default Dashboard;