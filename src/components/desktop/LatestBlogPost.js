import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import { Link, useNavigate } from 'react-router-dom';
import { Grid, Paper, Box, Typography, Button, useMediaQuery } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';

const LatestBlogPost = () => {
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
            return;
          }

          const blogsArray = Object.entries(data).map(([id, blog]) => ({
            id,
            ...blog,
            timestamp: new Date(`${blog.date} ${blog.time}`).getTime()
          }));

          blogsArray.sort((a, b) => b.timestamp - a.timestamp);

          setLatestBlog(blogsArray[0]);
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

  const getTextPreviewAsHtml = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const textOnly = div.textContent || div.innerText || '';
    const preview = textOnly.length > 100 ? textOnly.substring(0, 100) + '...' : textOnly;
    return preview.replace(/\n/g, "<br>"); 
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
          Blog
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
                    height: isMobile ? "250px" : "250px",
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
            WebkitLineClamp: 2, // Mostra até 2 linhas
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            lineHeight: '1.4', // Melhor espaçamento entre linhas
            maxHeight: '3em' // Calculado como 2 linhas * 1.4 lineHeight
          }}
          title={latestBlog.title} >
          {latestBlog.title.length > 250 
            ? `${latestBlog.title.substring(0, 250)}...` 
            : latestBlog.title}
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
              }}>
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
              sx={{ 
                mt: 2, 
                fontSize: isMobile ? "0.8rem" : "0.875rem" 
              }}>
              Ver blogs
            </Button>
          </>
        )}
      </Paper>
    </Grid>
  );
};

export default LatestBlogPost;