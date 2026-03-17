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
  CircularProgress
} from '@mui/material';
import { 
  KeyboardArrowLeft, 
  KeyboardArrowRight,
  OpenInNew,
  ZoomIn,
  CalendarToday,
  LocationOn,
  Refresh,
  AccessTime
} from '@mui/icons-material';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import { useNavigate } from 'react-router-dom';

const Evento = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [viewMode, setViewMode] = useState('carousel');
  const [eventos, setEventos] = useState([]);
  const [filteredEventos, setFilteredEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventos = () => {
      try {
        setLoading(true);
        const eventosRef = ref(db, 'eventos');
        
        onValue(eventosRef, (snapshot) => {
          const data = snapshot.val();

          if (data) {
            const eventosArray = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            }))
            .filter(evento => {
              if (evento.status !== 'Ativo') return false;
              
              if (evento.dataFim) {
                try {
                  const hoje = new Date();
                  const dataFimEvento = new Date(evento.dataFim);
                  return dataFimEvento >= hoje;
                } catch (error) {
                  console.error("Erro ao processar data:", error);
                  return true; // Se houver erro na data, mantém o evento
                }
              }
              
              return true;
            })
            // Ordenar por data de criação (mais recente primeiro)
            .sort((a, b) => {
              try {
                const dataA = a.criadoEm ? new Date(a.criadoEm) : new Date(0);
                const dataB = b.criadoEm ? new Date(b.criadoEm) : new Date(0);
                return dataB - dataA;
              } catch (error) {
                console.error("Erro ao ordenar eventos:", error);
                return 0;
              }
            });
            
            setEventos(eventosArray);
            setFilteredEventos(eventosArray);
          } else {
            setEventos([]);
            setFilteredEventos([]);
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
      prevIndex === filteredEventos.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? filteredEventos.length - 1 : prevIndex - 1
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
        }))
        .filter(evento => {
          if (evento.status !== 'Ativo') return false;
          
          if (evento.dataFim) {
            try {
              const hoje = new Date();
              // CORREÇÃO: Usar a data diretamente no formato YYYY-MM-DD
              const dataFimEvento = new Date(evento.dataFim);
              return dataFimEvento >= hoje;
            } catch (error) {
              console.error("Erro ao processar data:", error);
              return true;
            }
          }
          
          return true;
        })
        .sort((a, b) => {
          try {
            const dataA = a.criadoEm ? new Date(a.criadoEm) : new Date(0);
            const dataB = b.criadoEm ? new Date(b.criadoEm) : new Date(0);
            return dataB - dataA;
          } catch (error) {
            console.error("Erro ao ordenar eventos:", error);
            return 0;
          }
        });
        
        setEventos(eventosArray);
        setFilteredEventos(eventosArray);
      }
      setLoading(false);
    });
  };

  const handleEventClick = (eventoId) => {
    // Navegar para a página do evento
    navigate(`/verEvento/${eventoId}`);
  };

  // Função para formatar data no formato DD/MM/YYYY
  const formatarData = (dataString) => {
    if (!dataString) return '';
    
    try {
      // Se a data estiver no formato YYYY-MM-DD
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
            {filteredEventos.length > 1 && (
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
        
        {filteredEventos.length > 0 ? (
          viewMode === 'carousel' ? (
            <Box sx={{ position: 'relative' }}>
              {/* Navegação */}
              {filteredEventos.length > 1 && (
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
                  onClick={() => handleEventClick(filteredEventos[activeIndex].id)}
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
                    src={filteredEventos[activeIndex].imagemDestaqueURL || '/default-event.jpg'}
                    alt={filteredEventos[activeIndex].titulo}
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
                      {filteredEventos[activeIndex].titulo}
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
                        {formatarData(filteredEventos[activeIndex].dataInicio)}
                        {filteredEventos[activeIndex].dataFim && ` a ${formatarData(filteredEventos[activeIndex].dataFim)}`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Botão de Visitar */}
                {filteredEventos[activeIndex].linkExterno && (
                  <Button
                    fullWidth
                    variant="contained"
                    endIcon={<OpenInNew />}
                    href={filteredEventos[activeIndex].linkExterno}
                    target="_blank"
                    sx={{ mt: 2 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visitar Evento
                  </Button>
                )}
                
                {/* Botão para página do evento */}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleEventClick(filteredEventos[activeIndex].id)}
                  sx={{ mt: 1 }}
                >
                  Ver Detalhes
                </Button>
              </Box>

              {/* Indicadores */}
              {filteredEventos.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  {filteredEventos.map((_, index) => (
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
              {filteredEventos.map((evento, index) => (
                <Card 
                  key={evento.id} 
                  sx={{ 
                    mb: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 2
                    }
                  }}
                  onClick={() => handleEventClick(evento.id)}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={evento.imagemDestaqueURL || '/default-event.jpg'}
                    alt={evento.titulo}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {evento.titulo}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarToday sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatarData(evento.dataInicio)}
                        {evento.dataFim && ` a ${formatarData(evento.dataFim)}`}
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
                    {evento.criadoPor && evento.criadoPor.nome && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Por: {evento.criadoPor.nome}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      {evento.linkExterno && (
                        <Button
                          variant="outlined"
                          size="small"
                          endIcon={<OpenInNew />}
                          href={evento.linkExterno}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Site Oficial
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                      >
                        Ver Detalhes
                      </Button>
                    </Box>
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
              {filteredEventos.length > 0 && (
                <>
                  <img
                    src={filteredEventos[activeIndex].imagemDestaqueURL || '/default-event.jpg'}
                    alt={filteredEventos[activeIndex].titulo}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '50vh',
                      objectFit: 'contain',
                      borderRadius: '4px'
                    }}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h5">{filteredEventos[activeIndex].titulo}</Typography>
                    
                    {filteredEventos[activeIndex].criadoPor && filteredEventos[activeIndex].criadoPor.nome && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Publicado por: {filteredEventos[activeIndex].criadoPor.nome}
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {formatarData(filteredEventos[activeIndex].dataInicio)}
                        {filteredEventos[activeIndex].dataFim && ` a ${formatarData(filteredEventos[activeIndex].dataFim)}`}
                      </Typography>
                    </Box>
                    
                    {filteredEventos[activeIndex].horaInicio && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1">
                          {filteredEventos[activeIndex].horaInicio}
                          {filteredEventos[activeIndex].horaFim && ` às ${filteredEventos[activeIndex].horaFim}`}
                        </Typography>
                      </Box>
                    )}
                    
                    {filteredEventos[activeIndex].local && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1">{filteredEventos[activeIndex].local}</Typography>
                      </Box>
                    )}
                    
                    {filteredEventos[activeIndex].endereco && (
                      <Typography variant="body2" sx={{ mt: 1, ml: 3 }}>
                        {filteredEventos[activeIndex].endereco}
                      </Typography>
                    )}
                    
                    {filteredEventos[activeIndex].descricao && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                          {filteredEventos[activeIndex].descricao}
                        </Typography>
                      </Box>
                    )}
                    
                    {filteredEventos[activeIndex].organizador && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Organizador: {filteredEventos[activeIndex].organizador}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                      {filteredEventos[activeIndex].linkExterno && (
                        <Button
                          variant="outlined"
                          endIcon={<OpenInNew />}
                          href={filteredEventos[activeIndex].linkExterno}
                          target="_blank"
                        >
                          Site Oficial
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        onClick={() => handleEventClick(filteredEventos[activeIndex].id)}
                      >
                        Ver Página do Evento
                      </Button>
                    </Box>
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