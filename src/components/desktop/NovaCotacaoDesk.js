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
import {sendEmail} from '../sms/SendMail';
import { formatarMoeda, formatCurrency } from '../../utils/utils';
import { filterActiveModules } from '../../context/ActiveModulesContext';

const NovaCotacao = ({ user }) => {
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
  const [openProvinciaSelect, setOpenProvinciaSelect] = useState(false);
  const [openSubsectorSelect, setOpenSubsectorSelect] = useState(false);
  const [selectedProvincias, setSelectedProvincias] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [openSectorSelect, setOpenSectorSelect] = useState(false);

  useEffect(() => {
    const fetchSectores = async () => {
      const sectorRef = ref(db, 'sectores_de_atividade');
      onValue(sectorRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const sectoresData = Object.values(data).map(item => item.setor);
          setSectores(sectoresData);
        }
      });
    };

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
          const validSubsectores = (sectorData?.subsectores || []).filter(s => s);
          setSubsectores(validSubsectores);
          setFormData(prev => ({ 
            ...prev, 
            selectedSubsector: prev.selectedSubsector.filter(s => validSubsectores.includes(s))
          }));
        } else {
          setSubsectores([]);
          setFormData(prev => ({ ...prev, selectedSubsector: [] }));
        }
      });
    };
    
    fetchSectores();
    fetchSubsectores();
  }, [formData.sector]);

  const handleChangeInpt = (e) => {
    const input = e.target.value;
    const soNumeros = input.replace(/\D/g, "");
    const valor = Number(soNumeros) / 100;
    const formattedValue = formatCurrency(input);

    setFormData(prev => ({
      ...prev,
      maxProposals: valor,
      valor: formattedValue,
    }));
  };

  const handleSectorChange = (event) => {
    setFormData(prev => ({ ...prev, sector: event.target.value }));
  };
  
  const handleCloseSectorSelect = () => {
    setOpenSectorSelect(false);
  };
  
  const handleOpenSectorSelect = () => {
    setOpenSectorSelect(true);
  };

  const handleProvinciaChange = (event) => {
    const value = event.target.value;
    
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

  const handleSubsectorChange = (event) => {
    const value = event.target.value;
    const filteredValue = Array.isArray(value) 
      ? value.filter(item => item !== undefined && item !== null && item !== '')
      : [];

    if (value.includes("all")) {
      if (formData.selectedSubsector.length === subsectores.length) {
        setFormData(prev => ({ ...prev, selectedSubsector: [] }));
      } else {
        setFormData(prev => ({ ...prev, selectedSubsector: [...subsectores] }));
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, selectedSubsector: filteredValue }));
  };

  const handleCloseProvinciaSelect = () => {
    setOpenProvinciaSelect(false);
  };

  const handleOpenProvinciaSelect = () => {
    setOpenProvinciaSelect(true);
  };

  const handleCloseSubsectorSelect = () => {
    setOpenSubsectorSelect(false);
  };

  const handleOpenSubsectorSelect = () => {
    setOpenSubsectorSelect(true);
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

  const filteredSubsectors = formData.selectedSubsector.filter(
    item => item !== undefined && item !== null && item !== ''
  );

  setLoading(true);
  setSnackbarMessage('');

  try {
    const cotacoesRef = ref(db, 'cotacoes');
    const newCotacaoRef = push(cotacoesRef);
    const cotacaoId = newCotacaoRef.key;
    const linkDoPedido = `https://connectionmozambique.com/cotacao/${cotacaoId}`;

    const cotacaoData = {
      ...formData,
      selectedSubsector: filteredSubsectors,
      id: cotacaoId,
      company: {
        provincia: user.provincia || 'N/A',
        sector: user.sector || 'N/A',
        id: user.id || 'N/A',
        distrito: user.distrito || 'N/A',
        morada: user.endereco || 'N/A',
        nuit: user.nuit || 'N/A',
        contacto: user.contacto || 'N/A',
        email: user.email || 'N/A',
        nome: user.nome || 'N/A',
        logoUrl: user.logoUrl || ''
      },
      timestamp: new Date().toISOString(),
      datalimite: new Date(formData.deadline).toISOString(),
      status: 'open',
      lifecycleStatus: 'open',
      moderationStatus: 'pending',
      link: linkDoPedido,
      proposalLimit: formData.proposalLimit || null,
    };

    // Guardar cotação na base de dados
    await set(ref(db, `cotacoes/${cotacaoId}`), cotacaoData);

    setSnackbarMessage('Cotação publicada com sucesso! Está em análise e só ficará visível às empresas após aprovação.');
    setSnackbarSeverity('success');
    setOpenSnackbar(true);

    try {
    // Buscar empresas do mesmo setor
    const empresasRef = ref(db, 'company');
    const setorQuery = query(empresasRef, orderByChild('sector'), equalTo(formData.sector.trim()));
    const empresasSnapshot = await get(setorQuery);

    if (empresasSnapshot.exists()) {
      const empresas = empresasSnapshot.val();

      // Formatar data
      const formatDeadline = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-PT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      const formattedDeadline = formatDeadline(formData.deadline);
      const message = `Título: ${formData.title}\nDescrição: ${formData.description}\nData Limite: ${formattedDeadline}\nSetor de Atividade: ${formData.sector}\nAcesse: ${linkDoPedido}`;

      const mailMessage = {
        title: formData.title,
        description: formData.description.replace(/<\/?[^>]+(>|$)/g, ""),
        deadline: formattedDeadline,
        sector: formData.sector,
        link: linkDoPedido
      };

      // Criar estruturas para envio
      const smsData = {
        mensagem: message,
        empresaOrigemId: user.id || 'N/A',
        empresaOrigemNome: user.nome || 'N/A',
        timestamp: new Date().toISOString(),
        tipo: 'cotacao',
        contactos: []
      };

      const emailsToSend = [];
      const targetProvinces = (Array.isArray(formData.provincia) ? formData.provincia : [formData.provincia])
        .map(value => String(value || '').trim().toLowerCase())
        .filter(Boolean);
      const isNationalTarget = targetProvinces.length === 0
        || targetProvinces.some(value => ['todas', 'todo país', 'nacional'].includes(value));

      // Notificar empresas com módulo SMS ativo
      for (const key in empresas) {
        const empresa = empresas[key];

        // Ignorar a própria empresa
        if (key === user.id) continue;

const companyProvince = String(empresa.provincia || empresa.province || '').trim().toLowerCase();
if (!isNationalTarget && (!companyProvince || !targetProvinces.includes(companyProvince))) continue;

// Verificar módulo SMS ativo (alerta ativo) — lido diretamente do
// registo da empresa já carregado (company/{id}/activeModules/moduloSMS),
// com a mesma lógica de expiração que ActiveModulesContext usa no
// resto do app. "subscriptions/{id}" é um node órfão que ninguém
// mais escreve.
let hasActiveSMS = false;
if (empresa.activeModules) {
  const activeModules = filterActiveModules(empresa.activeModules);
  if (activeModules.moduloSMS) {
    hasActiveSMS = true;
  }
}


        // Processar apenas empresas com SMS ativo
        if (hasActiveSMS) {
          // Adicionar contatos SMS
          if (empresa.contacto) {
            const contactos = Array.isArray(empresa.contacto)
              ? empresa.contacto
              : [empresa.contacto];

            contactos.forEach(contacto => {
              if (!contacto) return;

              smsData.contactos.push({
                empresaId: key,
                empresaNome: empresa.nome || 'N/A',
                numero: contacto,
                status: 'por enviar',
                attempts: 0
              });
            });
          }

          // Adicionar emails para envio
          if (empresa.email) {
            const emails = Array.isArray(empresa.email)
              ? empresa.email
              : [empresa.email];

            emails.forEach(email => {
              if (email) {
                emailsToSend.push({
                  email,
                  message: mailMessage
                });
              }
            });
          }
        }

        const companyEmails = Array.isArray(empresa.email) ? empresa.email : [empresa.email];
        companyEmails.forEach(email => {
          const normalizedEmail = String(email || '').trim().toLowerCase();
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            emailsToSend.push({ email: normalizedEmail, message: mailMessage });
          }
        });
      }

      // Guardar estrutura de envio SMS se houver contatos
      if (smsData.contactos.length > 0) {
        const smsRef = ref(db, `smsEnvio/${cotacaoId}`);
        await set(smsRef, smsData);
      }

      // Enviar emails (em produção, descomente esta parte)
      const uniqueEmails = [...new Map(emailsToSend.map(item => [item.email, item])).values()];
      if (uniqueEmails.length > 0) {
        const results = await Promise.allSettled(uniqueEmails.map(item => sendEmail(item.email, item.message)));
        const delivered = results.filter(result => result.status === 'fulfilled' && result.value !== false).length;
        const failed = results.length - delivered;
        try {
          await set(ref(db, `notificationDeliveries/quotes/${cotacaoId}`), {
            channel: 'email', targetCount: uniqueEmails.length, delivered, failed,
            createdAt: Date.now(), createdBy: user.id || null,
          });
        } catch (deliveryLogError) {
          console.error('Erro ao registar o resultado das notificações:', deliveryLogError);
        }
        if (failed > 0) {
          setSnackbarMessage(`Cotação publicada e está em análise. ${delivered} email(s) enviado(s) e ${failed} falharam.`);
          setSnackbarSeverity('warning');
          setOpenSnackbar(true);
        }
      }
    }
    } catch (notificationError) {
      console.error('Cotação publicada, mas a notificação falhou:', notificationError);
      setSnackbarMessage('Cotação publicada e está em análise, mas algumas notificações não puderam ser processadas.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
    }

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

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
            Setor e Localização
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Setor de Atividade</InputLabel>
                <Select
                  value={formData.sector}
                  onChange={handleSectorChange}
                  onClose={handleCloseSectorSelect}
                  onOpen={handleOpenSectorSelect}
                  open={openSectorSelect}
                  label="Setor de Atividade"
                  required
                >
                  <MenuItem onClick={handleCloseSectorSelect}>
                    <ListItemIcon>
                      <Close fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Fechar" />
                  </MenuItem>
                  <Divider />
                  
                  {sectores.map((sector, index) => (
                    <MenuItem key={index} value={sector}>
                      <ListItemText primary={sector} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Subsectores</InputLabel>
                <Select
                  multiple
                  value={formData.selectedSubsector}
                  onChange={handleSubsectorChange}
                  onClose={handleCloseSubsectorSelect}
                  onOpen={handleOpenSubsectorSelect}
                  open={openSubsectorSelect}
                  label="Subsectores"
                  renderValue={(selected) => selected.join(', ')}
                >
                  <MenuItem value="all">
                    <ListItemIcon>
                      <Checkbox
                        checked={formData.selectedSubsector.length === subsectores.length && subsectores.length > 0}
                        indeterminate={
                          formData.selectedSubsector.length > 0 && 
                          formData.selectedSubsector.length < subsectores.length
                        }
                      />
                    </ListItemIcon>
                    <ListItemText primary="Selecionar Todos" />
                  </MenuItem>

                  <MenuItem onClick={handleCloseSubsectorSelect}>
                    <ListItemIcon>
                      <Close fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Fechar" />
                  </MenuItem>
                  <Divider />
                  
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

                  <MenuItem onClick={handleCloseProvinciaSelect}>
                    <ListItemIcon>
                      <Close fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Fechar" />
                  </MenuItem>

                  <Divider />

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
                          margin: '0 auto',
                          objectFit:'contain'
                        }}
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          ))}
        </Paper>

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
        autoHideDuration={8000}
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
