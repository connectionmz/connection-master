import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  InputAdornment,
  Chip,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Radio,
  RadioGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Switch,
  FormGroup
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  Link as LinkIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Facebook,
  Instagram,
  Twitter,
  YouTube,
  Image as ImageIcon,
  LocalAtm as TicketIcon,
  AddCircleOutline,
  Language as LanguageIcon,
  AccessTime as TimeIcon,
  CalendarToday as DateIcon,
  Close,
  Visibility,
  VisibilityOff,
  Category as CategoryIcon,
  Payment,
  Phone,
  Email,
  Public,
  ArrowBack,
  ArrowForward,
  Save,
  Edit,
  Delete,
  QrCode2
} from '@mui/icons-material';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { set, push, ref as dbRef } from 'firebase/database';
import { db, storage } from '../../fb';
import { v4 as uuidv4 } from 'uuid';
import { InfoIcon } from 'lucide-react';

const provinciasMocambique = [
  'Maputo (Cidade)',
  'Maputo (Província)',
  'Gaza',
  'Inhambane',
  'Sofala',
  'Manica',
  'Tete',
  'Zambézia',
  'Nampula',
  'Cabo Delgado',
  'Niassa'
];

const categoriasPopulares = [
  'Música',
  'Arte e Cultura',
  'Esportes',
  'Negócios',
  'Educação',
  'Gastronomia',
  'Tecnologia',
  'Saúde',
  'Moda',
  'Comunidade',
  'Religião',
  'Festival'
];

const moedas = [
  { codigo: 'MZN', simbolo: 'MT', nome: 'Metical' },
  { codigo: 'USD', simbolo: '$', nome: 'Dólar Americano' },
  { codigo: 'ZAR', simbolo: 'R', nome: 'Rand Sul-Africano' },
  { codigo: 'EUR', simbolo: '€', nome: 'Euro' }
];

const steps = ['Informações Básicas', 'Localização', 'Ingressos', 'Organização', 'Revisão'];

