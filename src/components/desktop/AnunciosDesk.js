import React, { useState, useCallback, useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { 
  Box, 
  Button, 
  Typography, 
  useMediaQuery, 
  useTheme,
  Avatar,
  CircularProgress,
  IconButton,
  Chip,
  Skeleton
} from '@mui/material';
import { Link } from 'react-router-dom';
import { 
  OpenInNew as OpenInNewIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Business as BusinessIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { ref, onValue, set, update, serverTimestamp } from 'firebase/database';
import { db } from '../../fb';
import placeholderImage from '../../img/anunciar.gif';

const AnunciosDesk = ({ campanhas, user }) => {
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [trackedImpressions, setTrackedImpressions] = useState(new Set());
  const [likedBanners, setLikedBanners] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Configurações avançadas do slider
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
    adaptiveHeight: true,
    customPaging: (i) => (
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: theme.palette.grey[400],
          transition: 'all 0.3s',
          '&.slick-active': {
            backgroundColor: theme.palette.primary.main,
            width: 20,
            borderRadius: '5px'
          }
        }}
      />
    ),
  };

  // Carrega dados da empresa
  const fetchCompanyData = useCallback(async (companyId) => {
    if (!companyId || companies[companyId]) return;

    const companyRef = ref(db, `company/${companyId}`);
    onValue(companyRef, (snapshot) => {
      const companyData = snapshot.val();
      if (companyData) {
        setCompanies(prev => ({ ...prev, [companyId]: companyData }));
      }
    });
  }, [companies]);

  // Registra impressão do banner
  const registerImpression = useCallback(async (bannerId) => {
    const userId = user?.id || 'anonymous';
    const impressionKey = `${bannerId}-${userId}`;

    if (trackedImpressions.has(impressionKey)) return;

    try {
      await update(ref(db, `anuncios_metrics/${bannerId}`), {
        total_impressoes: increment(1),
        ultima_impressao: serverTimestamp(),
      });

      if (userId !== 'anonymous') {
        await set(ref(db, `anuncios_metrics/${bannerId}/impressoes/${userId}`), {
          timestamp: serverTimestamp(),
          deviceType: isMobile ? 'mobile' : 'desktop',
        });
      }

      setTrackedImpressions(prev => new Set(prev).add(impressionKey));
    } catch (error) {
      console.error('Error registering impression:', error);
    }
  }, [user, isMobile, trackedImpressions]);

  // Registra clique no banner
  const registerClick = useCallback(async (bannerId) => {
    const userId = user?.id || 'anonymous';
    
    try {
      await update(ref(db, `anuncios_metrics/${bannerId}`), {
        total_cliques: increment(1),
        ultimo_clique: serverTimestamp(),
      });

      if (userId !== 'anonymous') {
        await set(ref(db, `anuncios_metrics/${bannerId}/cliques/${userId}`), {
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error registering click:', error);
    }
  }, [user]);

  // Gerencia likes nos banners
  const toggleLike = useCallback(async (bannerId) => {
    if (!user?.id) return;

    const isLiked = likedBanners[bannerId];
    const newLikedState = !isLiked;

    try {
      await set(ref(db, `users/${user.id}/banners_liked/${bannerId}`), 
        newLikedState ? { timestamp: serverTimestamp() } : null
      );

      await update(ref(db, `anuncios_metrics/${bannerId}`), {
        total_likes: increment(newLikedState ? 1 : -1),
      });

      setLikedBanners(prev => ({ ...prev, [bannerId]: newLikedState }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [user, likedBanners]);

  // Carrega likes do usuário
  useEffect(() => {
    if (!user?.id) return;

    const likedRef = ref(db, `users/${user.id}/banners_liked`);
    const unsubscribe = onValue(likedRef, (snapshot) => {
      const likesData = snapshot.val() || {};
      setLikedBanners(likesData);
    });

    return () => unsubscribe();
  }, [user]);

  // Carrega dados das empresas para os banners
  useEffect(() => {
    if (campanhas.length === 0) {
      setLoading(false);
      return;
    }

    const companyIds = [...new Set(campanhas.map(b => b.companyId))];
    const promises = companyIds.map(fetchCompanyData);
    
    Promise.all(promises).finally(() => setLoading(false));
  }, [campanhas, fetchCompanyData]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: isMobile ? '250px' : '400px',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        mb: 3
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (campanhas.length === 0) {
    return (
      <Box sx={{ 
        width: '100%',
        height: isMobile ? '250px' : '400px',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        p: 3,
        mb: 3,
        boxShadow: 1
      }}>
        <img
          src={placeholderImage}
          alt="Nenhum anúncio disponível"
          style={{ 
            width: '100%', 
            maxWidth: '300px',
            height: 'auto',
            marginBottom: theme.spacing(2)
          }}
        />
        <Button
          component={Link}
          to="/anunciar"
          variant="contained"
          color="primary"
          size="large"
          startIcon={<ShareIcon />}
        >
          Criar Anúncio
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: 'lg',
      mx: 'auto',
      mb: 4,
      position: 'relative',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: 3
    }}>
      <Slider {...settings}>
        {campanhas.map((banner) => {
          const company = companies[banner.companyId] || {};
          const isLiked = likedBanners[banner.id] || false;
          const daysLeft = Math.ceil(
            (new Date(banner.expireDate) - new Date()) / (1000 * 60 * 60 * 24)
          );

          return (
            <Box key={banner.id} sx={{ position: 'relative' }}>
              {/* Banner Image */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: isMobile ? '250px' : '400px',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => registerImpression(banner.id)}
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
                      src={banner.imageUrl || placeholderImage}
                      alt={banner.description || `Banner ${banner.id}`}
                      onError={(e) => (e.target.src = placeholderImage)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                        ':hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                  </a>
                ) : (
                  <img
                  src={banner.imageUrl || placeholderImage}
                  alt={banner.description || `Banner ${banner.id}`}
                  onError={(e) => (e.target.src = placeholderImage)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover', // Garante que a imagem cubra o espaço sem distorção
                    objectPosition: 'center', // Centraliza a imagem dentro do contêiner
                  }}
                />
                )}

                {/* Overlay Info */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                    p: 2,
                    color: 'white'
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                  }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {banner.description || 'Anúncio'}
                      </Typography>
                      {company.nome && (
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Por: {company.nome}
                        </Typography>
                      )}
                    </Box>
                    
            
                  </Box>
                </Box>
              </Box>

              {/* Company Info (Desktop) */}
              {!isMobile && company.nome && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 2,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    maxWidth: '40%',
                    boxShadow: 1
                  }}
                >
                  <Avatar
                    src={company.logoUrl || ''}
                    alt={company.nome}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: 'grey.100',
                    }}
                  >
                    {company.nome.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ fontWeight: 'bold' }}
                    >
                      {company.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {banner.provincias?.join(', ') || 'Todas províncias'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </Slider>
    </Box>
  );
};

// Helper function for Firebase increment
function increment(value = 1) {
  return {
    '.sv': {
      'increment': value
    }
  };
}

export default AnunciosDesk;