import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import BackButton from '../BackButton';
import { useNavigate } from 'react-router-dom';

const PortalDesk = ({ user }) => {
  const [activeTab, setActiveTab] = useState('publish');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [validity, setValidity] = useState('');
  const [file, setFile] = useState(null);
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

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
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
  ];

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !validity) {
      showSnackbar('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    setLoading(true);
    try {
      let fileUrl = '';
      let fileFormat = '';

      if (file) {
        const fileNameParts = file.name.split('.');
        fileFormat = fileNameParts[fileNameParts.length - 1].toLowerCase();
        const storageReference = storageRef(storage, `announcements/${file.name}`);
        await uploadBytes(storageReference, file);
        fileUrl = await getDownloadURL(storageReference);
      }

      const newAnnouncement = {
        title,
        content,
        validity,
        fileUrl,
        fileFormat,
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
      setFile(null);
      setValidity('');
      showSnackbar('Anúncio publicado com sucesso!');
      fetchAnnouncements();
    } catch (error) {
      console.error('Erro ao publicar anúncio:', error);
      showSnackbar('Erro ao publicar anúncio.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(db, 'publicAnnouncements'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const filteredData = Object.entries(data)
          .filter(([id, anuncio]) => anuncio.company.id === user.id)
          .map(([id, value]) => ({ id, ...value }));
        setAnnouncements(filteredData);
      }
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
      showSnackbar('Erro ao carregar anúncios.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = (action, announcement) => {
    setModalAction(action);
    setSelectedAnnouncement(announcement.id);
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
        fileUrl: selectedAnnouncement.fileUrl,
      });
      setActiveTab('edit');
      setOpenModal(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fileUrl = editingData.fileUrl;

      if (file) {
        const storageReference = storageRef(storage, `announcements/${file.name}`);
        await uploadBytes(storageReference, file);
        fileUrl = await getDownloadURL(storageReference);
      }

      const updatedAnnouncement = {
        ...editingData,
        fileUrl,
        date: new Date().toISOString(),
      };

      await set(ref(db, `publicAnnouncements/${editingId}`), updatedAnnouncement);
      showSnackbar('Anúncio atualizado com sucesso!');
      setEditingId(null);
      setEditingData({});
      setFile(null);
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

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <Box className="container mx-auto p-6" sx={{ backgroundColor: '#f5f5f5' }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Setor Público - Anúncios
      </Typography>
      <Box display="flex" mb={4}>
        <Button
          variant={activeTab === 'publish' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('publish')}
          sx={{ marginRight: 2 }}
        >
          Publicar Anúncio
        </Button>
        <Button
          variant={activeTab === 'view' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('view')}
        >
          Ver Anúncios
        </Button>
      </Box>

      {activeTab === 'publish' && (
        <form onSubmit={handleSubmit}>
          <TextField
            label="Título do Anúncio"
            variant="outlined"
            fullWidth
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Box sx={{ marginBottom: 2 }}>
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
              placeholder="Escreva aqui..."
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
          />
          <Button
            variant="contained"
            component="label"
            sx={{ marginBottom: 2 }}
          >
            Carregar Arquivo
            <input
              type="file"
              hidden
              onChange={(e) => setFile(e.target.files[0])}
            />
          </Button>
          <Box>
            {file && (
              <Typography variant="body2" color="textSecondary">
                {file.name}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            sx={{ marginTop: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Publicar Anúncio'}
          </Button>
        </form>
      )}

      {activeTab === 'view' && (
        <Box mt={4}>
          <TextField
            label="Buscar Anúncio"
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
          />
          <Grid container spacing={3}>
            {loading ? (
              <CircularProgress />
            ) : filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement) => (
                <Grid item xs={12} sm={6} md={4} key={announcement.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent onClick={() => handleViewDetails(announcement.id)} style={{ cursor: 'pointer' }}>
                      <Typography variant="h6" gutterBottom>
                        {announcement.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Empresa: {announcement.company.nome}
                      </Typography>
                      {announcement.fileUrl && (
                        <Typography variant="body2" color="textSecondary">
                          <a href={announcement.fileUrl} target="_blank" rel="noopener noreferrer">
                            Ver Arquivo
                          </a>
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <Tooltip title="Editar">
                        <IconButton onClick={() => confirmAction('edit', announcement)}>
                          <EditIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton onClick={() => confirmAction('delete', announcement)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                Nenhum anúncio publicado.
              </Typography>
            )}
          </Grid>
        </Box>
      )}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>
          {modalAction === 'delete' ? 'Excluir Anúncio' : 'Editar Anúncio'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {modalAction === 'delete'
              ? 'Você tem certeza que deseja excluir este anúncio?'
              : 'Você tem certeza que deseja editar este anúncio?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="default">
            Cancelar
          </Button>
          <Button
            color="primary"
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PortalDesk;