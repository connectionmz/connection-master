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
} from "@mui/material";
import MarqueeParceiros from "./MarqueeParceiros";
import MarqueeAnuncios, { fetchAnuncios } from "./MarqueeAnuncios";
import { get, limitToFirst, onValue, orderByKey, query, ref } from "firebase/database";
import { Link } from "react-router-dom";
import { db } from "../fb";
import BannerDesk from "./desktop/BannerDesk";
import StorieListDesk from "./desktop/StorieListDesk";

// Componente InfoBlock para exibir categorias e inquéritos
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
          <div key={item.id} style={{ marginBottom: '16px' }}>
            <Link
              to={`${linkBase}/${isCategory ? item.name : item.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <ListItemText primary={item.name || item.title} />
            </Link>
            {item.company && (
              <div style={{ marginTop: '8px' }}>
                <Typography variant="body2" color="textSecondary">
                  {item.company.nome}
                </Typography>
              </div>
            )}
          </div>
        ))
      )}
    </List>
    <Divider sx={{ my: 2 }} />
    <Button fullWidth variant="outlined" color="primary">
      Ver Mais
    </Button>
  </Paper>
);

// Hook personalizado para carregar dados do Firebase
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campanhasAtivas, setCampanhasAtivas] = useState([]);

  // Carregar categorias e inquéritos usando o hook personalizado
  const { data: categorias, loading: categoriasLoading, error: categoriasError } = useFirebaseData("categoriasExternas");
  const { data: inqueritos, loading: inqueritosLoading, error: inqueritosError } = useFirebaseData("surveys");

  // Carregar anúncios
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
                  campanhasArray.push({ id: subKey, ...campanha });
                }
              });
            });
    
            setCampanhasAtivas(campanhasArray);
            console.log(campanhasAtivas.length)
          }
        });
      } catch (error) {
        console.error("Erro ao carregar campanhas ativas:", error);
        setError("Erro ao carregar campanhas");
      }
    };
    

    const loadAnuncios = async () => {
      try {
        const data = await fetchAnuncios();
        setAnuncios(data);
      } catch (error) {
        setError("Erro ao carregar os anúncios");
        console.error("Erro ao carregar os anúncios:", error);
      } finally {
        setLoading(false);
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
    loadAnuncios();
  }, []);



  const filteredInqueritos = useMemo(() => {
    return inqueritos.filter((inquerito) => !hasRespondedIds.has(inquerito.id));
  }, [inqueritos, hasRespondedIds]);

  if (loading || categoriasLoading || inqueritosLoading) {
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
        <StorieListDesk user={user.provincia} />
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
                        to={`/vperfil/${campanha.company.id}`}
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
            <MarqueeAnuncios />
            <Box sx={{ padding: 2 }}>
              <BannerDesk />
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