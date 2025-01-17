import React, { useEffect, useState } from "react";
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
import { limitToFirst, onValue, orderByKey, query, ref } from "firebase/database";
import { Link } from "react-router-dom";
import { db } from "../fb";

// Componente reutilizável para exibir listas (Categorias, Inquéritos)
const InfoBlock = ({ title, items, linkBase }) => (
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
          <Link key={item.id} to={`${linkBase}/${item.id}`}>
            <ListItemText secondary={item.name || item.title} />
          </Link>
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

  useEffect(() => {
    // Função para carregar anúncios
    const loadAnuncios = async () => {
      try {
        const data = await fetchAnuncios();
        setAnuncios(data);
      } catch (error) {
        console.error("Erro ao carregar os anúncios:", error);
      }
    };

    // Listener para categorias
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

    // Listener para inquéritos
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

    // Carrega anúncios
    loadAnuncios();

    // Limpeza dos listeners ao desmontar
    return () => {
      unsubscribeCategorias();
      unsubscribeInqueritos();
    };
  }, []);

  return (
    <Box sx={{ backgroundColor: "#f3f2ef", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <MarqueeParceiros />
        <StorieList user={user.provincia} />
        <MarqueeAnuncios />

        {/* Layout Centralizado */}
        <Grid container spacing={3}>
          {/* Informações Úteis - Esquerda */}
          <Grid item xs={12} sm={4} md={3}>
            <Paper sx={{ padding: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Empresas Destacadas
              </Typography>
              <List>
                {anuncios
                  .filter((anuncio) => anuncio.isFeatured) // Filtra anúncios destacados
                  .slice(0, 5)
                  .map((anuncio, index) => (
                    <ListItemText
                      key={index}
                      primary={<strong>{anuncio.title || "Indisponível"}</strong>}
                      secondary={anuncio.company ? anuncio.company.nome : "Empresa Desconhecida"} // Verifica se há o campo company
                    />
                  ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Button fullWidth variant="text" sx={{ color: "#0a66c2" }}>
                Ver todas
              </Button>
            </Paper>
          </Grid>

          {/* Banner - Centro */}
          <Grid item xs={12} sm={8} md={6}>
            <Paper sx={{ padding: 2 }}>
              <Banner />
            </Paper>
          </Grid>

          {/* Publicações e Anúncios - Direita */}
          <Grid item xs={12} sm={4} md={3}>
            <InfoBlock title="Categorias" items={categorias} linkBase="/servicos" />
            <InfoBlock title="Inquéritos" items={inqueritos} linkBase="/inquerito" />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
