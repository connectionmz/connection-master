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
  Fab
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
  Language
} from '@mui/icons-material';
import BackButton from '../BackButton';

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
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    useEffect(() => {
        const fetchStoreDetails = async () => {
            try {
                setLoading(true);
                const storeRef = ref(db, `stores/${storeId}`);
                const storeSnapshot = await get(storeRef);
                
                if (storeSnapshot.exists()) {
                    const storeData = storeSnapshot.val();
                    setStore({
                        ...storeData,
                        products: storeData.products || {},
                        company: storeData.company || {},
                        contact: storeData.contact || { phone: '', email: '', whatsapp: '' },
                        location: storeData.location || { 
                            address: '', 
                            city: '', 
                            province: '',
                            coordinates: { lat: '', lng: '' } 
                        },
                        socialMedia: storeData.socialMedia || { 
                            facebook: '', 
                            instagram: '', 
                            twitter: '', 
                            website: '' 
                        },
                        businessHours: storeData.businessHours || {
                            monday: { open: '', close: '', closed: false },
                            tuesday: { open: '', close: '', closed: false },
                            wednesday: { open: '', close: '', closed: false },
                            thursday: { open: '', close: '', closed: false },
                            friday: { open: '', close: '', closed: false },
                            saturday: { open: '', close: '', closed: false },
                            sunday: { open: '', close: '', closed: false }
                        },
                        policies: storeData.policies || {
                            delivery: '',
                            returns: '',
                            payments: ''
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
    };

    const shareOnPlatform = (platform) => {
        if (!store) return;
        
        const storeUrl = `${window.location.origin}/loja/${storeId}`;
        let shareUrl = '';
        
        switch(platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=Confira esta loja: ${store.name} - ${storeUrl}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(storeUrl)}&text=Confira esta loja: ${store.name}`;
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

    // Função para formatar horário
    const formatTime = (time) => {
        if (!time) return '--:--';
        return time.includes(':') ? time : `${time.substring(0, 2)}:${time.substring(2)}`;
    };

    // Calcular rating médio (simulado)
    const calculateStoreRating = () => {
        return {
            average: 4.7,
            totalReviews: 128,
            fiveStar: 96,
            fourStar: 22,
            threeStar: 7,
            twoStar: 2,
            oneStar: 1
        };
    };

    const ratingData = calculateStoreRating();

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                backgroundColor: '#f5f5f5'
            }}>
                <CircularProgress size={isMobile ? 40 : 60} />
            </Box>
        );
    }

    if (!store) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f5f5f5'
            }}>
                <Typography variant="h6" align="center" color="error">
                    Loja não encontrada
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            backgroundColor: '#f5f5f5',
            pb: 4
        }}>
            {/* Header da Loja */}
            <Paper elevation={2} sx={{ 
                mx: isMobile ? 2 : 4, 
                mt: 2, 
                mb: 3, 
                p: 3, 
                borderRadius: 2,
                background: 'linear-gradient(to right, #f8f9fa, #ffffff)'}}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={2}>
                        <Avatar 
                            alt={store.name} 
                            src={store.company?.logo} 
                            sx={{ 
                                width: isMobile ? 80 : 120, 
                                height: isMobile ? 80 : 120,
                                border: `3px solid ${theme.palette.primary.main}`,
                                boxShadow: 3
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h4" sx={{ 
                            fontWeight: 'bold',
                            color: theme.palette.primary.main,
                            mb: 1
                        }}>
                            {store.name}
                        </Typography>
                        {/*
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip icon={<ThumbUp />} label="98% Avaliações Positivas" size="small" color="success" variant="outlined" />
                            <Chip icon={<LocalShipping />} label="Entrega Rápida" size="small" color="info" variant="outlined" />
                            <Chip icon={<Public />} label="Loja Verificada" size="small" color="primary" variant="outlined" />
                        </Box>
                        */}
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Stack spacing={2}>
                         {/*
                            <Button 
                                variant="contained" 
                                startIcon={isFavorite ? <Favorite /> : <FavoriteBorder />}
                                onClick={toggleFavorite}
                                color={isFavorite ? "error" : "primary"}
                                fullWidth
                                sx={{ borderRadius: 2, py: 1 }}
                            >
                                {isFavorite ? 'Loja Favorita' : 'Seguir Loja'}
                            </Button>
                            */}
                            
                            <Button 
                                variant="outlined" 
                                startIcon={<Share />}
                                onClick={handleOpenShareMenu}
                                fullWidth
                                sx={{ borderRadius: 2, py: 1 }}
                            >
                                Compartilhar
                            </Button>
                            
                           {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="primary">98%</Typography>
                                    <Typography variant="caption">Avaliações Positivas</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="primary">4.7</Typography>
                                    <Typography variant="caption">Classificação</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="primary">2D</Typography>
                                    <Typography variant="caption">Tempo de Resposta</Typography>
                                </Box>
                            </Box>*/}
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            {/* Menu de Navegação */}
            <Paper elevation={1} sx={{ mx: isMobile ? 2 : 4, mb: 3, borderRadius: 2 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTab-root': { 
                            minHeight: 60,
                            fontWeight: 'bold',
                            fontSize: isMobile ? '0.8rem' : '0.9rem'
                        }
                    }}>
                    <Tab icon={<Store />} iconPosition="start" label="Todos os Produtos" />
                    <Tab icon={<LocalShipping />} iconPosition="start" label="Entregas" />
                    <Tab icon={<AssignmentReturn />} iconPosition="start" label="Devoluções" />
                    <Tab icon={<Groups />} iconPosition="start" label="Sobre a Loja" />
                    <Tab icon={<CalendarMonth />} iconPosition="start" label="Horário" />
                    <Tab icon={<Language />} iconPosition="start" label="Contacto" />
                </Tabs>
            </Paper>

            {/* Conteúdo Principal */}
            <Box sx={{ mx: isMobile ? 2 : 4 }}>
                <TabPanel value={activeTab} index={0}>
                    <ProductGridDesk 
                        products={store.products} 
                        storeId={storeId} 
                        showPrices={store.settings?.showPrices !== false}
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                        <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <LocalShipping sx={{ mr: 1, color: 'primary.main' }} /> Política de Entregas
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {store.policies?.delivery || "Esta loja oferece entrega rápida e confiável para todo o país. O prazo de entrega varia entre 2-5 dias úteis dependendo da sua localização."}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="h6" color="primary" gutterBottom>Entrega Padrão</Typography>
                                    <Typography variant="body2">2-5 dias úteis • Grátis para encomendas acima de 2500 MZN</Typography>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="h6" color="primary" gutterBottom>Entrega Expressa</Typography>
                                    <Typography variant="body2">1-2 dias úteis • 250 MZN</Typography>
                                </Card>
                            </Grid>
                        </Grid>
                    </Paper>
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                        <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            Política de Devoluções
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {store.policies?.returns || "Nada definido. Por favor, contacte a loja para mais informações."}
                        </Typography>
                    </Paper>
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                                <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <Store sx={{ mr: 1, color: 'primary.main' }} /> Sobre a Nossa Loja
                                </Typography>
                                <Typography variant="body1" paragraph>
                                    {store.description || ""}
                                </Typography>
                                
                               {/* <Grid container spacing={2} sx={{ mt: 2 }}>
                                    <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                                            <Typography variant="h4" color="primary">500+</Typography>
                                            <Typography variant="body2">Produtos</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 2 }}>
                                            <Typography variant="h4" color="secondary">2.5K</Typography>
                                            <Typography variant="body2">Clientes Satisfeitos</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                                            <Typography variant="h4" color="info">98%</Typography>
                                            <Typography variant="body2">Avaliações Positivas</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                                            <Typography variant="h4" color="success">2</Typography>
                                            <Typography variant="body2">Anos no Mercado</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>*/}
                            </Paper>
                            {/* Localização */}
                            {store.location && (store.location.address || store.location.city) && (
                                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                                    <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <LocationOn sx={{ mr: 1, color: 'primary.main' }} /> Localização
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                        {store.location.address && (
                                            <Typography variant="body1">
                                                {store.location.address}
                                            </Typography>
                                        )}
                                        
                                        {(store.location.city || store.location.province) && (
                                            <Typography variant="body2" color="text.secondary">
                                                {store.location.city}{store.location.city && store.location.province ? ', ' : ''}{store.location.province}
                                            </Typography>
                                        )}
                                    </Box>
                                    
                                    {store.location.address && (
                                        <Button 
                                            variant="contained" 
                                            startIcon={<LocationOn />}
                                            sx={{ borderRadius: 2 }}
                                            onClick={() => {
                                                const query = encodeURIComponent(
                                                    `${store.location.address}, ${store.location.city}, ${store.location.province}`
                                                );
                                                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                                            }}
                                        >
                                            Ver no Mapa
                                        </Button>
                                    )}
                                </Paper>
                            )}
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            {/* Avaliações 
                            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Avaliações da Loja</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Rating value={ratingData.average} precision={0.1} readOnly />
                                    <Typography variant="h6" sx={{ ml: 1 }}>{ratingData.average}/5</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Baseado em {ratingData.totalReviews} avaliações
                                </Typography>
                                
                                {[5, 4, 3, 2, 1].map((star) => (
                                    <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="body2" sx={{ minWidth: 80 }}>
                                            {star} estrela{star > 1 ? 's' : ''}
                                        </Typography>
                                        <Box sx={{ flexGrow: 1, mx: 1 }}>
                                            <Box 
                                                sx={{ 
                                                    height: 8, 
                                                    bgcolor: 'grey.300', 
                                                    borderRadius: 4,
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <Box 
                                                    sx={{ 
                                                        height: '100%', 
                                                        bgcolor: 'warning.main',
                                                        width: `${(ratingData[`${star}Star`] / ratingData.totalReviews) * 100}%`
                                                    }} 
                                                />
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" sx={{ minWidth: 30 }}>
                                            {ratingData[`${star}Star`]}
                                        </Typography>
                                    </Box>
                                ))}
                            </Paper>
                            */}

                            {/* Redes Sociais */}
                            {store.socialMedia && (
                                Object.values(store.socialMedia).some(val => val) && (
                                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                                        <Typography variant="h6" gutterBottom>Siga-nos</Typography>
                                        <Stack spacing={1}>
                                            {store.socialMedia.website && (
                                                <Button 
                                                    startIcon={<Language />}
                                                    href={store.socialMedia.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variant="outlined"
                                                    sx={{ justifyContent: 'flex-start' }}
                                                >
                                                    Website
                                                </Button>
                                            )}
                                            
                                            {store.socialMedia.facebook && (
                                                <Button 
                                                    startIcon={<Facebook />}
                                                    href={store.socialMedia.facebook}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variant="outlined"
                                                    sx={{ justifyContent: 'flex-start' }}
                                                >
                                                    Facebook
                                                </Button>
                                            )}
                                            
                                            {store.socialMedia.instagram && (
                                                <Button 
                                                    startIcon={<Instagram />}
                                                    href={store.socialMedia.instagram}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variant="outlined"
                                                    sx={{ justifyContent: 'flex-start' }}
                                                >
                                                    Instagram
                                                </Button>
                                            )}
                                            
                                            {store.socialMedia.twitter && (
                                                <Button 
                                                    startIcon={<Twitter />}
                                                    href={store.socialMedia.twitter}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variant="outlined"
                                                    sx={{ justifyContent: 'flex-start' }}
                                                >
                                                    Twitter
                                                </Button>
                                            )}
                                        </Stack>
                                    </Paper>
                                )
                            )}
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={4}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                        <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <CalendarMonth sx={{ mr: 1, color: 'primary.main' }} /> Horário de Funcionamento
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
                                    
                                    // Verificar se é o dia atual
                                    const today = new Date().getDay();
                                    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day);
                                    const isToday = dayIndex === today;
                                    
                                    return (
                                        <Grid item xs={12} sm={6} key={day}>
                                            <Card 
                                                variant="outlined" 
                                                sx={{ 
                                                    p: 2,
                                                    borderColor: isToday ? 'primary.main' : 'divider',
                                                    bgcolor: isToday ? 'primary.light' : 'transparent'
                                                }}
                                            >
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center'
                                                }}>
                                                    <Typography variant="body1" fontWeight={isToday ? 'bold' : 'normal'}>
                                                        {dayNames[day]}
                                                        {isToday && <Chip label="Hoje" size="small" color="primary" sx={{ ml: 1 }} />}
                                                    </Typography>
                                                    <Typography 
                                                        variant="body2" 
                                                        color={schedule.closed ? "error" : "text.primary"}
                                                        fontWeight={isToday ? 'bold' : 'normal'}
                                                    >
                                                        {schedule.closed 
                                                            ? 'Fechado' 
                                                            : `${formatTime(schedule.open)} - ${formatTime(schedule.close)}`
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Esta loja ainda não definiu o horário de funcionamento.
                            </Typography>
                        )}
                    </Paper>
                </TabPanel>

                <TabPanel value={activeTab} index={5}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                        <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <Phone sx={{ mr: 1, color: 'primary.main' }} /> Contacte-nos
                        </Typography>
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined" sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom>Informações de Contacto</Typography>
                                    
                                    <Stack spacing={2}>
                                        {store.contact?.phone && (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">Telefone</Typography>
                                                <Link 
                                                    href={`tel:${store.contact.phone}`}
                                                    sx={{ textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}
                                                >
                                                    {store.contact.phone}
                                                </Link>
                                            </Box>
                                        )}
                                        
                                        {store.contact?.whatsapp && (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">WhatsApp</Typography>
                                                <Link 
                                                    href={`https://wa.me/${store.contact.whatsapp.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}
                                                >
                                                    {store.contact.whatsapp}
                                                </Link>
                                            </Box>
                                        )}
                                        {store.contact?.email && (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">Email</Typography>
                                                <Link 
                                                    href={`mailto:${store.contact.email}`}
                                                    sx={{ textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold' }}
                                                >
                                                    {store.contact.email}
                                                </Link>
                                            </Box>
                                        )}
                                    </Stack>
                                </Card>
                            </Grid>
                            
                         
                        </Grid>
                    </Paper>
                </TabPanel>
            </Box>

            {/* Botão Flutuante de Partilha */}
            <Fab
                color="primary"
                aria-label="share"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    display: { xs: 'flex', md: 'none' }
                }}
                onClick={handleOpenShareMenu}
            >
                <Share />
            </Fab>

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
                        <WhatsApp fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>WhatsApp</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => shareOnPlatform('facebook')}>
                    <ListItemIcon>
                        <Facebook fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Facebook</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => shareOnPlatform('twitter')}>
                    <ListItemIcon>
                        <Twitter fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Twitter</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => shareOnPlatform('copy')}>
                    <ListItemIcon>
                        <Share fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copiar link</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default StoreDetailDesk;