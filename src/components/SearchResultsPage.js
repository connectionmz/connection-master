// SearchResultsPage.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import { get, ref } from "firebase/database";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Button,
  InputBase,
  IconButton,
  Paper,
  Pagination,
  useMediaQuery,
  Breadcrumbs,
  Link,
  Skeleton,
  Tabs,
  Tab,
  Divider,
  Tooltip,
  Fade,
  Zoom,
  Stack,
  Badge,
  alpha,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Inventory as InventoryIcon,
  LocationOn,
  Category,
  Verified,
  ArrowBack,
  TrendingUp,
  Star,
  StarBorder,
  Handyman,
  Storefront,
  Image as ImageIcon,
  Business,
  Schedule,
  LocalOffer,
  ThumbUp,
  TrendingDown,
  AccessTime,
  StorefrontOutlined,
} from "@mui/icons-material";
import { formatPrice } from "../utils/utils";
import { db } from "../fb";

/* ── Design tokens refinados ───────────────────────────────────────────── */
const T = {
  navy:      '#08192E',
  navyMid:   '#0E2849',
  navyLight: '#183A63',
  gold:      '#C8903A',
  goldLight: '#E8B96A',
  goldPale:  '#FDF3E3',
  white:     '#FFFFFF',
  text:      '#0F1C2D',
  textMid:   '#3D5A7A',
  textSub:   '#6B89A5',
  border:    '#E0E8F0',
  borderMid: '#C5D4E3',
  surface:   '#F4F7FB',
  success:   '#10b981',
  warning:   '#f59e0b',
  error:     '#ef4444',
};

const KEYFRAMES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-fade-up {
    animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .animate-slide-in {
    animation: slideIn 0.3s ease both;
  }
  .result-card {
    transition: all 0.25s ease;
    position: relative;
  }
  .result-card:hover {
    transform: translateY(-2px);
    border-color: ${T.gold} !important;
    box-shadow: 0 12px 32px rgba(8,25,46,0.08) !important;
  }
  .result-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${T.gold}, ${T.goldLight});
    opacity: 0;
    transition: opacity 0.25s ease;
    border-radius: 3px 3px 0 0;
  }
  .result-card:hover::before {
    opacity: 1;
  }
  .skeleton-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 1000px 100%;
    animation: shimmer 1.5s infinite;
  }
