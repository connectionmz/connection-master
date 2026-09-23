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


import { get, limitToFirst, onValue, orderByKey, query, ref } from "firebase/database";
import { Link } from "react-router-dom";
import CategoriaList from "./CategoriasList";
import MarqueeParceiros from "../MarqueeParceiros";
import StorieListDesk from "./StorieListDesk";
import MarqueeAnuncios from "../MarqueeAnuncios";
import { db } from "../../fb";
import BannerDesk from "./BannerDesk";
import HeaderDeskPublic from "./HeaderDeskPublic";

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
            }}>
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


const HomePublic = () => {
    const user = null
  const [anuncios, setAnuncios] = useState([]);
  const [hasRespondedIds, setHasRespondedIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [campanhasAtivas, setCampanhasAtivas] = useState([]);
  const [blogs, setBlogs] = useState([]); 
  const isMobile = useMediaQuery('(max-width:600px)');


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
        console.log(blogsArray)
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
    
                const effectiveProvincia = user?.provinciaTemp ?? user?.provincia ?? '';
                if (
                  campanha.component === "home" &&
                  (!effectiveProvincia || effectiveProvincia === campanha.company?.provincia)
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

    

  }, []);





  return (
    <Box>
        <HeaderDeskPublic/>
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
            <MarqueeAnuncios user={user}/>
            <Box>
              <BannerDesk user={user}/>
            </Box>
          </Grid>

          <Grid item xs={12} sm={3}>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePublic;