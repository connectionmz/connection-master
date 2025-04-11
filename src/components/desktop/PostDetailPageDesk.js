import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
  ListItemText
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
  Check as CheckIcon
} from '@mui/icons-material';
import BackButton from '../BackButton';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatDateTime } from '../../utils/utils';

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
  const [anchorEl, setAnchorEl] = useState(null);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

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
          createdAt: data.createdAt || new Date().toISOString()
        });
        
        // Verificar se o usuário atual já curtiu
        if (user?.id && data.likes && data.likes[user.id]) {
          setHasLiked(true);
        } else {
          setHasLiked(false);
        }
        
        setLikes(Object.keys(data.likes || {}).length || 0);
        
        // Ordenar comentários por data (mais recentes primeiro)
        const commentsData = Object.values(data.comments || {});
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
      setSnackbar({ open: true, message: 'Erro ao carregar post', severity: 'error' });
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
      };
      
      await set(newCommentRef, comment);
      setCommentText('');
      setSnackbar({ 
        open: true, 
        message: 'Comentário adicionado!', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao adicionar comentário.', 
        severity: 'error' 
      });
    }
  };

  const handleLike = async () => {
    if (!checkUserAuth()) return;
    
    try {
      const postRef = ref(db, `posts/${postId}/likes/${user.id}`);
      
      if (hasLiked) {
        await remove(postRef);
        setHasLiked(false);
        setLikes(prev => prev - 1);
      } else {
        await set(postRef, true);
        setHasLiked(true);
        setLikes(prev => prev + 1);
        setSnackbar({ 
          open: true, 
          message: 'Curtido!', 
          severity: 'success' 
        });
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
      setSnackbar({ 
        open: true, 
        message: 'Erro ao curtir.', 
        severity: 'error' 
      });
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
    let shareUrl = '';
    
    switch(platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=Confira este post: ${postUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${postUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${postUrl}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(postUrl);
        setSnackbar({ 
          open: true, 
          message: 'Link copiado para a área de transferência!', 
          severity: 'success' 
        });
        break;
      default:
        return;
    }
    
    if (platform !== 'copy') {
      window.open(shareUrl, '_blank');
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
        message: 'Por favor, insira um motivo para a denúncia.', 
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
          message: 'Denúncia enviada com sucesso!', 
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
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!post) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        mt: 4,
        p: 3 
      }}>
        <Typography variant="h6" color="error">
          Post não encontrado ou foi removido!
        </Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          onClick={() => window.history.back()}
        >
          Voltar
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: isMobile ? '100%' : '60%',
        maxWidth: '800px',
        margin: '0 auto',
        p: isMobile ? 1 : 2,
        pb: 6
      }}
    >
      <BackButton sx={{ mb: 2 }} />
      
      {/* Post Card */}
      <Card sx={{ 
        boxShadow: 3, 
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden'
      }}>
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
          <Box sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: '50%',
            p: 1
          }}>
            <IconButton onClick={handleMenuOpen} sx={{ color: 'white' }}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2 
          }}>
            <Avatar 
              src={post.logoUrl} 
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 2 
              }} 
            />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {post.companyName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                  {new Date(post.createdAt).toLocaleDateString('pt-PT', {
                    day: '2-digit',
                    month: 'long',
                  }) + ' às ' + 
                  new Date(post.createdAt).toLocaleTimeString('pt-PT', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </Typography>

            </Box>
          </Box>
          
          <Typography 
              variant="body1"
              sx={{ 
                mb: 2,
                lineHeight: 1.6
              }}
              dangerouslySetInnerHTML={{ __html: post.description }}
            />
        </CardContent>
        {/* Interaction Buttons */}
        <Box
          sx={{
            px: 2,
            pb: 1,
            display: 'flex',
            gap: 1,
            justifyContent: 'space-between',
            borderTop: '1px solid #eee'
          }}
        >
          <Tooltip title="Curtir">
            <Button
              startIcon={hasLiked ? <ThumbUpIcon color="primary" /> : <ThumbUpOutlinedIcon />}
              onClick={handleLike}
              variant="text"
              color="inherit"
              sx={{ 
                textTransform: 'none',
                minWidth: 'auto'
              }}
            >
              <Badge 
                badgeContent={likes} 
                color="primary" 
                sx={{ 
                  '& .MuiBadge-badge': {
                    right: -5,
                    top: 5
                  }
                }}
              />
            </Button>
          </Tooltip>
          
          <Tooltip title="Compartilhar">
            <Button
              startIcon={<ShareOutlinedIcon />}
              onClick={handleShare}
              variant="text"
              color="inherit"
              sx={{ 
                textTransform: 'none',
                minWidth: 'auto'
              }}
            >
              Compartilhar
            </Button>
          </Tooltip>
          
          <Tooltip title="Denunciar">
            <Button
              startIcon={<FlagOutlinedIcon />}
              onClick={handleReport}
              variant="text"
              color="inherit"
              sx={{ 
                textTransform: 'none',
                minWidth: 'auto'
              }}
            >
              Denunciar
            </Button>
          </Tooltip>
        </Box>
      </Card>

      {/* Comments Section */}
      <Card sx={{ 
        boxShadow: 3, 
        mb: 2,
        borderRadius: 2
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Comentários ({comments.length})
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-start',
            gap: 1,
            mb: 2
          }}>
            <Avatar 
              src={user?.avatar} 
              sx={{ 
                width: 40, 
                height: 40 
              }} 
            />
            <TextField
              label="Escreva um comentário..."
              multiline
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={handleCommentKeyPress}
              fullWidth
              variant="outlined"
              margin="normal"
              InputProps={{
                endAdornment: (
                  <IconButton 
                    onClick={handleAddComment} 
                    color="primary"
                    disabled={!commentText.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4
                }
              }}
            />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {comments.length === 0 ? (
            <Typography 
              variant="body2" 
              color="textSecondary" 
              sx={{ 
                textAlign: 'center',
                py: 3
              }}
            >
              Seja o primeiro a comentar!
            </Typography>
          ) : (
            comments.map((comment) => (
              <Box
                key={comment.id}
                sx={{
                  mb: 2,
                  p: 2,
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative'
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: 2
                }}>
                  <Avatar 
                    src={comment.userAvatar} 
                    sx={{ 
                      width: 40, 
                      height: 40 
                    }} 
                  />
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.5
                    }}>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight="bold"
                      >
                        {comment.userName}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                      >
                        <Typography variant="caption" color="text.secondary">
                      {formatDateTime(comment.data)}
                    </Typography>
                        
                      </Typography>
                    </Box>
                    
                    {editingCommentId === comment.id ? (
                      <Box sx={{ mt: 1 }}>
                        <TextField
                          fullWidth
                          multiline
                          value={editedCommentText}
                          onChange={(e) => setEditedCommentText(e.target.value)}
                          sx={{ mb: 1 }}
                        />
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end',
                          gap: 1
                        }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => setEditingCommentId(null)}
                            startIcon={<CloseIcon />}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={() => handleSaveEdit(comment.id)}
                            startIcon={<CheckIcon />}
                          >
                            Salvar
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          whiteSpace: 'pre-line',
                          wordBreak: 'break-word'
                        }}
                      >
                        {comment.comment}
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                {(comment.userId === user?.id || post.companyId === user?.id) && (
                  <Box sx={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 0.5
                  }}>
                    {comment.userId === user?.id && (
                      <Tooltip title="Editar">
                        <IconButton
                          onClick={() => handleEditComment(comment.id, comment.comment)}
                          size="small"
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Excluir">
                      <IconButton
                        onClick={() => handleDeleteComment(comment.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      {/* Menu de Compartilhamento */}
      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={handleCloseShareMenu}
      >
        <MenuItem onClick={() => shareOnPlatform('whatsapp')}>
          <ListItemIcon>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/124/124034.png" 
              alt="WhatsApp" 
              width={24} 
              height={24} 
            />
          </ListItemIcon>
          <ListItemText>WhatsApp</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform('facebook')}>
          <ListItemIcon>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/124/124010.png" 
              alt="Facebook" 
              width={24} 
              height={24} 
            />
          </ListItemIcon>
          <ListItemText>Facebook</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform('twitter')}>
          <ListItemIcon>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/124/124021.png" 
              alt="Twitter" 
              width={24} 
              height={24} 
            />
          </ListItemIcon>
          <ListItemText>Twitter</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform('copy')}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copiar link</ListItemText>
        </MenuItem>
      </Menu>

      {/* Modal de Denúncia */}
      <Dialog 
        open={denunciaModalOpen} 
        onClose={() => setDenunciaModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Denunciar Post
          <IconButton
            aria-label="close"
            onClick={() => setDenunciaModalOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            Por favor, descreva o motivo da sua denúncia. Nossa equipe irá analisar o conteúdo.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Motivo da Denúncia"
            value={motivoDenuncia}
            onChange={(e) => setMotivoDenuncia(e.target.value)}
            sx={{ mt: 2 }}
            helperText="Seja específico para nos ajudar a entender o problema"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDenunciaModalOpen(false)}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDenunciar} 
            color="error"
            variant="contained"
            disabled={!motivoDenuncia.trim()}
          >
            Enviar Denúncia
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PostDetailPageDesk;