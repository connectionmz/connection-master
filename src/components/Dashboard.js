import React, { useEffect, useState, useMemo } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Grid,
  Paper,
  Button,
  List,
  ListItemText,
  Divider,
  CircularProgress,
  ListItemIcon,
  ListItem,
  useMediaQuery,
} from "@mui/material";
import {
  LocalHospital, Business, AttachMoney, School, Receipt, Security, 
  MedicalServices, Gavel,
  BusinessCenterRounded,
  NewReleases,
  AppRegistration,
  PeopleAltTwoTone,
  FireExtinguisher,
  Fireplace
} from "@mui/icons-material";
import MarqueeParceiros from "./MarqueeParceiros";
import MarqueeAnuncios from "./MarqueeAnuncios";
import { get, limitToFirst, onValue, orderByKey, query, ref } from "firebase/database";
import { Link } from "react-router-dom";
import { db } from "../fb";
import BannerDesk from "./desktop/BannerDesk";
import StorieListDesk from "./desktop/StorieListDesk";
import CategoriaList from "./desktop/CategoriasList"; // Componente importado

const InfoBlock = ({ title, items, linkBase, isCategory = false }) => (
  <Paper sx={{ padding: 2, marginBottom: 2 }}>
    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
      {title}
    </Typography>
    <List>
      {items.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          Nenhum item disponível no momento.
        </Typography>
      ) : (
        items.map((item) => (
          <ListItem
            key={item.id}
            sx={{
              marginBottom: "8px",
              borderRadius: "8px",
              transition: "all 0.3s ease-in-out",
              "&:hover": { backgroundColor: "#f5f5f5" }, // Efeito hover no item inteiro
            }}
          >
          <Box
              component={Link} // Usa Box para permitir sx
              to={`${linkBase}/${isCategory ? item.name : item.id}`}
              sx={{
                textDecoration: "none",
                color: "black",
                display: "flex",
                alignItems: "center",
                width: "100%",
                transition: "transform 0.3s ease, color 0.3s",
                "&:hover": {
                  color: "#1976d2",
                  transform: "scale(1.1)",
                },
              }}
            >
              <ListItemIcon>{/* Ícone removido */}</ListItemIcon>
              <ListItemText primary={item.name} sx={{ fontWeight: "bold" }} />
            </Box>
          </ListItem>
        ))
      )}
    </List>
    <Divider sx={{ my: 2 }} />
  </Paper>
);

const useFirebaseData = (path, limit = 10) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const dataRef = query(ref(db, path), orderByKey(), limitToFirst(limit));
    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        const rawData = snapshot.val();

        if (rawData) {
          const formattedData = Object.keys(rawData).map((key) => ({
            id: key,
            ...rawData[key],
          }));
          setData(formattedData);
        }
        setLoading(false);
      },
      (error) => {
        setError("Erro ao carregar os dados");
        console.error("Erro ao carregar os dados:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path, limit]);

  return { data, loading, error };
};

const Dashboard = ({ user }) => {
  const [anuncios, setAnuncios] = useState([]);
  const [hasRespondedIds, setHasRespondedIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [campanhasAtivas, setCampanhasAtivas] = useState([]);
  const [blogs, setBlogs] = useState([]); 
  const isMobile = useMediaQuery('(max-width:600px)');

  const { data: inqueritos, loading: inqueritosLoading, error: inqueritosError } = useFirebaseData("surveys");

  // Buscar blogs
  useEffect(() => {
    const blogsRef = ref(db, "blogPost");
    onValue(blogsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const blogsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setBlogs(blogsArray);
        console.log(blogsArray)
      }
    });
  }, []);

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
    
                if (
                  campanha.component === "home" &&
                  (user.provinciaTemp || user.provincia) === campanha.company?.provincia
                ) {
                  campanhasArray.push({ id: subKey, ...campanha });
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
  }, []);


  const filteredInqueritos = useMemo(() => {
    return inqueritos.filter((inquerito) => !hasRespondedIds.has(inquerito.id));
  }, [inqueritos, hasRespondedIds]);

  if (inqueritosLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || inqueritosError) {
    return (
      <Typography color="error" align="center">
        {error || inqueritosError}
      </Typography>
    );
  }

  return (
    <Box>
      <Container sx={{ marginTop: 10 }}>
        <CategoriaList /> {/* Componente importado */}
        <MarqueeParceiros />
        <StorieListDesk user={user} />
        <Grid container spacing={2}>
          {/* Sidebar Esquerda */}
          <Grid item xs={12} sm={3}>
            <Paper sx={{ padding: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Destacado
              </Typography>
              {blogs.length > 0 ? (
                <Box>
                  <Link to={`/blog/${blogs[0].id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <img 
                      src={blogs[0].imageURL} 
                      alt={blogs[0].title}
                      style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px" }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 1 }}>
                      {blogs[0].title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {blogs[0].content.substring(0, 100)}...
                    </Typography>
                  </Link>
                  <Button
                    component={Link}
                    to="/blog"
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Ver todos os blogs
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Nenhum blog disponível no momento.
                </Typography>
              )}
            </Paper>
          </Grid>
          {/* Feed Central */}
          <Grid item xs={12} sm={6}>
            <MarqueeAnuncios user={user}/>
            <Box>
              <BannerDesk user={user}/>
            </Box>
          </Grid>

          {/* Sidebar Direita */}
          <Grid item xs={12} sm={3}>
            <InfoBlock title="Inquéritos" items={filteredInqueritos} linkBase="/inquerito" />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;