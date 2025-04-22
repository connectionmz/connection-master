import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Avatar,
  Chip,
  Card,
  CardContent,
  CardActions,
  useTheme,
  Badge,
  Tooltip
} from '@mui/material';
import BackButton from '../BackButton';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Login as LoginIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  CalendarToday,
  Business,
  Comment as CommentIcon,
  MoreVert
} from '@mui/icons-material';

const NoticiaDetalheDesk = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [sending, setSending] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    const fetchNoticia = async () => {
      try {
        const snapshot = await get(ref(db, `publicAnnouncements/${id}`));
        if (snapshot.exists()) {
          setNoticia(snapshot.val());
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Erro ao buscar notícia:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const snapshot = await get(ref(db, `publicAnnouncements/${id}/comments`));
        if (snapshot.exists()) {
          const commentsData = snapshot.val();
          const commentsArray = Object.keys(commentsData).map((key) => ({
            id: key,
            ...commentsData[key],
          }));
          setComments(commentsArray);
        }
      } catch (err) {
        console.error('Erro ao buscar comentários:', err);
      }
    };

    fetchNoticia();
    fetchComments();
  }, [id]);

  const handleCommentSubmit = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    if (comment.trim()) {
      setSending(true);
      try {
        const newCommentRef = ref(db, `publicAnnouncements/${id}/comments`);
        const newComment = {
          text: comment,
          userId: user.id,
          userEmail: user.email,
          userPhoto: user.photoURL,
          timestamp: new Date().toISOString(),
        };
        await push(newCommentRef, newComment);
        setComment('');
        // Atualização otimista
        setComments(prev => [...prev, { ...newComment, id: `temp-${Date.now()}` }]);
      } catch (err) {
        console.error('Erro ao enviar comentário:', err);
      } finally {
        setSending(false);
      }
    }
  };

  const handleEditComment = (commentId, currentText) => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    setEditingCommentId(commentId);
    setEditedCommentText(currentText);
  };

  const handleSaveEdit = async (commentId) => {
    if (editedCommentText.trim()) {
      try {
        const commentRef = ref(db, `publicAnnouncements/${id}/comments/${commentId}`);
        await update(commentRef, { text: editedCommentText });
        setEditingCommentId(null);
        setEditedCommentText('');
        // Atualização otimista
        setComments(prev => prev.map(c => 
          c.id === commentId ? {...c, text: editedCommentText} : c
        ));
      } catch (err) {
        console.error('Erro ao editar comentário:', err);
      }
    }
  };

  const confirmDeleteComment = (commentId) => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteComment = async () => {
    try {
      const commentRef = ref(db, `publicAnnouncements/${id}/comments/${commentToDelete}`);
      await remove(commentRef);
      setComments(prev => prev.filter(c => c.id !== commentToDelete));
    } catch (err) {
      console.error('Erro ao eliminar comentário:', err);
    } finally {
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: `/noticia/${id}` } });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: noticia.title,
          text: noticia.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareDialogOpen(true);
        setTimeout(() => setShareDialogOpen(false), 2000);
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  const handleDownload = () => {
    if (noticia.attachmentUrl) {
      window.open(noticia.attachmentUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: theme.palette.background.default
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !noticia) {
    return (
      <Container maxWidth="md" sx={{ py: 4, bgcolor: theme.palette.background.default }}>
        <Alert severity="error" sx={{ width: '100%' }}>
          Notícia não encontrada ou erro ao carregar.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, bgcolor: theme.palette.background.default }}>
      <BackButton sx={{ mb: 2 }} />
      
      {/* Diálogos */}
      <Dialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)}>
        <DialogTitle>Autenticação Necessária</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você precisa estar logado para realizar esta ação.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuthDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleLoginRedirect} 
            color="primary"
            startIcon={<LoginIcon />}
          >
            Fazer Login
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteComment} color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogContent>
          <DialogContentText>
            Link copiado para a área de transferência!
          </DialogContentText>
        </DialogContent>
      </Dialog>

      {/* Cabeçalho da Notícia */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          {noticia.title || 'Sem título'}
        </Typography>
        
        <Box>
          {noticia.attachmentUrl && (
            <Tooltip title="Download anexo" arrow>
              <IconButton onClick={handleDownload} sx={{ ml: 1 }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Compartilhar" arrow>
            <IconButton onClick={handleShare} sx={{ ml: 1 }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Metadados da Notícia */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        gap: 2
      }}>
        <Avatar 
          src={noticia.company?.logo} 
          sx={{ 
            width: 40, 
            height: 40,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText
          }}
        >
          {!noticia.company?.logo && <Business />}
        </Avatar>
        
        <Box>
          <Typography variant="subtitle1">
            {noticia.company?.nome || 'Desconhecido'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatDate(noticia.date)}
            </Typography>
            {noticia.company?.provincia && (
              <Chip 
                label={noticia.company.provincia} 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Imagem da Notícia */}
      {noticia.imageUrl && (
        <Box sx={{ 
          mb: 3, 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: theme.shadows[2]
        }}>
          <img
            src={noticia.imageUrl}
            alt={noticia.title}
            style={{ 
              width: '100%', 
              maxHeight: '500px',
              objectFit: 'cover'
            }}
          />
        </Box>
      )}

      {/* Conteúdo da Notícia */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box
            sx={{
              '& p': { mb: 2 },
              '& img': { maxWidth: '100%', height: 'auto' }
            }}
            dangerouslySetInnerHTML={{ 
              __html: noticia.content || 'Sem conteúdo disponível.' 
            }}
          />
        </CardContent>
        
        {noticia.validity && (
          <CardActions sx={{ 
            bgcolor: 'action.hover',
            justifyContent: 'flex-end'
          }}>
            <Typography variant="caption" color="text.secondary">
              Validade: {new Date(noticia.validity).toLocaleDateString('pt-PT')}
            </Typography>
          </CardActions>
        )}
      </Card>

      {/* Seção de Comentários */}
      <Divider sx={{ my: 3 }}>
        <Chip 
          icon={<CommentIcon />}
          label={
            <Badge badgeContent={comments.length} color="primary" sx={{ mr: 1 }}>
              <Typography variant="subtitle1">Comentários</Typography>
            </Badge>
          } 
        />
      </Divider>
      
      {/* Formulário de Comentário */}
      <Box sx={{ 
        mb: 3, 
        p: 2, 
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: theme.shadows[1]
      }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder={user ? "Escreva seu comentário..." : "Faça login para comentar"}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mb: 2 }}
          disabled={sending || !user}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          {!user && (
            <Button 
              variant="outlined" 
              onClick={() => setAuthDialogOpen(true)}
              startIcon={<LoginIcon />}
            >
              Login
            </Button>
          )}
          <Button 
            variant="contained" 
            onClick={handleCommentSubmit} 
            disabled={sending || !comment.trim() || !user}
            sx={{ minWidth: 120 }}
          >
            {sending ? <CircularProgress size={24} /> : 'Comentar'}
          </Button>
        </Box>
      </Box>

      {/* Lista de Comentários */}
      <Box>
        {comments.length > 0 ? (
          comments.map((c) => (
            <Card 
              key={c.id} 
              sx={{ 
                mb: 2,
                bgcolor: 'background.paper'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar 
                    src={c.userPhoto} 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      mr: 1,
                      bgcolor: theme.palette.primary.main
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">
                      {c.userEmail || 'Usuário anônimo'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(c.timestamp)}
                    </Typography>
                  </Box>
                  
                  {user && c.userId === user.id && (
                    <Box>
                      <IconButton 
                        onClick={() => handleEditComment(c.id, c.text)}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        onClick={() => confirmDeleteComment(c.id)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                
                {editingCommentId === c.id ? (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      value={editedCommentText}
                      onChange={(e) => setEditedCommentText(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Button 
                      variant="contained" 
                      onClick={() => handleSaveEdit(c.id)}
                      disabled={!editedCommentText.trim()}
                      size="small"
                    >
                      Salvar
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => setEditingCommentId(null)} 
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      Cancelar
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {c.text}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Alert severity="info" sx={{ width: '100%' }}>
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default NoticiaDetalheDesk;