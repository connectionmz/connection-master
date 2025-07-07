import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import { Link, useNavigate } from 'react-router-dom';
import { Grid, Paper, Box, Typography, Button, useMediaQuery } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';

const Evento = () => {
  const [latestBlog, setLatestBlog] = useState(null);
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
            setLatestBlog(null);
            setLoading(false);
            return;
          }

          // Converter objeto em array e calcular timestamp corretamente
          const blogsArray = Object.keys(data).map(id => {
            const blog = data[id];
            // Criar data no formato "DD/MM/YYYY HH:mm"
            const [day, month, year] = blog.date.split('/');
            const [hours, minutes] = blog.time.split(':');
            const dateObj = new Date(year, month - 1, day, hours, minutes);
            
            return {
              id,
              ...blog,
              timestamp: dateObj.getTime()
            };
          });

          // Ordenar por timestamp (mais recente primeiro)
          blogsArray.sort((a, b) => b.timestamp - a.timestamp);

          // Pegar o mais recente
          if (blogsArray.length > 0) {
            setLatestBlog(blogsArray[0]);
          } else {
            setLatestBlog(null);
          }
          
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

  const handleNavigateToBlog = (id) => {
    navigate(`/blog/${id}`);
  };

  const handleNavigateToAllBlogs = () => {
    navigate('/blog');
  };

  if (loading) {
    return (
      <Grid item xs={12} sm={3}>
        <Paper sx={{ padding: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            Último Blog
          </Typography>
          <Skeleton variant="rectangular" width="100%" height={isMobile ? 100 : 150} />
          <Skeleton width="80%" height={24} sx={{ mt: 1 }} />
          <Skeleton width="100%" height={16} sx={{ mt: 1 }} />
          <Skeleton width="100%" height={16} sx={{ mt: 0.5 }} />
          <Skeleton width="100%" height={40} sx={{ mt: 2 }} />
        </Paper>
      </Grid>
    );
  }

  if (error) {
    return (
      <Grid item xs={12} sm={3}>
        <Paper sx={{ padding: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            Último Blog
          </Typography>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Grid>
    );
  }

  return (
    <Grid item xs={12} sm={3}>
      <Paper sx={{ padding: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
          Evento
        </Typography>
        {latestBlog ? (
          <Box>
            <Box 
              onClick={() => handleNavigateToBlog(latestBlog.id)}
              sx={{ cursor: 'pointer' }}>
              {latestBlog.imageUrl && (
                <img
                  src={latestBlog.imageUrl}
                  alt={latestBlog.title}
                  style={{
                    width: "100%",
                    height: isMobile ? "150px" : "200px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                  onError={(e) => {
                    e.target.src = '/placeholder-blog.jpg'; 
                  }}
                />
              )}
              
              <Typography
                variant="subtitle1"
                sx={{ 
                  fontWeight: "bold", 
                  mt: 1,
                  fontSize: isMobile ? "0.9rem" : "1rem",
                  '&:hover': {
                    color: 'primary.main'
                  },
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {latestBlog.title}
              </Typography>
              
              <Typography variant="caption" color="textSecondary">
                {latestBlog.date} • {latestBlog.time}
              </Typography>
            </Box>
            
            <Button
              onClick={handleNavigateToAllBlogs}
              variant="outlined"
              fullWidth
              sx={{ 
                mt: 2, 
                fontSize: isMobile ? "0.8rem" : "0.875rem",
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white'
                }
              }}
            >
              Ver todos os blogs
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="textSecondary">
              Nenhum blog disponível no momento.
            </Typography>
            <Button
              onClick={handleNavigateToAllBlogs}
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
            >
              Ver blogs
            </Button>
          </>
        )}
      </Paper>
    </Grid>
  );
};

export default Evento;