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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { set, push, ref as dbRef, onValue, remove, update } from 'firebase/database';
import { db, storage } from '../../fb';

// Constants
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

const moedas = ['MZN', 'USD', 'ZAR', 'EUR'];

// Initial State
const initialEventoState = (user) => ({
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
  tipoEvento: 'Presencial',
  status: 'Ativo',
  termosAceitos: false,
  tipoCadastro: 'simples',
  linkExterno: ''
});

// Sub-components
const RegistrationTypeSection = ({ evento, handleChange }) => (
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
);

const SimpleRegistrationSection = ({ evento, handleChange, handleImageUpload, loading }) => (
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
);

const BasicInfoSection = ({ evento, handleChange }) => (
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
);

const LocationSection = ({ evento, handleChange, provinciasMocambique }) => (
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

    </Grid>
  </Paper>
);

const TicketsSection = ({ evento, handleChange, moedas }) => (
  <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
      <TicketIcon color="primary" sx={{ mr: 1 }} />
      <Typography variant="h6">Ingressos(Opcional)</Typography>
    </Box>

    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <TextField
          label="Valor do Ingresso"
          name="valorIngresso"
          value={evento.valorIngresso}
          onChange={handleChange}
          type="number"
          fullWidth
        />
      </Grid>
      <Grid item xs={12} md={4}>
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
);

const OrganizerSection = ({ evento, handleChange }) => (
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
);

