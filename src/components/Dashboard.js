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
  LocalHospital,
  Business,
  AttachMoney,
  School,
  Receipt,
  Security,
  MedicalServices,
  Gavel,
  BusinessCenterRounded,
  NewReleases,
  AppRegistration,
  PeopleAltTwoTone,
  FireExtinguisher,
  Fireplace,
} from "@mui/icons-material";
import MarqueeParceiros from "./MarqueeParceiros";
import MarqueeAnuncios from "./MarqueeAnuncios";
import { get, limitToFirst, onValue, orderByKey, query, ref } from "firebase/database";
import { Link } from "react-router-dom";
import { db } from "../fb";
import BannerDesk from "./desktop/BannerDesk";
import StorieListDesk from "./desktop/StorieListDesk";
import CategoriaList from "./desktop/CategoriasList";

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
              "&:hover": { backgroundColor: "#f5f5f5" },
            }}
          >
            <Box
              component={Link}
              to={`${linkBase}/${item.id}`}
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
              <ListItemText primary={item.title} sx={{ fontWeight: "bold" }} />
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
  const isMobile = useMediaQuery("(max-width:600px)");

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
            <MarqueeAnuncios user={user} />
            <Box>
              <BannerDesk user={user} />
            </Box>
          </Grid>

          {/* Sidebar Direita */}
          <Grid item xs={12} sm={3}>
 {/* Seção de Publicidade para PHC CS */}
<Paper
  sx={{
    padding: 2,
    marginBottom: 2,
    backgroundColor: "#FF5050", // Fundo claro e suave
    border: "1px solid #e0e0e0", // Borda sutil
    borderRadius: "8px",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)", // Sombra suave
  }}
>
  <Typography
    variant="h6"
    sx={{
      fontWeight: "bold",
      mb: 2,
      color: "#FFF", // Azul escuro (cor principal do PHC)
    }}
  >
    Software PHC CS
  </Typography>
  <img
    src="https://phcsoftware.com/mz/wp-content/uploads/sites/6/2024/03/phc_cs_1_banner.png"
    alt="PHC CS"
    style={{
      width: "100%",
      borderRadius: "8px",
      marginBottom: "16px",
      border: "1px solid #e0e0e0", // Borda sutil para a imagem
    }}
  />
  <Typography
    variant="body1"
    sx={{
      mb: 2,
      color: "#fff", // Cinza escuro para o texto
      lineHeight: "1.6",
    }}
  >
    Automatize processos, aumente a produtividade e tome decisões mais inteligentes.
  </Typography>
  <Button
    variant="contained"
    sx={{
      backgroundColor: "#FF5050", // Azul médio (cor secundária do PHC)
      color: "#ffffff", // Texto branco
      fontWeight: "bold",
      "&:hover": {
        backgroundColor: "#003366", // Azul escuro ao passar o mouse
      },
    }}
    fullWidth
    component={Link}
    to="/contato-phc-cs" // Substitua pela rota de contato ou aquisição
>
    Demonstração
  </Button>
</Paper>
            {/* Outros blocos de informação */}
            <InfoBlock title="Inquéritos" items={filteredInqueritos} linkBase="/inquerito" />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;