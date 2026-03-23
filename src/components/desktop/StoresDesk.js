import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ref, get, set, push, increment, onValue, update, remove } from "firebase/database";
import { db } from "../../fb";
import { ActiveModulesProvider, useActiveModules } from '../../context/ActiveModulesContext';
import {
  Grid, Typography, CircularProgress, Box, Avatar,
  IconButton, useMediaQuery, Chip, useTheme, Menu, MenuItem,
  ListItemIcon, ListItemText, Tooltip, Badge, InputBase,
  Button, Alert, Fab, Snackbar, Drawer, Container,
} from "@mui/material";
import {
  Share, Verified, Store, VisibilityOff, Search,
  ShoppingCartCheckout, AddShoppingCart, NavigateNext,
  LocalFireDepartment, LocalShipping, Category as CategoryIcon,
  Payment as PaymentIcon, Close as CloseIcon,
} from "@mui/icons-material";
import HandymanOutlinedIcon     from "@mui/icons-material/HandymanOutlined";
import StorefrontOutlinedIcon   from "@mui/icons-material/StorefrontOutlined";
import ArrowForwardIcon         from "@mui/icons-material/ArrowForward";
import { formatPrice } from "../../utils/utils";
import MyCart from "./ShoppingCart";

/* ── Design tokens — idênticos ao Home / Dashboard ─────────────────────── */
const T = {
  navy:        '#08192E',
  navyMid:     '#0E2849',
  navyLight:   '#183A63',
  navyCard:    '#0D2240',
  gold:        '#C8903A',
  goldLight:   '#E8B96A',
  goldPale:    '#FDF3E3',
  white:       '#FFFFFF',
  text:        '#0F1C2D',
  textSub:     '#6B89A5',
  border:      '#E0E8F0',
  borderMid:   '#C5D4E3',
  surface:     '#F4F7FB',
  darkBorder:  'rgba(255,255,255,0.08)',
  darkBorderMid:'rgba(255,255,255,0.14)',
  darkText:    'rgba(255,255,255,0.88)',
  darkTextSub: 'rgba(255,255,255,0.52)',
  darkMuted:   'rgba(255,255,255,0.30)',
};

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @keyframes fadeUp    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
  .afu { animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both; }

  /* Product cards */
  .prod-card {
    background:${T.navyCard}; border:1px solid ${T.darkBorder}; border-radius:16px;
    cursor:pointer; overflow:hidden; position:relative;
    transition:transform .22s ease, border-color .22s ease, box-shadow .22s ease;
    display:flex; flex-direction:column; height:100%;
  }
  .prod-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg,${T.gold} 0%,transparent 100%);
    opacity:0; transition:opacity .22s;
  }
  .prod-card:hover { transform:translateY(-3px); border-color:${T.gold} !important; box-shadow:0 16px 48px rgba(0,0,0,0.35) !important; }
  .prod-card:hover::before { opacity:1; }

  /* Store pills in featured row */
  .store-pill {
    background:${T.navyCard}; border:1px solid ${T.darkBorder}; border-radius:14px;
    cursor:pointer; transition:transform .2s ease, border-color .2s ease;
    display:flex; flex-direction:column; align-items:center; padding:16px 12px; min-width:96px;
  }
  .store-pill:hover { transform:translateY(-3px); border-color:${T.gold} !important; }

  /* Horizontal scroll */
  .hscroll { display:flex; gap:14px; padding-bottom:6px; overflow-x:auto; scroll-snap-type:x mandatory; -webkit-overflow-scrolling: touch; }
  .hscroll::-webkit-scrollbar { display:none; }
  .hscroll { scrollbar-width:none; }
  .hscroll > * { scroll-snap-align:start; flex-shrink:0; }

  /* Search bar */
  .search-dark { background:rgba(255,255,255,0.06); border:1px solid ${T.darkBorder}; border-radius:12px; transition: all 0.2s ease; }
  .search-dark:hover,.search-dark:focus-within { border-color:rgba(200,144,58,0.45) !important; }
  
  /* Mobile optimizations */
  @media (max-width: 600px) {
    .prod-card { border-radius: 12px; }
    .store-pill { padding: 12px 8px; min-width: 80px; }
    .hscroll { gap: 10px; }
  }
`;

const BG_GRID = {
  position:'absolute', inset:0, pointerEvents:'none', opacity:0.03,
  backgroundImage:`linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize:'56px 56px',
};

/* ── Eyebrow badge ───────────────────────────────────────────────────────── */
const EyebrowBadge = ({ children }) => (
  <Box sx={{ display:'inline-flex', alignItems:'center', gap:1, px:2, py:0.5, mb:1.5,
    background:'rgba(200,144,58,0.10)', border:'1px solid rgba(200,144,58,0.25)', borderRadius:'100px' }}>
    <Box sx={{ width:6, height:6, borderRadius:'50%', bgcolor:T.gold, animation:'pulse-dot 2s ease infinite' }} />
    <Typography sx={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.07em', color:T.goldLight,
      fontFamily:'"Plus Jakarta Sans", sans-serif', textTransform:'uppercase' }}>
      {children}
    </Typography>
  </Box>
);

