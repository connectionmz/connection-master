import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ref as createStorageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../fb';
import { ref, push, set, onValue, update } from 'firebase/database';
import {
  Button,
  TextField,
  Box,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  Chip,
} from '@mui/material';
import PropTypes from 'prop-types';
import { formatPrice } from './adUtils';

// Configuration constants
const AD_CONFIG = {
  PRICES: {
    home: 30,
    concurso: 50,
    cotacoes: 40,
    destacar_perfil: 120,
  },
  ADDITIONAL_COSTS: {
    provincia: 30,
    setor: 30,
  },
  MAX_DAYS: 30,
  MIN_DAYS: 1,
  MAX_DESCRIPTION_LENGTH: 150,
  PHONE_NUMBER_LENGTH: 12,
  PHONE_PREFIX: '258',
};

const AD_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  PAYMENT_FAILED: 'payment_failed',
  PENDING: 'pending',
};

// Moved formatPhoneNumber outside the component to avoid TDZ
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.startsWith(AD_CONFIG.PHONE_PREFIX)
    ? cleanPhone.substring(0, AD_CONFIG.PHONE_NUMBER_LENGTH)
    : `${AD_CONFIG.PHONE_PREFIX}${cleanPhone.replace(/^0/, '').substring(0, 9)}`;
};

