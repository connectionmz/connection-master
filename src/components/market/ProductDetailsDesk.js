import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ref, get, update, increment } from "firebase/database";
import { db } from "../../fb";
import {
  Container, Typography, Box, TextField, Button,
  CircularProgress, Alert, Paper, Chip, Divider,
  Stack, useMediaQuery, IconButton, Avatar, useTheme,
  Badge, Snackbar, Tooltip, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Share as ShareIcon,
  Verified as VerifiedIcon,
  Store as StoreIcon,
  VisibilityOff as VisibilityOffIcon,
  Inventory as InventoryIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Language as LanguageIcon,
  Close as CloseIcon,
  LocationOn as LocationOnIcon,
  ContactSupport as ContactIcon,
} from "@mui/icons-material";
import BackButton from "../BackButton";
import { formatPrice } from "../../utils/utils";
import ProductShareMenu from "../ProductShareMenu";
import ProductMetaTags from "../ProductMetaTags";

/* ── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  navy:         '#08192E',
  navyMid:      '#0E2849',
  navyCard:     '#0D2240',
  gold:         '#C8903A',
  goldLight:    '#E8B96A',
  white:        '#FFFFFF',
  darkBorder:   'rgba(255,255,255,0.08)',
  darkText:     'rgba(255,255,255,0.88)',
  darkTextSub:  'rgba(255,255,255,0.52)',
  darkMuted:    'rgba(255,255,255,0.30)',
  success:      '#10b981',
  error:        '#ef4444',
  warning:      '#f59e0b',
};

const KEYFRAMES = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  .afu { animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both; }
`;

const BG_GRID = {
  position:'absolute', inset:0, pointerEvents:'none', opacity:0.02,
  backgroundImage:`linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize:'56px 56px',
};

/* ── Shipping constants ─────────────────────────────────────────────────── */
const BASE_SHIPPING_FEE    = 100;
const SHIPPING_RATE_PER_KG = 50;
const MAX_WEIGHT_KG        = 1000;

/* ── Helpers ────────────────────────────────────────────────────────────── */
const calcDiscountPct = (orig, disc) =>
  orig && disc && Number(orig) > Number(disc)
    ? Math.round(((Number(orig) - Number(disc)) / Number(orig)) * 100)
    : 0;

const resolveStorePhone = (storeInfo) => {
  const raw =
    storeInfo?.contact?.whatsapp ||
    storeInfo?.contact?.phone    ||
    storeInfo?.company?.contacto ||
    storeInfo?.contacto ||
    '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('258') ? digits : `258${digits}`;
};

const buildQuoteUrl = (productId, storeId, storePhone, productName, productPrice, quantity = 1) => {
  const url = `${window.location.origin}/product/${productId}/store/${storeId}`;
  const msg = encodeURIComponent(
    `Olá! Tenho interesse no produto *${productName}* que vi em: ${url}` +
    (productPrice ? ` (${formatPrice(Number(productPrice))} MT)` : '') +
    (quantity > 1 ? ` — Quantidade: ${quantity}` : '') +
    `. Podemos negociar?`
  );
  return storePhone
    ? `https://wa.me/${storePhone}?text=${msg}`
    : `https://wa.me/?text=${msg}`;
};

