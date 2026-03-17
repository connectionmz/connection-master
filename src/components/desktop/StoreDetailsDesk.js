import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../../fb';
import ProductGridDesk from './ProductGridDesk';
import { 
  Box, 
  Typography, 
  IconButton, 
  CircularProgress, 
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Tabs,
  Tab,
  Link,
  Rating,
  Breadcrumbs,
  Paper,
  Stack,
  Fab,
  Container,
  Fade,
  Grow,
  Zoom,
  Skeleton,
  Alert,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  Store, 
  Share, 
  Phone, 
  Email, 
  LocationOn, 
  AccessTime, 
  Facebook, 
  Instagram, 
  Twitter, 
  WhatsApp,
  LocalShipping,
  AssignmentReturn,
  Payment,
  Favorite,
  FavoriteBorder,
  Star,
  StarHalf,
  StarBorder,
  NavigateNext,
  Home,
  Groups,
  CalendarMonth,
  ThumbUp,
  Public,
  Language,
  Verified,
  Security,
  Info,
  ArrowBack,
  CheckCircle,
  Schedule,
  Map,
  CreditCard,
  Telegram,
  LinkedIn
} from '@mui/icons-material';
import BackButton from '../BackButton';

/* ── Design Tokens (mesmos da hero) ───────────────────────────────────── */
const T = {
  navy:     '#08192E',
  navyMid:  '#0E2849',
  navyLight:'#183A63',
  gold:     '#C8903A',
  goldLight:'#E8B96A',
  goldPale: '#FDF3E3',
  cream:    '#FAFAF7',
  white:    '#FFFFFF',
  text:     '#0F1C2D',
  textMid:  '#3D5A7A',
  textSub:  '#6B89A5',
  border:   '#E0E8F0',
  borderMid:'#C5D4E3',
  surface:  '#F4F7FB',
};

