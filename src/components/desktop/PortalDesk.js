import React, { useState, useEffect } from 'react';
import { ref, push, get, set, remove } from 'firebase/database';
import { db, storage } from '../../fb';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Estilo do editor
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BackButton from '../BackButton';

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

  // Configuração do ReactQuill para desabilitar imagens e vídeos
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'], // Remova 'image' e 'video' da toolbar
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
    'link', // Remova 'image' e 'video' dos formatos permitidos
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      await push(ref(db, 'publicAnnouncements'), newAnnouncement);
      setTitle('');
      setContent('');
      setFile(null);
      setValidity('');
      fetchAnnouncements();
    } catch (error) {
      console.error('Erro ao publicar anúncio:', error);
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
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = (action, announcement) => {
    setModalAction(action);
    setSelectedAnnouncement(announcement);
    setOpenModal(true);
  };

  const handleDelete = async () => {
    if (selectedAnnouncement) {
      try {
        await remove(ref(db, `publicAnnouncements/${selectedAnnouncement.id}`));
        fetchAnnouncements();
        setOpenModal(false);
      } catch (error) {
        console.error('Erro ao deletar anúncio:', error);
      }
    }
  };

  const handleEdit = () => {
    if (selectedAnnouncement) {
      setEditingId(selectedAnnouncement.id);
      setEditingData({
        title: selectedAnnouncement.title,
        content: selectedAnnouncement.content,
        fileUrl: selectedAnnouncement.fileUrl,
        company: selectedAnnouncement.company.id,
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
      setEditingId(null);
      setEditingData({});
      setFile(null);
      setActiveTab('view');
      fetchAnnouncements();
    } catch (error) {
      console.error('Erro ao atualizar anúncio:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <Box className="container mx-auto p-6" sx={{backgroundColor:'#FFF'}}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Setor Público - Anúncios
      </Typography>
      <Box display="flex" mb={4}>
        <Button
          variant="outlined"
          onClick={() => setActiveTab('publish')}
          sx={{ marginRight: 2 }}
        >
          Publicar Anúncio
        </Button>
        <Button variant="outlined" onClick={() => setActiveTab('view')}>
          Ver Anúncios
        </Button>
      </Box>

      {/* Aba para Publicar Anúncio */}
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

      {/* Aba para Ver Anúncios */}
      {activeTab === 'view' && (
        <Box mt={4}>
          <Typography variant="h6">Anúncios Publicados</Typography>
          <List>
            {loading ? (
              <CircularProgress />
            ) : announcements.length > 0 ? (
              announcements.map((announcement) => (
                <Paper key={announcement.id} sx={{ padding: 2, marginBottom: 2 }}>
                  <ListItem>
                    <ListItemText
                      primary={announcement.title}
                      secondary={
                        <Box>
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
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => confirmAction('edit', announcement)}>
                        <EditIcon color="primary" />
                      </IconButton>
                      <IconButton edge="end" onClick={() => confirmAction('delete', announcement)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                Nenhum anúncio publicado.
              </Typography>
            )}
          </List>
        </Box>
      )}

      {/* Modal de Confirmação */}
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
            onClick={modalAction === 'delete' ? handleDelete : handleEdit}
            color="primary"
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortalDesk;