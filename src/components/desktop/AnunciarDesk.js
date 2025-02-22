import React, { useState, useEffect } from 'react';
import { ref as createStorageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../fb';
import { ref, push, set, onValue } from 'firebase/database';
import {
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@mui/material';

const AnunciarDesk = ({ user }) => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(''); // URL da imagem para preview
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [days, setDays] = useState(1);
  const [totalCost, setTotalCost] = useState(30);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [selectedProvincias, setSelectedProvincias] = useState([]);
  const [selectedSectores, setSelectedSectores] = useState([]);
  const [empresas, setEmpresas] = useState([]); // Lista de empresas cadastradas
  const [empresasAtingidas, setEmpresasAtingidas] = useState(0); // Número de empresas atingidas

  const COST_PER_DAY = 30; // Custo base por dia
  const ADDITIONAL_COST_PER_PROVINCIA = 50; // Custo adicional por província
  const ADDITIONAL_COST_PER_SETOR = 50; // Custo adicional por setor

  // Busca províncias, setores e empresas do Firebase
  useEffect(() => {
    const provinciasRef = ref(db, 'provincias');
    const sectoresRef = ref(db, 'sectores_de_atividade');
    const empresasRef = ref(db, 'company'); // Referência para as empresas

    onValue(provinciasRef, (snapshot) => setProvincias(snapshot.val() || []));
    onValue(sectoresRef, (snapshot) => setSectores(snapshot.val() || []));
    onValue(empresasRef, (snapshot) => {
      const empresasData = snapshot.val();
      if (empresasData) {
        const empresasArray = Object.keys(empresasData).map((key) => ({
          id: key,
          ...empresasData[key],
        }));
        setEmpresas(empresasArray);
      } else {
        setEmpresas([]);
      }
    });
  }, []);

  // Calcula o custo total com base nos dias, províncias e setores selecionados
  useEffect(() => {
    const additionalCost =
      selectedProvincias.length * ADDITIONAL_COST_PER_PROVINCIA +
      selectedSectores.length * ADDITIONAL_COST_PER_SETOR;
    setTotalCost(days * (COST_PER_DAY + additionalCost));
  }, [days, selectedProvincias, selectedSectores]);

  // Calcula o número de empresas atingidas com base nas províncias e setores selecionados
  useEffect(() => {
    if (empresas.length > 0 && (selectedProvincias.length > 0 || selectedSectores.length > 0)) {
      const empresasFiltradas = empresas.filter((empresa) => {
        const matchesProvincia = selectedProvincias.length === 0 || selectedProvincias.includes(empresa.provincia);
        const matchesSetor = selectedSectores.length === 0 || selectedSectores.includes(empresa.sector);
        return matchesProvincia && matchesSetor;
      });
      setEmpresasAtingidas(empresasFiltradas.length);
    } else {
      setEmpresasAtingidas(0);
    }
  }, [selectedProvincias, selectedSectores, empresas]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Cria uma URL temporária para o preview da imagem
      setImageUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = () => {
    if (!file) {
      showSnackbar('Por favor, selecione uma imagem primeiro!', 'error');
      return;
    }
    if (!title || !phoneNumber || selectedProvincias.length === 0 || selectedSectores.length === 0) {
      showSnackbar('Por favor, preencha todos os campos obrigatórios!', 'error');
      return;
    }
    setUploading(true);
    const fileRef = createStorageRef(storage, `images/${file.name}`);
    uploadBytes(fileRef, file)
      .then((snapshot) => {
        getDownloadURL(fileRef).then((url) => {
          saveToDatabase(url);
          setUploading(false);
          showSnackbar('Anúncio publicado com sucesso!', 'success');
        });
      })
      .catch((error) => {
        setUploading(false);
        console.error('Erro ao fazer upload da imagem:', error);
        showSnackbar('Erro ao publicar o anúncio. Tente novamente.', 'error');
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
      provincias: selectedProvincias,
      sectores: selectedSectores,
    });
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLink('');
    setFile(null);
    setImageUrl(''); // Limpa o preview da imagem
    setDays(1);
    setPhoneNumber('');
    setSelectedProvincias([]);
    setSelectedSectores([]);
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
          label="Link externo (opcional)"
          variant="outlined"
          fullWidth
          value={link}
          onChange={(e) => setLink(e.target.value)}
          sx={{ mb: 2 }}
        />
        <input type="file" onChange={handleFileChange} className="mb-3" />

        {/* Preview da Foto */}
        {imageUrl && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Preview da Imagem:
            </Typography>
            <img
              src={imageUrl}
              alt="Preview da Imagem"
              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
            />
          </Box>
        )}

        {/* Seleção de Províncias */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="provincias-label">Províncias *</InputLabel>
          <Select
            labelId="provincias-label"
            multiple
            value={selectedProvincias}
            onChange={(e) => setSelectedProvincias(e.target.value)}
            renderValue={(selected) => selected.join(', ')}
          >
            {provincias.map((provincia) => (
              <MenuItem key={provincia.provincia} value={provincia.provincia}>
                <Checkbox checked={selectedProvincias.includes(provincia.provincia)} />
                <ListItemText primary={provincia.provincia} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Seleção de Setores */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="sectores-label">Setores de Atividade *</InputLabel>
          <Select
            labelId="sectores-label"
            multiple
            value={selectedSectores}
            onChange={(e) => setSelectedSectores(e.target.value)}
            renderValue={(selected) => selected.join(', ')}
          >
            {sectores.map((setor) => (
              <MenuItem key={setor.setor} value={setor.setor}>
                <Checkbox checked={selectedSectores.includes(setor.setor)} />
                <ListItemText primary={setor.setor} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Seleção de Dias */}
        <Box mb={2}>
          <Typography>Tempo do anúncio (1 a 30 dias):</Typography>
          <TextField
            type="number"
            value={days}
            onChange={(e) => setDays(Math.min(Math.max(Number(e.target.value), 1), 30))}
            inputProps={{ min: 1, max: 30 }}
            fullWidth
          />
        </Box>

        {/* Valor Total */}
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Valor total: <strong>{totalCost} MT</strong>
        </Typography>

        {/* Número de Empresas Atingidas */}
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Este anúncio atingirá aproximadamente <strong>{empresasAtingidas}</strong> empresas.
        </Typography>

        {/* Número de Celular */}
        <TextField
          label="Número de celular *"
          variant="outlined"
          fullWidth
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Botão de Enviar */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!title || !file || !phoneNumber || selectedProvincias.length === 0 || selectedSectores.length === 0}
          sx={{ mb: 2 }}
        >
          {uploading ? <CircularProgress size={24} /> : 'Pagar & Prosseguir'}
        </Button>
      </Paper>

      {/* Snackbar para feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AnunciarDesk;