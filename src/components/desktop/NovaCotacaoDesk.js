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
  FormHelperText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Add, Delete, Image as ImageIcon } from '@mui/icons-material';
import { EditorText, Provincias, SectorDeActividades } from '../../utils/formUtils';
import BackButton from '../BackButton';
import sendMessage from '../sms/sendMessage';
import sendEmail from '../sms/SendMail';

const NovaCotacao = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    items: [],
    deadline: '',
    maxProposals: '',
    proposalLimit: '', // Novo campo para limite de propostas
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
    'Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zambézia', 'Nampula', 'Cabo Delgado', 'Niassa'
  ];

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
          setFormData(prev => ({ ...prev, selectedSubsector: [] }));
        } else {
          setSubsectores([]);
          setFormData(prev => ({ ...prev, selectedSubsector: [] }));
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
    
    // Validação do limite de propostas
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
        proposalLimit: formData.proposalLimit || null, // Inclui o limite de propostas
      });

      setSnackbarMessage('Cotação publicada com sucesso!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);

      //window.location="/cotacoes"

      // Envio de notificações para empresas do setor
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
            await Promise.all(emails.map(email => sendEmail(email, mailMessage))); // Note que agora passamos 'email' em vez de 'emails'
          }
        }
      }

      // Reset do formulário

       setFormData({
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
    <Box sx={{ p: isMobile ? 2 : 3, backgroundColor: 'white', maxWidth: 1200, mx: 'auto' }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Novo Pedido de Cotação
      </Typography>
      
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
                helperText="Ex: Cotação para material de construção"
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
                inputStyles="w-full px-3 py-2 border rounded"
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
                helperText="Defina o valor máximo que está disposto a pagar"
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
                  
                  // Validação em tempo real
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
                required
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
              startIcon={<Add />}
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

        {/* Botão de Envio */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ 
              minWidth: 200,
              position: 'relative',
              fontWeight: 'bold'
            }}
          >
            {loading ? (
              <>
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
                Publicando...
              </>
            ) : (
              'Publicar Cotação'
            )}
          </Button>
        </Box>
      </form>
      
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
    </Box>
  );
};

export default NovaCotacao;