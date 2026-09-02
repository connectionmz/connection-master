import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box, Container, Grid, Snackbar, Alert,
  useMediaQuery, Typography, InputBase, Button,
  Paper, Popper, ClickAwayListener, Fade, List, ListItem,
  ListItemAvatar, Avatar, ListItemText, Divider,
  CircularProgress, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton
} from "@mui/material";
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import HistoryIcon from '@mui/icons-material/History';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useNavigate } from "react-router-dom";
import { get, ref, update } from "firebase/database";
import { db } from "../fb";
import StorieListDesk from "./desktop/StorieListDesk";
import StoresDesk from "./desktop/StoresDesk";
import { useLanguage } from '../context/LanguageContext';

/* ── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  navy:      '#08192E',
  navyMid:   '#0E2849',
  navyLight: '#183A63',
  gold:      '#C8903A',
  goldLight: '#E8B96A',
  goldPale:  '#FDF3E3',
  white:     '#FFFFFF',
  text:      '#0F1C2D',
  textSub:   '#6B89A5',
  borderMid: '#C5D4E3',
  surface:   '#F4F7FB',
  darkText:  'rgba(255,255,255,0.88)',
  darkTextSub: 'rgba(255,255,255,0.52)',
};

/* ── Keyframes ─────────────────────────────────────────────────────────── */
const KEYFRAMES = `
  @keyframes fadeUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }

  .afu   { animation: fadeUp .65s cubic-bezier(.22,1,.36,1) both; }
  .afi   { animation: fadeIn .5s ease both; }
  .d1 { animation-delay:.10s } .d2 { animation-delay:.22s }
  .d3 { animation-delay:.34s } .d4 { animation-delay:.46s }

  .feature-card {
    transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
  }
  .feature-card:hover {
    transform: translateY(-4px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .sector-pill { transition: background .18s, color .18s, border-color .18s; }
  .sector-pill:hover {
    background: ${T.gold} !important;
    color: ${T.white} !important;
    border-color: ${T.gold} !important;
  }
  .cta-btn { transition: background .2s, transform .2s; }
  .cta-btn:hover { background: ${T.goldLight} !important; transform: translateY(-1px); }
`;

/* ── Static data ───────────────────────────────────────────────────────── */
const POPULAR_SECTORS = ['Construção', 'TI & Software', 'Logística', 'Consultoria'];
const RECENT_SEARCHES_KEY = 'product_recent_searches';