/* ── Section header ──────────────────────────────────────────────────────── */
const SectionHeader = ({ label, title, count, linkLabel, onLink }) => (
  <Box sx={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', mb:3, flexWrap:'wrap', gap:1.5 }}>
    <Box>
      <EyebrowBadge>{label}</EyebrowBadge>
      <Typography sx={{ fontFamily:'"Playfair Display", Georgia, serif', fontWeight:800,
        fontSize:{ xs:'1.2rem', sm:'1.4rem', md:'1.8rem' }, color:T.white, letterSpacing:'-0.02em', lineHeight:1.1 }}>
        {title}
        {count !== undefined && (
          <Box component="span" sx={{ ml:1.5, fontSize:{ xs:'0.8rem', md:'0.9rem' }, fontWeight:400,
            color:T.darkMuted, fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
            ({count})
          </Box>
        )}
      </Typography>
    </Box>
    {onLink && (
      <Button onClick={onLink} endIcon={<ArrowForwardIcon sx={{ fontSize:15 }} />}
        sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', fontWeight:700, color:T.gold,
          fontSize:{ xs:'0.75rem', md:'0.85rem' }, textTransform:'none', borderRadius:'10px',
          border:'1px solid rgba(200,144,58,0.25)', px:{ xs:1.5, md:2 }, py:{ xs:0.7, md:0.9 },
          '&:hover':{ bgcolor:'rgba(200,144,58,0.08)', borderColor:T.gold } }}>
        {linkLabel}
      </Button>
    )}
  </Box>
);

/* ── Mobile Filter Drawer ───────────────────────────────────────────────── */
const MobileFilterDrawer = ({ open, onClose, categories, selectedCategory, onSelectCategory, stores, selectedStore, onSelectStore }) => {
  const theme = useTheme();
  
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: T.navyCard,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '80vh',
        }
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${T.darkBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: T.white }}>
          Filtrar Produtos
        </Typography>
        <IconButton onClick={onClose} sx={{ color: T.darkMuted }}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ p: 2, overflowY: 'auto' }}>
        {categories.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, color: T.gold, mb: 1, fontSize: '0.9rem' }}>
              Categorias
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="Todas"
                onClick={() => onSelectCategory('')}
                sx={{
                  bgcolor: selectedCategory === '' ? T.gold : 'rgba(255,255,255,0.06)',
                  color: selectedCategory === '' ? T.white : T.darkText,
                  border: `1px solid ${selectedCategory === '' ? T.gold : T.darkBorder}`,
                  '&:hover': { bgcolor: selectedCategory === '' ? T.goldLight : 'rgba(255,255,255,0.1)' }
                }}
              />
              {categories.map(cat => (
                <Chip
                  key={cat}
                  label={cat}
                  onClick={() => onSelectCategory(cat)}
                  sx={{
                    bgcolor: selectedCategory === cat ? T.gold : 'rgba(255,255,255,0.06)',
                    color: selectedCategory === cat ? T.white : T.darkText,
                    border: `1px solid ${selectedCategory === cat ? T.gold : T.darkBorder}`,
                    '&:hover': { bgcolor: selectedCategory === cat ? T.goldLight : 'rgba(255,255,255,0.1)' }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {stores.length > 0 && (
          <Box>
            <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600, color: T.gold, mb: 1, fontSize: '0.9rem' }}>
              Lojas
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="Todas"
                onClick={() => onSelectStore('')}
                sx={{
                  bgcolor: selectedStore === '' ? T.gold : 'rgba(255,255,255,0.06)',
                  color: selectedStore === '' ? T.white : T.darkText,
                  border: `1px solid ${selectedStore === '' ? T.gold : T.darkBorder}`,
                  '&:hover': { bgcolor: selectedStore === '' ? T.goldLight : 'rgba(255,255,255,0.1)' }
                }}
              />
              {stores.map(store => (
                <Chip
                  key={store.id}
                  label={store.name}
                  onClick={() => onSelectStore(store.id)}
                  sx={{
                    bgcolor: selectedStore === store.id ? T.gold : 'rgba(255,255,255,0.06)',
                    color: selectedStore === store.id ? T.white : T.darkText,
                    border: `1px solid ${selectedStore === store.id ? T.gold : T.darkBorder}`,
                    '&:hover': { bgcolor: selectedStore === store.id ? T.goldLight : 'rgba(255,255,255,0.1)' }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
      
      <Box sx={{ p: 2, borderTop: `1px solid ${T.darkBorder}` }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: T.gold,
            color: T.white,
            py: 1.2,
            borderRadius: 10,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 600,
            '&:hover': { bgcolor: T.goldLight }
          }}
        >
          Aplicar Filtros
        </Button>
      </Box>
    </Drawer>
  );
};

/* ════════════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════════════ */
const StoresDesk = ({ user }) => {
  const theme = useTheme();
  const { activeModules } = useActiveModules();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [stores, setStores]                   = useState([]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [loading, setLoading]                 = useState(true);
  const [shareAnchor, setShareAnchor]         = useState(null);
  const [sharedProduct, setSharedProduct]     = useState(null);
  const [cartOpen, setCartOpen]               = useState(false);
  const [cartItemCount, setCartItemCount]     = useState(0);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [openSnackbar, setOpenSnackbar]       = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState(new Set());
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  const navigate  = useNavigate();
  const userId    = user?.id || 'anonymous';
  const userProvince = user?.provinciaTemp || user?.provincia || null;
  const hasMarket = activeModules?.moduloMarket || false;
  const BASE_SHIPPING_FEE   = 100;
  const SHIPPING_RATE_PER_KG = 50;
  const IVA_PERCENTAGE       = 0;

  /* ── Tracking ──────────────────────────────────────────────────── */
  const trackInteraction = async (type, action, itemId, storeId = null) => {
    try {
      if (action !== 'click') return;
      const updates = {};
      updates[`anuncios_metrics/${storeId}/total_cliques`] = increment(1);
      updates[`loja_metrics/${storeId}/ultimo_clique`] = Date.now();
      updates[`loja_metrics/${storeId}/from`] = 'Mercado';
      if (user) {
        updates[`loja_metrics/${storeId}/company`] = {
          id: user.id, nome: user.nome || 'Anônimo',
          provincia: user.provinciaTemp || user.provincia || 'N/D',
          distrito: user.distrito || 'N/D',
          contacto: user.contacto || 'N/D',
          sector: user.sector || 'N/D',
          email: user.email || 'N/D',
        };
      }
      await update(ref(db), updates);
      await set(push(ref(db, 'clicks')), { type, itemId, storeId, userId, timestamp: Date.now(), page: 'Mercado' });
    } catch (e) { console.error(e); }
  };

  const trackClick = async (storeId, productId = null) => {
    try {
      const updates = {};
      updates[`loja_metrics/${storeId}/total_cliques`] = increment(1);
      updates[`loja_metrics/${storeId}/ultimo_clique`] = Date.now();
      updates[`loja_metrics/${storeId}/from`] = 'Mercado';
      if (productId) updates[`stores/${storeId}/products/${productId}/clicks`] = increment(1);
      await update(ref(db), updates);
      await set(push(ref(db, 'clicks')), { storeId, productId, userId, timestamp: Date.now(), page: 'Mercado' });
    } catch (e) { console.error(e); }
  };

  /* ── Fetch stores ──────────────────────────────────────────────── */
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const snap = await get(ref(db, 'stores'));
        if (snap.exists()) {
          const data = Object.entries(snap.val()).map(([id, s]) => ({
            id, ...s, products: s.products || {}, settings: s.settings || { showPrices: true },
          }));
          const filtered = !user ? data : userProvince
            ? data.filter(s => s.company?.provincia === userProvince) : data;
          setStores(filtered);
        } else setStores([]);
      } catch (e) {
        setSnackbarMessage('Erro ao carregar lojas.'); setSnackbarSeverity('error'); setOpenSnackbar(true);
      } finally { setLoading(false); }
    };
    fetchStores();
  }, [user, userProvince]);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onValue(ref(db, `favorites/${user.id}`), (snap) => {
      const d = snap.val();
      setFavoriteProducts(new Set(d ? Object.keys(d) : []));
    });
    return () => unsub();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onValue(ref(db, `cart/${user.id}`), (snap) => {
      const d = snap.val();
      setCartItemCount(d ? Object.values(d).reduce((s, i) => s + i.quantity, 0) : 0);
    });
    return () => unsub();
  }, [user?.id]);

  /* ── Cart & checkout ───────────────────────────────────────────── */
  const handlePayNow = (product) => {
    if (!user) { window.location.href = '/auth'; return; }
    const price = Number(product.discountPrice) || Number(product.price) || 0;
    const subtotal = price;
    const shipping = (product.type || 'product') === 'product' && product.nationalShipping && product.weight
      ? BASE_SHIPPING_FEE + (Number(product.weight) * SHIPPING_RATE_PER_KG) : 0;
    navigate('/checkout', { state: { product: { productId: product.id, storeId: product.storeId, name: product.name,
      price, quantity: 1, imageUrl: product.imageUrl, storeName: product.storeName,
      shippingCost: shipping, subtotal, iva: 0, total: subtotal + shipping,
      nationalShipping: product.nationalShipping || false, type: product.type || 'product' } } });
  };

  const handleCheckout = async () => {
    try {
      const orderRef = push(ref(db, 'orders'));
      const cartSnap = await get(ref(db, `cart/${user.id}`));
      const items = cartSnap.val() || {};
      await set(orderRef, { id: orderRef.key, userId: user.id, items,
        total: Object.values(items).reduce((s, i) => s + ((Number(i.discountPrice) || Number(i.price) || 0) * i.quantity), 0),
        status: 'pending', createdAt: new Date().toISOString() });
      await remove(ref(db, `cart/${user.id}`));
      setSnackbarMessage('Pedido realizado com sucesso!'); setSnackbarSeverity('success'); setOpenSnackbar(true);
      navigate(`/order/${orderRef.key}`); setCartOpen(false);
    } catch (e) { setSnackbarMessage('Erro ao finalizar pedido'); setSnackbarSeverity('error'); setOpenSnackbar(true); }
  };

  /* ── Derived data ──────────────────────────────────────────────── */
  const products = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return stores.flatMap(store =>
      Object.entries(store.products || {}).map(([id, p]) => ({
        ...p, id, storeId: store.id,
        storeName: store.name || 'Loja', storeLogo: store.company?.logo,
        storeSettings: store.settings || { showPrices: true },
        type: p.type || 'product',
      }))
    ).filter(p => {
      // Apply search filter
      if (q && !p.name?.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q)) return false;
      // Apply category filter
      if (selectedCategory && p.category !== selectedCategory) return false;
      // Apply store filter
      if (selectedStore && p.storeId !== selectedStore) return false;
      return true;
    });
  }, [stores, searchQuery, selectedCategory, selectedStore]);

  const featuredStores = useMemo(() =>
    stores.filter(s => Object.keys(s.products || {}).length > 0)
      .sort((a, b) => Object.keys(b.products || {}).length - Object.keys(a.products || {}).length)
      .slice(0, isMobile ? 6 : 10), [stores, isMobile]);

  const discountedProducts = useMemo(() =>
    products.filter(p => p.discountPrice && Number(p.discountPrice) < Number(p.price))
      .sort((a, b) => (Number(b.price) - Number(b.discountPrice)) / Number(b.price)
                    - (Number(a.price) - Number(a.discountPrice)) / Number(a.price))
      .slice(0, isMobile ? 6 : 10), [products, isMobile]);

  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats);
  }, [products]);

  const calculateDiscount = (price, orig) =>
    !orig || Number(orig) <= Number(price) ? 0
    : Math.round(((Number(orig) - Number(price)) / Number(orig)) * 100);

  /* ── Share ─────────────────────────────────────────────────────── */
  const handleShareOpen = (e, id) => { e.preventDefault(); e.stopPropagation(); setSharedProduct(id); setShareAnchor(e.currentTarget); };
  const handleShareClose = () => { setShareAnchor(null); setSharedProduct(null); };
  const shareProduct = (platform) => {
    if (!sharedProduct) return;
    const p = products.find(x => x.id === sharedProduct);
    const url = `${window.location.origin}/product/${sharedProduct}/store/${p.storeId}`;
    if (platform === 'copy') { navigator.clipboard.writeText(url); setSnackbarMessage('Link copiado!'); setSnackbarSeverity('success'); setOpenSnackbar(true); handleShareClose(); return; }
    const map = { whatsapp: `https://wa.me/?text=${encodeURIComponent(p.name + ' ' + url)}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}` };
    window.open(map[platform], '_blank');
    handleShareClose();
  };

  /* ── Sub-components ────────────────────────────────────────────── */
  const PriceDisplay = ({ product }) => {
    if (!product.storeSettings.showPrices) return (
      <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
        <VisibilityOff sx={{ fontSize:14, color:T.darkMuted }} />
        <Typography sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', fontSize:'0.75rem', color:T.darkMuted }}>
          Preço sob consulta
        </Typography>
      </Box>
    );
    const hasDiscount = product.discountPrice && Number(product.discountPrice) < Number(product.price);
    return (
      <Box>
        {hasDiscount ? (
          <>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, flexWrap:'wrap' }}>
              <Typography sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', fontWeight:700, fontSize:{ xs:'0.9rem', md:'1rem' }, color:T.gold }}>
                {formatPrice(Number(product.discountPrice))} MT
              </Typography>
              <Box sx={{ px:1, py:0.2, bgcolor:'rgba(239,68,68,0.18)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'6px' }}>
                <Typography sx={{ fontSize:'0.65rem', fontWeight:700, color:'#f87171', fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                  -{calculateDiscount(product.discountPrice, product.price)}%
                </Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize:'0.72rem', color:T.darkMuted, textDecoration:'line-through',
              fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
              {formatPrice(Number(product.price))} MT
            </Typography>
          </>
        ) : (
          <Typography sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', fontWeight:700, fontSize:{ xs:'0.85rem', md:'0.95rem' }, color:T.gold }}>
            {formatPrice(Number(product.price) || 0)} MT
          </Typography>
        )}
      </Box>
    );
  };

  const TrackedProductLink = ({ product, children }) => (
    <Box onClick={() => { trackClick(product.storeId, product.id).then(() => navigate(`/product/${product.id}/store/${product.storeId}`)); }}
      sx={{ textDecoration:'none', color:'inherit', cursor:'pointer', flex:1, display:'flex', flexDirection:'column' }}>
      {children}
    </Box>
  );

  const ProductCard = ({ product }) => {
    const isService = (product.type || 'product') === 'service';
    const outOfStock = !isService && product.qtd !== null && product.qtd !== undefined && Number(product.qtd) === 0;
    return (
      <Box className="prod-card">
        {/* Discount badge */}
        {product.discountPrice && Number(product.discountPrice) < Number(product.price) && (
          <Box sx={{ position:'absolute', top:10, right:10, zIndex:2,
            px:1, py:0.25, bgcolor:'rgba(239,68,68,0.85)', borderRadius:'8px' }}>
            <Typography sx={{ fontSize:'0.65rem', fontWeight:700, color:'#fff', fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
              -{calculateDiscount(product.discountPrice, product.price)}%
            </Typography>
          </Box>
        )}
        {/* New badge */}
        {product.isNew && (
          <Box sx={{ position:'absolute', top:10, left:10, zIndex:2,
            px:1, py:0.25, bgcolor:'rgba(34,197,94,0.85)', borderRadius:'8px' }}>
            <Typography sx={{ fontSize:'0.65rem', fontWeight:700, color:'#fff', fontFamily:'"Plus Jakarta Sans", sans-serif' }}>NOVO</Typography>
          </Box>
        )}

        <TrackedProductLink product={product}>
          {/* Image */}
          <Box sx={{ height:{ xs:120, sm:130, md:165 }, bgcolor:'rgba(255,255,255,0.03)',
            display:'flex', alignItems:'center', justifyContent:'center',
            overflow:'hidden', borderBottom:`1px solid ${T.darkBorder}`, flexShrink:0 }}>
            {product.imageUrl
              ? <Box component="img" src={product.imageUrl} alt={product.name}
                  sx={{ maxHeight:'88%', maxWidth:'90%', objectFit:'contain',
                    transition:'transform .3s', '&:hover':{ transform:'scale(1.05)' } }}
                  onError={(e) => { e.target.style.display='none'; }} />
              : (isService
                  ? <HandymanOutlinedIcon sx={{ fontSize:{ xs:30, md:40 }, color:'rgba(255,255,255,0.1)' }} />
                  : <StorefrontOutlinedIcon sx={{ fontSize:{ xs:30, md:40 }, color:'rgba(255,255,255,0.1)' }} />)
            }
          </Box>

          {/* Details */}
          <Box sx={{ p:{ xs:1.25, sm:1.5, md:1.75 }, flex:1, display:'flex', flexDirection:'column' }}>
            {/* Type + category */}
            <Box sx={{ display:'flex', gap:0.75, mb:1, flexWrap:'wrap' }}>
              <Box sx={{ px:1, py:0.2, bgcolor: isService ? 'rgba(200,144,58,0.12)' : 'rgba(255,255,255,0.06)',
                border:`1px solid ${isService ? 'rgba(200,144,58,0.25)' : T.darkBorder}`, borderRadius:'7px' }}>
                <Typography sx={{ fontSize:'0.6rem', fontWeight:700,
                  color: isService ? T.goldLight : T.darkMuted,
                  fontFamily:'"Plus Jakarta Sans", sans-serif', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  {isService ? 'Serviço' : 'Produto'}
                </Typography>
              </Box>
            </Box>

            {/* Name */}
            <Typography sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', fontWeight:700,
              fontSize:{ xs:'0.75rem', sm:'0.8rem', md:'0.84rem' }, color:T.darkText, mb:0.75, lineHeight:1.4,
              display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {product.name}
            </Typography>

            {/* Store */}
            <Box sx={{ display:'flex', alignItems:'center', gap:0.75, mb:1 }}>
              <Avatar src={product.storeLogo} sx={{ width:{ xs:16, md:18 }, height:{ xs:16, md:18 }, bgcolor:T.navyCard,
                border:`1px solid ${T.darkBorder}`, fontSize:'0.55rem' }}>
                {(product.storeName || '?')[0]}
              </Avatar>
              <Typography sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', fontSize:{ xs:'0.65rem', md:'0.7rem' },
                color:T.darkTextSub, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {product.storeName}
              </Typography>
            </Box>

            {/* Extra info */}
            <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.75, mb:1 }}>
              {outOfStock && (
                <Box sx={{ px:1, py:0.25, bgcolor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'7px' }}>
                  <Typography sx={{ fontSize:'0.6rem', fontWeight:700, color:'#f87171',
                    fontFamily:'"Plus Jakarta Sans", sans-serif' }}>Sem stock</Typography>
                </Box>
              )}
            </Box>
            {/* Price */}
            <Box sx={{ mt:'auto' }}>
              <PriceDisplay product={product} />
            </Box>
          </Box>
        </TrackedProductLink>

        {/* Actions */}
        <Box sx={{ px:{ xs:1.25, sm:1.5, md:1.75 }, pb:{ xs:1.25, sm:1.5, md:1.75 }, pt:1, display:'flex', gap:1,
          borderTop:`1px solid ${T.darkBorder}`, mt:'auto' }}>
          {product.storeSettings.showPrices && !isService ? (
            <>
              <Button variant="contained" size="small" disableElevation
                onClick={(e) => { e.stopPropagation(); handlePayNow(product); }}
                disabled={outOfStock}
                sx={{ flex:1, borderRadius:'9px', bgcolor:T.gold,
                  color:T.white, fontFamily:'"Plus Jakarta Sans", sans-serif',
                  fontWeight:700, fontSize:{ xs:'0.65rem', md:'0.72rem' }, textTransform:'none', minWidth:0, px:{ xs:0.5, md:1 },
                  '&:hover':{ bgcolor:T.goldLight } }}>
                <PaymentIcon sx={{ fontSize:{ xs:12, md:14 }, mr:{ xs:0.2, md:0.5 } }} /> 
                <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Pagar</Box>
              </Button>
            </>
          ) : (
            <Button variant="contained" size="small" disableElevation
              onClick={(e) => { e.stopPropagation(); navigate(`/loja/${product.storeId}`); }}
              sx={{ flex:1, borderRadius:'9px', bgcolor:'rgba(200,144,58,0.15)',
                color:T.gold, fontFamily:'"Plus Jakarta Sans", sans-serif',
                fontWeight:700, fontSize:{ xs:'0.65rem', md:'0.72rem' }, textTransform:'none', minWidth:0, px:{ xs:0.5, md:1 },
                border:'1px solid rgba(200,144,58,0.25)',
                '&:hover':{ bgcolor:'rgba(200,144,58,0.25)' } }}>
              <Store sx={{ fontSize:{ xs:12, md:14 }, mr:{ xs:0.2, md:0.5 } }} /> 
              <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Ver Loja</Box>
            </Button>
          )}
          <IconButton size="small"
            onClick={(e) => { e.stopPropagation(); handleShareOpen(e, product.id); }}
            sx={{ color:T.darkMuted, border:`1px solid ${T.darkBorder}`, borderRadius:'9px', p:{ xs:'3px', md:'5px' },
              '&:hover':{ color:T.gold, borderColor:'rgba(200,144,58,0.35)' } }}>
            <Share sx={{ fontSize:{ xs:14, md:15 } }} />
          </IconButton>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight:'100vh', fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
      <style>{KEYFRAMES}</style>
      
      {/* Header Section */}
      <Box sx={{
        position:'relative', overflow:'hidden',
        background:`linear-gradient(160deg,${T.navy} 0%,${T.navyMid} 60%,${T.navyLight} 100%)`,
        pt:{ xs:4, sm:5, md:9 }, pb:{ xs:3, sm:4, md:7 }, px:2,}}>
        <Box sx={BG_GRID} />
        <Box sx={{ position:'absolute', inset:0, pointerEvents:'none',
          background:`radial-gradient(ellipse 70% 55% at 90% 10%, rgba(200,144,58,0.11) 0%, transparent 55%),
                      radial-gradient(ellipse 45% 45% at 5% 90%,  rgba(200,144,58,0.07) 0%, transparent 50%)` }} />
        <Box sx={{ display:{ xs:'none', md:'block' }, position:'absolute', right:'5%', top:'10%',
          width:260, height:260, borderRadius:'50%', border:'1px solid rgba(200,144,58,0.12)',
          animation:'float 7s ease-in-out infinite',
          '&::after':{ content:'""', position:'absolute', inset:20, borderRadius:'50%', border:'1px solid rgba(200,144,58,0.07)' } }} />
        
        <Container maxWidth="lg" sx={{ position:'relative', zIndex:1, px: { xs: 0, sm: 2 } }}>
          {/* Module warning */}
          {user && !hasMarket && user.type !== 'singular' && (
            <Alert severity="warning"
              action={<Button color="inherit" size="small" onClick={() => navigate('/pagamento-modulo/moduloMarket')}>Ativar</Button>}
              sx={{ mb:3, bgcolor:'rgba(234,179,8,0.12)', color:T.goldLight,
                border:'1px solid rgba(234,179,8,0.25)', borderRadius:'12px',
                '& .MuiAlert-icon':{ color:T.gold }, fontFamily:'"Plus Jakarta Sans", sans-serif', fontSize:{ xs:'0.75rem', md:'0.85rem' } }}>
              O módulo Mercado está inativo. Ative para usar este serviço.
            </Alert>
          )}
          <Box sx={{ display:'flex', flexDirection:{ xs:'column', sm:'row' },
            alignItems:{ sm:'center' }, justifyContent:'space-between', gap:2 }}>
            
            {/* Search + Cart */}
            <Box sx={{ display:'flex', alignItems:'center', gap:1.5, flexShrink:0 }}>
                       
              <Box className="search-dark" sx={{ 
                display: { xs: showMobileSearch ? 'flex' : 'none', sm: 'flex' },
                alignItems:'center', transition:'border-color .2s', width: { xs: '100%', sm: 'auto' },
                position: { xs: showMobileSearch ? 'fixed' : 'relative', sm: 'relative' },
                top: { xs: showMobileSearch ? 10 : 'auto', sm: 'auto' },
                left: { xs: showMobileSearch ? 10 : 'auto', sm: 'auto' },
                right: { xs: showMobileSearch ? 10 : 'auto', sm: 'auto' },
                zIndex: { xs: showMobileSearch ? 1200 : 1, sm: 1 },
                bgcolor: { xs: showMobileSearch ? T.navyCard : 'rgba(255,255,255,0.06)', sm: 'rgba(255,255,255,0.06)' }}}>

                <Box sx={{ pl:1.5, display:'flex', alignItems:'center' }}>
                  <Search sx={{ fontSize:18, color:T.darkMuted }} />
                </Box>
                <InputBase
                  placeholder="Pesquisar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ px:1.25, py:{ xs:0.8, sm:1.1 }, fontSize:{ xs:'0.8rem', md:'0.88rem' },
                    fontFamily:'"Plus Jakarta Sans", sans-serif', color:T.darkText,
                    width:{ xs: '100%', sm: 200, md: 240 },
                    '& input::placeholder':{ color:T.darkMuted, opacity:1 } }}
                />
                {isMobile && showMobileSearch && (
                  <IconButton size="small" onClick={() => setShowMobileSearch(false)} sx={{ mr:1, color:T.darkMuted }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              {/* Cart Button */}
              <Tooltip title="Carrinho de Compras">
                <IconButton onClick={() => { if (!user) window.location.href='/auth'; else setCartOpen(true); }}
                  sx={{ bgcolor:'rgba(200,144,58,0.15)', border:'1px solid rgba(200,144,58,0.3)',
                    borderRadius:'12px', p:1.1, color:T.gold,
                    '&:hover':{ bgcolor:'rgba(200,144,58,0.25)' } }}>
                  <Badge badgeContent={cartItemCount} color="error">
                    <ShoppingCartCheckout sx={{ fontSize:{ xs:18, md:20 } }} />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── CONTENT ───────────────────────────────────────────────── */}
      <Box sx={{ position:'relative', overflow:'hidden',
        background:`linear-gradient(180deg,${T.navyMid} 0%,${T.navy} 100%)`,
        borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <Box sx={BG_GRID} />
        <Container maxWidth="lg" sx={{ position:'relative', zIndex:1, px: { xs: 1, sm: 2, md: 3 }, py:{ xs:3, sm:4, md:6 }
        }}>

          {/* ── Featured Stores ─────────────────────────────────── */}
          {featuredStores.length > 0 && (
            <Box sx={{ mb:{ xs:4, sm:5, md:6 }, pb:{ xs:3, sm:4, md:5 }, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <SectionHeader label="Lojas" title="Lojas em Destaque"
                linkLabel="Ver todas" onLink={() => navigate('/lojas')} />
              <Box className="hscroll">
                {featuredStores.map((store) => (
                  <Tooltip key={store.id} title={store.name} arrow placement="top">
                    <Box className="store-pill"
                      onClick={() => { trackClick(store.id).then(() => navigate(`/loja/${store.id}`)); }}>
                      <Badge overlap="circular"
                        anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
                        badgeContent={store.company?.verified
                          ? <Box sx={{ width:16, height:16, borderRadius:'50%', bgcolor:T.gold,
                              display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <Verified sx={{ fontSize:10, color:T.white }} />
                            </Box>
                          : null}>
                        <Avatar src={store.company?.logo}
                          sx={{ width:{ xs:44, sm:48, md:52 }, height:{ xs:44, sm:48, md:52 }, mb:1.25,
                            bgcolor:T.navyCard, border:`2px solid rgba(200,144,58,0.35)`,
                            fontSize:{ xs:'0.9rem', md:'1rem' }, fontFamily:'"Playfair Display", serif',
                            fontWeight:700, color:'rgba(255,255,255,0.7)' }}>
                          {(store.name || '')[0]}
                        </Avatar>
                      </Badge>
                      <Typography sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', fontWeight:700,
                        fontSize:{ xs:'0.7rem', md:'0.75rem' }, color:T.darkText, textAlign:'center',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:80 }}>
                        {store.name}
                      </Typography>
                      <Typography sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif',
                        fontSize:{ xs:'0.6rem', md:'0.62rem' }, color:T.darkMuted, mt:0.25 }}>
                        {Object.keys(store.products || {}).length} {isMobile ? '' : 'produtos'}
                      </Typography>
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          )}

          {/* ── Hot Deals ───────────────────────────────────────── */}
          {discountedProducts.length > 0 && (
            <Box sx={{ mb:{ xs:4, sm:5, md:6 }, pb:{ xs:3, sm:4, md:5 }, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <SectionHeader label="Promoções"
                title={<Box sx={{ display:'flex', alignItems:'center', gap:1.5, flexWrap:'wrap' }}>
                  Ofertas <Box component="span" sx={{ color:'#f87171' }}>Quentes</Box>
                  <Box sx={{ px:1.25, py:0.3, bgcolor:'rgba(239,68,68,0.15)',
                    border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px' }}>
                    <Typography sx={{ fontSize:'0.6rem', fontWeight:700, color:'#f87171',
                      fontFamily:'"Plus Jakarta Sans", sans-serif', letterSpacing:'0.06em' }}>
                      LIMITADO
                    </Typography>
                  </Box>
                </Box>}
              />
              <Box className="hscroll">
                {discountedProducts.map((p) => (
                  <Box key={`${p.storeId}-${p.id}`} sx={{ width:{ xs:160, sm:175, md:210 } }}>
                    <ProductCard product={p} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* ── All Products ─────────────────────────────────────── */}
          <Box>
          

            {loading ? (
              <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', py:{ xs:8, md:14 } }}>
                <CircularProgress size={isMobile ? 28 : 36} thickness={4} sx={{ color:T.gold }} />
              </Box>
            ) : products.length === 0 ? (
              <Box sx={{ textAlign:'center', py:{ xs:8, md:12 }, border:`1px dashed rgba(255,255,255,0.1)`,
                borderRadius:'18px', background:'rgba(255,255,255,0.015)', px:2 }}>
                <StorefrontOutlinedIcon sx={{ fontSize:{ xs:36, md:42 }, color:'rgba(255,255,255,0.1)', mb:2 }} />
                <Typography sx={{ fontFamily:'"Playfair Display", serif', fontWeight:700,
                  fontSize:{ xs:'1.1rem', md:'1.3rem' }, color:T.darkText, mb:1 }}>
                  {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                </Typography>
                <Typography sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif',
                  fontSize:{ xs:'0.8rem', md:'0.875rem' }, color:T.darkMuted, mb:3 }}>
                  {searchQuery ? 'Tente ajustar os termos da sua pesquisa'
                    : 'As lojas ainda não adicionaram produtos ao catálogo'}
                </Typography>
                {searchQuery && (
                  <Button onClick={() => setSearchQuery('')}
                    sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', fontWeight:700,
                      color:T.gold, textTransform:'none', border:'1px solid rgba(200,144,58,0.3)',
                      borderRadius:'10px', px:{ xs:2, md:2.5 }, py:{ xs:0.8, md:1 },
                      '&:hover':{ bgcolor:'rgba(200,144,58,0.08)' } }}>
                    Limpar pesquisa
                  </Button>
                )}
              </Box>
            ) : (
              <Grid container spacing={{ xs:1.5, sm:2 }}>
                {products.map((p) => (
                  <Grid item xs={6} sm={4} md={3} lg={2.4} key={`${p.storeId}-${p.id}`}>
                    <ProductCard product={p} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Container>
      </Box>

      {/* ── Share menu ─────────────────────────────────────────────── */}
      <Menu anchorEl={shareAnchor} open={Boolean(shareAnchor)} onClose={handleShareClose}
        PaperProps={{ sx:{ bgcolor:T.navyCard, border:`1px solid ${T.darkBorder}`, borderRadius:'12px',
          boxShadow:'0 20px 60px rgba(0,0,0,0.4)' } }}>
        {[
          { key:'whatsapp', label:'WhatsApp', src:'https://cdn-icons-png.flaticon.com/512/124/124034.png' },
          { key:'facebook', label:'Facebook', src:'https://cdn-icons-png.flaticon.com/512/124/124010.png' },
          { key:'twitter',  label:'Twitter',  src:'https://cdn-icons-png.flaticon.com/512/124/124021.png' },
        ].map((s) => (
          <MenuItem key={s.key} onClick={() => shareProduct(s.key)}
            sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', fontSize:{ xs:'0.8rem', md:'0.88rem' }, color:T.darkText,
              '&:hover':{ bgcolor:'rgba(255,255,255,0.06)' } }}>
            <ListItemIcon><Box component="img" src={s.src} alt={s.label} sx={{ width:20, height:20 }} /></ListItemIcon>
            <ListItemText>{s.label}</ListItemText>
          </MenuItem>
        ))}
        <MenuItem onClick={() => shareProduct('copy')}
          sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', fontSize:{ xs:'0.8rem', md:'0.88rem' }, color:T.darkText,
            '&:hover':{ bgcolor:'rgba(255,255,255,0.06)' } }}>
          <ListItemIcon><Share sx={{ fontSize:18, color:T.gold }} /></ListItemIcon>
          <ListItemText>Copiar link</ListItemText>
        </MenuItem>
      </Menu>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        stores={stores}
        selectedStore={selectedStore}
        onSelectStore={setSelectedStore}
      />

      {/* Cart */}
      <MyCart open={cartOpen} onClose={() => setCartOpen(false)} userId={user?.id} onCheckout={handleCheckout} />

      {/* Mobile FAB */}
      {isMobile && cartItemCount > 0 && (
        <Fab onClick={() => setCartOpen(true)}
          sx={{ position:'fixed', bottom:20, right:20,
            bgcolor:T.gold, color:T.white, boxShadow:'0 8px 28px rgba(200,144,58,0.45)',
            '&:hover':{ bgcolor:T.goldLight }, width:{ xs:50, sm:56 }, height:{ xs:50, sm:56 } }}>
          <Badge badgeContent={cartItemCount} color="error">
            <ShoppingCartCheckout sx={{ fontSize:{ xs:22, sm:24 } }} />
          </Badge>
        </Fab>
      )}

      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: isMobile ? 'bottom' : 'top', horizontal:'center' }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} variant="filled"
          sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', borderRadius:'12px',
            bgcolor: snackbarSeverity === 'success' ? T.gold : undefined, fontSize:{ xs:'0.8rem', md:'0.9rem' } }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StoresDesk;