import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db, storage } from '../../fb';
import { ref, onValue, push, set, remove, update, get } from 'firebase/database';
import { deleteObject, ref as storageRef } from 'firebase/storage';
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
  Container,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import ReplyIcon from '@mui/icons-material/Reply';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';
import BackButton from '../BackButton';
import { formatDistanceToNow } from 'date-fns';
import { enGB, pt } from 'date-fns/locale';
import EditPostDialog from './EditPostDialog';
import { useLanguage } from '../../context/LanguageContext';
import { isOwnedPostStoragePath } from '../../utils/postStorage';
import { normalizePostDetail } from '../../utils/postData';

/* ── Design tokens — consistente com StoresDesk ─────────────────────── */
const createTokens = (theme) => ({
  navy: theme.palette.background.default,
  navyMid: theme.palette.action.hover,
  navyLight: theme.palette.primary.dark,
  navyCard: theme.palette.background.paper,
  gold: theme.palette.primary.main,
  goldLight: theme.palette.primary.light,
  goldPale: theme.palette.action.selected,
  white: theme.palette.text.primary,
  text: theme.palette.text.primary,
  textSub: theme.palette.text.secondary,
  border: theme.palette.divider,
  borderMid: theme.palette.divider,
  surface: theme.palette.background.default,
  darkBorder: theme.palette.divider,
  darkBorderMid: theme.palette.divider,
  darkText: theme.palette.text.primary,
  darkTextSub: theme.palette.text.secondary,
  darkMuted: theme.palette.text.disabled,
  success: theme.palette.success.main,
  error: theme.palette.error.main,
  warning: theme.palette.warning.main,
});

