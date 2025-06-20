import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';
import { 
  OpenInNew as OpenInNewIcon,
  Business as BusinessIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { ref, onValue, update, serverTimestamp } from 'firebase/database';
import { db } from '../../fb';
import placeholderImage from '../../img/anunciar.gif';

const AnunciosDesk = ({ campanhas, user, local }) => {
  const [companies, setCompanies] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
  }), [isMobile, theme]);

  // Fetch company data
  const fetchCompanyData = useCallback(async (companyId) => {
    if (!companyId || companies[companyId]) return;

    const companyRef = ref(db, `company/${companyId}`);
    const unsubscribe = onValue(companyRef, (snapshot) => {
      const companyData = snapshot.val();
      if (companyData) {
        setCompanies(prev => ({ ...prev, [companyId]: companyData }));
      }
    });
    return unsubscribe;
  }, [companies]);


  const ensureUrlHasProtocol = (url) => {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

  // Register banner click
  const registerClick = useCallback(async (bannerId) => {
    if (!user?.id) return;

    try {
      const updates = {};
      const timestamp = serverTimestamp();

      const clickData = {
        timestamp,
        referrer: document.referrer || 'direct',
      };
      
      updates[`anuncios_metrics/${bannerId}/total_cliques`] = increment(1);
      updates[`anuncios_metrics/${bannerId}/ultimo_clique`] = timestamp;
      updates[`anuncios_metrics/${bannerId}/from`] = local;
      updates[`anuncios_metrics/${bannerId}/company`] = {
        id: user.id,
        nome: user.nome,
        provincia: user.provincia,
        distrito: user.distrito,
        contacto: user.contacto,
        sector:user.sector,
        email: user.email
      };

      updates[`users/${user.id}/anuncios_clicados/${bannerId}`] = clickData;

      await update(ref(db), updates);
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
    }
  }, [user, campanhas.tipoAnuncio]);

  // Handle banner click
  const handleBannerClick = useCallback((banner) => {
    setSelectedBanner(banner);
    setOpenDialog(true);
    registerClick(banner.id);
  }, [registerClick]);

  // Close dialog
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  // Load company data for banners
  useEffect(() => {
    if (campanhas.length === 0) {
      setLoading(false);
      return;
    }

    const companyIds = [...new Set(campanhas.map(b => b.companyId))];
    const promises = companyIds.map(id => fetchCompanyData(id));
    
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
            marginBottom: theme.spacing(2),
            objectFit: 'contain'
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
          return (
            <Box key={banner.id} sx={{ position: 'relative' }}>
              {/* Banner Image */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: isMobile ? '250px' : '400px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#f5f5f5'
                }}
                onClick={() => handleBannerClick(banner)}
              >
                <img
                  src={banner.imageUrl || placeholderImage}
                  alt={banner.description || `Banner ${banner.id}`}
                  onError={(e) => (e.target.src = placeholderImage)}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              </Box>

              {/* Company Info (Desktop) */}
              {!isMobile && company.nome && (
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
                    maxWidth: '50%',
                  }}
                >
                  <MuiLink 
                    component={Link} 
                    to={`/perfil/${company.id}`} 
                    sx={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}
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
                    <Box>
                    </Box>
                  </MuiLink>
                </Box>
              )}
            </Box>
          );
        })}
      </Slider>

      {/* Banner Details Dialog */}
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
            <MuiLink 
              component={Link} 
              to={`/perfil/${companies[selectedBanner.companyId]?.id}`}
              sx={{ color: 'white', textDecoration: 'none' }}
            >
              <Typography variant="h6">
                {companies[selectedBanner.companyId]?.nome || 'Detalhes do Anúncio'}
              </Typography>
            </MuiLink>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'common.white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent dividers sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
              {/* Banner Image */}
              <Box sx={{ 
                width: isMobile ? '100%' : '60%',
                height: isMobile ? '250px' : '400px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f5f5f5'
              }}>
                <img
                  src={selectedBanner.imageUrl || placeholderImage}
                  alt={`Banner ${selectedBanner.id}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </Box>
              
              {/* Banner Details */}
              <Box sx={{ 
                width: isMobile ? '100%' : '40%',
                p: 3
              }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {selectedBanner.description || 'Anúncio'}
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
                          <LocationIcon color="primary" fontSize="small" />
                          {companies[selectedBanner.companyId].morada}
                        </Typography>
                      )}
                      
                      {companies[selectedBanner.companyId].contacto && (
                        <Typography 
                          variant="body2" 
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                          onClick={() => window.open(`tel:${companies[selectedBanner.companyId].contacto}`)}
                        >
                          <PhoneIcon color="primary" fontSize="small" />
                          {companies[selectedBanner.companyId].contacto}
                        </Typography>
                      )}
                      
                      {companies[selectedBanner.companyId].email && (
                        <Typography 
                          variant="body2" 
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                          onClick={() => window.open(`mailto:${companies[selectedBanner.companyId].email}`)}
                        >
                          <EmailIcon color="primary" fontSize="small" />
                          {companies[selectedBanner.companyId].email}
                        </Typography>
                      )}
                      
                      {companies[selectedBanner.companyId].website && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LanguageIcon color="primary" fontSize="small" />
                          <MuiLink 
                            href={companies[selectedBanner.companyId].website} 
                            target="_blank"
                            sx={{ color: 'inherit' }}
                          >
                            {companies[selectedBanner.companyId].website}
                          </MuiLink>
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
                      href={ensureUrlHasProtocol(selectedBanner.link)} rel="noopener noreferrer"
                      target="_blank"
                      endIcon={<OpenInNewIcon />}
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

// Helper function for Firebase increment
function increment(value = 1) {
  return {
    '.sv': {
      'increment': value
    }
  };
}

export default AnunciosDesk;