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

const getCategoryIcon = (categoryName) => {
  const icons = {
    "Emergência": <MedicalServices />,
    "Registo": <AppRegistration />,
    "Financiamentos PMEs": <BusinessCenterRounded />,
    "Formações": <School />,
    "Impostos e Licenças": <Receipt />,
    "Segurança Social": <PeopleAltTwoTone />,
    "Saúde Pública": <MedicalServices />,
    "Entidades Reguladoras": <Gavel />,
  };
  return icons[categoryName] || <Business />; // Ícone padrão caso não esteja na lista
};

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
              <ListItemIcon>{getCategoryIcon(item.name)}</ListItemIcon>
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
  const isMobile = useMediaQuery('(max-width:600px)');

  const { data: categorias, loading: categoriasLoading, error: categoriasError } = useFirebaseData("categoriasExternas");
  const { data: inqueritos, loading: inqueritosLoading, error: inqueritosError } = useFirebaseData("surveys");

  
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

  if (categoriasLoading || inqueritosLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || categoriasError || inqueritosError) {
    return (
      <Typography color="error" align="center">
        {error || categoriasError || inqueritosError}
      </Typography>
    );
  }

  return (
    <Box>
      <Container sx={{ marginTop: 10 }}>
        <MarqueeParceiros />
        <StorieListDesk user={user} />
        <Grid container spacing={2}>
          {/* Sidebar Esquerda */}
          <Grid item xs={12} sm={3}>
          <Paper sx={{ padding: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Empresas Destacadas
              </Typography>
              <List>
                {campanhasAtivas.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    Nenhuma campanha disponível no momento.
                  </Typography>
                ) : (
                  campanhasAtivas.map((campanha) => (
                    <div key={campanha.id} style={{ marginBottom: "16px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <Link
                        to={`/perfil/${campanha.company.id}`}
                        style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}
                      >
                        {/* Logo da empresa */}
                        {campanha.company?.logo && (
                          <img 
                            src={campanha.company.logo} 
                            alt="Logo da empresa"
                            style={{ width: 40, height: 40, borderRadius: "50%", marginRight: 10 }} 
                          />
                        )}

                        {/* Nome da empresa */}
                        <ListItemText
                          primary={
                            <span>{campanha.company?.nome || "Nome da Empresa Não Disponível"}</span>
                          }
                        />
                      </Link>
                    </div>
                  ))
                )}
              </List>
            </Paper>

          </Grid>
          {/* Feed Central */}
          <Grid item xs={12} sm={6}>
            <MarqueeAnuncios user={user}/>
            <Box sx={{ padding: 2 }}>
              <BannerDesk user={user}/>
            </Box>
          </Grid>

          {/* Sidebar Direita */}
          <Grid item xs={12} sm={3}>
            <InfoBlock title="Categorias" items={categorias} linkBase="/servicos" isCategory={true} />
            <InfoBlock title="Inquéritos" items={filteredInqueritos} linkBase="/inquerito" />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;