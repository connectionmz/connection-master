import React, { useEffect, useState } from 'react';
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
import { height, width } from '@mui/system';
import BackButton from '../BackButton';

const NoticiadosDesk = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAnuncios = async () => {
    try {
      setLoading(true);
      const snapshot = await get(ref(db, 'publicAnnouncements'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedData = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
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
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  useEffect(() => {
    fetchAnuncios();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '20px',
        }}>
        <Alert severity="error">
          Ocorreu um erro ao carregar os anúncios. Tente novamente mais tarde.
        </Alert>
      </div>
    );
  }

  return (
    <Box style={{ padding:'2%',width: '100%', minHeight: '100vh', backgroundColor: '#FFF'}}>
      <BackButton sx={{ mb: 2 }} />
      <Container >
        {anuncios.length === 0 ? (
          <Alert severity="info">Nenhuma noticia disponível no momento.</Alert>
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
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    },
                  }}>
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
                      sx={{ objectFit: 'cover' }}
                    />
                  )}

                  
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {anuncio.title || 'Sem título'}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                      >
                      </Typography>
                      <div dangerouslySetInnerHTML={{ __html: anuncio.content?.length > 100
                          ? `${anuncio.content.substring(0, 100)}...`
                          : anuncio.content || 'Sem descrição disponível.' }} />
                      <Typography variant="caption" display="block" gutterBottom>
                        Publicado por: {anuncio.company?.nome || 'Desconhecido'}{' '}
                        ({anuncio.company?.provincia || 'N/A'})
                      </Typography>
                      <Typography variant="caption" display="block" gutterBottom>
                        Data: {formatDate(anuncio.date)}
                      </Typography>
                    </CardContent>
                  </Link>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
                    {anuncio.fileUrl && (
                      <IconButton
                        color="primary"
                        aria-label="download"
                        component="a"
                        href={anuncio.fileUrl}
                        download>
                        <FaFileDownload />
                      </IconButton>)}
                    <Button
                      variant="outlined"
                      color="primary"
                      endIcon={<FaArrowRight />}
                      component={Link}
                      to={`/noticia/${anuncio.id}`}>
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