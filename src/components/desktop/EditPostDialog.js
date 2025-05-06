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
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Inicializa o estado quando o post ou a abertura do dialog mudar
  useEffect(() => {
    if (open && post) {
      setDescription(post.description || '');
      setError('');
    }
  }, [open, post]);

  const handleSave = async () => {
    if (!description.trim()) {
      setError('A descrição não pode estar vazia');
      return;
    }

    // Verifica se o usuário tem permissão para editar
    if (user?.id !== post?.companyId) {
      setError('Você não tem permissão para editar esta publicação');
      return;
    }

    setLoading(true);
    
    try {
      const postRef = ref(db, `posts/${post.id}`);
      await update(postRef, {
        description,
        updatedAt: new Date().toISOString()
      });
      
      // Chama a função onSave com os dados atualizados
      onSave({
        ...post,
        description,
        updatedAt: new Date().toISOString()
      });
      
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar post:', err);
      setError('Ocorreu um erro ao atualizar o post. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Não renderiza se não houver post ou se o usuário não for o dono
  if (!post || !open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
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
        alignItems: 'center',
        py: 2
      }}>
        <Typography variant="h6">Editar Publicação</Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={onClose}
          disabled={loading}
          sx={{ p: 0.5 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ py: 3, px: 3 }}>
        {error && (
          <Box sx={{ 
            backgroundColor: theme.palette.error.light,
            color: theme.palette.error.dark,
            p: 2,
            mb: 3,
            borderRadius: 1
          }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
        
        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={12}
          variant="outlined"
          label="Descrição da publicação"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError(''); // Limpa o erro quando o usuário começa a digitar
          }}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '1rem',
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
              }
            }
          }}
        />
        
        <Box sx={{ mt: 2 }}>
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
          sx={{ 
            borderRadius: 2,
            minWidth: 100,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={loading || !description.trim()}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
          sx={{ 
            borderRadius: 2,
            minWidth: 180,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPostDialog;