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
  IconButton,
  useMediaQuery,
  Chip,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import VerifiedIcon from "@mui/icons-material/Verified";
import { formatPrice } from "../../utils/utils";

// Improved shuffle function with better randomization
const shuffleArray = (array, seed = 1) => {
  const random = (min, max) => {
    const x = Math.sin(seed++) * 10000;
    const rand = x - Math.floor(x);
    return Math.floor(rand * (max - min + 1)) + min;
  };
  
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = random(0, i);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const StoresDesk = ({ user }) => {
  const [storesList, setStoresList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [shareProductId, setShareProductId] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const handleOpenShareMenu = (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    setShareProductId(id);
    setShareAnchorEl(event.currentTarget);
  };

  const handleCloseShareMenu = () => {
    setShareAnchorEl(null);
    setShareProductId(null);
  };

  const shareOnPlatform = (platform) => {
    if (!shareProductId) return;
    
    const productUrl = `${window.location.origin}/product/${shareProductId}`;
    let shareUrl = '';
    
    switch(platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=Confira este produto: ${productUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(productUrl);
        // Consider adding a toast notification here
        handleCloseShareMenu();
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    handleCloseShareMenu();
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const storesRef = ref(db, "stores");
        const snapshot = await get(storesRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const storesArray = Object.entries(data).map(([id, store]) => ({ 
            id, 
            ...store,
            products: store.products || {}
          }));

          const filteredStores = user?.provinciaTemp || user?.provincia
            ? storesArray.filter(
                store => store.company?.provincia === (user.provinciaTemp || user.provincia)
              )
            : storesArray;

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
  }, [user?.provincia, user?.provinciaTemp]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = storesList.filter(store =>
        store.name.toLowerCase().includes(query) ||
        Object.values(store.products).some(product => 
          product.name?.toLowerCase().includes(query)
        )
      );
      setFilteredStores(shuffleArray(filtered));
    } else {
      setFilteredStores(shuffleArray([...storesList]));
    }
  }, [searchQuery, storesList]);

  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  // Memoize product list to avoid unnecessary re-renders
  const productList = React.useMemo(() => {
    return shuffleArray(
      filteredStores.flatMap(store =>
        Object.entries(store.products).map(([productId, product]) => ({
          ...product,
          storeName: store.name || "Loja Desconhecida",
          storeId: store.id,
          logo: store.company?.logo || "https://via.placeholder.com/80",
          id: productId,
          storeSettings: store.settings || {},
        }))
      )
    );
  }, [filteredStores]);

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
          InputProps={{
            type: 'search'
          }}
        />
      </Box>

      {/* Stores Carousel */}
      {storesList.length > 0 && (
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
            {storesList.slice(0, 10).map((store) => (
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
                    color: theme.palette.text.primary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                >
                  {store.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

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
            {productList.length > 0 ? (
              productList.map((product) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={`${product.storeId}-${product.id}`}>
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
                          loading="lazy"
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

                        {/* Store Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar 
                            src={product.logo} 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              mr: 1 
                            }} 
                          />
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {product.storeName}
                          </Typography>
                        </Box>

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
                                    {formatPrice(product.discountPrice)} MT
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: 'text.secondary',
                                      textDecoration: 'line-through',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    {formatPrice(product.price)} MT
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
                                  {formatPrice(product.price || "0")} MT
                                </Typography>
                              )}
                            </>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>

                    {/* Action Buttons */}
                    <Box sx={{ 
                      p: 1, 
                      display: 'flex', 
                      justifyContent: 'flex-end',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <IconButton 
                        size="small"
                        onClick={(e) => handleOpenShareMenu(e, product.id)}
                        aria-label="Compartilhar produto"
                      >
                        <ShareIcon fontSize={isMobile ? "small" : "medium"} />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ 
                  width: '100%', 
                  textAlign: 'center', 
                  p: 4,
                }}>
                  <Typography variant="h6" color="text.secondary">
                    Nenhum produto encontrado
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {searchQuery.trim() 
                      ? "Tente ajustar sua pesquisa" 
                      : "Nenhuma loja disponível no momento"}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={handleCloseShareMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => shareOnPlatform('whatsapp')}>
          <ListItemIcon>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/124/124034.png" 
              alt="WhatsApp" 
              width={24} 
              height={24} 
            />
          </ListItemIcon>
          <ListItemText>WhatsApp</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform('facebook')}>
          <ListItemIcon>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/124/124010.png" 
              alt="Facebook" 
              width={24} 
              height={24} 
            />
          </ListItemIcon>
          <ListItemText>Facebook</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform('twitter')}>
          <ListItemIcon>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/124/124021.png" 
              alt="Twitter" 
              width={24} 
              height={24} 
            />
          </ListItemIcon>
          <ListItemText>Twitter</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform('copy')}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copiar link</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default StoresDesk;