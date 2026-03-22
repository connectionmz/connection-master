import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ref, get, update, increment, set, remove } from "firebase/database";
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
  Snackbar,
  Tooltip,
  Collapse,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
} from "@mui/material";
import {
  Share as ShareIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Verified as VerifiedIcon,
  Store as StoreIcon,
  VisibilityOff as VisibilityOffIcon,
  Payment as PaymentIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Scale as ScaleIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Language as LanguageIcon,
  Close as CloseIcon,
  ContactSupport as ContactIcon,
} from "@mui/icons-material";
import BackButton from "../BackButton";
import { formatPrice } from "../../utils/utils";

const T = {
  navy:        '#08192E',
  navyMid:     '#0E2849',
  navyLight:   '#183A63',
  navyCard:    '#0D2240',
  gold:        '#C8903A',
  goldLight:   '#E8B96A',
  white:       '#FFFFFF',
  darkBorder:  'rgba(255,255,255,0.08)',
  darkBorderMid:'rgba(255,255,255,0.14)',
  darkText:    'rgba(255,255,255,0.88)',
  darkTextSub: 'rgba(255,255,255,0.52)',
  darkMuted:   'rgba(255,255,255,0.30)',
  success:     '#10b981',
  error:       '#ef4444',
  warning:     '#f59e0b',
};

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  .afu { animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both; }
`;

const BG_GRID = {
  position:'absolute', inset:0, pointerEvents:'none', opacity:0.02,
  backgroundImage:`linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize:'56px 56px',
};

