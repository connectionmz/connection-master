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
import { useLanguage } from '../../context/LanguageContext';

const MAX_DESCRIPTION_LENGTH = 2000;

const EditPostDialog = ({ 
  open, 
  onClose, 
  post, 
  onSave,
  user 
}) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const [description, setDescription] = useState(post?.description || '');
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
      setError(t('postEdit.descriptionRequired'));
      return;
    }

    // Verifica se o usuário tem permissão para editar
    if (user?.id !== post?.companyId) {
      setError(t('postDetail.permissionDenied'));
      return;
    }

    setLoading(true);
    
    try {
      const updatedAt = new Date().toISOString();
      const postRef = ref(db, `posts/${post.id}`);
      await update(postRef, {
        description,
        updatedAt
      });
      
      // Chama a função onSave com os dados atualizados
      onSave({
        ...post,
        description,
        updatedAt
      });
      
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar post:', err);
      setError(t('postEdit.saveError'));
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
        <Typography component="span" variant="h6">{t('postEdit.title')}</Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          aria-label={t('postEdit.close')}
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
          autoFocus
          fullWidth
          multiline
          minRows={6}
          label={t('postEdit.description')}
          placeholder={t('postEdit.placeholder')}
          value={description}
          onChange={(event) => setDescription(event.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
          disabled={loading}
          inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
          helperText={`${description.length}/${MAX_DESCRIPTION_LENGTH}`}
        />
 
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
          {t('postDetail.cancel')}
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
          }}>
          {loading ? t('postEdit.saving') : t('postEdit.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditPostDialog;