/* ── Keyframes (mesmos da hero) ───────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-gold {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(0.98); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease both;
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  .delay-5 { animation-delay: 0.58s; }
  
  .store-header {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .store-header:hover {
    transform: translateY(-2px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .info-card {
    transition: all 0.2s ease;
  }
  .info-card:hover {
    transform: translateY(-2px);
    border-color: ${T.gold} !important;
    background: ${T.goldPale};
  }
  .tab-indicator {
    background: ${T.gold} !important;
    height: 3px !important;
  }
`;

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`store-tabpanel-${index}`}
      aria-labelledby={`store-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={true} timeout={500}>
          <Box sx={{ py: 3 }}>{children}</Box>
        </Fade>
      )}
    </div>
  );
}

const StoreDetailDesk = () => {
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [shareAnchorEl, setShareAnchorEl] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    useEffect(() => {
        const fetchStoreDetails = async () => {
            try {
                setLoading(true);
                const storeRef = ref(db, `company/${storeId}`);
                const storeSnapshot = await get(storeRef);
                
                if (storeSnapshot.exists()) {
                    const storeData = storeSnapshot.val();
                    setStore({
                        id: storeId,
                        name: storeData.nome || 'Loja sem nome',
                        description: storeData.bio || storeData.descricao || '',
                        logo: storeData.logoUrl || '',
                        coverUrl: storeData.coverUrl || '',
                        sector: storeData.sector || '',
                        provincia: storeData.provincia || '',
                        distrito: storeData.distrito || '',
                        endereco: storeData.endereco || '',
                        contacto: storeData.contacto || '',
                        email: storeData.email || '',
                        website: storeData.social?.website || '',
                        verified: storeData.verified || false,
                        totalReviews: 128,
                        products: storeData.products || {},
                        social: storeData.social || {},
                        businessHours: storeData.businessHours || {
                            segunda: { open: '08:00', close: '17:00', closed: false },
                            terca: { open: '08:00', close: '17:00', closed: false },
                            quarta: { open: '08:00', close: '17:00', closed: false },
                            quinta: { open: '08:00', close: '17:00', closed: false },
                            sexta: { open: '08:00', close: '17:00', closed: false },
                            sabado: { open: '09:00', close: '13:00', closed: false },
                            domingo: { closed: true }
                        },
                        policies: storeData.policies || {
                            delivery: 'Entrega disponível para toda a cidade. Consulte o prazo no momento da compra.',
                            returns: 'Devoluções aceitas em até 7 dias após o recebimento, com produto em perfeito estado.',
                            payments: 'Aceitamos dinheiro, transferência bancária e cartões.'
                        }
                    });
                } else {
                    setStore(null);
                }
            } catch (error) {
                console.error("Erro ao buscar os detalhes da loja:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStoreDetails();
    }, [storeId]);

    // Detectar scroll para mostrar botão voltar ao topo
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleOpenShareMenu = (event) => {
        event.preventDefault();
        setShareAnchorEl(event.currentTarget);
    };

    const handleCloseShareMenu = () => {
        setShareAnchorEl(null);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        // Salvar no localStorage
        const favorites = JSON.parse(localStorage.getItem('storeFavorites') || '[]');
        if (!isFavorite) {
            favorites.push(storeId);
        } else {
            const index = favorites.indexOf(storeId);
            if (index > -1) favorites.splice(index, 1);
        }
        localStorage.setItem('storeFavorites', JSON.stringify(favorites));
    };

    // Carregar favoritos do localStorage
    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('storeFavorites') || '[]');
        setIsFavorite(favorites.includes(storeId));
    }, [storeId]);

    const shareOnPlatform = (platform) => {
        if (!store) return;
        
        const storeUrl = `${window.location.origin}/loja/${storeId}`;
        const text = `Confira esta loja: ${store.name}`;
        let shareUrl = '';
        
        switch(platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' - ' + storeUrl)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}&quote=${encodeURIComponent(text)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(text)}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(text)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(storeUrl)}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(text + '\n\n' + storeUrl)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(storeUrl);
                handleCloseShareMenu();
                return;
            default:
                return;
        }
        
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
        handleCloseShareMenu();
    };

    const handleBackToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleContact = (type) => {
        switch(type) {
            case 'phone':
                window.location.href = `tel:${store.contacto}`;
                break;
            case 'whatsapp':
                window.open(`https://wa.me/${store.contacto?.replace(/\D/g, '')}`, '_blank');
                break;
            case 'email':
                window.location.href = `mailto:${store.email}`;
                break;
            default:
                break;
        }
    };

    // Função para formatar horário
    const formatTime = (time) => {
        if (!time) return '--:--';
        return time;
    };

    // Verificar se a loja está aberta agora
    const isStoreOpen = () => {
        if (!store?.businessHours) return null;
        
        const now = new Date();
        const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const currentDay = days[now.getDay()];
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const todaySchedule = store.businessHours[currentDay];
        
        if (!todaySchedule || todaySchedule.closed) return false;
        
        return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
    };

    const storeOpen = isStoreOpen();

    if (loading) {
        return (
            <Box 
                sx={{ 
                    minHeight: '100vh', 
                    background: T.cream,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                }}
            >
                <style>{KEYFRAMES}</style>
                <Box sx={{ textAlign: 'center' }}>
                    <Box
                        sx={{
                            width: 48, height: 48,
                            borderRadius: '50%',
                            border: `3px solid ${T.border}`,
                            borderTopColor: T.gold,
                            animation: 'fadeUp 0.8s infinite linear',
                            mx: 'auto',
                            mb: 2
                        }}
                    />
                    <Typography sx={{ color: T.textSub }}>Carregando detalhes da loja...</Typography>
                </Box>
            </Box>
        );
    }

    if (!store) {
        return (
            <Box 
                sx={{ 
                    minHeight: '100vh', 
                    background: T.cream,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                }}
            >
                <style>{KEYFRAMES}</style>
                <Paper 
                    sx={{ 
                        p: 6, 
                        textAlign: 'center',
                        borderRadius: '24px',
                        border: `1px solid ${T.border}`,
                        maxWidth: 400
                    }}
                >
                    <Store sx={{ fontSize: 64, color: T.borderMid, mb: 2 }} />
                    <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', mt: 2, color: T.text }}>
                        Loja não encontrada
                    </Typography>
                    <Typography sx={{ color: T.textSub, mt: 1, mb: 3 }}>
                        A loja que procura não existe ou foi removida.
                    </Typography>
                    <Button
                        onClick={() => window.history.back()}
                        variant="contained"
                        startIcon={<ArrowBack />}
                        sx={{
                            bgcolor: T.gold,
                            color: T.white,
                            '&:hover': { bgcolor: T.goldLight },
                            borderRadius: '12px',
                            px: 4,
                            py: 1.5,
                            textTransform: 'none'
                        }}
                    >
                        Voltar
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box 
            sx={{ 
                backgroundColor: T.cream, 
                minHeight: '100vh',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}
        >
            <style>{KEYFRAMES}</style>

            {/* Header com design da hero */}
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
                    position: 'relative',
                    overflow: 'hidden',
                    pt: { xs: 2, md: 3 },
                    pb: { xs: 4, md: 6 },
                }}
            >
                {/* Background decorations */}
                <Box sx={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `
                        radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
                        radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.07) 0%, transparent 50%)
                    `,
                }} />
                <Box sx={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
                    backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
                    backgroundSize: '56px 56px',
                }} />

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <BackButton sx={{ color: T.white, mb: 2 }} />
                    
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Avatar 
                                    src={store.logo} 
                                    alt={store.name}
                                    sx={{ 
                                        width: { xs: 80, md: 120 }, 
                                        height: { xs: 80, md: 120 },
                                        border: `4px solid ${T.gold}`,
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                        bgcolor: T.white
                                    }}
                                >
                                    {store.name?.charAt(0)}
                                </Avatar>
                                
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Typography 
                                            variant="h4" 
                                            sx={{ 
                                                fontWeight: 800, 
                                                color: T.white,
                                                fontFamily: '"Playfair Display", serif',
                                            }}
                                        >
                                            {store.name}
                                        </Typography>
                                        {store.verified && (
                                            <Tooltip title="Loja Verificada">
                                                <Verified sx={{ color: T.gold, fontSize: 28 }} />
                                            </Tooltip>
                                        )}
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                                        {store.sector && (
                                            <Chip
                                                label={store.sector}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(200,144,58,0.15)',
                                                    color: T.goldLight,
                                                    fontWeight: 600,
                                                }}
                                            />
                                        )}
                                        <Chip
                                            icon={<LocationOn sx={{ fontSize: 14 }} />}
                                            label={`${store.provincia || 'Localização não informada'}${store.distrito ? `, ${store.distrito}` : ''}`}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(255,255,255,0.1)',
                                                color: T.white,
                                            }}
                                        />
                                        <Chip
                                            icon={<AccessTime sx={{ fontSize: 14 }} />}
                                            label={storeOpen === null ? 'Horário não definido' : storeOpen ? 'Aberto agora' : 'Fechado'}
                                            size="small"
                                            sx={{
                                                bgcolor: storeOpen ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                                color: storeOpen ? '#22c55e' : '#ef4444',
                                            }}
                                        />
                                    </Box>
                               
                                </Box>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Stack spacing={2}>
                               
                                <Button 
                                    variant="outlined" 
                                    startIcon={<Share />}
                                    onClick={handleOpenShareMenu}
                                    sx={{
                                        borderColor: 'rgba(255,255,255,0.25)',
                                        color: T.white,
                                        '&:hover': { 
                                            borderColor: T.gold, 
                                            bgcolor: 'rgba(200,144,58,0.1)' 
                                        },
                                        borderRadius: '12px',
                                        py: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Compartilhar
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Menu de Navegação */}
            <Container maxWidth="lg" sx={{ mt: 3 }}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: '16px',
                        border: `1px solid ${T.border}`,
                        background: T.white,
                        overflow: 'hidden',
                    }}
                >
                    <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange} 
                        variant="scrollable"
                        scrollButtons="auto"
                        TabIndicatorProps={{
                            sx: {
                                background: T.gold,
                                height: 3,
                            }
                        }}
                        sx={{
                            '& .MuiTab-root': { 
                                minHeight: 64,
                                fontWeight: 600,
                                color: T.textSub,
                                textTransform: 'none',
                                fontSize: '0.9rem',
                                '&.Mui-selected': {
                                    color: T.gold,
                                },
                            },
                        }}
                    >
                        <Tab icon={<Store />} iconPosition="start" label="Produtos" />
                        <Tab icon={<LocalShipping />} iconPosition="start" label="Entregas" />
                        <Tab icon={<AssignmentReturn />} iconPosition="start" label="Devoluções" />
                        <Tab icon={<Info />} iconPosition="start" label="Sobre a Loja" />
                        <Tab icon={<Schedule />} iconPosition="start" label="Horário" />
                        <Tab icon={<Phone />} iconPosition="start" label="Contacto" />
                    </Tabs>
                </Paper>
            </Container>

            {/* Conteúdo Principal */}
            <Container maxWidth="lg" sx={{ mt: 2, pb: 6 }}>
                <TabPanel value={activeTab} index={0}>
                    <ProductGridDesk 
                        products={store.products} 
                        storeId={storeId} 
                        showPrices={true}
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper
                                className="info-card"
                                sx={{
                                    p: 4,
                                    borderRadius: '20px',
                                    border: `1px solid ${T.border}`,
                                    background: T.white,
                                }}
                            >
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        mb: 3, 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        fontFamily: '"Playfair Display", serif',
                                        fontWeight: 700,
                                        color: T.text
                                    }}
                                >
                                    <LocalShipping sx={{ mr: 1, color: T.gold }} /> 
                                    Política de Entregas
                                </Typography>
                                
                                <Typography variant="body1" paragraph sx={{ color: T.textMid, lineHeight: 1.8 }}>
                                    {store.policies?.delivery || "Entrega disponível para toda a região. Consulte o prazo no momento da compra."}
                                </Typography>
                                
                                <Divider sx={{ my: 3 }} />
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Card variant="outlined" sx={{ p: 2, borderColor: T.border }}>
                                            <Typography variant="h6" sx={{ color: T.gold, mb: 1 }}>Entrega Padrão</Typography>
                                            <Typography variant="body2" sx={{ color: T.textSub }}>
                                                2-5 dias úteis • Grátis para compras acima de 2500 MZN
                                            </Typography>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Card variant="outlined" sx={{ p: 2, borderColor: T.border }}>
                                            <Typography variant="h6" sx={{ color: T.gold, mb: 1 }}>Entrega Expressa</Typography>
                                            <Typography variant="body2" sx={{ color: T.textSub }}>
                                                1-2 dias úteis • 250 MZN
                                            </Typography>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Paper
                                className="info-card"
                                sx={{
                                    p: 3,
                                    borderRadius: '20px',
                                    border: `1px solid ${T.border}`,
                                    background: T.white,
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 600, color: T.text, mb: 2 }}>
                                    Informações Adicionais
                                </Typography>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircle sx={{ fontSize: 20, color: T.gold }} />
                                        <Typography variant="body2" sx={{ color: T.textMid }}>
                                            Entrega garantida
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircle sx={{ fontSize: 20, color: T.gold }} />
                                        <Typography variant="body2" sx={{ color: T.textMid }}>
                                            Rastreamento disponível
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircle sx={{ fontSize: 20, color: T.gold }} />
                                        <Typography variant="body2" sx={{ color: T.textMid }}>
                                            Embalagem segura
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <Paper
                        className="info-card"
                        sx={{
                            p: 4,
                            borderRadius: '20px',
                            border: `1px solid ${T.border}`,
                            background: T.white,
                        }}
                    >
                        <Typography 
                            variant="h5" 
                            sx={{ 
                                mb: 3, 
                                display: 'flex', 
                                alignItems: 'center',
                                fontFamily: '"Playfair Display", serif',
                                fontWeight: 700,
                                color: T.text
                            }}
                        >
                            <AssignmentReturn sx={{ mr: 1, color: T.gold }} /> 
                            Política de Devoluções
                        </Typography>
                        
                        <Typography variant="body1" paragraph sx={{ color: T.textMid, lineHeight: 1.8 }}>
                            {store.policies?.returns || "Devoluções aceitas em até 7 dias após o recebimento, com produto em perfeito estado."}
                        </Typography>
                        
                        <Divider sx={{ my: 3 }} />
                        
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ color: T.gold }}>7</Typography>
                                    <Typography variant="body2" sx={{ color: T.textSub }}>Dias para devolução</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ color: T.gold }}>100%</Typography>
                                    <Typography variant="body2" sx={{ color: T.textSub }}>Reembolso garantido</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ color: T.gold }}>24h</Typography>
                                    <Typography variant="body2" sx={{ color: T.textSub }}>Resposta</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper
                                className="info-card"
                                sx={{
                                    p: 4,
                                    borderRadius: '20px',
                                    border: `1px solid ${T.border}`,
                                    background: T.white,
                                }}
                            >
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        mb: 3, 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        fontFamily: '"Playfair Display", serif',
                                        fontWeight: 700,
                                        color: T.text
                                    }}
                                >
                                    <Store sx={{ mr: 1, color: T.gold }} /> 
                                    Sobre a Nossa Loja
                                </Typography>
                                
                                <Typography variant="body1" paragraph sx={{ color: T.textMid, lineHeight: 1.8 }}>
                                    {store.description || "Bem-vindo à nossa loja! Estamos comprometidos em oferecer os melhores produtos e serviços para nossos clientes."}
                                </Typography>
                                
                                {store.endereco && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="h6" sx={{ color: T.text, mb: 1 }}>
                                            Localização
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocationOn sx={{ color: T.gold }} />
                                            <Typography sx={{ color: T.textMid }}>
                                                {store.endereco}
                                                {store.provincia && `, ${store.provincia}`}
                                                {store.distrito && `, ${store.distrito}`}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Paper
                                className="info-card"
                                sx={{
                                    p: 3,
                                    borderRadius: '20px',
                                    border: `1px solid ${T.border}`,
                                    background: T.white,
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 600, color: T.text, mb: 2 }}>
                                    Estatísticas
                                </Typography>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: T.textSub }}>Total de Produtos</Typography>
                                        <Typography variant="h5" sx={{ color: T.gold }}>
                                            {Object.keys(store.products || {}).length}
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    <Box>
                                        <Typography variant="body2" sx={{ color: T.textSub }}>Membro desde</Typography>
                                        <Typography variant="body1" sx={{ color: T.text }}>
                                            {store.createdAt ? new Date(store.createdAt).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) : 'Não informado'}
                                        </Typography>
                                    </Box>
                                    <Divider />
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={4}>
                    <Paper
                        className="info-card"
                        sx={{
                            p: 4,
                            borderRadius: '20px',
                            border: `1px solid ${T.border}`,
                            background: T.white,
                        }}
                    >
                        <Typography 
                            variant="h5" 
                            sx={{ 
                                mb: 3, 
                                display: 'flex', 
                                alignItems: 'center',
                                fontFamily: '"Playfair Display", serif',
                                fontWeight: 700,
                                color: T.text
                            }}
                        >
                            <Schedule sx={{ mr: 1, color: T.gold }} /> 
                            Horário de Funcionamento
                        </Typography>
                        
                        {store.businessHours ? (
                            <Grid container spacing={2}>
                                {Object.entries(store.businessHours).map(([day, schedule]) => {
                                    const dayNames = {
                                        segunda: 'Segunda-feira',
                                        terca: 'Terça-feira',
                                        quarta: 'Quarta-feira',
                                        quinta: 'Quinta-feira',
                                        sexta: 'Sexta-feira',
                                        sabado: 'Sábado',
                                        domingo: 'Domingo'
                                    };
                                    
                                    // Verificar se é o dia atual
                                    const now = new Date();
                                    const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
                                    const currentDay = days[now.getDay()];
                                    const isToday = day === currentDay;
                                    
                                    return (
                                        <Grid item xs={12} sm={6} key={day}>
                                            <Card 
                                                variant="outlined" 
                                                sx={{ 
                                                    p: 2,
                                                    borderColor: isToday ? T.gold : T.border,
                                                    bgcolor: isToday ? T.goldPale : 'transparent',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center'
                                                }}>
                                                    <Typography 
                                                        variant="body1" 
                                                        sx={{ 
                                                            fontWeight: isToday ? 700 : 500,
                                                            color: isToday ? T.gold : T.text
                                                        }}
                                                    >
                                                        {dayNames[day] || day}
                                                        {isToday && (
                                                            <Chip 
                                                                label="Hoje" 
                                                                size="small" 
                                                                sx={{ 
                                                                    ml: 1, 
                                                                    bgcolor: T.gold,
                                                                    color: T.white,
                                                                    fontSize: '0.6rem',
                                                                    height: 20
                                                                }} 
                                                            />
                                                        )}
                                                    </Typography>
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            color: schedule.closed ? '#ef4444' : T.textMid,
                                                            fontWeight: isToday ? 600 : 400,
                                                        }}
                                                    >
                                                        {schedule.closed 
                                                            ? 'Fechado' 
                                                            : `${schedule.open} - ${schedule.close}`
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        ) : (
                            <Typography sx={{ color: T.textSub }}>
                                Esta loja ainda não definiu o horário de funcionamento.
                            </Typography>
                        )}
                    </Paper>
                </TabPanel>

                <TabPanel value={activeTab} index={5}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper
                                className="info-card"
                                sx={{
                                    p: 4,
                                    borderRadius: '20px',
                                    border: `1px solid ${T.border}`,
                                    background: T.white,
                                }}
                            >
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        mb: 3, 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        fontFamily: '"Playfair Display", serif',
                                        fontWeight: 700,
                                        color: T.text
                                    }}
                                >
                                    <Phone sx={{ mr: 1, color: T.gold }} /> 
                                    Contacte-nos
                                </Typography>
                                
                                <Stack spacing={3}>
                                    {store.contacto && (
                                        <Box>
                                            <Typography variant="body2" sx={{ color: T.textSub, mb: 1 }}>
                                                Telefone
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="h6" sx={{ color: T.text }}>
                                                    {store.contacto}
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => handleContact('phone')}
                                                    sx={{
                                                        bgcolor: T.gold,
                                                        color: T.white,
                                                        '&:hover': { bgcolor: T.goldLight },
                                                        borderRadius: '8px',
                                                        textTransform: 'none',
                                                    }}
                                                >
                                                    Ligar
                                                </Button>
                                            </Box>
                                        </Box>
                                    )}
                                    
                                    {store.contacto && (
                                        <Box>
                                            <Typography variant="body2" sx={{ color: T.textSub, mb: 1 }}>
                                                WhatsApp
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="h6" sx={{ color: T.text }}>
                                                    {store.contacto}
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => handleContact('whatsapp')}
                                                    startIcon={<WhatsApp />}
                                                    sx={{
                                                        bgcolor: '#25D366',
                                                        color: T.white,
                                                        '&:hover': { bgcolor: '#128C7E' },
                                                        borderRadius: '8px',
                                                        textTransform: 'none',
                                                    }}
                                                >
                                                    WhatsApp
                                                </Button>
                                            </Box>
                                        </Box>
                                    )}
                                    
                                    {store.email && (
                                        <Box>
                                            <Typography variant="body2" sx={{ color: T.textSub, mb: 1 }}>
                                                Email
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="h6" sx={{ color: T.text }}>
                                                    {store.email}
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => handleContact('email')}
                                                    startIcon={<Email />}
                                                    sx={{
                                                        bgcolor: '#EA4335',
                                                        color: T.white,
                                                        '&:hover': { bgcolor: '#B23121' },
                                                        borderRadius: '8px',
                                                        textTransform: 'none',
                                                    }}
                                                >
                                                    Enviar
                                                </Button>
                                            </Box>
                                        </Box>
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Paper
                                className="info-card"
                                sx={{
                                    p: 4,
                                    borderRadius: '20px',
                                    border: `1px solid ${T.border}`,
                                    background: T.white,
                                }}
                            >
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        mb: 3, 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        fontFamily: '"Playfair Display", serif',
                                        fontWeight: 700,
                                        color: T.text
                                    }}
                                >
                                    <Public sx={{ mr: 1, color: T.gold }} /> 
                                    Redes Sociais
                                </Typography>
                                
                                <Stack spacing={2}>
                                    {store.social?.facebook && (
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<Facebook />}
                                            href={store.social.facebook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                borderColor: T.borderMid,
                                                color: '#1877F2',
                                                justifyContent: 'flex-start',
                                                textTransform: 'none',
                                                py: 1.5,
                                                '&:hover': {
                                                    borderColor: '#1877F2',
                                                    bgcolor: 'rgba(24,119,242,0.04)',
                                                }
                                            }}
                                        >
                                            Facebook
                                        </Button>
                                    )}
                                    
                                    {store.social?.instagram && (
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<Instagram />}
                                            href={store.social.instagram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                borderColor: T.borderMid,
                                                color: '#E4405F',
                                                justifyContent: 'flex-start',
                                                textTransform: 'none',
                                                py: 1.5,
                                                '&:hover': {
                                                    borderColor: '#E4405F',
                                                    bgcolor: 'rgba(228,64,95,0.04)',
                                                }
                                            }}
                                        >
                                            Instagram
                                        </Button>
                                    )}
                                    
                                    {store.social?.twitter && (
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<Twitter />}
                                            href={store.social.twitter}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                borderColor: T.borderMid,
                                                color: '#1DA1F2',
                                                justifyContent: 'flex-start',
                                                textTransform: 'none',
                                                py: 1.5,
                                                '&:hover': {
                                                    borderColor: '#1DA1F2',
                                                    bgcolor: 'rgba(29,161,242,0.04)',
                                                }
                                            }}
                                        >
                                            Twitter
                                        </Button>
                                    )}
                                    
                                    {store.website && (
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<Language />}
                                            href={store.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                borderColor: T.borderMid,
                                                color: T.gold,
                                                justifyContent: 'flex-start',
                                                textTransform: 'none',
                                                py: 1.5,
                                                '&:hover': {
                                                    borderColor: T.gold,
                                                    bgcolor: T.goldPale,
                                                }
                                            }}
                                        >
                                            Website
                                        </Button>
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Container>

            {/* Botão Flutuante de Partilha para Mobile */}
            {isMobile && (
                <Fab
                    color="primary"
                    aria-label="share"
                    onClick={handleOpenShareMenu}
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        bgcolor: T.gold,
                        color: T.white,
                        '&:hover': { bgcolor: T.goldLight },
                        boxShadow: '0 8px 24px rgba(200,144,58,0.3)',
                        zIndex: 1000,
                    }}
                >
                    <Share />
                </Fab>
            )}

            {/* Botão Voltar ao Topo */}
            {showBackToTop && (
                <Zoom in={true}>
                    <Fab
                        size="small"
                        onClick={handleBackToTop}
                        sx={{
                            position: 'fixed',
                            bottom: isMobile ? 80 : 24,
                            right: isMobile ? 16 : 24,
                            bgcolor: T.white,
                            color: T.gold,
                            border: `1px solid ${T.gold}`,
                            '&:hover': { bgcolor: T.goldPale },
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                        }}
                    >
                        <ArrowBack sx={{ transform: 'rotate(90deg)' }} />
                    </Fab>
                </Zoom>
            )}

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
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        border: `1px solid ${T.border}`,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        mt: 1
                    }
                }}
            >
                <MenuItem onClick={() => shareOnPlatform('whatsapp')} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <WhatsApp sx={{ color: '#25D366', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
                        WhatsApp
                    </ListItemText>
                </MenuItem>
                <MenuItem onClick={() => shareOnPlatform('facebook')} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <Facebook sx={{ color: '#1877F2', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
                        Facebook
                    </ListItemText>
                </MenuItem>
                <MenuItem onClick={() => shareOnPlatform('twitter')} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <Twitter sx={{ color: '#1DA1F2', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
                        Twitter
                    </ListItemText>
                </MenuItem>
                <MenuItem onClick={() => shareOnPlatform('telegram')} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <Telegram sx={{ color: '#0088cc', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
                        Telegram
                    </ListItemText>
                </MenuItem>
                <MenuItem onClick={() => shareOnPlatform('linkedin')} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <LinkedIn sx={{ color: '#0A66C2', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
                        LinkedIn
                    </ListItemText>
                </MenuItem>
                <MenuItem onClick={() => shareOnPlatform('email')} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <Email sx={{ color: '#EA4335', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
                        Email
                    </ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => shareOnPlatform('copy')} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <Share sx={{ color: T.gold, fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
                        Copiar link
                    </ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default StoreDetailDesk;