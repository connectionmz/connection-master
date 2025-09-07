// src/pages/VerEvento.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Box, 
  Typography, 
  Button, 
  Chip,
  CircularProgress,
  Grid,
  Divider,
  IconButton,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  CalendarToday,
  LocationOn,
  AccessTime,
  ArrowBack,
  OpenInNew,
  Phone,
  Email,
  Language,
  Share,
  Facebook,
  Twitter,
  WhatsApp,
  CopyAll
} from '@mui/icons-material';
import { ref, onValue } from 'firebase/database';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../fb';

const VerEvento = () => {
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchEvento = () => {
      try {
        setLoading(true);
        const eventoRef = ref(db, `eventos/${id}`);
        
        onValue(eventoRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setEvento({
              id,
              ...data
            });
          } else {
            setError("Evento não encontrado");
          }
          setLoading(false);
        }, (error) => {
          setError("Erro ao carregar evento");
          setLoading(false);
          console.error("Error fetching event:", error);
        });
      } catch (err) {
        setError("Erro ao conectar ao banco de dados");
        setLoading(false);
        console.error("Error:", err);
      }
    };

    if (id) {
      fetchEvento();
    }
  }, [id]);

  const formatarData = (dataString) => {
    if (!dataString) return '';
    
    try {
      if (dataString.includes('-')) {
        const partes = dataString.split('-');
        if (partes.length === 3) {
          return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
      }
      
      return dataString;
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return dataString;
    }
  };

  const formatarValorIngresso = () => {
    if (!evento?.valorIngresso) return 'Gratuito';
    
    const valor = parseFloat(evento.valorIngresso);
    if (isNaN(valor)) return evento.valorIngresso;
    
    return `${valor.toLocaleString('pt-MZ', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })} ${evento.moeda || 'MZN'}`;
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setCopied(false);
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareOnSocialMedia = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(evento?.titulo || '');
    
    let shareUrl = '';
    
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${title} ${url}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank');
  };

  const getEventStatus = () => {
    if (!evento || !evento.dataFim) return 'active';
    
    try {
      const hoje = new Date();
      const dataFim = new Date(evento.dataFim);
      return dataFim >= hoje ? 'active' : 'expired';
    } catch (error) {
      return 'active';
    }
  };

  const isEventActive = getEventStatus() === 'active';

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error || !evento) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            {error || "Evento não encontrado"}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            O evento que procura não existe ou foi removido.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate(-1)}
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            Voltar
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button 
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Voltar
        </Button>
        
        <Button
          startIcon={<Share />}
          onClick={handleShare}
          variant="outlined"
        >
          Partilhar
        </Button>
      </Box>

      <Paper sx={{ 
        p: { xs: 2, md: 4 }, 
        mb: 4,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Status Badge */}
        {!isEventActive && (
          <Chip
            label="Evento Expirado"
            color="error"
            sx={{ 
              position: 'absolute', 
              top: 16, 
              right: 16, 
              zIndex: 1 
            }}
          />
        )}

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative' }}>
              <img
                src={evento.imagemDestaqueURL || '/default-event.jpg'}
                alt={evento.titulo}
                style={{
                  width: '100%',
                  height: isMobile ? '300px' : '400px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onError={(e) => {
                  e.target.src = '/default-event.jpg';
                }}
              />
            </Box>

            {/* Informações de Contato */}
            {(evento.telefoneOrganizador || evento.emailOrganizador || evento.website) && (
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Contactos
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {evento.telefoneOrganizador && (
                    <Box display="flex" alignItems="center">
                      <Phone sx={{ mr: 1, color: 'primary.main' }} />
                      <Button 
                        href={`tel:${evento.telefoneOrganizador}`}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {evento.telefoneOrganizador}
                      </Button>
                    </Box>
                  )}
                  
                  {evento.emailOrganizador && (
                    <Box display="flex" alignItems="center">
                      <Email sx={{ mr: 1, color: 'primary.main' }} />
                      <Button 
                        href={`mailto:${evento.emailOrganizador}`}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {evento.emailOrganizador}
                      </Button>
                    </Box>
                  )}
                  
                  {evento.website && (
                    <Box display="flex" alignItems="center">
                      <Language sx={{ mr: 1, color: 'primary.main' }} />
                      <Button 
                        href={evento.website}
                        target="_blank"
                        endIcon={<OpenInNew />}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        Website
                      </Button>
                    </Box>
                  )}
                </Box>
              </Paper>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ 
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700
            }}>
              {evento.titulo}
            </Typography>
            
            {evento.criadoPor && evento.criadoPor.nome && (
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Publicado por: {evento.criadoPor.nome}
              </Typography>
            )}
            
            {/* Informações Principais */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" alignItems="center">
                  <CalendarToday sx={{ mr: 2, color: 'primary.main', fontSize: 24 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Data
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatarData(evento.dataInicio)}
                      {evento.dataFim && ` a ${formatarData(evento.dataFim)}`}
                    </Typography>
                  </Box>
                </Box>
                
                {evento.horaInicio && (
                  <Box display="flex" alignItems="center">
                    <AccessTime sx={{ mr: 2, color: 'primary.main', fontSize: 24 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Horário
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {evento.horaInicio}
                        {evento.horaFim && ` às ${evento.horaFim}`}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {evento.local && (
                  <Box display="flex" alignItems="flex-start">
                    <LocationOn sx={{ mr: 2, color: 'primary.main', fontSize: 24, mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Localização
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {evento.local}
                      </Typography>
                      {evento.endereco && (
                        <Typography variant="body2" color="text.secondary">
                          {evento.endereco}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                
                {evento.valorIngresso && (
                  <Box display="flex" alignItems="center">
                    <Box sx={{ mr: 2, width: 24, height: 24, textAlign: 'center' }}>
                      <Typography fontWeight="bold">MT</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Valor do Ingresso
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatarValorIngresso()}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
            
            {evento.descricao && (
              <Box mb={3}>
                <Typography variant="h5" gutterBottom>
                  Sobre o Evento
                </Typography>
                <Typography variant="body1" sx={{ 
                  whiteSpace: 'pre-line',
                  lineHeight: 1.6,
                  fontSize: '1.1rem'
                }}>
                  {evento.descricao}
                </Typography>
              </Box>
            )}
            
            <Box display="flex" gap={2} flexWrap="wrap" sx={{ mt: 3 }}>
              {evento.linkExterno && (
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<OpenInNew />}
                  href={evento.linkExterno}
                  target="_blank"
                  sx={{ minWidth: '200px' }}
                >
                  Site Oficial
                </Button>
              )}
              
              {evento.telefoneOrganizador && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Phone />}
                  href={`tel:${evento.telefoneOrganizador}`}
                  sx={{ minWidth: '200px' }}
                >
                  Ligar Agora
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4 }} />
        
        {/* Informações Adicionais */}
        <Typography variant="h5" gutterBottom>
          Informações Adicionais
        </Typography>
        
        <Grid container spacing={3}>
          {evento.organizador && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Organizador
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {evento.organizador}
              </Typography>
            </Grid>
          )}
          
          {evento.provincia && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Província
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {evento.provincia}
              </Typography>
            </Grid>
          )}
          
          {evento.cidade && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cidade
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {evento.cidade}
              </Typography>
            </Grid>
          )}
          
          {evento.bairro && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Bairro
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {evento.bairro}
              </Typography>
            </Grid>
          )}
          
          {evento.tipoEvento && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tipo de Evento
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {evento.tipoEvento}
              </Typography>
            </Grid>
          )}
          
          {evento.capacidade && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Capacidade
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {evento.capacidade} pessoas
              </Typography>
            </Grid>
          )}
          
          {evento.categorias && evento.categorias.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Categorias
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {evento.categorias.map((categoria, index) => (
                  <Chip key={index} label={categoria} variant="outlined" />
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Dialog de Partilha */}
      <Dialog open={shareDialogOpen} onClose={handleCloseShareDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Partilhar Evento</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Partilhe este evento nas redes sociais:
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, my: 3 }}>
            <IconButton 
              onClick={() => shareOnSocialMedia('facebook')}
              sx={{ bgcolor: '#1877F2', color: 'white', '&:hover': { bgcolor: '#166FE5' } }}
            >
              <Facebook />
            </IconButton>
            
            <IconButton 
              onClick={() => shareOnSocialMedia('twitter')}
              sx={{ bgcolor: '#1DA1F2', color: 'white', '&:hover': { bgcolor: '#1A91DA' } }}
            >
              <Twitter />
            </IconButton>
            
            <IconButton 
              onClick={() => shareOnSocialMedia('whatsapp')}
              sx={{ bgcolor: '#25D366', color: 'white', '&:hover': { bgcolor: '#128C7E' } }}
            >
              <WhatsApp />
            </IconButton>
          </Box>
          
          <Typography variant="body1" gutterBottom>
            Ou copie o link:
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={copyLink}
              startIcon={<CopyAll />}
            >
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShareDialog}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VerEvento;