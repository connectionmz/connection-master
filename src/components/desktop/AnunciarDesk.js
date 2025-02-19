import React, { useState, useEffect } from 'react';
import { FaUpload } from 'react-icons/fa';
import { getDownloadURL, ref as createStorageRef, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../fb';
import { ref, push, set, onValue, remove, update } from 'firebase/database';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Tabs, Tab, Box, Typography, Paper, CircularProgress, Snackbar, Alert } from '@mui/material';
import Checkout from '../checkout/Checkout';
import BackButton from '../BackButton';

const AnunciarDesk = ({ user }) => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('Meus');
  const [anuncios, setAnuncios] = useState([]);
  const [selectedAnuncio, setSelectedAnuncio] = useState(null);
  const [days, setDays] = useState(1);
  const [totalCost, setTotalCost] = useState(30);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const MAX_DAYS = 30;
  const COST_PER_DAY = 30;

  useEffect(() => {
    const anunciosRef = ref(db, 'banners');
    onValue(anunciosRef, (snapshot) => {
      const data = snapshot.val();
      const anunciosList = Object.keys(data || {}).map((id) => ({
        id,
        ...data[id],
      }));
      setAnuncios(
        anunciosList
          .filter((anuncio) => anuncio.companyId === user.id)
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      );
    });
  }, [user.id]);

  useEffect(() => {
    setTotalCost(days * COST_PER_DAY);
  }, [days]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handlePaymentSuccess = (paymentDetails) => {
    setIsCheckoutOpen(false);
    handleUpload();
  };

  const handleUpload = () => {
    if (!file) {
      showSnackbar('Por favor, selecione uma imagem primeiro!', 'error');
      return;
    }
    if (!title || !description || !phoneNumber) {
      showSnackbar('Por favor, preencha todos os campos obrigatórios!', 'error');
      return;
    }
    setUploading(true);
    const fileRef = createStorageRef(storage, `images/${file.name}`);
    uploadBytes(fileRef, file)
      .then((snapshot) => {
        getDownloadURL(fileRef).then((url) => {
          setImageUrl(url);
          saveToDatabase(url);
          setUploading(false);
          showSnackbar('Imagem carregada com sucesso!', 'success');
        });
      })
      .catch((error) => {
        setUploading(false);
        console.error('Erro ao fazer upload da imagem:', error);
        showSnackbar('Erro ao carregar a imagem. Tente novamente.', 'error');
      });
  };

  const saveToDatabase = (url) => {
    const anuncioRef = push(ref(db, 'banners'));
    set(anuncioRef, {
      title,
      description,
      imageUrl: url,
      link,
      uploadedAt: new Date().toISOString(),
      companyId: user.id,
      days,
      totalCost,
    });
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLink('');
    setFile(null);
    setDays(1);
    setPhoneNumber('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza de que deseja eliminar este anúncio?')) {
      remove(ref(db, `banners/${id}`))
        .then(() => showSnackbar('Anúncio eliminado com sucesso!', 'success'))
        .catch(() => showSnackbar('Erro ao eliminar o anúncio.', 'error'));
    }
  };

  const handleEdit = (anuncio) => {
    setSelectedAnuncio(anuncio);
    setIsEditModalOpen(true);
  };

  const updateAnuncio = () => {
    const anuncioRef = ref(db, `banners/${selectedAnuncio.id}`);
    update(anuncioRef, {
      title: selectedAnuncio.title,
      description: selectedAnuncio.description,
      link: selectedAnuncio.link,
    })
      .then(() => {
        showSnackbar('Anúncio atualizado com sucesso!', 'success');
        setIsEditModalOpen(false);
      })
      .catch(() => showSnackbar('Erro ao atualizar o anúncio.', 'error'));
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box width="100%" minHeight="100vh">
      <Paper sx={{ width: '100%', padding: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <BackButton sx={{ mb: 2 }} />
          <Tabs value={activeTab} onChange={(e, newTab) => setActiveTab(newTab)} aria-label="tabs">
            <Tab label="Meus Anúncios" value="Meus" />
            <Tab label="Anunciar" value="Anunciar" />
          </Tabs>
        </Box>
        {activeTab === 'Meus' && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Meus Anúncios
            </Typography>
            {anuncios.length === 0 ? (
              <Typography>Nenhum anúncio encontrado.</Typography>
            ) : (
              anuncios.map((anuncio) => (
                <Paper key={anuncio.id} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6">{anuncio.title}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(anuncio.uploadedAt).toLocaleDateString()}
                  </Typography>
                  <Button onClick={() => handleEdit(anuncio)} color="primary" size="small">
                    Editar
                  </Button>
                  <Button onClick={() => handleDelete(anuncio.id)} color="error" size="small">
                    Eliminar
                  </Button>
                </Paper>
              ))
            )}
          </Box>
        )}
        {activeTab === 'Anunciar' && (
          <Box mt={4}>
            <Typography variant="h5" gutterBottom>
              Anunciar
            </Typography>
            <TextField
              label="Título do anúncio *"
              variant="outlined"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Descrição do anúncio *"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Link externo (opcional)"
              variant="outlined"
              fullWidth
              value={link}
              onChange={(e) => setLink(e.target.value)}
              sx={{ mb: 2 }}
            />
            <input type="file" onChange={handleFileChange} className="mb-3" />
            <Box mb={2}>
              <Typography>Tempo do anúncio (1 a {MAX_DAYS} dias):</Typography>
              <TextField
                type="number"
                value={days}
                onChange={(e) => setDays(Math.min(Math.max(Number(e.target.value), 1), MAX_DAYS))}
                inputProps={{ min: 1, max: MAX_DAYS }}
                fullWidth
              />
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Valor total: <strong>{totalCost} Mt</strong>
            </Typography>
            <TextField
              label="Número de celular *"
              variant="outlined"
              fullWidth
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsCheckoutOpen(true)}
              disabled={!title || !description || !file || !phoneNumber}
              sx={{ mb: 2 }}
            >
              {uploading ? <CircularProgress size={24} /> : 'Avançar para Pagamento'}
            </Button>
          </Box>
        )}
        {isCheckoutOpen && (
          <Dialog open={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Pagamento</DialogTitle>
            <DialogContent>
              <Checkout
                user={user}
                planPrice={totalCost}
                phoneNumber={phoneNumber}
                onPaymentSuccess={handlePaymentSuccess}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsCheckoutOpen(false)} color="secondary">
                Cancelar
              </Button>
            </DialogActions>
          </Dialog>
        )}
        {isEditModalOpen && (
          <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Editar Anúncio</DialogTitle>
            <DialogContent>
              <TextField
                label="Título do anúncio"
                variant="outlined"
                fullWidth
                value={selectedAnuncio?.title || ''}
                onChange={(e) => setSelectedAnuncio({ ...selectedAnuncio, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Descrição do anúncio"
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                value={selectedAnuncio?.description || ''}
                onChange={(e) => setSelectedAnuncio({ ...selectedAnuncio, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Link externo (opcional)"
                variant="outlined"
                fullWidth
                value={selectedAnuncio?.link || ''}
                onChange={(e) => setSelectedAnuncio({ ...selectedAnuncio, link: e.target.value })}
                sx={{ mb: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsEditModalOpen(false)} color="secondary">
                Cancelar
              </Button>
              <Button onClick={updateAnuncio} color="primary">
                Salvar
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AnunciarDesk;