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
  DialogTitle
} from '@mui/material';
import BackButton from '../BackButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginIcon from '@mui/icons-material/Login';

const NoticiaDetalheDesk = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    const fetchNoticia = async () => {
      try {
        const snapshot = await get(ref(db, `publicAnnouncements/${id}`));
        if (snapshot.exists()) {
          setNoticia(snapshot.val());
          console.log(snapshot.val())
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
        await push(newCommentRef, {
          text: comment,
          userId: user.id,
          userEmail: user.email, // Adiciona email para exibição
          timestamp: new Date().toISOString(),
        });
        setComment('');
        // Atualiza comentários otimisticamente
        setComments(prev => [...prev, {
          id: `temp-${Date.now()}`,
          text: comment,
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString()
        }]);
        // Recarrega do servidor para garantir sincronização
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
      // Atualização otimista
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
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: `/noticia/${id}` } });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !noticia) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Notícia não encontrada.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, backgroundColor: '#FFF' }}>
      <BackButton sx={{ mb: 2 }} />
      
      {/* Diálogo de autenticação */}
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

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este comentário?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteComment} color="error">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h4" gutterBottom>
        {noticia.title || 'Sem título'}
      </Typography>
      
      {noticia.imageURL && (
        <Box sx={{ mb: 3 }}>
          <img
            src={noticia.imageURL}
            alt={noticia.title}
            style={{ 
              width: '100%', 
              borderRadius: '8px', 
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              maxHeight: '500px',
              objectFit: 'cover'
            }}
          />
        </Box>
      )}
      
      <Typography variant="body1" paragraph>
        <div dangerouslySetInnerHTML={{ __html: noticia.content || 'Sem conteúdo disponível.' }} />
      </Typography>
      
      <Typography variant="caption" display="block" gutterBottom>
        Publicado por: {noticia.company?.nome || 'Desconhecido'}
      </Typography>
      <Typography variant="caption" display="block" gutterBottom>
        Data: {formatDate(noticia.date)}
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Comentários ({comments.length})
      </Typography>
      
      {/* Área de comentário */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={user ? "Escreva seu comentário..." : "Faça login para comentar"}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mb: 2 }}
          disabled={sending || !user}
        />
        <Button 
          variant="contained" 
          onClick={handleCommentSubmit} 
          disabled={sending || !comment.trim() || !user}
        >
          {sending ? 'Enviando...' : 'Enviar'}
        </Button>
        {!user && (
          <Button 
            variant="outlined" 
            onClick={() => setAuthDialogOpen(true)}
            sx={{ ml: 2 }}
            startIcon={<LoginIcon />}
          >
            Login
          </Button>
        )}
      </Box>

      {/* Lista de comentários */}
      <Box>
        {comments.length > 0 ? (
          comments.map((c) => (
            <Box 
              key={c.id} 
              sx={{ 
                mb: 2, 
                p: 2, 
                border: '1px solid #eee', 
                borderRadius: '4px',
                backgroundColor: '#fafafa'
              }}
            >
              {editingCommentId === c.id ? (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {c.userEmail || 'Usuário anônimo'}
                  </Typography>
                  <TextField
                    fullWidth
                    value={editedCommentText}
                    onChange={(e) => setEditedCommentText(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => handleSaveEdit(c.id)}
                    disabled={!editedCommentText.trim()}
                  >
                    Salvar
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setEditingCommentId(null)} 
                    sx={{ ml: 2 }}
                  >
                    Cancelar
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    {c.userEmail || 'Usuário anônimo'} • {formatDate(c.timestamp)}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {c.text}
                  </Typography>
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
              )}
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default NoticiaDetalheDesk;