import React, { useState, useEffect } from 'react';
import { FaUpload } from 'react-icons/fa';
import { getDownloadURL, ref as createStorageRef, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../fb';
import { ref, push, set, onValue, remove, update } from 'firebase/database';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Tabs, Tab, Box, Typography, Paper } from '@mui/material';
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
  const [days, setDays] = useState();
  const [totalCost, setTotalCost] = useState(30);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

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
      alert('Por favor, selecione uma imagem primeiro!');
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
          alert('Imagem carregada com sucesso!');
        });
      })
      .catch((error) => {
        setUploading(false);
        console.error('Erro ao fazer upload da imagem:', error);
        alert('Erro ao carregar a imagem. Tente novamente.');
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
      companyId: user,
      days,
      totalCost,
    });
    setTitle('');
    setDescription('');
    setLink('');
    setFile(null);
    setDays(1);
    setPhoneNumber('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza de que deseja eliminar este anúncio?')) {
      remove(ref(db, `banners/${id}`));
    }
  };

  const handleEdit = (anuncio) => {
    setSelectedAnuncio(anuncio);
  };

  const updateAnuncio = () => {
    const anuncioRef = ref(db, `banners/${selectedAnuncio.id}`);
    update(anuncioRef, {
      title: selectedAnuncio.title,
      description: selectedAnuncio.description,
      link: selectedAnuncio.link,
    });
    setSelectedAnuncio(null);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" padding={2}>
        
      <Paper  sx={{  width: '100%', padding: 3 }}>      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <BackButton sx={{ mb: 2 }} />

        <Tabs value={activeTab} onChange={(e, newTab) => setActiveTab(newTab)} aria-label="tabs">
          <Tab label="Meus Anúncios" value="Meus" />
          <Tab label="Anunciar" value="Anunciar" />
        </Tabs>
      </Box>
      {activeTab === 'Meus' && (
        <div className="mt-4">
          <Typography variant="h6" gutterBottom>
            Meus Anúncios
          </Typography>
          {anuncios.length === 0 ? (
            <p>Nenhum anúncio encontrado.</p>
          ) : (
            anuncios.map((anuncio) => (
              <Box key={anuncio.id} sx={{ p: 2, border: 1, borderRadius: 1, mb: 2 }}>
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
              </Box>
            ))
          )}
        </div>
      )}
      {activeTab === 'Anunciar' && (
        <div className="mt-4">
          <Typography variant="h5" gutterBottom>
            Anunciar
          </Typography>
          <TextField
            label="Título do anúncio"
            variant="outlined"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Descrição do anúncio"
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
          <label>
            Tempo do anúncio (1 a {MAX_DAYS} dias):
            <input
              type="number"
              min="1"
              max={MAX_DAYS}
              value={days}
              onChange={(e) => setDays(Math.min(Math.max(Number(e.target.value), 1), MAX_DAYS))}
              className="border p-2 rounded w-full"
            />
          </label>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Valor total: <strong>{totalCost} Mt</strong>
          </Typography>
          <TextField
            label="Número de celular"
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
            disabled={!phoneNumber}
            sx={{ mb: 2 }}
          >
            Avançar para Pagamento
          </Button>
        </div>
      )}
      {isCheckoutOpen && (
        <Dialog open={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Pagamento</DialogTitle>
          <DialogContent>
            <Checkout
              user={user}
              planPrice={totalCost}
              phoneNumber={phoneNumber}
              onPaymentSuccess={handlePaymentSuccess}/>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsCheckoutOpen(false)} color="secondary">
              Cancelar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
    </Box>
  );
};

export default AnunciarDesk;
