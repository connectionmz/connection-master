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
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import LocationCity from '@mui/icons-material/LocationCity';
import PublicIcon from '@mui/icons-material/Public';

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
          // Se o usuário for nulo, mostrar todos os posts
          // Se o usuário existir, filtrar por província
          const shouldIncludePost = !user || 
            (post.company.provincia === (user?.provinciaTemp || user?.provincia));

          if (shouldIncludePost) {
            allPosts.push({
              id: postId,
              description: post.description || '',
              url: post.url || '',
              companyName: post.company.name || 'Empresa Desconhecida',
              logoUrl: post.company.logo || 'https://via.placeholder.com/150',
              timestamp: post.timestamp || 0,
              companyId: post.company.id || null,
              provincia: post.company.provincia || 'Província não especificada'
            });
          }
        });
      }

      allPosts.sort((a, b) => b.timestamp - a.timestamp);
      setPosts(allPosts);
    });
  }, [user]);

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

    return isToday ? `Hoje às ${formattedTime}` : date.toLocaleDateString('pt-BR') + ' ' + formattedTime;
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
      {/* Cabeçalho informativo */}
      <Box 
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          p: 2,
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          borderLeft: '4px solid #1976d2',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        {user ? <LocationCity sx={{ color: '#1976d2' }} /> : <PublicIcon sx={{ color: '#1976d2' }} />}
        <Typography 
          variant="subtitle1"
          sx={{ 
            fontWeight: 700, 
            color: '#1976d2',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            '& span': {
              color: '#333',
              fontWeight: 600,
              textTransform: 'none',
              ml: 1
            }
          }}
        >
          {user ? 'Exibindo conteúdo de:' : 'Exibindo conteúdo de todas as províncias'}
          {user && (
            <span>
              {user.provinciaTemp || user.provincia}
            </span>
          )}
        </Typography>
      </Box>
      
      {/* Painel informativo */}
      <Accordion defaultExpanded sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Evidencie trabalhos feitos e transmita credibilidade.
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="info" sx={{ mb: 2 }}>
            Histórias que constroem confiança. Conheça os projetos que destacam a competência e 
            o compromisso das empresas que fazem parte da Connection Mozambique.
          </Alert>
          {!user && (
            <Alert severity="warning">
              Você está visualizando posts de todas as províncias. Faça login para ver 
              apenas conteúdo da sua região.
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>
      
      {/* Lista de posts */}
      {posts.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '60vh',
          flexDirection: 'column',
          gap: 2
        }}>
          <Typography variant="h6" color="text.secondary" textAlign="center">
            {user 
              ? 'Nenhuma publicação encontrada na sua região.' 
              : 'Nenhuma publicação encontrada.'}
          </Typography>
          <Chip 
            icon={<PublicIcon />} 
            label="Visualizando todas as províncias" 
            variant="outlined"
            color={user ? "default" : "primary"}
          />
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
                      __html: truncateText(post.description, 150) || '' 
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
                    <Box>
                      <Typography 
                        variant="caption" 
                        noWrap
                        sx={{
                          fontWeight: 500,
                          display: 'block'
                        }}
                      >
                        {post.companyName}
                      </Typography>
                      <Chip 
                        label={post.provincia} 
                        size="small" 
                        sx={{ 
                          height: '16px', 
                          fontSize: '0.6rem', 
                          mt: 0.5,
                          bgcolor: 'rgba(255,255,255,0.2)'
                        }} 
                      />
                    </Box>
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

                    {user && post.companyId === user.id && (
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