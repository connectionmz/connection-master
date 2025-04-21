import React, { useEffect, useState, useCallback } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../../fb';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  CircularProgress, 
  Alert, 
  Box,
  IconButton
} from '@mui/material';
import { FaFileDownload, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import BackButton from '../BackButton';

const NoticiadosDesk = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAnuncios = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const snapshot = await get(ref(db, 'publicAnnouncements'));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedData = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          // Ordenar por data mais recente primeiro
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setAnuncios(formattedData);
      } else {
        setAnuncios([]);
      }
    } catch (err) {
      console.error('Erro ao buscar anúncios:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Data inválida';
    }
  };

  useEffect(() => {
    fetchAnuncios();
  }, [fetchAnuncios]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={3}
      >
        <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
          Ocorreu um erro ao carregar os anúncios. Tente novamente mais tarde.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      width: '100%', 
      minHeight: '100vh', 
      backgroundColor: '#FFF',
      position: 'relative'
    }}>
      <BackButton sx={{ mb: 3 }} />
      
      <Container maxWidth="lg">
        {anuncios.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Nenhuma notícia disponível no momento.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {anuncios.map((anuncio) => (
              <Grid item xs={12} sm={6} md={4} key={anuncio.id}>
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'scale(1.03)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <Link
                    to={`/noticia/${anuncio.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {anuncio.fileUrl && (
                      <CardMedia
                        component="img"
                        height="160"
                        image={anuncio.fileUrl}
                        alt={anuncio.company?.nome || 'Imagem do anúncio'}
                        sx={{ 
                          objectFit: 'cover',
                          height: 160,
                          width: '100%'
                        }}
                      />
                    )}

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '64px' // 2 linhas de texto
                        }}
                      >
                        {anuncio.title || 'Sem título'}
                      </Typography>
                      
                      <Box
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '60px',
                          mb: 1
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: anuncio.content || 'Sem descrição disponível.' 
                        }}
                      />
                      
                      <Typography variant="caption" display="block" gutterBottom>
                        Publicado por: {anuncio.company?.nome || 'Desconhecido'}{' '}
                        ({anuncio.company?.provincia || 'N/A'})
                      </Typography>
                      <Typography variant="caption" display="block" gutterBottom>
                        Data: {formatDate(anuncio.date)}
                      </Typography>
                    </CardContent>
                  </Link>
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      p: 2,
                      pt: 0 
                    }}
                  >
                    {anuncio.fileUrl && (
                      <IconButton
                        color="primary"
                        aria-label="download"
                        component="a"
                        href={anuncio.fileUrl}
                        download
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        <FaFileDownload />
                      </IconButton>
                    )}
                    <Button
                      variant="outlined"
                      color="primary"
                      endIcon={<FaArrowRight />}
                      component={Link}
                      to={`/noticia/${anuncio.id}`}
                      sx={{ ml: 'auto' }}
                    >
                      Ver mais
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default NoticiadosDesk;