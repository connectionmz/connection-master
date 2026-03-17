import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../../fb';
import { ref, onValue, push, set, remove, update, get } from 'firebase/database';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  Divider,
  Snackbar,
  Alert,
  IconButton,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  CircularProgress,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Paper,
  Fade,
  Chip,
  Container,
} from '@mui/material';

import {
  Delete as DeleteIcon,
  Share as ShareIcon,
  ThumbUp as ThumbUpIcon,
  Report as ReportIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  ShareOutlined as ShareOutlinedIcon,
  FlagOutlined as FlagOutlinedIcon,
  Send as SendIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Reply as ReplyIcon,
  AccessTime as AccessTimeIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import BackButton from '../BackButton';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatDateTime } from '../../utils/utils';
import EditPostDialog from './EditPostDialog';

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
  .post-card {
    background: ${T.navyCard};
    border: 1px solid ${T.darkBorder};
    border-radius: 24px;
    overflow: hidden;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .comment-card {
    background: ${T.navyCard};
    border: 1px solid ${T.darkBorder};
    border-radius: 16px;
    transition: border-color 0.2s ease;
    margin-bottom: 12px;
  }
  .comment-card:hover {
    border-color: ${T.gold} !important;
  }
  .reply-card {
    background: rgba(13,34,64,0.6);
    border-left: 3px solid ${T.gold};
    border-radius: 12px;
    margin-top: 8px;
    padding: 12px;
  }
`;

const BG_GRID = {
  position:'absolute', inset:0, pointerEvents:'none', opacity:0.02,
  backgroundImage:`linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize:'56px 56px',
};