const ProductDetailsDesk = ({ user }) => {
  const { productId, store } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [product, setProduct] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [showShippingDetails, setShowShippingDetails] = useState(false);
  const [openContactModal, setOpenContactModal] = useState(false);
  
  // Constantes de frete
  const IVA_PERCENTAGE = 0;
  const BASE_SHIPPING_FEE = 100;
  const SHIPPING_RATE_PER_KG = 50;

  // Estados para cálculo de frete
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingCalculated, setShippingCalculated] = useState(false);
  const [shippingError, setShippingError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const productRef = ref(db, `stores/${store}/products/${productId}`);
        const productSnapshot = await get(productRef);

        if (productSnapshot.exists()) {
          const productData = productSnapshot.val();
          productData.type = productData.type || "product";
          setProduct(productData);

          // Atualizar contador de visualizações
          await update(ref(db, `stores/${store}/products/${productId}`), {
            views: increment(1),
          });

          // Buscar informações da loja
          const storeRef = ref(db, `stores/${store}`);
          const storeSnapshot = await get(storeRef);
          if (storeSnapshot.exists()) {
            setStoreInfo(storeSnapshot.val());
          }

          // Calcular frete se necessário
          if (productData.nationalShipping && productData.weight) {
            calculateShipping(productData.weight, 1);
          } else if (productData.nationalShipping && !productData.weight) {
            setShippingError("Produto não possui peso definido");
            setShippingCalculated(false);
          }
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        showMessage("Erro ao carregar dados do produto", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, store]);

  const calculateShipping = (weight, qty = quantity) => {
    try {
      const productWeight = Number(weight);
      const totalWeight = productWeight * qty;

      if (isNaN(productWeight) || productWeight <= 0) {
        setShippingError("Peso do produto inválido");
        setShippingCalculated(false);
        return;
      }

      if (totalWeight > 1000) {
        setShippingError("Peso excede limite máximo (1000kg)");
        setShippingCalculated(false);
        return;
      }

      const calculatedShipping = BASE_SHIPPING_FEE + (totalWeight * SHIPPING_RATE_PER_KG);
      
      setShippingCost(calculatedShipping);
      setShippingCalculated(true);
      setShippingError("");
    } catch (error) {
      setShippingError("Erro ao calcular frete");
      setShippingCalculated(false);
    }
  };

  useEffect(() => {
    if (product?.nationalShipping && product?.weight) {
      calculateShipping(product.weight, quantity);
    }
  }, [quantity, product?.weight, product?.nationalShipping]);

  const showMessage = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleOpenShareMenu = (event) => {
    event.preventDefault();
    setShareAnchorEl(event.currentTarget);
  };

  const handleCloseShareMenu = () => {
    setShareAnchorEl(null);
  };

  const shareOnPlatform = (platform) => {
    const productUrl = `${window.location.origin}/product/${productId}/store/${store}`;
    
    if (platform === "copy") {
      navigator.clipboard.writeText(productUrl);
      showMessage("Link copiado!");
      handleCloseShareMenu();
      return;
    }

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(product.name + ' - ' + productUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(product.name)}`,
    };

    window.open(shareUrls[platform], "_blank", "noopener,noreferrer");
    handleCloseShareMenu();
  };

  const addToCart = async () => {
    if (!product || !user?.id) {
      navigate("/auth");
      return;
    }

    if (product.nationalShipping && !shippingCalculated && !shippingError) {
      showMessage("Aguarde o cálculo do frete", "warning");
      return;
    }

    try {
      const cartRef = ref(db, `cart/${user.id}/${productId}`);
      const cartItem = {
        productId,
        storeId: store,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.discountPrice || product.price,
        storeName: storeInfo?.company?.nome || "Loja",
        quantity: Number(quantity),
        addedAt: new Date().toISOString(),
        weight: product.weight || 0,
        nationalShipping: product.nationalShipping || false,
        shippingCost: product.nationalShipping ? shippingCost : 0,
      };

      const snapshot = await get(cartRef);
      if (snapshot.exists()) {
        await update(cartRef, {
          quantity: snapshot.val().quantity + Number(quantity),
        });
      } else {
        await set(cartRef, cartItem);
      }

      await update(ref(db, `stores/${store}/products/${productId}`), {
        cartAdds: increment(1),
      });

      showMessage(`${quantity}x ${product.name} adicionado ao carrinho`);
    } catch (error) {
      showMessage("Erro ao adicionar ao carrinho", "error");
    }
  };

  const handlePayment = () => {
    if (!product || !user?.id) {
      navigate("/auth");
      return;
    }

    if (product.nationalShipping && !shippingCalculated && !shippingError) {
      showMessage("Frete não disponível", "error");
      return;
    }

    const price = product.discountPrice || product.price;
    const subtotal = price * Number(quantity);
    const calculatedShippingCost = product.nationalShipping ? shippingCost : 0;
    const total = subtotal + calculatedShippingCost;

    navigate("/checkout", {
      state: {
        product: {
          productId,
          storeId: store,
          name: product.name,
          price,
          quantity: Number(quantity),
          imageUrl: product.imageUrl,
          storeName: storeInfo?.company?.nome || "Loja",
          shippingCost: calculatedShippingCost,
          subtotal,
          total,
          weight: Number(product.weight) || 0,
          nationalShipping: product.nationalShipping || false,
        },
      },
    });
  };

  const handleOpenContactModal = () => {
    setOpenContactModal(true);
  };

  const handleCloseContactModal = () => {
    setOpenContactModal(false);
  };

  const handleContactAction = (type, value) => {
    switch(type) {
      case 'phone':
        window.location.href = `tel:${value}`;
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${value.replace(/\D/g, '')}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:${value}`;
        break;
      case 'website':
        window.open(value, '_blank');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: T.navy, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={48} thickness={4} sx={{ color: T.gold }} />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: T.navy, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <Alert severity="error" sx={{ bgcolor: 'rgba(239,68,68,0.12)', color: T.white, border: '1px solid rgba(239,68,68,0.25)' }}>
          Produto não encontrado
        </Alert>
      </Box>
    );
  }

  const productType = product.type || "product";
  const price = Number(product.discountPrice) || Number(product.price) || 0;
  const subtotal = price * Number(quantity);
  const total = subtotal + (product.nationalShipping ? shippingCost : 0);
  const showPrices = storeInfo?.settings?.showPrices !== false;
  const outOfStock = product.qtd !== null && product.qtd !== undefined && Number(product.qtd) === 0;
  const isOwner = user?.id === storeInfo?.company?.id;

  return (
    <Box sx={{ backgroundColor: T.navy, minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <style>{KEYFRAMES}</style>
      
      {/* Header */}
      <Box sx={{ position: 'relative', background: `linear-gradient(160deg,${T.navy} 0%,${T.navyMid} 100%)`, borderBottom: `1px solid ${T.darkBorder}` }}>
        <Box sx={BG_GRID} />
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <BackButton sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }} />
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 }, position: 'relative' }}>
        <Box sx={BG_GRID} />
        
        <Grid container spacing={{ xs: 3, md: 6 }}>
          {/* Imagem do produto */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              bgcolor: T.navyCard, 
              border: `1px solid ${T.darkBorder}`,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Badges */}
              <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2, display: 'flex', gap: 1 }}>
                {showPrices && product.discountPrice && (
                  <Chip
                    label={`-${Math.round(((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100)}%`}
                    sx={{ bgcolor: T.error, color: T.white, fontWeight: 700, borderRadius: 2 }}
                  />
                )}
                {product.isNew && (
                  <Chip label="NOVO" sx={{ bgcolor: T.success, color: T.white, fontWeight: 700, borderRadius: 2 }} />
                )}
              </Box>

              <CardMedia
                component="img"
                height={isMobile ? 300 : 500}
                image={product.imageUrl || "https://via.placeholder.com/500"}
                alt={product.name}
                sx={{ objectFit: 'contain', bgcolor: T.navyCard, p: { xs: 2, md: 4 } }}
              />

              {/* Botão compartilhar */}
              <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 2 }}>
                <Tooltip title="Compartilhar">
                  <IconButton
                    onClick={handleOpenShareMenu}
                    sx={{ bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, '&:hover': { borderColor: T.gold } }}
                  >
                    <ShareIcon sx={{ color: T.darkText }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Grid>

          {/* Detalhes do produto */}
          <Grid item xs={12} md={6}>
            {/* Informações da loja */}
            {storeInfo?.company && (
              <Paper sx={{ 
                bgcolor: T.navyCard, 
                border: `1px solid ${T.darkBorder}`,
                borderRadius: 2,
                p: 2,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={storeInfo.company.verified ? (
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${T.navyCard}` }}>
                      <VerifiedIcon sx={{ fontSize: 10, color: T.white }} />
                    </Box>
                  ) : null}
                >
                  <Avatar src={storeInfo.company.logo} sx={{ width: 48, height: 48, border: `2px solid ${T.gold}` }}>
                    {storeInfo.company.nome?.[0]}
                  </Avatar>
                </Badge>

                <Box sx={{ flex: 1 }}>
                  <Link to={`/empresa/${storeInfo.company.slug}`} style={{ textDecoration: 'none' }}>
                    <Typography sx={{ fontWeight: 700, color: T.gold, '&:hover': { color: T.goldLight } }}>
                      {storeInfo.company.nome}
                    </Typography>
                  </Link>
                  <Typography variant="body2" sx={{ color: T.darkTextSub }}>
                    {storeInfo.company.provincia}
                  </Typography>
                </Box>

                <Button
                  component={Link}
                  to={`/loja/${store}`}
                  variant="outlined"
                  size="small"
                  startIcon={<StoreIcon />}
                  sx={{ borderColor: T.darkBorder, color: T.darkText, '&:hover': { borderColor: T.gold, color: T.gold } }}
                >
                  Ver Loja
                </Button>
              </Paper>
            )}

            {/* Título */}
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 800, color: T.white, mb: 2 }}>
              {product.name}
            </Typography>

            {/* Tags */}
            <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<CategoryIcon sx={{ fontSize: 14 }} />}
                label={product.category || "Sem categoria"}
                size="small"
                sx={{ bgcolor: 'rgba(200,144,58,0.12)', border: `1px solid rgba(200,144,58,0.25)`, color: T.goldLight }}
              />
              {product.sku && (
                <Chip
                  icon={<InventoryIcon sx={{ fontSize: 14 }} />}
                  label={`SKU: ${product.sku}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.06)', border: `1px solid ${T.darkBorder}`, color: T.darkText }}
                />
              )}
              <Chip
                label={productType === "product" ? "Produto" : "Serviço"}
                size="small"
                sx={{ 
                  bgcolor: productType === "product" ? 'rgba(200,144,58,0.12)' : 'rgba(16,185,129,0.12)',
                  border: `1px solid ${productType === "product" ? 'rgba(200,144,58,0.25)' : 'rgba(16,185,129,0.25)'}`,
                  color: productType === "product" ? T.goldLight : T.success
                }}
              />
              {productType === "product" && product.qtd !== undefined && (
                <Chip
                  icon={<InventoryIcon sx={{ fontSize: 14 }} />}
                  label={`Stock: ${product.qtd}`}
                  size="small"
                  sx={{ 
                    bgcolor: Number(product.qtd) > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${Number(product.qtd) > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    color: Number(product.qtd) > 0 ? T.success : T.error
                  }}
                />
              )}
            </Stack>

            {/* Descrição */}
            <Typography sx={{ color: T.darkTextSub, lineHeight: 1.6, mb: 3 }}>
              {product.description || "Nenhuma descrição fornecida."}
            </Typography>

            <Divider sx={{ my: 3, borderColor: T.darkBorder }} />

            {/* Preço */}
            <Box sx={{ mb: 3 }}>
              {showPrices ? (
                product.discountPrice ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant={isMobile ? "h4" : "h3"} sx={{ fontWeight: 800, color: T.error }}>
                        {formatPrice(Number(product.discountPrice))} MT
                      </Typography>
                      <Chip
                        label={`-${Math.round(((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100)}%`}
                        sx={{ bgcolor: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.3)', color: T.error, fontWeight: 700 }}
                      />
                    </Box>
                    <Typography sx={{ color: T.darkMuted, textDecoration: 'line-through' }}>
                      {formatPrice(Number(product.price))} MT
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant={isMobile ? "h4" : "h3"} sx={{ fontWeight: 800, color: T.gold }}>
                    {formatPrice(Number(product.price) || 0)} MT
                  </Typography>
                )
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VisibilityOffIcon sx={{ color: T.darkMuted }} />
                  <Typography sx={{ color: T.darkMuted }}>Preço sob consulta</Typography>
                </Box>
              )}
            </Box>

            {showPrices && productType === "product" && (
              <>
                {/* Quantidade */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontWeight: 600, color: T.white, mb: 1, fontSize: '0.9rem' }}>
                    Quantidade:
                  </Typography>
                  <TextField
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || (Number(val) >= 1 && Number(val) <= Number(product.qtd || Infinity))) {
                        setQuantity(val);
                      }
                    }}
                    onBlur={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val) || val < 1) val = 1;
                      if (product.qtd && val > Number(product.qtd)) val = Number(product.qtd);
                      setQuantity(val);
                    }}
                    inputProps={{ min: 1, max: Number(product.qtd) || Infinity }}
                    size="small"
                    sx={{ 
                      width: '120px',
                      '& .MuiOutlinedInput-root': { 
                        bgcolor: 'rgba(255,255,255,0.06)', 
                        color: T.white,
                        '& fieldset': { borderColor: T.darkBorder },
                        '&:hover fieldset': { borderColor: T.gold }
                      }
                    }}
                    disabled={outOfStock}
                  />
                </Box>

                {/* Frete */}
                {product.nationalShipping && (
                  <Paper sx={{ bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: 2, mb: 3, overflow: 'hidden' }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', p: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}
                      onClick={() => setShowShippingDetails(!showShippingDetails)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalShippingIcon sx={{ color: T.gold }} />
                        <Typography sx={{ fontWeight: 600, color: T.white }}>Frete Nacional</Typography>
                      </Box>
                      {showShippingDetails ? <ExpandLessIcon sx={{ color: T.darkMuted }} /> : <ExpandMoreIcon sx={{ color: T.darkMuted }} />}
                    </Box>

                    <Collapse in={showShippingDetails}>
                      <Box sx={{ p: 2, borderTop: `1px solid ${T.darkBorder}` }}>
                        {shippingError ? (
                          <Alert severity="warning" icon={<WarningIcon />} sx={{ bgcolor: 'rgba(245,158,11,0.12)', color: T.warning, border: '1px solid rgba(245,158,11,0.25)' }}>
                            {shippingError}
                          </Alert>
                        ) : shippingCalculated ? (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: T.darkTextSub }}>
                              <Typography>Peso total:</Typography>
                              <Typography sx={{ color: T.white, fontWeight: 600 }}>{(Number(product.weight) * quantity).toFixed(2)} kg</Typography>
                            </Box>
                            <Divider sx={{ borderColor: T.darkBorder, my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontWeight: 600, color: T.white }}>Valor do frete:</Typography>
                              <Typography sx={{ fontWeight: 700, color: T.gold, fontSize: '1.1rem' }}>
                                {formatPrice(shippingCost)} MT
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: T.darkMuted, display: 'block', mt: 1 }}>
                              Taxa base: {formatPrice(BASE_SHIPPING_FEE)} MT + {SHIPPING_RATE_PER_KG} MT/kg
                            </Typography>
                          </>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CircularProgress size={20} sx={{ color: T.gold }} />
                            <Typography sx={{ color: T.darkText }}>Calculando frete...</Typography>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </Paper>
                )}

                {/* Resumo */}
                <Paper sx={{ bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: 2, p: 2, mb: 3 }}>
                  <Typography sx={{ fontWeight: 700, color: T.white, mb: 2 }}>Resumo</Typography>
                  <Stack spacing={1.5}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography sx={{ color: T.darkTextSub }}>Subtotal ({quantity} {quantity === 1 ? 'item' : 'itens'}):</Typography>
                      <Typography sx={{ color: T.white, fontWeight: 600 }}>{formatPrice(subtotal)} MT</Typography>
                    </Box>
                    {product.nationalShipping && shippingCalculated && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography sx={{ color: T.darkTextSub }}>Frete:</Typography>
                        <Typography sx={{ color: T.white, fontWeight: 600 }}>{formatPrice(shippingCost)} MT</Typography>
                      </Box>
                    )}
                    <Divider sx={{ borderColor: T.darkBorder }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography sx={{ fontWeight: 700, color: T.white }}>Total:</Typography>
                      <Typography sx={{ fontWeight: 800, color: T.gold, fontSize: '1.2rem' }}>{formatPrice(total)} MT</Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Botões de ação */}
                {!isOwner ? (
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ShoppingCartIcon />}
                      onClick={addToCart}
                      disabled={outOfStock || (product.nationalShipping && !shippingCalculated && !shippingError)}
                      sx={{ 
                        bgcolor: 'rgba(200,144,58,0.18)', 
                        color: T.gold, 
                        border: `1px solid rgba(200,144,58,0.25)`,
                        py: 1.2,
                        '&:hover': { bgcolor: 'rgba(200,144,58,0.28)' },
                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.06)', color: T.darkMuted, borderColor: T.darkBorder }
                      }}
                    >
                      {outOfStock ? "Sem Stock" : (product.nationalShipping && !shippingCalculated ? "Calculando..." : "Carrinho")}
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PaymentIcon />}
                      onClick={handlePayment}
                      disabled={outOfStock || (product.nationalShipping && !shippingCalculated && !shippingError)}
                      sx={{ 
                        bgcolor: T.gold, 
                        color: T.navy, 
                        py: 1.2,
                        '&:hover': { bgcolor: T.goldLight },
                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.06)', color: T.darkMuted, borderColor: T.darkBorder }
                      }}
                    >
                      {outOfStock ? "Indisponível" : (product.nationalShipping && !shippingCalculated ? "Frete indisponível" : "Pagar")}
                    </Button>
                  </Box>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<StoreIcon />}
                    onClick={() => navigate(`/loja/${store}`)}
                    sx={{ bgcolor: 'rgba(200,144,58,0.18)', color: T.gold, border: `1px solid rgba(200,144,58,0.25)`, py: 1.5 }}
                  >
                    Ver na Loja
                  </Button>
                )}
              </>
            )}

            {(!showPrices || productType === "service") && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<ContactIcon />}
                onClick={handleOpenContactModal}
                sx={{ bgcolor: 'rgba(200,144,58,0.18)', color: T.gold, border: `1px solid rgba(200,144,58,0.25)`, py: 1.5 }}
              >
                Contactar Loja
              </Button>
            )}
          </Grid>
        </Grid>

        {/* Menu de compartilhamento */}
        <Menu
          anchorEl={shareAnchorEl}
          open={Boolean(shareAnchorEl)}
          onClose={handleCloseShareMenu}
          PaperProps={{ sx: { bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: 2 } }}
        >
          {[
            { key: 'whatsapp', label: 'WhatsApp', src: 'https://cdn-icons-png.flaticon.com/512/124/124034.png' },
            { key: 'facebook', label: 'Facebook', src: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' },
            { key: 'twitter', label: 'Twitter', src: 'https://cdn-icons-png.flaticon.com/512/124/124021.png' },
          ].map((s) => (
            <MenuItem key={s.key} onClick={() => shareOnPlatform(s.key)} sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
              <ListItemIcon><Box component="img" src={s.src} alt={s.label} sx={{ width: 20, height: 20 }} /></ListItemIcon>
              <ListItemText>{s.label}</ListItemText>
            </MenuItem>
          ))}
          <MenuItem onClick={() => shareOnPlatform('copy')} sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
            <ListItemIcon><ShareIcon sx={{ fontSize: 18, color: T.gold }} /></ListItemIcon>
            <ListItemText>Copiar link</ListItemText>
          </MenuItem>
        </Menu>

        {/* Modal de Contato */}
        <Dialog
          open={openContactModal}
          onClose={handleCloseContactModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: T.navyCard,
              border: `1px solid ${T.darkBorder}`,
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: `1px solid ${T.darkBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContactIcon sx={{ color: T.gold }} />
              <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: T.white }}>
                Contactar {storeInfo?.company?.nome || "Loja"}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseContactModal} sx={{ color: T.darkMuted, '&:hover': { color: T.white } }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 3 }}>
            <List sx={{ width: '100%' }}>
              {storeInfo?.company?.contacto && (
                <ListItem 
                  component="div"
                  sx={{ 
                    mb: 1,
                    bgcolor: 'rgba(255,255,255,0.02)',
                    borderRadius: 2,
                    border: `1px solid ${T.darkBorder}`,
                    '&:hover': { borderColor: T.gold }
                  }}
                >
                  <ListItemButton onClick={() => handleContactAction('phone', storeInfo.company.contacto)}>
                    <ListItemIcon>
                      <PhoneIcon sx={{ color: T.gold }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Telefone"
                      secondary={storeInfo.company.contacto}
                      primaryTypographyProps={{ sx: { color: T.darkTextSub, fontSize: '0.8rem' } }}
                      secondaryTypographyProps={{ sx: { color: T.white, fontWeight: 600 } }}
                    />
                  </ListItemButton>
                </ListItem>
              )}

              {storeInfo?.company?.whatsapp && (
                <ListItem 
                  component="div"
                  sx={{ 
                    mb: 1,
                    bgcolor: 'rgba(255,255,255,0.02)',
                    borderRadius: 2,
                    border: `1px solid ${T.darkBorder}`,
                    '&:hover': { borderColor: T.gold }
                  }}
                >
                  <ListItemButton onClick={() => handleContactAction('whatsapp', storeInfo.company.whatsapp)}>
                    <ListItemIcon>
                      <WhatsAppIcon sx={{ color: '#25D366' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="WhatsApp"
                      secondary={storeInfo.company.whatsapp}
                      primaryTypographyProps={{ sx: { color: T.darkTextSub, fontSize: '0.8rem' } }}
                      secondaryTypographyProps={{ sx: { color: T.white, fontWeight: 600 } }}
                    />
                  </ListItemButton>
                </ListItem>
              )}

              {storeInfo?.company?.email && (
                <ListItem 
                  component="div"
                  sx={{ 
                    mb: 1,
                    bgcolor: 'rgba(255,255,255,0.02)',
                    borderRadius: 2,
                    border: `1px solid ${T.darkBorder}`,
                    '&:hover': { borderColor: T.gold }
                  }}
                >
                  <ListItemButton onClick={() => handleContactAction('email', storeInfo.company.email)}>
                    <ListItemIcon>
                      <EmailIcon sx={{ color: '#EA4335' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email"
                      secondary={storeInfo.company.email}
                      primaryTypographyProps={{ sx: { color: T.darkTextSub, fontSize: '0.8rem' } }}
                      secondaryTypographyProps={{ sx: { color: T.white, fontWeight: 600 } }}
                    />
                  </ListItemButton>
                </ListItem>
              )}

              {storeInfo?.company?.website && (
                <ListItem 
                  component="div"
                  sx={{ 
                    mb: 1,
                    bgcolor: 'rgba(255,255,255,0.02)',
                    borderRadius: 2,
                    border: `1px solid ${T.darkBorder}`,
                    '&:hover': { borderColor: T.gold }
                  }}
                >
                  <ListItemButton onClick={() => handleContactAction('website', storeInfo.company.website)}>
                    <ListItemIcon>
                      <LanguageIcon sx={{ color: '#4285F4' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Website"
                      secondary={storeInfo.company.website.replace(/^https?:\/\//, '')}
                      primaryTypographyProps={{ sx: { color: T.darkTextSub, fontSize: '0.8rem' } }}
                      secondaryTypographyProps={{ sx: { color: T.white, fontWeight: 600 } }}
                    />
                  </ListItemButton>
                </ListItem>
              )}

              {storeInfo?.company?.endereco && (
                <ListItem 
                  component="div"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.02)',
                    borderRadius: 2,
                    border: `1px solid ${T.darkBorder}`,
                  }}
                >
                  <ListItemButton onClick={() => {
                    const query = encodeURIComponent(storeInfo.company.endereco);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                  }}>
                    <ListItemIcon>
                      <LocationOnIcon sx={{ color: T.gold }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Endereço"
                      secondary={storeInfo.company.endereco}
                      primaryTypographyProps={{ sx: { color: T.darkTextSub, fontSize: '0.8rem' } }}
                      secondaryTypographyProps={{ sx: { color: T.white, fontWeight: 600 } }}
                    />
                  </ListItemButton>
                </ListItem>
              )}
            </List>
          </DialogContent>

          <DialogActions sx={{ borderTop: `1px solid ${T.darkBorder}`, p: 2 }}>
            <Button 
              onClick={handleCloseContactModal}
              sx={{ color: T.darkTextSub, '&:hover': { color: T.white } }}
            >
              Fechar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: isMobile ? 'bottom' : 'top', horizontal: 'center' }}>
          <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} variant="filled" sx={{ borderRadius: 2 }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default ProductDetailsDesk;