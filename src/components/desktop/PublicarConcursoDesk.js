import React, { useEffect, useState, useCallback } from 'react';
import { ref, push, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../fb';
import {
  Container, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Snackbar, Alert, Typography, Box, CircularProgress, Paper,
  ListItemIcon, Checkbox, Divider, ListItemText, Chip, Grid, IconButton,
  LinearProgress
} from '@mui/material';
import BackButton from '../BackButton';
import { Close, AttachFile, CloudUpload, CheckCircle, Error } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { sendEmailConcurso } from '../sms/SendMail';
import { filterActiveModules } from '../../context/ActiveModulesContext';

// Initialize Firebase Storage
const storage = getStorage();

/* ── Design tokens (mesmos de ConcursoDesk.js / CotacoesDesk.js, para manter o visual consistente) ── */
const T = {
  navy:        '#08192E',
  navyCard:    '#0D2240',
  gold:        '#C8903A',
  goldLight:   '#E8B96A',
  white:       '#FFFFFF',
  darkBorder:  'rgba(255,255,255,0.08)',
  darkText:    'rgba(255,255,255,0.88)',
  darkTextSub: 'rgba(255,255,255,0.52)',
  darkMuted:   'rgba(255,255,255,0.30)',
  success:     '#10b981',
  error:       '#ef4444',
};

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  .detail-section {
    background: ${T.navyCard};
    border: 1px solid ${T.darkBorder};
    border-radius: 16px;
  }
  .anexo-row {
    background: rgba(255,255,255,0.03);
    border: 1px solid ${T.darkBorder};
    border-radius: 12px;
  }
  .ql-toolbar.ql-snow {
    background: ${T.white};
    border-color: ${T.darkBorder} !important;
    border-radius: 8px 8px 0 0;
  }
  .ql-container.ql-snow {
    background: ${T.white};
    border-color: ${T.darkBorder} !important;
    border-radius: 0 0 8px 8px;
  }
  .ql-editor.ql-blank::before {
    color: rgba(0,0,0,0.4);
  }
`;

const BG_GRID = {
  position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.02,
  backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize: '56px 56px',
};

// Estilo partilhado para TextField / Select no tema navy
const fieldSx = {
  '& .MuiInputLabel-root': { color: T.darkTextSub },
  '& .MuiInputLabel-root.Mui-focused': { color: T.gold },
  '& .MuiOutlinedInput-root': {
    color: T.darkText,
    '& fieldset': { borderColor: T.darkBorder },
    '&:hover fieldset': { borderColor: T.gold },
    '&.Mui-focused fieldset': { borderColor: T.gold },
  },
  '& .MuiSelect-icon': { color: T.darkTextSub },
  '& .MuiFormHelperText-root': { color: T.darkMuted },
  '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(0.7)' },
};

const sectionTitleSx = {
  fontFamily: '"Playfair Display", serif',
  fontWeight: 700,
  color: T.white,
  mb: 2,
};

// Quill editor configuration
const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ]
};

// Initial form data structure
const initialFormData = (user) => ({
  titulo: '',
  entidade: user?.nome || '',
  objeto: '',
  condicoes: '',
  documentacao: '',
  prazo: '',
  localEntrega: '',
  dataAbertura: '',
  criterios: '',
  valorEstimado: 'Não especificado',
  condicoesPagamento: '',
  observacoes: '',
  provincia: [],
  setor: '',
  linkDeSubmissao: '',
  tipoEntidade: [],
  modalidade: '',
  numeroReferencia: 'Não especificado',
  anexos: [],
  requisitosTecnicos: '',
  status: 'Aberta',
  contacto: user?.contacto || '', // Novo campo
  email: user?.email || '' // Novo campo
});

// Initial rich text fields data
const initialRichTextData = {
  objeto: '',
  condicoes: '',
  documentacao: '',
  criterios: '',
  condicoesPagamento: '',
  observacoes: '',
  requisitosTecnicos: ''
};

const PublicarConcursoDesk = ({ user }) => {
  // State management
  const [formData, setFormData] = useState(initialFormData(user));
  const [richTextData, setRichTextData] = useState(initialRichTextData);
  const [loading, setLoading] = useState(false);
  const [uploadStates, setUploadStates] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [tiposEntidades, setTiposEntidades] = useState([]);
  const [selectedProvincias, setSelectedProvincias] = useState([]);
  const [selectedSectores, setSelectedSectores] = useState([]);
  const [openProvinciaSelect, setOpenProvinciaSelect] = useState(false);
  const [openTipoEntidadeSelect, setOpenTipoEntidadeSelect] = useState(false);
  const [openSectorSelect, setOpenSectorSelect] = useState(false);

  // Helper functions
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const parseDateFromInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString();
  };

  // Data loading
  const loadInitialData = useCallback(async () => {
    try {
      const [provinciasSnapshot, sectoresSnapshot, tiposEntidadesSnapshot] = await Promise.all([
        get(ref(db, 'provincias')),
        get(ref(db, 'sectores_de_atividade')),
        get(ref(db, 'tipos_entidades'))
      ]);

      setProvincias(provinciasSnapshot.val() || []);
      setSectores(sectoresSnapshot.val() || []);
      setTiposEntidades(tiposEntidadesSnapshot.val() || []);
      setDataLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      showSnackbar('Erro ao carregar dados', 'error');
      setDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // UI helpers
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRichTextChange = (field, value) => {
    setRichTextData(prev => ({ ...prev, [field]: value }));
  };

  // Selection handlers
  const handleProvinciaChange = (event) => {
    const value = event.target.value;
    setSelectedProvincias(Array.isArray(value) ? value : [value]);
  };

  const handleSectorChange = (event) => {
    const value = event.target.value;
    setSelectedSectores(Array.isArray(value) ? value : [value]);
    setFormData(prev => ({
      ...prev,
      setor: Array.isArray(value) ? value.join(', ') : value
    }));
  };

  const handleTipoEntidadeChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      tipoEntidade: Array.isArray(value) ? value : [value]
    }));
  };

  // Bulk selection handlers
  const handleSelectAll = (field) => () => {
    if (field === 'provincia') {
      setSelectedProvincias(provincias.map(p => p.provincia));
    } else if (field === 'tipoEntidade') {
      setFormData(prev => ({
        ...prev,
        tipoEntidade: tiposEntidades.map(t => t.tipo)
      }));
    } else if (field === 'setor') {
      setSelectedSectores(sectores.map(s => s.setor));
      setFormData(prev => ({
        ...prev,
        setor: sectores.map(s => s.setor).join(', ')
      }));
    }
  };

  const handleDeselectAll = (field) => () => {
    if (field === 'provincia') {
      setSelectedProvincias([]);
    } else if (field === 'tipoEntidade') {
      setFormData(prev => ({
        ...prev,
        tipoEntidade: []
      }));
    } else if (field === 'setor') {
      setSelectedSectores([]);
      setFormData(prev => ({
        ...prev,
        setor: ''
      }));
    }
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      provincia: selectedProvincias.length > 0 ? selectedProvincias : ['Todas']
    }));
  }, [selectedProvincias]);

  // File attachment handling
  const handleRemoveAnexo = (index) => {
    setFormData(prev => {
      const newAnexos = [...prev.anexos];
      const removedFile = newAnexos.splice(index, 1)[0];
      
      // Remove from upload states
      setUploadStates(prevStates => {
        const newStates = {...prevStates};
        delete newStates[removedFile.name];
        return newStates;
      });

      return { ...prev, anexos: newAnexos };
    });
  };

  const validateAnexos = (anexos) => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/webp'
      
    ];

    for (const anexo of anexos) {
      if (anexo.size > MAX_SIZE) {
        showSnackbar(`O arquivo ${anexo.name} excede o tamanho máximo de 10MB`, 'error');
        return false;
      }
      
      if (!allowedTypes.includes(anexo.type)) {
        showSnackbar(`Tipo de arquivo não suportado: ${anexo.name}`, 'error');
        return false;
      }
    }
    return true;
  };

  // Form validation
  const validateForm = () => {
    const requiredFields = ['titulo', 'prazo', 'localEntrega', 'setor', 'modalidade'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      showSnackbar(`Preencha os campos obrigatórios: ${missingFields.join(', ')}`, 'error');
      return false;
    }

    const richTextFields = ['objeto', 'condicoes', 'documentacao', 'criterios'];
    const emptyRichTextFields = richTextFields.filter(field => 
      !richTextData[field] || richTextData[field] === '<p><br></p>'
    );

    if (emptyRichTextFields.length > 0) {
      showSnackbar(
        `Os seguintes campos não podem estar vazios: ${emptyRichTextFields.join(', ')}`,
        'error'
      );
      return false;
    }

    if (formData.anexos.length > 0 && !validateAnexos(formData.anexos)) {
      return false;
    }

    return true;
  };

  // File upload handling
  const uploadAnexos = async (anexos) => {
    const uploadedAnexos = [];
    
    for (const anexo of anexos) {
      try {
        // Update upload state
        setUploadStates(prev => ({
          ...prev,
          [anexo.name]: { status: 'uploading', progress: 0, error: null }
        }));

        showSnackbar(`Enviando anexo: ${anexo.name}`, 'info');
        
        // Generate unique file ID
        const fileId = uuidv4();
        const fileRef = storageRef(storage, `concursos/anexos/${fileId}_${anexo.name}`);
        
        // Upload file
        const snapshot = await uploadBytes(fileRef, anexo);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        uploadedAnexos.push({
          nome: anexo.name,
          url: downloadURL,
          tipo: anexo.type,
          tamanho: anexo.size,
          id: fileId
        });

        // Update upload state
        setUploadStates(prev => ({
          ...prev,
          [anexo.name]: { status: 'completed', progress: 100, error: null }
        }));

        showSnackbar(`Anexo ${anexo.name} enviado com sucesso!`, 'success');
      } catch (error) {
        console.error(`Erro ao enviar anexo ${anexo.name}:`, error);
        showSnackbar(`Erro ao enviar anexo ${anexo.name}`, 'error');
        
        // Update upload state
        setUploadStates(prev => ({
          ...prev,
          [anexo.name]: { status: 'error', progress: 0, error: error.message }
        }));
      }
    }
    
    return uploadedAnexos;
  };

  const formatDeadline = useCallback((isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

const sendNotifications = useCallback(async (concursoId) => {
    try {
      const empresasRef = ref(db, 'company');
      const setorQuery = query(empresasRef, orderByChild('sector'), equalTo(formData.setor.trim()));
      const empresasSnapshot = await get(setorQuery);

      if (!empresasSnapshot.exists()) return;

      const empresas = empresasSnapshot.val();
      const formattedDeadline = formatDeadline(formData.prazo);
      const linkDoPedido = `https://www.connectionmozambique.com/concurso/${concursoId}`;

      const message = `Novo Concurso: ${formData.titulo}\nData Limite: ${formattedDeadline}\nSetor: ${formData.setor}\nAcesse: ${linkDoPedido}`;

      const mailMessage = {
        title: formData.titulo,
        deadline: formattedDeadline,
        sector: formData.setor,
        link: linkDoPedido
      };

      const smsData = {
        mensagem: message,
        empresaOrigemId: user.id || 'N/A',
        empresaOrigemNome: user.nome || 'N/A',
        timestamp: new Date().toISOString(),
        tipo: 'concurso',
        contactos: []
      };

      const emailPromises = [];

      for (const key in empresas) {
        const empresa = empresas[key];

        if (key === user.id) continue;
        if (!empresa.contacto && !empresa.email) continue;

        // Verificar módulo SMS ativo (alerta ativo) — lido diretamente do
        // registo da empresa já carregado (company/{id}/activeModules/moduloSMS),
        // com a mesma lógica de expiração que ActiveModulesContext usa no
        // resto do app. "subscriptions/{id}" é um node órfão que ninguém
        // mais escreve.
        const hasActiveSMS = Boolean(filterActiveModules(empresa.activeModules).moduloSMS);

        // Só processar se tiver módulo SMS ativo
        if (!hasActiveSMS) continue;

        // Processar contatos SMS
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

        // Processar emails
        if (empresa.email) {
          const emails = Array.isArray(empresa.email)
            ? empresa.email
            : [empresa.email];

          emails.forEach(email => {
            if (email) {
              emailPromises.push(sendEmailConcurso(email, mailMessage));
            }
          });
        }
      }

      await Promise.all(emailPromises);

      if (smsData.contactos.length > 0) {
        const smsRef = ref(db, `smsEnvio/${concursoId}`);
        await set(smsRef, smsData);
      } else {
        console.log('Nenhum contato SMS válido encontrado');
      }
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
    }
  }, [formData, user, formatDeadline]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dataLoaded) {
      showSnackbar('Aguarde enquanto os dados são carregados', 'warning');
      return;
    }

    if (!validateForm()) return;
    
    setLoading(true);
    setUploadStates({});

    try {
      let anexosUploaded = [];
      if (formData.anexos.length > 0) {
        anexosUploaded = await uploadAnexos(formData.anexos);
      }

      const concursoData = {
        ...formData,
        ...richTextData,
        id: '',
        status: 'Aberta',
        timestamp: new Date().toISOString(),
        anexos: anexosUploaded,
        company: {
          id: user?.id,
          nome: user?.nome,
          logoUrl: user?.logoUrl || '',
          provincia: user?.provincia || ''
        }
      };

      // Ensure arrays are not empty
      const sanitizedData = {
        ...concursoData,
        provincia: formData.provincia.length === 0 ? ['Todas'] : formData.provincia,
        tipoEntidade: formData.tipoEntidade.length === 0 ? ['Todas'] : formData.tipoEntidade
      };

      // Save to database
      const newConcursoRef = push(ref(db, 'concursos'));
      const concursoId = newConcursoRef.key;

      await set(newConcursoRef, {
        ...sanitizedData,
        id: concursoId
      });

      // Send notifications
      await sendNotifications(concursoId);

      // Reset form
      setFormData(initialFormData(user));
      setRichTextData(initialRichTextData);
      setUploadStates({});

      showSnackbar('Concurso publicado com sucesso!', 'success');

    } catch (error) {
      console.error('Erro ao publicar concurso:', error);
      showSnackbar(`Erro ao publicar concurso: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Render helper for file upload status
  const renderFileStatusIcon = (status) => {
    switch (status) {
      case 'uploading':
        return <CircularProgress size={20} />;
      case 'completed':
        return <CheckCircle color="success" fontSize="small" />;
      case 'error':
        return <Error color="error" fontSize="small" />;
      default:
        return <CloudUpload color="action" fontSize="small" />;
    }
  };

  return (
    <Box sx={{ backgroundColor: T.navy, minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif', position: 'relative' }}>
      <style>{KEYFRAMES}</style>
      <Box sx={BG_GRID} />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <BackButton sx={{ mb: 2, color: T.darkTextSub }} />

        <Box component="form" onSubmit={handleSubmit}>
          <Paper className="detail-section" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography
              variant="h4"
              sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 800, color: T.white, fontSize: { xs: '1.5rem', sm: '2rem' } }}
            >
              Publicar Novo Concurso
            </Typography>
          </Paper>

          {/* Basic Information Section */}
          <Paper className="detail-section" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" sx={sectionTitleSx}>
              Informações Básicas
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Título do Concurso"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                  margin="normal"
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Número de Referência"
                  name="numeroReferencia"
                  value={formData.numeroReferencia}
                  onChange={handleChange}
                  margin="normal"
                  sx={fieldSx}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contacto para informações"
                  name="contacto"
                  value={formData.contacto}
                  onChange={handleChange}
                  required
                  margin="normal"
                  inputProps={{
                    pattern: "[0-9]{9}",
                    title: "Insira um número de 9 dígitos"
                  }}
                  helperText="Número de telefone (9 dígitos)"
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email para informações"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  margin="normal"
                  inputProps={{
                    pattern: "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
                    title: "Insira um email válido"
                  }}
                  sx={fieldSx}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Prazo de Submissão"
                  type="date"
                  name="prazo"
                  value={formatDateForInput(formData.prazo)}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    prazo: parseDateFromInput(e.target.value)
                  }))}
                  InputLabelProps={{ shrink: true }}
                  required
                  inputProps={{
                    min: formatDateForInput(new Date())
                  }}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data de Abertura"
                  type="date"
                  name="dataAbertura"
                  value={formatDateForInput(formData.dataAbertura)}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dataAbertura: parseDateFromInput(e.target.value)
                  }))}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: formatDateForInput(new Date())
                  }}
                  sx={fieldSx}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Local de Entrega"
              name="localEntrega"
              value={formData.localEntrega}
              onChange={handleChange}
              required
              margin="normal"
              sx={{ ...fieldSx, mt: 2 }}
            />

            <TextField
              fullWidth
              label="Link de Submissão"
              name="linkDeSubmissao"
              value={formData.linkDeSubmissao}
              onChange={handleChange}
              margin="normal"
              sx={fieldSx}
            />
          </Paper>

          {/* Classification Section */}
          <Paper className="detail-section" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" sx={sectionTitleSx}>
              Classificação
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" required sx={fieldSx}>
                  <InputLabel>Setor de Atividade</InputLabel>
                  <Select
                    multiple
                    name="setor"
                    value={selectedSectores}
                    onChange={handleSectorChange}
                    open={openSectorSelect}
                    onOpen={() => setOpenSectorSelect(true)}
                    onClose={() => setOpenSectorSelect(false)}
                    label="Setor de Atividade *"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ bgcolor: `${T.gold}20`, color: T.gold }} />
                        ))}
                      </Box>
                    )}
                    disabled={!dataLoaded}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                      <Button size="small" onClick={handleSelectAll('setor')}>
                        Selecionar Todos
                      </Button>
                      <Button size="small" onClick={handleDeselectAll('setor')}>
                        Desmarcar Todos
                      </Button>
                    </Box>
                    <Divider />
                    {sectores.map((sector, index) => (
                      <MenuItem key={index} value={sector.setor}>
                        <Checkbox checked={selectedSectores.includes(sector.setor)} />
                        <ListItemText primary={sector.setor} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" required sx={fieldSx}>
                  <InputLabel>Modalidade</InputLabel>
                  <Select
                    name="modalidade"
                    value={formData.modalidade}
                    onChange={handleChange}
                    label="Modalidade *"
                  >
                    <MenuItem value="">Selecione a Modalidade</MenuItem>
                    <MenuItem value="Concurso Público">Concurso Público</MenuItem>
                    <MenuItem value="Concurso Limitado">Concurso Limitado</MenuItem>
                    <MenuItem value="Ajuste Direto">Ajuste Direto</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Valor Estimado"
              name="valorEstimado"
              value={formData.valorEstimado}
              type="number"
              onChange={handleChange}
              margin="normal"
              InputProps={{
                endAdornment: <Typography sx={{ mr: 1, color: T.darkTextSub }}>MT</Typography>
              }}
              sx={fieldSx}
            />
          </Paper>

          {/* Coverage Section */}
          <Paper className="detail-section" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" sx={sectionTitleSx}>
              Abrangência
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" sx={fieldSx}>
                  <InputLabel>Província(s)</InputLabel>
                  <Select
                    multiple
                    name="provincia"
                    value={selectedProvincias}
                    onChange={handleProvinciaChange}
                    open={openProvinciaSelect}
                    onOpen={() => setOpenProvinciaSelect(true)}
                    onClose={() => setOpenProvinciaSelect(false)}
                    label="Província(s)"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ bgcolor: `${T.gold}20`, color: T.gold }} />
                        ))}
                      </Box>
                    )}
                    disabled={!dataLoaded}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                      <Button size="small" onClick={handleSelectAll('provincia')}>
                        Selecionar Todos
                      </Button>
                      <Button size="small" onClick={handleDeselectAll('provincia')}>
                        Desmarcar Todos
                      </Button>
                    </Box>
                    <Divider />
                    {provincias.map((provincia, index) => (
                      <MenuItem key={index} value={provincia.provincia}>
                        <Checkbox checked={selectedProvincias.includes(provincia.provincia)} />
                        <ListItemText primary={provincia.provincia} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" sx={fieldSx}>
                  <InputLabel>Tipo de Entidade</InputLabel>
                  <Select
                    multiple
                    name="tipoEntidade"
                    value={formData.tipoEntidade}
                    onChange={handleTipoEntidadeChange}
                    open={openTipoEntidadeSelect}
                    onOpen={() => setOpenTipoEntidadeSelect(true)}
                    onClose={() => setOpenTipoEntidadeSelect(false)}
                    label="Tipo de Entidade"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ bgcolor: `${T.gold}20`, color: T.gold }} />
                        ))}
                      </Box>
                    )}
                    disabled={!dataLoaded}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                      <Button size="small" onClick={handleSelectAll('tipoEntidade')}>
                        Selecionar Todos
                      </Button>
                      <Button size="small" onClick={handleDeselectAll('tipoEntidade')}>
                        Desmarcar Todos
                      </Button>
                    </Box>
                    <Divider />
                    {tiposEntidades.map((tipo, index) => (
                      <MenuItem key={index} value={tipo.tipo}>
                        <Checkbox checked={formData.tipoEntidade.includes(tipo.tipo)} />
                        <ListItemText primary={tipo.tipo} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Rich Text Sections */}
          <Paper className="detail-section" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" sx={sectionTitleSx}>
              Objeto do Concurso *
            </Typography>
            <ReactQuill
              theme="snow"
              value={richTextData.objeto}
              onChange={(value) => handleRichTextChange('objeto', value)}
              modules={quillModules}
              style={{ height: '200px', marginBottom: '40px', borderRadius: '8px', overflow: 'hidden' }}
              placeholder="Descreva o objeto do concurso..."
            />

            <Typography variant="h6" sx={sectionTitleSx}>
              Condições de Participação *
            </Typography>
            <ReactQuill
              theme="snow"
              value={richTextData.condicoes}
              onChange={(value) => handleRichTextChange('condicoes', value)}
              modules={quillModules}
              style={{ height: '200px', marginBottom: '40px', borderRadius: '8px', overflow: 'hidden' }}
              placeholder="Descreva as condições de participação..."
            />

            <Typography variant="h6" sx={sectionTitleSx}>
              Documentação Necessária *
            </Typography>
            <ReactQuill
              theme="snow"
              value={richTextData.documentacao}
              onChange={(value) => handleRichTextChange('documentacao', value)}
              modules={quillModules}
              style={{ height: '200px', marginBottom: '40px', borderRadius: '8px', overflow: 'hidden' }}
              placeholder="Liste a documentação necessária..."
            />

            <Typography variant="h6" sx={sectionTitleSx}>
              Critérios de Avaliação *
            </Typography>
            <ReactQuill
              theme="snow"
              value={richTextData.criterios}
              onChange={(value) => handleRichTextChange('criterios', value)}
              modules={quillModules}
              style={{ height: '200px', marginBottom: '40px', borderRadius: '8px', overflow: 'hidden' }}
              placeholder="Descreva os critérios de avaliação..."
            />

            <Typography variant="h6" sx={sectionTitleSx}>
              Requisitos Técnicos
            </Typography>
            <ReactQuill
              theme="snow"
              value={richTextData.requisitosTecnicos}
              onChange={(value) => handleRichTextChange('requisitosTecnicos', value)}
              modules={quillModules}
              style={{ height: '200px', marginBottom: '40px', borderRadius: '8px', overflow: 'hidden' }}
              placeholder="Descreva os requisitos técnicos..."
            />
          </Paper>

          {/* Attachments Section */}
          <Paper className="detail-section" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
            <Typography variant="h6" sx={sectionTitleSx}>
              Anexos
            </Typography>

            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFile />}
              sx={{ mb: 2, color: T.darkText, borderColor: T.darkBorder, textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: T.gold, color: T.gold } }}
              disabled={loading}
            >
              Adicionar Anexos
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files.length > 0) {
                    setFormData(prev => ({
                      ...prev,
                      anexos: [...prev.anexos, ...Array.from(e.target.files)]
                    }));
                  }
                }}
              />
            </Button>
            {formData.anexos.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {formData.anexos.map((anexo, index) => {
                  const uploadState = uploadStates[anexo.name] || { status: 'pending', progress: 0 };
                  const isImage = anexo.type?.startsWith('image/');
                  return (
                    <Box
                      key={index}
                      className="anexo-row"
                      sx={{ mb: 2, p: 2, position: 'relative', overflow: 'hidden' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 2 }}>
                          {renderFileStatusIcon(uploadState.status)}
                        </Box>
                        {isImage && (
                          <Box sx={{ mr: 2 }}>
                            <img
                              src={URL.createObjectURL(anexo)}
                              alt={anexo.name}
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
                            />
                          </Box>
                        )}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: T.darkText }}>
                            {anexo.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: T.darkTextSub }}>
                            {(anexo.size / 1024).toFixed(2)} KB • {
                              uploadState.status === 'pending' ? 'Pendente' :
                              uploadState.status === 'uploading' ? 'Enviando...' :
                              uploadState.status === 'completed' ? 'Enviado' :
                              'Erro no envio'
                            }
                          </Typography>
                          {uploadState.error && (
                            <Typography variant="caption" sx={{ color: T.error }}>
                              {uploadState.error}
                            </Typography>
                          )}
                          {uploadState.status === 'uploading' && (
                            <LinearProgress
                              variant="determinate"
                              value={uploadState.progress}
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>

                        {!loading && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveAnexo(index)}
                            disabled={uploadState.status === 'uploading'}
                            sx={{ color: T.darkMuted, '&:hover': { color: T.error } }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !dataLoaded}
              sx={{
                minWidth: '200px',
                py: 1.5,
                fontSize: '1rem',
                bgcolor: T.gold,
                color: T.navy,
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '10px',
                '&:hover': { bgcolor: T.goldLight },
                '&.Mui-disabled': { bgcolor: 'rgba(200,144,58,0.35)', color: 'rgba(8,25,46,0.6)' },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: T.navy }} />
              ) : !dataLoaded ? (
                'Carregando dados...'
              ) : (
                'Publicar Concurso'
              )}
            </Button>
          </Box>
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
            elevation={6}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default PublicarConcursoDesk;