const PostDetailPageDesk = ({ user }) => {
  const { postId } = useParams();
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [denunciaModalOpen, setDenunciaModalOpen] = useState(false);
  const [motivoDenuncia, setMotivoDenuncia] = useState('');
  const [loadingLike, setLoadingLike] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = useTheme();

  // Formatador de data
  const formatDate = (dateString) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: pt 
    });
  };

  // Carregar dados do post
  useEffect(() => {
    setLoading(true);
    const postsRef = ref(db, `posts/${postId}`);
    
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPost({
          id: postId,
          description: data.description || '',
          url: data.url || '',
          companyName: data.company?.name || 'Empresa Desconhecida',
          logoUrl: data.company?.logo || 'https://via.placeholder.com/150',
          companyId: data.company?.id,
          createdAt: data.createdAt || new Date().toISOString(),
          verified: data.company?.verified || false,
        });
        
        const likesData = data.likes || {};
        setLikes(Object.keys(likesData).length);
        
        if (user?.id && likesData[user.id]) {
          setHasLiked(true);
        } else {
          setHasLiked(false);
        }
        
        const commentsData = Object.entries(data.comments || {}).map(([id, comment]) => ({
          id,
          ...comment
        }));
        
        setComments(
          commentsData.sort((a, b) => {
            const dateA = new Date(a.data || 0);
            const dateB = new Date(b.data || 0);
            return dateB - dateA;
          })
        );
      } else {
        setPost(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar post:", error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao carregar post', 
        severity: 'error' 
      });
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [postId, user?.id]);

  const checkUserAuth = useCallback(() => {
    if (!user || !user.id) {
      setSnackbar({ 
        open: true, 
        message: 'Você precisa estar logado para realizar esta ação', 
        severity: 'error' 
      });
      return false;
    }
    return true;
  }, [user]);

  const handleAddComment = async () => {
    if (!checkUserAuth() || !commentText.trim()) return;
    
    try {
      const commentRef = ref(db, `posts/${postId}/comments`);
      const newCommentRef = push(commentRef);
      
      const comment = {
        id: newCommentRef.key,
        userId: user.id,
        userName: user.nome,
        userAvatar: user.avatar || '',
        comment: commentText,
        data: new Date().toISOString(),
        ...(replyingTo && { parentId: replyingTo }),
      };
      
      await set(newCommentRef, comment);
      setCommentText('');
      setReplyingTo(null);
      setSnackbar({ 
        open: true, 
        message: replyingTo ? 'Resposta enviada!' : 'Comentário adicionado!', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      setSnackbar({ 
        open: true, 
        message: replyingTo ? 'Erro ao enviar resposta.' : 'Erro ao adicionar comentário.', 
        severity: 'error' 
      });
    }
  };

  const handleReply = (commentId, userName) => {
    setReplyingTo(commentId);
    setCommentText(`@${userName} `);
    setTimeout(() => document.getElementById('comment-input')?.focus(), 0);
  };
  
  const toggleReplies = (commentId) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleLike = async () => {
    if (!checkUserAuth()) return;
    
    setLoadingLike(true);
    
    try {
      const postRef = ref(db, `posts/${postId}/likes/${user.id}`);
      const likeSnapshot = await get(postRef);
      
      if (likeSnapshot.exists()) {
        await remove(postRef);
        setHasLiked(false);
        setSnackbar({
          open: true,
          message: 'Gosto removido',
          severity: 'info',
        });
      } else {
        await set(postRef, {
          timestamp: new Date().toISOString(),
          userId: user.id,
          userName: user.nome
        });
        setHasLiked(true);
        setSnackbar({
          open: true,
          message: 'Gostou',
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao processar sua curtida',
        severity: 'error'
      });
    } finally {
      setLoadingLike(false);
    }
  };
  
  const handleShare = (event) => {
    setShareAnchorEl(event.currentTarget);
  };

  const handleCloseShareMenu = () => {
    setShareAnchorEl(null);
  };

  const shareOnPlatform = (platform) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    const encodedUrl = encodeURIComponent(postUrl);
    const text = encodeURIComponent("Confira este post interessante: ");
    
    let shareUrl = '';
    
    switch(platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text}${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(postUrl)
          .then(() => {
            setSnackbar({ 
              open: true, 
              message: 'Link copiado!', 
              severity: 'success' 
            });
          })
          .catch(() => {
            setSnackbar({ 
              open: true, 
              message: 'Falha ao copiar o link', 
              severity: 'error' 
            });
          });
        break;
      default:
        return;
    }
    
    if (platform !== 'copy') {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
    
    handleCloseShareMenu();
  };

  const handleReport = () => {
    if (!checkUserAuth()) return;
    setDenunciaModalOpen(true);
  };

  const handleDenunciar = async () => {
    if (!checkUserAuth() || !motivoDenuncia.trim()) {
      setSnackbar({ 
        open: true, 
        message: 'Por favor, insira um motivo.', 
        severity: 'error' 
      });
      return;
    }
  
    try {
      const denunciaUsuarioRef = ref(db, `denuncias/posts/${postId}/${user.id}`);
      const snapshot = await get(denunciaUsuarioRef);
      
      if (snapshot.exists()) {
        setSnackbar({ 
          open: true, 
          message: 'Você já denunciou este post.', 
          severity: 'error' 
        });
      } else {
        const novaDenunciaRef = push(denunciaUsuarioRef);
        await set(novaDenunciaRef, {
          motivo: motivoDenuncia,
          timestamp: new Date().toISOString(),
          userId: user.id,
          postId: postId,
          status: 'pending'
        });
        
        setSnackbar({ 
          open: true, 
          message: 'Denúncia enviada!', 
          severity: 'success' 
        });
      }
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao enviar denúncia.', 
        severity: 'error' 
      });
    } finally {
      setDenunciaModalOpen(false);
      setMotivoDenuncia('');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!checkUserAuth()) return;
    
    try {
      const commentRef = ref(db, `posts/${postId}/comments/${commentId}`);
      await remove(commentRef);
      setSnackbar({ 
        open: true, 
        message: 'Comentário excluído!', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao excluir comentário.', 
        severity: 'error' 
      });
    }
  };

  const handleEditComment = (commentId, currentText) => {
    if (!checkUserAuth()) return;
    setEditingCommentId(commentId);
    setEditedCommentText(currentText);
  };

  const handleSaveEdit = async (commentId) => {
    if (!checkUserAuth() || !editedCommentText.trim()) return;
    
    try {
      const commentRef = ref(db, `posts/${postId}/comments/${commentId}`);
      await update(commentRef, { 
        comment: editedCommentText,
        editedAt: new Date().toISOString() 
      });
      
      setEditingCommentId(null);
      setEditedCommentText('');
      setSnackbar({ 
        open: true, 
        message: 'Comentário atualizado!', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao atualizar comentário.', 
        severity: 'error' 
      });
    }
  };

  const handleEditClick = () => {
    if (user?.id !== post.companyId) {
      setSnackbar({
        open: true,
        message: 'Sem permissão para editar',
        severity: 'error'
      });
      return;
    }
    setEditDialogOpen(true);
  };
  
  const handleCommentKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: T.navy,
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: T.gold }} />
      </Box>
    );
  }

  if (!post) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: T.navy,
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        p: 2
      }}>
        <Paper sx={{ 
          p: 4, 
          bgcolor: T.navyCard,
          border: `1px solid ${T.darkBorder}`,
          borderRadius: 3,
          textAlign: 'center',
          maxWidth: 400
        }}>
          <WarningIcon sx={{ fontSize: 48, color: T.warning, mb: 2 }} />
          <Typography sx={{ color: T.white, fontSize: '1.2rem', mb: 1 }}>
            Post não encontrado
          </Typography>
          <Button 
            variant="outlined"
            onClick={() => window.history.back()}
            sx={{ 
              borderColor: T.darkBorder,
              color: T.darkText,
              '&:hover': { borderColor: T.gold, color: T.gold }
            }}
          >
            Voltar
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: T.navy, minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <style>{KEYFRAMES}</style>
      
      {/* Background Grid */}
      <Box sx={BG_GRID} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <BackButton sx={{ color: T.darkText, mb: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }} />

        <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
          {/* Post Card */}
          <Card className="post-card" sx={{ mb: 3 }}>
            {/* Media */}
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height={isMobile ? 250 : 400}
                image={post.url}
                alt={`Post ${post.id}`}
                sx={{ 
                  objectFit: 'cover',
                  width: '100%'
                }}
              />
            </Box>

            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Company Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Link to={`/perfil/${post.companyId}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', mr: 2 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={post.verified ? (
                      <Box sx={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: '50%', 
                        bgcolor: T.gold,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${T.navyCard}`
                      }}>
                        <VerifiedIcon sx={{ fontSize: 10, color: T.navy }} />
                      </Box>
                    ) : null}
                  >
                    <Avatar 
                      src={post.logoUrl} 
                      sx={{ 
                        width: 48, 
                        height: 48,
                        border: `2px solid ${T.gold}`,
                        bgcolor: T.navy,
                      }} 
                    >
                      {post.companyName.charAt(0)}
                    </Avatar>
                  </Badge>
                </Link>
                
                <Box>
                  <Link to={`/perfil/${post.companyId}`} style={{ textDecoration: 'none' }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 700,
                        color: T.white,
                        '&:hover': { color: T.gold }
                      }}
                    >
                      {post.companyName}
                    </Typography>
                  </Link>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 14, color: T.darkMuted }} />
                    <Typography variant="caption" sx={{ color: T.darkMuted }}>
                      {formatDate(post.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Description */}
              <Typography 
                variant="body1"
                sx={{ 
                  color: T.darkTextSub,
                  lineHeight: 1.8,
                  mb: 3,
                  fontSize: '1rem'
                }}
                dangerouslySetInnerHTML={{ __html: post.description }}
              />

              {/* Interaction Buttons */}
              <Box sx={{
                display: 'flex',
                gap: 1,
                justifyContent: 'space-between',
                borderTop: `1px solid ${T.darkBorder}`,
                pt: 2,
              }}>
                <Tooltip title={hasLiked ? "Remover curtida" : "Curtir"} arrow>
                  <Button
                    startIcon={
                      loadingLike ? (
                        <CircularProgress size={20} sx={{ color: T.gold }} />
                      ) : hasLiked ? (
                        <ThumbUpIcon sx={{ color: T.gold }} />
                      ) : (
                        <ThumbUpOutlinedIcon sx={{ color: T.darkTextSub }} />
                      )
                    }
                    onClick={handleLike}
                    disabled={loadingLike}
                    sx={{
                      color: hasLiked ? T.gold : T.darkTextSub,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(200,144,58,0.08)',
                      },
                    }}
                  >
                    <Badge 
                      badgeContent={likes} 
                      sx={{ 
                        '& .MuiBadge-badge': {
                          bgcolor: T.gold,
                          color: T.navy,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }
                      }}
                    />
                    {!isMobile && "Curtir"}
                  </Button>
                </Tooltip>

                {user?.id === post.companyId && (
                  <Tooltip title="Editar publicação" arrow>
                    <Button
                      startIcon={<EditIcon sx={{ color: T.darkTextSub }} />}
                      onClick={handleEditClick}
                      sx={{
                        color: T.darkTextSub,
                        textTransform: 'none',
                        '&:hover': {
                          color: T.gold,
                          bgcolor: 'rgba(200,144,58,0.08)',
                        },
                      }}
                    >
                      {!isMobile && "Editar"}
                    </Button>
                  </Tooltip>
                )}

                <Tooltip title="Compartilhar" arrow>
                  <Button
                    startIcon={<ShareOutlinedIcon sx={{ color: T.darkTextSub }} />}
                    onClick={handleShare}
                    sx={{
                      color: T.darkTextSub,
                      textTransform: 'none',
                      '&:hover': {
                        color: T.gold,
                        bgcolor: 'rgba(200,144,58,0.08)',
                      },
                    }}
                  >
                    {!isMobile && "Compartilhar"}
                  </Button>
                </Tooltip>

                <Tooltip title="Denunciar" arrow>
                  <Button
                    startIcon={<FlagOutlinedIcon sx={{ color: T.darkTextSub }} />}
                    onClick={handleReport}
                    sx={{
                      color: T.darkTextSub,
                      textTransform: 'none',
                      '&:hover': {
                        color: T.error,
                        bgcolor: 'rgba(239,68,68,0.08)',
                      },
                    }}
                  >
                    {!isMobile && "Denunciar"}
                  </Button>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="post-card">
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  color: T.white,
                  mb: 3
                }}
              >
                Comentários ({comments.filter(c => !c.parentId).length})
              </Typography>

              {/* Add Comment */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                <Avatar 
                  src={user?.avatar} 
                  sx={{ 
                    width: 40, 
                    height: 40,
                    border: `2px solid ${T.gold}`,
                    bgcolor: T.navy,
                  }} 
                />
                
                <Box sx={{ flex: 1 }}>
                  {replyingTo && (
                    <Paper sx={{ 
                      p: 1, 
                      mb: 1,
                      bgcolor: 'rgba(200,144,58,0.08)',
                      border: `1px solid ${T.darkBorder}`,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Typography variant="caption" sx={{ color: T.gold }}>
                        Respondendo a um comentário...
                      </Typography>
                      <Button 
                        size="small" 
                        onClick={() => setReplyingTo(null)}
                        sx={{ color: T.darkMuted }}
                      >
                        <CloseIcon fontSize="small" />
                      </Button>
                    </Paper>
                  )}

                  <TextField
                    id="comment-input"
                    placeholder={replyingTo ? "Escreva sua resposta..." : "Escreva um comentário..."}
                    multiline
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={handleCommentKeyPress}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: T.white,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        '& fieldset': { borderColor: T.darkBorder },
                        '&:hover fieldset': { borderColor: T.gold },
                        '&.Mui-focused fieldset': { borderColor: T.gold },
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <IconButton 
                          onClick={handleAddComment} 
                          disabled={!commentText.trim()}
                          sx={{ 
                            color: commentText.trim() ? T.gold : T.darkMuted,
                          }}
                        >
                          <SendIcon />
                        </IconButton>
                      ),
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ borderColor: T.darkBorder, my: 3 }} />

              {/* Comments List */}
              {comments.filter(c => !c.parentId).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography sx={{ color: T.darkMuted }}>
                    Seja o primeiro a comentar!
                  </Typography>
                </Box>
              ) : (
                comments
                  .filter(comment => !comment.parentId)
                  .map((comment) => {
                    const replies = comments.filter(c => c.parentId === comment.id);
                    const hasReplies = replies.length > 0;
                    const repliesVisible = showReplies[comment.id] || false;

                    return (
                      <Box key={comment.id} className="fade-up">
                        {/* Main Comment */}
                        <Paper className="comment-card" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Avatar 
                              src={comment.userAvatar} 
                              sx={{ 
                                width: 40, 
                                height: 40,
                                border: `2px solid ${T.gold}`,
                                bgcolor: T.navy,
                              }} 
                            />
                            
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 0.5
                              }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: T.white }}>
                                  {comment.userName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: T.darkMuted }}>
                                  {formatDate(comment.data)}
                                </Typography>
                              </Box>
                              
                              {editingCommentId === comment.id ? (
                                <Box sx={{ mt: 1 }}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    value={editedCommentText}
                                    onChange={(e) => setEditedCommentText(e.target.value)}
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        color: T.white,
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        '& fieldset': { borderColor: T.darkBorder },
                                      },
                                    }}
                                  />
                                  <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
                                    <Button 
                                      size="small"
                                      onClick={() => setEditingCommentId(null)}
                                      sx={{ color: T.darkMuted }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button 
                                      size="small"
                                      onClick={() => handleSaveEdit(comment.id)}
                                      sx={{ color: T.gold }}
                                    >
                                      Salvar
                                    </Button>
                                  </Box>
                                </Box>
                              ) : (
                                <Typography variant="body2" sx={{ color: T.darkTextSub, lineHeight: 1.6 }}>
                                  {comment.comment}
                                </Typography>
                              )}
                              
                              {/* Comment Actions */}
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button
                                  size="small"
                                  startIcon={<ReplyIcon sx={{ fontSize: 14 }} />}
                                  onClick={() => handleReply(comment.id, comment.userName)}
                                  disabled={comment.userId === user?.id}
                                  sx={{ 
                                    color: T.darkTextSub,
                                    fontSize: '0.7rem',
                                    '&:hover': { color: T.gold }
                                  }}
                                >
                                  Responder
                                </Button>
                                
                                {(comment.userId === user?.id || post.companyId === user?.id) && (
                                  <>
                                    {comment.userId === user?.id && (
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditComment(comment.id, comment.comment)}
                                        sx={{ color: T.gold }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteComment(comment.id)}
                                      sx={{ color: T.error }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>

                              {/* Show/Hide Replies Button */}
                              {hasReplies && (
                                <Box sx={{ mt: 1 }}>
                                  <Button
                                    size="small"
                                    onClick={() => toggleReplies(comment.id)}
                                    sx={{ color: T.gold, fontSize: '0.7rem' }}
                                  >
                                    {repliesVisible ? 'Ocultar respostas' : `Mostrar ${replies.length} resposta${replies.length !== 1 ? 's' : ''}`}
                                  </Button>
                                </Box>
                              )}

                              {/* Replies */}
                              {repliesVisible && replies.map(reply => (
                                <Box key={reply.id} className="reply-card" sx={{ mt: 2, ml: 4 }}>
                                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Avatar 
                                      src={reply.userAvatar} 
                                      sx={{ 
                                        width: 32, 
                                        height: 32,
                                        border: `1px solid ${T.gold}`,
                                      }} 
                                    />
                                    
                                    <Box sx={{ flex: 1 }}>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 0.5
                                      }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: T.white }}>
                                          {reply.userName}
                                          <Typography component="span" variant="caption" sx={{ color: T.darkMuted, ml: 1 }}>
                                            respondeu
                                          </Typography>
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: T.darkMuted }}>
                                          {formatDate(reply.data)}
                                        </Typography>
                                      </Box>
                                      
                                      <Typography variant="body2" sx={{ color: T.darkTextSub, lineHeight: 1.6 }}>
                                        {reply.comment}
                                      </Typography>
                                      
                                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, justifyContent: 'flex-end' }}>
                                        {reply.userId !== user?.id && (
                                          <IconButton
                                            size="small"
                                            onClick={() => handleReply(comment.id, reply.userName)}
                                            sx={{ color: T.gold }}
                                          >
                                            <ReplyIcon fontSize="small" />
                                          </IconButton>
                                        )}
                                        
                                        {(reply.userId === user?.id || post.companyId === user?.id) && (
                                          <>
                                            {reply.userId === user?.id && (
                                              <IconButton
                                                size="small"
                                                onClick={() => handleEditComment(reply.id, reply.comment)}
                                                sx={{ color: T.gold }}
                                              >
                                                <EditIcon fontSize="small" />
                                              </IconButton>
                                            )}
                                            <IconButton
                                              size="small"
                                              onClick={() => handleDeleteComment(reply.id)}
                                              sx={{ color: T.error }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </>
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Paper>
                      </Box>
                    );
                  })
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={handleCloseShareMenu}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: '12px',
            mt: 1,
          }
        }}
      >
        {[
          { key: 'whatsapp', label: 'WhatsApp', icon: 'https://cdn-icons-png.flaticon.com/512/124/124034.png' },
          { key: 'facebook', label: 'Facebook', icon: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' },
          { key: 'twitter', label: 'Twitter', icon: 'https://cdn-icons-png.flaticon.com/512/124/124021.png' },
        ].map((item) => (
          <MenuItem 
            key={item.key} 
            onClick={() => shareOnPlatform(item.key)}
            sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
          >
            <ListItemIcon>
              <Box component="img" src={item.icon} alt={item.label} sx={{ width: 20, height: 20 }} />
            </ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
        <MenuItem 
          onClick={() => shareOnPlatform('copy')}
          sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
        >
          <ListItemIcon>
            <ShareIcon sx={{ fontSize: 20, color: T.gold }} />
          </ListItemIcon>
          <ListItemText>Copiar link</ListItemText>
        </MenuItem>
      </Menu>

      {/* Report Dialog */}
      <Dialog 
        open={denunciaModalOpen} 
        onClose={() => setDenunciaModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: '16px',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: T.white, 
          fontFamily: '"Playfair Display", serif',
          borderBottom: `1px solid ${T.darkBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          Denunciar Post
          <IconButton onClick={() => setDenunciaModalOpen(false)} sx={{ color: T.darkMuted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ color: T.darkTextSub, mb: 2 }}>
            Por favor, descreva o motivo da sua denúncia.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Motivo da Denúncia"
            value={motivoDenuncia}
            onChange={(e) => setMotivoDenuncia(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: T.white,
                bgcolor: 'rgba(255,255,255,0.03)',
                '& fieldset': { borderColor: T.darkBorder },
                '&:hover fieldset': { borderColor: T.gold },
                '&.Mui-focused fieldset': { borderColor: T.gold },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${T.darkBorder}` }}>
          <Button 
            onClick={() => setDenunciaModalOpen(false)}
            sx={{ color: T.darkMuted }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDenunciar} 
            variant="contained"
            disabled={!motivoDenuncia.trim()}
            sx={{
              bgcolor: T.error,
              color: T.white,
              '&:hover': { bgcolor: '#dc2626' },
              '&.Mui-disabled': { bgcolor: T.darkMuted }
            }}
          >
            Enviar Denúncia
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Post Dialog */}
      <EditPostDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        post={post}
        user={user}
        onSave={(updatedPost) => {
          setPost(updatedPost);
          setSnackbar({
            open: true,
            message: 'Publicação atualizada!',
            severity: 'success'
          });
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{
            bgcolor: snackbar.severity === 'success' ? T.gold : 
                     snackbar.severity === 'error' ? T.error : T.warning,
            color: T.white,
            borderRadius: '12px',
            '& .MuiAlert-icon': { color: T.white }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PostDetailPageDesk;