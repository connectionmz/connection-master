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
import BannerDesk from "./desktop/BannerDesk";
import StorieListDesk from "./desktop/StorieListDesk";

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
          <Link key={item.id} to={`${linkBase}/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
    const loadAnuncios = async () => {
      try {
        const data = await fetchAnuncios();
        setAnuncios(data);
      } catch (error) {
        console.error("Erro ao carregar os anúncios:", error);
      }
    };

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

    loadAnuncios();

    return () => {
      unsubscribeCategorias();
      unsubscribeInqueritos();
    };
  }, []);

  return (
    <Box >
   
      <Container sx={{ marginTop: 10 }}>
      <MarqueeParceiros/>
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
            <InfoBlock title="Categorias" items={categorias} linkBase="/servicos" />
            <InfoBlock title="Inquéritos" items={inqueritos} linkBase="/inquerito" />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;