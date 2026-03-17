import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ref, onValue, serverTimestamp, runTransaction, off } from "firebase/database";
import { db } from '../../fb';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Avatar, Box, Typography, useMediaQuery, useTheme,
  CircularProgress, Dialog, DialogContent, DialogTitle,
  IconButton, Chip, Button, Link, Card, CardContent
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import BusinessIcon from '@mui/icons-material/Business';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LinkIcon from '@mui/icons-material/Link';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import anunciar from '../../img/anunciar.gif';

// Cache para evitar múltiplas requisições
const companyCache = new Map();
const CLICK_DEBOUNCE_TIME = 30000; // 30 segundos
const MAX_CLICKS_PER_SESSION = 5; // Limite de cliques por sessão

const BannerDesk = ({ user }) => {
  const [banners, setBanners] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [clickCounts, setClickCounts] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Refs para armazenar os unsubscribe functions
  const companyListenersRef = useRef(new Map());
  const bannersListenerRef = useRef(null);

  const getUserId = useCallback(() => user?.id || 'guest', [user]);

  const isBannerExpired = useCallback((banner) => {
    if (banner.status === 'expired') return true;
    if (banner.status === 'unpaid') return true;
    if (!banner.expireDate) return true;
    
    try {
      const expireDate = new Date(banner.expireDate);
      return expireDate < new Date();
    } catch {
      return true;
    }
  }, []);

  const bannerMatchesUser = useCallback((banner, currentUser) => {
    if (!currentUser) return true;
    
    const bannerProvincias = banner.provincias || [];
    const bannerSectores = banner.sectores || [];
    
    const hasProvinciaFilter = bannerProvincias.length > 0;
    const hasSectorFilter = bannerSectores.length > 0;

    if (!hasProvinciaFilter && !hasSectorFilter) return true;

    const userProvincia = currentUser.provinciaTemp || currentUser.provincia || '';
    const userSector = currentUser.sector || '';

    const provinciaMatch = !hasProvinciaFilter || 
        bannerProvincias.some(provincia => 
            provincia.toLowerCase() === userProvincia.toLowerCase()
        );

    const sectorMatch = !hasSectorFilter || 
        bannerSectores.some(sector => 
            sector.toLowerCase() === userSector.toLowerCase()
        );

    return provinciaMatch && sectorMatch;
  }, []);

  const filterBanners = useCallback((bannerList, currentUser) => {
    return bannerList.filter(banner => (
        banner.status === 'paid' &&
        banner.tipoAnuncio === 'home' &&
        !isBannerExpired(banner) &&
        bannerMatchesUser(banner, currentUser)
    ));
  }, [isBannerExpired, bannerMatchesUser]);

  // Função para validar e formatar links
  const formatLink = useCallback((link) => {
    if (!link || link === '#' || link.trim() === '') return null;
    
    let formattedLink = link.trim();
    
    // Adicionar https:// se não tiver protocolo
    if (!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
      formattedLink = 'https://' + formattedLink;
    }
    
    // Validar URL
    try {
      new URL(formattedLink);
      return formattedLink;
    } catch {
      return null;
    }
  }, []);

  // Função para extrair domínio do link para exibição
  const getDomainFromLink = useCallback((link) => {
    if (!link || link === '#') return null;
    try {
      const url = new URL(link.startsWith('http') ? link : `https://${link}`);
      return url.hostname.replace('www.', '');
    } catch {
      return link.length > 30 ? link.substring(0, 30) + '...' : link;
    }
  }, []);

  // Função para formatar data
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Data inválida';
    }
  }, []);

  // Função para obter dias restantes
  const getDaysRemaining = useCallback((expireDate) => {
    if (!expireDate) return 0;
    try {
      const expire = new Date(expireDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalizar para comparar apenas datas
      const diffTime = expire - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  }, []);

  const registerClick = useCallback(async (bannerId, linkType = 'banner') => {
    const userId = getUserId();
    const now = Date.now();
    const clickKey = `${bannerId}_${userId}_${linkType}`;

    // Debounce: evitar cliques repetidos em curto período
    const lastClick = clickCounts[clickKey] || { count: 0, timestamp: 0 };
    
    if (now - lastClick.timestamp < CLICK_DEBOUNCE_TIME) {
      return;
    }

    // Limitar cliques por sessão para prevenir abuso
    if (lastClick.count >= MAX_CLICKS_PER_SESSION) {
      return;
    }

    // Atualizar contador local imediatamente para feedback responsivo
    setClickCounts(prev => ({
      ...prev,
      [clickKey]: {
        count: (prev[clickKey]?.count || 0) + 1,
        timestamp: now
      }
    }));

    try {
      const metricPath = linkType === 'banner' 
        ? `anuncios_metrics/${bannerId}`
        : `anuncios_metrics/${bannerId}/link_clicks`;

      await runTransaction(ref(db, metricPath), (currentData) => {
        const data = currentData || {};
        const today = new Date().toISOString().split('T')[0];
        
        if (linkType === 'banner') {
          // Atualizar total de cliques no banner
          const newTotalClicks = (data.total_cliques || 0) + 1;
          const currentDailyClicks = data.cliques_por_dia || {};
          const newDailyClicks = {
            ...currentDailyClicks,
            [today]: (currentDailyClicks[today] || 0) + 1
          };

          const updatedData = {
            ...data,
            total_cliques: newTotalClicks,
            ultimo_clique: serverTimestamp(),
            from: 'Pagina Inicial',
            cliques_por_dia: newDailyClicks,
            device_type: isMobile ? 'mobile' : 'desktop',
            user_agent: navigator.userAgent.substring(0, 100),
          };

          if (user?.id) {
            updatedData.user_data = {
              ...data.user_data,
              last_user_id: user.id,
              last_click_time: serverTimestamp()
            };
          } else {
            updatedData.guest_clicks = (data.guest_clicks || 0) + 1;
          }

          return updatedData;
        } else {
          // Registrar clique no link específico
          const newLinkClicks = (data.total || 0) + 1;
          const currentDailyLinkClicks = data.daily || {};
          const newDailyLinkClicks = {
            ...currentDailyLinkClicks,
            [today]: (currentDailyLinkClicks[today] || 0) + 1
          };

          return {
            ...data,
            total: newLinkClicks,
            daily: newDailyLinkClicks,
            last_click: serverTimestamp(),
            device_type: isMobile ? 'mobile' : 'desktop'
          };
        }
      });

      // Registrar click do usuário (apenas se logado)
      if (user?.id) {
        await runTransaction(ref(db, `users/${userId}/anuncios_clicados/${bannerId}`), (currentData) => {
          const data = currentData || {};
          const clickData = {
            timestamp: serverTimestamp(),
            count: (data.count || 0) + 1,
            last_click: serverTimestamp(),
            referrer: document.referrer || 'direct',
            banner_data: {
              id: bannerId,
              clicked_at: serverTimestamp(),
              device_type: isMobile ? 'mobile' : 'desktop',
              link_type: linkType
            }
          };

          return linkType === 'banner' ? clickData : { ...data, ...clickData };
        });
      }

    } catch (error) {
      console.error('Error registering click:', error);
      // Reverter contador local em caso de erro
      setClickCounts(prev => ({
        ...prev,
        [clickKey]: {
          count: Math.max(0, (prev[clickKey]?.count || 1) - 1),
          timestamp: prev[clickKey]?.timestamp || now
        }
      }));
    }
  }, [getUserId, user, isMobile, clickCounts, db]);

  // Limpar listeners de empresas
  const cleanupCompanyListeners = useCallback(() => {
    companyListenersRef.current.forEach((unsubscribe, companyId) => {
      if (unsubscribe) {
        unsubscribe();
      }
    });
    companyListenersRef.current.clear();
  }, []);

  // Limpar listener de banners
  const cleanupBannersListener = useCallback(() => {
    if (bannersListenerRef.current) {
      bannersListenerRef.current();
      bannersListenerRef.current = null;
    }
  }, []);

  const fetchCompanyData = useCallback((companyId) => {
    if (!companyId || companies[companyId] || companyCache.has(companyId)) {
      return;
    }

    // Se já existe um listener para esta company, não criar outro
    if (companyListenersRef.current.has(companyId)) {
      return;
    }

    try {
      const companyRef = ref(db, `company/${companyId}`);
      
      const unsubscribe = onValue(companyRef, (snapshot) => {
        const companyData = snapshot.val();
        if (companyData) {
          companyCache.set(companyId, companyData);
          setCompanies((prev) => ({
            ...prev,
            [companyId]: companyData,
          }));
        }
      }, (error) => {
        console.error('Error fetching company data:', error);
        companyListenersRef.current.delete(companyId);
      });

      // Armazenar a função de unsubscribe
      companyListenersRef.current.set(companyId, unsubscribe);

    } catch (error) {
      console.error('Error setting up company listener:', error);
    }
  }, [companies, db]);

  const handleBannerClick = useCallback((banner) => {
    setSelectedBanner(banner);
    setOpenDialog(true);
    registerClick(banner.id, 'banner');
  }, [registerClick]);

  const handleExternalLinkClick = useCallback((banner, event) => {
    event?.stopPropagation();
    const formattedLink = formatLink(banner.link);
    if (formattedLink) {
      registerClick(banner.id, 'external_link');
      window.open(formattedLink, '_blank', 'noopener,noreferrer');
    }
  }, [formatLink, registerClick]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedBanner(null);
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const uniqueCompanyIds = [...new Set(banners.map(banner => banner.companyId).filter(Boolean))];
      uniqueCompanyIds.forEach(fetchCompanyData);
    }
  }, [banners, fetchCompanyData]);

  useEffect(() => {
    const bannersRef = ref(db, 'banners');

    const handleBannersData = (snapshot) => {
      const bannersData = snapshot.val();

      if (!bannersData) {
        setBanners([]);
        setLoading(false);
        return;
      }

      const bannerList = Object.entries(bannersData).map(([id, banner]) => ({
        id,
        ...banner,
      }));

      
      const filteredBanners = filterBanners(bannerList, user);

      setBanners(filteredBanners);
      setLoading(false);
    };

    try {
      // Limpar listener anterior se existir
      cleanupBannersListener();
      
      bannersListenerRef.current = onValue(bannersRef, handleBannersData, (error) => {
        setLoading(false);
        console.error('Error fetching banners:', error);
      });

    } catch (error) {
      setLoading(false);
      console.error('Error setting up banners listener:', error);
    }

    return () => {
      cleanupBannersListener();
      cleanupCompanyListeners();
    };
  }, [user, filterBanners, cleanupBannersListener, cleanupCompanyListeners, db]);

  // Calcular banners ativos primeiro
  const activeBanners = useMemo(() => {
    const filtered = banners.filter(banner => !isBannerExpired(banner));
    return filtered;
  }, [banners, isBannerExpired]);

  // Configuração do Slider - AGORA DEPOIS de activeBanners ser definido
  const settings = useMemo(() => ({
    dots: true,
    infinite: activeBanners.length > 1, // Só infinito se tiver mais de 1 banner
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: activeBanners.length > 1, // Só autoplay se tiver mais de 1 banner
    autoplaySpeed: 5000,
    arrows: !isMobile && activeBanners.length > 1, // Só mostra arrows se tiver mais de 1 banner
    pauseOnHover: true,
    adaptiveHeight: true,
    customPaging: () => (
      <Box sx={{
        width: isMobile ? '8px' : '12px',
        height: isMobile ? '8px' : '12px',
        borderRadius: '50%',
        backgroundColor: 'primary.main',
        margin: '0 4px',
      }} />
    ),
  }), [isMobile, activeBanners.length]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: isMobile ? '250px' : '600px',
        backgroundColor: 'background.paper'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: 'screen-xl',
      mx: 'auto',
      mb: 4,
      position: 'relative'
    }}>
      {activeBanners.length > 0 ? (
        <>
          <Slider {...settings}>
            {activeBanners.map((banner) => {
              const company = companies[banner.companyId] || {};
              const hasValidLink = formatLink(banner.link) !== null;
              const linkDomain = getDomainFromLink(banner.link);
              const daysRemaining = getDaysRemaining(banner.expireDate);

              return (
                <Box
                  key={banner.id}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: isMobile ? '250px' : '600px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleBannerClick(banner)}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundImage: `url(${banner.imageUrl})`,
                      '&:hover': {
                        transform: activeBanners.length > 1 ? 'scale(1.02)' : 'none',
                        transition: 'transform 0.3s ease'
                      }
                    }}
                  >
                    <img
                      src={anunciar}
                      alt="Fallback banner"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'none'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'block';
                        const parent = e.target.parentElement;
                        parent.style.backgroundImage = 'none';
                      }}
                    />
                  </Box>      
                  
                  {/* Overlay com informações */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      right: 16,
                      borderRadius: 2,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      maxWidth: isMobile ? 'calc(100% - 32px)' : '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(10px)',
                      color: 'white'
                    }}>
                    <Link 
                      href={`/perfil/${company.id}`} 
                      style={{ textDecoration: 'none' }} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDialog(false);
                      }}
                    >
                      <Avatar
                        src={company.logoUrl || ''}
                        alt={company.nome}
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: 'grey.100',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          }
                        }}
                      />
                    </Link>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {company.nome || 'Empresa'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {hasValidLink && (
                          <Chip
                            icon={<LinkIcon />}
                            label="Tem Link"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              color: 'white', 
                              borderColor: 'primary.light',
                              height: '24px'
                            }}
                          />
                        )}
                        {daysRemaining > 0 && (
                          <Chip
                            icon={<CalendarTodayIcon />}
                            label={`${daysRemaining}d`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ 
                              color: 'white', 
                              borderColor: 'secondary.light',
                              height: '24px'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Slider>
        </>
      ) : (
        <Box
          sx={{
            width: '100%',
            height: isMobile ? '250px' : '600px',
            backgroundColor: 'background.paper',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {user?.id ? (
            <a href="/anunciar" style={{ width: '100%', height: '100%' }}>
              <img
                src={anunciar}
                alt="Anunciar"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </a>
          ) : (
            <img
              src={anunciar}
              alt="Anunciar (login necessário)"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
              title="Inicie sessão para anunciar"
            />
          )}
        </Box>
      )}

      {selectedBanner && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: 'primary.main', 
            color: 'common.white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AnnouncementIcon />
              <Typography variant="h6">
                Detalhes do Anúncio
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'common.white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent dividers sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
              {/* Imagem do Banner */}
              <Box sx={{ 
                width: isMobile ? '100%' : '50%',
                height: isMobile ? '300px' : '500px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                overflow: 'hidden'
              }}>
                <img
                  src={selectedBanner.imageUrl}
                  alt={`Banner ${selectedBanner.id}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.target.src = anunciar;
                    e.target.style.objectFit = 'contain';
                  }}
                />
              </Box>
              
              {/* Informações Detalhadas */}
              <Box sx={{ 
                width: isMobile ? '100%' : '50%',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                {/* Informações do Anúncio */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AnnouncementIcon color="primary" />
                      Sobre este Anúncio
                    </Typography>
                    
                    <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                      {selectedBanner.description || 'Este anúncio não possui descrição detalhada.'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" />
                        <strong>Publicado em:</strong> {formatDate(selectedBanner.uploadedAt)}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" />
                        <strong>Expira em:</strong> {formatDate(selectedBanner.expireDate)}
                      </Typography>
                      {getDaysRemaining(selectedBanner.expireDate) > 0 && (
                        <Typography variant="body2" color="primary.main">
                          <strong>{getDaysRemaining(selectedBanner.expireDate)} dias restantes</strong>
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* Informações da Empresa */}
                {companies[selectedBanner.companyId] && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon color="primary" />
                        Informações da Empresa
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Link 
                          href={`/perfil/${companies[selectedBanner.companyId].id}`}
                          sx={{ textDecoration: 'none' }}
                        >
                          <Typography variant="h6" color="primary.main">
                            {companies[selectedBanner.companyId].nome}
                          </Typography>
                        </Link>
                        
                        {companies[selectedBanner.companyId].sector && (
                          <Chip 
                            label={companies[selectedBanner.companyId].sector}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {companies[selectedBanner.companyId].morada && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOnIcon color="primary" fontSize="small" />
                            {companies[selectedBanner.companyId].morada}
                          </Typography>
                        )}
                        
                        {companies[selectedBanner.companyId].contacto && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              '&:hover': {
                                textDecoration: 'underline',
                                cursor: 'pointer'
                              } 
                            }}
                            onClick={() => window.location.href = `tel:${companies[selectedBanner.companyId].contacto}`}
                          >
                            <PhoneIcon color="primary" fontSize="small" />
                            {companies[selectedBanner.companyId].contacto}
                          </Typography>
                        )}
                        
                        {companies[selectedBanner.companyId].email && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              '&:hover': {
                                textDecoration: 'underline',
                                cursor: 'pointer'
                              }
                            }}
                            onClick={() => window.location.href = `mailto:${companies[selectedBanner.companyId].email}`}
                          >
                            <EmailIcon color="primary" fontSize="small" />
                            {companies[selectedBanner.companyId].email}
                          </Typography>
                        )}
                        
                        {companies[selectedBanner.companyId].website && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LanguageIcon color="primary" fontSize="small" />
                            <Link 
                              href={formatLink(companies[selectedBanner.companyId].website) || '#'}
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                              sx={{ color: 'primary.main' }}
                            >
                              {getDomainFromLink(companies[selectedBanner.companyId].website)}
                            </Link>
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Botão de Ação Principal */}
                {formatLink(selectedBanner.link) && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={(e) => handleExternalLinkClick(selectedBanner, e)}
                    sx={{ mt: 2 }}
                    endIcon={<OpenInNewIcon />}
                  >
                    Acessar Website do Anúncio
                  </Button>
                )}
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default BannerDesk;