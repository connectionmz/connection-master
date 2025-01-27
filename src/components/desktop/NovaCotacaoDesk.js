import React, { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { db } from '../../fb';
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Delete, Image as ImageIcon } from '@mui/icons-material';
import { EditorText, SectorDeActividades } from '../../utils/formUtils';
import BackButton from '../BackButton';

const NovaCotacao = ({ user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [maxProposals, setMaxProposals] = useState('');
  const [sector, setSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleAddItem = () => {
    setItems([...items, { name: '', description: '', imageUrl: '' }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleImageUpload = (index, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newItems = [...items];
      newItems[index].imageUrl = reader.result;
      setItems(newItems);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSnackbarMessage('');

    const currentDate = new Date();
    const selectedDate = new Date(deadline);

    if (!deadline || selectedDate <= currentDate) {
      setSnackbarMessage('A data limite deve ser superior à data atual.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setLoading(false);
      return;
    }

    if (!maxProposals || parseInt(maxProposals, 10) <= 0) {
      setSnackbarMessage('Defina um valor máximo válido para as propostas.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      setLoading(false);
      return;
    }

    try {
      const cotacaoRef = ref(db, 'cotacoes');
      const newCotacaoRef = push(cotacaoRef);
      const cotacaoId = newCotacaoRef.key;

      const linkDoPedido = `http://appconnectionmozambique.com/cotacao/${cotacaoId}`;

      await set(ref(db, `cotacoes/${cotacaoId}`), {
        title,
        description,
        id: cotacaoId,
        userId: user.id,
        items,
        company: {
          nome: user.nome,
          id: user.id,
          logoUrl: user.logoUrl,
          sigla: user.sigla,
          provincia: user.provincia,
          distrito: user.distrito,
        },
        sector,
        maxProposals: parseInt(maxProposals, 10),
        timestamp: new Date().toISOString(),
        datalimite: selectedDate.toISOString(),
        status: 'open',
        link: linkDoPedido,
      });

      setSnackbarMessage('Cotação criada com sucesso!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);

      setTitle('');
      setDescription('');
      setItems([]);
      setSector('');
      setDeadline('');
      setMaxProposals('');
    } catch (error) {
      setSnackbarMessage('Erro ao criar cotação. Tente novamente.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      console.error('Erro ao criar cotação:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Nova Cotação
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <EditorText
            description={description}
            setDescription={setDescription}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <SectorDeActividades
            companyData={{ sector }}
            handleChange={(e) => setSector(e.target.value)}
            inputStyles="w-full px-3 py-2 border rounded"
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Data Limite"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            error={deadline && new Date(deadline) <= new Date()}
            helperText={
              deadline && new Date(deadline) <= new Date()
                ? 'A data deve ser superior à data atual.'
                : ''
            }
            required
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Valor Máximo de Propostas"
            type="number"
            value={maxProposals}
            onChange={(e) => setMaxProposals(e.target.value)}
            fullWidth
            required
            inputProps={{ min: 1 }}
            helperText="Defina o número máximo de propostas que podem ser recebidas."
          />
        </Box>
        <Typography variant="h6" gutterBottom>
          Itens
        </Typography>
        {items.map((item, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Nome do Item"
                  value={item.name}
                  onChange={(e) =>
                    handleItemChange(index, 'name', e.target.value)
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Descrição do Item"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, 'description', e.target.value)
                  }
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<ImageIcon />}
                  fullWidth
                >
                  Adicionar Imagem
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(index, e.target.files[0])
                    }
                  />
                </Button>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt="Pré-visualização"
                    style={{
                      width: '100%',
                      marginTop: 10,
                      borderRadius: 5,
                    }}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={2}>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={handleAddItem}
          sx={{ mb: 2 }}
        >
          Adicionar Item
        </Button>
        <Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ position: 'relative' }}
          >
            {loading && (
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
            {loading ? 'Enviando...' : 'Criar Cotação'}
          </Button>
        </Box>
      </form>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            backgroundColor:
              snackbarSeverity === 'error' ? '#f44336' : '#4caf50',
            color: '#fff',
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NovaCotacao;
