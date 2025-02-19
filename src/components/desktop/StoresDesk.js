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
  Button,
  Badge,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

const shuffleArray = (array) => {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
};

const StoresDesk = ({ user }) => {
  const [storesList, setStoresList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const isMobile = useMediaQuery('(max-width:600px)'); // Verifica se a tela é pequena

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id);
      if (existingProduct) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  useEffect(() => {
    if (!user || !user.provincia) return;

    const fetchStores = async () => {
      try {
        const storesRef = ref(db, "stores");
        const snapshot = await get(storesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const storesArray = Object.entries(data)
            .map(([id, store]) => ({ id, ...store }))
            .filter((store) => store.company?.provincia === user.provincia);

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
  }, [user?.provincia]);

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
    <Box sx={{ p: isMobile ? 2 : 4, width: '100%' }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          gap: isMobile ? 2 : 0,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
          Lojas e Produtos
        </Typography>
        <IconButton component={Link} to="/cart" color="primary">
          <Badge
            badgeContent={cart.reduce((sum, item) => sum + item.quantity, 0)}
            color="secondary"
          >
            <ShoppingCartIcon fontSize="large" />
          </Badge>
        </IconButton>
      </Box>

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

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={isMobile ? 2 : 4}>
          {filteredStores.length > 0 ? (
            shuffleArray(
              filteredStores.flatMap((store) =>
                store.products
                  ? Object.entries(store.products).map(([productId, product]) => ({
                      ...product,
                      storeName: store.name || "Loja Desconhecida",
                      storeId: store.id,
                      logo: store.logo || "https://via.placeholder.com/80",
                      id: productId,
                      storeSettings: store.settings || {},
                    }))
                  : []
              )
            ).map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card
                  sx={{
                    height: 320,
                    boxShadow: 4,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "scale(1.03)",
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
                    <Box
                      sx={{
                        width: "100%",
                        height: 150,
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
                        alt={product.name || "Produto sem nome"}
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
                        padding: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "bold",
                          fontSize: "1rem",
                          textAlign: "center",
                          mb: 0.5,
                        }}
                      >
                        {product.name || "Produto sem nome"}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#ff5722",
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "0.875rem",
                        }}
                      >
                        {product.storeSettings.showPrice === false
                          ? "Preço indisponível"
                          : product.price
                          ? `${product.price} Mt`
                          : "Preço não informado"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "gray",
                          textAlign: "center",
                          mt: 0.5,
                          fontSize: "0.75rem",
                        }}
                      >
                        {product.storeName}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => addToCart(product)}
                    sx={{ mt: 1 }}
                  >
                    Adicionar ao Carrinho
                  </Button>
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