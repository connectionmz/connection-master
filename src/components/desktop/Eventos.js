import React, { useState } from 'react';
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
  CircularProgress
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
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { set, push, ref as dbRef } from 'firebase/database';
import { db, storage } from '../../fb';


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

const Eventos = ({ user }) => {
  const [evento, setEvento] = useState({
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
    tipoCadastro: 'simples', // 'simples' ou 'completo'
    linkExterno: ''
  });

  const [novoLink, setNovoLink] = useState({ nome: '', url: '' });
  const [novaCategoria, setNovaCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
          outros: [...prev.links.outros, novoLink]
        }
      }));
      setNovoLink({ nome: '', url: '' });
    }
  };

  const removeLink = (index) => {
    setEvento(prev => ({
      ...prev,
      links: {
        ...prev.links,
        outros: prev.links.outros.filter((_, i) => i !== index)
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `eventos/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setEvento(prev => ({
        ...prev,
        imagemDestaque: file,
        imagemDestaqueURL: downloadURL
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
      setErrorMessage("Erro ao carregar a imagem. Tente novamente.");
      setErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (!evento.titulo) {
        throw new Error("O título do evento é obrigatório");
      }

      if (evento.tipoCadastro === 'simples' && !evento.imagemDestaque) {
        throw new Error("O cartaz do evento é obrigatório para cadastro simples");
      }

      // Prepare event data for database
      const eventData = {
        titulo: evento.titulo,
        tipoCadastro: evento.tipoCadastro,
        criadoPor: {
          uid: user.id,
          nome: user.nome,
          email: user.email
        },
        criadoEm: new Date().toISOString(),
        status: evento.status
      };

      // Add fields based on registration type
      if (evento.tipoCadastro === 'simples') {
        eventData.imagemDestaqueURL = evento.imagemDestaqueURL;
        eventData.linkExterno = evento.linkExterno || null;
      } else {
        // Full registration
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
      }

      const newEventRef = push(dbRef(db, 'eventos'));
      await set(newEventRef, eventData);

      setSuccessDialog(true);
      setEvento({
        ...evento,
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
        termosAceitos: false
      });

    } catch (error) {
      console.error("Error saving event:", error);
      setErrorMessage(error.message || "Erro ao cadastrar evento. Tente novamente.");
      setErrorDialog(true);
    } finally {
      setLoading(false);
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

        <form onSubmit={handleSubmit}>
          {/* Registration Type Selection */}
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

          {/* Simple Registration */}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {evento.imagemDestaqueURL ? (
                      <Avatar
                        src={evento.imagemDestaqueURL}
                        variant="rounded"
                        sx={{ width: 150, height: 150 }}
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
                    >
                      {loading ? <CircularProgress size={24} /> : 'Upload de Cartaz'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </Button>
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
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Full Registration */}
          {evento.tipoCadastro === 'completo' && (
            <>
              {/* Basic Information */}
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
                </Grid>
              </Paper>

              {/* Location Section */}
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
                </Grid>
              </Paper>

              {/* Tickets Section */}
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
                            {evento.moeda}
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Capacidade Máxima"
                      name="capacidade"
                      value={evento.capacidade}
                      onChange={handleChange}
                      type="number"
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Organizer Section */}
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

              {/* Social Media Section */}
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
                      {evento.links.outros.map((link, index) => (
                        <Chip
                          key={index}
                          label={`${link.nome}: ${link.url}`}
                          onDelete={() => removeLink(index)}
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
                          variant="contained"
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

              {/* Categories Section */}
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Categorias
                </Typography>
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
                      variant="contained"
                      startIcon={<AddCircleOutline />}
                      onClick={addCategoria}
                      fullWidth
                    >
                      Adicionar
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Image Section */}
              <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ImageIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Imagem de Destaque</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {evento.imagemDestaqueURL ? (
                    <Avatar
                      src={evento.imagemDestaqueURL}
                      variant="rounded"
                      sx={{ width: 150, height: 150 }}
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
                  >
                    {loading ? <CircularProgress size={24} /> : 'Upload de Imagem'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                </Box>
              </Paper>
            </>
          )}

          {/* Terms and Submit */}
          <Paper elevation={2} sx={{ p: 3 }}>
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
                  <MenuItem value="Ativo">Ativo</MenuItem>
                  <MenuItem value="Rascunho">Rascunho</MenuItem>
                  <MenuItem value="Cancelado">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="success"
              size="large"
              fullWidth
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Cadastrar Evento'}
            </Button>
          </Paper>
        </form>
      </Paper>

      {/* Success Dialog */}
      <Dialog open={successDialog} onClose={() => setSuccessDialog(false)}>
        <DialogTitle>Sucesso</DialogTitle>
        <DialogContent>
          <Typography>Evento cadastrado com sucesso!</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessDialog(false)}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialog} onClose={() => setErrorDialog(false)}>
        <DialogTitle>Erro</DialogTitle>
        <DialogContent>
          <Typography color="error">{errorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialog(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Eventos;