const KEYFRAMES = (T) => `
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
  const navigate = useNavigate();
  const { language, t } = useLanguage();
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
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = useTheme();
  const T = createTokens(theme);

  // Formatador de data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (!dateString || Number.isNaN(date.getTime())) return t('feed.dateUnknown');
    return formatDistanceToNow(date, {
      addSuffix: true, 
      locale: language === 'en' ? enGB : pt
    });
  };

  // Carregar dados do post
  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    const postsRef = ref(db, `posts/${postId}`);
    
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPost(normalizePostDetail(data, postId, t('postDetail.companyUnknown')));
        setImageFailed(false);
        
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
      setLoadError(true);
      setSnackbar({ 
        open: true, 
        message: t('postDetail.loadError'),
        severity: 'error' 
      });
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [postId, user?.id, t]);

  const checkUserAuth = useCallback(() => {
    if (!user || !user.id) {
      setSnackbar({ 
        open: true, 
        message: t('postDetail.authRequired'),
        severity: 'error' 
      });
      return false;
    }
    return true;
  }, [user, t]);

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
        message: replyingTo ? t('postDetail.replySuccess') : t('postDetail.commentSuccess'),
        severity: 'success' 
      });
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      setSnackbar({ 
        open: true, 
        message: replyingTo ? t('postDetail.replyError') : t('postDetail.commentError'),
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
          message: t('postDetail.unlikeSuccess'),
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
          message: t('postDetail.likeSuccess'),
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
      setSnackbar({
        open: true,
        message: t('postDetail.likeError'),
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
              message: t('postDetail.copySuccess'),
              severity: 'success' 
            });
          })
          .catch(() => {
            setSnackbar({ 
              open: true, 
              message: t('postDetail.copyError'),
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
        message: t('postDetail.reportReasonRequired'),
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
          message: t('postDetail.reportDuplicate'),
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
          message: t('postDetail.reportSuccess'),
          severity: 'success' 
        });
      }
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      setSnackbar({ 
        open: true, 
        message: t('postDetail.reportError'),
        severity: 'error' 
      });
    } finally {
      setDenunciaModalOpen(false);
      setMotivoDenuncia('');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!checkUserAuth()) return;
    const targetComment = comments.find((comment) => comment.id === commentId);
    if (!targetComment || (targetComment.userId !== user.id && post?.companyId !== user.id)) {
      setSnackbar({ open: true, message: t('postDetail.permissionDenied'), severity: 'error' });
      return;
    }
    
    try {
      const commentRef = ref(db, `posts/${postId}/comments/${commentId}`);
      await remove(commentRef);
      setSnackbar({ 
        open: true, 
        message: t('postDetail.commentDeleteSuccess'),
        severity: 'success' 
      });
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      setSnackbar({ 
        open: true, 
        message: t('postDetail.commentDeleteError'),
        severity: 'error' 
      });
    }
  };

  const handleEditComment = (commentId, currentText) => {
    if (!checkUserAuth()) return;
    const targetComment = comments.find((comment) => comment.id === commentId);
    if (!targetComment || targetComment.userId !== user.id) {
      setSnackbar({ open: true, message: t('postDetail.permissionDenied'), severity: 'error' });
      return;
    }
    setEditingCommentId(commentId);
    setEditedCommentText(currentText);
  };

  const handleSaveEdit = async (commentId) => {
    if (!checkUserAuth() || !editedCommentText.trim()) return;
    const targetComment = comments.find((comment) => comment.id === commentId);
    if (!targetComment || targetComment.userId !== user.id) {
      setSnackbar({ open: true, message: t('postDetail.permissionDenied'), severity: 'error' });
      return;
    }
    
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
        message: t('postDetail.commentUpdateSuccess'),
        severity: 'success' 
      });
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      setSnackbar({ 
        open: true, 
        message: t('postDetail.commentUpdateError'),
        severity: 'error' 
      });
    }
  };

  const handleEditClick = () => {
    if (user?.id !== post.companyId) {
      setSnackbar({
        open: true,
        message: t('postDetail.permissionDenied'),
        severity: 'error'
      });
      return;
    }
    setEditDialogOpen(true);
  };

  const handleDeletePost = async () => {
    if (deletingPost) return;
    if (!user?.id || user.id !== post?.companyId) {
      setDeleteDialogOpen(false);
      setSnackbar({ open: true, message: t('postDetail.permissionDenied'), severity: 'error' });
      return;
    }

    setDeletingPost(true);
    try {
      const postRef = ref(db, `posts/${postId}`);
      const latestSnapshot = await get(postRef);
      const latestPost = latestSnapshot.val();

      if (!latestPost) {
        setDeleteDialogOpen(false);
        navigate('/feed', { replace: true });
        return;
      }

      if (latestPost.company?.id !== user.id) {
        setDeleteDialogOpen(false);
        setSnackbar({ open: true, message: t('postDetail.permissionDenied'), severity: 'error' });
        return;
      }

      const ownedStoragePath = isOwnedPostStoragePath(latestPost.storagePath, user.id)
        ? latestPost.storagePath
        : '';

      await remove(postRef);

      if (ownedStoragePath) {
        try {
          await deleteObject(storageRef(storage, ownedStoragePath));
        } catch (storageError) {
          console.error('Erro ao remover ficheiro da publicação:', storageError);
        }
      }

      setDeleteDialogOpen(false);
      navigate('/feed', { replace: true });
    } catch (error) {
      console.error('Erro ao eliminar publicação:', error);
      setSnackbar({ open: true, message: t('postDetail.deleteError'), severity: 'error' });
    } finally {
      setDeletingPost(false);
    }
  };
  
  const handleCommentKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
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

  if (loadError || !post) {
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
            {loadError ? t('postDetail.loadError') : t('postDetail.notFound')}
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
            {t('postDetail.back')}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: T.navy, minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <style>{KEYFRAMES(T)}</style>
      
      {/* Background Grid */}
      <Box sx={BG_GRID} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <BackButton sx={{ color: T.darkText, mb: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }} />

        <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
          {/* Post Card */}
          <Card className="post-card" sx={{ mb: 3 }}>
            {/* Media */}
            {post.url && !imageFailed ? <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height={isMobile ? 250 : 400}
                image={post.url}
                alt={post.description || t('postDetail.imageAlt', { company: post.companyName })}
                onError={() => setImageFailed(true)}
                sx={{ 
                  objectFit: 'cover',
                  width: '100%'
                }}
              />
            </Box> : (
              <Box sx={{ height: isMobile ? 250 : 400, display: 'grid', placeItems: 'center', bgcolor: 'action.hover' }}>
                <Box sx={{ textAlign: 'center', color: 'text.secondary', px: 2 }}>
                  <WarningIcon aria-hidden="true" sx={{ fontSize: 44, mb: 1 }} />
                  <Typography>{t('postDetail.imageUnavailable')}</Typography>
                </Box>
              </Box>
            )}

            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Company Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Link to={`/empresa/${post.companyId}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', mr: 2 }}>
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
                  <Link to={`/empresa/${post.companyId}`} style={{ textDecoration: 'none' }}>
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
              <Typography variant="body1" sx={{ color: T.darkTextSub, lineHeight: 1.8, mb: 3, fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                {post.description || t('postDetail.noDescription')}
              </Typography>

              {/* Interaction Buttons */}
              <Box sx={{
                display: 'flex',
                gap: 1,
                justifyContent: 'space-between',
                borderTop: `1px solid ${T.darkBorder}`,
                pt: 2,
              }}>
                <Tooltip title={hasLiked ? t('postDetail.unlike') : t('postDetail.like')} arrow>
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
                    {!isMobile && t('postDetail.like')}
                  </Button>
                </Tooltip>

                {user?.id === post.companyId && (
                  <>
                    <Tooltip title={t('postDetail.edit')} arrow>
                      <Button
                        startIcon={<EditIcon sx={{ color: T.darkTextSub }} />}
                        onClick={handleEditClick}
                        sx={{
                          color: T.darkTextSub,
                          textTransform: 'none',
                          '&:hover': { color: T.gold, bgcolor: 'rgba(200,144,58,0.08)' },
                        }}
                      >
                        {!isMobile && t('postDetail.edit')}
                      </Button>
                    </Tooltip>
                    <Tooltip title={t('postDetail.delete')} arrow>
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialogOpen(true)}
                        color="error"
                        sx={{ textTransform: 'none' }}
                      >
                        {!isMobile && t('postDetail.delete')}
                      </Button>
                    </Tooltip>
                  </>
                )}

                <Tooltip title={t('postDetail.share')} arrow>
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
                    {!isMobile && t('postDetail.share')}
                  </Button>
                </Tooltip>

                <Tooltip title={t('postDetail.report')} arrow>
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
                    {!isMobile && t('postDetail.report')}
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
                {t('postDetail.comments', { count: comments.filter(c => !c.parentId).length })}
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
                        {t('postDetail.replying')}
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
                    placeholder={replyingTo ? t('postDetail.replyPlaceholder') : t('postDetail.commentPlaceholder')}
                    multiline
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={handleCommentKeyPress}
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
                    {t('postDetail.firstComment')}
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
                                      {t('postDetail.cancel')}
                                    </Button>
                                    <Button 
                                      size="small"
                                      onClick={() => handleSaveEdit(comment.id)}
                                      sx={{ color: T.gold }}
                                    >
                                      {t('postDetail.save')}
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
                                  {t('postDetail.reply')}
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
          { key: 'whatsapp', label: 'WhatsApp' },
          { key: 'facebook', label: 'Facebook' },
          { key: 'twitter', label: 'Twitter' },
        ].map((item) => (
          <MenuItem 
            key={item.key} 
            onClick={() => shareOnPlatform(item.key)}
            sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
          >
            <ListItemIcon>
              <ShareIcon sx={{ fontSize: 20, color: T.gold }} />
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
          <ListItemText>{t('postDetail.copyLink')}</ListItemText>
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
          {t('postDetail.reportTitle')}
          <IconButton onClick={() => setDenunciaModalOpen(false)} sx={{ color: T.darkMuted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ color: T.darkTextSub, mb: 2 }}>
            {t('postDetail.reportHelp')}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={t('postDetail.reportPlaceholder')}
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
            {t('postDetail.cancel')}
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
            {t('postDetail.sendReport')}
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
            message: t('postDetail.updateSuccess'),
            severity: 'success'
          });
        }}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={deletingPost ? undefined : () => setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t('postDetail.deleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">{t('postDetail.deleteHelp')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deletingPost}>
            {t('postDetail.cancel')}
          </Button>
          <Button
            onClick={handleDeletePost}
            disabled={deletingPost}
            color="error"
            variant="contained"
            startIcon={deletingPost ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
          >
            {deletingPost ? t('postDetail.deleting') : t('postDetail.confirmDelete')}
          </Button>
        </DialogActions>
      </Dialog>

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
