import React, { useState, useEffect, useCallback } from 'react';
import { ref, push, get, set, remove } from 'firebase/database';
import { db, storage } from '../../fb';
import { uploadBytes, getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Box,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Grid,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Button,
  Tabs,
  Tab,
  CardMedia,
  Avatar,
  useTheme,
  Chip,
  LinearProgress,
  Container,
  Fade,
  useMediaQuery,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  CalendarToday,
  Business,
  Lock,
  Close,
} from '@mui/icons-material';
import BackButton from '../BackButton';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PortalDesk = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Gerenciamento de estado
  const [activeTab, setActiveTab] = useState('view');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    validity: '',
    imageFile: null,
    attachmentFile: null,
  });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState({
    page: true,
    action: false,
    progress: 0,
  });
  const [editingId, setEditingId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Configuração do editor Quill
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
    'image',
  ];

  // Verificações de permissão
  const hasPublishPrivileges = user?.publicPainel === true;
  const isAnnouncementOwner = (announcement) =>
    announcement?.createdBy === user?.id || announcement?.company?.id === user?.id;

  // Funções auxiliares
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      validity: '',
      imageFile: null,
      attachmentFile: null,
    });
  };

  // Verificar duplicatas
  const checkDuplicateAnnouncement = (title, content, excludeId = null) => {
    return announcements.some(
      (announcement) =>
        announcement.id !== excludeId &&
        announcement.title.trim().toLowerCase() === title.trim().toLowerCase() &&
        announcement.content.replace(/<[^>]+>/g, '').trim().toLowerCase() ===
        content.replace(/<[^>]+>/g, '').trim().toLowerCase()
    );
  };

  // Busca de dados
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, page: true }));
      const snapshot = await get(ref(db, 'publicAnnouncements'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const announcementsArray = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
          formattedDate: format(new Date(value.date), 'dd MMM yyyy', { locale: ptBR }),
        }));

        const userAnnouncements = announcementsArray
          .filter((announcement) => isAnnouncementOwner(announcement))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setAnnouncements(userAnnouncements);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Erro ao carregar comunicados:', error);
      showSnackbar('Erro ao carregar comunicados', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, page: false }));
    }
  }, [user?.id]);

  // Operações CRUD
// Dentro do componente PortalDesk

// Operações CRUD
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!hasPublishPrivileges) {
    showSnackbar('Você não tem privilégios de publicação', 'error');
    return;
  }

  if (!formData.title || !formData.content || !formData.validity) {
    showSnackbar('Por favor, preencha todos os campos obrigatórios', 'error');
    return;
  }

  if (checkDuplicateAnnouncement(formData.title, formData.content)) {
    showSnackbar('Já existe um comunicado com o mesmo título e conteúdo', 'error');
    return;
  }

  setLoading((prev) => ({ ...prev, action: true, progress: 0 }));

  let progressInterval = null; // Declaração fora do try
  try {
    progressInterval = setInterval(() => {
      setLoading((prev) => ({
        ...prev,
        progress: Math.min(prev.progress + 10, 90),
      }));
    }, 500);

    const [imageUrl, attachmentUrl] = await Promise.all([
      formData.imageFile
        ? uploadFile(formData.imageFile, 'images')
        : Promise.resolve(''),
      formData.attachmentFile
        ? uploadFile(formData.attachmentFile, 'attachments')
        : Promise.resolve(''),
    ]);

    const newAnnouncement = {
      title: formData.title,
      content: formData.content,
      validity: formData.validity,
      imageUrl,
      attachmentUrl: attachmentUrl.url || '',
      attachmentFormat: attachmentUrl.format || '',
      company: {
        id: user.id,
        nome: user.nome || 'Usuário',
        logo: user.photoURL,
        provincia: user.provincia,
      },
      date: new Date().toISOString(),
      createdBy: user.id,
    };

    const newAnnouncementRef = push(ref(db, 'publicAnnouncements'));
    await set(newAnnouncementRef, newAnnouncement);

    setLoading((prev) => ({ ...prev, progress: 100 }));
    resetForm();
    showSnackbar('Comunicado publicado com sucesso!');
    fetchAnnouncements();
    setActiveTab('view');
  } catch (error) {
    console.error('Erro ao publicar comunicado:', error);
    showSnackbar('Erro ao publicar comunicado', 'error');
  } finally {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    setLoading((prev) => ({ ...prev, action: false, progress: 0 }));
  }
};

