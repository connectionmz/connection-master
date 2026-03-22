import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get, push, set, update } from 'firebase/database';
import { auth, db } from '../../fb';
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
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  FormHelperText,
  Autocomplete
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
  LinkedIn,
  RequestQuote,
  Close,
  Send,
  Search,
  Inventory,
  Category
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

const StoreDetailDesk = ({user}) => {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [shareAnchorEl, setShareAnchorEl] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [openQuoteDialog, setOpenQuoteDialog] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [quoteForm, setQuoteForm] = useState({
        productId: '',
        productName: '',
        productType: '',
        quantity: 1,
        customerEmail: user.email || '',
        customerContact: user.contacto || '',
        message: '',
        contactPreference: 'whatsapp'
    });
    const [quoteSubmitting, setQuoteSubmitting] = useState(false);
    const [quoteError, setQuoteError] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    useEffect(() => {
        const fetchStoreDetails = async () => {
            try {
                setLoading(true);
                const storeRef = ref(db, `stores/${storeId}`);
                const productsRef = ref(db, `stores/${storeId}/products`);
                
                const storeSnapshot = await get(storeRef);
                const productsSnapshot = await get(productsRef);

                if (storeSnapshot.exists()) {
                    const storeData = storeSnapshot.val();
                    const productsData = productsSnapshot.exists() ? productsSnapshot.val() : {};

                    // Preparar opções de produtos para o Autocomplete
                    const options = Object.entries(productsData).map(([id, product]) => ({
                        id: id,
                        name: product.name || 'Produto sem nome',
                        type: product.type || 'product',
                        price: product.price || 0,
                        category: product.category || '',
                        description: product.description || ''
                    }));

                    setProductOptions(options);

                    setStore({
                        id: storeId,
                        name: storeData.name || storeData.nome || 'Loja sem nome',
                        description: storeData.description || storeData.bio || '',
                        logo: storeData.company?.logo || storeData.logoUrl || '',
                        coverUrl: storeData.coverUrl || '',
                        sector: storeData.sector || '',
                        provincia: storeData.location?.province || storeData.company?.provincia || storeData.provincia || '',
                        distrito: storeData.company?.distrito || storeData.distrito || '',
                        endereco: storeData.location?.address || storeData.endereco || '',
                        contacto: storeData.contact?.phone || storeData.contacto || '',
                        email: storeData.contact?.email || storeData.email || '',
                        website: storeData.socialMedia?.website || storeData.social?.website || '',
                        verified: storeData.verified || false,
                        totalReviews: 128,
                        products: productsData,
                        social: storeData.socialMedia || storeData.social || {},
                        businessHours: storeData.businessHours || {
                            monday: { open: '08:00', close: '17:00', closed: false },
                            tuesday: { open: '08:00', close: '17:00', closed: false },
                            wednesday: { open: '08:00', close: '17:00', closed: false },
                            thursday: { open: '08:00', close: '17:00', closed: false },
                            friday: { open: '08:00', close: '17:00', closed: false },
                            saturday: { open: '09:00', close: '13:00', closed: false },
                            sunday: { closed: true }
                        },
                        policies: storeData.policies || {
                            delivery: 'Entrega disponível para toda a região. Consulte o prazo no momento da compra.',
                            returns: 'Devoluções aceitas em até 7 dias após o recebimento, com produto em perfeito estado.',
                            payments: 'Aceitamos dinheiro, transferência bancária e cartões.'
                        },
                        createdAt: storeData.createdAt
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
        const favorites = JSON.parse(localStorage.getItem('storeFavorites') || '[]');
        if (!isFavorite) {
            favorites.push(storeId);
        } else {
            const index = favorites.indexOf(storeId);
            if (index > -1) favorites.splice(index, 1);
        }
        localStorage.setItem('storeFavorites', JSON.stringify(favorites));
    };

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

    // Abrir modal de cotação
    const handleOpenQuoteDialog = () => {
        setOpenQuoteDialog(true);
        setQuoteError('');
    };

    // Fechar modal de cotação
    const handleCloseQuoteDialog = () => {
        setOpenQuoteDialog(false);
        setQuoteForm({
            productId: '',
            productName: '',
            productType: '',
            quantity: 1,
            customerEmail: '',
            customerContact: '',
            message: '',
            contactPreference: 'whatsapp'
        });
    };

    // Handler para seleção de produto
    const handleProductSelect = (event, newValue) => {
        if (newValue) {
            setQuoteForm(prev => ({
                ...prev,
                productId: newValue.id,
                productName: newValue.name,
                productType: newValue.type
            }));
        } else {
            setQuoteForm(prev => ({
                ...prev,
                productId: '',
                productName: '',
                productType: ''
            }));
        }
    };

    // Handler para produto personalizado (digitar manualmente)
    const handleCustomProduct = (event) => {
        setQuoteForm(prev => ({
            ...prev,
            productId: 'custom',
            productName: event.target.value,
            productType: 'custom'
        }));
    };

// Enviar cotação
const handleSubmitQuote = async () => {
    if (!quoteForm.productName.trim()) {
        setQuoteError('Por favor, selecione ou informe o produto/serviço desejado');
        return;
    }

    setQuoteSubmitting(true);
    setQuoteError('');

    try {
        // Obter o usuário atual (se estiver logado)
        const currentUser = auth.currentUser;
        
        // Gerar ID único para a cotação
        const quoteId = push(ref(db, 'quotes')).key;
        
        // Preparar dados da cotação para salvar no Firebase
        const quoteData = {
            id: quoteId,
            storeId: storeId,
            storeName: store.name,
            storeContact: store.contacto,
            storeEmail: store.email,
            
            // Dados do cliente
            customerId: currentUser?.uid || null,
            customerName: currentUser?.displayName || null,
            customerEmail: quoteForm.customerEmail || currentUser?.email || null,
            customerContact: quoteForm.customerContact || null,
            
            // Dados da cotação
            productId: quoteForm.productId || null,
            productName: quoteForm.productName,
            productType: quoteForm.productType,
            quantity: quoteForm.quantity,
            message: quoteForm.message || '',
            contactPreference: quoteForm.contactPreference,
            
            // Status e datas
            status: 'pending', // pending, answered, rejected, expired
            viewed: false,
            responded: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            source: 'store_page',
            userAgent: navigator.userAgent,
            ipAddress: await getClientIP(), 
        };
        
        // Salvar cotação no Firebase
        await set(ref(db, `quotes/${storeId}/${quoteId}`), quoteData);

        if (currentUser?.uid) {
            await set(ref(db, `user_quotes/${currentUser.uid}/${quoteId}`), {
                ...quoteData,
                storeId: storeId,
                storeName: store.name,
                createdAt: new Date().toISOString()
            });

        }

        // Exibir mensagem de sucesso
        setQuoteError('');
        handleCloseQuoteDialog();
        
        // Mostrar feedback de sucesso
        alert(`Cotação #${quoteId} enviada com sucesso!\n\nA loja ${store.name} entrará em contato em breve.`);
        
    } catch (error) {
        console.error('Erro ao enviar cotação:', error);
        setQuoteError('Erro ao enviar cotação. Tente novamente.');
    } finally {
        setQuoteSubmitting(false);
    }
};

// Função auxiliar para obter IP do cliente (opcional)
const getClientIP = async () => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Erro ao obter IP:', error);
        return null;
    }
};
    const formatTime = (time) => {
        if (!time) return '--:--';
        return time;
    };

    const isStoreOpen = () => {
        if (!store?.businessHours) return null;
        
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
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
                                    variant="contained"
                                    startIcon={<RequestQuote />}
                                    onClick={handleOpenQuoteDialog}
                                    sx={{
                                        bgcolor: T.gold,
                                        color: T.white,
                                        '&:hover': { bgcolor: T.goldLight },
                                        borderRadius: '12px',
                                        py: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Pedir Cotação
                                </Button>
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

            {/* Conteúdo Principal - mantido igual ao original */}
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
                            />
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
                                        monday: 'Segunda-feira',
                                        tuesday: 'Terça-feira',
                                        wednesday: 'Quarta-feira',
                                        thursday: 'Quinta-feira',
                                        friday: 'Sexta-feira',
                                        saturday: 'Sábado',
                                        sunday: 'Domingo'
                                    };
                                    
                                    const now = new Date();
                                    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
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
                                                            : `${schedule.open || '--:--'} - ${schedule.close || '--:--'}`
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
                                            href={store.social.facebook.startsWith('http') ? store.social.facebook : `https://${store.social.facebook}`}
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
                                            href={store.social.instagram.startsWith('http') ? store.social.instagram : `https://${store.social.instagram}`}
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
                                            href={store.social.twitter.startsWith('http') ? store.social.twitter : `https://${store.social.twitter}`}
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
                                            href={store.website.startsWith('http') ? store.website : `https://${store.website}`}
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

            {/* Modal de Pedido de Cotação com Autocomplete */}
            <Dialog
                open={openQuoteDialog}
                onClose={handleCloseQuoteDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        border: `1px solid ${T.border}`,
                        background: T.white,
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
                        color: T.white,
                        borderRadius: '24px 24px 0 0',
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RequestQuote sx={{ color: T.gold }} /> Pedir Cotação
                    </Typography>
                    <IconButton onClick={handleCloseQuoteDialog} sx={{ color: T.white }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="body2" sx={{ color: T.textSub, mb: 3 }}>
                        Envie sua solicitação de cotação para <strong>{store.name}</strong>. 
                        A loja entrará em contato com você em breve.
                    </Typography>

                    {quoteError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
                            {quoteError}
                        </Alert>
                    )}

                    {productOptions.length > 0 ? (
                        <Autocomplete
                            options={productOptions}
                            getOptionLabel={(option) => `${option.name}${option.category ? ` (${option.category})` : ''} - ${option.type === 'product' ? 'Produto' : 'Serviço'}`}
                            onChange={handleProductSelect}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Selecione um produto/serviço"
                                    placeholder="Digite para buscar..."
                                    variant="outlined"
                                    fullWidth
                                    required
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <InputAdornment position="start">
                                                    <Search sx={{ color: T.gold }} />
                                                </InputAdornment>
                                                {params.InputProps.startAdornment}
                                            </>
                                        ),
                                    }}
                                    sx={{
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '12px',
                                            '&:hover fieldset': { borderColor: T.gold },
                                            '&.Mui-focused fieldset': { borderColor: T.gold },
                                        },
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                                        {option.type === 'product' ? (
                                            <Inventory sx={{ color: T.gold, fontSize: 20 }} />
                                        ) : (
                                            <Category sx={{ color: T.gold, fontSize: 20 }} />
                                        )}
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {option.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                <Chip
                                                    label={option.type === 'product' ? 'Produto' : 'Serviço'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: option.type === 'product' ? T.goldPale : T.surface,
                                                        color: option.type === 'product' ? T.gold : T.textMid,
                                                        fontSize: '0.7rem',
                                                    }}
                                                />
                                                {option.category && (
                                                    <Chip
                                                        label={option.category}
                                                        size="small"
                                                        sx={{ bgcolor: T.surface, color: T.textMid, fontSize: '0.7rem' }}
                                                    />
                                                )}
                                                {option.price > 0 && (
                                                    <Chip
                                                        label={`${option.price.toFixed(2)} MT`}
                                                        size="small"
                                                        sx={{ bgcolor: T.goldPale, color: T.gold, fontSize: '0.7rem' }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </li>
                            )}
                        />
                    ) : (
                        <TextField
                            fullWidth
                            label="Produto/Serviço Desejado *"
                            value={quoteForm.productName}
                            onChange={handleCustomProduct}
                            sx={{ mb: 3 }}
                            required
                            placeholder="Digite o produto ou serviço que deseja"
                            InputLabelProps={{ sx: { color: T.textSub } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: T.gold }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    '&:hover fieldset': { borderColor: T.gold },
                                    '&.Mui-focused fieldset': { borderColor: T.gold },
                                },
                            }}
                        />
                    )}

                    <TextField
                        fullWidth
                        label="Quantidade"
                        type="number"
                        value={quoteForm.quantity}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                        sx={{ mb: 3 }}
                        InputProps={{ inputProps: { min: 1 } }}
                        InputLabelProps={{ sx: { color: T.textSub } }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                '&:hover fieldset': { borderColor: T.gold },
                                '&.Mui-focused fieldset': { borderColor: T.gold },
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Seu Email (opcional)"
                        type="email"
                        value={quoteForm.customerEmail}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                        sx={{ mb: 3 }}
                        placeholder="exemplo@email.com"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Email sx={{ color: T.gold, fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        InputLabelProps={{ sx: { color: T.textSub } }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                '&:hover fieldset': { borderColor: T.gold },
                                '&.Mui-focused fieldset': { borderColor: T.gold },
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Seu Contacto (opcional)"
                        value={quoteForm.customerContact}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, customerContact: e.target.value }))}
                        sx={{ mb: 3 }}
                        placeholder="+258 84 123 4567"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Phone sx={{ color: T.gold, fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        InputLabelProps={{ sx: { color: T.textSub } }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                '&:hover fieldset': { borderColor: T.gold },
                                '&.Mui-focused fieldset': { borderColor: T.gold },
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Mensagem (opcional)"
                        multiline
                        rows={4}
                        value={quoteForm.message}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Descreva suas necessidades, especificações ou dúvidas..."
                        sx={{ mb: 3 }}
                        InputLabelProps={{ sx: { color: T.textSub } }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                '&:hover fieldset': { borderColor: T.gold },
                                '&.Mui-focused fieldset': { borderColor: T.gold },
                            },
                        }}
                    />

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel sx={{ color: T.textSub }}>Preferência de Contacto</InputLabel>
                        <Select
                            value={quoteForm.contactPreference}
                            onChange={(e) => setQuoteForm(prev => ({ ...prev, contactPreference: e.target.value }))}
                            label="Preferência de Contacto"
                            sx={{
                                borderRadius: '12px',
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.gold },
                            }}
                        >
                            <MenuItem value="whatsapp">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WhatsApp sx={{ color: '#25D366', fontSize: 20 }} />
                                    WhatsApp
                                </Box>
                            </MenuItem>
                            <MenuItem value="email">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Email sx={{ color: '#EA4335', fontSize: 20 }} />
                                    Email
                                </Box>
                            </MenuItem>
                        </Select>
                    </FormControl>

                    <Typography variant="caption" sx={{ color: T.textSub, display: 'block', mt: 1 }}>
                        A sua solicitação será enviada diretamente para a loja. 
                        {quoteForm.contactPreference === 'whatsapp' && ' Você será redirecionado ao WhatsApp.'}
                        {quoteForm.contactPreference === 'email' && ' Você será redirecionado ao seu cliente de email.'}
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: `1px solid ${T.border}` }}>
                    <Button
                        onClick={handleCloseQuoteDialog}
                        variant="outlined"
                        sx={{
                            borderColor: T.borderMid,
                            color: T.textSub,
                            '&:hover': { borderColor: T.gold, color: T.gold },
                            borderRadius: '10px',
                            textTransform: 'none',
                            px: 3,
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmitQuote}
                        variant="contained"
                        disabled={quoteSubmitting || !quoteForm.productName.trim()}
                        startIcon={quoteSubmitting ? <CircularProgress size={20} /> : <Send />}
                        sx={{
                            bgcolor: T.gold,
                            color: T.white,
                            '&:hover': { bgcolor: T.goldLight },
                            borderRadius: '10px',
                            textTransform: 'none',
                            px: 3,
                        }}
                    >
                        {quoteSubmitting ? 'Enviando...' : 'Enviar Cotação'}
                    </Button>
                </DialogActions>
            </Dialog>

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