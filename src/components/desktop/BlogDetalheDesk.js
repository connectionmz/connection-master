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
} from '@mui/material';
import BackButton from '../BackButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const BlogDetalheDesk = ({ user }) => {
  const { id } = useParams();
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [sending, setSending] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchNoticia = async () => {
      try {
        const snapshot = await get(ref(db, `blogPost/${id}`));
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
        const snapshot = await get(ref(db, `blogPost/${id}/comments`));
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

  const checkAuth = () => {
    if (!user || !user.id) {
      setSnackbar({
        open: true,
        message: 'Você precisa estar logado para realizar esta ação',
        severity: 'error'
      });
      return false;
    }
    return true;
  };

  const handleCommentSubmit = async () => {
    if (!checkAuth()) return;
    
    if (comment.trim()) {
      setSending(true);
      try {
        const newCommentRef = ref(db, `blogPost/${id}/comments`);
        const newComment = {
          comment: comment,
          user: {
            nome: user.nome,
            logo: user.logoUrl,
            id: user.id,
          },
          timestamp: new Date().toISOString(), // Adiciona timestamp para ordenação
        };
        await push(newCommentRef, newComment);
        setComment('');
        
        // Atualiza a lista de comentários otimizando a requisição
        setComments(prev => [...prev, {
          id: newCommentRef.key,
          ...newComment
        }]);
        
        setSnackbar({
          open: true,
          message: 'Comentário adicionado com sucesso!',
          severity: 'success'
        });
      } catch (err) {
        console.error('Erro ao enviar comentário:', err);
        setSnackbar({
          open: true,
          message: 'Erro ao enviar comentário',
          severity: 'error'
        });
      } finally {
        setSending(false);
      }
    }
  };

  const handleEditComment = (commentId, currentText) => {
    if (!checkAuth()) return;
    
    setEditingCommentId(commentId);
    setEditedCommentText(currentText);
  };

  const handleSaveEdit = async (commentId) => {
    if (!checkAuth()) return;
    
    if (editedCommentText.trim()) {
      try {
        const commentRef = ref(db, `blogPost/${id}/comments/${commentId}`);
        await update(commentRef, { 
          comment: editedCommentText,
          edited: true, // Marca como editado
          editTimestamp: new Date().toISOString() 
        });
        
        setEditingCommentId(null);
        setEditedCommentText('');
        
        // Atualiza o estado local sem precisar recarregar todos os comentários
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, comment: editedCommentText, edited: true } 
            : c
        ));
        
        setSnackbar({
          open: true,
          message: 'Comentário atualizado com sucesso!',
          severity: 'success'
        });
      } catch (err) {
        console.error('Erro ao editar comentário:', err);
        setSnackbar({
          open: true,
          message: 'Erro ao editar comentário',
          severity: 'error'
        });
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!checkAuth()) return;
    
    try {
      // Verifica se o comentário pertence ao usuário antes de deletar
      const commentToDelete = comments.find(c => c.id === commentId);
      if (!commentToDelete || commentToDelete.user.id !== user.id) {
        setSnackbar({
          open: true,
          message: 'Você não tem permissão para excluir este comentário',
          severity: 'error'
        });
        return;
      }

      const commentRef = ref(db, `blogPost/${id}/comments/${commentId}`);
      await remove(commentRef);
      
      // Atualiza o estado local sem precisar recarregar todos os comentários
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      setSnackbar({
        open: true,
        message: 'Comentário excluído com sucesso!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao eliminar comentário:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir comentário',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !noticia) {
    return (
      <Container maxWidth="md" sx={{ paddingY: 4 }}>
        <Alert severity="error">Notícia não encontrada.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ paddingY: 4, backgroundColor: '#FFF' }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        {noticia.title || 'Sem título'}
      </Typography>

      {noticia.imageURL && (
        <Box sx={{ marginBottom: 3 }}>
          <img
            src={noticia.imageURL}
            alt={noticia.title}
            style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
          />
        </Box>
      )}
      <Typography variant="body1" paragraph sx={{ color: '#555', lineHeight: 1.6 }}>
      <div dangerouslySetInnerHTML={{ __html: noticia.content }} />
            </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <Typography variant="caption" >
          Data: {noticia.date ? new Date(noticia.date).toLocaleDateString('pt-PT') : 'Data indisponível'}
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Comentários
      </Typography>

      {/* Campo de Comentário */}
      <Box sx={{ marginBottom: 3 }}>
        <TextField
          fullWidth
          placeholder={user ? "Escreva seu comentário..." : "Faça login para comentar"}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          multiline
          rows={3}
          sx={{ marginBottom: 2 }}
          disabled={sending || !user}
        />
        {user ? (
          <Button
            variant="contained"
            onClick={handleCommentSubmit}
            disabled={sending || !comment.trim()}
            sx={{ backgroundColor: '#0073b1', '&:hover': { backgroundColor: '#005f8e' } }}
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => setSnackbar({
              open: true,
              message: 'Você precisa estar logado para comentar',
              severity: 'error'
            })}
            sx={{ backgroundColor: '#0073b1', '&:hover': { backgroundColor: '#005f8e' } }}
          >
            Faça login para comentar
          </Button>
        )}
      </Box>

      {/* Lista de Comentários */}
      {comments.length > 0 ? (
        <List>
          {comments
            .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')) // Ordena por timestamp
            .map((c) => (
              <Paper key={c.id} sx={{ marginBottom: 2, padding: 2, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar src={c.user?.logo} sx={{ backgroundColor: '#0073b1' }}>
                      {c.user?.nome?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          {c.user?.nome || 'Usuário Anônimo'}
                        </Typography>
                        {c.edited && (
                          <Typography variant="caption" color="textSecondary">
                            (editado)
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      editingCommentId === c.id ? (
                        <div>
                          <TextField
                            fullWidth
                            value={editedCommentText}
                            onChange={(e) => setEditedCommentText(e.target.value)}
                            sx={{ marginBottom: 2 }}
                          />
                          <Button variant="contained" onClick={() => handleSaveEdit(c.id)}>
                            Salvar
                          </Button>
                          <Button variant="outlined" onClick={() => setEditingCommentId(null)} sx={{ marginLeft: 2 }}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Typography sx={{ color: '#555' }}>
                          {c.comment}
                        </Typography>
                      )
                    }
                  />
                  {user?.id === c.user?.id && editingCommentId !== c.id && (
                    <Box>
                      <IconButton onClick={() => handleEditComment(c.id, c.comment)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteComment(c.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </ListItem>
                <Typography variant="caption" color="textSecondary" sx={{ ml: 7 }}>
                  {new Date(c.timestamp).toLocaleString('pt-PT')}
                </Typography>
              </Paper>
            ))}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary">
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </Typography>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default BlogDetalheDesk;