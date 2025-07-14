import React, { useState } from 'react';
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
  Backdrop
} from '@mui/material';
import { 
  KeyboardArrowLeft, 
  KeyboardArrowRight,
  OpenInNew,
  ZoomIn
} from '@mui/icons-material';
import salama from '../../img/salama.jpg';
import facim from '../../img/facim.jpg';

const Evento = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  const eventos = [
    {
      id: 1,
      titulo: "🌍 PAVILHÃO DO EXPORTADOR | FACIM 2025 📍",
      imagem: facim,
      link: "https://www.exportamoz.co.mz/pavilhao-exportador",
      data: " 📅 25 a 31 de Agosto, 2025",
      descricao: "Exportadores Moçambicanos e o Mundo! 🌐🚛✈  Durante uma semana, as empresas vão poder: • Expor produtos e soluções com foco em exportação"
    },
    {
      id: 2,
      titulo: "✈ Prepara-te para descobrir a alma da Ilha do Ibo!",
      imagem: salama,
      data: "06/09/2025",
      descricao: "Uma experiência única espera por ti: voo panorâmico, história viva, sabores autênticos e paisagens de tirar o fôlego. 🌴"
    },
  ];

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

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  return (
    <Grid item xs={12} sm={3}>
      <Paper sx={{ p: 2, height: 'auto' }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 700, 
          mb: 2,
          color: 'primary.main'
        }}>
          Eventos
        </Typography>
        
        {eventos.length > 0 ? (
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
                onClick={handleOpenModal}
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
                  src={eventos[activeIndex].imagem}
                  alt={eventos[activeIndex].titulo}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
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
                    handleOpenModal();
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
                      textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                    }}
                  >
                    {eventos[activeIndex].titulo}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'grey.300',
                      textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                    }}
                  >
                    {eventos[activeIndex].data}
                  </Typography>
                </Box>
              </Box>

              {/* Botão de Visitar */}
              {eventos[activeIndex].link && (
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<OpenInNew />}
                  href={eventos[activeIndex].link}
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
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: isMobile ? 200 : 300,
            textAlign: 'center'
          }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Nenhum evento programado
            </Typography>
            <Button
              href="https://coopmov.org"
              target="_blank"
              variant="outlined"
              size="medium"
              sx={{ mt: 1 }}
            >
              Ver agenda
            </Button>
          </Box>
        )}

        {/* Modal para imagem ampliada */}
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
              width: isMobile ? '90%' : '80%',
              maxWidth: 1200,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 2,
              outline: 'none'
            }}>
              <img
                src={eventos[activeIndex].imagem}
                alt={eventos[activeIndex].titulo}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '80vh',
                  objectFit: 'contain'
                }}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">{eventos[activeIndex].titulo}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {eventos[activeIndex].descricao}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Data: {eventos[activeIndex].data}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  endIcon={<OpenInNew />}
                  href={eventos[activeIndex].link}
                  target="_blank"
                  sx={{ mt: 2 }}
                >
                  Visitar Página do Evento
                </Button>
              </Box>
            </Box>
          </Fade>
        </Modal>
      </Paper>
    </Grid>
  );
};

export default Evento;