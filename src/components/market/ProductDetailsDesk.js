import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";  
import { ref, get, update, increment } from "firebase/database";
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
  Rating,
  useMediaQuery,
  IconButton,
  Avatar,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Link
} from "@mui/material";
import BackButton from "../BackButton";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import StoreIcon from '@mui/icons-material/Store';
import { formatPrice } from "../../utils/utils";

const ProductDetailsDesk = () => {
  const { productId, store } = useParams();
  const navigate = useNavigate();  
  const [product, setProduct] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [views, setViews] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const IVA_PERCENTAGE = 16;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const addToCart = () => {
    if (product) {
      alert(
        `${quantity} x ${product.name} foi adicionado ao carrinho por um total de ${(product.price * quantity).toFixed(
          2
        )} MT (sem IVA).`
      );
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

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
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
            {product.discountPrice && (
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
          
          {/* Action Buttons */}
          <Box sx={{ 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1
          }}>
            <IconButton 
              onClick={toggleFavorite}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.8)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
              }}
            >
              <FavoriteBorderIcon color={isFavorite ? "error" : "action"} />
            </IconButton>
            <IconButton 
              onClick={handleOpenShareMenu}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.8)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
              }}
            >
              <ShareIcon />
            </IconButton>
          </Box>
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
                <Avatar 
                  src={storeInfo.company.logo} 
                  alt={storeInfo.company.nome}
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    mr: 2,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {storeInfo.company.nome}
                  </Typography>
                </Box>
                <a 
                  href={`/loja/${store}`} // ou store.slug, conforme o que usas na rota
                  variant="outlined" 
                  size="small" 
                  startIcon={<StoreIcon />}
                  sx={{ ml: 'auto' }}
                >
                  Ver Loja
                </a>
              </Box>
            )}

            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom fontWeight="bold">
              {product.name}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Pricing Section */}
            <Box sx={{ mb: 3 }}>
              {product.discountPrice ? (
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
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {IVA_PERCENTAGE}% IVA incluído
              </Typography>
            </Box>
            
            {/* Quantity Selector */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Quantidade:
              </Typography>
              <TextField
                type="number"
                value={quantity}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(100, Number(e.target.value)));
                  setQuantity(value);
                }}
                inputProps={{ min: 1, max: 100 }}
                size="small"
                sx={{ width: "100px", mr: 2 }}
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
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">IVA ({IVA_PERCENTAGE}%):</Typography>
                  <Typography variant="body2">{formatPrice(iva)} MT</Typography>
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
            
 
          </CardContent>
        </Box>
      </Box>

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