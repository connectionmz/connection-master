import React, { useEffect, useState } from 'react';
import { onValue, ref, update } from 'firebase/database';
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
  FormHelperText,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Delete, Image as ImageIcon } from '@mui/icons-material';
import { EditorText, Provincias, SectorDeActividades } from '../../utils/formUtils';

const EditarCotacao = ({ cotacao, user, onClose, onSuccess, onError }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    items: [],
    deadline: '',
    maxProposals: '',
    proposalLimit: '',
    sector: '',
    provincia: [],
    selectedSubsector: [],
  });
  
  const [subsectores, setSubsectores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [proposalLimitError, setProposalLimitError] = useState('');

  const provinciasList = [
    'Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zambézia', 
    'Nampula', 'Cabo Delgado', 'Niassa'
  ];

  // Inicializa o formulário com os dados da cotação
  useEffect(() => {
    if (cotacao) {
      setFormData({
        title: cotacao.title || '',
        description: cotacao.description || '',
        items: cotacao.items || [],
        deadline: cotacao.datalimite ? new Date(cotacao.datalimite).toISOString().slice(0, 16) : '',
        maxProposals: cotacao.maxProposals || '',
        proposalLimit: cotacao.proposalLimit || '',
        sector: cotacao.sector || '',
        provincia: cotacao.provincia || [],
        selectedSubsector: cotacao.selectedSubsector || [],
      });
    }
  }, [cotacao]);

  useEffect(() => {
    const fetchSubsectores = async () => {
      if (!formData.sector) {
        setSubsectores([]);
        setFormData(prev => ({ ...prev, selectedSubsector: [] }));
        return;
      }
  
      const sectorRef = ref(db, `sectores_de_atividade`);
      onValue(sectorRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const sectorData = Object.values(data).find((s) => s.setor === formData.sector);
          setSubsectores(sectorData?.subsectores || []);
        } else {
          setSubsectores([]);
        }
      });
    };
  
    fetchSubsectores();
  }, [formData.sector]);

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
    let isValid = true;
    
    if (!formData.title || !formData.description || !formData.sector || !formData.deadline) {
      setSnackbarMessage('Preencha todos os campos obrigatórios.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      isValid = false;
    }
    
    if (new Date(formData.deadline) <= new Date()) {
      setSnackbarMessage('A data deve ser superior à data atual.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      isValid = false;
    }
    
    if (formData.proposalLimit && (isNaN(formData.proposalLimit) || formData.proposalLimit < 1)) {
      setProposalLimitError('O limite deve ser um número maior que zero');
      isValid = false;
    } else {
      setProposalLimitError('');
    }
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSnackbarMessage('');

    try {
      const cotacaoRef = ref(db, `cotacoes/${cotacao.id}`);
      
      await update(cotacaoRef, {
        ...formData,
        datalimite: new Date(formData.deadline).toISOString(),
        updatedAt: new Date().toISOString(),
        proposalLimit: formData.proposalLimit || null,
      });

      setSnackbarMessage('Cotação atualizada com sucesso!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar a cotação:', error);
      setSnackbarMessage('Erro ao atualizar a cotação. Tente novamente.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      if (onError) onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          Editar Cotação
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        <form onSubmit={handleSubmit}>
          {/* Seção de Informações Básicas */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
              Informações Básicas
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Título da Cotação"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Data Limite"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={formData.deadline && new Date(formData.deadline) <= new Date()}
                  helperText={formData.deadline && new Date(formData.deadline) <= new Date() ? 'A data deve ser superior à data atual.' : ''}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <EditorText
                  description={formData.description}
                  setDescription={(value) => setFormData(prev => ({ ...prev, description: value }))}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Seção de Setor e Localização */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
              Setor e Localização
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SectorDeActividades
                  companyData={{ sector: formData.sector }}
                  handleChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Subsectores</InputLabel>
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
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Províncias</InputLabel>
                  <Select
                    multiple
                    value={formData.provincia}
                    onChange={(e) => setFormData(prev => ({ ...prev, provincia: e.target.value }))}
                    renderValue={(selected) => selected.join(', ')}
                    label="Províncias"
                  >
                    {provinciasList.map((prov) => (
                      <MenuItem key={prov} value={prov}>
                        <Checkbox checked={formData.provincia.includes(prov)} />
                        <ListItemText primary={prov} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Seção de Configurações Avançadas */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
              Propostas e Limites
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Valor Máximo de Propostas (MT)"
                  type="number"
                  value={formData.maxProposals}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxProposals: e.target.value }))}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Limite de Propostas"
                  type="number"
                  value={formData.proposalLimit}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, proposalLimit: value }));
                    
                    if (value && (isNaN(value) || value < 1)) {
                      setProposalLimitError('O limite deve ser um número maior que zero');
                    } else {
                      setProposalLimitError('');
                    }
                  }}
                  fullWidth
                  inputProps={{ min: 1 }}
                  error={!!proposalLimitError}
                  helperText={proposalLimitError || "Número máximo de propostas a serem aceitas"}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Seção de Itens */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Itens da Cotação
              </Typography>
              <Button
                variant="outlined"
                onClick={handleAddItem}
              >
                Adicionar Item
              </Button>
            </Box>
            
            {formData.items.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Nenhum item adicionado ainda
              </Typography>
            )}
            
            {formData.items.map((item, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2, position: 'relative' }}>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveItem(index)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <Delete />
                </IconButton>
                
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
                  
                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="Quantidade"
                      type="number"
                      value={item.qtd}
                      onChange={(e) => handleItemChange(index, 'qtd', e.target.value.replace(/\D/g, ''))}
                      fullWidth
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Descrição"
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
                      Imagem
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
                        style={{ 
                          width: '100%', 
                          marginTop: 10, 
                          borderRadius: 5,
                          maxHeight: 100,
                          objectFit: 'contain'
                        }}
                      />
                    )}
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Paper>
        </form>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Atualizar Cotação'}
        </Button>
      </DialogActions>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default EditarCotacao;