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
import BackButton from '../BackButton';
import { formatPrice } from '../../utils/utils';

const AnunciarDesk = ({ user }) => {
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

  // Preços base para cada tipo de anúncio
  const prices = {
    home: 30,
    concurso: 50,
    cotacoes: 40,
    destacar_perfil: 120,
  };

  const ADDITIONAL_COST_PER_PROVINCIA = 30;
  const ADDITIONAL_COST_PER_SETOR = 30;

  // Carregar dados iniciais
  useEffect(() => {
    const provinciasRef = ref(db, 'provincias');
    const sectoresRef = ref(db, 'sectores_de_atividade');
    const empresasRef = ref(db, 'company');

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

    // Definir setor e província padrão com base no perfil do usuário
    if (user) {
      setSelectedSectores(user.sector ? [user.sector] : []);
      setSelectedProvincias(user.provincia ? [user.provincia] : []);
    }
  }, [user]);

  // Calcular custo total
  useEffect(() => {
    const baseCost = prices[tipoAnuncio] || prices.home;

    // Verificar se há setores ou províncias adicionais selecionados
    const hasAdditionalSectors = selectedSectores.length > 1;
    const hasAdditionalProvincias = selectedProvincias.length > 1;

    // Aplicar custo adicional apenas para setores ou províncias adicionais
    const additionalCost =
      (hasAdditionalProvincias ? (selectedProvincias.length - 1) * ADDITIONAL_COST_PER_PROVINCIA : 0) +
      (hasAdditionalSectors ? (selectedSectores.length - 1) * ADDITIONAL_COST_PER_SETOR : 0);

    setTotalCost(days * (baseCost + additionalCost));
  }, [days, selectedProvincias, selectedSectores, tipoAnuncio]);

  // Calcular empresas atingidas
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

  // Função para manipular a seleção de províncias
  const handleProvinciaChange = (e) => {
    const newSelectedProvincias = e.target.value;
    // Garantir que a província padrão do usuário esteja sempre selecionada
    if (user.provincia && !newSelectedProvincias.includes(user.provincia)) {
      newSelectedProvincias.push(user.provincia);
    }
    setSelectedProvincias(newSelectedProvincias);
  };

  // Função para manipular a seleção de setores
  const handleSetorChange = (e) => {
    const newSelectedSectores = e.target.value;
    // Garantir que o setor padrão do usuário esteja sempre selecionado
    if (user.sector && !newSelectedSectores.includes(user.sector)) {
      newSelectedSectores.push(user.sector);
    }
    setSelectedSectores(newSelectedSectores);
  };

  // Funções de manipulação de arquivo
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImageUrl(URL.createObjectURL(selectedFile));
    }
  };

  // Função para validar o formulário
  const validateForm = () => {
    if (!file) {
      showSnackbar('Por favor, selecione uma imagem para o anúncio.', 'error');
      return false;
    }
    if (!phoneNumber) {
      showSnackbar('Por favor, insira um número de telefone.', 'error');
      return false;
    }
    return true;
  };

  // Função para publicar o anúncio
  const handlePublish = async () => {
    if (!validateForm()) return;
    setUploading(true);

    try {
      const fileRef = createStorageRef(storage, `images/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await saveToDatabase(url);
      
      showSnackbar('Anúncio publicado com sucesso!', 'success');
      resetForm();
    } catch (error) {
      console.error('Erro ao publicar anúncio:', error);
      showSnackbar('Erro ao publicar o anúncio. Tente novamente.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Função para salvar no banco de dados
  const saveToDatabase = async (url) => {
    const anuncioRef = push(ref(db, 'banners'));
    const idAnuncio = anuncioRef.key;

    const expireDate = calculateExpireDate(days);

    await set(anuncioRef, {
      id: idAnuncio,
      description,
      imageUrl: url,
      link,
      uploadedAt: new Date().toISOString(),
      expireDate,
      companyId: user.id,
      days,
      totalCost,
      provincias: selectedProvincias,
      sectores: selectedSectores,
      tipoAnuncio,
      phoneNumber,
      status: 'active'
    });
  };

  // Função para calcular a data de expiração
  const calculateExpireDate = (days) => {
    const currentDate = new Date();
    const expireDate = new Date(currentDate);
    expireDate.setDate(currentDate.getDate() + days);
    return expireDate.toISOString();
  };

  // Função para resetar o formulário
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

  // Função para exibir mensagens no Snackbar
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Função para fechar o Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box width="100%" minHeight="100vh">
      <Paper sx={{ width: '100%', padding: 3 }}>
        <BackButton sx={{ mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Criar Anúncio
        </Typography>

        {/* Seletor de tipo de anúncio */}
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Escolha o tipo de anúncio:
          </Typography>
          <RadioGroup
            value={tipoAnuncio}
            onChange={(e) => setTipoAnuncio(e.target.value)}
          >
            <FormControlLabel value="home" control={<Radio />} label="Página Inicial" />
            <FormControlLabel value="concurso" control={<Radio />} label="Concurso" />
            <FormControlLabel value="cotacoes" control={<Radio />} label="Cotações" />
            <FormControlLabel value="destacar_perfil" control={<Radio />} label="Destacar Perfil" />
          </RadioGroup>
        </FormControl>

        <TextField
          label="Descrição do anúncio"
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

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="provincias-label">Províncias *</InputLabel>
          <Select
            labelId="provincias-label"
            multiple
            value={selectedProvincias}
            onChange={handleProvinciaChange}
            renderValue={(selected) => selected.join(', ')}
          >
            {provincias.map((provincia) => (
              <MenuItem key={provincia.provincia} value={provincia.provincia}>
                <Checkbox
                  checked={selectedProvincias.includes(provincia.provincia)}
                  disabled={user.provincia === provincia.provincia}
                />
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
            value={selectedSectores}
            onChange={handleSetorChange}
            renderValue={(selected) => selected.join(', ')}
          >
            {sectores.map((setor) => (
              <MenuItem key={setor.setor} value={setor.setor}>
                <Checkbox
                  checked={selectedSectores.includes(setor.setor)}
                  disabled={user.sector === setor.setor}
                />
                <ListItemText primary={setor.setor} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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

        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Valor estimado: <strong>{formatPrice(totalCost)} MT</strong>
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Este anúncio atingirá aproximadamente <strong>{empresasAtingidas}</strong> empresas.
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
          onClick={handlePublish}
          disabled={!file || !phoneNumber || uploading}
          sx={{ mb: 2 }}
        >
          {uploading ? <CircularProgress size={24} /> : 'Publicar Anúncio'}
        </Button>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AnunciarDesk;