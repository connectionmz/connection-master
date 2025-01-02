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
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { SectorDeActividades } from '../../utils/formUtils';

const NovaCotacao = ({ user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([]);
  const [deadline, setDeadline] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cotacaoRef = ref(db, 'cotacoes');
      const newCotacaoRef = push(cotacaoRef);
      const cotacaoId = newCotacaoRef.key;

      const linkDoPedido = `http://appconnectionmozambique.com/cotacao/${cotacaoId}`;

      await set(ref(db, `cotacoes/${cotacaoId}`), {
        title,
        description,
        id: cotacaoId,
        items,
        company: user,
        sector,
        timestamp: new Date().toISOString(),
        datalimite: new Date(deadline).toISOString(),
        status: 'open',
        link: linkDoPedido,
      });

      setSnackbarMessage('Cotação criada com sucesso!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);

      // Reset form
      setTitle('');
      setDescription('');
      setItems([]);
      setSector('');
      setDeadline('');
    } catch (error) {
      setSnackbarMessage('Erro ao criar cotação. Tente novamente.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      console.error('Erro ao criar cotação:', error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSectorChange = (e) => {
    setSector(e.target.value);
};
  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ p: 3 }}>
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
          <TextField
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={4}
            required
          />
        </Box>
        <Box sx={{ mb: 2 }}>
        <SectorDeActividades 
                        companyData={{ sector }} 
                        handleChange={handleSectorChange} 
                        inputStyles="w-full px-3 py-2 border rounded"/>
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
            required
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
              <Grid item xs={12} sm={6}>
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
          >
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
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NovaCotacao;