const Eventos = ({ user }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [evento, setEvento] = useState({
    id: uuidv4(),
    titulo: '',
    descricao: '',
    dataInicio: '',
    dataFim: '',
    horaInicio: '',
    horaFim: '',
    local: '',
    endereco: '',
    cidade: '',
    provincia: '',
    bairro: '',
    pais: 'Moçambique',
    valorIngresso: '',
    moeda: 'MZN',
    capacidade: '',
    organizador: user.nome,
    emailOrganizador: user.email,
    telefoneOrganizador: user.contacto,
    website: user?.social?.website || '',
    imagemDestaque: null,
    imagemDestaqueURL: '',
    links: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      outros: []
    },
    categorias: [],
    tipoEvento: 'Presencial',
    status: 'Ativo',
    termosAceitos: false,
    tipoCadastro: 'simples',
    linkExterno: '',
    destaque: false,
    tags: [],
    formaPagamento: ['Dinheiro'],
    incluiCertificado: false,
    publicoAlvo: '',
    restricaoIdade: '',
    acessibilidade: false,
    estacionamento: false,
    traducoes: [],
    programacao: [],
    patrocinadores: []
  });

  const [novoLink, setNovoLink] = useState({ nome: '', url: '' });
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaTag, setNovaTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewDialog, setPreviewDialog] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [novoPatrocinador, setNovoPatrocinador] = useState({ nome: '', website: '', logo: null, logoURL: '' });
  const [novaSessao, setNovaSessao] = useState({ titulo: '', horario: '', palestrante: '' });

  // Preencher automaticamente a data de término igual à de início
  useEffect(() => {
    if (evento.dataInicio && !evento.dataFim) {
      setEvento(prev => ({ ...prev, dataFim: evento.dataInicio }));
    }
  }, [evento.dataInicio, evento.dataFim]);

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Informações básicas
        if (!evento.titulo) {
          setErrorMessage("O título do evento é obrigatório");
          setErrorDialog(true);
          return false;
        }
        if (evento.tipoCadastro === 'simples' && !evento.imagemDestaque) {
          setErrorMessage("O cartaz do evento é obrigatório para cadastro simples");
          setErrorDialog(true);
          return false;
        }
        if (evento.tipoCadastro === 'completo' && !evento.descricao) {
          setErrorMessage("A descrição do evento é obrigatória");
          setErrorDialog(true);
          return false;
        }
        return true;
      
      case 1: // Localização
        if (evento.tipoEvento !== 'Online' && !evento.local) {
          setErrorMessage("O local do evento é obrigatório para eventos presenciais");
          setErrorDialog(true);
          return false;
        }
        if (evento.tipoEvento !== 'Online' && !evento.provincia) {
          setErrorMessage("A província é obrigatória para eventos presenciais");
          setErrorDialog(true);
          return false;
        }
        return true;
      
      case 2: // Ingressos
        // Sem validações obrigatórias
        return true;
      
      case 3: // Organização
        if (!evento.organizador || !evento.emailOrganizador) {
          setErrorMessage("Informações do organizador são obrigatórias");
          setErrorDialog(true);
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEvento(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLinkChange = (e) => {
    const { name, value } = e.target;
    setEvento(prev => ({
      ...prev,
      links: {
        ...prev.links,
        [name]: value
      }
    }));
  };

  const addNovoLink = () => {
    if (novoLink.nome && novoLink.url) {
      setEvento(prev => ({
        ...prev,
        links: {
          ...prev.links,
          outros: [...prev.links.outros, { ...novoLink, id: uuidv4() }]
        }
      }));
      setNovoLink({ nome: '', url: '' });
    }
  };

  const removeLink = (id) => {
    setEvento(prev => ({
      ...prev,
      links: {
        ...prev.links,
        outros: prev.links.outros.filter(link => link.id !== id)
      }
    }));
  };

  const addCategoria = () => {
    if (novaCategoria && !evento.categorias.includes(novaCategoria)) {
      setEvento(prev => ({
        ...prev,
        categorias: [...prev.categorias, novaCategoria]
      }));
      setNovaCategoria('');
    }
  };

  const removeCategoria = (categoria) => {
    setEvento(prev => ({
      ...prev,
      categorias: prev.categorias.filter(c => c !== categoria)
    }));
  };

  const addTag = () => {
    if (novaTag && !evento.tags.includes(novaTag)) {
      setEvento(prev => ({
        ...prev,
        tags: [...prev.tags, novaTag]
      }));
      setNovaTag('');
    }
  };

  const removeTag = (tag) => {
    setEvento(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleImageUpload = async (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const storageRef = ref(storage, `eventos/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (tipo === 'destaque') {
        setEvento(prev => ({
          ...prev,
          imagemDestaque: file,
          imagemDestaqueURL: downloadURL
        }));
      } else if (tipo === 'patrocinador') {
        setNovoPatrocinador(prev => ({
          ...prev,
          logo: file,
          logoURL: downloadURL
        }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setErrorMessage("Erro ao carregar a imagem. Tente novamente.");
      setErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const addPatrocinador = () => {
    if (novoPatrocinador.nome && novoPatrocinador.logoURL) {
      setEvento(prev => ({
        ...prev,
        patrocinadores: [...prev.patrocinadores, { ...novoPatrocinador, id: uuidv4() }]
      }));
      setNovoPatrocinador({ nome: '', website: '', logo: null, logoURL: '' });
    }
  };

  const removePatrocinador = (id) => {
    setEvento(prev => ({
      ...prev,
      patrocinadores: prev.patrocinadores.filter(p => p.id !== id)
    }));
  };

  const addSessao = () => {
    if (novaSessao.titulo && novaSessao.horario) {
      setEvento(prev => ({
        ...prev,
        programacao: [...prev.programacao, { ...novaSessao, id: uuidv4() }]
      }));
      setNovaSessao({ titulo: '', horario: '', palestrante: '' });
    }
  };

  const removeSessao = (id) => {
    setEvento(prev => ({
      ...prev,
      programacao: prev.programacao.filter(s => s.id !== id)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação final
      if (!evento.termosAceitos) {
        throw new Error("Você deve aceitar os termos e condições");
      }

      // Preparar dados do evento
      const eventData = {
        id: evento.id,
        titulo: evento.titulo,
        tipoCadastro: evento.tipoCadastro,
        criadoPor: {
          uid: user.id,
          nome: user.nome,
          email: user.email
        },
        criadoEm: new Date().toISOString(),
        status: evento.status,
        destaque: evento.destaque,
        visualizacoes: 0,
        curtidas: 0
      };

      // Adicionar campos baseados no tipo de cadastro
      if (evento.tipoCadastro === 'simples') {
        eventData.imagemDestaqueURL = evento.imagemDestaqueURL;
        eventData.linkExterno = evento.linkExterno || null;
      } else {
        // Cadastro completo
        eventData.descricao = evento.descricao;
        eventData.dataInicio = evento.dataInicio;
        eventData.dataFim = evento.dataFim;
        eventData.horaInicio = evento.horaInicio;
        eventData.horaFim = evento.horaFim;
        eventData.local = evento.local;
        eventData.endereco = evento.endereco;
        eventData.cidade = evento.cidade;
        eventData.provincia = evento.provincia;
        eventData.bairro = evento.bairro;
        eventData.pais = evento.pais;
        eventData.valorIngresso = evento.valorIngresso;
        eventData.moeda = evento.moeda;
        eventData.capacidade = evento.capacidade;
        eventData.organizador = evento.organizador;
        eventData.emailOrganizador = evento.emailOrganizador;
        eventData.telefoneOrganizador = evento.telefoneOrganizador;
        eventData.website = evento.website;
        eventData.links = evento.links;
        eventData.categorias = evento.categorias;
        eventData.tipoEvento = evento.tipoEvento;
        eventData.imagemDestaqueURL = evento.imagemDestaqueURL || null;
        eventData.tags = evento.tags;
        eventData.formaPagamento = evento.formaPagamento;
        eventData.incluiCertificado = evento.incluiCertificado;
        eventData.publicoAlvo = evento.publicoAlvo;
        eventData.restricaoIdade = evento.restricaoIdade;
        eventData.acessibilidade = evento.acessibilidade;
        eventData.estacionamento = evento.estacionamento;
        eventData.traducoes = evento.traducoes;
        eventData.programacao = evento.programacao;
        eventData.patrocinadores = evento.patrocinadores;
      }

      const newEventRef = push(dbRef(db, 'eventos'));
      await set(newEventRef, eventData);

      setSuccessDialog(true);
      // Não limpar completamente o estado, apenas os campos essenciais
      setEvento(prev => ({
        ...prev,
        titulo: '',
        descricao: '',
        dataInicio: '',
        dataFim: '',
        horaInicio: '',
        horaFim: '',
        local: '',
        endereco: '',
        cidade: '',
        provincia: '',
        bairro: '',
        valorIngresso: '',
        capacidade: '',
        imagemDestaque: null,
        imagemDestaqueURL: '',
        links: {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: '',
          outros: []
        },
        categorias: [],
        linkExterno: '',
        termosAceitos: false,
        tags: [],
        programacao: [],
        patrocinadores: []
      }));
      setActiveStep(0);

    } catch (error) {
      console.error("Error saving event:", error);
      setErrorMessage(error.message || "Erro ao cadastrar evento. Tente novamente.");
      setErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Tipo de Cadastro
              </Typography>
              <RadioGroup
                name="tipoCadastro"
                value={evento.tipoCadastro}
                onChange={handleChange}
                row
              >
                <FormControlLabel
                  value="simples"
                  control={<Radio />}
                  label="Cartaz Simples (apenas imagem e link opcional)"
                />
                <FormControlLabel
                  value="completo"
                  control={<Radio />}
                  label="Informações Completas do Evento"
                />
              </RadioGroup>
            </Paper>

            {/* Cadastro Simples */}
            {evento.tipoCadastro === 'simples' && (
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Cartaz do Evento
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Título do Evento*"
                      name="titulo"
                      value={evento.titulo}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                      {evento.imagemDestaqueURL ? (
                        <Avatar
                          src={evento.imagemDestaqueURL}
                          variant="rounded"
                          sx={{ width: 150, height: 150, cursor: 'pointer' }}
                          onClick={() => setPreviewDialog(true)}
                        />
                      ) : (
                        <Box sx={{ width: 150, height: 150, border: '1px dashed grey', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="caption">Pré-visualização</Typography>
                        </Box>
                      )}
                      <Box>
                        <Button
                          variant="contained"
                          component="label"
                          disabled={loading}
                          startIcon={<ImageIcon />}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Upload de Cartaz'}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'destaque')}
                          />
                        </Button>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Formatos: JPG, PNG. Tamanho máximo: 5MB
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Link Externo (opcional)"
                      name="linkExterno"
                      value={evento.linkExterno}
                      onChange={handleChange}
                      type="url"
                      fullWidth
                      placeholder="https://"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Cadastro Completo - Informações Básicas */}
            {evento.tipoCadastro === 'completo' && (
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Informações Básicas</Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Título do Evento*"
                      name="titulo"
                      value={evento.titulo}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Descrição*"
                      name="descricao"
                      value={evento.descricao}
                      onChange={handleChange}
                      required
                      multiline
                      rows={4}
                      fullWidth
                      helperText="Descreva detalhadamente o seu evento. Inclua informações importantes, programação, atrações, etc."
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Data de Início*"
                      name="dataInicio"
                      value={evento.dataInicio}
                      onChange={handleChange}
                      type="date"
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DateIcon />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Data de Término*"
                      name="dataFim"
                      value={evento.dataFim}
                      onChange={handleChange}
                      type="date"
                      required
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DateIcon />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Hora de Início"
                      name="horaInicio"
                      value={evento.horaInicio}
                      onChange={handleChange}
                      type="time"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimeIcon />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Hora de Término"
                      name="horaFim"
                      value={evento.horaFim}
                      onChange={handleChange}
                      type="time"
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimeIcon />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CategoryIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Categorias</Typography>
                    </Box>
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {evento.categorias.map((categoria, index) => (
                        <Chip
                          key={index}
                          label={categoria}
                          onDelete={() => removeCategoria(categoria)}
                        />
                      ))}
                    </Box>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <TextField
                          label="Nova Categoria"
                          value={novaCategoria}
                          onChange={(e) => setNovaCategoria(e.target.value)}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Button
                          variant="outlined"
                          startIcon={<AddCircleOutline />}
                          onClick={addCategoria}
                          fullWidth
                        >
                          Adicionar
                        </Button>
                      </Grid>
                    </Grid>
                    <Typography variant="caption" display="block" sx={{ mt: 1, mb: 2 }}>
                      Sugestões: {categoriasPopulares.slice(0, 6).join(', ')}...
                    </Typography>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Tags (opcional)
                      </Typography>
                      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {evento.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            onDelete={() => removeTag(tag)}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <TextField
                            label="Nova Tag"
                            value={novaTag}
                            onChange={(e) => setNovaTag(e.target.value)}
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Button
                            variant="outlined"
                            startIcon={<AddCircleOutline />}
                            onClick={addTag}
                            fullWidth
                            size="small"
                          >
                            Adicionar Tag
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <LocationIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Localização</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Evento*</InputLabel>
                  <Select
                    name="tipoEvento"
                    value={evento.tipoEvento}
                    onChange={handleChange}
                    label="Tipo de Evento*"
                  >
                    <MenuItem value="Presencial">Presencial</MenuItem>
                    <MenuItem value="Online">Online</MenuItem>
                    <MenuItem value="Híbrido">Híbrido</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {evento.tipoEvento !== 'Online' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      label="Local/Nome do Espaço*"
                      name="local"
                      value={evento.local}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Endereço Completo"
                      name="endereco"
                      value={evento.endereco}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Bairro"
                      name="bairro"
                      value={evento.bairro}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Cidade"
                      name="cidade"
                      value={evento.cidade}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Província*</InputLabel>
                      <Select
                        name="provincia"
                        value={evento.provincia}
                        onChange={handleChange}
                        label="Província*"
                        required
                      >
                        {provinciasMocambique.map((provincia) => (
                          <MenuItem key={provincia} value={provincia}>
                            {provincia}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="País"
                      name="pais"
                      value={evento.pais}
                      onChange={handleChange}
                      fullWidth
                      disabled
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={evento.acessibilidade}
                          onChange={(e) => setEvento({...evento, acessibilidade: e.target.checked})}
                          name="acessibilidade"
                        />
                      }
                      label="Local com acessibilidade para pessoas com deficiência"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={evento.estacionamento}
                          onChange={(e) => setEvento({...evento, estacionamento: e.target.checked})}
                          name="estacionamento"
                        />
                      }
                      label="Estacionamento disponível"
                    />
                  </Grid>
                </>
              )}

              {evento.tipoEvento === 'Online' && (
                <Grid item xs={12}>
                  <TextField
                    label="Link para o Evento Online*"
                    name="linkExterno"
                    value={evento.linkExterno}
                    onChange={handleChange}
                    type="url"
                    fullWidth
                    placeholder="https://"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        );
      
      case 2:
        return (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TicketIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Ingressos</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Valor do Ingresso"
                  name="valorIngresso"
                  value={evento.valorIngresso}
                  onChange={handleChange}
                  type="number"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {moedas.find(m => m.codigo === evento.moeda)?.simbolo || 'MT'}
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Moeda</InputLabel>
                  <Select
                    name="moeda"
                    value={evento.moeda}
                    onChange={handleChange}
                    label="Moeda"
                  >
                    {moedas.map((moeda) => (
                      <MenuItem key={moeda.codigo} value={moeda.codigo}>
                        {moeda.nome} ({moeda.simbolo})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Capacidade Máxima"
                  name="capacidade"
                  value={evento.capacidade}
                  onChange={handleChange}
                  type="number"
                  fullWidth
                  helperText="Deixe em branco para capacidade ilimitada"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Público-Alvo (opcional)"
                  name="publicoAlvo"
                  value={evento.publicoAlvo}
                  onChange={handleChange}
                  fullWidth
                  helperText="Ex: Estudantes, Profissionais de TI, etc."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Restrição de Idade (opcional)"
                  name="restricaoIdade"
                  value={evento.restricaoIdade}
                  onChange={handleChange}
                  fullWidth
                  helperText="Ex: +18, Livre, +16"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={evento.incluiCertificado}
                      onChange={(e) => setEvento({...evento, incluiCertificado: e.target.checked})}
                      name="incluiCertificado"
                    />
                  }
                  label="Inclui certificado de participação"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Formas de Pagamento Aceitas
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={evento.formaPagamento.includes('Dinheiro')}
                        onChange={(e) => {
                          const novasFormas = e.target.checked
                            ? [...evento.formaPagamento, 'Dinheiro']
                            : evento.formaPagamento.filter(fp => fp !== 'Dinheiro');
                          setEvento({...evento, formaPagamento: novasFormas});
                        }}
                        name="formaPagamento"
                        value="Dinheiro"
                      />
                    }
                    label="Dinheiro"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={evento.formaPagamento.includes('MPesa')}
                        onChange={(e) => {
                          const novasFormas = e.target.checked
                            ? [...evento.formaPagamento, 'MPesa']
                            : evento.formaPagamento.filter(fp => fp !== 'MPesa');
                          setEvento({...evento, formaPagamento: novasFormas});
                        }}
                        name="formaPagamento"
                        value="MPesa"
                      />
                    }
                    label="MPesa"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={evento.formaPagamento.includes('Transferência')}
                        onChange={(e) => {
                          const novasFormas = e.target.checked
                            ? [...evento.formaPagamento, 'Transferência']
                            : evento.formaPagamento.filter(fp => fp !== 'Transferência');
                          setEvento({...evento, formaPagamento: novasFormas});
                        }}
                        name="formaPagamento"
                        value="Transferência"
                      />
                    }
                    label="Transferência Bancária"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={evento.formaPagamento.includes('Cartão')}
                        onChange={(e) => {
                          const novasFormas = e.target.checked
                            ? [...evento.formaPagamento, 'Cartão']
                            : evento.formaPagamento.filter(fp => fp !== 'Cartão');
                          setEvento({...evento, formaPagamento: novasFormas});
                        }}
                        name="formaPagamento"
                        value="Cartão"
                      />
                    }
                    label="Cartão de Crédito/Débito"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </Paper>
        );
      
      case 3:
        return (
          <>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Organizador</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nome do Organizador*"
                    name="organizador"
                    value={evento.organizador}
                    onChange={handleChange}
                    required
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="E-mail*"
                    name="emailOrganizador"
                    value={evento.emailOrganizador}
                    onChange={handleChange}
                    type="email"
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Telefone"
                    name="telefoneOrganizador"
                    value={evento.telefoneOrganizador}
                    onChange={handleChange}
                    type="tel"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">+258</InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Website"
                    name="website"
                    value={evento.website}
                    onChange={handleChange}
                    type="url"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LanguageIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LinkIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Redes Sociais</Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Facebook"
                    name="facebook"
                    value={evento.links.facebook}
                    onChange={handleLinkChange}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Facebook color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Instagram"
                    name="instagram"
                    value={evento.links.instagram}
                    onChange={handleLinkChange}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Instagram color="secondary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Twitter"
                    name="twitter"
                    value={evento.links.twitter}
                    onChange={handleLinkChange}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Twitter color="info" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="YouTube"
                    name="youtube"
                    value={evento.links.youtube}
                    onChange={handleLinkChange}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <YouTube color="error" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Outros Links
                  </Typography>
                  <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {evento.links.outros.map((link) => (
                      <Chip
                        key={link.id}
                        label={`${link.nome}: ${link.url}`}
                        onDelete={() => removeLink(link.id)}
                      />
                    ))}
                  </Box>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <TextField
                        label="Nome do Link"
                        value={novoLink.nome}
                        onChange={(e) => setNovoLink({...novoLink, nome: e.target.value})}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        label="URL"
                        value={novoLink.url}
                        onChange={(e) => setNovoLink({...novoLink, url: e.target.value})}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button
                        variant="outlined"
                        startIcon={<AddCircleOutline />}
                        onClick={addNovoLink}
                        fullWidth
                      >
                        Adicionar
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ImageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Imagem de Destaque</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                {evento.imagemDestaqueURL ? (
                  <Avatar
                    src={evento.imagemDestaqueURL}
                    variant="rounded"
                    sx={{ width: 150, height: 150, cursor: 'pointer' }}
                    onClick={() => setPreviewDialog(true)}
                  />
                ) : (
                  <Box sx={{ width: 150, height: 150, border: '1px dashed grey', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption">Pré-visualização</Typography>
                  </Box>
                )}
                <Button
                  variant="contained"
                  component="label"
                  disabled={loading}
                  startIcon={<ImageIcon />}
                >
                  {loading ? <CircularProgress size={24} /> : 'Upload de Imagem'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'destaque')}
                  />
                </Button>
              </Box>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Formatos: JPG, PNG. Tamanho máximo: 5MB. Dimensões recomendadas: 1200x630px
              </Typography>
            </Paper>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <QrCode2 color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Patrocinadores</Typography>
                </Box>
                <Tooltip title={evento.patrocinadores.length > 0 ? "" : "Adicione empresas ou organizações que patrocinam seu evento"}>
                  <InfoIcon color="action" />
                </Tooltip>
              </Box>

              {evento.patrocinadores.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {evento.patrocinadores.map((patrocinador) => (
                    <Grid item xs={12} sm={6} md={4} key={patrocinador.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                          {patrocinador.logoURL && (
                            <Avatar src={patrocinador.logoURL} sx={{ mr: 2 }} />
                          )}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1">{patrocinador.nome}</Typography>
                            {patrocinador.website && (
                              <Typography variant="caption" color="text.secondary">
                                {patrocinador.website}
                              </Typography>
                            )}
                          </Box>
                          <IconButton size="small" onClick={() => removePatrocinador(patrocinador.id)}>
                            <Close />
                          </IconButton>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Nome do Patrocinador"
                    value={novoPatrocinador.nome}
                    onChange={(e) => setNovoPatrocinador({...novoPatrocinador, nome: e.target.value})}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Website (opcional)"
                    value={novoPatrocinador.website}
                    onChange={(e) => setNovoPatrocinador({...novoPatrocinador, website: e.target.value})}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<ImageIcon />}
                    fullWidth
                  >
                    Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'patrocinador')}
                    />
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<AddCircleOutline />}
                    onClick={addPatrocinador}
                    disabled={!novoPatrocinador.nome || !novoPatrocinador.logoURL}
                  >
                    Adicionar Patrocinador
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            <FormControlLabel
              control={
                <Switch
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  name="showAdvanced"
                />
              }
              label="Mostrar opções avançadas"
            />

            {showAdvanced && (
              <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Opções Avançadas
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Programação do Evento
                    </Typography>
                    
                    {evento.programacao.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        {evento.programacao.map((sessao) => (
                          <Paper key={sessao.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2">{sessao.titulo}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {sessao.horario} {sessao.palestrante && `| ${sessao.palestrante}`}
                                </Typography>
                              </Box>
                              <IconButton size="small" onClick={() => removeSessao(sessao.id)}>
                                <Close />
                              </IconButton>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    )}
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={5}>
                        <TextField
                          label="Título da Sessão"
                          value={novaSessao.titulo}
                          onChange={(e) => setNovaSessao({...novaSessao, titulo: e.target.value})}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Horário"
                          value={novaSessao.horario}
                          onChange={(e) => setNovaSessao({...novaSessao, horario: e.target.value})}
                          fullWidth
                          placeholder="Ex: 09:00 - 10:30"
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Palestrante (opcional)"
                          value={novaSessao.palestrante}
                          onChange={(e) => setNovaSessao({...novaSessao, palestrante: e.target.value})}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <Button
                          variant="contained"
                          onClick={addSessao}
                          disabled={!novaSessao.titulo || !novaSessao.horario}
                          sx={{ minWidth: 'auto' }}
                        >
                          <AddCircleOutline />
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Idiomas de Tradução</InputLabel>
                      <Select
                        multiple
                        value={evento.traducoes}
                        onChange={(e) => setEvento({...evento, traducoes: e.target.value})}
                        label="Idiomas de Tradução"
                        renderValue={(selected) => selected.join(', ')}
                      >
                        <MenuItem value="Português">Português</MenuItem>
                        <MenuItem value="Inglês">Inglês</MenuItem>
                        <MenuItem value="Espanhol">Espanhol</MenuItem>
                        <MenuItem value="Francês">Francês</MenuItem>
                        <MenuItem value="Changana">Changana</MenuItem>
                        <MenuItem value="Macua">Macua</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={evento.destaque}
                          onChange={(e) => setEvento({...evento, destaque: e.target.checked})}
                          name="destaque"
                        />
                      }
                      label="Destacar este evento na plataforma (pode haver custos adicionais)"
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}
          </>
        );
      
      case 4:
        return (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Revisão do Evento
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Revise todas as informações antes de publicar seu evento.
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Informações Básicas
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography><strong>Título:</strong> {evento.titulo || "Não informado"}</Typography>
                  <Typography><strong>Data:</strong> {evento.dataInicio ? new Date(evento.dataInicio).toLocaleDateString('pt-MZ') : "Não informada"} {evento.dataFim && evento.dataFim !== evento.dataInicio ? ` a ${new Date(evento.dataFim).toLocaleDateString('pt-MZ')}` : ''}</Typography>
                  <Typography><strong>Horário:</strong> {evento.horaInicio || "Não informado"} {evento.horaFim ? ` às ${evento.horaFim}` : ''}</Typography>
                  <Typography><strong>Categorias:</strong> {evento.categorias.length > 0 ? evento.categorias.join(', ') : "Não informadas"}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Localização
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography><strong>Tipo:</strong> {evento.tipoEvento}</Typography>
                  {evento.tipoEvento !== 'Online' && (
                    <>
                      <Typography><strong>Local:</strong> {evento.local || "Não informado"}</Typography>
                      <Typography><strong>Endereço:</strong> {evento.endereco || "Não informado"}</Typography>
                      <Typography><strong>Província:</strong> {evento.provincia || "Não informada"}</Typography>
                    </>
                  )}
                  {evento.tipoEvento === 'Online' && (
                    <Typography><strong>Link:</strong> {evento.linkExterno || "Não informado"}</Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Ingressos
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography>
                    <strong>Valor:</strong> {evento.valorIngresso ? `${evento.valorIngresso} ${evento.moeda}` : "Gratuito"}
                  </Typography>
                  <Typography><strong>Capacidade:</strong> {evento.capacidade || "Ilimitada"}</Typography>
                  {evento.publicoAlvo && (
                    <Typography><strong>Público-Alvo:</strong> {evento.publicoAlvo}</Typography>
                  )}
                  {evento.restricaoIdade && (
                    <Typography><strong>Restrição de Idade:</strong> {evento.restricaoIdade}</Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Organizador
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography><strong>Nome:</strong> {evento.organizador || "Não informado"}</Typography>
                  <Typography><strong>E-mail:</strong> {evento.emailOrganizador || "Não informado"}</Typography>
                  {evento.telefoneOrganizador && (
                    <Typography><strong>Telefone:</strong> +258 {evento.telefoneOrganizador}</Typography>
                  )}
                </Box>
              </Grid>
              
              {evento.imagemDestaqueURL && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Imagem de Destaque
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Avatar
                      src={evento.imagemDestaqueURL}
                      variant="rounded"
                      sx={{ width: 200, height: 200 }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        );
      
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <EventIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" component="h1">
            Cadastro de Evento em Moçambique
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={handleSubmit}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
            >
              Voltar
            </Button>

            {activeStep === steps.length - 1 ? (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setPreviewDialog(true)}
                  startIcon={<Visibility />}
                >
                  Pré-visualizar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                >
                  {loading ? 'Publicando...' : 'Publicar Evento'}
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
              >
                Próximo
              </Button>
            )}
          </Box>

          {activeStep === steps.length - 1 && (
            <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="termosAceitos"
                    checked={evento.termosAceitos}
                    onChange={handleChange}
                    required
                  />
                }
                label="Confirmo que todas as informações fornecidas são corretas e concordo com os termos de uso.*"
              />

              <Box sx={{ mt: 3, mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Status do Evento</InputLabel>
                  <Select
                    name="status"
                    value={evento.status}
                    onChange={handleChange}
                    label="Status do Evento"
                  >
                    <MenuItem value="Ativo">Publicar Imediatamente</MenuItem>
                    <MenuItem value="Rascunho">Salvar como Rascunho</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          )}
        </form>
      </Paper>

      {/* Success Dialog */}
      <Dialog open={successDialog} onClose={() => setSuccessDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sucesso</DialogTitle>
        <DialogContent>
          <Typography>Evento cadastrado com sucesso!</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessDialog(false)}>Continuar</Button>
          <Button onClick={() => window.location.reload()} variant="contained">
            Cadastrar Novo Evento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialog} onClose={() => setErrorDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Erro</DialogTitle>
        <DialogContent>
          <Typography color="error">{errorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialog(false)}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Pré-visualização do Evento</DialogTitle>
        <DialogContent>
          <Card>
            {evento.imagemDestaqueURL && (
              <CardMedia
                component="img"
                height="240"
                image={evento.imagemDestaqueURL}
                alt={evento.titulo}
              />
            )}
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                {evento.titulo || "Título do Evento"}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {evento.descricao || "Descrição do evento aparecerá aqui."}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DateIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {evento.dataInicio ? new Date(evento.dataInicio).toLocaleDateString('pt-MZ', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : "Data a definir"}
                  {evento.horaInicio && ` • ${evento.horaInicio}`}
                  {evento.horaFim && ` - ${evento.horaFim}`}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {evento.tipoEvento === 'Online' ? 'Evento Online' : `${evento.local || "Local a definir"}, ${evento.cidade || "Cidade"}`}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TicketIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {evento.valorIngresso ? `Ingressos: ${evento.valorIngresso} ${evento.moeda}` : "Entrada Gratuita"}
                </Typography>
              </Box>
              
              {evento.categorias.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {evento.categorias.map((categoria, index) => (
                    <Chip key={index} label={categoria} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Eventos;