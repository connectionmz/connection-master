import React, { useState, useEffect } from 'react';
import { ref, push, get, set, remove } from 'firebase/database';
import { db, storage } from '../../fb';
import { uploadBytes, getDownloadURL, ref as storageRef } from 'firebase/storage';
import {
  Box,
  Button,
  TextField,
  Typography,
  Modal,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Paper,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const PortalDesk = ({user}) => {
  const [activeTab, setActiveTab] = useState('publish');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false); // Para carregar anúncios
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Função para publicar anúncio
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fileUrl = '';
      if (file) {
        const storageReference = storageRef(storage, `announcements/${file.name}`);
        await uploadBytes(storageReference, file);
        fileUrl = await getDownloadURL(storageReference);
      }

      const newAnnouncement = {
        title,
        content,
        fileUrl,
        company:{
            nome:user.nome,
            logo:user.photoURL,
            provincia:user.provincia,
            id:user.id
        },
        date: new Date().toISOString(),
      };

      await push(ref(db, 'publicAnnouncements'), newAnnouncement);
      setTitle('');
      setContent('');
      setFile(null);
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
  
        // Filtra os anúncios para incluir apenas os que pertencem à empresa do usuário
        const filteredData = Object.entries(data)
          .filter(([id, anuncio]) => anuncio.company.id === user.id) // Substitua 'companyId' pelo campo correto que referencia a empresa
          .map(([id, value]) => ({ id, ...value }));
  
        setAnnouncements(filteredData);
      }
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
    } finally {
      setLoading(false);
    }
  };
  

  // Função para abrir o modal de confirmação
  const confirmAction = (action, announcement) => {
    setModalAction(action);
    setSelectedAnnouncement(announcement);
    setOpenModal(true);
  };

  // Função para excluir um anúncio
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

  // Função para editar um anúncio
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

  // Função para atualizar um anúncio
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

  // Carregar anúncios ao iniciar
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <Box className="container mx-auto p-6">
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
          <TextField
            label="Conteúdo"
            variant="outlined"
            fullWidth
            margin="normal"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            rows={4}
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
                            {announcement.content}
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
