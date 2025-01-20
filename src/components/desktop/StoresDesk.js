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
              src={store?.company?.logo || "https://via.placeholder.com/80"}
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
              storeName: store.name, // Adiciona o nome da loja
              storeId: store.id, // Adiciona o ID da loja
              logo:store.logo,
              id: productId,
            }))
          : []
      )
    ).map((product) => (
      <Grid item xs={12} sm={6} md={4} key={product.id}>
        <Card
          sx={{
            height: 280, // Altura total reduzida
            boxShadow: 4,
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "scale(1.03)", // Menor escala de aumento
              boxShadow: 6,
            },
          }}
        >
          <CardActionArea
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
            component={Link}
            to={`/product/${product.id}/store/${product.storeId}`}
          >
            {/* Imagem com altura fixa */}
            <Box
              sx={{
                width: "100%",
                height: 150, // Altura menor
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f5f5f5",
              }}
            >
              <CardMedia
                component="img"
                image={product.imageUrl || "https://via.placeholder.com/150"}
                alt={product.name}
                sx={{
                  width: "auto",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </Box>
            <CardContent
  sx={{
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 1, // Margem reduzida
  }}
>
  <Typography
    variant="h6"
    sx={{
      fontWeight: "bold",
      fontSize: "1rem", // Reduz tamanho da fonte
      textAlign: "center",
      mb: 0.5,
    }}
  >
    {product.name}
  </Typography>
  <Typography
    variant="body1"
    sx={{
      color: "#ff5722",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: "0.875rem", // Reduz tamanho da fonte
    }}
  >
    {`${product.price} Mt`}
  </Typography>
  <Typography
    variant="body2"
    sx={{
      color: "gray",
      textAlign: "center",
      mt: 0.5,
      fontSize: "0.75rem", // Reduz tamanho da fonte
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {/* Exibe o logotipo da loja e o nome */}
    <img
      src={product.logo || "https://via.placeholder.com/20"} // Adiciona fallback para URL padrão
      alt={product.storeName}
      style={{
        width: "20px", // Tamanho do logotipo
        height: "20px",
        marginRight: "8px", // Espaço entre o logotipo e o nome da loja
        borderRadius: "50%", // Torna o logotipo arredondado, se necessário
      }}
    />
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
