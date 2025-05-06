import React, { useState, useEffect } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../../fb';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  IconButton,
  Box,
  Typography,
  useTheme
} from '@mui/material';
import { Close as CloseIcon, Check as CheckIcon } from '@mui/icons-material';

const EditPostDialog = ({ 
  open, 
  onClose, 
  post, 
  onSave,
  user 
}) => {
  const theme = useTheme();
  const [description, setDescription] = useState(post?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (post) {
      setDescription(post.description || '');
    }
  }, [post]);

  const handleSave = async () => {
    if (!description.trim()) {
      setError('A descrição não pode estar vazia');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const postRef = ref(db, `posts/${post.id}`);
      await update(postRef, {
        description,
        updatedAt: new Date().toISOString()
      });
      
      onSave({
        ...post,
        description,
        updatedAt: new Date().toISOString()
      });
      
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar post:', err);
      setError('Ocorreu um erro ao atualizar o post');
    } finally {
      setLoading(false);
    }
  };

  if (!post || post.userId !== user?.id) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">Editar Publicação</Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={onClose}
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ py: 3 }}>
        {error && (
          <Box sx={{ 
            backgroundColor: theme.palette.error.light,
            color: theme.palette.error.dark,
            p: 2,
            mb: 2,
            borderRadius: 1
          }}>
            <Typography>{error}</Typography>
          </Box>
        )}
        
        <TextField
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          label="Descrição da publicação"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '1rem'
            }
          }}
        />
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Dica: Você pode usar formatação básica como negrito (**texto**), itálico (*texto*) e links
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
          sx={{ borderRadius: 2 }}
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPostDialog;