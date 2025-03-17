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
import Checkout from '../checkout/Checkout';
import { handlePayment } from '../../utils/handlePayment';
import BackButton from '../BackButton';

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
  const [showCheckout, setShowCheckout] = useState(false);
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

  // Função para iniciar o processo de upload
  const handleUpload = () => {
    if (!validateForm()) return;
    setShowCheckout(true);
  };

  // Função para confirmar o pagamento
  const handleConfirmPayment = async (paymentMethod) => {
    setUploading(true);

    const paymentResult = await handlePayment({
      phoneNumber,
      paymentMethod,
      user,
      planPrice: totalCost,
      smsCount: 1,
      onPaymentSuccess: () => {
        const fileRef = createStorageRef(storage, `images/${file.name}`);
        uploadBytes(fileRef, file)
          .then((snapshot) => {
            getDownloadURL(fileRef).then((url) => {
              saveToDatabase(url);
              setUploading(false);
              showSnackbar('Anúncio publicado com sucesso!', 'success');
              setShowCheckout(false);
            });
          })
          .catch((error) => {
            setUploading(false);
            console.error('Erro ao fazer upload da imagem:', error);
            showSnackbar('Erro ao publicar o anúncio. Tente novamente.', 'error');
          });
      },
      setError: (message) => showSnackbar(message, 'error'),
      setIsLoading: setUploading,
      setPendingTransaction: () => {},
    });

    if (!paymentResult.success) {
      setUploading(false);
      showSnackbar('Erro no pagamento. Tente novamente.', 'error');
    }
  };

  // Função para salvar no banco de dados
  const saveToDatabase = (url) => {
    const anuncioRef = push(ref(db, 'banners'));
    const idAnuncio = anuncioRef.key;

    const expireDate = calculateExpireDate(days);

    set(anuncioRef, {
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
    });

    resetForm();
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
        {showCheckout ? (
          <Checkout
            totalCost={totalCost}
            onConfirmPayment={handleConfirmPayment}
            onCancel={() => setShowCheckout(false)}
          />
        ) : (
          <>
            <Typography variant="h5" gutterBottom>
              Anunciar
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
                <FormControlLabel value="home" control={<Radio />} label="Pagina Inicial (30 MT/dia)" />
                <FormControlLabel value="concurso" control={<Radio />} label="Concurso (50 MT/dia)" />
                <FormControlLabel value="cotacoes" control={<Radio />} label="Cotações (40 MT/dia)" />
                <FormControlLabel value="destacar_perfil" control={<Radio />} label="Destacar Perfil (100 MT/dia)" />
              </RadioGroup>
            </FormControl>

            <TextField
              label="Link externo (opcional)"
              variant="outlined"
              fullWidth
              value={link}
              onChange={(e) => setLink(e.target.value)}
              sx={{ mb: 2 }}
            />
            <input type="file" onChange={handleFileChange} className="mb-3" />

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
                      disabled={user.provincia === provincia.provincia} // Desabilita a desmarcação da província padrão
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
                      disabled={user.sector === setor.setor} // Desabilita a desmarcação do setor padrão
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
              Valor total: <strong>{totalCost} MT</strong>
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
              onClick={handleUpload}
              disabled={!file || !phoneNumber}
              sx={{ mb: 2 }}
            >
              {uploading ? <CircularProgress size={24} /> : 'Continuar'}
            </Button>
          </>
        )}
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