import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ref, get, set, push, increment, onValue, update, remove } from "firebase/database";
import { db } from "../../fb";
import { ActiveModulesProvider, useActiveModules } from '../../context/ActiveModulesContext';

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
  Tooltip,
  Badge,
  InputAdornment,
  Button,
  Alert,
  Paper,
  Stack,
  Breadcrumbs,
  Rating,
  Fab
} from "@mui/material";
import {
  Share,
  Verified,
  LocalMall,
  Store,
  VisibilityOff,
  Search,
  ShoppingCartCheckout,
  AddShoppingCart,
  Favorite,
  FavoriteBorder,
  NavigateNext,
  Home,
  Star,
  StarHalf,
  StarBorder,
  TrendingUp,
  FlashOn,
  LocalFireDepartment,
  Discount,
  Sell,
  Whatshot
} from "@mui/icons-material";
import { formatPrice } from "../../utils/utils";
import MyCart from "./ShoppingCart";

const StoresDesk = ({ user }) => {
  const theme = useTheme();
  const { activeModules } = useActiveModules();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Estados
  const [stores, setStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [shareAnchor, setShareAnchor] = useState(null);
  const [sharedProduct, setSharedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState(new Set());

  const navigate = useNavigate();
  const userId = user?.id || 'anonymous';
  const userProvince = user?.provinciaTemp || user?.provincia || null;
  const hasMarket = activeModules?.moduloMarket || false;

  const trackInteraction = async (type, action, itemId, storeId = null) => {
    try {
      const timestamp = Date.now();
      
      if (action === 'click') {
        const updates = {};
        
        updates[`anuncios_metrics/${storeId}/total_cliques`] = increment(1);
        updates[`loja_metrics/${storeId}/ultimo_clique`] = timestamp;
        updates[`loja_metrics/${storeId}/from`] = 'Pagina Inicial';
        
        if (user) {
          updates[`loja_metrics/${storeId}/company`] = {
            id: user.id,
            nome: user.nome || user.displayName || 'Anônimo',
            provincia: user.provinciaTemp || user.provincia || 'Não especificado',
            distrito: user.distrito || 'Não especificado',
            contacto: user.contacto || user.phoneNumber || 'Não especificado',
            sector: user.sector || 'Não especificado',
            email: user.email || 'Não especificado'
          };
        }
        
        await update(ref(db), updates);
        
        const clickData = {
          type,
          itemId,
          storeId,
          userId: user?.id || 'anonymous',
          timestamp,
          userAgent: navigator.userAgent,
          page: 'Pagina Inicial'
        };
        
        const clickRef = push(ref(db, 'clicks'));
      }
      
    } catch (error) {
      console.error("Erro ao registrar interação:", error);
    }
  };

  const trackClick = async (storeId) => {
    try {
      const timestamp = Date.now();
      const updates = {};
      
      updates[`loja_metrics/${storeId}/total_cliques`] = increment(1);
      updates[`loja_metrics/${storeId}/ultimo_clique`] = timestamp;
      updates[`loja_metrics/${storeId}/from`] = 'Pagina Inicial';
      
      if (user) {
        updates[`loja_metrics/${storeId}/company`] = {
          id: user.id,
          nome: user.nome || user.displayName || 'Anônimo',
          provincia: user.provinciaTemp || user.provincia || 'Não especificado',
          distrito: user.distrito || 'Não especificado',
          contacto: user.contacto || user.phoneNumber || 'Não especificado',
          sector: user.sector || 'Não especificado',
          email: user.email || 'Não especificado'
        };
      }
      
      await update(ref(db), updates);
      
      const clickData = {
        storeId,
        userId: user?.id || 'anonymous',
        timestamp,
        userAgent: navigator.userAgent,
        page: 'Pagina Inicial'
      };
      
      const clickRef = push(ref(db, 'clicks'));
      await set(clickRef, clickData);
      
    } catch (error) {
      console.error("Erro ao registrar clique:", error);
    }
  };

  // Buscar lojas
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const storesRef = ref(db, "stores");
        const snapshot = await get(storesRef);
        
        if (snapshot.exists()) {
          const storesData = Object.entries(snapshot.val()).map(([id, store]) => ({ 
            id, 
            ...store,
            products: store.products || {},
            settings: store.settings || { showPrices: true }
          }));
  
          const filtered = !user ? storesData : 
            (userProvince 
              ? storesData.filter(store => store.company?.provincia === userProvince)
              : storesData);
  
          setStores(filtered);
          
          filtered.forEach(store => {
            trackInteraction('store', 'impression', store.id);
          });
        } else {
          setStores([]);
        }
      } catch (error) {
        console.error("Erro ao buscar lojas:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStores();
  }, [user, userProvince]);

  useEffect(() => {
    if (!user?.id) return;

    const cartRef = ref(db, `cart/${user.id}`);
    const unsubscribe = onValue(cartRef, (snapshot) => {
      const data = snapshot.val();
      const count = data 
        ? Object.values(data).reduce((sum, item) => sum + item.quantity, 0)
        : 0;
      setCartItemCount(count);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Função para adicionar ao carrinho
  const addToCart = async (product) => {
    try {
      const cartRef = ref(db, `cart/${user.id}/${product.id}`);
      
      const snapshot = await get(cartRef);
      
      if (snapshot.exists()) {
        const currentQuantity = snapshot.val().quantity || 1;
        await update(cartRef, {
          quantity: currentQuantity + 1
        });
      } else {
        await set(cartRef, {
          productId: product.id,
          storeId: product.storeId,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          discountPrice: product.discountPrice || null,
          storeName: product.storeName,
          quantity: 1,
          addedAt: new Date().toISOString()
        });
      }
      
      const productRef = ref(db, `stores/${product.storeId}/products/${product.id}/cartAdds`);
      await set(productRef, increment(1));
      
      setSnackbarMessage(`${product.name} adicionado ao carrinho!`);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      setSnackbarMessage('Erro ao adicionar ao carrinho');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  // Função de checkout
  const handleCheckout = async () => {
    try {
      const orderRef = push(ref(db, 'orders'));
      const orderId = orderRef.key;
      
      const cartSnapshot = await get(ref(db, `cart/${user.id}`));
      const cartItems = cartSnapshot.val() || {};
      
      await set(orderRef, {
        id: orderId,
        userId: user.id,
        storeId: Object.values(cartItems)[0]?.storeId,
        items: Object.entries(cartItems).reduce((acc, [id, item]) => {
          acc[id] = {
            productId: item.productId,
            quantity: item.quantity,
            price: item.discountPrice || item.price
          };
          return acc;
        }, {}),
        total: Object.values(cartItems).reduce((sum, item) => {
          return sum + ((item.discountPrice || item.price) * item.quantity);
        }, 0),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      await remove(ref(db, `cart/${user.id}`));
      
      setSnackbarMessage('Pedido realizado com sucesso!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      navigate(`/order/${orderId}`);
      setCartOpen(false);
      
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      setSnackbarMessage('Erro ao finalizar pedido');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };



  // Produtos com memoização e registro de impressão
  const products = useMemo(() => {
    const prods = stores.flatMap(store => 
      Object.entries(store.products || {}).map(([id, product]) => ({
        ...product,
        id,
        storeId: store.id,
        storeName: store.name || "Loja Desconhecida",
        storeLogo: store.company?.logo,
        storeSettings: store.settings || { showPrices: true }
      }))
    ).filter(product => 
      searchQuery ? 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    );

    prods.forEach(product => {
      trackInteraction('product', 'impression', product.id, product.storeId);
    });

    return prods;
  }, [stores, searchQuery]);

  // Lojas em destaque
  const featuredStores = useMemo(() => {
    return stores
      .filter(store => Object.keys(store.products || {}).length > 0)
      .slice(0, 10);
  }, [stores]);

  // Produtos em promoção
  const discountedProducts = useMemo(() => {
    return products.filter(product => 
      product.discountPrice && product.discountPrice < product.price
    ).slice(0, 8);
  }, [products]);

  // Produtos mais vendidos (simulado)
  const bestSellingProducts = useMemo(() => {
    return [...products].sort(() => Math.random() - 0.5).slice(0, 8);
  }, [products]);

  // Manipuladores de compartilhamento
  const handleShareOpen = (event, productId) => {
    event.preventDefault();
    event.stopPropagation();
    setSharedProduct(productId);
    setShareAnchor(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareAnchor(null);
    setSharedProduct(null);
  };

  const shareProduct = (platform) => {
    if (!sharedProduct) return;
    
    const url = `${window.location.origin}/product/${sharedProduct}`;
    let shareUrl = '';
    
    switch(platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=Confira este produto: ${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        handleShareClose();
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank');
    handleShareClose();
  };

  // Calcular desconto
  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  // Componente de preço
  const PriceDisplay = ({ product }) => {
    if (product.storeSettings.showPrices === false) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <VisibilityOff fontSize="small" color="disabled" />
          <Typography variant="body2" color="text.secondary">
            Preço sob consulta
          </Typography>
        </Box>
      );
    }

    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    
    return (
      <Box>
        {hasDiscount ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.error.main,
                  fontWeight: 'bold',
                }}
              >
                {formatPrice(product.discountPrice)} MT
              </Typography>
              <Chip
                label={`-${calculateDiscount(product.discountPrice, product.price)}%`}
                size="small"
                color="error"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                textDecoration: 'line-through',
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
            }}
          >
            {formatPrice(product.price || 0)} MT
          </Typography>
        )}
      </Box>
    );
  };

  // Componente de Link para produto com tracking
  const TrackedProductLink = ({ product, children }) => (
    <Link 
      to={`/product/${product.id}/store/${product.storeId}`}
      onClick={(e) => {
        e.preventDefault();
        trackClick(product.storeId)
          .then(() => {
            navigate(`/product/${product.id}/store/${product.storeId}`);
          });
      }}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {children}
    </Link>
  );

  // Componente de Link para loja com tracking
  const TrackedStoreLink = ({ store, children }) => (
    <Link 
      to={`/loja/${store.id}`}
      onClick={(e) => {
        e.preventDefault();
        trackClick(store.id)
          .then(() => {
            navigate(`/loja/${store.id}`);
          });
      }}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {children}
    </Link>
  );

  // Componente de Card de Produto
  const ProductCard = ({ product }) => (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: 0,
        border: '1px solid #e8e8e8',
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
        },
        position: 'relative',
        backgroundColor: '#fff',
        overflow: 'hidden'
      }}
    >
      {/* Badges */}
      {product.isNew && (
        <Chip
          label="NOVO"
          color="success"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            fontWeight: 'bold',
            zIndex: 1,
            fontSize: '10px',
            height: '20px'
          }}
        />
      )}

      {product.discountPrice && product.discountPrice < product.price && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: theme.palette.error.main,
            color: 'white',
            borderRadius: '12px',
            padding: '2px 6px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 1
          }}
        >
          -{calculateDiscount(product.discountPrice, product.price)}%
        </Box>
      )}


      <CardActionArea 
        component={TrackedProductLink} 
        product={product}
        sx={{ flexGrow: 1 }}
      >
        {/* Imagem do produto */}
        <Box
          sx={{
            width: "100%",
            height: isMobile ? 140 : 200,
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
            image={product.imageUrl || '/placeholder-product.png'}
            alt={product.name}
            sx={{
              width: "auto",
              height: "85%",
              objectFit: "contain",
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
            loading="lazy"
            onError={(e) => {
              e.target.src = '/placeholder-product.png';
            }}
          />
        </Box>

        {/* Detalhes do produto */}
        <CardContent sx={{ p: 2, flexGrow: 1 }}>
          {/* Nome do produto */}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: 40,
              fontSize: '0.9rem'
            }}
          >
            {product.name}
          </Typography>

          {/* Loja */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Avatar 
              src={product.storeLogo} 
              sx={{ width: 20, height: 20, mr: 1 }} 
            />
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '0.75rem'
              }}
            >
              {product.storeName}
            </Typography>
          </Box>

          {/* Preço */}
          <Box sx={{ mt: 'auto' }}>
            <PriceDisplay product={product} />
          </Box>
        </CardContent>
      </CardActionArea>

      {/* Ações do Produto */}
      <Box sx={{ 
        p: 1.5, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fafafa'
      }}>
        {/* Botão de Adicionar ao Carrinho */}
        <Tooltip title="Adicionar ao carrinho">
          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<AddShoppingCart fontSize="small" />}
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                window.location.href = '/auth';
              } else {
                addToCart(product);
              }
            }}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              borderRadius: 1,
              px: 1.5,
              py: 0.5
            }}
          >
            Carrinho
          </Button>
        </Tooltip>

        {/* Botão de Compartilhar */}
        <Tooltip title="Compartilhar">
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleShareOpen(e, product.id);
            }}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.primary.main
              }
            }}
          >
            <Share fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );

  return (
    <Box sx={{ 
      p: isMobile ? 1 : 3, 
      backgroundColor: '#f5f7fa',
      minHeight: '100vh'
    }}>
      

      {user && !hasMarket && user.type !== 'singular' && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => window.location = '/pagamento-modulo/moduloMarket'}>
              Ativar Módulo
            </Button>
          }
          sx={{ mb: 2, maxWidth: 1400, mx: 'auto' }}
        >
          O módulo Mercado está inativo. Ative o módulo para usar este serviço.
        </Alert>
      )}

      {/* Header Principal */}
      <Paper elevation={0} sx={{ 
        maxWidth: 1400, 
        mx: 'auto', 
        mb: 3,
        p: 3,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: "bold", mb: 1 }}>
             Mercado 
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Encontre produtos e serviços de diversas lojas locais
              {userProvince && ` em ${userProvince}`}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Pesquisar produtos..."
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ 
                minWidth: isMobile ? '100%' : 300,
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  color: 'text.primary'
                }
              }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                )
              }}
            />
            
            <Tooltip title="Carrinho de Compras">
              <IconButton 
                onClick={() => {
                  if (!user) {
                    window.location.href = '/auth';
                  } else {
                    setCartOpen(true);
                  }
                }}
                sx={{ 
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)'
                  }
                }}
              >
                <Badge 
                  badgeContent={cartItemCount} 
                  color="error"
                >
                  <ShoppingCartCheckout />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Seção de Lojas em Destaque */}
      {featuredStores.length > 0 && (
        <Box sx={{ maxWidth: 1400, mx: 'auto', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
              <Store color="primary" />
              Lojas em Destaque
            </Typography>
            <Button 
              variant="text" 
              size="small" 
              endIcon={<NavigateNext />}
              onClick={() => navigate('/lojas')}
            >
              Ver todas
            </Button>
          </Box>
          
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: 'white' }}>
            <Box sx={{
              display: "flex",
              overflowX: "auto",
              gap: 2,
              py: 1,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.primary.main,
                borderRadius: 3,
              },
            }}>
              {featuredStores.map((store) => (
                <Tooltip key={store.id} title={store.name} arrow>
                  <TrackedStoreLink store={store}>
                    <Box sx={{
                      minWidth: 100,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid #e8e8e8',
                      transition: 'all 0.2s',
                      '&:hover': { 
                        backgroundColor: '#f8f9fa',
                        transform: 'translateY(-2px)',
                        boxShadow: 1
                      }
                    }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          store.company?.verified ? (
                            <Verified fontSize="small" color="primary" />
                          ) : null
                        }
                      >
                        <Avatar
                          src={store.company?.logo}
                          sx={{
                            width: 60,
                            height: 60,
                            border: `2px solid ${theme.palette.primary.main}`,
                          }}
                        >
                          {(store.name || '').charAt(0)}
                        </Avatar>
                      </Badge>
                      <Typography
                        variant="body2"
                        sx={{ 
                          mt: 1,
                          fontWeight: 500,
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '90%'
                        }}
                      >
                        {store.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Object.keys(store.products || {}).length} produtos
                      </Typography>
                    </Box>
                  </TrackedStoreLink>
                </Tooltip>
              ))}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Seção de Ofertas Especiais */}
      {discountedProducts.length > 0 && (
        <Box sx={{ maxWidth: 1400, mx: 'auto', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocalFireDepartment color="error" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Ofertas Quentes
            </Typography>
            <Chip 
              label="LIMITADO" 
              size="small" 
              color="error" 
              variant="outlined"
              sx={{ ml: 1 }}
            />
          </Box>
          
          <Grid container spacing={2}>
            {discountedProducts.map((product) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={`${product.storeId}-${product.id}`}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Listagem principal de produtos */}
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Todos os Produtos'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {products.length} {products.length === 1 ? 'produto' : 'produtos'} encontrado(s)
          </Typography>
        </Box>

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
          <>
            {products.length > 0 ? (
              <Grid container spacing={2}>
                {products.map((product) => (
                  <Grid item xs={6} sm={4} md={3} lg={2.4} key={`${product.storeId}-${product.id}`}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper elevation={0} sx={{ 
                p: 4, 
                textAlign: 'center',
                borderRadius: 2,
                backgroundColor: 'white'
              }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {searchQuery ? "Nenhum produto encontrado" : "Nenhum produto disponível"}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {searchQuery 
                    ? "Tente ajustar os termos da sua pesquisa" 
                    : "As lojas ainda não adicionaram produtos ao catálogo"}
                </Typography>
                {searchQuery && (
                  <Button 
                    variant="outlined" 
                    onClick={() => setSearchQuery('')}
                    startIcon={<Search />}
                  >
                    Limpar pesquisa
                  </Button>
                )}
              </Paper>
            )}
          </>
        )}
      </Box>

      {/* Menu de compartilhamento */}
      <Menu
        anchorEl={shareAnchor}
        open={Boolean(shareAnchor)}
        onClose={handleShareClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => shareProduct('whatsapp')}>
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
        <MenuItem onClick={() => shareProduct('facebook')}>
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
        <MenuItem onClick={() => shareProduct('twitter')}>
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
        <MenuItem onClick={() => shareProduct('copy')}>
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copiar link</ListItemText>
        </MenuItem>
      </Menu>

      {/* Carrinho de compras */}
      <MyCart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        userId={user?.id}
        onCheckout={handleCheckout}
      />

      {/* Botão flutuante para carrinho em mobile */}
      {isMobile && cartItemCount > 0 && (
        <Fab
          color="primary"
          aria-label="carrinho"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => setCartOpen(true)}
        >
          <Badge badgeContent={cartItemCount} color="error">
            <ShoppingCartCheckout />
          </Badge>
        </Fab>
      )}
    </Box>
  );
};

export default StoresDesk;