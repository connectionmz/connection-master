import React, { useEffect, useState, useCallback } from 'react';
import { ref, push, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../fb';
import {
  Container, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Snackbar, Alert, Typography, Box, CircularProgress,
  ListItemIcon, Checkbox, Divider, ListItemText, Chip, Grid, IconButton
} from '@mui/material';
import BackButton from '../BackButton';
import { Close, AttachFile } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { sendEmailConcurso } from '../sms/SendMail';

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ]
};

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
  provincia: ['Todas'],
  setor: '',
  tipoEntidade: ['Todas'],
  modalidade: '',
  numeroReferencia: 'Não especificado',
  anexos: [],
  requisitosTecnicos: ''
});

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
  const [formData, setFormData] = useState(initialFormData(user));
  const [richTextData, setRichTextData] = useState(initialRichTextData);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [tiposEntidades, setTiposEntidades] = useState([]);
  const [selectedProvincias, setSelectedProvincias] = useState(['Todas']);
  const [openProvinciaSelect, setOpenProvinciaSelect] = useState(false);
  const [openTipoEntidadeSelect, setOpenTipoEntidadeSelect] = useState(false);

  // Funções auxiliares para datas
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateFromInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString();
  };

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

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRichTextChange = (field, value) => {
    setRichTextData(prev => ({ ...prev, [field]: value }));
  };

  const handleProvinciaChange = (event) => {
    const value = event.target.value;
    
    if (value.includes("all")) {
      setSelectedProvincias(
        selectedProvincias.length === provincias.length 
          ? [] 
          : provincias.map(p => p.provincia)
      );
      return;
    }
    
    setSelectedProvincias(Array.isArray(value) ? value : [value]);
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      provincia: selectedProvincias.length > 0 ? selectedProvincias : ['Todas']
    }));
  }, [selectedProvincias]);

  const handleTipoEntidadeChange = (e) => {
    const value = e.target.value;
    
    if (value.includes("all")) {
      setFormData(prev => ({
        ...prev,
        tipoEntidade: prev.tipoEntidade.length === tiposEntidades.length 
          ? [] 
          : tiposEntidades.map(t => t.tipo)
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tipoEntidade: Array.isArray(value) ? value : [value]
    }));
  };

  const handleRemoveAnexo = (index) => {
    setFormData(prev => {
      const newAnexos = [...prev.anexos];
      newAnexos.splice(index, 1);
      return { ...prev, anexos: newAnexos };
    });
  };

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

    return true;
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

  const sendNotifications = useCallback(async (cotacaoId) => {
    try {
      const empresasRef = ref(db, 'company');
      const setorQuery = query(empresasRef, orderByChild('sector'), equalTo(formData.setor.trim()));
      const empresasSnapshot = await get(setorQuery);

      if (!empresasSnapshot.exists()) return;

      const empresas = empresasSnapshot.val();
      const formattedDeadline = formatDeadline(formData.prazo);
      const linkDoPedido = `https://www.connectionmozambique.com/concurso/${cotacaoId}`;

      const message = `Título: ${formData.titulo}\nDescrição: ${formData.descricao}\nData Limite: ${formattedDeadline}\nSetor de Atividade: ${formData.setor}\nAcesse: ${linkDoPedido}`;

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
        const smsRef = ref(db, `smsEnvio/${cotacaoId}`);
        await set(smsRef, smsData);
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

    try {
      const concursoData = {
        ...formData,
        ...richTextData,
        id: '',
        status: 'Aberta',
        timestamp: new Date().toISOString(),
        company: {
          id: user?.id,
          nome: user?.nome,
          logoUrl: user?.logoUrl || '',
          provincia: user?.provincia || ''
        }
      };

      const sanitizedData = {
        ...concursoData,
        provincia: formData.provincia.length === 0 ? ['Todas'] : formData.provincia,
        tipoEntidade: formData.tipoEntidade.length === 0 ? ['Todas'] : formData.tipoEntidade
      };

      const newConcursoRef = push(ref(db, 'concursos'));
      const cotacaoId = newConcursoRef.key;

      await set(newConcursoRef, {
        ...sanitizedData,
        id: cotacaoId
      });

      await sendNotifications(cotacaoId);

      setFormData(initialFormData(user));
      setRichTextData(initialRichTextData);

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

  return (
    <Container maxWidth="md">
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ 
          mt: 3, 
          p: 3, 
          bgcolor: 'background.paper', 
          borderRadius: 2,
          boxShadow: 1
        }}
      >
        <BackButton sx={{ mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Publicar Novo Concurso
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'text.secondary' }}>
            Informações Básicas
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Título do Concurso *"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
                margin="normal"
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
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Prazo de Submissão *"
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
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Local de Entrega *"
            name="localEntrega"
            value={formData.localEntrega}
            onChange={handleChange}
            required
            margin="normal"
            sx={{ mt: 2 }}
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            Classificação
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Setor de Atividade *</InputLabel>
                <Select
                  name="setor"
                  value={formData.setor}
                  onChange={handleChange}
                  label="Setor de Atividade *"
                  disabled={!dataLoaded}
                >
                  <MenuItem value="">Selecione o Setor</MenuItem>
                  {sectores.map((setor, index) => (
                    <MenuItem key={index} value={setor.setor}>
                      {setor.setor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Modalidade *</InputLabel>
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
            onChange={handleChange}
            margin="normal"
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            Abrangência
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
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
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                  disabled={!dataLoaded}
                >
                  <MenuItem onClick={() => setOpenProvinciaSelect(false)}>
                    <ListItemIcon>
                      <Close fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Fechar" />
                  </MenuItem>
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
                    <ListItemText primary="Selecionar Todas" />
                  </MenuItem>
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
              <FormControl fullWidth margin="normal">
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
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                  disabled={!dataLoaded}
                >
                  <MenuItem onClick={() => setOpenTipoEntidadeSelect(false)}>
                    <ListItemIcon>
                      <Close fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Fechar" />
                  </MenuItem>
                  <MenuItem value="all">
                    <ListItemIcon>
                      <Checkbox
                        checked={formData.tipoEntidade.length === tiposEntidades.length}
                        indeterminate={
                          formData.tipoEntidade.length > 0 && 
                          formData.tipoEntidade.length < tiposEntidades.length
                        }
                      />
                    </ListItemIcon>
                    <ListItemText primary="Selecionar Todos" />
                  </MenuItem>
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
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            Objeto do Concurso *
          </Typography>
          <ReactQuill
            theme="snow"
            value={richTextData.objeto}
            onChange={(value) => handleRichTextChange('objeto', value)}
            modules={quillModules}
            style={{ height: '200px', marginBottom: '40px' }}
            placeholder="Descreva o objeto do concurso..."
          />

          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            Condições de Participação *
          </Typography>
          <ReactQuill
            theme="snow"
            value={richTextData.condicoes}
            onChange={(value) => handleRichTextChange('condicoes', value)}
            modules={quillModules}
            style={{ height: '200px', marginBottom: '40px' }}
            placeholder="Descreva as condições de participação..."
          />

          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            Documentação Necessária *
          </Typography>
          <ReactQuill
            theme="snow"
            value={richTextData.documentacao}
            onChange={(value) => handleRichTextChange('documentacao', value)}
            modules={quillModules}
            style={{ height: '200px', marginBottom: '40px' }}
            placeholder="Liste a documentação necessária..."
          />

          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            Critérios de Avaliação *
          </Typography>
          <ReactQuill
            theme="snow"
            value={richTextData.criterios}
            onChange={(value) => handleRichTextChange('criterios', value)}
            modules={quillModules}
            style={{ height: '200px', marginBottom: '40px' }}
            placeholder="Descreva os critérios de avaliação..."
          />

          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            Requisitos Técnicos
          </Typography>
          <ReactQuill
            theme="snow"
            value={richTextData.requisitosTecnicos}
            onChange={(value) => handleRichTextChange('requisitosTecnicos', value)}
            modules={quillModules}
            style={{ height: '200px', marginBottom: '40px' }}
            placeholder="Descreva os requisitos técnicos..."
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            Anexos
          </Typography>
          
          <Button
            variant="outlined"
            component="label"
            startIcon={<AttachFile />}
            sx={{ mb: 2 }}
          >
            Adicionar Anexos
            <input
              type="file"
              multiple
              hidden
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  anexos: [...prev.anexos, ...Array.from(e.target.files)]
                }));
              }}
            />
          </Button>
          
          {formData.anexos.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {formData.anexos.map((anexo, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachFile sx={{ mr: 1 }} />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {anexo.name}
                  </Typography>
                  <IconButton size="small" onClick={() => handleRemoveAnexo(index)}>
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || !dataLoaded}
            sx={{ 
              minWidth: '200px',
              py: 1.5,
              fontSize: '1rem'
            }}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : !dataLoaded ? (
              'Carregando dados...'
            ) : (
              'Publicar Concurso'
            )}
          </Button>
        </Box>
      </Box>

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
  );
};

export default PublicarConcursoDesk;