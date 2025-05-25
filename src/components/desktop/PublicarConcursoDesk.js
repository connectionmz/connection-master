import React, { useEffect, useState } from 'react';
import { ref, push, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../fb';
import {
  Container, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Snackbar, Alert, Typography, Box, CircularProgress,
  ListItemIcon, Checkbox, Divider, ListItemText
} from '@mui/material';
import BackButton from '../BackButton';
import { Close } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { sendEmailConcurso} from '../sms/SendMail';

const PublicarConcursoDesk = ({ user }) => {
  // Estados do componente
  const [formData, setFormData] = useState({
    titulo: '',
    entidade: user?.nome || '',
    objeto: '',
    condicoes: '',
    documentacao: '',
    prazo: '',
    localEntrega: '',
    dataAbertura: '',
    criterios: '',
    valorEstimado: '',
    condicoesPagamento: '',
    observacoes: '',
    provincia: [],
    setor: '',
    tipoEntidade: [],
    modalidade: '',
    numeroReferencia: '',
    anexos: [],
    requisitosTecnicos: ''
  });

  const [richTextData, setRichTextData] = useState({
    objeto: '',
    condicoes: '',
    documentacao: '',
    criterios: '',
    condicoesPagamento: '',
    observacoes: '',
    requisitosTecnicos: ''
  });

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [tiposEntidades, setTiposEntidades] = useState([]);
  const [selectedProvincias, setSelectedProvincias] = useState([]);
  const [openProvinciaSelect, setOpenProvinciaSelect] = useState(false);
  const [openTipoEntidadeSelect, setOpenTipoEntidadeSelect] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [provinciasSnapshot, sectoresSnapshot, tiposEntidadesSnapshot] = await Promise.all([
          get(ref(db, 'provincias')),
          get(ref(db, 'sectores_de_atividade')),
          get(ref(db, 'tipos_entidades'))
        ]);

        setProvincias(provinciasSnapshot.val() || []);
        setSectores(sectoresSnapshot.val() || []);
        setTiposEntidades(tiposEntidadesSnapshot.val() || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setSnackbar({ open: true, message: 'Erro ao carregar dados', severity: 'error' });
      }
    };

    loadInitialData();
  }, []);

  // Handlers para campos de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handlers para rich text
  const handleRichTextChange = (field, value) => {
    setRichTextData(prev => ({ ...prev, [field]: value }));
  };

  // Handler para seleção de províncias
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

  // Atualizar formData quando províncias mudam
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      provincia: selectedProvincias.length > 0 ? selectedProvincias : ['Todas']
    }));
  }, [selectedProvincias]);

  // Handler para tipos de entidade
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

  // Handler para envio do formulário
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  // Validações
  const requiredFields = ['titulo', 'prazo', 'localEntrega', 'setor', 'modalidade'];
  const missingFields = requiredFields.filter(field => !formData[field]);

  if (missingFields.length > 0) {
    setSnackbar({
      open: true,
      message: `Preencha os campos obrigatórios: ${missingFields.join(', ')}`,
      severity: 'error'
    });
    setLoading(false);
    return;
  }

  if (formData.provincia.length === 0) {
    setSnackbar({
      open: true,
      message: 'Selecione pelo menos uma província',
      severity: 'error'
    });
    setLoading(false);
    return;
  }

  if (formData.tipoEntidade.length === 0) {
    setSnackbar({
      open: true,
      message: 'Selecione pelo menos um tipo de entidade',
      severity: 'error'
    });
    setLoading(false);
    return;
  }

  try {
    // Preparar dados para o Firebase
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
      },
      provincia: formData.provincia || ['Todas'],
      tipoEntidade: formData.tipoEntidade || ['Todas'],
      valorEstimado: formData.valorEstimado || 'Não especificado',
      numeroReferencia: formData.numeroReferencia || 'Não especificado'
    };

    const sanitizedData = Object.fromEntries(
      Object.entries(concursoData).filter(([_, v]) => v !== undefined)
    );

    const newConcursoRef = push(ref(db, 'concursos'));
    const cotacaoId = newConcursoRef.key;

    await set(newConcursoRef, {
      ...sanitizedData,
      id: cotacaoId
    });

    // BUSCAR EMPRESAS DO MESMO SETOR
    const empresasRef = ref(db, 'company');
    const setorQuery = query(empresasRef, orderByChild('sector'), equalTo(formData.setor.trim()));
    const empresasSnapshot = await get(setorQuery);

    if (empresasSnapshot.exists()) {
      const empresas = empresasSnapshot.val();

      console.log(empresas)

      // Formatador de data
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

      const formattedDeadline = formatDeadline(formData.prazo);
      const linkDoPedido = `https://www.connectionmozambique.com/concurso/${cotacaoId}`; // substitua pela sua URL real

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

      for (const key in empresas) {
        const empresa = empresas[key];

        if (key === user.id) continue;

        // Ignorar se não tiver contacto nem email
        if (!empresa.contacto && !empresa.email) continue;

        // SMS
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

        // EMAIL
        if (empresa.email) {
          const emails = Array.isArray(empresa.email)
            ? empresa.email
            : [empresa.email];

          await Promise.all(emails.map(email => sendEmailConcurso(email, mailMessage)));
        }
      }

      // Guardar envio de SMS
      const smsRef = ref(db, `smsEnvio/${cotacaoId}`);
      await set(smsRef, smsData);
    }

    setSnackbar({
      open: true,
      message: 'Concurso publicado com sucesso!',
      severity: 'success'
    });

  } catch (error) {
    console.error('Erro ao publicar concurso:', error);
    setSnackbar({
      open: true,
      message: `Erro ao publicar concurso: ${error.message}`,
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};


  // Fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="md">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <BackButton sx={{ mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Publicar Novo Concurso
        </Typography>

        {/* Seção de informações básicas */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Informações Básicas
          </Typography>
          
          <TextField
            fullWidth
            label="Título do Concurso *"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
            margin="normal"
          />

          <TextField
            fullWidth
            label="Número de Referência"
            name="numeroReferencia"
            value={formData.numeroReferencia}
            onChange={handleChange}
            margin="normal"
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Prazo de Submissão *"
              type="date"
              name="prazo"
              value={formData.prazo}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Data de Abertura"
              type="date"
              name="dataAbertura"
              value={formData.dataAbertura}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

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

        {/* Seção de classificação */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Classificação
          </Typography>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Setor de Atividade *</InputLabel>
            <Select
              name="setor"
              value={formData.setor}
              onChange={handleChange}
              label="Setor de Atividade *"
            >
              <MenuItem value="">Selecione o Setor</MenuItem>
              {sectores.map((setor, index) => (
                <MenuItem key={index} value={setor.setor}>
                  {setor.setor}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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

          <TextField
            fullWidth
            label="Valor Estimado"
            name="valorEstimado"
            value={formData.valorEstimado}
            onChange={handleChange}
            margin="normal"
          />
        </Box>

        {/* Seção de abrangência */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Abrangência
          </Typography>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Província(s) *</InputLabel>
            <Select
              multiple
              name="provincia"
              value={selectedProvincias}
              onChange={handleProvinciaChange}
              open={openProvinciaSelect}
              onOpen={() => setOpenProvinciaSelect(true)}
              onClose={() => setOpenProvinciaSelect(false)}
              label="Província(s) *"
              renderValue={(selected) => selected.join(', ')}
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

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Tipo de Entidade *</InputLabel>
            <Select
              multiple
              name="tipoEntidade"
              value={formData.tipoEntidade}
              onChange={handleTipoEntidadeChange}
              open={openTipoEntidadeSelect}
              onOpen={() => setOpenTipoEntidadeSelect(true)}
              onClose={() => setOpenTipoEntidadeSelect(false)}
              label="Tipo de Entidade *"
              renderValue={(selected) => selected.join(', ')}
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
        </Box>

        {/* Seção de conteúdo */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Objeto do Concurso
          </Typography>
          <ReactQuill
            theme="snow"
            value={richTextData.objeto}
            onChange={(value) => handleRichTextChange('objeto', value)}
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
              ]
            }}
            style={{ height: '200px', marginBottom: '40px' }}
          />

          <Typography variant="h6" gutterBottom>
            Condições de Participação
          </Typography>
          <ReactQuill
            theme="snow"
            value={richTextData.condicoes}
            onChange={(value) => handleRichTextChange('condicoes', value)}
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
              ]
            }}
            style={{ height: '200px', marginBottom: '40px' }}
          />

          <Typography variant="h6" gutterBottom>
            Documentação Necessária
          </Typography>
          <ReactQuill
            theme="snow"
            value={richTextData.documentacao}
            onChange={(value) => handleRichTextChange('documentacao', value)}
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
              ]
            }}
            style={{ height: '200px', marginBottom: '40px' }}
          />

          <Typography variant="h6" gutterBottom>
            Critérios de Avaliação
          </Typography>
          <ReactQuill
            theme="snow"
            value={richTextData.criterios}
            onChange={(value) => handleRichTextChange('criterios', value)}
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
              ]
            }}
            style={{ height: '200px', marginBottom: '40px' }}
          />

          <Typography variant="h6" gutterBottom>
            Requisitos Técnicos
          </Typography>
          <ReactQuill
            theme="snow"
            value={richTextData.requisitosTecnicos}
            onChange={(value) => handleRichTextChange('requisitosTecnicos', value)}
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
              ]
            }}
            style={{ height: '200px', marginBottom: '40px' }}
          />
        </Box>

        {/* Seção de anexos */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Anexos
          </Typography>
          <input
            type="file"
            multiple
            onChange={(e) => {
              setFormData(prev => ({
                ...prev,
                anexos: [...prev.anexos, ...Array.from(e.target.files)]
              }));
            }}
          />
        </Box>

        {/* Botão de submissão */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ minWidth: '200px' }}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              'Publicar Concurso'
            )}
          </Button>
        </Box>
      </Box>

      {/* Snackbar para feedback */}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PublicarConcursoDesk;