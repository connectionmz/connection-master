import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, push } from 'firebase/database';
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
} from '@mui/material';
import BackButton from '../BackButton';

const BlogDetalheDesk = () => {
  const { id } = useParams();
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [sending, setSending] = useState(false);

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
          setComments(Object.values(snapshot.val()));
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
        await push(newCommentRef, comment);
        setComments((prev) => [...prev, comment]);
        setComment('');
      } catch (err) {
        console.error('Erro ao enviar comentário:', err);
      } finally {
        setSending(false);
      }
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
    <Container maxWidth="md" sx={{ paddingY: 4, backgroundColor:'#FFF' }}>
    <BackButton sx={{ mb: 2 }} />
      {/* Título da Notícia */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        {noticia.title || 'Sem título'}
      </Typography>

      {/* Imagem da Notícia */}
      {noticia.imageURL && (
        <Box sx={{ marginBottom: 3 }}>
          <img
            src={noticia.imageURL}
            alt={noticia.title}
            style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
          />
        </Box>
      )}

      {/* Conteúdo da Notícia */}
      <Typography variant="body1" paragraph sx={{ color: '#555', lineHeight: 1.6 }}>
        {noticia.content || 'Sem conteúdo disponível.'}
      </Typography>

      {/* Informações Adicionais */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <Typography variant="caption" sx={{ color: '#777' }}>
          Publicado por: {noticia.company?.nome || 'Desconhecido'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#777' }}>
          Data: {noticia.date ? new Date(noticia.date).toLocaleDateString('pt-PT') : 'Data indisponível'}
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Seção de Comentários */}
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
          {comments.map((c, index) => (
            <Paper key={index} sx={{ marginBottom: 2, padding: 2, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar sx={{ backgroundColor: '#0073b1' }}>U</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 'bold' }}>Usuário Anônimo</Typography>}
                  secondary={<Typography sx={{ color: '#555' }}>{c}</Typography>}
                />
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
  );
};

export default BlogDetalheDesk;