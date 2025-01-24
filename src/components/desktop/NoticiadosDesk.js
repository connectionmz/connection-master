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
  Alert 
} from '@mui/material';
import { FaFileDownload } from 'react-icons/fa';

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
        }}
      >
        <Alert severity="error">
          Ocorreu um erro ao carregar os anúncios. Tente novamente mais tarde.
        </Alert>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Notícias
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ paddingY: 4 }}>
        {anuncios.length === 0 ? (
          <Alert severity="info">Nenhum anúncio disponível no momento.</Alert>
        ) : (
          <Grid container spacing={3}>
            {anuncios.map((anuncio) => (
              <Grid item xs={12} sm={6} md={4} key={anuncio.id}>
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={anuncio.fileUrl || '/images/default-placeholder.png'}
                    alt={anuncio.company?.nome || 'Imagem do anúncio'}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {anuncio.title || 'Sem título'}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      {anuncio.content?.length > 100
                        ? `${anuncio.content.substring(0, 100)}...`
                        : anuncio.content || 'Sem descrição disponível.'}
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom>
                      Publicado por: {anuncio.company?.nome || 'Desconhecido'}{' '}
                      ({anuncio.company?.provincia || 'N/A'})
                    </Typography>
                    <Typography variant="caption" display="block" gutterBottom>
                      Data: {formatDate(anuncio.date)}
                    </Typography>
                  </CardContent>
                  {anuncio.fileUrl && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<FaFileDownload />}
                      href={anuncio.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ margin: 2 }}
                    >
                      Baixar Anexo
                    </Button>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </div>
  );
};

export default NoticiadosDesk;
