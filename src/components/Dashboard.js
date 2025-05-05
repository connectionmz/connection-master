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

  return (
    <Box>
      <Container sx={{ marginTop: 10 }}>
      <MarqueeParceiros />
        <CategoriaList />
        <StorieListDesk user={user} />
        <Grid container spacing={2}>
        <LatestBlogPost/>
          {/* Feed Central */}
          <Grid item xs={12} sm={6}>
            <MarqueeAnuncios user={user} />
            <Box>
              <BannerDesk user={user} />
            </Box>
          </Grid>

          {/* Sidebar Direita */}
          <Grid item xs={12} sm={3}>
  {/* Seção de Publicidade para PHC CS 
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
  */}
  <InqueritosList 
  user={user} />
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