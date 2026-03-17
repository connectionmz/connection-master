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
  Chip,
  Container,
  Paper,
  Tooltip,
  Fade,
  Skeleton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import LocationCity from '@mui/icons-material/LocationCity';
import PublicIcon from '@mui/icons-material/Public';
import FeedIcon from '@mui/icons-material/Feed';
import AccessTime from '@mui/icons-material/AccessTime';
import Business from '@mui/icons-material/Business';
import Visibility from '@mui/icons-material/Visibility';
import Close from '@mui/icons-material/Close';

/* ── Design tokens — consistente com StoresDesk ─────────────────────── */
const T = {
  navy:        '#08192E',
  navyMid:     '#0E2849',
  navyLight:   '#183A63',
  navyCard:    '#0D2240',
  gold:        '#C8903A',
  goldLight:   '#E8B96A',
  goldPale:    '#FDF3E3',
  white:       '#FFFFFF',
  text:        '#0F1C2D',
  textSub:     '#6B89A5',
  border:      '#E0E8F0',
  borderMid:   '#C5D4E3',
  surface:     '#F4F7FB',
  darkBorder:  'rgba(255,255,255,0.08)',
  darkBorderMid:'rgba(255,255,255,0.14)',
  darkText:    'rgba(255,255,255,0.88)',
  darkTextSub: 'rgba(255,255,255,0.52)',
  darkMuted:   'rgba(255,255,255,0.30)',
  success:     '#10b981',
  error:       '#ef4444',
  warning:     '#f59e0b',
};

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50% { opacity:.6; transform:scale(1.05); }
  }
  .fade-up {
    animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .feed-card {
    background: ${T.navyCard};
    border: 1px solid ${T.darkBorder};
    border-radius: 16px;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    cursor: pointer;
    position: relative;
  }
  .feed-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, ${T.gold} 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .feed-card:hover {
    transform: translateY(-4px);
    border-color: ${T.gold} !important;
    box-shadow: 0 12px 32px rgba(0,0,0,0.3) !important;
  }
  .feed-card:hover::before {
    opacity: 1;
  }
  .media-container {
    position: relative;
    overflow: hidden;
    height: 200px;
  }
  .media-container::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to top, ${T.navyCard} 0%, transparent 100%);
    pointer-events: none;
  }
`;

const BG_GRID = {
  position:'absolute', inset:0, pointerEvents:'none', opacity:0.02,
  backgroundImage:`linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize:'56px 56px',
};

