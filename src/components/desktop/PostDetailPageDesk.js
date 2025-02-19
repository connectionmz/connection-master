import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../fb';
import { ref, onValue, push, set, remove } from 'firebase/database';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ReportIcon from '@mui/icons-material/Report';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import SendIcon from '@mui/icons-material/Send';
import BackButton from '../BackButton';

const PostDetailPageDesk = ({ user }) => {
  const { postId } = useParams();
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [post, setPost] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const isMobile = useMediaQuery('(max-width:600px)'); // Detecta dispositivos móveis

  useEffect(() => {
    const postsRef = ref(db, `posts/${postId}`);
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPost({
          id: postId,
          description: data.description || '',
          url: data.url || '',
          companyName: data.company?.name || 'Empresa Desconhecida',
          logoUrl: data.company?.logo || 'https://via.placeholder.com/150',
          companyId: data.company?.id,
        });
        setLikes(Object.keys(data.likes || {}).length || 0);
        setComments(Object.values(data.comments || {}));
      } else {
        setPost(null);
      }
    });
  }, [postId]);

  const handleAddComment = () => {
    if (commentText.trim()) {
      const commentRef = ref(db, `posts/${postId}/comments`);
      const newCommentRef = push(commentRef);
      const comment = {
        id: newCommentRef.key,
        userId: user.id,
        userName: user.nome,
        comment: commentText,
        data: new Date().toISOString(),
      };
      set(newCommentRef, comment)
        .then(() => {
          setCommentText('');
          setSnackbar({ open: true, message: 'Comentário adicionado!', severity: 'success' });
        })
        .catch((error) => {
          setSnackbar({ open: true, message: 'Erro ao adicionar comentário.', severity: 'error' });
          console.error('Erro ao adicionar comentário: ', error);
        });
    }
  };

  const handleLike = () => {
    const postRef = ref(db, `posts/${postId}/likes/${user.id}`);
    set(postRef, true)
      .then(() => {
        setSnackbar({ open: true, message: 'Curtido!', severity: 'success' });
      })
      .catch((error) => {
        setSnackbar({ open: true, message: 'Erro ao curtir.', severity: 'error' });
        console.error('Erro ao curtir: ', error);
      });
  };

  const handleShare = () => {
    // Implemente a lógica de compartilhamento aqui
  };

  const handleReport = () => {
    const postRef = ref(db, `posts/${postId}/reports/${user.id}`);
    set(postRef, true)
      .then(() => {
        setSnackbar({ open: true, message: 'Denúncia registrada!', severity: 'success' });
      })
      .catch((error) => {
        setSnackbar({ open: true, message: 'Erro ao denunciar.', severity: 'error' });
        console.error('Erro ao denunciar: ', error);
      });
  };

  const handleDeleteComment = (commentId) => {
    const commentRef = ref(db, `posts/${postId}/comments/${commentId}`);
    remove(commentRef)
      .then(() => {
        setSnackbar({ open: true, message: 'Comentário excluído!', severity: 'success' });
      })
      .catch((error) => {
        setSnackbar({ open: true, message: 'Erro ao excluir comentário.', severity: 'error' });
        console.error('Erro ao excluir comentário: ', error);
      });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!post) {
    return (
      <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
        Post não encontrado!
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        width: isMobile ? '100%' : '60%', // Ajusta a largura para dispositivos móveis
        margin: '0 auto',
        p: isMobile ? 1 : 2, // Ajusta o padding para mobile
      }}
    >
      <BackButton sx={{ mb: 2 }} />
      {/* Post Card */}
      <Card sx={{ boxShadow: 3, mb: 2 }}>
        <CardMedia
          component="img"
          height={isMobile ? 250 : 400} // Ajusta a altura da imagem para mobile
          image={post.url}
          alt={`Post ${post.id}`}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent>
          <Typography variant="h5" gutterBottom component="div">
            <div dangerouslySetInnerHTML={{ __html: post.description || '<p>Sem descrição</p>' }} />
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Publicado por:{' '}
            <a href={`/perfil/${post.companyId}`} style={{ color: 'blue' }}>
              {post.companyName}
            </a>
          </Typography>
        </CardContent>
        {/* Interaction Buttons */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            gap: 1,
            justifyContent: isMobile ? 'space-between' : 'center', // Ajusta o layout para mobile
            flexWrap: 'wrap', // Permite que os botões quebrem linha em mobile
          }}
        >
          <Button
            startIcon={<ThumbUpOutlinedIcon />}
            onClick={handleLike}
            variant="text"
            color="inherit"
            sx={{ textTransform: 'none', flex: 1 }}
          >
            Curtir ({likes})
          </Button>
          <Button
            startIcon={<ShareOutlinedIcon />}
            onClick={handleShare}
            variant="text"
            color="inherit"
            sx={{ textTransform: 'none', flex: 1 }}
          >
            Compartilhar
          </Button>
          <Button
            startIcon={<FlagOutlinedIcon />}
            onClick={handleReport}
            variant="text"
            color="inherit"
            sx={{ textTransform: 'none', flex: 1 }}
          >
            Denunciar
          </Button>
        </Box>
      </Card>

      {/* Comments Section */}
      <Card sx={{ boxShadow: 3, mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Comentários ({comments.length})
          </Typography>
          <TextField
            label="Escreva um comentário..."
            multiline
            rows={isMobile ? 2 : 3} // Ajusta o número de linhas para mobile
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleAddComment} color="primary">
                  <SendIcon />
                </IconButton>
              ),
            }}
          />
          <Divider sx={{ my: 2 }} />
          {comments.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
              Sem comentários ainda.
            </Typography>
          ) : (
            comments.map((comment, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 1,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  wordBreak: 'break-word', // Evita texto muito longo sem quebra
                }}
              >
                <Typography variant="body1">{comment.comment}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Por: {comment.userName}
                </Typography>
                {(comment.userId === user.id || post.companyId === user.id) && (
                  <IconButton
                    onClick={() => handleDeleteComment(comment.id)}
                    color="error"
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      {/* Snackbar for Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PostDetailPageDesk;