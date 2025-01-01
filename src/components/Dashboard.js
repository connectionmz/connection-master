import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  InputBase,
  Container,
  Grid,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  ListItemIcon,
} from "@mui/material";
import {
  Search,
  Notifications,
  Message,
  AccountCircle,
  Home,
  BusinessCenter,
  People,
  Article,
} from "@mui/icons-material";
import { logo } from "../utils/utils";
import { Link } from "react-router-dom";
import MarqueeParceiros from "./MarqueeParceiros";
import MarqueeAnuncios, { fetchAnuncios } from "./MarqueeAnuncios";
import StorieList from "./StorieList";
import Banner from "./Banner";



const Dashboard = ({ user }) => {
  const [anuncios, setAnuncios] = useState([]);

  useEffect(() => {
    const loadAnuncios = async () => {
      try {
        const data = await fetchAnuncios();
        setAnuncios(data);
      } catch (error) {
        console.error('Erro ao carregar os anúncios:', error);
      }
    };

    loadAnuncios();
  }, []);


  return (
    <Box sx={{ backgroundColor: "#f3f2ef", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <MarqueeParceiros />
        <StorieList user={user.provincia}/> 
        <MarqueeAnuncios />
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Paper sx={{ padding: 2, height: "100%" }}>
            <Banner /> 
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ padding: 2, marginBottom: 2 }}>
              <Typography variant="h6">Comece uma publicação</Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mt: 2,
                }}>
                <Avatar>A</Avatar>
                <InputBase
                  placeholder="No que você está pensando?"
                  fullWidth
                  sx={{
                    backgroundColor: "#f3f2ef",
                    padding: 1,
                    borderRadius: 1,
                  }}
                />
              </Box>
            </Paper>

            {["Celebrating a Milestone", "Achieved a Goal", "Started a New Job"].map(
              (post, index) => (
                <Paper key={index} sx={{ padding: 2, marginBottom: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {post}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
                    vehicula fermentum justo.
                  </Typography>
                </Paper>
              )
            )}
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{ padding: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Informacoes Uteis
              </Typography>
              <List>
              {anuncios.map((anuncio, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemIcon>
                    </ListItemIcon>
                    <ListItemText 
                      primary={<strong>{anuncio.title || 'Indisponivel'}</strong>} 
                      secondary={anuncio.company || 'Empresa Desconhecida'} />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Button fullWidth variant="text" sx={{ color: "#0a66c2" }}>
                Ver todas
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
