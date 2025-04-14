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
    if (!user) return true;
    return (
      banner.provincias?.includes(user.provincia) &&
      banner.sectores?.includes(user.sector)
    );
  }, []);

  const registerImpression = useCallback(async (bannerId) => {
    const userId = getUserId();
    const impressionKey = `${bannerId}-${userId}`;

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
    const bannersRef = ref(db, 'banners');
    let unsubscribeBanners;

    try {
      unsubscribeBanners = onValue(bannersRef, async (snapshot) => {
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

        // Process banners
        const processedBanners = await Promise.all(
          bannerList.map(async (banner) => {
            if (isBannerExpired(banner) && banner.status !== 'expired') {
              try {
                await update(ref(db, `banners/${banner.id}`), {
                  status: 'expired',
                  expiredAt: serverTimestamp(),
                });
              } catch (error) {
                console.error('Error updating banner status:', error);
              }
              return { ...banner, status: 'expired' };
            }
            return banner;
          })
        );

        // Filter active banners
        const filteredBanners = processedBanners.filter((banner) => (
          banner.status === 'active' &&
          banner.tipoAnuncio === 'home' &&
          !isBannerExpired(banner) &&
          bannerMatchesUser(banner, user)
        ));

        // Fetch company data
        await Promise.all(
          filteredBanners.map((banner) => fetchCompanyData(banner.companyId))
        );

        setBanners(filteredBanners);

        // Register impressions
        filteredBanners.forEach((banner) => registerImpression(banner.id));
        
        setLoading(false);
      });
    } catch (error) {
      console.error('Error loading banners:', error);
      setLoading(false);
    }

    return () => {
      if (unsubscribeBanners) {
        unsubscribeBanners();
      }
    };
  }, [user, fetchCompanyData, isBannerExpired, bannerMatchesUser, registerImpression]);


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