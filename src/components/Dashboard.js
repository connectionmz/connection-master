import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  useMediaQuery,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { Link } from "react-router-dom";
import { get, limitToFirst, onValue, orderByKey, query, ref, set } from "firebase/database";
import { db } from "../fb";
import MarqueeParceiros from "./MarqueeParceiros";
import MarqueeAnuncios from "./MarqueeAnuncios";
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
  const [hasRespondedIds, setHasRespondedIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [campanhasAtivas, setCampanhasAtivas] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [hasRequestedDemo, setHasRequestedDemo] = useState(false); 
  const isMobile = useMediaQuery("(max-width:600px)");

  const { data: inqueritos, loading: inqueritosLoading, error: inqueritosError } = useFirebaseData("surveys");

  useEffect(() => {
    const blogsRef = ref(db, "blogPost");
    onValue(
      blogsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const blogsArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
  
          // Ordenar blogs pela data e hora combinadas
          blogsArray.sort((a, b) => {
            // Combina `date` e `time` para criar um timestamp
            const dateTimeA = `${a.date} ${a.time}`;
            const dateTimeB = `${b.date} ${b.time}`;
  
            // Converte para objetos Date e compara
            return new Date(dateTimeB) - new Date(dateTimeA);
          });
          setBlogs(blogsArray);
        }
      },
      (error) => {
        setError("Erro ao carregar os blogs.");
        console.error("Erro ao carregar blogs:", error);
      }
    );
  }, []);

  // Verificar se a empresa já solicitou uma demo
  useEffect(() => {
    if (!user?.id) return;

    const checkDemoRequest = async () => {
      try {
        const demoRef = ref(db, `request_demo/${user.id}`);
        const snapshot = await get(demoRef);
        if (snapshot.exists()) {
          setHasRequestedDemo(false); // Se existir, marca como solicitado
        }
      } catch (error) {
        console.error("Erro ao verificar solicitação de demo:", error);
      }
    };

    checkDemoRequest();
  }, [user]);

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
                // Verifica se o componente é "home"
                if (campanha.component === "home") {
                  // Se o usuário existir, filtra pela província; caso contrário, lista tudo
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



  const filteredInqueritos = useMemo(() => {
    return inqueritos.filter((inquerito) => !hasRespondedIds.has(inquerito.id));
  }, [inqueritos, hasRespondedIds]);

  const requestDemo = async () => {
    // Confirmação antes de enviar a solicitação
    const confirmRequest = window.confirm("Tem certeza que deseja solicitar uma demonstração?");
    if (!confirmRequest) return;

    if (!user?.nome || !user?.email || !user?.contacto) {
      setSnackbarMessage("Dados do usuário incompletos. Verifique seu perfil.");
      setOpenSnackbar(true);
      return;
    }

    try {
      const demoRef = ref(db, `request_demo/${user.id}`);
      await set(demoRef, {
        user: user.nome,
        id: user.id,
        email: user.email,
        contacto: user.contacto,
        timestamp: new Date().toISOString(),
      });
      setHasRequestedDemo(false); // Marca como solicitado
      setSnackbarMessage("Solicitação de demonstração enviada com sucesso!");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Erro ao enviar solicitação de demonstração:", error);
      setSnackbarMessage("Erro ao enviar solicitação. Tente novamente.");
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

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
      <MarqueeParceiros />
        <CategoriaList />
        <StorieListDesk user={user} />
        <Grid container spacing={2}>
  <Grid item xs={12} sm={3}>
      <Paper sx={{ padding: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
          Último Blog
        </Typography>
        {blogs.length > 0 ? (
          <Box>
            <Link to={`/blog/${blogs[0].id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <img
                src={blogs[0].imageURL}
                alt={blogs[0].title}
                style={{
                  width: "100%",
                  height: { xs: "100px", sm: "150px" }, // Altura responsiva
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
                />
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mt: 1, fontSize: { xs: "0.9rem", sm: "1rem" } }} // Fonte responsiva
              >
                {blogs[0].title}
              </Typography>
              <Typography
  variant="body2"
  color="textSecondary"
  sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
>
  {blogs[0].content.replace(/<[^>]+>/g, "").substring(0, 100)}...
</Typography>
            </Link>
            <Button
              component={Link}
              to="/blog"
              variant="outlined"
              fullWidth
              sx={{ mt: 2, fontSize: { xs: "0.8rem", sm: "0.875rem" } }} // Fonte responsiva
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
      backgroundColor: "#FF5050",
      borderRadius: "8px",
      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#FFF" }}>
      Software PHC CS
    </Typography>
    <img
      src="https://phcsoftware.com/mz/wp-content/uploads/sites/6/2024/03/phc_cs_1_banner.png"
      alt="PHC CS"
      style={{ width: "100%", borderRadius: "8px", marginBottom: "16px" }}
    />
    <Typography variant="body1" sx={{ mb: 2, color: "#fff", lineHeight: "1.6" }}>
      Automatize processos, aumente a produtividade e tome decisões mais inteligentes.
    </Typography>
    {hasRequestedDemo ? (
      <Typography variant="body2" sx={{ color: "#fff", textAlign: "center", mb: 2 }}>
        Você já solicitou uma demonstração.
      </Typography>
    ) : (
      <Button
        variant="contained"
        sx={{
          backgroundColor: "#FF5050",
          color: "#ffffff",
          fontWeight: "bold",
          "&:hover": { backgroundColor: "#FF3030" },
        }}
        fullWidth
        onClick={requestDemo}
      >
        Demonstração
      </Button>
    )}
  </Paper>
  {/* Outros blocos de informação */}
  {user ? (
    <InfoBlock title="Inquéritos" items={filteredInqueritos} linkBase="/inquerito" />
  ) : (
    <Paper sx={{ padding: 2, marginBottom: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}>
        Faça login para ver os inquéritos
      </Typography>
      <Button
        component={Link}
        to="/auth"
        variant="contained"
        fullWidth
        sx={{
          backgroundColor: "#1976d2",
          color: "#ffffff",
          fontWeight: "bold",
          "&:hover": { backgroundColor: "#1565c0" },
        }}
      >
        Autenticar
      </Button>
    </Paper>
  )}
</Grid>
        </Grid>
      </Container>

      {/* Snackbar para feedback */}
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