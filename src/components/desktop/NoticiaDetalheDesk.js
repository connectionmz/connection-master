import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, push } from 'firebase/database';
import { db } from '../../fb';
import { Container, Typography, TextField, Button, CircularProgress, Alert, Divider, Box } from '@mui/material';
import BackButton from '../BackButton';

const NoticiaDetalheDesk = () => {
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
        const newCommentRef = ref(db, `publicAnnouncements/${id}/comments`);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </div>
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
      <Typography variant="h4" gutterBottom>
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
      <Typography variant="body1" paragraph>
        <div dangerouslySetInnerHTML={{ __html: noticia.content || 'Sem conteúdo disponível.' }} />
      </Typography>
      <Typography variant="caption" display="block" gutterBottom>
        Publicado por: <a href={`/perfil/${noticia.company?.id}`}>{noticia.company?.nome || 'Desconhecido'}</a>
      </Typography>
      <Typography variant="caption" display="block" gutterBottom>
        Data: {noticia.date ? new Date(noticia.date).toLocaleDateString('pt-PT') : 'Data indisponível'}
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Comentários
      </Typography>
      <TextField
        fullWidth
        placeholder="Escreva seu comentário..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ marginBottom: 2 }}
        disabled={sending}
      />
      <Button variant="contained" onClick={handleCommentSubmit} disabled={sending || !comment.trim()}>
        {sending ? 'Enviando...' : 'Enviar'}
      </Button>

      <div style={{ marginTop: 20 }}>
        {comments.length > 0 ? (
          comments.map((c, index) => (
            <Typography key={index} variant="body2" paragraph>
              {c}
            </Typography>
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </Typography>
        )}
      </div>
    </Container>
  )
}

export default NoticiaDetalheDesk;
