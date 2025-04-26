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
  useMediaQuery,
  ListItemIcon,
  Divider
} from '@mui/material';
import { Add, Close, Delete, Image as ImageIcon } from '@mui/icons-material';
import { EditorText, Provincias, SectorDeActividades } from '../../utils/formUtils';
import BackButton from '../BackButton';
import sendMessage from '../sms/sendMessage';
import sendEmail from '../sms/SendMail';
import { formatarMoeda } from '../../utils/utils';

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
  const [openProvinciaSelect, setOpenProvinciaSelect] = useState(false);
  const [selectedProvincias, setSelectedProvincias] = useState([]);
  const [provincias, setProvincias] = useState([]);

  useEffect(() => {
    const fetchSubsectores = async () => {
      if (!formData.sector) {
        setSubsectores([]);
        setFormData(prev => ({ ...prev, selectedSubsector: [] }));
        return;
      }
      const provinciasRef = ref(db, 'provincias');
      onValue(provinciasRef, (snapshot) => {
        const provinciasData = snapshot.val() || [];
        setProvincias(provinciasData);
    });
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

  const handleChangeInpt = (e) => {
    const input = e.target.value;
    const soNumeros = input.replace(/\D/g, ""); // Remove tudo que não for dígito
    const valor = Number(soNumeros) / 100; // Ex: 100000 => 1000.00

    setFormData((prev) => ({
      ...prev,
      maxProposals: valor,
    }));
  };
  const handleProvinciaChange = (event) => {
    const value = event.target.value;
    
    // Se selecionou "Todas"
    if (value.includes("all")) {
        if (selectedProvincias.length === provincias.length) {
            setSelectedProvincias([]);
        } else {
            setSelectedProvincias(provincias.map(p => p.provincia));
        }
        return;
    }
    
    setSelectedProvincias(value);
};

const handleCloseProvinciaSelect = () => {
    setOpenProvinciaSelect(false);
};

const handleOpenProvinciaSelect = () => {
    setOpenProvinciaSelect(true);
};
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
        company: {
          nome: user.nome,
          logoUrl:user.logoUrl,
          provincia: user.provincia,
          sector:user.sector,
          id:user.id, 
          distrito: user.distrito,
          morada: user.endereco,
          nuit:user.nuit || 'N/A', 
          contacto: user.contacto,
          email: user.email
        },
        timestamp: new Date().toISOString(),
        datalimite: new Date(formData.deadline).toISOString(),
        status: 'open',
        link: linkDoPedido,
        proposalLimit: formData.proposalLimit || null, 
      });

      setSnackbarMessage('Cotação publicada com sucesso!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);

      //window.location="/cotacoes"

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
            console.log(emails)
            await Promise.all(emails.map(email => sendEmail(email, mailMessage))); 
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
            <FormControl fullWidth margin="normal">
                    <InputLabel>Província(s)</InputLabel>
                    <Select
                        multiple
                        name="provincia"
                        value={selectedProvincias}
                        onChange={handleProvinciaChange}
                        onClose={handleCloseProvinciaSelect}
                        onOpen={handleOpenProvinciaSelect}
                        open={openProvinciaSelect}
                        label="Província(s)"
                        required
                        renderValue={(selected) => selected.join(', ')}
                    >
                        {/* Opção "Todas" */}
                        <MenuItem value="all">
                            <ListItemIcon>
                                <Checkbox
                                    checked={selectedProvincias.length === provincias.length}
                                    indeterminate={
                                        selectedProvincias.length > 0 && 
                                        selectedProvincias.length < provincias.length
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Todas as Províncias" />
                        </MenuItem>

                        {/* Opção "Fechar" */}
                        <MenuItem onClick={handleCloseProvinciaSelect}>
                            <ListItemIcon>
                                <Close fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Fechar" />
                        </MenuItem>

                        <Divider />

                        {/* Lista de províncias */}
                        {provincias.map((provinciaObj, index) => (
                            <MenuItem key={index} value={provinciaObj.provincia}>
                                <Checkbox checked={selectedProvincias.includes(provinciaObj.provincia)} />
                                <ListItemText primary={provinciaObj.provincia} />
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
                  value={formatarMoeda(formData.maxProposals)}
                  onChange={handleChangeInpt}
                  fullWidth
                  inputProps={{
                    min: 1
                  }}
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
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
      Itens da Cotação
    </Typography>
    <Button
      variant="contained"
      startIcon={<Add />}
      onClick={handleAddItem}
      size="small"
    >
      Adicionar Item
    </Button>
  </Box>

  {formData.items.length === 0 && (
    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
      Nenhum item adicionado ainda
    </Typography>
  )}

  {formData.items.map((item, index) => (
    <Paper 
      key={index} 
      sx={{ 
        p: 2, 
        mb: 2,
        position: 'relative',
        borderLeft: '3px solid',
        borderColor: 'primary.light',
        borderRadius: 1
      }}
    >
      {/* Botão de eliminar isolado no canto superior direito */}
      <Box sx={{ 
        position: 'absolute', 
        right: 8, 
        top: 8,
        zIndex: 1 
      }}>
        <IconButton
          color="error"
          onClick={() => handleRemoveItem(index)}
          size="small"
          sx={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>

      <Grid container spacing={2}>
        {/* Nome do Item */}
        <Grid item xs={12} sm={5}>
          <TextField
            label="Nome do Item"
            value={item.name}
            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
            fullWidth
            required
            size="small"
          />
        </Grid>

        {/* Quantidade */}
        <Grid item xs={6} sm={2}>
          <TextField
            label="Quantidade"
            type="number"
            value={item.qtd}
            onChange={(e) => handleItemChange(index, 'qtd', e.target.value.replace(/\D/g, ''))}
            fullWidth
            inputProps={{ min: 1 }}
            size="small"
          />
        </Grid>

        {/* Controle de Imagem */}
        <Grid item xs={12} sm={5}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<ImageIcon />}
              size="small"
              sx={{ flex: 1 }}
            >
              {item.imageUrl ? 'Alterar Imagem' : 'Adicionar Imagem'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleImageUpload(index, e.target.files[0])}
              />
            </Button>
            
            {item.imageUrl && (
              <IconButton
                color="error"
                onClick={() => handleItemChange(index, 'imageUrl', '')}
                size="small"
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Grid>

        {/* Descrição */}
        <Grid item xs={12}>
          <TextField
            label="Descrição"
            value={item.description}
            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
            fullWidth
            multiline
            rows={2}
            size="small"
          />
        </Grid>

        {/* Pré-visualização da Imagem */}
        {item.imageUrl && (
          <Grid item xs={12}>
            <Box sx={{ 
              mt: 1,
              p: 1,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              textAlign: 'center'
            }}>
              <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                Pré-visualização:
              </Typography>
              <img
                src={item.imageUrl}
                alt="Pré-visualização do item"
                style={{
                  maxWidth: '100%',
                  maxHeight: 150,
                  borderRadius: 4,
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            </Box>
          </Grid>
        )}
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