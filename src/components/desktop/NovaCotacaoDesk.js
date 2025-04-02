import React, { useEffect, useState } from 'react';
import { ref, push, set, get, query, orderByChild, equalTo, onValue } from 'firebase/database';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Add, Delete, Image as ImageIcon } from '@mui/icons-material';
import { EditorText, Provincias, SectorDeActividades } from '../../utils/formUtils';
import BackButton from '../BackButton';
import sendMessage from '../sms/sendMessage';
import sendEmail from '../sms/SendMail';

const NovaCotacao = ({ user }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    items: [],
    deadline: '',
    maxProposals: '',
    sector: '',
    provincia: [],
    selectedSubsector: [],
  });
  const [subsectores, setSubsectores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const provinciasList = [
    'Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zambézia', 'Nampula', 'Cabo Delgado', 'Niassa'
  ];

  useEffect(() => {
    const fetchSubsectores = async () => {
      if (!formData.sector) {
        setSubsectores([]); // Limpa os subsetores se não houver setor selecionado
        setFormData(prev => ({ ...prev, selectedSubsector: [] })); // Reseta os subsetores selecionados
        return;
      }
  
      const sectorRef = ref(db, `sectores_de_atividade`);
      onValue(sectorRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const sectorData = Object.values(data).find((s) => s.setor === formData.sector);
          setSubsectores(sectorData?.subsectores || []);
          setFormData(prev => ({ ...prev, selectedSubsector: [] })); // Reseta os subsetores selecionados
        } else {
          setSubsectores([]); // Limpa os subsetores se não houver dados
          setFormData(prev => ({ ...prev, selectedSubsector: [] })); // Reseta os subsetores selecionados
        }
      });
    };
  
    fetchSubsectores();
  }, [formData.sector]); // Executa sempre que o setor mudar

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', description: '', qtd: '', imageUrl: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleImageUpload = (index, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newItems = [...formData.items];
      newItems[index].imageUrl = reader.result;
      setFormData(prev => ({ ...prev, items: newItems }));
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.title || !formData.description || !formData.sector || !formData.deadline) {
      setSnackbarMessage('Preencha todos os campos obrigatórios.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }
    if (new Date(formData.deadline) <= new Date()) {
      setSnackbarMessage('A data deve ser superior à data atual.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSnackbarMessage('');

    try {
      const cotacoesRef = ref(db, 'cotacoes');
      const newCotacaoRef = push(cotacoesRef);
      const cotacaoId = newCotacaoRef.key;
      const linkDoPedido = `https://app.connectionmozambique.com/cotacao/${cotacaoId}`;

      await set(ref(db, `cotacoes/${cotacaoId}`), {
        ...formData,
        id: cotacaoId,
        company: user,
        timestamp: new Date().toISOString(),
        datalimite: new Date(formData.deadline).toISOString(),
        status: 'open',
        link: linkDoPedido,
      });

      setSnackbarMessage('Cotação publicada com sucesso!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);

      const empresasRef = ref(db, 'company');
      const setorQuery = query(empresasRef, orderByChild('sector'), equalTo(formData.sector.trim()));
      const empresasSnapshot = await get(setorQuery);

      if (empresasSnapshot.exists()) {
        const empresas = empresasSnapshot.val();

        for (const key in empresas) {
          const empresa = empresas[key];
          if (!empresa.contacto && !empresa.email) continue;

          const message = `Título: ${formData.title}\nDescrição: ${formData.description}\nData Limite: ${formData.deadline}\nSetor de Atividade: ${formData.sector}\nAcesse: ${linkDoPedido}`;
          
          const mailMessage = {
            title: formData.title,
            description: formData.description.replace(/<\/?[^>]+(>|$)/g, ""),
            deadline: formData.deadline,
            sector: formData.sector,
            link: linkDoPedido
          };

          if (empresa.email) {
            const emails = Array.isArray(empresa.email) ? empresa.email : [empresa.email];
            await Promise.all(emails.map(email => sendEmail(emails, mailMessage)));
          }
        }
      }

      setFormData({
        title: '',
        description: '',
        items: [],
        deadline: '',
        maxProposals: '',
        sector: '',
        provincia: [],
        selectedSubsector: [],
      });
    } catch (error) {
      console.error('Erro ao publicar a cotação:', error);
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
    <Box sx={{ p: 3, backgroundColor: 'white' }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Novo Pedido de Cotação
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            fullWidth
            required
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <EditorText
            description={formData.description}
            setDescription={(value) => setFormData(prev => ({ ...prev, description: value }))}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <SectorDeActividades
            companyData={{ sector: formData.sector }}
            handleChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
            inputStyles="w-full px-3 py-2 border rounded"
          />
        </Box>
        <Box sx={{ mb: 2 }}>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Subsectores para Receber SMS</InputLabel>
          <Select
            multiple
            value={formData.selectedSubsector}
            onChange={(e) => setFormData(prev => ({ ...prev, selectedSubsector: e.target.value }))}
            label="Subsectores"
            renderValue={(selected) => selected.join(', ')}
          >
            {subsectores.map((subsector) => (
              <MenuItem key={subsector} value={subsector}>
                <Checkbox checked={formData.selectedSubsector.includes(subsector)} />
                <ListItemText primary={subsector} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </Box>
       
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Províncias</InputLabel>
            <Select
              multiple
              value={formData.provincia}
              onChange={(e) => setFormData(prev => ({ ...prev, provincia: e.target.value }))}
              renderValue={(selected) => selected.join(', ')}
            >
              {provinciasList.map((prov) => (
                <MenuItem key={prov} value={prov}>
                  <Checkbox checked={formData.provincia.includes(prov)} />
                  <ListItemText primary={prov} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Data Limite"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
            error={formData.deadline && new Date(formData.deadline) <= new Date()}
            helperText={formData.deadline && new Date(formData.deadline) <= new Date() ? 'A data deve ser superior à data atual.' : ''}
            required
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Valor Máximo de Propostas"
            type="number"
            value={formData.maxProposals}
            onChange={(e) => setFormData(prev => ({ ...prev, maxProposals: e.target.value }))}
            fullWidth
            inputProps={{ min: 1 }}
            helperText="Defina o número máximo de propostas que podem ser recebidas."
          />
        </Box>
        <Typography variant="h6" gutterBottom>
          Itens
        </Typography>
        {formData.items.map((item, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Nome do Item"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Qtd do Item"
                  type="number"
                  value={item.qtd}
                  onChange={(e) => handleItemChange(index, 'qtd', e.target.value.replace(/\D/g, ''))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Descrição do Item"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
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
                    onChange={(e) => handleImageUpload(index, e.target.files[0])}
                  />
                </Button>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt="Pré-visualização"
                    style={{ width: '100%', marginTop: 10, borderRadius: 5 }}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={2}>
                <IconButton color="error" onClick={() => handleRemoveItem(index)}>
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
            backgroundColor: snackbarSeverity === 'error' ? '#f44336' : '#4caf50',
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