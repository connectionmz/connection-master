import React, { useEffect, useState, useCallback } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../../fb';
import { 
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  IconButton,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  Button,
  Badge,
  Divider,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import { 
  CalendarToday, 
  Business, 
  Search,
  Download,
  Share,
  FilterList,
  Sort,
  InsertDriveFile,
  Comment,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import BackButton from '../BackButton';

const Blogs = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [expandedPost, setExpandedPost] = useState(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));


const fetchPosts = useCallback(async () => {
  try {
    setLoading(true);
    const snapshot = await get(ref(db, 'blogPost'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('Dados recebidos:', data);
      
      // Convert to array and sort by timestamp in descending order
      const postsArray = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
        comments: data[key].comments 
          ? Object.entries(data[key].comments).map(([commentId, comment]) => ({
              id: commentId,
              ...comment
            })) 
          : []
      })).sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending
      
      setPosts(postsArray);
      setFilteredPosts(postsArray);
    } else {
      setPosts([]);
      setFilteredPosts([]);
    }
  } catch (err) {
    console.error('Erro ao buscar posts:', err);
    setError(true);
  } finally {
    setLoading(false);
  }
}, []);

  // Filtra e ordena os posts
  useEffect(() => {
    let result = [...posts];
    
    // Filtro por pesquisa
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(query) || 
        (post.content && post.content.toLowerCase().includes(query)) ||
        (post.comments && post.comments.some(comment => 
          comment.comment.toLowerCase().includes(query) ||
          (comment.user && comment.user.nome.toLowerCase().includes(query))
        )
      ))
    }
    
    // Filtro por categoria
    if (selectedCategory !== 'all') {
      result = result.filter(post => post.category === selectedCategory);
    }
    
    // Ordenação
    if (sortBy === 'recent') {
      result.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time || '00:00:00'}`);
        const dateB = new Date(`${b.date} ${b.time || '00:00:00'}`);
        return dateB - dateA;
      });
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time || '00:00:00'}`);
        const dateB = new Date(`${b.date} ${b.time || '00:00:00'}`);
        return dateA - dateB;
      });
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    setFilteredPosts(result);
  }, [posts, searchQuery, selectedCategory, sortBy]);


  const formatPostDate = (dateStr, timeStr) => {
    try {
      const [day, month, year] = dateStr.split('/');
      const [hours, minutes] = timeStr.split(':');
      const date = new Date(year, month - 1, day, hours, minutes);
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr || 'Data desconhecida';
    }
  };


  const formatDate = (dateString, timeString) => {
    try {
      if (!dateString) return '';
      const [day, month, year] = dateString.split('/');
      const date = new Date(`${year}-${month}-${day}`);
      
      if (timeString) {
        const [hours, minutes, seconds] = timeString.split(':');
        date.setHours(hours, minutes, seconds);
      }
      
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(timeString && { hour: '2-digit', minute: '2-digit' })
      });
    } catch {
      return dateString || '';
    }
  };

  const handleShare = async (post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : '',
          url: `${window.location.origin}/blog/${post.id}`
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/blog/${post.id}`);
        alert('Link copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  const toggleComments = (postId) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        p={3}
      >
        <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
          Ocorreu um erro ao carregar os posts. Tente novamente mais tarde.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      p: { xs: 1, sm: 3 },
      bgcolor: theme.palette.background.default,
      minHeight: 'calc(100vh - 64px)'
    }}>
      <BackButton sx={{ mb: 3 }} />
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h4" component="h1" sx={{ 
          fontWeight: 600,
          color: theme.palette.text.primary
        }}>
          Blog
        </Typography>
      </Box>

      {filteredPosts.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '60vh'
        }}>
          <Alert severity="info" sx={{ width: '100%', maxWidth: 600 }}>
            Nenhum post encontrado com os critérios selecionados.
          </Alert>
        </Box>
      ) : (
        <Grid container spacing={isSmallScreen ? 1 : 3}>
          {filteredPosts.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={post.id}>
              <Card
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[6]
                  },
                }}>
                <Link
                  to={`/blog/${post.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}>
                  {post.imageUrl && (
                    <CardMedia
                      component="img"
                      image={post.imageUrl}
                      alt={post.title}
                      sx={{ 
                        height: 250,
                        width: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  )}

                  <CardContent sx={{ 
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatPostDate(post.date, post.time)}
                        </Typography>
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '64px',
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}
                    >
                      {post.title || 'Sem título'}
                    </Typography>
                    
                    <Box
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '72px',
                        mb: 2,
                        color: theme.palette.text.secondary
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: post.content || 'Sem conteúdo disponível.' 
                      }}
                    />
                  </CardContent>
                </Link>

                
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
                  <Tooltip title="Compartilhar" arrow>
                    <IconButton
                      size="small"
                      sx={{ 
                        color: 'primary.contrastText',
                        '&:hover': { color: 'secondary.light' }
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleShare(post);
                      }}
                    >
                      <Share fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {post.comments && post.comments.length > 0 && (
                      <Badge badgeContent={post.comments.length} color="secondary">
                        <Comment fontSize="small" />
                      </Badge>
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

export default Blogs;