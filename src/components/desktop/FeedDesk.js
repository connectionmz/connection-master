import React, { useEffect, useState } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../../fb';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, CardMedia, CardContent, Typography, Avatar, Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const FeedDesk = ({ user }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

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
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    return isToday ? `Às ${formattedTime}` : date.toLocaleDateString('pt-BR') + ' ' + formattedTime;
  };

  const handleDelete = (postId) => {
    const isConfirmed = window.confirm("Tem certeza de que deseja excluir este post?");
    if (isConfirmed) {
      const postRef = ref(db, 'posts/' + postId);
      remove(postRef)
        .then(() => console.log('Post eliminado com sucesso'))
        .catch((error) => console.error('Erro ao eliminar post:', error));
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2, bgcolor: '#f5f5f5' }}>
      {posts.length === 0 ? (
        <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Nenhuma publicação encontrada.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {posts.map((post) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={post.id}>
              <Card
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.3s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': { transform: 'scale(1.02)' },
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
                  alt={`Post ${post.id}`}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    dangerouslySetInnerHTML={{ __html: post.description || 'Sem descrição' }}
                  />
                </CardContent>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: '#000',
                    color: '#fff',
                    px: 2,
                    py: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar src={post.logoUrl} sx={{ width: 32, height: 32, mr: 1 }} />
                    <Typography variant="caption">{post.companyName}</Typography>
                  </Box>
                  <Typography variant="caption">{formatTimestamp(post.timestamp)}</Typography>

                  {post.companyId === user?.id && (
                    <IconButton
                      size="small"
                      sx={{ color: '#ff4d4d' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(post.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
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
