import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ref, onValue, update, serverTimestamp } from "firebase/database";
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
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getUserId = useCallback(() => user?.id || 'desconhecido', [user]);

  const isBannerExpired = useCallback((banner) => {
    if (banner.status === 'expired') return true;
    const expireDate = new Date(banner.expireDate);
    return expireDate < new Date();
  }, []);

  const bannerMatchesUser = useCallback((banner, currentUser) => {
    if (!currentUser) return false;
    
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

  const registerClick = useCallback(async (bannerId) => {
    const userId = getUserId();
    const clickKey = `click_${bannerId}_${userId}`;

    try {
        const updates = {};
        const timestamp = serverTimestamp();

        const clickData = {
            timestamp,
            referrer: document.referrer || 'direct',
        };
        updates[`anuncios_metrics/${bannerId}/total_cliques`] = increment(1);
        updates[`anuncios_metrics/${bannerId}/ultimo_clique`] = timestamp;
        updates[`anuncios_metrics/${bannerId}/from`] = 'Pagina Inicial';
        updates[`anuncios_metrics/${bannerId}/company`] = {
          id: user?.id,
          nome: user?.nome,
          provincia: user?.provincia,
          distrito: user?.distrito,
          contacto: user?.contacto,
          sector:user?.sector,
          email: user?.email
        }

            updates[`users/${userId}/anuncios_clicados/${bannerId}`] = clickData;

        await update(ref(db), updates);
    } catch (error) {
        console.error('Erro ao registrar clique:', error);
    }
  }, [getUserId, user]);

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

  const handleBannerClick = useCallback((banner) => {
    setSelectedBanner(banner);
    setOpenDialog(true);
    registerClick(banner.id);
  }, [registerClick]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

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
  }, [user, filterBanners]);

  const settings = useMemo(() => ({
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
        margin: '0 4px',
      }} />
    ),
  }), [isMobile]);

  const activeBanners = useMemo(() => 
    banners.filter(banner => !isBannerExpired(banner)), 
    [banners, isBannerExpired]
  );

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
        <Slider {...settings}>
          {activeBanners.map((banner) => {
            const company = companies[banner.companyId] || {};
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
                  overflow: 'hidden'
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
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.1)'
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
                  }}>
                  <Link 
                    href={`/perfil/${company.id}`} 
                    style={{ textDecoration: 'none' }} 
                    onClick={() => setOpenDialog(false)}
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
                          cursor: 'pointer',
                        }
                      }}
                    >
                    </Avatar>
                  </Link>
                </Box>
              </Box>
            );
          })}
        </Slider>
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
              <Link href={`/perfil/${companies[selectedBanner.companyId]?.id}`} style={{ color: 'white', textDecoration: 'none' }}>
                <Typography variant="h6">
                  {companies[selectedBanner.companyId]?.nome || 'Detalhes do Anúncio'}
                </Typography>
              </Link>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'common.white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent dividers sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
              <Box sx={{ 
                width: isMobile ? '100%' : '60%',
                height: isMobile ? 'auto' : '400px',
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
                    height: 'auto',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.target.src = anunciar;
                    e.target.style.objectFit = 'contain';
                  }}
                />
              </Box>
              <Box sx={{ 
                width: isMobile ? '100%' : '40%',
                p: 3
              }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {selectedBanner.title}
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