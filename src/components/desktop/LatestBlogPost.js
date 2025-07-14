import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import { useNavigate } from 'react-router-dom';
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
  Chip
} from '@mui/material';
import { 
  KeyboardArrowLeft, 
  KeyboardArrowRight,
  OpenInNew,
  ZoomIn,
  CalendarToday,
  AccessTime
} from '@mui/icons-material';
import Skeleton from '@mui/material/Skeleton';

const BlogSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const blogsRef = ref(db, "blogPost");
    const unsubscribe = onValue(
      blogsRef,
      (snapshot) => {
        try {
          setLoading(true);
          const data = snapshot.val();

          if (!data) {
            setBlogs([]);
            setLoading(false);
            return;
          }

          const blogsArray = Object.keys(data).map(id => {
            const blog = data[id];
            const [day, month, year] = blog.date?.split('/') || [];
            const [hours, minutes] = blog.time?.split(':') || [];
            const dateObj = new Date(year, month - 1, day, hours, minutes);
            
            return {
              id,
              ...blog,
              timestamp: dateObj.getTime(),
              formattedDate: blog.date,
              formattedTime: blog.time,
              // Limpa o HTML do ReactQuill para exibição resumida
              cleanContent: blog.content?.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
            };
          });

          blogsArray.sort((a, b) => b.timestamp - a.timestamp);
          setBlogs(blogsArray);
          setError(null);
        } catch (err) {
          console.error("Erro ao processar blogs:", err);
          setError("Erro ao carregar os blogs.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Erro ao carregar blogs:", error);
        setError("Erro ao carregar os blogs.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleNext = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === blogs.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? blogs.length - 1 : prevIndex - 1
    );
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleNavigateToBlog = (id) => {
    navigate(`/blog/${id}`);
  };

  const handleNavigateToAllBlogs = () => {
    navigate('/blog');
  };

  if (loading) {
    return (
      <Grid item xs={12} sm={4} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Últimos Blogs
          </Typography>
          <Skeleton variant="rectangular" width="100%" height={isMobile ? 180 : 220} />
          <Box sx={{ mt: 2 }}>
            <Skeleton width="80%" height={28} />
            <Skeleton width="60%" height={20} sx={{ mt: 1 }} />
            <Skeleton width="100%" height={60} sx={{ mt: 1.5 }} />
          </Box>
        </Paper>
      </Grid>
    );
  }

  if (error) {
    return (
      <Grid item xs={12} sm={4} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Últimos Blogs
          </Typography>
          <Typography color="error">FALHA AO CARREGAR</Typography>
        </Paper>
      </Grid>
    );
  }

  return (
    <Grid item xs={12} sm={4} md={3}>
      <Paper sx={{ 
        p: 2, 
        height: 'auto',
        borderRadius: 2,
        boxShadow: 3
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 700, 
          mb: 2,
          color: 'primary.main'
        }}>
          Blog
        </Typography>
        
        {blogs.length > 0 ? (
          <Box sx={{ 
            position: 'relative',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Navegação - Posicionamento ajustado */}
            {blogs.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrev}
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: '40%', // Ajustado para não cobrir a data
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                    bgcolor: 'background.paper',
                    '&:hover': { 
                      bgcolor: 'primary.light',
                      color: 'white'
                    },
                    boxShadow: 3,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <KeyboardArrowLeft />
                </IconButton>
                <IconButton
                  onClick={handleNext}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '40%', // Ajustado para não cobrir a data
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                    bgcolor: 'background.paper',
                    '&:hover': { 
                      bgcolor: 'primary.light',
                      color: 'white'
                    },
                    boxShadow: 3,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <KeyboardArrowRight />
                </IconButton>
              </>
            )}

            {/* Slide Ativo */}
            <Box sx={{ 
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box
                onClick={() => handleNavigateToBlog(blogs[activeIndex].id)}
                sx={{
                  display: 'block',
                  position: 'relative',
                  height: isMobile ? 180 : 220, // Altura fixa para consistência
                  borderRadius: 2,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: 2,
                  '&:hover img': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <img
                  src={blogs[activeIndex].imageUrl || '/placeholder-blog.jpg'}
                  alt={blogs[activeIndex].title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                  onError={(e) => {
                    e.target.src = '/placeholder-blog.jpg';
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
                      bgcolor: 'rgba(0,0,0,0.8)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal();
                  }}
                >
                  <ZoomIn fontSize="medium" />
                </IconButton>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)'
                  }}
                >
                  {blogs[activeIndex].category && (
                    <Chip
                      label={blogs[activeIndex].category}
                      size="small"
                      sx={{ 
                        mb: 1,
                        bgcolor: 'primary.main',
                        color: 'white'
                      }}
                    />
                  )}
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                      lineHeight: 1.2
                    }}
                  >
                    {blogs[activeIndex].title}
                  </Typography>
                </Box>
              </Box>

              {/* Data e Hora - Posicionamento fora da imagem */}
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                mt: 1,
                color: 'text.secondary',
                '& svg': {
                  fontSize: '0.8rem',
                  mr: 0.5
                }
              }}>
                <CalendarToday fontSize="inherit" />
                <Typography variant="caption" sx={{ mr: 1.5 }}>
                  {blogs[activeIndex].formattedDate}
                </Typography>
                <AccessTime fontSize="inherit" />
                <Typography variant="caption">
                  {blogs[activeIndex].formattedTime}
                </Typography>
              </Box>

              {/* Resumo do Blog com altura fixa */}
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 1,
                  mb: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minHeight: '4.5em',
                  flexGrow: 1
                }}
                dangerouslySetInnerHTML={{ __html: blogs[activeIndex].content?.substring(0, 150) + '...' }}
              />

              {/* Botão para ver todos */}
              <Button
                onClick={() => handleNavigateToBlog(blogs[activeIndex].id)}
                variant="contained"
                fullWidth
                sx={{ 
                  mt: 'auto', // Empurra para baixo
                  fontWeight: 600,
                  borderRadius: 2
                }}
              >
                Ler Artigo Completo
              </Button>
            </Box>

            {/* Indicadores */}
            {blogs.length > 1 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mt: 2,
                gap: 1
              }}>
                {blogs.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    sx={{
                      width: index === activeIndex ? 24 : 10,
                      height: 10,
                      borderRadius: 5,
                      bgcolor: index === activeIndex ? 'primary.main' : 'grey.400',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: index === activeIndex ? 'primary.dark' : 'grey.500'
                      }
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
            height: isMobile ? 200 : 250,
            textAlign: 'center',
            flexGrow: 1
          }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Nenhum blog disponível no momento.
            </Typography>
            <Button
              onClick={handleNavigateToAllBlogs}
              variant="outlined"
              size="medium"
              sx={{ mt: 1 }}
            >
              Ver blogs
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
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <Fade in={openModal}>
            <Box sx={{
              position: 'relative',
              width: isMobile ? '95%' : '85%',
              maxWidth: 900,
              maxHeight: '90vh',
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 24,
              overflow: 'hidden',
              outline: 'none',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Imagem ampliada */}
              <Box sx={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100'
              }}>
                <img
                  src={blogs[activeIndex]?.imageUrl || '/placeholder-blog.jpg'}
                  alt={blogs[activeIndex]?.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                />
              </Box>
              
              {/* Informações do blog */}
              <Box sx={{ 
                p: 3,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {blogs[activeIndex]?.title}
                </Typography>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  mt: 1,
                  mb: 2,
                  color: 'text.secondary',
                  '& svg': {
                    fontSize: '0.8rem',
                    mr: 0.5
                  }
                }}>
                  <CalendarToday fontSize="inherit" />
                  <Typography variant="subtitle2" sx={{ mr: 1.5 }}>
                    {blogs[activeIndex]?.formattedDate}
                  </Typography>
                  <AccessTime fontSize="inherit" />
                  <Typography variant="subtitle2">
                    {blogs[activeIndex]?.formattedTime}
                  </Typography>
                </Box>
                
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => handleNavigateToBlog(blogs[activeIndex].id)}
                  sx={{ 
                    mt: 2,
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 2
                  }}
                >
                  Ler Blog Completo
                </Button>
              </Box>
            </Box>
          </Fade>
        </Modal>
      </Paper>
    </Grid>
  );
};

export default BlogSlider;