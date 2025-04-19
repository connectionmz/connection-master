import React, { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, update, serverTimestamp } from "firebase/database";
import { db } from '../../fb';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import CircularProgress from '@mui/material/CircularProgress';
import { Avatar, Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import anunciar from '../../img/anunciar.gif';

const BannerDesk = ({ user }) => {
  const [banners, setBanners] = useState([]);
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [trackedImpressions, setTrackedImpressions] = useState(new Set());
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
    if (!user) return false; // Se não há usuário, não mostra o banner

    // Verifica se o banner tem filtros de província
    const hasProvinciaFilter = banner.provincias && banner.provincias.length > 0;
    // Verifica se o banner tem filtros de setor
    const hasSectorFilter = banner.sectores && banner.sectores.length > 0;

    // Se não há filtros, o banner é para todos
    if (!hasProvinciaFilter && !hasSectorFilter) return true;

    // Verifica a província do usuário (se houver filtro)
    const provinciaMatch = !hasProvinciaFilter || 
        banner.provincias.some(provincia => 
            provincia.toLowerCase() === user.provinciaTemp?.toLowerCase() || 
            provincia.toLowerCase() === user.provincia?.toLowerCase()
        );

    // Verifica o setor do usuário (se houver filtro)
    const sectorMatch = !hasSectorFilter || 
        banner.sectores.some(sector => 
            sector.toLowerCase() === user.sector?.toLowerCase()
        );

    return provinciaMatch && sectorMatch;
}, []);

  // Função para filtrar banners ativos e relevantes
  const filterBanners = useCallback((bannerList, user) => {
    return bannerList.filter(banner => (
        banner.status === 'active' &&
        banner.tipoAnuncio === 'home' &&
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

      // Use transaction to ensure atomic updates
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

      // Converter para array e processar banners
      const bannerList = Object.entries(bannersData).map(([id, banner]) => ({
        id,
        ...banner,
      }));

      // Filtrar banners ativos e relevantes
      const filteredBanners = filterBanners(bannerList, user);

      // Atualizar estado
      setBanners(filteredBanners);
      setLoading(false);

      // Registrar impressões
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
  }, [user, filterBanners, trackedImpressions]);



  // Configurações do slider...
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
      mb: 4
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
                }}
              >
                {banner.link ? (
                  <a
                    href={banner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    onClick={() => registerClick(banner.id)}
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
                  </a>
                ) : (
                  <img
                    src={banner.imageUrl}
                    alt={`Banner ${banner.id}`}
                    onError={(e) => (e.target.src = anunciar)}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      backgroundColor: 'background.paper'
                    }}
                  />
                )}
                {/* Company Card */}
                {company.nome && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(4px)',
                      boxShadow: 2,
                      borderRadius: 2,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      maxWidth: isMobile ? '80%' : '50%',
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
                      {company.nome.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: 'text.primary',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {company.nome}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                        {banner.description || ''}
                      </Typography>
                    </Box>
                  </Box>
                )}
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
            alignItems: 'center'
          }}
        >
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
        </Box>
      )}
    </Box>
  );
};

// Helper function for Firebase increment
function increment(value) {
  return {
    '.sv': {
      'increment': value
    }
  };
}

export default BannerDesk;