const CreateAdTab = ({ user, onAdCreated }) => {
  // State management
  const [formData, setFormData] = useState({
    file: null,
    imageUrl: '',
    description: '',
    link: '',
    days: AD_CONFIG.MIN_DAYS,
    phoneNumber: formatPhoneNumber(user?.contacto || ''),
    tipoAnuncio: 'home',
  });

  const [selectedProvincias, setSelectedProvincias] = useState(user?.provincia ? [user.provincia] : []);
  const [selectedSectores, setSelectedSectores] = useState(user?.sector ? [user.sector] : []);
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [uiState, setUiState] = useState({
    uploading: false,
    snackbar: { open: false, message: '', severity: 'success' },
    openProvinciaSelect: false,
    openSetorSelect: false,
    showPaymentModal: false,
    showConfirmationDialog: false,
    paymentLoading: false,
    paymentError: '',
    paymentSuccess: false,
  });
  const [currentAdId, setCurrentAdId] = useState(null);

  const isDestacarPerfil = formData.tipoAnuncio === 'destacar_perfil';

  // Helper functions
  const showSnackbar = useCallback((message, severity = 'success') => {
    setUiState(prev => ({
      ...prev,
      snackbar: { open: true, message, severity },
    }));
  }, []);

  // Data fetching
  useEffect(() => {
    const provinciasRef = ref(db, 'provincias');
    const sectoresRef = ref(db, 'sectores_de_atividade');
    const empresasRef = ref(db, 'company');

    const unsubscribeProvincias = onValue(provinciasRef, (snapshot) => {
      const data = snapshot.val();
      setProvincias(data ? Object.values(data) : []);
    }, (error) => {
      console.error('Error fetching provincias:', error);
      showSnackbar('Erro ao carregar províncias', 'error');
    });

    const unsubscribeSectores = onValue(sectoresRef, (snapshot) => {
      const data = snapshot.val();
      setSectores(data ? Object.values(data) : []);
    }, (error) => {
      console.error('Error fetching sectores:', error);
      showSnackbar('Erro ao carregar setores', 'error');
    });

    const unsubscribeEmpresas = onValue(empresasRef, (snapshot) => {
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
    }, (error) => {
      console.error('Error fetching empresas:', error);
      showSnackbar('Erro ao carregar empresas', 'error');
    });

    return () => {
      unsubscribeProvincias();
      unsubscribeSectores();
      unsubscribeEmpresas();
    };
  }, [showSnackbar]);

  // Calculations
  const totalCost = useMemo(() => {
    const baseCost = AD_CONFIG.PRICES[formData.tipoAnuncio] || AD_CONFIG.PRICES.home;
    const provinciasCount = Math.max(0, selectedProvincias.length - 1);
    const sectoresCount = Math.max(0, selectedSectores.length - 1);

    const additionalCost =
      provinciasCount * AD_CONFIG.ADDITIONAL_COSTS.provincia +
      sectoresCount * AD_CONFIG.ADDITIONAL_COSTS.setor;

    return formData.days * (baseCost + additionalCost);
  }, [formData.days, formData.tipoAnuncio, selectedProvincias, selectedSectores]);

  const empresasAtingidas = useMemo(() => {
    if (empresas.length === 0) return 0;

    return empresas.filter((empresa) => {
      const matchesProvincia = selectedProvincias.length === 0 ||
        selectedProvincias.includes(empresa.provincia);
      const matchesSetor = selectedSectores.length === 0 ||
        selectedSectores.includes(empresa.sector);
      return matchesProvincia && matchesSetor;
    }).length;
  }, [selectedProvincias, selectedSectores, empresas]);

  // Handlers
  const handleInputChange = useCallback((field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  }, []);

  const handleFileChange = useCallback((e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        file: selectedFile,
        imageUrl: URL.createObjectURL(selectedFile),
      }));
    }
  }, []);

  const handleSelectAll = useCallback((type) => () => {
    const allItems = type === 'provincia'
      ? provincias.map(p => p.provincia)
      : sectores.map(s => s.setor);

    type === 'provincia'
      ? setSelectedProvincias(allItems)
      : setSelectedSectores(allItems);
  }, [provincias, sectores]);

  const handleDeselectAll = useCallback((type) => () => {
    type === 'provincia'
      ? setSelectedProvincias([])
      : setSelectedSectores([]);
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.file && !isDestacarPerfil) {
      showSnackbar('Por favor, selecione uma imagem para o anúncio.', 'error');
      return false;
    }

    if (!formData.days || formData.days < AD_CONFIG.MIN_DAYS || formData.days > AD_CONFIG.MAX_DAYS) {
      showSnackbar(`Por favor, selecione uma duração válida (${AD_CONFIG.MIN_DAYS}-${AD_CONFIG.MAX_DAYS} dias).`, 'error');
      return false;
    }

    if (!isDestacarPerfil && !formData.description) {
      showSnackbar('Por favor, insira uma descrição para o anúncio.', 'error');
      return false;
    }

    if (!formData.phoneNumber || !new RegExp(`^${AD_CONFIG.PHONE_PREFIX}\\d{9}$`).test(formData.phoneNumber)) {
      showSnackbar(`Por favor, insira um número de telefone válido no formato ${AD_CONFIG.PHONE_PREFIX}XXXXXXXXX`, 'error');
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
  }, [formData, selectedProvincias, selectedSectores, isDestacarPerfil, showSnackbar]);

  const saveToDatabase = useCallback(async (imageUrl) => {
    try {
      const anuncioRef = push(ref(db, 'banners'));
      const idAnuncio = anuncioRef.key;
      setCurrentAdId(idAnuncio);

      const now = new Date();
      const expireDate = new Date();
      expireDate.setDate(now.getDate() + formData.days);

      const anuncioData = {
        id: idAnuncio,
        uploadedAt: now.toISOString(),
        expireDate: expireDate.toISOString(),
        companyId: user.id,
        companyName: user.nome,
        days: formData.days,
        totalCost,
        provincias: selectedProvincias,
        sectores: selectedSectores,
        tipoAnuncio: formData.tipoAnuncio,
        phoneNumber: formData.phoneNumber,
        status: AD_STATUS.UNPAID,
        paymentAttempts: 0,
      };

      if (imageUrl) {
        anuncioData.imageUrl = imageUrl;
      }

      if (!isDestacarPerfil) {
        anuncioData.description = formData.description;
        anuncioData.link = formData.link || '#';
      } else {
        anuncioData.description = `Perfil destacado de ${user.nome}`;
        anuncioData.link = `/perfil/${user.id}`;
      }

      await set(anuncioRef, anuncioData);
      return idAnuncio;
    } catch (error) {
      console.error('Error saving to database:', error);
      throw new Error('Falha ao salvar o anúncio no banco de dados');
    }
  }, [formData, user, totalCost, selectedProvincias, selectedSectores, isDestacarPerfil]);

  const uploadImage = useCallback(async () => {
    if (!formData.file) return '';

    try {
      const fileRef = createStorageRef(
        storage,
        `ads/${user.id}/${Date.now()}_${formData.file.name}`
      );
      await uploadBytes(fileRef, formData.file);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Falha no upload da imagem');
    }
  }, [formData.file, user.id]);

  const handlePublish = useCallback(async () => {
    if (!validateForm()) return;
    setUiState(prev => ({ ...prev, showConfirmationDialog: true }));
  }, [validateForm]);

  const handleConfirmPublish = useCallback(async () => {
    setUiState(prev => ({
      ...prev,
      showConfirmationDialog: false,
      uploading: true,
    }));

    try {
      const imageUrl = await uploadImage();
      await saveToDatabase(imageUrl);

      showSnackbar('Anúncio criado com sucesso! Por favor, efetue o pagamento.');
      setUiState(prev => ({
        ...prev,
        uploading: false,
        showPaymentModal: true,
      }));
    } catch (error) {
      console.error('Error publishing ad:', error);
      showSnackbar(error.message || 'Erro ao publicar o anúncio. Tente novamente.', 'error');
      setUiState(prev => ({ ...prev, uploading: false }));
    }
  }, [uploadImage, saveToDatabase, showSnackbar]);

  const processPayment = useCallback(async () => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const response = await fetch('https://mpesa-server-bay.vercel.app/pagar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: "1",
          phoneNumber: formData.phoneNumber,
          reference: `AD_${currentAdId}_${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      return data;
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  }, [user, totalCost, formData.phoneNumber, currentAdId]);

  const updateAdStatus = useCallback(async (status, paymentData = {}) => {
    try {
      const updates = {
        status,
        lastUpdated: new Date().toISOString(),
        ...paymentData,
      };

      if (status === AD_STATUS.PAID) {
        updates.paymentDate = new Date().toISOString();
      }

      const adRef = ref(db, `banners/${currentAdId}`);
      await update(adRef, updates);
    } catch (error) {
      console.error('Error updating ad status:', error);
      throw new Error('Falha ao atualizar status do anúncio');
    }
  }, [currentAdId]);

  const handlePaymentSubmit = useCallback(async (e) => {
    e.preventDefault();

    setUiState(prev => ({
      ...prev,
      paymentLoading: true,
      paymentError: '',
    }));

    try {
      const paymentResult = await processPayment();

      await updateAdStatus(AD_STATUS.PAID, {
        paymentReference: paymentResult.reference,
        paymentMethod: 'mpesa',
      });

      setUiState(prev => ({
        ...prev,
        paymentSuccess: true,
        paymentLoading: false,
      }));

      showSnackbar('Pagamento efetuado com sucesso! Anúncio ativado.');
      onAdCreated();
    } catch (error) {
      try {
        await updateAdStatus(AD_STATUS.PAYMENT_FAILED, {
          paymentError: error.message,
        });
      } catch (dbError) {
        console.error('Error updating status:', dbError);
      }

      setUiState(prev => ({
        ...prev,
        paymentError: error.message || 'Erro ao processar pagamento',
        paymentLoading: false,
      }));
    }
  }, [processPayment, updateAdStatus, showSnackbar, onAdCreated]);

  const resetForm = useCallback(() => {
    setFormData({
      file: null,
      imageUrl: '',
      description: '',
      link: '',
      days: AD_CONFIG.MIN_DAYS,
      phoneNumber: formatPhoneNumber(user?.contacto || ''),
      tipoAnuncio: 'home',
    });
    setSelectedProvincias(user?.provincia ? [user.provincia] : []);
    setSelectedSectores(user?.sector ? [user.sector] : []);
    setCurrentAdId(null);
    setUiState(prev => ({
      ...prev,
      paymentSuccess: false,
      paymentError: '',
      showPaymentModal: false,
    }));
  }, [user]);

  const handlePaymentClose = useCallback(() => {
    setUiState(prev => ({ ...prev, showPaymentModal: false }));
    if (uiState.paymentSuccess) {
      resetForm();
    }
  }, [uiState.paymentSuccess, resetForm]);

  const handleCloseSnackbar = useCallback(() => {
    setUiState(prev => ({
      ...prev,
      snackbar: { ...prev.snackbar, open: false },
    }));
  }, []);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Escolha o tipo de anúncio:
        </Typography>
        <RadioGroup
          value={formData.tipoAnuncio}
          onChange={handleInputChange('tipoAnuncio')}
          row
        >
          {Object.keys(AD_CONFIG.PRICES).map((tipo) => (
            <FormControlLabel
              key={tipo}
              value={tipo}
              control={<Radio />}
              label={tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ')}
            />
          ))}
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
            value={formData.description}
            onChange={handleInputChange('description')}
            inputProps={{ maxLength: AD_CONFIG.MAX_DESCRIPTION_LENGTH }}
            helperText={`${formData.description.length}/${AD_CONFIG.MAX_DESCRIPTION_LENGTH} caracteres`}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            label="Link externo (opcional)"
            variant="outlined"
            fullWidth
            value={formData.link}
            onChange={handleInputChange('link')}
            placeholder="https://exemplo.com"
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
            {formData.imageUrl && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Pré-visualização:
                </Typography>
                <img
                  src={formData.imageUrl}
                  alt="Preview da Imagem"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    objectFit: 'contain',
                  }}
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
          open={uiState.openProvinciaSelect}
          onOpen={() => setUiState(prev => ({ ...prev, openProvinciaSelect: true }))}
          onClose={() => setUiState(prev => ({ ...prev, openProvinciaSelect: false }))}
          value={selectedProvincias}
          onChange={(e) => setSelectedProvincias(e.target.value)}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
          label="Províncias *"
        >
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 1,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          }}>
            <Button size="small" onClick={handleSelectAll('provincia')}>
              Selecionar Todos
            </Button>
            <Button size="small" onClick={handleDeselectAll('provincia')}>
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
          open={uiState.openSetorSelect}
          onOpen={() => setUiState(prev => ({ ...prev, openSetorSelect: true }))}
          onClose={() => setUiState(prev => ({ ...prev, openSetorSelect: false }))}
          value={selectedSectores}
          onChange={(e) => setSelectedSectores(e.target.value)}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} size="small" />
              ))}
            </Box>
          )}
          label="Setores de Atividade *"
        >
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 1,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          }}>
            <Button size="small" onClick={handleSelectAll('setor')}>
              Selecionar Todos
            </Button>
            <Button size="small" onClick={handleDeselectAll('setor')}>
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
        <Typography gutterBottom>Tempo do anúncio (1 a 30 dias): *</Typography>
        <TextField
          type="number"
          value={formData.days}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              setFormData(prev => ({ ...prev, days: '' }));
            } else {
              const parsed = parseInt(value, 10);
              if (!isNaN(parsed)) {
                const clampedValue = Math.min(
                  Math.max(parsed, AD_CONFIG.MIN_DAYS),
                  AD_CONFIG.MAX_DAYS
                );
                setFormData(prev => ({ ...prev, days: clampedValue }));
              }
            }
          }}
          inputProps={{
            min: AD_CONFIG.MIN_DAYS,
            max: AD_CONFIG.MAX_DAYS,
          }}
          fullWidth
          required
        />
      </Box>

      <Box sx={{
        backgroundColor: '#f5f5f5',
        p: 2,
        borderRadius: 1,
        mb: 2,
      }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Valor estimado:</strong> {formatPrice(totalCost)} MT
        </Typography>
        <Typography variant="body2">
          Este anúncio atingirá aproximadamente <strong>{empresasAtingidas}</strong> empresas.
        </Typography>
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handlePublish}
        disabled={uiState.uploading}
        sx={{ mb: 2 }}
        fullWidth
        size="large"
      >
        {uiState.uploading ? <CircularProgress size={24} /> : 'Publicar Anúncio'}
      </Button>

      <Dialog
        open={uiState.showConfirmationDialog}
        onClose={() => setUiState(prev => ({ ...prev, showConfirmationDialog: false }))}
      >
        <DialogTitle>Confirmar Publicação</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Seu anúncio será criado, mas só será publicado após o envio e confirmação do comprovativo de pagamento.
            Deseja continuar?
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Valor a pagar:</strong> {formatPrice(totalCost)} MT
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUiState(prev => ({ ...prev, showConfirmationDialog: false }))}
            color="primary"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmPublish}
            color="primary"
            disabled={uiState.uploading}
            autoFocus
          >
            {uiState.uploading ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={uiState.showPaymentModal}
        onClose={handlePaymentClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          Pagamento do Anúncio
          <Button
            onClick={handlePaymentClose}
            sx={{ color: 'text.primary' }}
          >
            ×
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Card sx={{ boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detalhes do Pagamento
              </Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                mb: 2,
              }}>
                <Typography variant="body2">
                  <strong>ID do Anúncio:</strong>
                </Typography>
                <Typography variant="body2">
                  {currentAdId || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Valor:</strong>
                </Typography>
                <Typography variant="body2">
                  {formatPrice(totalCost)} MT
                </Typography>
                <Typography variant="body2">
                  <strong>Duração:</strong>
                </Typography>
                <Typography variant="body2">
                  {formData.days} dia{formData.days !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </CardContent>
            <CardActions sx={{
              flexDirection: 'column',
              alignItems: 'stretch',
              px: 2,
              pb: 2,
            }}>
              {!uiState.paymentSuccess ? (
                <Box
                  component="form"
                  onSubmit={handlePaymentSubmit}
                  sx={{ width: '100%' }}
                >
                  <TextField
                    label="Telefone M-Pesa *"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, '');
                      let formattedValue = formatPhoneNumber(rawValue);
                      setFormData(prev => ({ ...prev, phoneNumber: formattedValue }));
                    }}
                    fullWidth
                    margin="normal"
                    required
                    helperText={
                      formData.phoneNumber && !new RegExp(`^${AD_CONFIG.PHONE_PREFIX}\\d{9}$`).test(formData.phoneNumber)
                        ? `Número inválido. Formato correto: ${AD_CONFIG.PHONE_PREFIX}XXXXXXXXX`
                        : 'Número de telefone registado no M-Pesa'
                    }
                    error={formData.phoneNumber.length > 0 &&
                      !new RegExp(`^${AD_CONFIG.PHONE_PREFIX}\\d{9}$`).test(formData.phoneNumber)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {AD_CONFIG.PHONE_PREFIX}
                        </InputAdornment>
                      ),
                    }}
                  />
                  {uiState.paymentError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {uiState.paymentError}
                    </Alert>
                  )}
                  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={handlePaymentClose}
                      fullWidth
                      disabled={uiState.paymentLoading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={uiState.paymentLoading}
                      fullWidth
                    >
                      {uiState.paymentLoading ? (
                        <CircularProgress size={24} />
                      ) : (
                        'Pagar via M-Pesa'
                      )}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Alert
                  severity="success"
                  sx={{ mt: 2 }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={handlePaymentClose}
                    >
                      Fechar
                    </Button>
                  }
                >
                  Pagamento processado com sucesso! Seu anúncio está ativo.
                </Alert>
              )}
            </CardActions>
          </Card>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={uiState.snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={uiState.snackbar.severity}
          sx={{ width: '100%' }}
        >
          {uiState.snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

CreateAdTab.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    contacto: PropTypes.string,
    provincia: PropTypes.string,
    sector: PropTypes.string,
  }).isRequired,
  onAdCreated: PropTypes.func.isRequired,
};

export default CreateAdTab;