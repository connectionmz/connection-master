import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../fb';
import { ref, onValue, push, set, remove, update, get } from 'firebase/database';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ReportIcon from '@mui/icons-material/Report';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import BackButton from '../BackButton';

const PostDetailPageDesk = ({ user }) => {
  const { postId } = useParams();
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [post, setPost] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [denunciaModalOpen, setDenunciaModalOpen] = useState(false);
  const [motivoDenuncia, setMotivoDenuncia] = useState('');
  const isMobile = useMediaQuery('(max-width:600px)');

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

  const checkUserAuth = () => {
    if (!user || !user.id) {
      setSnackbar({ open: true, message: 'Você precisa estar logado para realizar esta ação', severity: 'error' });
      return false;
    }
    return true;
  };

  const handleAddComment = () => {
    if (!checkUserAuth()) return;
    
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
    if (!checkUserAuth()) return;
    
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
    if (!checkUserAuth()) return;
    setDenunciaModalOpen(true);
  };

  const handleDenunciar = () => {
    if (!checkUserAuth()) return;
    
    if (!motivoDenuncia.trim()) {
      setSnackbar({ open: true, message: 'Por favor, insira um motivo para a denúncia.', severity: 'error' });
      return;
    }
  
    const denunciaUsuarioRef = ref(db, `denuncias/posts/${postId}/${user.id}`);
  
    get(denunciaUsuarioRef).then((snapshot) => {
      if (snapshot.exists()) {
        setSnackbar({ open: true, message: 'Você já denunciou este post. Não é possível denunciar novamente.', severity: 'error' });
        setDenunciaModalOpen(false);
      } else {
        const novaDenunciaRef = push(denunciaUsuarioRef);
  
        set(novaDenunciaRef, {
          motivo: motivoDenuncia,
          timestamp: new Date().toISOString(),
          userId: user.id,
          postId: postId,
        })
          .then(() => {
            setSnackbar({ open: true, message: 'Denúncia enviada com sucesso!', severity: 'success' });
            setDenunciaModalOpen(false);
            setMotivoDenuncia('');
          })
          .catch((error) => {
            setSnackbar({ open: true, message: 'Erro ao enviar denúncia.', severity: 'error' });
            console.error('Erro ao enviar denúncia: ', error);
          });
      }
    }).catch((error) => {
      setSnackbar({ open: true, message: 'Erro ao verificar denúncia existente.', severity: 'error' });
      console.error('Erro ao verificar denúncia existente: ', error);
    });
  };

  const handleDeleteComment = (commentId) => {
    if (!checkUserAuth()) return;
    
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

  const handleEditComment = (commentId, currentText) => {
    if (!checkUserAuth()) return;
    
    setEditingCommentId(commentId);
    setEditedCommentText(currentText);
  };

  const handleSaveEdit = async (commentId) => {
    if (!checkUserAuth()) return;
    
    if (editedCommentText.trim()) {
      try {
        const commentRef = ref(db, `posts/${postId}/comments/${commentId}`);
        await update(commentRef, { comment: editedCommentText });
        setEditingCommentId(null);
        setEditedCommentText('');
        setSnackbar({ open: true, message: 'Comentário atualizado!', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Erro ao atualizar comentário.', severity: 'error' });
        console.error('Erro ao atualizar comentário: ', error);
      }
    }
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
        width: isMobile ? '100%' : '60%',
        margin: '0 auto',
        p: isMobile ? 1 : 2,
      }}
    >
      <BackButton sx={{ mb: 2 }} />
      {/* Post Card */}
      <Card sx={{ boxShadow: 3, mb: 2 }}>
        <CardMedia
          component="img"
          height={isMobile ? 250 : 400}
          image={post.url}
          alt={`Post ${post.id}`}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent>
          <Typography variant="h5" gutterBottom component="div">
            <div dangerouslySetInnerHTML={{ __html: post.description || '<p></p>' }} />
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
            justifyContent: isMobile ? 'space-between' : 'center',
            flexWrap: 'wrap',
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
            rows={isMobile ? 2 : 3}
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
                  wordBreak: 'break-word',
                }}
              >
                {editingCommentId === comment.id ? (
                  <div>
                    <TextField
                      fullWidth
                      value={editedCommentText}
                      onChange={(e) => setEditedCommentText(e.target.value)}
                      sx={{ marginBottom: 2 }}
                    />
                    <Button variant="contained" onClick={() => handleSaveEdit(comment.id)}>
                      Salvar
                    </Button>
                    <Button variant="outlined" onClick={() => setEditingCommentId(null)} sx={{ marginLeft: 2 }}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Typography variant="body1">{comment.comment}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Por: {comment.userName}
                    </Typography>
                    {(comment.userId === user?.id || post.companyId === user?.id) && (
                      <Box>
                        <IconButton
                          onClick={() => handleEditComment(comment.id, comment.comment)}
                          color="primary"
                          sx={{ mt: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteComment(comment.id)}
                          color="error"
                          sx={{ mt: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </div>
                )}
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal de Denúncia */}
      <Dialog open={denunciaModalOpen} onClose={() => setDenunciaModalOpen(false)}>
        <DialogTitle>Denunciar Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Motivo da Denúncia"
            value={motivoDenuncia}
            onChange={(e) => setMotivoDenuncia(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDenunciaModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleDenunciar} color="error">
            Denunciar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PostDetailPageDesk;