const SocialMediaSection = ({ evento, handleLinkChange, novoLink, setNovoLink, addNovoLink, removeLink }) => {
  // Garantir que outros links seja sempre um array
  const outrosLinks = evento.links?.outros || [];
  
  return (
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
            value={evento.links?.facebook || ''}
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
            value={evento.links?.instagram || ''}
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
            value={evento.links?.twitter || ''}
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
            value={evento.links?.youtube || ''}
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
            {outrosLinks.map((link, index) => (
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
  );
};


const ImageSection = ({ evento, handleImageUpload, loading }) => (
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
);

const TermsAndSubmitSection = ({ evento, handleChange, mode, loading, resetForm }) => (
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
      {loading ? <CircularProgress size={24} /> : mode === 'create' ? 'Cadastrar Evento' : 'Atualizar Evento'}
    </Button>

    {mode === 'edit' && (
      <Button
        variant="outlined"
        color="secondary"
        size="large"
        fullWidth
        sx={{ mt: 2 }}
        onClick={resetForm}
      >
        Cancelar Edição
      </Button>
    )}
  </Paper>
);

const MyEventsSection = ({ meusEventos, handleEdit, handleDeleteConfirm }) => (
  <Paper elevation={3} sx={{ p: 4 }}>
    <Typography variant="h5" gutterBottom>
      Meus Eventos
    </Typography>
    {meusEventos.length === 0 ? (
      <Typography color="textSecondary">Você ainda não cadastrou eventos.</Typography>
    ) : (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Data Início</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {meusEventos.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell>{ev.titulo}</TableCell>
                <TableCell>{ev.dataInicio || 'N/A'}</TableCell>
                <TableCell>{ev.status}</TableCell>
                <TableCell>
                  <Tooltip title="Editar">
                    <IconButton onClick={() => handleEdit(ev)}>
                      <EditIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Deletar">
                    <IconButton onClick={() => handleDeleteConfirm(ev.id, ev.imagemDestaqueURL)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Paper>
);

// Main Component
const Eventos = ({ user }) => {
  const [evento, setEvento] = useState(initialEventoState(user));
  const [novoLink, setNovoLink] = useState({ nome: '', url: '' });
  const [novaCategoria, setNovaCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [meusEventos, setMeusEventos] = useState([]);
  const [mode, setMode] = useState('create');
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    const eventosRef = dbRef(db, 'eventos');
    const unsubscribe = onValue(eventosRef, (snapshot) => {
      const data = snapshot.val();
      const eventosList = [];
      for (let id in data) {
        if (data[id].criadoPor?.uid === user.id) {
          eventosList.push({ id, ...data[id] });
        }
      }
      setMeusEventos(eventosList);
    });

    return () => unsubscribe();
  }, [user.id]);

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


  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const ref = storageRef(storage, `eventos/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(ref, file);
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

  const validateForm = () => {
    if (!evento.titulo) {
      throw new Error("O título do evento é obrigatório");
    }
    if (evento.tipoCadastro === 'simples' && !evento.imagemDestaqueURL) {
      throw new Error("O cartaz do evento é obrigatório para cadastro simples");
    }
    if (evento.tipoCadastro === 'completo') {
      if (!evento.descricao) throw new Error("A descrição é obrigatória");
      if (!evento.dataInicio || !evento.dataFim) throw new Error("Datas de início e fim são obrigatórias");
      if (new Date(evento.dataFim) < new Date(evento.dataInicio)) throw new Error("Data de fim deve ser após a data de início");
      if (!evento.local) throw new Error("O local é obrigatório");
      if (!evento.provincia) throw new Error("A província é obrigatória");
      if (!evento.organizador || !evento.emailOrganizador) throw new Error("Informações do organizador são obrigatórias");
    }
    if (!evento.termosAceitos) throw new Error("Você deve aceitar os termos");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      validateForm();

      const eventData = {
        titulo: evento.titulo,
        tipoCadastro: evento.tipoCadastro,
        criadoPor: {
          uid: user.id,
          nome: user.nome,
          email: user.email
        },
        atualizadoEm: new Date().toISOString(),
        status: evento.status
      };

      if (evento.tipoCadastro === 'simples') {
        eventData.imagemDestaqueURL = evento.imagemDestaqueURL;
        eventData.linkExterno = evento.linkExterno || null;
      } else {
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
        eventData.tipoEvento = evento.tipoEvento;
        eventData.imagemDestaqueURL = evento.imagemDestaqueURL || null;
      }

      if (mode === 'create') {
        eventData.criadoEm = new Date().toISOString();
        const newEventRef = push(dbRef(db, 'eventos'));
        await set(newEventRef, eventData);
      } else {
        await update(dbRef(db, `eventos/${selectedEventId}`), eventData);
      }

      setSuccessDialog(true);
      resetForm();
    } catch (error) {
      console.error("Error saving event:", error);
      setErrorMessage(error.message || "Erro ao cadastrar/editar evento. Tente novamente.");
      setErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEvento(initialEventoState(user));
    setMode('create');
    setSelectedEventId(null);
  };

  const handleEdit = (eventData) => {
    setEvento({
      ...eventData,
      termosAceitos: false
    });
    setMode('edit');
    setSelectedEventId(eventData.id);
    window.scrollTo(0, 0);
  };

  const handleDeleteConfirm = (eventId, imagemURL) => {
    setEventToDelete({ id: eventId, imagemURL });
    setConfirmDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      if (eventToDelete.imagemURL) {
        const imageRef = storageRef(storage, eventToDelete.imagemURL);
        await deleteObject(imageRef);
      }
      await remove(dbRef(db, `eventos/${eventToDelete.id}`));
      setSuccessDialog(true);
    } catch (error) {
      console.error("Error deleting event:", error);
      setErrorMessage("Erro ao deletar evento. Tente novamente.");
      setErrorDialog(true);
    } finally {
      setLoading(false);
      setConfirmDeleteDialog(false);
      setEventToDelete(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <EventIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" component="h1">
            {mode === 'create' ? 'Cadastro de Evento em Moçambique' : 'Editar Evento'}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <RegistrationTypeSection evento={evento} handleChange={handleChange} />

          {evento.tipoCadastro === 'simples' && (
            <SimpleRegistrationSection 
              evento={evento} 
              handleChange={handleChange} 
              handleImageUpload={handleImageUpload} 
              loading={loading} 
            />
          )}

          {evento.tipoCadastro === 'completo' && (
            <>
              <BasicInfoSection evento={evento} handleChange={handleChange} />
              <LocationSection 
                evento={evento} 
                handleChange={handleChange} 
                provinciasMocambique={provinciasMocambique} 
              />
              <TicketsSection evento={evento} handleChange={handleChange} moedas={moedas} />
              <OrganizerSection evento={evento} handleChange={handleChange} />
              <SocialMediaSection 
                evento={evento} 
                handleLinkChange={handleLinkChange} 
                novoLink={novoLink} 
                setNovoLink={setNovoLink} 
                addNovoLink={addNovoLink} 
                removeLink={removeLink} 
              />
              <ImageSection 
                evento={evento} 
                handleImageUpload={handleImageUpload} 
                loading={loading} 
              />
            </>
          )}

          <TermsAndSubmitSection 
            evento={evento} 
            handleChange={handleChange} 
            mode={mode} 
            loading={loading} 
            resetForm={resetForm} 
          />
        </form>
      </Paper>

      <MyEventsSection 
        meusEventos={meusEventos} 
        handleEdit={handleEdit} 
        handleDeleteConfirm={handleDeleteConfirm} 
      />

      {/* Success Dialog */}
      <Dialog open={successDialog} onClose={() => setSuccessDialog(false)}>
        <DialogTitle>Sucesso</DialogTitle>
        <DialogContent>
          <Typography>Operação realizada com sucesso!</Typography>
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

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteDialog} onClose={() => setConfirmDeleteDialog(false)}>
        <DialogTitle>Confirmar Deleção</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="error" sx={{ mr: 1 }} />
            <Typography>Tem certeza que deseja deletar este evento? Esta ação é irreversível.</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDialog(false)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete}>Deletar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Eventos;