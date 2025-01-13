import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "../../fb";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  CircularProgress,
  Box,
  CardActionArea,
  CardMedia,
  Avatar,
} from "@mui/material";

// Função para embaralhar arrays
const shuffleArray = (array) => {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
};

const StoresDesk = () => {
  const [storesList, setStoresList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesRef = ref(db, "stores");
        const snapshot = await get(storesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const storesArray = Object.entries(data).map(([id, store]) => ({
            id,
            ...store,
          }));
          const shuffledStores = shuffleArray(storesArray);
          setStoresList(shuffledStores);
          setFilteredStores(shuffledStores);
        } else {
          setStoresList([]);
          setFilteredStores([]);
        }
      } catch (error) {
        console.error("Erro ao buscar lojas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = storesList.filter((store) =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStores(shuffleArray(filtered));
    } else {
      setFilteredStores(shuffleArray(storesList));
    }
  }, [searchQuery, storesList]);

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        align="center"
        sx={{ fontWeight: "bold", mb: 4 }}
      >
        Lojas e Produtos
      </Typography>

      {/* Barra de Pesquisa */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
        <TextField
          label="Pesquisar loja por nome..."
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          sx={{ maxWidth: 600 }}
        />
      </Box>

      {/* Stories de Empresas */}
      <Box
        sx={{
          display: "flex",
          overflowX: "auto",
          mb: 4,
          gap: 2,
          padding: 1,
        }}
      >
        {storesList.map((store) => (
          <Box
            key={store.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
            component={Link}
            to={`/stores/${store.id}`}
          >
            <Avatar
              src={store.photoUrl || "https://via.placeholder.com/80"}
              sx={{
                width: 80,
                height: 80,
                border: "2px solid #ff5722",
                marginBottom: 1,
              }}
            />
            <Typography
              variant="body2"
              sx={{ textAlign: "center", maxWidth: "80px" }}
            >
              {store.name}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Carregando ou lista de lojas e produtos */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
<Grid container spacing={4}>
  {filteredStores.length > 0 ? (
    // Combine produtos de todas as lojas em uma única lista e embaralhe
    shuffleArray(
      filteredStores.flatMap((store) =>
        store.products
          ? Object.entries(store.products).map(([productId, product]) => ({
              ...product,
              storeName: store.name, // Adiciona o nome da empresa
              id: productId,
            }))
          : []
      )
    ).map((product) => (
      <Grid item xs={12} sm={6} md={4} key={product.id}>
        <Card
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            boxShadow: 4,
            transition: "transform 0.3s, box-shadow 0.3s",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: 6,
            },
          }}
        >
          <CardActionArea
            sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}
          >
            {/* Imagem com tamanho uniforme */}
            <Box
              sx={{
                width: "100%",
                height: 180, // Altura fixa
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f5f5f5",
              }}
            >
              <CardMedia
                component="img"
                image={product.imageUrl}
                alt={product.name}
                sx={{
                  width: "auto",
                  height: "100%", // Adapta proporcionalmente à altura definida
                  objectFit: "contain",
                }}
              />
            </Box>

            {/* Conteúdo do Card */}
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  textAlign: "center",
                  mb: 1,
                }}
              >
                {product.name}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                  mb: 2,
                  textAlign: "center",
                }}
              >
                {product.description}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#ff5722",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                {`R$ ${product.price}`}
              </Typography>
              {/* Nome da empresa */}
              <Typography
                variant="body2"
                sx={{
                  color: "gray",
                  textAlign: "center",
                  mt: 1,
                }}
              >
                {product.storeName}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    ))
  ) : (
    <Typography
      variant="body2"
      sx={{ color: "gray", textAlign: "center", width: "100%" }}
    >
      Nenhum produto encontrado.
    </Typography>
  )}
</Grid>

      )}
    </Box>
  );
};

export default StoresDesk;
