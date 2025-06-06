import React, { useState, useEffect, useCallback } from 'react';
import { ref, push, get, set, remove } from 'firebase/database';
import { db, storage } from '../../fb';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';
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
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  CalendarToday,
  Business
} from '@mui/icons-material';
import BackButton from '../BackButton';
import { useNavigate } from 'react-router-dom';

const PortalDesk = ({ user }) => {
  const [activeTab, setActiveTab] = useState('publish');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [validity, setValidity] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const theme = useTheme();

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
    'image'
  ];

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !validity) {
      showSnackbar('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = '';
      let attachmentUrl = '';
      let attachmentFormat = '';

      if (imageFile) {
        const imageRef = storageRef(storage, `announcements/images/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      if (attachmentFile) {
        const fileNameParts = attachmentFile.name.split('.');
        attachmentFormat = fileNameParts[fileNameParts.length - 1].toLowerCase();
        const attachmentRef = storageRef(storage, `announcements/attachments/${attachmentFile.name}`);
        await uploadBytes(attachmentRef, attachmentFile);
        attachmentUrl = await getDownloadURL(attachmentRef);
      }

      const newAnnouncement = {
        title,
        content,
        validity,
        imageUrl,
        attachmentUrl,
        attachmentFormat,
        company: {
          nome: user.nome,
          logo: user.photoURL,
          provincia: user.provincia,
          id: user.id,
        },
        date: new Date().toISOString(),
      };

      const announcementsRef = ref(db, 'publicAnnouncements');
      const newAnnouncementRef = push(announcementsRef);
      const announcementId = newAnnouncementRef.key;
      newAnnouncement.id = announcementId;

      await set(ref(db, `publicAnnouncements/${announcementId}`), newAnnouncement);

      setTitle('');
      setContent('');
      setValidity('');
      setImageFile(null);
      setAttachmentFile(null);
      
      showSnackbar('Anúncio publicado com sucesso!');
      fetchAnnouncements();
    } catch (error) {
      console.error('Erro ao publicar anúncio:', error);
      showSnackbar('Erro ao publicar anúncio.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(db, 'publicAnnouncements'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const filteredData = Object.entries(data)
          .filter(([id, anuncio]) => anuncio.company.id === user.id)
          .map(([id, value]) => ({ id, ...value }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setAnnouncements(filteredData);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
      showSnackbar('Erro ao carregar anúncios.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const confirmAction = (action, announcement) => {
    setModalAction(action);
    setSelectedAnnouncement(announcement);
    setOpenModal(true);
  };

  const handleDelete = async () => {
    if (selectedAnnouncement) {
      try {
        await remove(ref(db, `publicAnnouncements/${selectedAnnouncement.id}`));
        showSnackbar('Anúncio excluído com sucesso!');
        fetchAnnouncements();
      } catch (error) {
        console.error('Erro ao deletar anúncio:', error);
        showSnackbar('Erro ao excluir anúncio.', 'error');
      } finally {
        setOpenModal(false);
      }
    }
  };

  const handleEdit = () => {
    if (selectedAnnouncement) {
      setEditingId(selectedAnnouncement.id);
      setEditingData({
        title: selectedAnnouncement.title,
        content: selectedAnnouncement.content,
        validity: selectedAnnouncement.validity,
        imageUrl: selectedAnnouncement.imageUrl,
        attachmentUrl: selectedAnnouncement.attachmentUrl,
      });
      setActiveTab('edit');
      setOpenModal(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = editingData.imageUrl;
      let attachmentUrl = editingData.attachmentUrl;
      let attachmentFormat = selectedAnnouncement?.attachmentFormat || '';

      // Upload da nova imagem se fornecida
      if (imageFile) {
        const imageRef = storageRef(storage, `announcements/images/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Upload do novo anexo se fornecido
      if (attachmentFile) {
        const fileNameParts = attachmentFile.name.split('.');
        attachmentFormat = fileNameParts[fileNameParts.length - 1].toLowerCase();
        const attachmentRef = storageRef(storage, `announcements/attachments/${attachmentFile.name}`);
        await uploadBytes(attachmentRef, attachmentFile);
        attachmentUrl = await getDownloadURL(attachmentRef);
      }

      const updatedAnnouncement = {
        ...editingData,
        imageUrl,
        attachmentUrl,
        attachmentFormat,
        date: new Date().toISOString(),
      };

      await set(ref(db, `publicAnnouncements/${editingId}`), updatedAnnouncement);
      showSnackbar('Anúncio atualizado com sucesso!');
      
      setEditingId(null);
      setEditingData({});
      setImageFile(null);
      setAttachmentFile(null);
      setActiveTab('view');
      fetchAnnouncements();
    } catch (error) {
      console.error('Erro ao atualizar anúncio:', error);
      showSnackbar('Erro ao atualizar anúncio.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/anuncio/${id}`);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return (
    <Box sx={{ 
      width: '100%', 
      p: 3,
      bgcolor: theme.palette.background.default,
    }}>
      <BackButton sx={{ mb: 3 }} />
      <Typography variant="h4" component="h1" sx={{ 
        mb: 3,
        fontWeight: 600,
        color: theme.palette.text.primary
      }}>
        Portal de Anúncios Públicos
      </Typography>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="Publicar Anúncio" value="publish" />
        <Tab label="Meus Anúncios" value="view" />
        {editingId && <Tab label="Editar Anúncio" value="edit" />}
      </Tabs>

      {activeTab === 'publish' && (
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Título do Anúncio"
            variant="outlined"
            fullWidth
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Conteúdo *
            </Typography>
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
              placeholder="Escreva o conteúdo do anúncio aqui..."
              style={{ 
                height: '200px',
                backgroundColor: theme.palette.background.paper,
                borderRadius: '4px'
              }}
            />
          </Box>
          
          <TextField
            label="Validade"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            margin="normal"
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
            inputProps={{
              min: new Date().toISOString().split("T")[0],
            }}
            required
            sx={{ mb: 2 }}
          />
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                fullWidth
              >
                Imagem da Notícia
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
              </Button>
              {imageFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {imageFile.name}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFileIcon />}
                fullWidth
              >
                Anexar Arquivo
                <input
                  type="file"
                  hidden
                  onChange={(e) => setAttachmentFile(e.target.files[0])}
                />
              </Button>
              {attachmentFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {attachmentFile.name}
                </Typography>
              )}
            </Grid>
          </Grid>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Publicar'}
          </Button>
        </Box>
      )}
      {activeTab === 'edit' && (
        <Box component="form" onSubmit={handleUpdate} sx={{ maxWidth: 800 }}>
          <TextField
            label="Título do Anúncio"
            variant="outlined"
            fullWidth
            margin="normal"
            value={editingData.title}
            onChange={(e) => setEditingData({...editingData, title: e.target.value})}
            required
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Conteúdo *
            </Typography>
            <ReactQuill
              value={editingData.content}
              onChange={(value) => setEditingData({...editingData, content: value})}
              modules={modules}
              formats={formats}
              placeholder="Escreva o conteúdo do anúncio aqui..."
              style={{ 
                height: '200px',
                backgroundColor: theme.palette.background.paper,
                borderRadius: '4px'
              }}
            />
          </Box>
          
          <TextField
            label="Validade *"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            margin="normal"
            value={editingData.validity}
            onChange={(e) => setEditingData({...editingData, validity: e.target.value})}
            inputProps={{
              min: new Date().toISOString().split("T")[0],
            }}
            required
            sx={{ mb: 2 }}
          />
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                fullWidth
              >
                {editingData.imageUrl ? 'Alterar Imagem' : 'Adicionar Imagem'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
              </Button>
              {editingData.imageUrl && !imageFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Imagem atual: <a href={editingData.imageUrl} target="_blank" rel="noopener noreferrer">Visualizar</a>
                </Typography>
              )}
              {imageFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Nova imagem: {imageFile.name}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFileIcon />}
                fullWidth
              >
                {editingData.attachmentUrl ? 'Alterar Anexo' : 'Adicionar Anexo'}
                <input
                  type="file"
                  hidden
                  onChange={(e) => setAttachmentFile(e.target.files[0])}
                />
              </Button>
              {editingData.attachmentUrl && !attachmentFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Anexo atual: <a href={editingData.attachmentUrl} target="_blank" rel="noopener noreferrer">Visualizar</a>
                </Typography>
              )}
              {attachmentFile && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Novo anexo: {attachmentFile.name}
                </Typography>
              )}
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ minWidth: 200 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Atualizar Anúncio'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setActiveTab('view');
                setEditingId(null);
                setEditingData({});
              }}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      )}
      {activeTab === 'view' && (
        <Box>
          <TextField
            label="Buscar anúncios"
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
            sx={{ mb: 3, maxWidth: 400 }}
          />
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress size={60} />
            </Box>
          ) : filteredAnnouncements.length > 0 ? (
            <Grid container spacing={3}>
              {filteredAnnouncements.map((announcement) => (
                <Grid item xs={12} sm={6} md={4} key={announcement.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[6]
                      },
                    }}
                  >
                    {announcement.imageUrl && (
                      <CardMedia
                        component="img"
                        height="160"
                        image={announcement.imageUrl}
                        alt={announcement.title}
                        onClick={() => handleViewDetails(announcement.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                    
                    <CardContent 
                      sx={{ flexGrow: 1, cursor: 'pointer' }}
                      onClick={() => handleViewDetails(announcement.id)}
                    >
                      <Typography variant="h6" gutterBottom>
                        {announcement.title}
                      </Typography>
                      
                      <Box
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '72px',
                          mb: 2
                        }}
                        dangerouslySetInnerHTML={{ __html: announcement.content }}
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar 
                          src={announcement.company?.logo} 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 1,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText'
                          }}
                        >
                          <Business fontSize="small" />
                        </Avatar>
                        <Typography variant="body2">
                          {announcement.company?.nome}
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" display="block" color="text.secondary">
                        <CalendarToday sx={{ fontSize: '0.8rem', verticalAlign: 'middle', mr: 0.5 }} />
                        {formatDate(announcement.date)}
                      </Typography>
                    </CardContent>
                    
                    <CardActions sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText'
                    }}>
                      {announcement.attachmentUrl && (
                        <Button
                          size="small"
                          color="inherit"
                          startIcon={<AttachFileIcon />}
                          href={announcement.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Anexo
                        </Button>
                      )}
                      
                      <Box>
                        <Tooltip title="Editar">
                          <IconButton 
                            size="small" 
                            color="inherit"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmAction('edit', announcement);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton 
                            size="small" 
                            color="inherit"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmAction('delete', announcement);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Nenhum anúncio encontrado {searchQuery ? 'com o termo buscado' : ''}.
            </Alert>
          )}
        </Box>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>
          {modalAction === 'delete' ? 'Confirmar Exclusão' : 'Editar Anúncio'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {modalAction === 'delete'
              ? 'Tem certeza que deseja excluir este anúncio permanentemente?'
              : 'Deseja editar este anúncio?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={modalAction === 'delete' ? handleDelete : handleEdit}
            color={modalAction === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            {modalAction === 'delete' ? 'Excluir' : 'Editar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PortalDesk;