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
import BackButton from '../BackButton';

const Blogs = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const snapshot = await get(ref(db, 'blogPost')); // Ajuste o caminho conforme necessário
      if (snapshot.exists()) {
        const data = snapshot.val();
        const postsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setPosts(postsArray);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Erro ao buscar posts:', err);
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
    fetchPosts();
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
          Ocorreu um erro ao carregar os posts. Tente novamente mais tarde.
        </Alert>
      </div>
    );
  }

  return (
    <Box style={{ width: '100%', minHeight: '100vh' }}>
      <BackButton sx={{ mb: 2 }} />
      <Container>
        {posts.length === 0 ? (
          <Alert severity="info">Nenhum post disponível no momento.</Alert>
        ) : (
          <Grid container spacing={3}>
            {posts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post.id}>
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
                  }}
                >
                  <Link
                    to={`/blog/${post.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <CardMedia
                      component="img"
                      height="160"
                      image={post.imageURL || '/images/default-placeholder.png'}
                      alt={post.title || 'Imagem do post'}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {post.title || 'Sem título'}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                      >
                        {post.content?.length > 100
                          ? `${post.content.substring(0, 100)}...`
                          : post.content || 'Sem descrição disponível.'}
                      </Typography>
                      <Typography variant="caption" display="block" gutterBottom>
                        Data: {formatDate(post.date)}
                      </Typography>
                    </CardContent>
                  </Link>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      endIcon={<FaArrowRight />}
                      component={Link}
                      to={`/noticia/${post.id}`}>
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
export default Blogs;