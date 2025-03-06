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
  const [editingCommentId, setEditingCommentId] = useState(null); // ID do comentário sendo editado
  const [editedCommentText, setEditedCommentText] = useState(''); // Texto do comentário sendo editado

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
          // Transforma os comentários em um array com IDs
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
        };
        await push(newCommentRef, newComment);
        setComment('');
        // Recarrega os comentários após adicionar um novo
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
        console.error('Erro ao enviar comentário:', err);
      } finally {
        setSending(false);
      }
    }
  };

  const handleEditComment = (commentId, currentText) => {
    setEditingCommentId(commentId); // Define o comentário sendo editado
    setEditedCommentText(currentText); // Preenche o campo de edição com o texto atual
  };

  const handleSaveEdit = async (commentId) => {
    if (editedCommentText.trim()) {
      try {
        const commentRef = ref(db, `blogPost/${id}/comments/${commentId}`);
        await update(commentRef, { comment: editedCommentText }); // Atualiza o texto do comentário
        setEditingCommentId(null); // Sai do modo de edição
        setEditedCommentText(''); // Limpa o campo de edição
        // Recarrega os comentários após a edição
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
        console.error('Erro ao editar comentário:', err);
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const commentRef = ref(db, `blogPost/${id}/comments/${commentId}`);
      await remove(commentRef); // Remove o comentário do banco de dados
      // Recarrega os comentários após a exclusão
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
      console.error('Erro ao eliminar comentário:', err);
    }
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
        {noticia.content || 'Sem conteúdo disponível.'}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <Typography variant="caption" sx={{ color: '#777' }}>
          Publicado por: {noticia.company?.nome || 'Desconhecido'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#777' }}>
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
          placeholder="Escreva seu comentário..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          multiline
          rows={3}
          sx={{ marginBottom: 2 }}
          disabled={sending}
        />
        <Button
          variant="contained"
          onClick={handleCommentSubmit}
          disabled={sending || !comment.trim()}
          sx={{ backgroundColor: '#0073b1', '&:hover': { backgroundColor: '#005f8e' } }}
        >
          {sending ? 'Enviando...' : 'Enviar'}
        </Button>
      </Box>

      {/* Lista de Comentários */}
      {comments.length > 0 ? (
        <List>
          {comments.map((c) => (
            <Paper key={c.id} sx={{ marginBottom: 2, padding: 2, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar src={c.user?.logo} sx={{ backgroundColor: '#0073b1' }}>
                    {c.user?.nome?.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: 'bold' }}>
                      {c.user?.nome || 'Usuário Anônimo'}
                    </Typography>
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
                {c.user?.id === user.id && editingCommentId !== c.id && (
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
            </Paper>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary">
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </Typography>
      )}
    </Container>
  )
}

export default BlogDetalheDesk;