const FeedDesk = ({ user }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    setLoading(true);
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
              provincia: post.company.provincia || 'Província não especificada',
              views: post.views || 0,
            });
          }
        });
      }

      allPosts.sort((a, b) => b.timestamp - a.timestamp);
      setPosts(allPosts);
      setLoading(false);
    });
  }, [user]);

  const handleClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `há ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffHours < 24) {
      return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffDays < 7) {
      return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    } else {
      return date.toLocaleDateString('pt-PT');
    }
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

  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    // Remove HTML tags for counting
    const plainText = text.replace(/<[^>]*>?/gm, '');
    if (plainText.length <= maxLength) return text;
    // Find last space before maxLength
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return text.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
  };

  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
        <Card sx={{ bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: 3 }}>
          <Skeleton variant="rectangular" height={200} sx={{ bgcolor: T.navyMid }} />
          <CardContent>
            <Skeleton variant="text" sx={{ bgcolor: T.navyMid, width: '80%' }} />
            <Skeleton variant="text" sx={{ bgcolor: T.navyMid, width: '60%' }} />
          </CardContent>
          <Box sx={{ p: 2, borderTop: `1px solid ${T.darkBorder}` }}>
            <Skeleton variant="text" sx={{ bgcolor: T.navyMid, width: '40%' }} />
          </Box>
        </Card>
      </Grid>
    ));
  };

  return (
    <Box sx={{ 
      backgroundColor: T.navy, 
      minHeight: 'calc(100vh - 64px)',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      position: 'relative',
    }}>
      <style>{KEYFRAMES}</style>
      
      {/* Background Grid */}
      <Box sx={BG_GRID} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: { xs: 2, sm: 4 } }}>
        
        {/* Header */}
        <Paper sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          bgcolor: T.navyCard,
          border: `1px solid ${T.darkBorder}`,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: 'rgba(200,144,58,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FeedIcon sx={{ color: T.gold, fontSize: 28 }} />
            </Box>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 800,
                  color: T.white,
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                Feed de Notícias
              </Typography>
              <Typography sx={{ color: T.darkTextSub, mt: 0.5 }}>
                Acompanhe as últimas atualizações das empresas
              </Typography>
            </Box>
          </Box>

          {/* Location Chip */}
          <Chip
            icon={user ? <LocationCity /> : <PublicIcon />}
            label={user ? (user.provinciaTemp || user.provincia) : 'Todas as províncias'}
            sx={{
              bgcolor: 'rgba(200,144,58,0.12)',
              color: T.gold,
              border: `1px solid rgba(200,144,58,0.25)`,
              fontWeight: 600,
              fontSize: '0.85rem',
              '& .MuiChip-icon': { color: T.gold }
            }}
          />
        </Paper>

        {/* Info Accordion */}
        <Accordion 
          defaultExpanded 
          sx={{ 
            mb: 4, 
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: '12px !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={{ color: T.gold }} />}
            sx={{
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 1,
              }
            }}
          >
            <InfoIcon sx={{ color: T.gold }} />
            <Typography sx={{ fontWeight: 600, color: T.white }}>
              Evidencie trabalhos feitos e transmita credibilidade
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ borderTop: `1px solid ${T.darkBorder}` }}>
            <Alert 
              severity="info" 
              sx={{ 
                mb: 2,
                bgcolor: 'rgba(33,150,243,0.12)',
                color: T.white,
                border: '1px solid rgba(33,150,243,0.25)',
                '& .MuiAlert-icon': { color: '#2196f3' }
              }}
            >
              Histórias que constroem confiança. Conheça os projetos que destacam a competência e 
              o compromisso das empresas que fazem parte da Connection Mozambique.
            </Alert>
            
            {!user && (
              <Alert 
                severity="warning"
                sx={{
                  bgcolor: 'rgba(245,158,11,0.12)',
                  color: T.warning,
                  border: '1px solid rgba(245,158,11,0.25)',
                  '& .MuiAlert-icon': { color: T.warning }
                }}
              >
                Você está visualizando posts de todas as províncias. Faça login para ver 
                apenas conteúdo da sua região.
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Posts Grid */}
        {loading ? (
          <Grid container spacing={isSmallScreen ? 1 : 2}>
            {renderSkeletons()}
          </Grid>
        ) : posts.length === 0 ? (
          <Paper sx={{ 
            p: 6, 
            textAlign: 'center',
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: 3,
          }}>
            <Box sx={{ mb: 2 }}>
              <FeedIcon sx={{ fontSize: 64, color: T.darkMuted }} />
            </Box>
            <Typography sx={{ color: T.darkText, fontSize: '1.2rem', mb: 1, fontFamily: '"Playfair Display", serif' }}>
              {user ? 'Nenhuma publicação encontrada na sua região' : 'Nenhuma publicação encontrada'}
            </Typography>
            <Chip 
              icon={user ? <LocationCity /> : <PublicIcon />}
              label={user ? (user.provinciaTemp || user.provincia) : 'Visualizando todas as províncias'}
              sx={{
                bgcolor: 'rgba(200,144,58,0.12)',
                color: T.gold,
                border: `1px solid rgba(200,144,58,0.25)`,
                fontWeight: 600,
                mt: 2
              }}
            />
          </Paper>
        ) : (
          <Grid container spacing={isSmallScreen ? 1 : 2}>
            {posts.map((post, index) => (
              <Grid 
                item 
                xs={12} 
                sm={6} 
                md={4} 
                lg={3} 
                key={post.id}
                className="fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Card 
                  className="feed-card"
                  onClick={() => handleClick(post.id)}
                >
                  {/* Media Container */}
                  <Box className="media-container">
                    <CardMedia
                      component="img"
                      sx={{
                        height: 200,
                        objectFit: 'cover',
                        width: '100%',
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                      image={post.url || 'https://via.placeholder.com/300'}
                      alt={`Post de ${post.companyName}`}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300';
                      }}
                    />
                  </Box>
                  
                  <CardContent sx={{ 
                    flexGrow: 1,
                    p: 2,
                    minHeight: 100,
                  }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: T.darkTextSub,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.6,
                        fontSize: '0.9rem',
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: truncateText(post.description) || 'Sem descrição' 
                      }}
                    />
                  </CardContent>

                  {/* Footer */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'rgba(0,0,0,0.2)',
                      borderTop: `1px solid ${T.darkBorder}`,
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      minWidth: 0,
                      flex: 1,
                    }}>
                      <Tooltip title={post.companyName} arrow>
                        <Avatar 
                          src={post.logoUrl} 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 1,
                            border: `2px solid ${T.gold}`,
                            bgcolor: T.navy,
                            flexShrink: 0,
                          }} 
                        >
                          {post.companyName.charAt(0)}
                        </Avatar>
                      </Tooltip>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{
                            fontWeight: 600,
                            color: T.white,
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.75rem',
                          }}
                        >
                          {post.companyName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationCity sx={{ fontSize: 12, color: T.gold }} />
                          <Typography 
                            variant="caption"
                            sx={{
                              color: T.darkTextSub,
                              fontSize: '0.65rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {post.provincia}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title={formatTimestamp(post.timestamp)} arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <AccessTime sx={{ fontSize: 12, color: T.darkMuted }} />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: T.darkMuted,
                              fontSize: '0.65rem',
                              fontWeight: 500,
                            }}
                          >
                            {formatTimestamp(post.timestamp)}
                          </Typography>
                        </Box>
                      </Tooltip>

                      {user && post.companyId === user.id && (
                        <Tooltip title="Excluir post" arrow>
                          <IconButton
                            size="small"
                            sx={{ 
                              color: T.error,
                              opacity: 0.7,
                              '&:hover': {
                                opacity: 1,
                                bgcolor: 'rgba(239,68,68,0.08)',
                              }
                            }}
                            onClick={(e) => handleDelete(post.id, e)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  {/* View count (optional) */}
                  {post.views > 0 && (
                    <Tooltip title={`${post.views} visualizações`} arrow>
                      <Box sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '20px',
                        px: 1,
                        py: 0.3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.3,
                        zIndex: 2,
                      }}>
                        <Visibility sx={{ fontSize: 12, color: T.white }} />
                        <Typography sx={{ fontSize: '0.65rem', color: T.white }}>
                          {post.views}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default FeedDesk;