/* ════════════════════════════════════════════════════════════════════════
   COMPONENTE DE BUSCA COM SUGESTÕES - APENAS PRODUTOS E SERVIÇOS
════════════════════════════════════════════════════════════════════════ */
const ProductSearchWithSuggestions = ({ onSearch, onProductSelect, initialValue = '', storesData = [] }) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const inputRef = useRef(null);
  const searchVersionRef = useRef(0);
  const isMobile = useMediaQuery('(max-width:600px)');

  // Carregar pesquisas recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Erro ao carregar pesquisas recentes:', e);
      }
    }
  }, []);

  // Salvar pesquisa recente
  const saveRecentSearch = useCallback((term) => {
    if (!term || !term.trim()) return;
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  }, [recentSearches]);

  // Buscar sugestões de produtos/serviços em tempo real
  useEffect(() => {
    const searchVersion = ++searchVersionRef.current;
    const fetchProductSuggestions = async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      const searchTermLower = searchTerm.toLowerCase();
      const results = [];

      try {
        const stores = storesData;

        // Percorrer todas as lojas e produtos/serviços
        for (const store of stores) {
          if (!store.products) continue;
          
          for (const [productId, product] of Object.entries(store.products)) {
            // Verificar se o produto/serviço corresponde ao termo de busca
            const matchesName = product.name?.toLowerCase().includes(searchTermLower);
            const matchesCategory = product.category?.toLowerCase().includes(searchTermLower);
            const matchesDescription = product.description?.toLowerCase().includes(searchTermLower);
            
            if (matchesName || matchesCategory || matchesDescription) {
              const price = product.discountPrice || product.price;
              
              results.push({
                type: 'product',
                id: productId,
                storeId: store.id,
                storeName: store.name || store.company?.nome,
                storeLogo: store.company?.logo,
                name: product.name,
                category: product.category,
                productType: product.type,
                price: price,
                showPrice: store.settings?.showPrices !== false,
                imageUrl: product.imageUrl,
                description: product.description,
                searchMatch: matchesName ? 'name' : (matchesCategory ? 'category' : 'description')
              });
            }
          }
        }

        // Ordenar por relevância e limitar a 10 resultados
        const sortedResults = results
          .sort((a, b) => {
            // Priorizar correspondência no nome
            if (a.searchMatch === 'name' && b.searchMatch !== 'name') return -1;
            if (b.searchMatch === 'name' && a.searchMatch !== 'name') return 1;
            return 0;
          })
          .slice(0, 10);
        
        if (searchVersion === searchVersionRef.current) setSuggestions(sortedResults);
      } catch (error) {
        console.error('Erro ao buscar sugestões de produtos:', error);
      } finally {
        if (searchVersion === searchVersionRef.current) setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchProductSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, storesData]);

  const handleSearch = useCallback((term) => {
    if (term && term.trim()) {
      saveRecentSearch(term.trim());
      onSearch(term.trim());
    } else {
      onSearch('');
    }
    setOpen(false);
  }, [onSearch, saveRecentSearch]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setOpen(true);
    if (e.target.value && e.target.value.length >= 2) {
      setAnchorEl(inputRef.current);
    } else {
      setAnchorEl(null);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    setOpen(false);
    setAnchorEl(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchTerm);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    // Quando clicar na sugestão, navega direto para o produto
    if (onProductSelect) {
      onProductSelect(suggestion);
    } else {
      // Fallback: apenas busca
      handleSearch(suggestion.name);
    }
    setOpen(false);
    setSearchTerm('');
  };

  const handleRecentClick = (term) => {
    setSearchTerm(term);
    handleSearch(term);
  };

  const handleClickAway = () => {
    setOpen(false);
  };

  // Formatar preço
  const formatPrice = (price) => {
    if (price === null || price === undefined || Number.isNaN(Number(price))) return '';
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: '100%' }}>
        <Box sx={{ 
          display: 'flex', 
          background: T.white,
          borderRadius: '14px', 
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          overflow: 'hidden', 
          width: '100%' 
        }}>
          <Box sx={{ pl: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <SearchIcon sx={{ color: T.textSub, fontSize: 22 }} />
          </Box>
          <InputBase
            ref={inputRef}
            placeholder="Buscar produtos ou serviços..."
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setOpen(true);
              if (searchTerm && searchTerm.length >= 2) {
                setAnchorEl(inputRef.current);
              } else {
                setAnchorEl(inputRef.current);
              }
            }}
            fullWidth
            sx={{ 
              px: 1.5, 
              py: 1.5, 
              fontSize: '0.95rem',
              fontFamily: '"Plus Jakarta Sans", sans-serif', 
              color: T.text,
              '& input::placeholder': { color: T.textSub, opacity: 1 } 
            }}
          />
          {searchTerm && (
            <IconButton onClick={handleClear} sx={{ px: 1 }}>
              <ClearIcon sx={{ fontSize: 20, color: T.textSub }} />
            </IconButton>
          )}
          <Box sx={{ 
            height: 48, 
            width: '1px', 
            bgcolor: T.borderMid, 
            my: 'auto', 
            flexShrink: 0 
          }} />
          <Button 
            onClick={() => handleSearch(searchTerm)} 
            className="cta-btn" 
            disableElevation
            sx={{ 
              m: 0.6, 
              px: { xs: 2, sm: 3 }, 
              borderRadius: '10px', 
              background: T.gold,
              color: T.white, 
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700, 
              fontSize: '0.88rem', 
              textTransform: 'none',
              whiteSpace: 'nowrap', 
              flexShrink: 0 
            }}
          >
            {isMobile ? <SearchIcon fontSize="small" /> : 'Pesquisar'}
          </Button>
        </Box>

        <Popper
          open={open && (suggestions.length > 0 || (searchTerm.length < 2 && recentSearches.length > 0))}
          anchorEl={anchorEl}
          placement="bottom-start"
          transition
          style={{ width: anchorEl?.offsetWidth, zIndex: 1300 }}
          modifiers={[{ name: 'flip', enabled: false }]}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <Paper
                elevation={4}
                sx={{
                  mt: 1,
                  borderRadius: '12px',
                  maxHeight: 400,
                  overflow: 'auto',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: `1px solid ${T.borderMid}`,
                }}
              >
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} sx={{ color: T.gold }} />
                  </Box>
                )}

                {!loading && searchTerm.length >= 2 && suggestions.length === 0 && (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography sx={{ color: T.textSub, fontSize: '0.9rem' }}>
                      Nenhum produto ou serviço encontrado para "{searchTerm}"
                    </Typography>
                    <Typography sx={{ color: T.textSub, fontSize: '0.8rem', mt: 1 }}>
                      Tente pesquisar por outro termo
                    </Typography>
                  </Box>
                )}

                {/* Sugestões de produtos/serviços */}
                {!loading && suggestions.length > 0 && (
                  <List sx={{ p: 0 }}>
                    {suggestions.map((suggestion, index) => (
                      <React.Fragment key={`${suggestion.storeId}-${suggestion.id}`}>
                        <ListItem
                          button
                          onClick={() => handleSuggestionClick(suggestion)}
                          sx={{
                            py: 1.5,
                            '&:hover': { bgcolor: T.surface },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar 
                              src={suggestion.imageUrl}
                              sx={{ 
                                bgcolor: suggestion.productType === 'service' ? T.goldPale : T.surface,
                                color: T.gold
                              }}
                            >
                              {suggestion.productType === 'service' ? (
                                <HandymanOutlinedIcon sx={{ fontSize: 20 }} />
                              ) : (
                                <InventoryIcon sx={{ fontSize: 20 }} />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography sx={{ fontWeight: 500, color: T.text }}>
                                  {suggestion.name}
                                </Typography>
                                <Chip
                                  label={suggestion.productType === 'service' ? 'Serviço' : 'Produto'}
                                  size="small"
                                  sx={{
                                    bgcolor: suggestion.productType === 'service' 
                                      ? 'rgba(200,144,58,0.12)' 
                                      : 'rgba(0,0,0,0.08)',
                                    color: suggestion.productType === 'service' ? T.gold : T.textSub,
                                    fontSize: '0.6rem',
                                    height: 20,
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: T.textSub }}>
                                  {suggestion.storeName}
                                </Typography>
                                {suggestion.category && (
                                  <Typography variant="caption" sx={{ color: T.textSub }}>
                                    • {suggestion.category}
                                  </Typography>
                                )}
                                {suggestion.showPrice && suggestion.price && (
                                  <Typography variant="caption" sx={{ color: T.gold, fontWeight: 600 }}>
                                    • {formatPrice(suggestion.price)}
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItem>
                        {index < suggestions.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}

                {/* Pesquisas recentes (quando campo vazio) */}
                {!loading && searchTerm.length < 2 && recentSearches.length > 0 && (
                  <Box>
                    <Box sx={{ px: 2, py: 1, bgcolor: T.surface }}>
                      <Typography sx={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 600, 
                        color: T.textSub, 
                        textTransform: 'uppercase' 
                      }}>
                        Pesquisas recentes
                      </Typography>
                    </Box>
                    <List sx={{ p: 0 }}>
                      {recentSearches.map((term, index) => (
                        <ListItem
                          key={index}
                          button
                          onClick={() => handleRecentClick(term)}
                          sx={{ py: 1.5 }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: T.goldPale, color: T.gold }}>
                              <HistoryIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={term} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Paper>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

/* ════════════════════════════════════════════════════════════════════════
   COMPONENT PRINCIPAL
════════════════════════════════════════════════════════════════════════ */
const Dashboard = ({ user }) => {
  const isTablet = useMediaQuery('(max-width:960px)');
  const navigate = useNavigate();
  const [storesData, setStoresData] = useState([]);
  const { t } = useLanguage();
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('national');
  const [savingProvince, setSavingProvince] = useState(false);
  const provincePromptOpen = Boolean(user?.id && !user?.provincia);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Carregar dados das lojas para o componente de busca
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const snapshot = await get(ref(db, 'stores'));
        if (snapshot.exists()) {
          const stores = Object.entries(snapshot.val()).map(([id, store]) => ({
            id,
            name: store.name || store.company?.nome || 'Loja',
            company: store.company,
            products: store.products || {},
            settings: store.settings || { showPrices: true }
          }));
          setStoresData(stores);
        }
      } catch (error) {
        console.error('Erro ao carregar lojas:', error);
      }
    };
    fetchStores();
  }, []);

  useEffect(() => {
    get(ref(db, 'provincias')).then((snapshot) => setProvinces(snapshot.val() || [])).catch((error) => console.error('Erro ao carregar províncias:', error));
  }, []);

  const saveProvincePreference = async () => {
    if (!user?.id) return;
    setSavingProvince(true);
    try {
      await update(ref(db, `company/${user.id}`), { provincia: selectedProvince === 'national' ? 'Nacional' : selectedProvince });
      showSnack(t('dashboard.provinceSaved'));
    } catch (error) {
      console.error('Erro ao guardar província:', error);
      showSnack(t('dashboard.provinceError'), 'error');
    } finally { setSavingProvince(false); }
  };

  const showSnack = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

 // No componente Dashboard, atualize a função handleSearch
const handleSearch = useCallback((query) => {
  if (query && query.trim()) {
    // Navegar para a página de resultados de busca
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  } else {
    navigate('/explorar');
  }
}, [navigate]);

// E atualize o ProductSearchWithSuggestions para incluir onProductSelect
const handleProductSelect = useCallback((product) => {
  // Quando clicar em uma sugestão, vai direto para o produto
  navigate(`/product/${product.id}/store/${product.storeId}`);
}, [navigate]);

  const handlePopularSectorClick = useCallback((sector) => {
    navigate(`/explorar?sector=${encodeURIComponent(sector)}`);
  }, [navigate]);

  return (
    <Box sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <style>{KEYFRAMES}</style>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'relative',
        background: `linear-gradient(160deg,${T.navy} 0%,${T.navyMid} 55%,${T.navyLight} 100%)`,
        pt: { xs: 7, md: 11 }, pb: { xs: 8, md: 12 },
        overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.07) 0%, transparent 50%)
          ` }} />
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '56px 56px' }} />
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: '6%', top: '12%',
          width: 320, height: 320, borderRadius: '50%',
          border: '1px solid rgba(200,144,58,0.15)',
          animation: 'float 6s ease-in-out infinite',
          '&::after': { content: '""', position: 'absolute', inset: 24, borderRadius: '50%',
            border: '1px solid rgba(200,144,58,0.10)' } }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box className="afu" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1,
                px: 2, py: 0.6, mb: 3,
                background: 'rgba(200,144,58,0.12)', border: '1px solid rgba(200,144,58,0.35)',
                borderRadius: '100px' }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: T.gold,
                  animation: 'pulse-dot 2s ease infinite' }} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em',
                  color: T.goldLight, fontFamily: '"Plus Jakarta Sans", sans-serif',
                  textTransform: 'uppercase' }}>
                  Diretório Nacional de Empresas
                </Typography>
              </Box>

              <Typography className="afu d1" component="h1" sx={{
                fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 800,
                fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.4rem' },
                lineHeight: 1.08, color: T.white, letterSpacing: '-0.02em', mb: 2,
              }}>
                Encontre Produtos e<br />
                <Box component="span" sx={{ color: T.gold, position: 'relative',
                  '&::after': { content: '""', position: 'absolute', bottom: 2, left: 0, right: 0,
                    height: 2, background: `linear-gradient(90deg,${T.gold},transparent)`,
                    borderRadius: 2 } }}>
                  Serviços
                </Box>
              </Typography>

              {/* Search bar com sugestões de produtos/serviços */}
              <Box className="afu d3" sx={{ maxWidth: 580, mb: 3 }}>
                <ProductSearchWithSuggestions 
                  onSearch={handleSearch}
                  onProductSelect={handleProductSelect}
                  storesData={storesData}
                />
              </Box>

              {/* Popular tags */}
              <Box className="afu d4" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)',
                  fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Popular:
                </Typography>
                {POPULAR_SECTORS.map((s) => (
                  <Button key={s} className="sector-pill"
                    onClick={() => handlePopularSectorClick(s)}
                    sx={{ px: 1.5, py: 0.4, border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '100px', fontSize: '0.76rem', color: 'rgba(255,255,255,0.6)',
                      minWidth: 0, textTransform: 'none', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    {s}
                  </Button>
                ))}
              </Box>
            </Grid>

            {/* ── Right col — floating cards ── */}
            {!isTablet && (
              <Grid item md={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box className="afi d2" sx={{ position: 'relative', width: 300, height: 340 }}>
                  <Box sx={{ position: 'absolute', top: 0, left: 20, background: T.white,
                    borderRadius: '16px', p: 2.5, width: 230,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    animation: 'float 5s ease-in-out infinite' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: T.goldPale,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RequestQuoteOutlinedIcon sx={{ fontSize: 18, color: T.gold }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.text }}>Cotação Recebida</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: T.textSub }}>Empresa Pemba, Lda</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ bgcolor: T.surface, borderRadius: '8px', px: 1.5, py: 1 }}>
                      <Typography sx={{ fontSize: '0.72rem', color: T.textSub }}>Material de construção</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: T.navy }}>850 000 MT</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 13, color: '#22c55e' }} />
                      <Typography sx={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 600 }}>Empresa verificada</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ position: 'absolute', bottom: 0, right: 0, background: T.white,
                    borderRadius: '16px', p: 2, width: 200,
                    boxShadow: '0 16px 50px rgba(0,0,0,0.22)',
                    animation: 'float 7s ease-in-out infinite', animationDelay: '1.5s' }}>
                    <Box sx={{ height: 80, borderRadius: '10px', bgcolor: T.surface, mb: 1.5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <StorefrontOutlinedIcon sx={{ fontSize: 32, color: T.borderMid }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: T.text, mb: 0.25 }}>Cimento CEM II 42.5</Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: T.textSub }}>Cimentos de Moçambique</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.gold }}>1 250 MT</Typography>
                      <Box sx={{ px: 1, py: 0.25, bgcolor: T.goldPale, borderRadius: '6px' }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: T.gold }}>Em stock</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ position: 'absolute', top: 120, right: 8, background: T.navy,
                    borderRadius: '100px', px: 1.5, py: 0.6,
                    display: 'flex', alignItems: 'center', gap: 0.75,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e',
                      animation: 'pulse-dot 1.5s ease infinite' }} />
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.white }}>312 empresas online</Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* ── Stories ──────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
        <StorieListDesk user={user} />
      </Container>

      {/* ── Marketplace ──────────────────────────────────────────── */}
      <StoresDesk user={user} />

      {/* ── Snackbar ─────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', borderRadius: '12px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Dialog open={provincePromptOpen} disableEscapeKeyDown aria-labelledby="province-prompt-title">
        <DialogTitle id="province-prompt-title">{t('dashboard.provinceTitle')}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>{t('dashboard.provinceDescription')}</Typography>
          <TextField select fullWidth label={t('explore.province')} value={selectedProvince} onChange={(event) => setSelectedProvince(event.target.value)}>
            <MenuItem value="national">{t('dashboard.national')}</MenuItem>
            {provinces.map((item) => <MenuItem key={item.provincia} value={item.provincia}>{item.provincia}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions><Button variant="contained" onClick={saveProvincePreference} disabled={savingProvince}>{savingProvince ? t('dashboard.savingProvince') : t('dashboard.confirmProvince')}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
