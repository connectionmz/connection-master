import React, { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, update, serverTimestamp } from "firebase/database";
import { db } from '../../fb';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Avatar, Box, Typography, useMediaQuery, useTheme,
  CircularProgress, Dialog, DialogContent, DialogTitle,
  IconButton, Divider, Chip, Button, Link
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import BusinessIcon from '@mui/icons-material/Business';
import anunciar from '../../img/anunciar.gif';

const BannerDesk = ({ user }) => {
  const [banners, setBanners] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [trackedImpressions, setTrackedImpressions] = useState(new Set());
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getUserId = useCallback(() => user?.id || 'desconhecido', [user]);

  const fetchCompanyData = useCallback((companyId) => {
    return new Promise((resolve) => {
      if (!companyId || companies[companyId]) {
        resolve();
        return;
      }

      const companyRef = ref(db, `company/${companyId}`);
      const unsubscribe = onValue(companyRef, (snapshot) => {
        const companyData = snapshot.val();
        if (companyData) {
          setCompanies((prev) => ({
            ...prev,
            [companyId]: companyData,
          }));
        }
      });

      resolve(unsubscribe);
    });
  }, [companies]);

  const isBannerExpired = useCallback((banner) => {
    if (banner.status === 'expired') return true;
    const expireDate = new Date(banner.expireDate);
    return expireDate < new Date();
  }, []);

  const bannerMatchesUser = useCallback((banner, user) => {
    if (!user) return false;
    const hasProvinciaFilter = banner.provincias && banner.provincias.length > 0;
    const hasSectorFilter = banner.sectores && banner.sectores.length > 0;

    if (!hasProvinciaFilter && !hasSectorFilter) return true;

    const provinciaMatch = !hasProvinciaFilter || 
        banner.provincias.some(provincia => 
            provincia.toLowerCase() === user.provinciaTemp?.toLowerCase() || 
            provincia.toLowerCase() === user.provincia?.toLowerCase()
        );

    const sectorMatch = !hasSectorFilter || 
        banner.sectores.some(sector => 
            sector.toLowerCase() === user.sector?.toLowerCase()
        );

    return provinciaMatch && sectorMatch;
  }, []);

  const filterBanners = useCallback((bannerList, user) => {
    return bannerList.filter(banner => (
        banner.status === 'active' &&
        banner.tipoAnuncio ==='home' &&
        !isBannerExpired(banner) &&
        bannerMatchesUser(banner, user)
    ));
  }, [isBannerExpired, bannerMatchesUser]);

  const registerImpression = useCallback(async (bannerId) => {
    const userId = getUserId();
    const impressionKey = `${bannerId}_${userId}`;

    if (trackedImpressions.has(impressionKey)) return;

    try {
      const impressionData = {
        userId,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        deviceType: isMobile ? 'mobile' : 'desktop',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      };

      await set(ref(db, `anuncios_metrics/${bannerId}/impressoes/${userId}`), impressionData);

      if (userId !== 'desconhecido') {
        await set(ref(db, `users/${userId}/anuncios_visualizados/${bannerId}`), {
          ...impressionData,
          bannerId,
        });
      }

      await update(ref(db, `anuncios_metrics/${bannerId}`), {
        total_impressoes: increment(1),
        ultima_impressao: serverTimestamp(),
      });
      setTrackedImpressions(prev => new Set(prev).add(impressionKey));
    } catch (error) {
      console.error('Error registering impression:', error);
    }
  }, [getUserId, isMobile, trackedImpressions]);

  const registerClick = useCallback(async (bannerId) => {
    const userId = getUserId();
    
    try {
      const clickData = {
        userId,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        deviceType: isMobile ? 'mobile' : 'desktop',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        referrer: document.referrer || 'direct',
      };

      await set(ref(db, `anuncios_metrics/${bannerId}/cliques/${userId}`), clickData);
      
      if (userId !== 'desconhecido') {
        await set(ref(db, `users/${userId}/anuncios_clicados/${bannerId}`), {
          ...clickData,
          bannerId,
        });
      }
      
      await update(ref(db, `anuncios_metrics/${bannerId}`), {
        total_cliques: increment(1),
        ultimo_clique: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error registering click:', error);
    }
  }, [getUserId, isMobile]);

  const handleBannerClick = (banner) => {
    setSelectedBanner(banner);
    setOpenDialog(true);
    registerClick(banner.id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  useEffect(() => {
    if (banners.length > 0) {
      const companyIds = banners.map(banner => banner.companyId).filter(Boolean);
      companyIds.forEach(fetchCompanyData);
    }
  }, [banners, fetchCompanyData]);

  useEffect(() => {
    const bannersRef = ref(db, 'banners');
    let unsubscribeBanners;

    const handleBannersData = async (snapshot) => {
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

      filteredBanners.forEach(banner => {
        if (!trackedImpressions.has(banner.id)) {
          registerImpression(banner.id);
          setTrackedImpressions(prev => new Set(prev).add(banner.id));
        }
      });
    };

    try {
      unsubscribeBanners = onValue(bannersRef, handleBannersData);
    } catch (error) {
      console.error('Error loading banners:', error);
      setLoading(false);
    }

    return () => {
      if (unsubscribeBanners) unsubscribeBanners();
    };
  }, [user, filterBanners, trackedImpressions, registerImpression]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: !isMobile,
    pauseOnHover: true,
    customPaging: () => (
      <Box sx={{
        width: isMobile ? '8px' : '12px',
        height: isMobile ? '8px' : '12px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        margin: '0 4px',
        transition: 'all 0.3s ease',
        '&.slick-active': {
          backgroundColor: theme.palette.primary.main,
        },
      }} />
    ),
  };

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

  const activeBanners = banners.filter(banner => !isBannerExpired(banner));

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: 'screen-xl',
      mx: 'auto',
      mb: 4,
      position: 'relative'
    }}>
      {activeBanners.length > 0 ? (
        <Slider {...settings}>
          {activeBanners.map((banner) => {
            const company = companies[banner.companyId] || {};
            return (
              <Box
                key={banner.id}
                sx={{
                  position: 'relative',
                  width: '100%',
                  overflow: 'hidden',
                  height: isMobile ? '250px' : '600px',
                  cursor: 'pointer'
                }}
                onClick={() => handleBannerClick(banner)}
              >
                <img
                  src={banner.imageUrl}
                  alt={`Banner ${banner.id}`}
                  onError={(e) => (e.target.src = anunciar)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                
                {/* Mini Card de Informação */}
          {/* Mini Card de Informação apenas com o logo */}
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
  }}
>
  <Avatar
    src={company.logoUrl || ''}
    alt={company.nome}
    sx={{
      width: 56,
      height: 56,
      bgcolor: 'grey.100',
    }}
  >
    {company.nome?.charAt(0)?.toUpperCase()}
  </Avatar>
</Box>

              </Box>
            );
          })}
        </Slider>
      ) : (
<Box
  sx={{
    width: '100%',
    overflow: 'hidden',
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

      {/* Dialog com Informações Detalhadas */}
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
              <BusinessIcon />
              <Typography variant="h6">
                {companies[selectedBanner.companyId]?.nome || 'Detalhes do Anúncio'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'common.white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent dividers sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
              <Box sx={{ 
                width: isMobile ? '100%' : '60%',
                height: isMobile ? '250px' : '400px'
              }}>
                <img
                  src={selectedBanner.imageUrl}
                  alt={`Banner ${selectedBanner.id}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>
              
              <Box sx={{ 
                width: isMobile ? '100%' : '40%',
                p: 3
              }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {selectedBanner.title || 'Anúncio'}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  {selectedBanner.description || 'Este anúncio não possui descrição detalhada.'}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {companies[selectedBanner.companyId] && (
                  <>
                    <Typography variant="subtitle1" gutterBottom sx={{ 
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <BusinessIcon color="primary" /> Informações da Empresa
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
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
                          <Link href={companies[selectedBanner.companyId].website} target="_blank">
                            {companies[selectedBanner.companyId].website}
                          </Link>
                        </Typography>
                      )}
                    </Box>
                  </>
                )}
                
                {selectedBanner.link && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      href={selectedBanner.link}
                      target="_blank"
                      onClick={() => registerClick(selectedBanner.id)}
                      sx={{ mt: 2 }}
                    >
                      Visitar Site do Anúncio
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

function increment(value) {
  return {
    '.sv': {
      'increment': value
    }
  };
}

export default BannerDesk;