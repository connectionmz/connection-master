import React, { useState } from 'react';
import { ref, push, set, get, query, orderByChild, equalTo } from 'firebase/database';
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
import { EditorText, Provincias, SectorDeActividades } from '../../utils/formUtils';
import BackButton from '../BackButton';
import sendMessage from '../sms/sendMessage';

const NovaCotacao = ({ user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [maxProposals, setMaxProposals] = useState('');
  const [sector, setSector] = useState('');
  const [provincia, setProvincia] = useState('');
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleAddItem = () => {
    setItems([...items, { name: '', description: '', qtd: '', imageUrl: '' }]);
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

  if (!user) {
    setSnackbarMessage('Por favor, recarregue a página e tente novamente.');
    setSnackbarSeverity('error');
    setOpenSnackbar(true);
    setLoading(false);
    return;
  }

  try {
    const cotacoesRef = ref(db, 'cotacoes');
 

    // Referência ao banco de dados
    const newCotacaoRef = push(cotacoesRef);
    const cotacaoId = newCotacaoRef.key;

    const linkDoPedido = `http://app.connectionmozambique.com/cotacao/${cotacaoId}`;

    // Publicar a cotação no banco de dados
    await set(ref(db, `cotacoes/${cotacaoId}`), {
      title: title.trim(),
      description: description.trim(),
      id: cotacaoId,
      items,
      company: user,
      sector: sector.trim(),
      provincia: provincia.trim(),
      timestamp: new Date().toISOString(),
      datalimite: new Date(deadline).toISOString(),
      status: 'open',
      link: linkDoPedido,
    });

    // Exibir mensagem de sucesso
    setSnackbarMessage('Cotação publicada com sucesso!');
    setSnackbarSeverity('success');
    setOpenSnackbar(true);

    // Buscar empresas do setor
    const empresasRef = ref(db, 'company');
    const setorQuery = query(empresasRef, orderByChild('sector'), equalTo(sector.trim()));
    const empresasSnapshot = await get(setorQuery);

    if (empresasSnapshot.exists()) {
      const empresas = empresasSnapshot.val();

      for (const key in empresas) {
        const empresa = empresas[key];

        if (!empresa.contacto) {
          console.warn(`Empresa ${key} não possui contato. Ignorando...`);
          continue;
        }

        const message = `
          Título: ${title}
          Descrição: ${description}
          Data Limite: ${deadline}
          Setor de Atividade: ${sector}
          Acesse: ${linkDoPedido}
        `.trim();

        const cleanMessage = message.replace(/<\/?[^>]+(>|$)/g, "");
        const finalMessage = cleanMessage.replace(/\n/g, ' ').replace(/\t/g, ' ');

        const contatos = Array.isArray(empresa.contacto) ? empresa.contacto : [empresa.contacto];

        await sendMessage(contatos, finalMessage);

        setTitle('')
        setDescription('')
        setDeadline('')
        setItems([])
        setMaxProposals()

        window.location.reload()

      }
    } else {
      console.log('Nenhuma empresa encontrada para este setor.');
    }
  } catch (error) {
    // Tratamento de erros
    console.error('Erro ao publicar a cotação:', error.message);
    setSnackbarMessage('Erro ao publicar a cotação. Tente novamente.');
    setSnackbarSeverity('error');
    setOpenSnackbar(true);
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
        Novo Pedido de Cotação
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
          <Provincias
            companyData={{ provincia }}
            handleChange={(e) => setProvincia(e.target.value)}
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
                  label="Qtd do Item"
                  type="number"
                  value={item.qtd}
                  onChange={(e) =>
                    handleItemChange(index, 'qtd', e.target.value.replace(/\D/g, ''))
                  }
                  fullWidth
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
            {loading ? 'Enviando...' : 'Enviar'}
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
