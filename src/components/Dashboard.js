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
} from "@mui/material";
import MarqueeParceiros from "./MarqueeParceiros";
import MarqueeAnuncios, { fetchAnuncios } from "./MarqueeAnuncios";
import StorieList from "./StorieList";
import Banner from "./Banner";
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
            {item.company && ( // Renderizar informações da empresa, caso seja um inquérito
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

const Dashboard = ({ user }) => {
  const [anuncios, setAnuncios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [inqueritos, setInqueritos] = useState([]);
  const [hasRespondedIds, setHasRespondedIds] = useState(new Set()); // IDs dos inquéritos respondidos
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const [error, setError] = useState(null); // Estado de erro

  useEffect(() => {
    // Função para carregar anúncios
    const loadAnuncios = async () => {
      try {
        const data = await fetchAnuncios();
        setAnuncios(data);
      } catch (error) {
        setError("Erro ao carregar os anúncios");
        console.error("Erro ao carregar os anúncios:", error);
      }
    };

    // Função para carregar categorias
    const fetchCategorias = () => {
      const categoriasRef = query(ref(db, "categoriasExternas"), orderByKey(), limitToFirst(10));
      const unsubscribeCategorias = onValue(categoriasRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const categoriasList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setCategorias(categoriasList);
        }
      });

      return unsubscribeCategorias;
    };

    // Função para carregar inquéritos
    const fetchInqueritos = () => {
      const inqueritosRef = query(ref(db, "surveys"), orderByKey(), limitToFirst(10));
      const unsubscribeInqueritos = onValue(inqueritosRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const inqueritosList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setInqueritos(inqueritosList);
        }
      });

      return unsubscribeInqueritos;
    };

    // Verificar inquéritos respondidos
    const fetchRespondedInqueritos = () => {
      const responsesRef = ref(db, `survey_responses/`);
      get(responsesRef).then((snapshot) => {
        if (snapshot.exists()) {
          const respondedIds = Object.keys(snapshot.val());
          setHasRespondedIds(new Set(respondedIds));
        }
      });
    };

    loadAnuncios();
    fetchCategorias();
    fetchInqueritos();
    fetchRespondedInqueritos();

    setLoading(false);

    return () => {
      // Limpar subscrições
      fetchCategorias();
      fetchInqueritos();
    };
  }, []);

  // Filtrando os inquéritos respondidos
  const filteredInqueritos = useMemo(() => {
    return inqueritos.filter((inquerito) => !hasRespondedIds.has(inquerito.id));
  }, [inqueritos, hasRespondedIds]);

  // Verificando se os dados estão carregados
  if (loading) return <Typography>Carregando...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

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
                {anuncios
                  .filter((anuncio) => anuncio.isFeatured)
                  .slice(0, 5)
                  .map((anuncio, index) => (
                    <ListItemText
                      key={index}
                      primary={<strong>{anuncio.title || "Indisponível"}</strong>}
                      secondary={anuncio.company ? anuncio.company.nome : "Empresa Desconhecida"}
                    />
                  ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Button fullWidth variant="text" sx={{ color: "#0a66c2" }}>
                Ver todas
              </Button>
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
