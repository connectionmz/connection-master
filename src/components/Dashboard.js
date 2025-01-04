import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  InputBase,
  Container,
  Grid,
  Paper,
  Button,
  List,
  ListItem,
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

const Dashboard = ({ user }) => {
  const [anuncios, setAnuncios] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    // Carregar anúncios
    const loadAnuncios = async () => {
      try {
        const data = await fetchAnuncios();
        setAnuncios(data);
      } catch (error) {
        console.error("Erro ao carregar os anúncios:", error);
      }
    };
  
    // Carregar categorias externas com limite
    const categoriasRef = query(ref(db, "categoriasExternas"), orderByKey(), limitToFirst(10));
    const unsubscribe = onValue(
      categoriasRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const categoriasList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setCategorias(categoriasList);
        }
      },
      { onlyOnce: false } // Mantém a leitura em tempo real
    );
  
    // Executa o carregamento inicial
    loadAnuncios();
  
    // Limpa a subscrição ao desmontar o componente
    return () => unsubscribe();
  }, []);
  return (
    <Box sx={{ backgroundColor: "#f3f2ef", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        {/* Parcerias e Stories */}
        <MarqueeParceiros />
        <StorieList user={user.provincia} />
        <MarqueeAnuncios />

        {/* Layout Centralizado */}
        <Grid container spacing={3}>
          {/* Informações Úteis - Esquerda */}
          <Grid item xs={3}>
            <Paper sx={{ padding: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Informações Úteis
              </Typography>
              <List>
                {anuncios.slice(0, 5).map((anuncio, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemText
                      primary={<strong>{anuncio.title || "Indisponível"}</strong>}
                      secondary={anuncio.company || "Empresa Desconhecida"}
                    />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Button fullWidth variant="text" sx={{ color: "#0a66c2" }}>
                Ver todas
              </Button>
            </Paper>
          </Grid>

          {/* Banner - Centro */}
          <Grid item xs={6}>
            <Paper sx={{ padding: 2 }}>
              <Banner />
            </Paper>
          </Grid>

          {/* Publicações e Anúncios - Direita */}
          <Grid item xs={3}>
            <Paper sx={{ padding: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Publicações Recentes
              </Typography>
              <List>
              {categorias.map((categoria) => (
          <Link
            key={categoria.id}
            to={`/servicos/${categoria.name}`} >
              <ListItemText secondary={categoria.name || "Indisponível"}/>
          </Link>
        ))}
                
              </List>
              <Divider sx={{ my: 2 }} />
              <Button fullWidth variant="outlined" color="primary">
                Ver Mais
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