/* ════════════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════════════ */
const ProductDetailsDesk = ({ user }) => {
  const { productId, store } = useParams();
  const navigate  = useNavigate();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'));

  /* ── State ─────────────────────────────────────────────────────── */
  const [product,   setProduct]   = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [quantity,  setQuantity]  = useState(1);

  const [shareAnchorEl,       setShareAnchorEl]       = useState(null);
  const [openContactModal,    setOpenContactModal]    = useState(false);
  const [showShippingDetails, setShowShippingDetails] = useState(false);

  const [shipping, setShipping] = useState({ cost:0, calculated:false, error:'' });
  const [snackbar, setSnackbar] = useState({ open:false, message:'', severity:'success' });

  /* ── Helpers ───────────────────────────────────────────────────── */
  const showSnack = useCallback((message, severity = 'success') => {
    setSnackbar({ open:true, message, severity });
  }, []);

  const calcShipping = useCallback((weight, qty) => {
    const w = Number(weight);
    if (!w || isNaN(w) || w <= 0) {
      setShipping({ cost:0, calculated:false, error:'Peso do produto inválido' });
      return;
    }
    const total = w * qty;
    if (total > MAX_WEIGHT_KG) {
      setShipping({ cost:0, calculated:false, error:`Peso excede limite máximo (${MAX_WEIGHT_KG} kg)` });
      return;
    }
    setShipping({ cost: BASE_SHIPPING_FEE + total * SHIPPING_RATE_PER_KG, calculated:true, error:'' });
  }, []);

  /* ── Fetch ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productSnap = await get(ref(db, `stores/${store}/products/${productId}`));
         if (!productSnap.exists()) { setProduct(null); return; }

        const data = { ...productSnap.val(),  type: productSnap.val().type || 'product' };
        setProduct(data);

        console.log('Fetched product data:', data);
      

        // increment views — fire and forget
        update(ref(db, `stores/${store}/products/${productId}`), { views: increment(1) })
          .catch(console.error);

        const storeSnap = await get(ref(db, `stores/${store}`));
        const company  = await get(ref(db, `company/${store}`));
        if (storeSnap.exists()) setStoreInfo(storeSnap.val());
        if (company.exists()) setStoreInfo(prev => ({ ...prev, contacto: company.val().contacto }));  

        if (data.nationalShipping) {
          if (data.weight) calcShipping(data.weight, 1);
          else setShipping({ cost:0, calculated:false, error:'Produto não possui peso definido' });
        }
      } catch (e) {
        console.error(e);
        showSnack('Erro ao carregar dados do produto', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId, store, calcShipping, showSnack]);

  /* Recalculate shipping when quantity changes */
  useEffect(() => {
    if (product?.nationalShipping && product?.weight) {
      calcShipping(product.weight, quantity);
    }
  }, [quantity, product?.weight, product?.nationalShipping, calcShipping]);

  /* ── Enhanced Share functionality with proper preview ─────────────────── */
  const shareOnPlatform = useCallback(async (platform) => {
    const url = `${window.location.origin}/product/${productId}/store/${store}`;
    const productName = product?.name || 'Produto';
    const storeName = storeInfo?.company?.nome || 'Loja';
    
    if (platform === 'copy') {
      try {
        // Copy just the URL - meta tags will handle the preview when pasted
        await navigator.clipboard.writeText(url);
        showSnack('Link copiado! O preview aparecerá automaticamente quando colado');
      } catch (err) {
        await navigator.clipboard.writeText(url);
        showSnack('Link copiado!');
      }
      return;
    }
    
    if (platform === 'whatsapp') {
      // Send only the URL - WhatsApp will generate preview using OG tags
      const message = encodeURIComponent(
        `${productName} - ${storeName}\n\nConfira este produto incrível!\n\n${url}`
      );
      window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
      return;
    }
    
    if (platform === 'facebook') {
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    if (platform === 'twitter') {
      const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${productName} - Confira na loja ${storeName}!`)}`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    if (platform === 'native') {
      const shareData = {
        title: productName,
        text: `Confira "${productName}" na loja ${storeName}!`,
        url: url,
      };
      
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          showSnack('Partilhado com sucesso!');
        } catch (error) {
          if (error.name !== 'AbortError') {
            showSnack('Erro ao partilhar', 'error');
          }
        }
      } else {
        await navigator.clipboard.writeText(url);
        showSnack('Link copiado!');
      }
    }
  }, [product, storeInfo, productId, store, showSnack]);

  /* ── Quote via WhatsApp ────────────────────────────────────────── */
  const handleQuote = useCallback(() => {
    if (!user) { 
      navigate('/auth'); 
      return; 
    }
    const phone = resolveStorePhone(storeInfo);
    const priceToShow = product?.discountPrice || product?.price;
    const url = buildQuoteUrl(
      productId, 
      store, 
      phone, 
      product?.name || 'produto', 
      priceToShow, 
      quantity
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [user, storeInfo, product, productId, store, quantity, navigate]);

  /* ── Contact action ────────────────────────────────────────────── */
  const handleContactAction = useCallback((type, value) => {
    const actions = {
      phone:    () => { window.location.href = `tel:${value}`; },
      whatsapp: () => { window.open(`https://wa.me/${value.replace(/\D/g, '')}`, '_blank'); },
      email:    () => { window.location.href = `mailto:${value}`; },
      website:  () => { window.open(value, '_blank'); },
    };
    actions[type]?.();
  }, []);

  /* ── Loading / not found ───────────────────────────────────────── */
  if (loading) return (
    <Box sx={{ minHeight:'100vh', bgcolor:T.navy, display:'flex', justifyContent:'center', alignItems:'center' }}>
      <CircularProgress size={48} thickness={4} sx={{ color:T.gold }} />
    </Box>
  );

  if (!product) return (
    <Box sx={{ minHeight:'100vh', bgcolor:T.navy, display:'flex', justifyContent:'center', alignItems:'center', p:2 }}>
      <Alert severity="error" sx={{ bgcolor:'rgba(239,68,68,0.12)', color:T.white, border:'1px solid rgba(239,68,68,0.25)' }}>
        Produto não encontrado
      </Alert>
    </Box>
  );

  /* ── Derived values ────────────────────────────────────────────── */
  const productType = product.type;
  const price       = Number(product.discountPrice) || Number(product.price) || 0;
  const total    = price * Number(quantity);
  const showPrices  = storeInfo?.settings?.showPrices !== false;
  const outOfStock  = product.qtd !== null && product.qtd !== undefined && Number(product.qtd) === 0;
  const isOwner     = user?.id === storeInfo?.company?.id;
  const discPct     = calcDiscountPct(product.price, product.discountPrice);
  const storePhone  = resolveStorePhone(storeInfo);

  /* ── Shared contact item style ─────────────────────────────────── */
  const contactItemSx = {
    mb:1, bgcolor:'rgba(255,255,255,0.02)', borderRadius:2,
    border:`1px solid ${T.darkBorder}`, '&:hover':{ borderColor:T.gold },
  };

  return (
    <Box sx={{ backgroundColor:T.navy, minHeight:'100vh', fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
      <style>{KEYFRAMES}</style>
      
      {/* Meta Tags for Social Sharing */}
      <ProductMetaTags 
        product={product}
        storeInfo={storeInfo}
        productId={productId}
        store={store}
      />

      {/* Header */}
      <Box sx={{ position:'relative', background:`linear-gradient(160deg,${T.navy} 0%,${T.navyMid} 100%)`,
        borderBottom:`1px solid ${T.darkBorder}` }}>
        <Box sx={BG_GRID} />
        <Container maxWidth="lg" sx={{ py:2 }}>
          <BackButton sx={{ color:T.darkText, '&:hover':{ bgcolor:'rgba(255,255,255,0.06)' } }} />
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py:{ xs:3, md:6 }, position:'relative' }}>
        <Box sx={BG_GRID} />

        <Grid container spacing={{ xs:3, md:6 }}>

          {/* ── Left col — image ───────────────────────────────── */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ bgcolor:T.navyCard, border:`1px solid ${T.darkBorder}`,
              borderRadius:3, overflow:'hidden', position:'relative' }}>

              {/* Badges */}
              <Box sx={{ position:'absolute', top:16, left:16, zIndex:2, display:'flex', gap:1 }}>
                {showPrices && discPct > 0 && (
                  <Chip label={`-${discPct}%`}
                    sx={{ bgcolor:T.error, color:T.white, fontWeight:700, borderRadius:2 }} />
                )}
                {product.isNew && (
                  <Chip label="NOVO"
                    sx={{ bgcolor:T.success, color:T.white, fontWeight:700, borderRadius:2 }} />
                )}
              </Box>

              <Box component="img"
                src={product.imageUrl || 'https://via.placeholder.com/500'}
                alt={product.name}
                sx={{ width:'100%', height:{ xs:300, md:500 }, objectFit:'contain',
                  bgcolor:T.navyCard, p:{ xs:2, md:4 } }}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/500'; }}
              />

              {/* Share button */}
              <Box sx={{ position:'absolute', bottom:16, right:16, zIndex:2 }}>
                <Tooltip title="Partilhar">
                  <IconButton onClick={(e) => setShareAnchorEl(e.currentTarget)}
                    sx={{ bgcolor:T.navyCard, border:`1px solid ${T.darkBorder}`,
                      '&:hover':{ borderColor:T.gold } }}>
                    <ShareIcon sx={{ color:T.darkText }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Grid>

          {/* ── Right col — details ─────────────────────────────── */}
          <Grid item xs={12} md={6}>

            {/* Seller card */}
            {storeInfo?.company && (
              <Paper sx={{ bgcolor:T.navyCard, border:`1px solid ${T.darkBorder}`,
                borderRadius:2, p:2, mb:3, display:'flex', alignItems:'center', gap:2 }}>
                <Badge overlap="circular"
                  anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
                  badgeContent={storeInfo.company.verified
                    ? <Box sx={{ width:16, height:16, borderRadius:'50%', bgcolor:T.gold,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        border:`2px solid ${T.navyCard}` }}>
                        <VerifiedIcon sx={{ fontSize:10, color:T.white }} />
                      </Box>
                    : null}>
                  <Avatar src={storeInfo.company.logo}
                    sx={{ width:48, height:48, border:`2px solid ${T.gold}` }}>
                    {storeInfo.company.nome?.[0]}
                  </Avatar>
                </Badge>

                <Box sx={{ flex:1 }}>
                  <Link to={`/empresa/${storeInfo.company.slug}`} style={{ textDecoration:'none' }}>
                    <Typography sx={{ fontWeight:700, color:T.gold,
                      fontFamily:'"Plus Jakarta Sans", sans-serif',
                      '&:hover':{ color:T.goldLight } }}>
                      {storeInfo.company.nome}
                    </Typography>
                  </Link>
                  <Typography variant="body2" sx={{ color:T.darkTextSub,
                    fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                    {storeInfo.company.provincia}
                  </Typography>
                </Box>

                <Button component={Link} to={`/loja/${store}`} variant="outlined" size="small"
                  startIcon={<StoreIcon />}
                  sx={{ borderColor:T.darkBorder, color:T.darkText,
                    fontFamily:'"Plus Jakarta Sans", sans-serif',
                    '&:hover':{ borderColor:T.gold, color:T.gold } }}>
                  Ver Loja
                </Button>
              </Paper>
            )}

            {/* Title */}
            <Typography variant={isMobile ? 'h5' : 'h4'} sx={{
              fontFamily:'"Playfair Display", serif', fontWeight:800,
              color:T.white, mb:2 }}>
              {product.name}
            </Typography>

            {/* Type + stock chips */}
            <Stack direction="row" spacing={1} sx={{ mb:3, flexWrap:'wrap', gap:1 }}>
              <Chip
                label={productType === 'product' ? 'Produto' : 'Serviço'}
                size="small"
                sx={{
                  bgcolor: productType === 'product' ? 'rgba(200,144,58,0.12)' : 'rgba(16,185,129,0.12)',
                  border:`1px solid ${productType === 'product' ? 'rgba(200,144,58,0.25)' : 'rgba(16,185,129,0.25)'}`,
                  color:  productType === 'product' ? T.goldLight : T.success,
                }}
              />
              {productType === 'product' && product.qtd !== undefined && (
                <Chip
                  icon={<InventoryIcon sx={{ fontSize:14 }} />}
                  label={`Stock: ${product.qtd}`}
                  size="small"
                  sx={{
                    bgcolor: Number(product.qtd) > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    border:`1px solid ${Number(product.qtd) > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    color:  Number(product.qtd) > 0 ? T.success : T.error,
                  }}
                />
              )}
            </Stack>

            {/* Description */}
            <Typography sx={{ color:T.darkTextSub, lineHeight:1.6, mb:3,
              fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
              {product.description || 'Nenhuma descrição fornecida.'}
            </Typography>

            <Divider sx={{ my:3, borderColor:T.darkBorder }} />

            {/* Price */}
            <Box sx={{ mb:3 }}>
              {showPrices ? (
                discPct > 0 ? (
                  <Box>
                    <Box sx={{ display:'flex', alignItems:'center', gap:2, mb:1 }}>
                      <Typography variant={isMobile ? 'h4' : 'h3'}
                        sx={{ fontWeight:800, color:T.gold,
                          fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                        {formatPrice(Number(product.discountPrice))} MT
                      </Typography>
                      <Chip label={`-${discPct}%`}
                        sx={{ bgcolor:'rgba(239,68,68,0.18)', border:'1px solid rgba(239,68,68,0.3)',
                          color:T.error, fontWeight:700 }} />
                    </Box>
                    <Typography sx={{ color:T.darkMuted, textDecoration:'line-through',
                      fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                      {formatPrice(Number(product.price))} MT
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant={isMobile ? 'h4' : 'h3'}
                    sx={{ fontWeight:800, color:T.gold,
                      fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                    {formatPrice(Number(product.price) || 0)} MT
                  </Typography>
                )
              ) : (
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <VisibilityOffIcon sx={{ color:T.darkMuted }} />
                  <Typography sx={{ color:T.darkMuted,
                    fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                    Preço sob consulta
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Quantity + shipping + summary + CTA - SHOWN FOR ALL PRODUCTS WITH VISIBLE PRICES */}
            {showPrices && productType === 'product' && (
              <>
                {/* Quantity */}
                <Box sx={{ mb:3 }}>
                  <Typography sx={{ fontWeight:600, color:T.white, mb:1, fontSize:'0.9rem',
                    fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                    Quantidade:
                  </Typography>
                  <TextField
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || (Number(v) >= 1 && Number(v) <= Number(product.qtd || Infinity)))
                        setQuantity(v);
                    }}
                    onBlur={(e) => {
                      let v = parseInt(e.target.value);
                      if (isNaN(v) || v < 1) v = 1;
                      if (product.qtd && v > Number(product.qtd)) v = Number(product.qtd);
                      setQuantity(v);
                    }}
                    inputProps={{ min:1, max:Number(product.qtd) || Infinity }}
                    size="small"
                    disabled={outOfStock}
                    sx={{ width:'120px',
                      '& .MuiOutlinedInput-root':{
                        bgcolor:'rgba(255,255,255,0.06)', color:T.white,
                        '& fieldset':{ borderColor:T.darkBorder },
                        '&:hover fieldset':{ borderColor:T.gold },
                      },
                    }}
                  />
                </Box>


                {/* Order summary */}
                <Paper sx={{ bgcolor:T.navyCard, border:`1px solid ${T.darkBorder}`,
                  borderRadius:2, p:2, mb:3 }}>
                  <Typography sx={{ fontWeight:700, color:T.white, mb:2,
                    fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                    Resumo
                  </Typography>
                  <Stack spacing={1.5}>
                    <Divider sx={{ borderColor:T.darkBorder }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography sx={{ fontWeight:700, color:T.white,
                        fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                        Total:
                      </Typography>
                      <Typography sx={{ fontWeight:800, color:T.gold, fontSize:'1.2rem',
                        fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                        {formatPrice(total)} MT
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* ── CTAs ──────────────────────────────────────── */}
                {!isOwner ? (
                  <Box sx={{ display:'flex', gap:2, flexDirection:{ xs:'column', sm:'row' } }}>
                    {/* Primary — Pedir Cotação via WhatsApp */}
                    <Button fullWidth variant="contained" disableElevation
                      startIcon={<WhatsAppIcon />}
                      onClick={handleQuote}
                      disabled={outOfStock}
                      sx={{
                        py:1.5, borderRadius:'12px',
                        bgcolor:'rgba(37,211,102,0.15)',
                        color:'#25D366',
                        border:'1px solid rgba(37,211,102,0.30)',
                        fontFamily:'"Plus Jakarta Sans", sans-serif', fontWeight:700,
                        fontSize:'0.95rem', textTransform:'none',
                        '&:hover':{ bgcolor:'rgba(37,211,102,0.25)', borderColor:'rgba(37,211,102,0.55)' },
                        '&.Mui-disabled':{ opacity:0.4 },
                      }}>
                      {outOfStock ? 'Indisponível' : 'Pedir Cotação'}
                    </Button>

                    {/* Secondary — Contactar loja (modal) */}
                    <Button variant="outlined" disableElevation
                      startIcon={<ContactIcon />}
                      onClick={() => setOpenContactModal(true)}
                      sx={{
                        py:1.5, borderRadius:'12px', flexShrink:0,
                        borderColor:'rgba(200,144,58,0.25)', color:T.gold,
                        fontFamily:'"Plus Jakarta Sans", sans-serif', fontWeight:700,
                        fontSize:'0.95rem', textTransform:'none',
                        '&:hover':{ borderColor:T.gold, bgcolor:'rgba(200,144,58,0.08)' },
                      }}>
                      Contactos
                    </Button>
                  </Box>
                ) : (
                  <Button fullWidth variant="contained" startIcon={<StoreIcon />}
                    onClick={() => navigate(`/loja/${store}`)}
                    sx={{ bgcolor:'rgba(200,144,58,0.18)', color:T.gold,
                      border:`1px solid rgba(200,144,58,0.25)`, py:1.5,
                      fontFamily:'"Plus Jakarta Sans", sans-serif', fontWeight:700,
                      textTransform:'none', borderRadius:'12px',
                      '&:hover':{ bgcolor:'rgba(200,144,58,0.28)' } }}>
                    Ver na Loja
                  </Button>
                )}
              </>
            )}

            {/* ── QUOTE BUTTON FOR SERVICES AND HIDDEN PRICES ── */}
            {/* Always show quote button for services or when prices are hidden */}
            {(!showPrices || productType === 'service') && !isOwner && (
              <Button fullWidth variant="contained" startIcon={<WhatsAppIcon />}
                onClick={handleQuote}
                sx={{ 
                  bgcolor:'rgba(37,211,102,0.15)', 
                  color:'#25D366',
                  border:'1px solid rgba(37,211,102,0.30)', 
                  py:1.5,
                  fontFamily:'"Plus Jakarta Sans", sans-serif', 
                  fontWeight:700,
                  fontSize:'0.95rem', 
                  textTransform:'none', 
                  borderRadius:'12px',
                  mb: 2,
                  '&:hover':{ bgcolor:'rgba(37,211,102,0.25)' } 
                }}>
                Pedir Cotação
              </Button>
            )}

            {/* Show contact button for services/hidden prices as well */}
            {(!showPrices || productType === 'service') && !isOwner && (
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<ContactIcon />}
                onClick={() => setOpenContactModal(true)}
                sx={{
                  py:1.5, 
                  borderRadius:'12px',
                  borderColor:'rgba(200,144,58,0.25)', 
                  color:T.gold,
                  fontFamily:'"Plus Jakarta Sans", sans-serif', 
                  fontWeight:700,
                  fontSize:'0.95rem', 
                  textTransform:'none',
                  '&:hover':{ borderColor:T.gold, bgcolor:'rgba(200,144,58,0.08)' },
                }}>
                Contactar Loja
              </Button>
            )}
          </Grid>
        </Grid>

        {/* Enhanced Share Menu */}
        <ProductShareMenu
          anchorEl={shareAnchorEl}
          onClose={() => setShareAnchorEl(null)}
          onShare={shareOnPlatform}
          product={product}
          storeInfo={storeInfo}
        />

        {/* ── Contact modal ────────────────────────────────────────── */}
        <Dialog open={openContactModal} onClose={() => setOpenContactModal(false)}
          maxWidth="sm" fullWidth
          PaperProps={{ sx:{ bgcolor:T.navyCard, border:`1px solid ${T.darkBorder}`,
            borderRadius:3, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' } }}>
          <DialogTitle sx={{ borderBottom:`1px solid ${T.darkBorder}`,
            display:'flex', justifyContent:'space-between', alignItems:'center', pb:2 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
              <ContactIcon sx={{ color:T.gold }} />
              <Typography sx={{ fontFamily:'"Playfair Display", serif', fontWeight:700, color:T.white }}>
                Contactar {storeInfo?.company?.nome || 'Loja'}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenContactModal(false)}
              sx={{ color:T.darkMuted, '&:hover':{ color:T.white } }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt:3 }}>
            <List>
              {storeInfo?.contact?.whatsapp && (
                <ListItem component="div" sx={contactItemSx}>
                  <ListItemButton onClick={() => handleContactAction('whatsapp', storeInfo.contact.whatsapp)}>
                    <ListItemIcon><WhatsAppIcon sx={{ color:'#25D366' }} /></ListItemIcon>
                    <ListItemText primary="WhatsApp" secondary={storeInfo.contact.whatsapp}
                      primaryTypographyProps={{ sx:{ color:T.darkTextSub, fontSize:'0.8rem', fontFamily:'"Plus Jakarta Sans", sans-serif' } }}
                      secondaryTypographyProps={{ sx:{ color:T.white, fontWeight:600, fontFamily:'"Plus Jakarta Sans", sans-serif' } }} />
                  </ListItemButton>
                </ListItem>
              )}
              {storeInfo?.contact?.phone && (
                <ListItem component="div" sx={contactItemSx}>
                  <ListItemButton onClick={() => handleContactAction('phone', storeInfo.contact.phone)}>
                    <ListItemIcon><PhoneIcon sx={{ color:T.gold }} /></ListItemIcon>
                    <ListItemText primary="Telefone" secondary={storeInfo.contact.phone}
                      primaryTypographyProps={{ sx:{ color:T.darkTextSub, fontSize:'0.8rem', fontFamily:'"Plus Jakarta Sans", sans-serif' } }}
                      secondaryTypographyProps={{ sx:{ color:T.white, fontWeight:600, fontFamily:'"Plus Jakarta Sans", sans-serif' } }} />
                  </ListItemButton>
                </ListItem>
              )}
              {storeInfo?.contact?.email && (
                <ListItem component="div" sx={contactItemSx}>
                  <ListItemButton onClick={() => handleContactAction('email', storeInfo.contact.email)}>
                    <ListItemIcon><EmailIcon sx={{ color:'#EA4335' }} /></ListItemIcon>
                    <ListItemText primary="Email" secondary={storeInfo.contact.email}
                      primaryTypographyProps={{ sx:{ color:T.darkTextSub, fontSize:'0.8rem', fontFamily:'"Plus Jakarta Sans", sans-serif' } }}
                      secondaryTypographyProps={{ sx:{ color:T.white, fontWeight:600, fontFamily:'"Plus Jakarta Sans", sans-serif' } }} />
                  </ListItemButton>
                </ListItem>
              )}
              {storeInfo?.company?.website && (
                <ListItem component="div" sx={contactItemSx}>
                  <ListItemButton onClick={() => handleContactAction('website', storeInfo.company.website)}>
                    <ListItemIcon><LanguageIcon sx={{ color:'#4285F4' }} /></ListItemIcon>
                    <ListItemText primary="Website"
                      secondary={storeInfo.company.website.replace(/^https?:\/\//, '')}
                      primaryTypographyProps={{ sx:{ color:T.darkTextSub, fontSize:'0.8rem', fontFamily:'"Plus Jakarta Sans", sans-serif' } }}
                      secondaryTypographyProps={{ sx:{ color:T.white, fontWeight:600, fontFamily:'"Plus Jakarta Sans", sans-serif' } }} />
                  </ListItemButton>
                </ListItem>
              )}
              {storeInfo?.company?.endereco && (
                <ListItem component="div" sx={{ ...contactItemSx, mb:0 }}>
                  <ListItemButton onClick={() => {
                    const q = encodeURIComponent(storeInfo.company.endereco);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
                  }}>
                    <ListItemIcon><LocationOnIcon sx={{ color:T.gold }} /></ListItemIcon>
                    <ListItemText primary="Endereço" secondary={storeInfo.company.endereco}
                      primaryTypographyProps={{ sx:{ color:T.darkTextSub, fontSize:'0.8rem', fontFamily:'"Plus Jakarta Sans", sans-serif' } }}
                      secondaryTypographyProps={{ sx:{ color:T.white, fontWeight:600, fontFamily:'"Plus Jakarta Sans", sans-serif' } }} />
                  </ListItemButton>
                </ListItem>
              )}
            </List>
          </DialogContent>

          <DialogActions sx={{ borderTop:`1px solid ${T.darkBorder}`, p:2 }}>
            <Button onClick={() => setOpenContactModal(false)}
              sx={{ color:T.darkTextSub, fontFamily:'"Plus Jakarta Sans", sans-serif',
                '&:hover':{ color:T.white } }}>
              Fechar
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ─────────────────────────────────────────────── */}
        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar(s => ({ ...s, open:false }))}
          anchorOrigin={{ vertical: isMobile ? 'bottom' : 'top', horizontal:'center' }}>
          <Alert onClose={() => setSnackbar(s => ({ ...s, open:false }))}
            severity={snackbar.severity} variant="filled"
            sx={{ borderRadius:2, fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default ProductDetailsDesk;