const uploadFile = async (file, type) => {
  const fileNameParts = file.name.split('.');
  const fileFormat = fileNameParts.pop().toLowerCase();
  const fileRef = storageRef(storage, `announcements/${type}/${Date.now()}_${file.name}`);

  const uploadTask = uploadBytesResumable(fileRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setLoading((prev) => ({ ...prev, progress: Math.min(progress, 90) }));
      },
      (error) => reject(error),
      async () => {
        const downloadUrl = await getDownloadURL(fileRef);
        resolve(type === 'attachments' ? { url: downloadUrl, format: fileFormat } : downloadUrl);
      }
    );
  });
};

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingId || !isAnnouncementOwner(selectedAnnouncement)) {
      showSnackbar('Ação não autorizada', 'error');
      return;
    }

    if (checkDuplicateAnnouncement(formData.title, formData.content, editingId)) {
      showSnackbar('Já existe um comunicado com o mesmo título e conteúdo', 'error');
      return;
    }

    setLoading((prev) => ({ ...prev, action: true, progress: 0 }));

    let progressInterval = null;
    try {
      progressInterval = setInterval(() => {
        setLoading((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 500);

      const [imageUrl, attachmentUrl] = await Promise.all([
        formData.imageFile
          ? uploadFile(formData.imageFile, 'images')
          : Promise.resolve(selectedAnnouncement.imageUrl),
        formData.attachmentFile
          ? uploadFile(formData.attachmentFile, 'attachments')
          : Promise.resolve({
              url: selectedAnnouncement.attachmentUrl,
              format: selectedAnnouncement.attachmentFormat,
            }),
      ]);

      const updatedAnnouncement = {
        ...selectedAnnouncement,
        title: formData.title,
        content: formData.content,
        validity: formData.validity,
        imageUrl,
        attachmentUrl: attachmentUrl.url,
        attachmentFormat: attachmentUrl.format,
        updatedAt: new Date().toISOString(),
      };

      await set(ref(db, `publicAnnouncements/${editingId}`), updatedAnnouncement);

      clearInterval(progressInterval);
      setLoading((prev) => ({ ...prev, progress: 100 }));

      resetForm();
      showSnackbar('Comunicado atualizado com sucesso!');
      setEditingId(null);
      fetchAnnouncements();
      setActiveTab('view');
    } catch (error) {
      console.error('Erro ao atualizar comunicado:', error);
      showSnackbar('Erro ao atualizar comunicado', 'error');
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setLoading((prev) => ({ ...prev, action: false, progress: 0 }));
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement || !isAnnouncementOwner(selectedAnnouncement)) {
      showSnackbar('Ação não autorizada', 'error');
      return;
    }

    setLoading((prev) => ({ ...prev, action: true, progress: 0 }));

    let progressInterval = null;
    try {
      progressInterval = setInterval(() => {
        setLoading((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 500);

      await remove(ref(db, `publicAnnouncements/${selectedAnnouncement.id}`));

      clearInterval(progressInterval);
      setLoading((prev) => ({ ...prev, progress: 100 }));

      showSnackbar('Comunicado excluído com sucesso!');
      fetchAnnouncements();
    } catch (error) {
      console.error('Erro ao excluir comunicado:', error);
      showSnackbar('Erro ao excluir comunicado', 'error');
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setLoading((prev) => ({ ...prev, action: false, progress: 0 }));
      setOpenModal(false);
    }
  };

  // Manipuladores de UI
  const handleTabChange = (event, newValue) => {
    if (newValue === 'publish' && !hasPublishPrivileges) {
      showSnackbar('Você precisa de privilégios de publicação', 'error');
      return;
    }
    setActiveTab(newValue);
  };

  const confirmAction = (action, announcement) => {
    if (!isAnnouncementOwner(announcement)) {
      showSnackbar('Você só pode modificar seus próprios comunicados', 'error');
      return;
    }

    setModalAction(action);
    setSelectedAnnouncement(announcement);
    setOpenModal(true);
  };

  const startEditing = (announcement) => {
    if (!isAnnouncementOwner(announcement)) {
      showSnackbar('Você só pode editar seus próprios comunicados', 'error');
      return;
    }

    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      validity: announcement.validity,
      imageFile: null,
      attachmentFile: null,
    });
    setSelectedAnnouncement(announcement);
    setActiveTab('edit');
  };

  const handleViewDetails = (id) => {
    navigate(`/comunicado/${id}`);
  };

  // Efeitos
  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user, fetchAnnouncements]);

  // Filtrar comunicados com base na pesquisa
  const filteredAnnouncements = announcements.filter((announcement) =>
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading.page) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Fade in={true} timeout={600}>
        <Box>
          <BackButton sx={{ mb: 3 }} />

          <Typography
            variant="h4"
            component="h1"
            sx={{
              mb: 3,
              fontWeight: 700,
              color: theme.palette.text.primary,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            Portal de Comunicados
          </Typography>

          {!hasPublishPrivileges && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              Você tem acesso apenas para visualização. Contate o administrador para privilégios de publicação.
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              mb: 4,
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
            }}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            centered={isMobile}
          >
            <Tab
              label={isMobile ? 'Publicar' : 'Publicar Comunicado'}
              value="publish"
              icon={hasPublishPrivileges ? null : <Lock fontSize="small" />}
              disabled={!hasPublishPrivileges}
              sx={{ fontWeight: 500 }}
            />
            <Tab
              label={isMobile ? 'Meus Comunicados' : 'Meus Comunicados'}
              value="view"
              sx={{ fontWeight: 500 }}
            />
            {editingId && (
              <Tab
                label={isMobile ? 'Editar' : 'Editar Comunicado'}
                value="edit"
                sx={{ fontWeight: 500 }}
              />
            )}
          </Tabs>

          {/* Aba de Publicação */}
          {activeTab === 'publish' && hasPublishPrivileges && (
            <Fade in={activeTab === 'publish'}>
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  maxWidth: 900,
                  mx: 'auto',
                  bgcolor: theme.palette.background.paper,
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  boxShadow: theme.shadows[3],
                }}
              >
                {loading.action && (
                  <LinearProgress
                    variant="determinate"
                    value={loading.progress}
                    sx={{ mb: 2, borderRadius: 2 }}
                  />
                )}
                <TextField
                  label="Título do Comunicado"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  required
                  disabled={loading.action}
                  sx={{ mb: 3 }}
                />

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                    Conteúdo *
                  </Typography>
                  <ReactQuill
                    value={formData.content}
                    onChange={(value) => handleFormChange('content', value)}
                    modules={modules}
                    formats={formats}
                    placeholder="Escreva o conteúdo do comunicado aqui..."
                    readOnly={loading.action}
                    style={{
                      height: isMobile ? '150px' : '200px',
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: '4px',
                      marginBottom: '24px',
                    }}
                  />
                </Box>

                <TextField
                  label="Válido Até"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  margin="normal"
                  value={formData.validity}
                  onChange={(e) => handleFormChange('validity', e.target.value)}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0],
                  }}
                  required
                  disabled={loading.action}
                  sx={{ mb: 3 }}
                />

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<ImageIcon />}
                      fullWidth
                      disabled={loading.action}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        py: 1.5,
                      }}
                    >
                      {isMobile ? 'Imagem' : 'Imagem em Destaque'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleFormChange('imageFile', e.target.files[0])}
                        disabled={loading.action}
                      />
                    </Button>
                    {formData.imageFile && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ mr: 1, color: theme.palette.text.secondary }}
                        >
                          {formData.imageFile.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleFormChange('imageFile', null)}
                          disabled={loading.action}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AttachFileIcon />}
                      fullWidth
                      disabled={loading.action}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        py: 1.5,
                      }}
                    >
                      {isMobile ? 'Anexo' : 'Adicionar Anexo'}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => handleFormChange('attachmentFile', e.target.files[0])}
                        disabled={loading.action}
                      />
                    </Button>
                    {formData.attachmentFile && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ mr: 1, color: theme.palette.text.secondary }}
                        >
                          {formData.attachmentFile.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleFormChange('attachmentFile', null)}
                          disabled={loading.action}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={loading.action}
                    sx={{
                      minWidth: { xs: 120, sm: 200 },
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 500,
                    }}
                  >
                    {loading.action ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Publicar'
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      resetForm();
                      setActiveTab('view');
                    }}
                    disabled={loading.action}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 500,
                    }}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Aba de Edição */}
          {activeTab === 'edit' && (
            <Fade in={activeTab === 'edit'}>
              <Box
                component="form"
                onSubmit={handleUpdate}
                sx={{
                  maxWidth: 900,
                  mx: 'auto',
                  bgcolor: theme.palette.background.paper,
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  boxShadow: theme.shadows[3],
                }}
              >
                {loading.action && (
                  <LinearProgress
                    variant="determinate"
                    value={loading.progress}
                    sx={{ mb: 2, borderRadius: 2 }}
                  />
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Editando: {selectedAnnouncement?.title}
                  </Typography>
                  <Button
                    startIcon={<Close />}
                    onClick={() => {
                      setEditingId(null);
                      setActiveTab('view');
                      resetForm();
                    }}
                    disabled={loading.action}
                    sx={{ textTransform: 'none' }}
                  >
                    Cancelar
                  </Button>
                </Box>

                <TextField
                  label="Título do Comunicado"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  required
                  disabled={loading.action}
                  sx={{ mb: 3 }}
                />

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                    Conteúdo *
                  </Typography>
                  <ReactQuill
                    value={formData.content}
                    onChange={(value) => handleFormChange('content', value)}
                    modules={modules}
                    formats={formats}
                    readOnly={loading.action}
                    style={{
                      height: isMobile ? '150px' : '200px',
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: '4px',
                      marginBottom: '24px',
                    }}
                  />
                </Box>

                <TextField
                  label="Válido Até *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  margin="normal"
                  value={formData.validity}
                  onChange={(e) => handleFormChange('validity', e.target.value)}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0],
                  }}
                  required
                  disabled={loading.action}
                  sx={{ mb: 3 }}
                />

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<ImageIcon />}
                      fullWidth
                      disabled={loading.action}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        py: 1.5,
                      }}
                    >
                      {selectedAnnouncement?.imageUrl ? 'Alterar Imagem' : 'Adicionar Imagem'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => handleFormChange('imageFile', e.target.files[0])}
                        disabled={loading.action}
                      />
                    </Button>
                    {selectedAnnouncement?.imageUrl && !formData.imageFile && (
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          Atual:
                          <Button
                            size="small"
                            href={selectedAnnouncement.imageUrl}
                            target="_blank"
                            rel="noopener"
                            sx={{ ml: 1, textTransform: 'none' }}
                          >
                            Visualizar
                          </Button>
                        </Typography>
                      </Box>
                    )}
                    {formData.imageFile && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ mr: 1, color: theme.palette.text.secondary }}
                        >
                          Nova: {formData.imageFile.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleFormChange('imageFile', null)}
                          disabled={loading.action}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AttachFileIcon />}
                      fullWidth
                      disabled={loading.action}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        py: 1.5,
                      }}
                    >
                      {selectedAnnouncement?.attachmentUrl ? 'Alterar Anexo' : 'Adicionar Anexo'}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => handleFormChange('attachmentFile', e.target.files[0])}
                        disabled={loading.action}
                      />
                    </Button>
                    {selectedAnnouncement?.attachmentUrl && !formData.attachmentFile && (
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          Atual:
                          <Button
                            size="small"
                            href={selectedAnnouncement.attachmentUrl}
                            target="_blank"
                            rel="noopener"
                            sx={{ ml: 1, textTransform: 'none' }}
                          >
                            Visualizar
                          </Button>
                        </Typography>
                      </Box>
                    )}
                    {formData.attachmentFile && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ mr: 1, color: theme.palette.text.secondary }}
                        >
                          Novo: {formData.attachmentFile.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleFormChange('attachmentFile', null)}
                          disabled={loading.action}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={loading.action}
                    sx={{
                      minWidth: { xs: 120, sm: 200 },
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 500,
                    }}
                  >
                    {loading.action ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Atualizar Comunicado'
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditingId(null);
                      setActiveTab('view');
                      resetForm();
                    }}
                    disabled={loading.action}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 500,
                    }}
                  >
                    Descartar Alterações
                  </Button>
                </Box>
              </Box>
            </Fade>
          )}

          {/* Aba de Visualização */}
          {activeTab === 'view' && (
            <Fade in={activeTab === 'view'}>
              <Box>
                <TextField
                  label="Pesquisar comunicados"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 4, maxWidth: { xs: '100%', sm: 400 }, borderRadius: 2 }}
                />

                {filteredAnnouncements.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                    {searchQuery
                      ? 'Nenhum comunicado corresponde à sua pesquisa'
                      : 'Você ainda não tem comunicados'}
                  </Alert>
                ) : (
                  <Grid container spacing={{ xs: 2, md: 3 }}>
                    {filteredAnnouncements.map((announcement) => (
                      <Grid item xs={12} sm={6} md={4} key={announcement.id}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.3s, box-shadow 0.3s',
                            borderRadius: 2,
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: theme.shadows[8],
                            },
                          }}
                        >
                          {announcement.imageUrl && (
                            <CardMedia
                              component="img"
                              height={isMobile ? '120' : '160'}
                              image={announcement.imageUrl}
                              alt={announcement.title}
                              onClick={() => handleViewDetails(announcement.id)}
                              sx={{ cursor: 'pointer', objectFit: 'cover' }}
                            />
                          )}

                          <CardContent
                            sx={{ flexGrow: 1, cursor: 'pointer', p: { xs: 2, sm: 3 } }}
                            onClick={() => handleViewDetails(announcement.id)}
                          >
                            <Typography
                              variant="h6"
                              gutterBottom
                              sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}
                            >
                              {announcement.title}
                            </Typography>

                            <Box
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                minHeight: { xs: '60px', sm: '72px' },
                                mb: 2,
                                color: theme.palette.text.secondary,
                              }}
                              dangerouslySetInnerHTML={{ __html: announcement.content }}
                            />

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar
                                src={announcement.company?.logo}
                                sx={{
                                  width: { xs: 28, sm: 32 },
                                  height: { xs: 28, sm: 32 },
                                  mr: 1,
                                  bgcolor: 'primary.main',
                                  color: 'primary.contrastText',
                                }}
                              >
                                <Business fontSize="small" />
                              </Avatar>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                {announcement.company?.nome}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                              >
                                <CalendarToday
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, verticalAlign: 'middle', mr: 0.5 }}
                                />
                                {announcement.formattedDate}
                              </Typography>

                              {announcement.validity && (
                                <Chip
                                  label={`Válido até ${format(new Date(announcement.validity), 'dd MMM', {
                                    locale: ptBR,
                                  })}`}
                                  size="small"
                                  color={new Date(announcement.validity) < new Date() ? 'error' : 'primary'}
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                />
                              )}
                            </Box>
                          </CardContent>

                          <CardActions
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              bgcolor: 'action.hover',
                              p: { xs: 1, sm: 2 },
                            }}
                          >
                            {announcement.attachmentUrl && (
                              <Button
                                size="small"
                                startIcon={<AttachFileIcon fontSize="small" />}
                                href={announcement.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ textTransform: 'none', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                {isMobile ? 'Anexo' : 'Ver Anexo'}
                              </Button>
                            )}

                            {isAnnouncementOwner(announcement) && (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(announcement);
                                    }}
                                    disabled={loading.action}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Excluir">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmAction('delete', announcement);
                                    }}
                                    disabled={loading.action}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Fade>
          )}

          {/* Diálogo de Confirmação */}
          <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 500 }}>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Tem certeza de que deseja excluir este comunicado permanentemente?
              </DialogContentText>
              {loading.action && (
                <LinearProgress
                  variant="determinate"
                  value={loading.progress}
                  sx={{ mt: 2, borderRadius: 2 }}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenModal(false)}
                color="inherit"
                disabled={loading.action}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                color="error"
                variant="contained"
                disabled={loading.action}
              >
                {loading.action ? <CircularProgress size={24} color="inherit" /> : 'Excluir'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar para notificações */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              sx={{ width: '100%', borderRadius: 2 }}
              variant="filled"
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
};

export default PortalDesk;