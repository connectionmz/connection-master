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
  Snackbar,
  Alert,
  Rating,
  Chip,
  Stack,
  Divider,
  useTheme,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShareIcon from "@mui/icons-material/Share";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import VerifiedIcon from "@mui/icons-material/Verified";

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
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));


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
    setOpenSnackbar(true); 
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesRef = ref(db, "stores");
        const snapshot = await get(storesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const storesArray = Object.entries(data).map(([id, store]) => ({ id, ...store }));

          // Filtrar apenas se o usuário existir
          const filteredStores = user
            ? storesArray.filter(
                (store) =>
                  store.company?.provincia === (user.provinciaTemp || user.provincia)
              )
            : storesArray; // Exibe todas as lojas se o usuário não existir

          const shuffledStores = shuffleArray(filteredStores);
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

  // Calculate discount percentage if original price exists
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  return (
    <Box sx={{ 
      p: isMobile ? 2 : 4, 
      width: '100%', 
      backgroundColor: '#f8f8f8',
      minHeight: '100vh'
    }}>
      {/* Search and Title Section */}
      <Box sx={{ 
        maxWidth: 1400, 
        mx: 'auto', 
        mb: 4,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
          fontWeight: "bold",
          color: theme.palette.primary.main
        }}>
          Lojas e Produtos
        </Typography>
        
        <TextField
          label="Pesquisar loja ou produto..."
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          sx={{ 
            maxWidth: 600,
            backgroundColor: '#fff',
            borderRadius: 1
          }}
          size={isMobile ? 'small' : 'medium'}
        />
      </Box>

      {/* Stores Carousel */}
      <Box sx={{ 
        maxWidth: 1400,
        mx: 'auto',
        mb: 4,
        p: 1,
        backgroundColor: '#fff',
        borderRadius: 2,
        boxShadow: 1
      }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Lojas em Destaque
        </Typography>
        <Box sx={{
          display: "flex",
          overflowX: "auto",
          gap: 2,
          py: 1,
          px: 1,
          '&::-webkit-scrollbar': {
            height: 6,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.primary.main,
            borderRadius: 3,
          },
        }}>
          {storesList.map((store) => (
            <Box
              key={store.id}
              sx={{
                minWidth: 120,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textDecoration: 'none',
              }}
              component={Link}
              to={`/loja/${store.id}`}
            >
              <Avatar
                src={store?.company?.logo || "https://via.placeholder.com/80"}
                sx={{
                  width: 80,
                  height: 80,
                  border: `2px solid ${theme.palette.primary.main}`,
                  marginBottom: 1,
                }}
              />
              <Typography
                variant="body2"
                sx={{ 
                  textAlign: "center", 
                  fontWeight: 500,
                  color: theme.palette.text.primary
                }}
              >
                {store.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Products Grid */}
      {loading ? (
        <Box sx={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: 'center',
          height: '50vh'
        }}>
          <CircularProgress size={isMobile ? 40 : 60} />
        </Box>
      ) : (
        <Box sx={{ 
          maxWidth: 1400,
          mx: 'auto'
        }}>
          <Grid container spacing={isMobile ? 1 : 3}>
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
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={product.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      boxShadow: 0,
                      border: '1px solid #eee',
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: 3,
                      },
                      position: 'relative',
                      overflow: 'visible',
                      backgroundColor: '#fff'
                    }}
                  >
                    {/* Product Labels */}
                    {product.discountPrice && (
                      <Chip
                        label={`-${calculateDiscount(product.discountPrice, product.price)}%`}
                        color="error"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          fontWeight: 'bold',
                          zIndex: 1
                        }}
                      />
                    )}
                    
                    {product.isNew && (
                      <Chip
                        label="Novo"
                        color="success"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontWeight: 'bold',
                          zIndex: 1
                        }}
                      />
                    )}

                    <CardActionArea
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                      component={Link}
                      to={`/product/${product.id}/store/${product.storeId}`}
                    >
                      {/* Product Image */}
                      <Box
                        sx={{
                          width: "100%",
                          height: isMobile ? 120 : 180,
                          overflow: "hidden",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "#fafafa",
                          position: 'relative'
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={product.imageUrl || "https://via.placeholder.com/150"}
                          alt={product.name || "Produto sem nome"}
                          sx={{
                            width: "auto",
                            height: "80%",
                            objectFit: "contain",
                            transition: 'transform 0.3s',
                            '&:hover': {
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      </Box>

                      {/* Product Details */}
                      <CardContent
                        sx={{
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                          p: 2,
                          pt: 1
                        }}
                      >
                        {/* Product Name */}
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500,
                            fontSize: isMobile ? "0.875rem" : "0.9375rem",
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minHeight: isMobile ? 40 : 44,
                            color: theme.palette.text.primary
                          }}
                        >
                          {product.name || "Produto sem nome"}
                        </Typography>

                        {/* Rating 
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating
                            value={product.rating || 4}
                            precision={0.5}
                            readOnly
                            size={isMobile ? "small" : "medium"}
                            sx={{ color: '#ffb400', mr: 0.5 }}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            ({product.reviewCount || 12})
                          </Typography>
                        </Box>
*/}
                        {/* Price Section */}
                        <Box sx={{ mt: 'auto' }}>
                          {product.storeSettings.showPrice === false ? (
                            <Typography variant="body2" color="text.secondary">
                              Preço indisponível
                            </Typography>
                          ) : (
                            <>
                              {product.discountPrice ? (
                                <>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      color: theme.palette.error.main,
                                      fontWeight: 'bold',
                                      fontSize: isMobile ? '1rem' : '1.125rem'
                                    }}
                                  >
                                    {product.discountPrice} MT
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: 'text.secondary',
                                      textDecoration: 'line-through',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    {product.price} MT
                                  </Typography>
                                </>
                              ) : (
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: theme.palette.primary.main,
                                    fontWeight: 'bold',
                                    fontSize: isMobile ? '1rem' : '1.125rem'
                                  }}
                                >
                                  {product.price || "0"} MT
                                </Typography>
                              )}
                            </>
                          )}
                        </Box>

                        {/* Shipping Info 
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mt: 0.5,
                          color: theme.palette.success.main
                        }}>
                          <LocalShippingIcon sx={{ 
                            fontSize: isMobile ? '0.875rem' : '1rem', 
                            mr: 0.5 
                          }} />
                          <Typography variant="caption">
                            Frete grátis
                          </Typography>
                        </Box>
                        */}
                      </CardContent>
                    </CardActionArea>

                    {/* Action Buttons */}
                    <Box sx={{ 
                      p: 1, 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <IconButton 
                        size="small" 
                        sx={{ color: theme.palette.error.main }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product);
                        }}
                      >
                        <ShoppingCartIcon fontSize={isMobile ? "small" : "medium"} />
                      </IconButton>
                      <IconButton size="small">
                        <ShareIcon fontSize={isMobile ? "small" : "medium"} />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))
            ) : (
              <Box sx={{ 
                width: '100%', 
                textAlign: 'center', 
                p: 4,
                gridColumn: '1 / -1'
              }}>
                <Typography variant="h6" color="text.secondary">
                  Nenhum produto encontrado
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Tente ajustar sua pesquisa ou filtros
                </Typography>
              </Box>
            )}
          </Grid>
        </Box>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          sx={{ 
            width: '100%',
            boxShadow: 3,
            alignItems: 'center'
          }}
          icon={<VerifiedIcon fontSize="inherit" />}
        >
          Produto adicionado ao carrinho!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StoresDesk;