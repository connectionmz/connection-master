import React, { useEffect, useState } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../../fb';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Avatar, 
  Box, 
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const FeedDesk = ({ user }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const postsRef = ref(db, 'posts');
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      let allPosts = [];

      if (data) {
        Object.entries(data).forEach(([postId, post]) => {
          const provinciaUsuario = user?.provinciaTemp || user?.provincia;
          const shouldIncludePost = user
            ? post.company.provincia === provinciaUsuario
            : true;

          if (shouldIncludePost) {
            allPosts.push({
              id: postId,
              description: post.description || '',
              url: post.url || '',
              companyName: post.company.name || 'Empresa Desconhecida',
              logoUrl: post.company.logo || 'https://via.placeholder.com/150',
              timestamp: post.timestamp || 0,
              companyId: post.company.id || null,
            });
          }
        });
      }

      allPosts.sort((a, b) => b.timestamp - a.timestamp);
      setPosts(allPosts);
    });
  }, [user?.provinciaTemp, user?.provincia]);

  const handleClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    return isToday ? `Às ${formattedTime}` : date.toLocaleDateString('pt-BR') + ' ' + formattedTime;
  };

  const handleDelete = (postId, e) => {
    e.stopPropagation();
    const isConfirmed = window.confirm("Tem certeza de que deseja excluir este post?");
    if (isConfirmed) {
      const postRef = ref(db, 'posts/' + postId);
      remove(postRef)
        .then(() => console.log('Post eliminado com sucesso'))
        .catch((error) => console.error('Erro ao eliminar post:', error));
    }
  };

  // Função para truncar texto longo
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Box sx={{ 
      width: '100%', 
      p: { xs: 1, sm: 2 },
      bgcolor: theme.palette.background.default,
      minHeight: 'calc(100vh - 64px)'
    }}>
      {posts.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '60vh'
        }}>
          <Typography variant="h6" color="text.secondary">
            Nenhuma publicação encontrada na sua região.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={isSmallScreen ? 1 : 2}>
          {posts.map((post) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={post.id}>
              <Card
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[6]
                  },
                }}
                onClick={() => handleClick(post.id)}
              >
                <CardMedia
                  component="img"
                  sx={{
                    height: 200,
                    objectFit: 'cover',
                    width: '100%',
                  }}
                  image={post.url || 'https://via.placeholder.com/300'}
                  alt={`Post de ${post.companyName}`}
                />
                
                <CardContent sx={{ 
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 120,
                  maxHeight: 120,
                  overflow: 'hidden'
                }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      mb: 1
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: truncateText(post.description, 150) || 'Sem descrição' 
                    }}
                  />
                </CardContent>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    px: 2,
                    py: 1,
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    maxWidth: '60%'
                  }}>
                    <Avatar 
                      src={post.logoUrl} 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 1,
                        border: `2px solid ${theme.palette.background.paper}`
                      }} 
                    />
                    <Typography 
                      variant="caption" 
                      noWrap
                      sx={{
                        fontWeight: 500
                      }}
                    >
                      {post.companyName}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        mr: post.companyId === user?.id ? 1 : 0,
                        fontSize: '0.7rem'
                      }}
                    >
                      {formatTimestamp(post.timestamp)}
                    </Typography>

                    {post.companyId === user?.id && (
                      <IconButton
                        size="small"
                        sx={{ 
                          color: 'error.light',
                          '&:hover': {
                            color: 'error.main'
                          }
                        }}
                        onClick={(e) => handleDelete(post.id, e)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default FeedDesk;