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
  Badge,
  useTheme,
} from "@mui/material";
import BackButton from "../BackButton";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import { formatPrice } from "../../utils/utils";

const ProductDetailsDesk = () => {
  const { productId, store } = useParams();
  const navigate = useNavigate();  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [views, setViews] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const IVA_PERCENTAGE = 16;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
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
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Erro ao buscar os detalhes do produto:", error);
      }
      setLoading(false);
    };

    fetchProductDetails();
  }, [productId, store]);

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
            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom fontWeight="bold">
              {product.name}
            </Typography>
            
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Rating 
                value={product.rating || 4.5} 
                precision={0.5} 
                readOnly 
                size={isMobile ? "small" : "medium"}
              />
              <Typography variant="body2" color="text.secondary">
                ({product.reviewCount || 24} avaliações)
              </Typography>
              <Box display="flex" alignItems="center" ml={2}>
                <RemoveRedEyeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" ml={0.5}>
                  {views + 1} visualizações
                </Typography>
              </Box>
            </Stack>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>
            
            <Box sx={{ 
              backgroundColor: '#f9f9f9', 
              p: 2, 
              borderRadius: 1,
              mb: 3
            }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalShippingIcon color="success" />
                <Typography variant="body2">
                  Entrega grátis para Maputo e Matola
                </Typography>
              </Stack>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Pricing Section */}
            <Box sx={{ mb: 3 }}>
              {product.discountPrice ? (
                <>
                  <Typography variant={isMobile ? "h5" : "h4"} color="error" fontWeight="bold">
                    {product.discountPrice} MT
                  </Typography>
                  <Typography variant="body1" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  {formatPrice(product.price || "0")}MT
                  </Typography>
                </>
              ) : (
                <Typography variant={isMobile ? "h5" : "h4"} color="primary" fontWeight="bold">
                                  {formatPrice(product.price || "0")}MT
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
                  <Typography variant="body2">{total.toFixed(2)} MT</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">IVA ({IVA_PERCENTAGE}%):</Typography>
                  <Typography variant="body2">{iva.toFixed(2)} MT</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body1" fontWeight="bold">Total:</Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {totalWithIva.toFixed(2)} MT
                  </Typography>
                </Box>
              </Stack>
            </Box>
            
            {/* Action Buttons */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={addToCart}
                sx={{ flex: 1 }}
              >
                Adicionar ao Carrinho
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<VerifiedIcon />}
                onClick={handlePayment}
                sx={{ flex: 1 }}
              >
                Comprar Agora
              </Button>
            </Stack>
          </CardContent>
        </Box>
      </Box>
    </Container>
  );
};

export default ProductDetailsDesk;