import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../../fb';
import { Container, Typography, TextField, Button, CircularProgress, Alert } from '@mui/material';

const NoticiaDetalheDesk = () => {
  const { id } = useParams();
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

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

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      setComments((prev) => [...prev, comment]);
      setComment('');
    }
  };

  useEffect(() => {
    fetchNoticia();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
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
    <Container maxWidth="md" sx={{ paddingY: 4 }}>
      <Typography variant="h4" gutterBottom>
        {noticia.title || 'Sem título'}
      </Typography>
      <Typography variant="body1" paragraph>
        {noticia.content || 'Sem conteúdo disponível.'}
      </Typography>
      <Typography variant="caption" display="block" gutterBottom>
        Publicado por: {noticia.company?.nome || 'Desconhecido'}
      </Typography>
      <Typography variant="caption" display="block" gutterBottom>
        Data: {new Date(noticia.date).toLocaleDateString('pt-PT')}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Comentários
      </Typography>
      <TextField
        fullWidth
        placeholder="Escreva seu comentário..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ marginBottom: 2 }}
      />
      <Button variant="contained" onClick={handleCommentSubmit}>
        Enviar
      </Button>
      <div style={{ marginTop: 20 }}>
        {comments.map((c, index) => (
          <Typography key={index} variant="body2" paragraph>
            {c}
          </Typography>
        ))}
      </div>
    </Container>
  );
};

export default NoticiaDetalheDesk;
