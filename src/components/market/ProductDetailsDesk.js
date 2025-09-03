import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";  
import { ref, get, update, increment, set } from "firebase/database";
import { db } from "../../fb";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Divider,
  Stack,
  useMediaQuery,
  IconButton,
  Avatar,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Link,
  Snackbar
} from "@mui/material";
import BackButton from "../BackButton";
import ShareIcon from '@mui/icons-material/Share';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import StoreIcon from '@mui/icons-material/Store';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { formatPrice } from "../../utils/utils";

const ProductDetailsDesk = ({user}) => {
  const { productId, store } = useParams();
  const navigate = useNavigate();  
  const [product, setProduct] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [views, setViews] = useState(0);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const IVA_PERCENTAGE = 0;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch product details
        const productRef = ref(db, `stores/${store}/products/${productId}`);
        const productSnapshot = await get(productRef);
        
        if (productSnapshot.exists()) {
          const productData = productSnapshot.val();
          setProduct(productData);
          setViews(productData.views || 0);
          
          // Update view count
          await update(ref(db, `stores/${store}/products/${productId}`), {
            views: increment(1)
          });

          // Fetch store/company information
          const storeRef = ref(db, `stores/${store}`);
          const storeSnapshot = await get(storeRef);
          if (storeSnapshot.exists()) {
            setStoreInfo(storeSnapshot.val());
          }
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [productId, store]);

  const handleOpenShareMenu = (event) => {
    event.preventDefault();
    setShareAnchorEl(event.currentTarget);
  };

  const handleCloseShareMenu = () => {
    setShareAnchorEl(null);
  };

  const shareOnPlatform = (platform) => {
    const productUrl = `${window.location.origin}/product/${productId}/store/${store}`;
    let shareUrl = '';
    
    switch(platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=Confira este produto: ${product.name} - ${productUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=Confira este produto: ${product.name}`;
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

  const addToCart = async () => {
    if (!product || !user?.id) return;
  
    try {
      const cartRef = ref(db, `cart/${user.id}/${productId}`);
      
      const cartItem = {
        productId: productId,
        storeId: store,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
        discountPrice: product.discountPrice || null,
        storeName: storeInfo?.company?.nome || "Loja Desconhecida",
        quantity: quantity,
        addedAt: new Date().toISOString()
      };
  
      // Verificar se o item já existe no carrinho
      const snapshot = await get(cartRef);
      
      if (snapshot.exists()) {
        // Atualizar quantidade se já existir
        await update(cartRef, {
          quantity: (snapshot.val().quantity || 0) + quantity
        });
      } else {
        // Adicionar novo item ao carrinho
        await set(cartRef, cartItem);
      }
      
      // Atualizar contador de adições ao carrinho para o produto
      const productRef = ref(db, `stores/${store}/products/${productId}`);
      await update(productRef, {
        cartAdds: (product.cartAdds || 0) + 1
      });
      
      // Feedback para o usuário
      setSnackbarMessage(`${quantity} x ${product.name} adicionado ao carrinho!`);
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      setSnackbarMessage('Erro ao adicionar ao carrinho');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };
  

  const handlePayment = () => {
    const total = product.price * quantity;
    const iva = (total * IVA_PERCENTAGE) / 100;
    const totalWithIva = total + iva;
  
    navigate('/checkout', {
      state: {
        product: {
          name: product.name,
          priceWithIVA: totalWithIva,
          quantity: quantity,
          imageUrl: product.imageUrl,
          storeId: store
        },
      },
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Alert severity="error">Produto não encontrado.</Alert>
      </Box>
    );
  }

  const total = product.price * quantity;
  const iva = (total * IVA_PERCENTAGE) / 100;
  const totalWithIva = total + iva;

  // Verifica se a loja permite mostrar preços
  const showPrices = storeInfo?.settings?.showPrices !== false;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <BackButton sx={{ mb: 2 }} />
      
      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={4}>
        {/* Product Image Section */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
            <CardMedia
              component="img"
              height={isMobile ? 300 : 500}
              image={product.imageUrl || "https://via.placeholder.com/500"}
              alt={product.name}
              sx={{ objectFit: 'contain', backgroundColor: '#f5f5f5' }}
            />
          </Card>
          
          {/* Product Badges */}
          <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 1 }}>
            {showPrices && product.discountPrice && (
              <Chip
                label={`-${Math.round(((product.price - product.discountPrice) / product.price) * 100)}%`}
                color="error"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
            {product.isNew && (
              <Chip
                label="Novo"
                color="success"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Box>
          
          {/* Share Button - Moved to bottom right */}
          <IconButton 
            onClick={handleOpenShareMenu}
            sx={{ 
              position: 'absolute', 
              bottom: 16, 
              right: 16,
              backgroundColor: 'rgba(255,255,255,0.8)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
            }}
          >
            <ShareIcon />
          </IconButton>
        </Box>

        {/* Product Details Section */}
        <Box sx={{ flex: 1 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Company Info */}
            {storeInfo?.company && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                p: 1.5,
                backgroundColor: '#f9f9f9',
                borderRadius: 1
              }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    storeInfo.company.verified ? (
                      <VerifiedIcon color="primary" fontSize="small" />
                    ) : null
                  }
                >
                  <Avatar 
                    src={storeInfo.company.logo} 
                    alt={storeInfo.company.nome}
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      mr: 2,
                      border: `1px solid ${theme.palette.divider}`
                    }}/>
                </Badge>
                <a href={`/perfil/${storeInfo.company.id}`} style={{ textDecoration: 'none', cursor:'pointer' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    {storeInfo.company.nome}
                  </Typography>
                <Typography variant="body2" color="text.secondary">
                  {storeInfo.company.provincia}
                </Typography>
              </Box>
              </a>
                <Button 
                  component={Link}
                  href={`/loja/${store}`}
                  variant="outlined" 
                  size="small" 
                  startIcon={<StoreIcon />}
                  sx={{ ml: 'auto' }}
                >Ver Loja
                </Button>
              </Box>
            )}
            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom fontWeight="bold">
              {product.name}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              {showPrices ? (
                product.discountPrice ? (
                  <>
                    <Typography variant={isMobile ? "h5" : "h4"} color="error" fontWeight="bold">
                      {formatPrice(product.discountPrice)} MT
                    </Typography>
                    <Typography variant="body1" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                      {formatPrice(product.price)} MT
                    </Typography>
                  </>
                ) : (
                  <Typography variant={isMobile ? "h5" : "h4"} color="primary" fontWeight="bold">
                    {formatPrice(product.price)} MT
                  </Typography>
                )
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VisibilityOffIcon color="disabled" />
                  <Typography variant="h6" color="text.secondary">
                    Preço sob consulta
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Quantity Selector - Only show if prices are visible */}
            {showPrices && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Quantidade:
                  </Typography>
<TextField
  type="number"
  value={quantity}
  onChange={(e) => {
    const value = e.target.value;
    if (
      value === '' ||
      (Number(value) >= 1 && Number(value) <= Number(product.qtd))
    ) {
      setQuantity(value);
    }
  }}
  onBlur={(e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > Number(product.qtd)) val = Number(product.qtd);
    setQuantity(val);
  }}
  inputProps={{
    min: 1,
    max: Number(product.qtd),
    'aria-label': `Quantidade (disponível: ${product.qtd})`
  }}
  size="small"
  sx={{ width: '100px', mr: 2 }}
  error={quantity > Number(product.qtd)}
  helperText={
    !product.qtd || Number(product.qtd) === 0
      ? 'Sem stock disponível'
      : quantity > Number(product.qtd)
      ? `Quantidade máxima: ${product.qtd}`
      : ''
  }
  disabled={!product.qtd || Number(product.qtd) === 0}
/>



                </Box>
                
                {/* Order Summary */}
                <Box sx={{ 
                  backgroundColor: '#f5f5f5', 
                  p: 2, 
                  borderRadius: 1,
                  mb: 3
                }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Resumo do Pedido
                  </Typography>
                  
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Subtotal ({quantity} itens):</Typography>
                      <Typography variant="body2">{formatPrice(total)} MT</Typography>
                    </Box>
                  
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1" fontWeight="bold">Total:</Typography>
                      <Typography variant="body1" fontWeight="bold" color="primary">
                        {formatPrice(totalWithIva)} MT
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </>
            )}
            
            {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
  {showPrices ? (
    <>
      {user?.id !== storeInfo?.company?.id && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<ShoppingCartIcon />}
          onClick={addToCart}
          sx={{ flex: 1 }}
          disabled={!product.qtd || Number(product.qtd) === 0}
        >
          Adicionar ao Carrinho
        </Button>
      )}
    </>
  ) : (
    <Button
      variant="contained"
      color="primary"
      startIcon={<StoreIcon />}
      onClick={() => navigate(`/loja/${store}`)}
      sx={{ flex: 1 }}
    >
      Contactar Loja
    </Button>
  )}
</Box>
          </CardContent>
        </Box>
      </Box>
<Snackbar
  open={openSnackbar}
  autoHideDuration={6000}
  onClose={() => setOpenSnackbar(false)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert 
    onClose={() => setOpenSnackbar(false)} 
    severity={snackbarSeverity}
    sx={{ width: '100%' }}
  >
    {snackbarMessage}
  </Alert>
</Snackbar>
      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={handleCloseShareMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
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
    </Container>
  );
};

export default ProductDetailsDesk;