import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  useMediaQuery,
  Modal,
  Fade,
  Backdrop,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  KeyboardArrowLeft, 
  KeyboardArrowRight,
  OpenInNew,
  ZoomIn,
  CalendarToday,
  LocationOn,
  Link as LinkIcon,
  Refresh
} from '@mui/icons-material';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';

const Evento = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [viewMode, setViewMode] = useState('carousel');
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchEventos = () => {
      try {
        setLoading(true);
        const eventosRef = ref(db, 'eventos');
        
        onValue(eventosRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            // Convert object to array and filter active events
            const eventosArray = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            })).filter(evento => evento.status === 'Ativo');
            
            setEventos(eventosArray);
          } else {
            setEventos([]);
          }
          setLoading(false);
        }, (error) => {
          setError("Erro ao carregar eventos");
          setLoading(false);
          console.error("Error fetching events:", error);
        });
      } catch (err) {
        setError("Erro ao conectar ao banco de dados");
        setLoading(false);
        console.error("Error:", err);
      }
    };

    fetchEventos();
  }, []);

  const handleNext = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === eventos.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? eventos.length - 1 : prevIndex - 1
    );
  };

  const handleOpenModal = (index) => {
    setActiveIndex(index);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'carousel' ? 'list' : 'carousel');
  };

  const refreshEventos = () => {
    setLoading(true);
    const eventosRef = ref(db, 'eventos');
    onValue(eventosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventosArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).filter(evento => evento.status === 'Ativo');
        setEventos(eventosArray);
      }
      setLoading(false);
    });
  };

  if (loading) {
    return (
      <Grid item xs={12} sm={3}>
        <Paper sx={{ p: 2, height: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Paper>
      </Grid>
    );
  }

  if (error) {
    return (
      <Grid item xs={12} sm={3}>
        <Paper sx={{ p: 2, height: 'auto', textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            startIcon={<Refresh />} 
            onClick={refreshEventos}
            sx={{ mt: 2 }}
          >
            Tentar novamente
          </Button>
        </Paper>
      </Grid>
    );
  }

  return (
    <Grid item xs={12} sm={3}>
      <Paper sx={{ p: 2, height: 'auto' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            color: 'primary.main'
          }}>
            Eventos
          </Typography>
          <Box>
            {eventos.length > 1 && (
              <Button 
                size="small" 
                onClick={toggleViewMode}
                sx={{ textTransform: 'none', mr: 1 }}
              >
                {viewMode === 'carousel' ? 'Ver lista' : 'Ver carrossel'}
              </Button>
            )}
            <IconButton size="small" onClick={refreshEventos}>
              <Refresh fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        {eventos.length > 0 ? (
          viewMode === 'carousel' ? (
            <Box sx={{ position: 'relative' }}>
              {/* Navegação */}
              {eventos.length > 1 && (
                <>
                  <IconButton
                    onClick={handlePrev}
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                      boxShadow: 1
                    }}
                  >
                    <KeyboardArrowLeft />
                  </IconButton>
                  <IconButton
                    onClick={handleNext}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                      boxShadow: 1
                    }}
                  >
                    <KeyboardArrowRight />
                  </IconButton>
                </>
              )}

              {/* Slide Ativo */}
              <Box sx={{ position: 'relative' }}>
                <Box
                  onClick={() => handleOpenModal(activeIndex)}
                  sx={{
                    display: 'block',
                    position: 'relative',
                    height: isMobile ? 250 : 350,
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover img': {
                      transform: 'scale(1.03)'
                    }
                  }}
                >
                  <img
                    src={eventos[activeIndex].imagemDestaqueURL || '/default-event.jpg'}
                    alt={eventos[activeIndex].titulo}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                    onError={(e) => {
                      e.target.src = '/default-event.jpg';
                    }}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.7)'
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(activeIndex);
                    }}
                  >
                    <ZoomIn />
                  </IconButton>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: 2,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'common.white', 
                        fontWeight: 700,
                        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                        fontSize: isMobile ? '1rem' : '1.25rem'
                      }}
                    >
                      {eventos[activeIndex].titulo}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <CalendarToday sx={{ 
                        color: 'grey.300', 
                        fontSize: '1rem',
                        mr: 1
                      }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'grey.300',
                          textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                        }}
                      >
                        {eventos[activeIndex].dataInicio}
                        {eventos[activeIndex].dataFim && ` a ${eventos[activeIndex].dataFim}`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Botão de Visitar */}
                {eventos[activeIndex].linkExterno && (
                  <Button
                    fullWidth
                    variant="contained"
                    endIcon={<OpenInNew />}
                    href={eventos[activeIndex].linkExterno}
                    target="_blank"
                    sx={{ mt: 2 }}
                  >
                    Visitar Evento
                  </Button>
                )}
              </Box>

              {/* Indicadores */}
              {eventos.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  {eventos.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: index === activeIndex ? 'primary.main' : 'grey.400',
                        mx: 0.5,
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ 
              maxHeight: isMobile ? '60vh' : '70vh',
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'grey.400',
                borderRadius: '3px',
              }
            }}>
              {eventos.map((evento, index) => (
                <Card 
                  key={evento.id} 
                  sx={{ 
                    mb: 2,
                    '&:hover': {
                      boxShadow: 2
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={evento.imagemDestaqueURL || '/default-event.jpg'}
                    alt={evento.titulo}
                    onClick={() => handleOpenModal(index)}
                    sx={{ cursor: 'pointer' }}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {evento.titulo}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarToday sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {evento.dataInicio}
                        {evento.dataFim && ` a ${evento.dataFim}`}
                      </Typography>
                    </Box>
                    {evento.local && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationOn sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {evento.local}
                        </Typography>
                      </Box>
                    )}
                    {evento.categorias && evento.categorias.length > 0 && (
                      <Box sx={{ mt: 1, mb: 1 }}>
                        {evento.categorias.map((cat, i) => (
                          <Chip 
                            key={i} 
                            label={cat} 
                            size="small" 
                            sx={{ mr: 1, mb: 1 }} 
                          />
                        ))}
                      </Box>
                    )}
                    {evento.linkExterno && (
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        endIcon={<OpenInNew />}
                        href={evento.linkExterno}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        Mais informações
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: isMobile ? 200 : 300,
            textAlign: 'center'
          }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Nenhum evento ativo no momento
            </Typography>
            <Button
              variant="outlined"
              size="medium"
              sx={{ mt: 1 }}
              onClick={refreshEventos}
              startIcon={<Refresh />}
            >
              Recarregar
            </Button>
          </Box>
        )}

        {/* Modal para detalhes do evento */}
        <Modal
          open={openModal}
          onClose={handleCloseModal}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={openModal}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isMobile ? '95%' : '80%',
              maxWidth: 800,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 3,
              outline: 'none',
              borderRadius: 1,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              {eventos.length > 0 && (
                <>
                  <img
                    src={eventos[activeIndex].imagemDestaqueURL || '/default-event.jpg'}
                    alt={eventos[activeIndex].titulo}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '50vh',
                      objectFit: 'contain',
                      borderRadius: '4px'
                    }}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h5">{eventos[activeIndex].titulo}</Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {eventos[activeIndex].dataInicio}
                        {eventos[activeIndex].dataFim && ` a ${eventos[activeIndex].dataFim}`}
                      </Typography>
                    </Box>
                    
                    {eventos[activeIndex].horaInicio && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1">
                          {eventos[activeIndex].horaInicio}
                          {eventos[activeIndex].horaFim && ` às ${eventos[activeIndex].horaFim}`}
                        </Typography>
                      </Box>
                    )}
                    
                    {eventos[activeIndex].local && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1">{eventos[activeIndex].local}</Typography>
                      </Box>
                    )}
                    
                    {eventos[activeIndex].endereco && (
                      <Typography variant="body2" sx={{ mt: 1, ml: 3 }}>
                        {eventos[activeIndex].endereco}
                      </Typography>
                    )}
                    
                    {eventos[activeIndex].categorias && eventos[activeIndex].categorias.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        {eventos[activeIndex].categorias.map((cat, i) => (
                          <Chip key={i} label={cat} sx={{ mr: 1, mb: 1 }} />
                        ))}
                      </Box>
                    )}
                    
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      {eventos[activeIndex].descricao}
                    </Typography>
                    
                    {eventos[activeIndex].linkExterno && (
                      <Button
                        fullWidth
                        variant="contained"
                        endIcon={<OpenInNew />}
                        href={eventos[activeIndex].linkExterno}
                        target="_blank"
                        sx={{ mt: 3 }}
                      >
                        Acessar Site do Evento
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </Box>
          </Fade>
        </Modal>
      </Paper>
    </Grid>
  );
};

export default Evento;