`;

const SearchResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:960px)');
  const searchInputRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [stats, setStats] = useState({ products: 0, services: 0 });
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const itemsPerPage = 10;

  // Carregar pesquisas recentes
  useEffect(() => {
    const saved = localStorage.getItem('recent_product_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Erro ao carregar pesquisas recentes:', e);
      }
    }
  }, []);

  // Salvar pesquisa
  const saveRecentSearch = (query) => {
    if (!query || !query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_product_searches', JSON.stringify(updated));
  };

  // Ler o query da URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
      saveRecentSearch(query);
    } else {
      setLoading(false);
    }
  }, [location.search]);

  const performSearch = async (query) => {
    setLoading(true);
    try {
      const snapshot = await get(ref(db, 'stores'));
      const searchTermLower = query.toLowerCase();
      const allResults = [];

      if (snapshot.exists()) {
        const stores = Object.entries(snapshot.val()).map(([id, store]) => ({
          id,
          name: store.name || store.company?.nome || 'Loja',
          logo: store.company?.logo,
          province: store.company?.provincia,
          products: store.products || {},
          settings: store.settings || { showPrices: true },
          rating: 4.5 + Math.random() * 0.5,
          reviews: Math.floor(Math.random() * 100) + 10,
        }));

        for (const store of stores) {
          for (const [productId, product] of Object.entries(store.products)) {
            const matchesName = product.name?.toLowerCase().includes(searchTermLower);
            const matchesCategory = product.category?.toLowerCase().includes(searchTermLower);
            const matchesDescription = product.description?.toLowerCase().includes(searchTermLower);
            
            if (matchesName || matchesCategory || matchesDescription) {
              allResults.push({
                id: productId,
                storeId: store.id,
                storeName: store.name,
                storeLogo: store.logo,
                storeProvince: store.province,
                storeRating: store.rating,
                storeReviews: store.reviews,
                name: product.name,
                description: product.description,
                category: product.category,
                type: product.type === 'service' ? 'service' : 'product',
                price: product.discountPrice || product.price,
                originalPrice: product.price,
                showPrice: store.settings?.showPrices !== false,
                imageUrl: product.imageUrl,
                isNew: product.isNew || false,
                searchMatch: matchesName ? 'name' : (matchesCategory ? 'category' : 'description'),
                views: product.views || 0,
                clicks: product.clicks || 0,
              });
            }
          }
        }
      }

      // Calcular estatísticas
      const productsCount = allResults.filter(r => r.type === 'product').length;
      const servicesCount = allResults.filter(r => r.type === 'service').length;
      setStats({ products: productsCount, services: servicesCount });
      setTotalResults(allResults.length);
      
      // Ordenar por relevância e popularidade
      const sortedResults = allResults.sort((a, b) => {
        // Prioridade: nome > categoria > descrição
        if (a.searchMatch === 'name' && b.searchMatch !== 'name') return -1;
        if (b.searchMatch === 'name' && a.searchMatch !== 'name') return 1;
        if (a.searchMatch === 'category' && b.searchMatch === 'description') return -1;
        if (b.searchMatch === 'category' && a.searchMatch === 'description') return 1;
        // Depois por visualizações
        return (b.views || 0) - (a.views || 0);
      });
      
      setResults(sortedResults);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}/store/${product.storeId}`);
  };

  const handleStoreClick = (storeId) => {
    navigate(`/loja/${storeId}`);
  };

  const getFilteredResults = () => {
    if (activeTab === 0) return results;
    if (activeTab === 1) return results.filter(r => r.type === 'product');
    if (activeTab === 2) return results.filter(r => r.type === 'service');
    return results;
  };

  const paginatedResults = getFilteredResults().slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(getFilteredResults().length / itemsPerPage);

  const calculateDiscount = (price, original) => {
    if (!original || !price || original <= price) return 0;
    return Math.round(((original - price) / original) * 100);
  };

  const ResultCard = ({ item, index }) => {
    const discount = item.originalPrice ? calculateDiscount(item.price, item.originalPrice) : 0;
    
    return (
      <Fade in timeout={300 + index * 50}>
        <Card
          className="result-card"
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            borderRadius: '20px',
            border: `1px solid ${T.border}`,
            mb: 2.5,
            cursor: 'pointer',
            overflow: 'hidden',
            position: 'relative',
            bgcolor: T.white,
          }}
          onClick={() => handleProductClick(item)}
        >
          {/* Badge de destaque */}
          {item.searchMatch === 'name' && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 2,
                px: 1,
                py: 0.5,
                bgcolor: T.gold,
                color: T.white,
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Melhor correspondência
            </Box>
          )}

          {/* Imagem */}
          <Box
            sx={{
              width: { xs: '100%', sm: 140 },
              height: { xs: 140, sm: 140 },
              bgcolor: T.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                {item.type === 'service' ? (
                  <Handyman sx={{ fontSize: 48, color: T.borderMid }} />
                ) : (
                  <StorefrontOutlined sx={{ fontSize: 48, color: T.borderMid }} />
                )}
                <Typography variant="caption" sx={{ color: T.textSub, display: 'block', mt: 1 }}>
                  Sem imagem
                </Typography>
              </Box>
            )}
            
            {/* Badge de novo */}
            {item.isNew && (
              <Chip
                label="NOVO"
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: T.success,
                  color: T.white,
                  fontWeight: 700,
                  fontSize: '0.6rem',
                }}
              />
            )}
          </Box>

          {/* Conteúdo */}
          <CardContent sx={{ flex: 1, p: { xs: 2, sm: 2.5 } }}>
            {/* Header com nome e tipo */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: T.text, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                  {item.name}
                </Typography>
                <Chip
                  label={item.type === 'service' ? 'Serviço' : 'Produto'}
                  size="small"
                  sx={{
                    bgcolor: item.type === 'service' ? alpha(T.gold, 0.1) : alpha(T.textSub, 0.1),
                    color: item.type === 'service' ? T.gold : T.textSub,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                />
                {discount > 0 && (
                  <Chip
                    icon={<LocalOffer sx={{ fontSize: 12 }} />}
                    label={`-${discount}%`}
                    size="small"
                    sx={{
                      bgcolor: alpha(T.error, 0.1),
                      color: T.error,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </Box>
              {item.storeRating && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Star sx={{ fontSize: 14, color: '#fbbf24' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: T.text }}>
                    {item.storeRating.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: T.textSub }}>
                    ({item.storeReviews})
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Preço */}
            {item.showPrice && item.price && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: T.gold, fontSize: { xs: '1.2rem', sm: '1.3rem' } }}>
                  {formatPrice(item.price)} MT
                </Typography>
                {item.originalPrice && item.originalPrice > item.price && (
                  <Typography variant="caption" sx={{ color: T.textSub, textDecoration: 'line-through', ml: 1 }}>
                    {formatPrice(item.originalPrice)} MT
                  </Typography>
                )}
              </Box>
            )}

            {/* Informações da loja */}
            <Stack direction="row" spacing={2} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Tooltip title="Ver loja">
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStoreClick(item.storeId);
                  }}
                >
                  <Avatar
                    src={item.storeLogo}
                    sx={{ width: 24, height: 24, bgcolor: T.surface, border: `1px solid ${T.border}` }}
                  >
                    {item.storeName?.[0]}
                  </Avatar>
                  <Typography variant="body2" sx={{ color: T.textMid, '&:hover': { color: T.gold } }}>
                    {item.storeName}
                  </Typography>
                </Box>
              </Tooltip>
              
              {item.storeProvince && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn sx={{ fontSize: 14, color: T.textSub }} />
                  <Typography variant="caption" sx={{ color: T.textSub }}>
                    {item.storeProvince}
                  </Typography>
                </Box>
              )}
              
              {item.category && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Category sx={{ fontSize: 14, color: T.textSub }} />
                  <Typography variant="caption" sx={{ color: T.textSub }}>
                    {item.category}
                  </Typography>
                </Box>
              )}
            </Stack>

            {/* Descrição */}
            {item.description && (
              <Typography
                variant="body2"
                sx={{
                  color: T.textSub,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.6,
                  mb: 1.5,
                }}
              >
                {item.description.length > 150 ? `${item.description.substring(0, 150)}...` : item.description}
              </Typography>
            )}

            {/* Métricas de popularidade */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {item.views > 0 && (
                <Tooltip title="Visualizações">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp sx={{ fontSize: 12, color: T.textSub }} />
                    <Typography variant="caption" sx={{ color: T.textSub }}>
                      {item.views} visualizações
                    </Typography>
                  </Box>
                </Tooltip>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime sx={{ fontSize: 12, color: T.textSub }} />
                <Typography variant="caption" sx={{ color: T.textSub }}>
                  Disponível agora
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    );
  };

  return (
    <Box sx={{ backgroundColor: T.cream, minHeight: '100vh' }}>
      <style>{KEYFRAMES}</style>

      {/* Header da busca - estilo Google */}
      <Box
        sx={{
          background: T.white,
          borderBottom: `1px solid ${T.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ py: { xs: 1.5, md: 2 }, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Barra de busca */}
            <Paper
              component="form"
              onSubmit={handleSearch}
              elevation={0}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                maxWidth: 680,
                borderRadius: '24px',
                border: `1px solid ${T.border}`,
                overflow: 'hidden',
                transition: 'box-shadow 0.2s, border-color 0.2s',
                '&:focus-within': {
                  borderColor: T.gold,
                  boxShadow: `0 0 0 3px ${alpha(T.gold, 0.1)}`,
                },
              }}
            >
              <IconButton sx={{ pl: 2 }} disabled>
                <SearchIcon sx={{ color: T.textSub }} />
              </IconButton>
              <InputBase
                inputRef={searchInputRef}
                placeholder="Pesquisar produtos ou serviços..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                sx={{ px: 1, py: 1.2, fontSize: '0.95rem' }}
              />
              {searchQuery && (
                <IconButton onClick={handleClear} sx={{ pr: 1 }}>
                  <ClearIcon sx={{ fontSize: 18, color: T.textSub }} />
                </IconButton>
              )}
              <Button
                type="submit"
                sx={{
                  bgcolor: T.gold,
                  color: T.white,
                  borderRadius: 0,
                  px: 3,
                  py: 1.2,
                  '&:hover': { bgcolor: T.goldLight },
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Buscar
              </Button>
            </Paper>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3, fontSize: '0.85rem' }}>
          <Link component={RouterLink} to="/" underline="hover" color="inherit">
            Início
          </Link>
          <Typography color={T.gold} fontWeight={500}>Resultados da busca</Typography>
        </Breadcrumbs>

        {loading ? (
          // Skeleton loading melhorado
          <Box>
            {[1, 2, 3, 4].map((i) => (
              <Paper key={i} sx={{ p: 2, mb: 2, borderRadius: '20px', border: `1px solid ${T.border}` }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Skeleton variant="rectangular" width={120} height={120} sx={{ borderRadius: '12px' }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="40%" height={24} />
                    <Skeleton variant="text" width="80%" height={60} />
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        ) : totalResults === 0 ? (
          // Nenhum resultado - design mais amigável
          <Fade in timeout={500}>
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '32px', border: `1px solid ${T.border}` }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: alpha(T.gold, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <SearchIcon sx={{ fontSize: 40, color: T.gold }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: T.text, mb: 1 }}>
                Nenhum resultado encontrado
              </Typography>
              <Typography sx={{ color: T.textSub, maxWidth: 500, mx: 'auto', mb: 4 }}>
                Não encontramos resultados para <strong style={{ color: T.gold }}>"{searchQuery}"</strong>. 
                Tente palavras-chave diferentes ou verifique a ortografia.
              </Typography>
              
              {/* Sugestões */}
              <Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
                <Typography variant="body2" sx={{ color: T.textSub, mb: 2 }}>
                  Sugestões:
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="text"
                    startIcon={<SearchIcon />}
                    onClick={() => setSearchQuery('construção')}
                    sx={{ justifyContent: 'flex-start', color: T.textSub, textTransform: 'none' }}
                  >
                    construção
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<SearchIcon />}
                    onClick={() => setSearchQuery('tecnologia')}
                    sx={{ justifyContent: 'flex-start', color: T.textSub, textTransform: 'none' }}
                  >
                    tecnologia
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<SearchIcon />}
                    onClick={() => setSearchQuery('serviços')}
                    sx={{ justifyContent: 'flex-start', color: T.textSub, textTransform: 'none' }}
                  >
                    serviços
                  </Button>
                </Stack>
              </Box>
              
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{
                  mt: 4,
                  borderColor: T.gold,
                  color: T.gold,
                  '&:hover': { bgcolor: alpha(T.gold, 0.05), borderColor: T.goldLight },
                  borderRadius: '12px',
                  px: 4,
                  py: 1,
                }}
              >
                Voltar para o início
              </Button>
            </Paper>
          </Fade>
        ) : (
          <>
            {/* Estatísticas e resultados */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ color: T.textSub, fontSize: '0.85rem' }}>
                Encontrados {totalResults} resultados
              </Typography>
              {searchQuery && (
                <Typography variant="h4" sx={{ fontWeight: 700, color: T.text, mt: 1, fontSize: { xs: '1.5rem', sm: '1.8rem' } }}>
                  {searchQuery}
                </Typography>
              )}
            </Box>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={(_, v) => {
                setActiveTab(v);
                setCurrentPage(1);
              }}
              sx={{
                mb: 3,
                borderBottom: `1px solid ${T.border}`,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  py: 1.5,
                  minWidth: 'auto',
                  px: { xs: 2, sm: 3 },
                  '&.Mui-selected': { color: T.gold },
                },
                '& .MuiTabs-indicator': { bgcolor: T.gold, height: 3 },
              }}
            >
              <Tab label={`Todos (${totalResults})`} />
              <Tab label={`Produtos (${stats.products})`} />
              <Tab label={`Serviços (${stats.services})`} />
            </Tabs>

            {/* Resultados */}
            <Box>
              {paginatedResults.map((result, index) => (
                <ResultCard key={`${result.storeId}-${result.id}`} item={result} index={index} />
              ))}
            </Box>

            {/* Paginação */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  size={isMobile ? 'small' : 'large'}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: '10px',
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      '&.Mui-selected': {
                        bgcolor: T.gold,
                        color: T.white,
                        '&:hover': { bgcolor: T.goldLight },
                      },
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default SearchResultsPage;