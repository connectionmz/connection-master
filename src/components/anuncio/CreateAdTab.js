// CreateAdTab.js
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
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { formatPrice } from './adUtils';

const CreateAdTab = ({ user, onAdCreated }) => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
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
  const [empresas, setEmpresas] = useState([]);
  const [empresasAtingidas, setEmpresasAtingidas] = useState(0);
  const [tipoAnuncio, setTipoAnuncio] = useState('home');
  const isDestacarPerfil = tipoAnuncio === 'destacar_perfil';
  const [openProvinciaSelect, setOpenProvinciaSelect] = useState(false);
  const [openSetorSelect, setOpenSetorSelect] = useState(false);

  const prices = {
    home: 30,
    concurso: 50,
    cotacoes: 40,
    destacar_perfil: 120,
  };

  const ADDITIONAL_COST_PER_PROVINCIA = 30;
  const ADDITIONAL_COST_PER_SETOR = 30;

  useEffect(() => {
    const provinciasRef = ref(db, 'provincias');
    const sectoresRef = ref(db, 'sectores_de_atividade');
    const empresasRef = ref(db, 'company');

    onValue(provinciasRef, (snapshot) => {
      const data = snapshot.val();
      setProvincias(data ? Object.values(data) : []);
    });

    onValue(sectoresRef, (snapshot) => {
      const data = snapshot.val();
      setSectores(data ? Object.values(data) : []);
    });

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

    if (user) {
      setSelectedSectores(user.sector ? [user.sector] : []);
      setSelectedProvincias(user.provincia ? [user.provincia] : []);
    }
  }, [user]);

  useEffect(() => {
    const baseCost = prices[tipoAnuncio] || prices.home;
    const provinciasCount = Math.max(0, selectedProvincias.length - 1);
    const sectoresCount = Math.max(0, selectedSectores.length - 1);
    
    const additionalCost = 
      (provinciasCount * ADDITIONAL_COST_PER_PROVINCIA) + 
      (sectoresCount * ADDITIONAL_COST_PER_SETOR);
    
    setTotalCost(days * (baseCost + additionalCost));
  }, [days, selectedProvincias, selectedSectores, tipoAnuncio]);

  useEffect(() => {
    if (empresas.length > 0 && (selectedProvincias.length > 0 || selectedSectores.length > 0)) {
      const empresasFiltradas = empresas.filter((empresa) => {
        const matchesProvincia = selectedProvincias.length === 0 || 
          selectedProvincias.includes(empresa.provincia);
        const matchesSetor = selectedSectores.length === 0 || 
          selectedSectores.includes(empresa.sector);
        return matchesProvincia && matchesSetor;
      });
      setEmpresasAtingidas(empresasFiltradas.length);
    } else {
      setEmpresasAtingidas(0);
    }
  }, [selectedProvincias, selectedSectores, empresas]);

  const handleSelectAllProvincias = () => {
    const allProvincias = provincias.map(p => p.provincia);
    setSelectedProvincias(allProvincias);
  };

  const handleDeselectAllProvincias = () => {
    setSelectedProvincias([]);
  };

  const handleSelectAllSetores = () => {
    const allSetores = sectores.map(s => s.setor);
    setSelectedSectores(allSetores);
  };

  const handleDeselectAllSetores = () => {
    setSelectedSectores([]);
  };

  const handleProvinciaChange = (event) => {
    const value = event.target.value;
    if (selectedProvincias.includes(value[value.length - 1])) {
      setSelectedProvincias(value);
    } else {
      setSelectedProvincias(value);
    }
  };

  const handleSetorChange = (event) => {
    const value = event.target.value;
    if (selectedSectores.includes(value[value.length - 1])) {
      setSelectedSectores(value);
    } else {
      setSelectedSectores(value);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImageUrl(URL.createObjectURL(selectedFile));
    }
  };
  const validateForm = () => {
    if (!file && !isDestacarPerfil) {
      showSnackbar('Por favor, selecione uma imagem para o anúncio.', 'error');
      return false;
    }
    if (!days || days < 1 || days > 30) {
      showSnackbar('Por favor, selecione uma duração válida (1-30 dias).', 'error');
      return false;
    }
    if (!isDestacarPerfil && !description) {
      showSnackbar('Por favor, insira uma descrição para o anúncio.', 'error');
      return false;
    }
    if (selectedProvincias.length === 0) {
      showSnackbar('Por favor, selecione pelo menos uma província.', 'error');
      return false;
    }
    if (selectedSectores.length === 0) {
      showSnackbar('Por favor, selecione pelo menos um setor de atividade.', 'error');
      return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!validateForm()) return;
    setUploading(true);

    try {
      let url = '';
      if (file) {
        const fileRef = createStorageRef(storage, `images/${file.name}`);
        await uploadBytes(fileRef, file);
        url = await getDownloadURL(fileRef);
      }
      
      await saveToDatabase(url);
      showSnackbar('Anúncio publicado com sucesso!', 'success');
      
      resetForm();
      onAdCreated();
    } catch (error) {
      console.error('Erro ao publicar anúncio:', error);
      showSnackbar('Erro ao publicar o anúncio. Tente novamente.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const saveToDatabase = async (imageUrl) => {
    const anuncioRef = push(ref(db, 'banners'));
    const idAnuncio = anuncioRef.key;

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + days);

    const anuncioData = {
      id: idAnuncio,
      uploadedAt: new Date().toISOString(),
      expireDate: expireDate.toISOString(),
      companyId: user.id,
      days,
      totalCost,
      provincias: selectedProvincias,
      sectores: selectedSectores,
      tipoAnuncio,
      phoneNumber,
      status: 'false'
    };

    if (imageUrl) {
      anuncioData.imageUrl = imageUrl;
    }

    if (!isDestacarPerfil) {
      anuncioData.description = description;
      anuncioData.link = link || '#';
    } else {
      anuncioData.description = `Perfil destacado de ${user.nome}`;
      anuncioData.link = `/perfil/${user.id}`;
    }

    await set(anuncioRef, anuncioData);
  };

  const resetForm = () => {
    setDescription('');
    setLink('');
    setFile(null);
    setImageUrl('');
    setDays(1);
    setPhoneNumber('');
    setSelectedProvincias(user.provincia ? [user.provincia] : []);
    setSelectedSectores(user.sector ? [user.sector] : []);
    setTipoAnuncio('home');
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Escolha o tipo de anúncio:
        </Typography>
        <RadioGroup
          value={tipoAnuncio}
          onChange={(e) => setTipoAnuncio(e.target.value)}
          row
        >
          <FormControlLabel value="home" control={<Radio />} label="Página Inicial" />
          <FormControlLabel value="concurso" control={<Radio />} label="Concurso" />
          <FormControlLabel value="cotacoes" control={<Radio />} label="Cotações" />
         


        </RadioGroup>
      </FormControl>

      {!isDestacarPerfil && (
        <>
          <TextField
            label="Descrição do anúncio *"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
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

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Imagem do anúncio *
            </Typography>
            <input 
              type="file" 
              onChange={handleFileChange} 
              accept="image/*"
              required
            />
            {imageUrl && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Pré-visualização:
                </Typography>
                <img
                  src={imageUrl}
                  alt="Preview da Imagem"
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                />
              </Box>
            )}
          </Box>
        </>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="provincias-label">Províncias *</InputLabel>
        <Select
          labelId="provincias-label"
          multiple
          open={openProvinciaSelect}
          onOpen={() => setOpenProvinciaSelect(true)}
          onClose={() => setOpenProvinciaSelect(false)}
          value={selectedProvincias}
          onChange={handleProvinciaChange}
          renderValue={(selected) => selected.join(', ')}
          label="Províncias *"
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
            <Button size="small" onClick={handleSelectAllProvincias}>
              Selecionar Todos
            </Button>
            <Button size="small" onClick={handleDeselectAllProvincias}>
              Desmarcar Todos
            </Button>
          </Box>
          
          {provincias.map((provincia) => (
            <MenuItem key={provincia.provincia} value={provincia.provincia}>
              <Checkbox checked={selectedProvincias.includes(provincia.provincia)} />
              <ListItemText primary={provincia.provincia} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="sectores-label">Setores de Atividade *</InputLabel>
        <Select
          labelId="sectores-label"
          multiple
          open={openSetorSelect}
          onOpen={() => setOpenSetorSelect(true)}
          onClose={() => setOpenSetorSelect(false)}
          value={selectedSectores}
          onChange={handleSetorChange}
          renderValue={(selected) => selected.join(', ')}
          label="Setores de Atividade *"
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
            <Button size="small" onClick={handleSelectAllSetores}>
              Selecionar Todos
            </Button>
            <Button size="small" onClick={handleDeselectAllSetores}>
              Desmarcar Todos
            </Button>
          </Box>
          
          {sectores.map((setor) => (
            <MenuItem key={setor.setor} value={setor.setor}>
              <Checkbox checked={selectedSectores.includes(setor.setor)} />
              <ListItemText primary={setor.setor} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box mb={2}>
        <Typography>Tempo do anúncio (1 a 30 dias): *</Typography>
        <TextField
          type="number"
          value={days}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              setDays("");
            } else {
              const parsed = parseInt(value);
              if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
                setDays(parsed);
              }
            }
          }}
          inputProps={{ min: 1, max: 30 }}
          fullWidth
        />
      </Box>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Valor estimado: <strong>{formatPrice(totalCost)} MT</strong>
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Este anúncio atingirá aproximadamente <strong>{empresasAtingidas}</strong> empresas.
      </Typography>
  
      <Button
        variant="contained"
        color="primary"
        onClick={handlePublish}
        disabled={uploading}
        sx={{ mb: 2 }}
        fullWidth
        size="large"
      >
        {uploading ? <CircularProgress size={24} /> : 'Publicar Anúncio'}
      </Button>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateAdTab;