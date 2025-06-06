import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, push, update, remove } from 'firebase/database';
import { db } from '../../fb';
import {
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  IconButton,
  Snackbar,
  Chip,
  Badge,
  useTheme,
  Tooltip,
  Collapse,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  CardMedia
} from '@mui/material';
import BackButton from '../BackButton';
import { 
  Edit, 
  Delete, 
  Send, 
  Comment as CommentIcon,
  Share,
  Business,
  CalendarToday,
  Check,
  Close,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

const BlogDetalheDesk = ({ user }) => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [sending, setSending] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [expandedComments, setExpandedComments] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const [postSnapshot, commentsSnapshot] = await Promise.all([
          get(ref(db, `blogPost/${id}`)),
          get(ref(db, `blogPost/${id}/comments`))
        ]);

        if (postSnapshot.exists()) {
          const postData = postSnapshot.val();
          setPost({
            id,
            ...postData,
            date: postData.date || 'Sem data',
            time: postData.time || '00:00:00'
          });
        } else {
          setError(true);
        }

        if (commentsSnapshot.exists()) {
          const commentsData = commentsSnapshot.val();
          const commentsArray = Object.entries(commentsData).map(([commentId, comment]) => ({
            id: commentId,
            ...comment,
            formattedDate: formatCommentDate(comment.timestamp),
            editedText: comment.edited
          }));
          setComments(commentsArray);
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [id]);

  const formatCommentDate = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true, 
        locale: pt 
      });
    } catch {
      return '';
    }
  };

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

  const checkAuth = () => {
    if (!user?.id) {
      showSnackbar('Você precisa estar logado para realizar esta ação', 'error');
      return false;
    }
    return true;
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCommentSubmit = async () => {
    if (!checkAuth() || !comment.trim()) return;
    
    setSending(true);
    try {
      const newCommentRef = push(ref(db, `blogPost/${id}/comments`));
      const newComment = {
        comment: comment.trim(),
        user: {
          id: user.id,
          nome: user.nome || 'Usuário',
          logo: user.logoUrl
        },
        timestamp: new Date().toISOString()
      };

      await update(newCommentRef, newComment);
      
      setComments(prev => [{
        id: newCommentRef.key,
        ...newComment,
        formattedDate: 'agora mesmo',
        editedText: ''
      }, ...prev]);
      
      setComment('');
      showSnackbar('Comentário adicionado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao enviar comentário:', err);
      showSnackbar('Erro ao enviar comentário', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleEditComment = (commentId, currentText) => {
    if (!checkAuth()) return;
    setEditingCommentId(commentId);
    setEditedCommentText(currentText);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editedCommentText.trim()) return;
    
    try {
      const updates = { 
        comment: editedCommentText.trim(),
        edited: true,
        editTimestamp: new Date().toISOString() 
      };
      
      await update(ref(db, `blogPost/${id}/comments/${commentId}`), updates);
      
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { 
              ...c, 
              comment: updates.comment, 
              editedText: '(editado)',
              formattedDate: formatCommentDate(updates.editTimestamp)
            } 
          : c
      ));
      
      setEditingCommentId(null);
      showSnackbar('Comentário atualizado!', 'success');
    } catch (err) {
      console.error('Erro ao editar comentário:', err);
      showSnackbar('Erro ao editar comentário', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!checkAuth()) return;
    
    try {
      const commentToDelete = comments.find(c => c.id === commentId);
      if (!commentToDelete || commentToDelete.user.id !== user.id) {
        showSnackbar('Você não tem permissão para excluir este comentário', 'error');
        return;
      }

      await remove(ref(db, `blogPost/${id}/comments/${commentId}`));
      setComments(prev => prev.filter(c => c.id !== commentId));
      showSnackbar('Comentário excluído!', 'success');
    } catch (err) {
      console.error('Erro ao eliminar comentário:', err);
      showSnackbar('Erro ao excluir comentário', 'error');
    }
  };

  const handleSharePost = async () => {
    try {
      const shareData = {
        title: post.title,
        text: post.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showSnackbar('Link copiado para a área de transferência!', 'info');
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  const toggleComments = () => {
    setExpandedComments(!expandedComments);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !post) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ width: '100%' }}>
          Post não encontrado ou erro ao carregar.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <BackButton sx={{ mb: 3 }} />
      
      <Card sx={{ mb: 3 }}>
        {post.imageUrl && (
          <CardMedia
            component="img"
            height="360"
            image={post.imageUrl}
            alt={post.title}
            sx={{ objectFit: 'cover' }}
          />
        )}
        
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {formatPostDate(post.date, post.time)}
            </Typography>
          </Box>
          
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            {post.title}
          </Typography>
          
          <Box 
            sx={{ 
              color: 'text.secondary',
              '& p': { mb: 2 },
              '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 }
            }}
            dangerouslySetInnerHTML={{ __html: post.content || 'Sem conteúdo.' }}
          />
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
          <Tooltip title="Compartilhar post">
            <IconButton onClick={handleSharePost}>
              <Share />
            </IconButton>
          </Tooltip>
          
          <Button 
            startIcon={<CommentIcon />}
            endIcon={expandedComments ? <ExpandLess /> : <ExpandMore />}
            onClick={toggleComments}
          >
            {comments.length} comentário{comments.length !== 1 ? 's' : ''}
          </Button>
        </CardActions>
        
        <Collapse in={expandedComments} timeout="auto" unmountOnExit>
          <CardContent sx={{ pt: 0 }}>
            {/* Comment form */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
              <Avatar 
                src={user?.logoUrl} 
                sx={{ width: 40, height: 40, mt: 1 }}
              >
                {user?.nome?.charAt(0) || 'U'}
              </Avatar>
              
              <Box sx={{ flexGrow: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  placeholder={user ? 'Escreva seu comentário...' : 'Faça login para comentar'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={!user}
                  sx={{ mb: 1 }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {user ? (
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={handleCommentSubmit}
                      disabled={sending || !comment.trim()}
                    >
                      {sending ? 'Enviando...' : 'Comentar'}
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => showSnackbar('Faça login para comentar', 'warning')}
                    >
                      Login para comentar
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
            
            {/* Comments list */}
            {comments.length > 0 ? (
              <List disablePadding>
                {comments.map((c) => (
                  <Paper 
                    key={c.id} 
                    elevation={0} 
                    sx={{ 
                      mb: 2, 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.100'
                    }}
                  >
                    <ListItem alignItems="flex-start" disablePadding>
                      <ListItemAvatar sx={{ minWidth: 48 }}>
                        <Avatar src={c.user?.logo} sx={{ width: 40, height: 40 }}>
                          {c.user?.nome?.charAt(0) || 'A'}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" fontWeight={500}>
                              {c.user?.nome || 'Anônimo'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {c.formattedDate} {c.editedText}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          editingCommentId === c.id ? (
                            <Box sx={{ mt: 1 }}>
                              <TextField
                                fullWidth
                                multiline
                                value={editedCommentText}
                                onChange={(e) => setEditedCommentText(e.target.value)}
                                sx={{ mb: 1 }}
                              />
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Check />}
                                  onClick={() => handleSaveEdit(c.id)}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<Close />}
                                  onClick={() => setEditingCommentId(null)}
                                >
                                  Cancelar
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                              {c.comment}
                            </Typography>
                          )
                        }
                        sx={{ ml: 1 }}
                      />
                      
                      {user?.id === c.user?.id && editingCommentId !== c.id && (
                        <Box sx={{ ml: 1 }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleEditComment(c.id, c.comment)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton size="small" onClick={() => handleDeleteComment(c.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </ListItem>
                  </Paper>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </Typography>
            )}
          </CardContent>
        </Collapse>
      </Card>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BlogDetalheDesk;