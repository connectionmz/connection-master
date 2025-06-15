import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ref, get, set, push, increment, onValue, update, remove } from "firebase/database";
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
  Tooltip,
  Badge,
  InputAdornment,
  Button,
  Alert
} from "@mui/material";
import {
  Share,
  Verified,
  LocalMall,
  Store,
  VisibilityOff,
  Search,
  ShoppingCartCheckout,
  Add,
  AddShoppingCart
} from "@mui/icons-material";
import { formatPrice } from "../../utils/utils";
import MyCart from "./ShoppingCart";

const StoresDesk = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const navigate = useNavigate();
  // Dados do usuário protegidos
  const userId = user?.id || 'anonymous';
  const userProvince = user?.provinciaTemp || user?.provincia || null;


  const hasMarket = user?.activeModules?.moduloMarket?.status=== "active"
  
  // Registrar impressão ou clique
  const trackInteraction = async (type, action, itemId, storeId = null) => {
    try {
      const timestamp = Date.now();
      
      if (action === 'click') {
        const updates = {};
        
        // Atualizações para métricas de anúncios/lojas
        updates[`anuncios_metrics/${storeId}/total_cliques`] = increment(1);
        updates[`loja_metrics/${storeId}/ultimo_clique`] = timestamp;
        updates[`loja_metrics/${storeId}/from`] = 'Pagina Inicial';
        
        // Adiciona informações da empresa se o usuário estiver logado
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
        
        // Aplica todas as atualizações de uma vez
        await update(ref(db), updates);
        
        // Registro adicional para analytics (opcional)
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
        await set(clickRef, clickData);
      }
      
    } catch (error) {
      console.error("Erro ao registrar interação:", error);
    }
  };

  const trackClick = async (storeId) => {
    try {
      const timestamp = Date.now();
      const updates = {};
      
      // Atualizações para métricas
      updates[`loja_metrics/${storeId}/total_cliques`] = increment(1);
      updates[`loja_metrics/${storeId}/ultimo_clique`] = timestamp;
      updates[`loja_metrics/${storeId}/from`] = 'Pagina Inicial';
      
      // Adiciona informações da empresa se o usuário estiver logado
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
      
      // Aplica todas as atualizações
      await update(ref(db), updates);
      
      // Registro adicional para analytics
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
  
          // Exibe todas as lojas se user não existir
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
  }, [user, userProvince]); // Adicionei user como dependência

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
      
      // Verificar se o item já existe no carrinho
      const snapshot = await get(cartRef);
      
      if (snapshot.exists()) {
        // Atualizar quantidade se já existir
        const currentQuantity = snapshot.val().quantity || 1;
        await update(cartRef, {
          quantity: currentQuantity + 1
        });
      } else {
        // Adicionar novo item ao carrinho
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
      
      // Atualizar contador de cliques para o produto
      const productRef = ref(db, `stores/${product.storeId}/products/${product.id}/cartAdds`);
      await set(productRef, increment(1));
      
      // Feedback para o usuário
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
      // 1. Criar pedido
      const orderRef = push(ref(db, 'orders'));
      const orderId = orderRef.key;
      
      // 2. Obter itens do carrinho
      const cartSnapshot = await get(ref(db, `cart/${user.id}`));
      const cartItems = cartSnapshot.val() || {};
      
      // 3. Salvar dados do pedido
      await set(orderRef, {
        id: orderId,
        userId: user.id,
        storeId: Object.values(cartItems)[0]?.storeId, // Assumindo um pedido por loja
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
      
      // 4. Limpar carrinho
      await remove(ref(db, `cart/${user.id}`));
      
      // 5. Feedback e redirecionamento
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

    // Registrar impressões dos produtos visíveis
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

// Componente de Link para produto com tracking - VERSÃO CORRIGIDA
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

// Componente de Link para loja com tracking - VERSÃO CORRIGIDA
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

  return (
    <Box sx={{ 
      p: isMobile ? 2 : 4, 
      backgroundColor: '#f8f8f8',
      minHeight: '100vh'
    }}>
        {user && !hasMarket && user.type !== 'singular' && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={() => window.location = '/market'}>
                Ativar Módulo Mercado
              </Button>
            }
            sx={{ mb: 2 }}
          >
            O módulo Mercado está inativo. Para usar este serviço, ative o módulo Mercado.
          </Alert>
        )}

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
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
            fontWeight: "bold",
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <LocalMall fontSize="large" />
            Lojas e Produtos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.provinciaTemp || user?.provincia ? 
              `Mostrando lojas da província de ${user.provinciaTemp || user.provincia}` : 
              'Mostrando todas lojas disponíveis'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="Pesquisar produto..."
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
                sx={{ position: 'relative' }}
              >
              <Badge 
                badgeContent={cartItemCount} 
                color="primary"
              >
                <ShoppingCartCheckout />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {/* Lojas em destaque */}
      {featuredStores.length > 0 && (
  <Box sx={{ 
    maxWidth: 1400,
    mx: 'auto',
    mb: 4,
    p: 2,
    backgroundColor: '#fff',
    borderRadius: 2,
    boxShadow: 1
  }}>
    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Store color="primary" />
      Lojas disponíveis
    </Typography>
    
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
      {(featuredStores || []).map((store) => (
       <Tooltip key={store?.id} title={store?.name || "Loja sem nome"} arrow>
       <TrackedStoreLink store={store}>
         <Box sx={{
           minWidth: 120,
           display: "flex",
           flexDirection: "column",
           alignItems: "center",
           p: 1,
           borderRadius: 1,
           '&:hover': { backgroundColor: '#f5f5f5' }
         }}>
           <Badge
             overlap="circular"
             anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
             badgeContent={
               store?.company?.verified ? (
                 <Verified fontSize="small" color="primary" />
               ) : null
             }
           >
             <Avatar
               src={store?.company?.logo}
               sx={{
                 width: 80,
                 height: 80,
                 border: `2px solid ${theme.palette.primary.main}`,
               }}
             >
               {(store?.name || '').charAt(0)}
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
               maxWidth: '100%'
             }}
           >
             {store?.name || "Loja sem nome"}
           </Typography>
         </Box>
       </TrackedStoreLink>
     </Tooltip>
      ))}
    </Box>
  </Box>
)}

      {/* Listagem de produtos */}
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
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          {products.length > 0 ? (
            <Grid container spacing={isMobile ? 1 : 3}>
              {products.map((product) => (
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
                      backgroundColor: '#fff'
                    }}
                  >
                    {/* Badges */}
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
                      component={TrackedProductLink} 
                      product={product}
                      sx={{ flexGrow: 1 }}
                    >
                        {/* Imagem do produto */}
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
                            image={product.imageUrl}
                            alt={product.name}
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

                        {/* Detalhes do produto */}
                        <CardContent sx={{ p: 2 }}>
                          {/* Nome do produto */}
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 500,
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              minHeight: 44
                            }}
                          >
                            {product.name}
                          </Typography>

                          {/* Loja */}
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
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
                                textOverflow: 'ellipsis'
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
  p: 1, 
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
  startIcon={<AddShoppingCart fontSize={isMobile ? "small" : "medium"} />}
  onClick={(e) => {
    e.stopPropagation();
    if (!user) {
      window.location.href = '/auth';
    } else {
      addToCart(product);
    }
  }}
  sx={{
    ml: 1,
    textTransform: 'none',
    fontSize: isMobile ? '0.75rem' : '0.875rem'
  }}
>
  {isMobile ? 'Adicionar' : 'Adicionar ao carrinho'}
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
        color: theme.palette.primary.main,
        '&:hover': {
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.dark
        }
      }}
    >
      <Share fontSize={isMobile ? "small" : "medium"} />
    </IconButton>
  </Tooltip>
</Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ 
              width: '100%', 
              textAlign: 'center', 
              p: 4,
              backgroundColor: '#fff',
              borderRadius: 2,
              boxShadow: 1
            }}>
              <Typography variant="h6" color="text.secondary">
                {searchQuery ? "Nenhum produto encontrado" : "Nenhum produto disponível"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {searchQuery 
                  ? "Tente ajustar sua pesquisa" 
                  : "As lojas ainda não adicionaram produtos"}
              </Typography>
            </Box>
          )}
        </Box>
      )}

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
      <MyCart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        userId={user?.id}
        onCheckout={handleCheckout}
      />
    </Box>
  );
};

export default StoresDesk;