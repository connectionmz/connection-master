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
  Tooltip
} from '@mui/material';
import { 
  CalendarToday, 
  Business, 
  Search,
  Download,
  Share,
  FilterList,
  Sort,
  InsertDriveFile
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import BackButton from '../BackButton';

const NoticiadosDesk = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [filteredAnuncios, setFilteredAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Categorias baseadas na estrutura de dados
  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'public', name: 'Avisos Públicos' },
    { id: 'government', name: 'Governo' },
    { id: 'business', name: 'Empresas' },
    { id: 'events', name: 'Eventos' }
  ];

  const fetchAnuncios = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const snapshot = await get(ref(db, 'publicAnnouncements'));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedData = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          // Garante que cada anúncio tenha uma categoria válida
          category: data[key].category || 'public'
        }));
        
        setAnuncios(formattedData);
        setFilteredAnuncios(formattedData);
      } else {
        setAnuncios([]);
        setFilteredAnuncios([]);
      }
    } catch (err) {
      console.error('Erro ao buscar anúncios:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtra e ordena os anúncios
  useEffect(() => {
    let result = [...anuncios];
    
    // Filtro por pesquisa
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(anuncio => 
        anuncio.title.toLowerCase().includes(query) || 
        (anuncio.content && anuncio.content.toLowerCase().includes(query)) ||
        (anuncio.company?.nome && anuncio.company.nome.toLowerCase().includes(query))
      );
    }
    
    // Filtro por categoria
    if (selectedCategory !== 'all') {
      result = result.filter(anuncio => anuncio.category === selectedCategory);
    }
    
    // Ordenação
    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    setFilteredAnuncios(result);
  }, [anuncios, searchQuery, selectedCategory, sortBy]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const formatValidity = (dateString) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'Expirado';
      if (diffDays === 0) return 'Hoje';
      if (diffDays === 1) return 'Amanhã';
      return `Válido por mais ${diffDays} dias`;
    } catch {
      return '';
    }
  };

  const handleShare = async (anuncio) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: anuncio.title,
          text: anuncio.content ? anuncio.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : '',
          url: `${window.location.origin}/noticia/${anuncio.id}`
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/noticia/${anuncio.id}`);
        alert('Link copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  const getFileIcon = (format) => {
    switch(format) {
      case 'pdf': return <InsertDriveFile color="error" />;
      case 'doc':
      case 'docx': return <InsertDriveFile color="primary" />;
      case 'xls':
      case 'xlsx': return <InsertDriveFile color="success" />;
      default: return <InsertDriveFile />;
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
          Ocorreu um erro ao carregar os anúncios. Tente novamente mais tarde.
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
          Notícias e Anúncios Públicos
        </Typography>
        
      </Box>

      {/* Filtros e busca */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 3,
        alignItems: { xs: 'stretch', sm: 'center' }
      }}>
        <TextField
          label="Buscar notícias"
          variant="outlined"
          fullWidth
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ 
            maxWidth: { sm: 300 },
            flex: 1
          }}
        />
      </Box>
      {filteredAnuncios.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '60vh'
        }}>
          <Alert severity="info" sx={{ width: '100%', maxWidth: 600 }}>
            Nenhuma notícia encontrada com os critérios selecionados.
          </Alert>
        </Box>
      ) : (
        <Grid container spacing={isSmallScreen ? 1 : 3}>
          {filteredAnuncios.map((anuncio) => (
            <Grid item xs={12} sm={6} md={4} key={anuncio.id}>
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
                }}
              >
                <Link
                  to={`/noticia/${anuncio.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {anuncio.imageUrl && (
                    <CardMedia
                      component="img"
                      image={anuncio.imageUrl}
                      alt={anuncio.title}
                      sx={{ 
                        height: 180,
                        width: '100%',
                        objectFit: 'cover'
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
                        {formatDate(anuncio.date)}
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
                      {anuncio.title || 'Sem título'}
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
                        __html: anuncio.content || 'Sem descrição disponível.' 
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
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    maxWidth: '60%'
                  }}>
                    <Avatar 
                      src={anuncio.company?.logo} 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 1,
                        bgcolor: 'background.paper',
                        color: 'primary.main'
                      }}
                    >
                      {!anuncio.company?.logo && <Business fontSize="small" />}
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="caption" 
                        noWrap
                        sx={{
                          fontWeight: 500,
                        }}
                      >
                        {anuncio.company?.nome || 'Desconhecido'}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{
                          fontSize: '0.6rem',
                          display: 'block'
                        }}
                      >
                        {anuncio.company?.provincia || 'Província não informada'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {anuncio.validity && (
                      <Tooltip title={formatValidity(anuncio.validity)} arrow>
                        <Chip 
                          label={new Date(anuncio.validity).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                          size="small" 
                          sx={{ 
                            fontSize: '0.6rem',
                            height: 24,
                            bgcolor: 'primary.dark',
                            color: 'primary.contrastText'
                          }} 
                        />
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Compartilhar" arrow>
                      <IconButton
                        size="small"
                        sx={{ 
                          color: 'primary.contrastText',
                          '&:hover': { color: 'secondary.light' }
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          handleShare(anuncio);
                        }}
                      >
                        <Share fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {anuncio.attachmentUrl && (
                      <Tooltip title={`Download ${anuncio.attachmentFormat?.toUpperCase() || 'arquivo'}`} arrow>
                        <IconButton
                          size="small"
                          sx={{ 
                            color: 'primary.contrastText',
                            '&:hover': { color: 'secondary.light' }
                          }}
                          component="a"
                          href={anuncio.attachmentUrl}
                          download
                        >
                          {getFileIcon(anuncio.attachmentFormat)}
                        </IconButton>
                      </Tooltip>
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

export default NoticiadosDesk;