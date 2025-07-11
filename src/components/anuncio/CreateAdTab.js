import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as createStorageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../fb';
import { ref, push, set, onValue } from 'firebase/database';
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
} from '@mui/material';
import { formatPrice } from './adUtils';

const PRICES = {
  home: 30,
  concurso: 50,
  cotacoes: 40,
  destacar_perfil: 120,
};

const ADDITIONAL_COSTS = {
  provincia: 30,
  setor: 30,
};

const MAX_DAYS = 30;
const MIN_DAYS = 1;

const CreateAdTab = ({ user, onAdCreated }) => {
  // State
const [formData, setFormData] = useState({
  file: null,
  imageUrl: '',
  description: '',
  link: '',
  days: 1,
  phoneNumber: user?.contacto 
    ? (user.contacto.startsWith('258') 
        ? user.contacto 
        : `258${user.contacto.replace(/^0/, '')}`)
    : '',
  tipoAnuncio: 'home',
});
  
  const [selectedProvincias, setSelectedProvincias] = useState(user?.provincia ? [user.provincia] : []);
  const [selectedSectores, setSelectedSectores] = useState(user?.sector ? [user.sector] : []);
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresasAtingidas, setEmpresasAtingidas] = useState(0);
  const [totalCost, setTotalCost] = useState(PRICES.home);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openProvinciaSelect, setOpenProvinciaSelect] = useState(false);
  const [openSetorSelect, setOpenSetorSelect] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [currentAdId, setCurrentAdId] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const isDestacarPerfil = formData.tipoAnuncio === 'destacar_perfil';

  useEffect(() => {
    const provinciasRef = ref(db, 'provincias');
    const sectoresRef = ref(db, 'sectores_de_atividade');
    const empresasRef = ref(db, 'company');

    const unsubscribeProvincias = onValue(provinciasRef, (snapshot) => {
      const data = snapshot.val();
      setProvincias(data ? Object.values(data) : []);
    });

    const unsubscribeSectores = onValue(sectoresRef, (snapshot) => {
      const data = snapshot.val();
      setSectores(data ? Object.values(data) : []);
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
    });

    return () => {
      unsubscribeProvincias();
      unsubscribeSectores();
      unsubscribeEmpresas();
    };
  }, []);

  useEffect(() => {
    calculateTotalCost();
  }, [formData.days, selectedProvincias, selectedSectores, formData.tipoAnuncio]);

  useEffect(() => {
    calculateEmpresasAtingidas();
  }, [selectedProvincias, selectedSectores, empresas]);

  // Helper functions
  const calculateTotalCost = () => {
    const baseCost = PRICES[formData.tipoAnuncio] || PRICES.home;
    const provinciasCount = Math.max(0, selectedProvincias.length - 1);
    const sectoresCount = Math.max(0, selectedSectores.length - 1);
    
    const additionalCost = 
      (provinciasCount * ADDITIONAL_COSTS.provincia) + 
      (sectoresCount * ADDITIONAL_COSTS.setor);
    
    setTotalCost(formData.days * (baseCost + additionalCost));
  };

  const calculateEmpresasAtingidas = () => {
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
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        file: selectedFile,
        imageUrl: URL.createObjectURL(selectedFile),
      }));
    }
  };

  const handleSelectAll = (type) => () => {
    const allItems = type === 'provincia' 
      ? provincias.map(p => p.provincia) 
      : sectores.map(s => s.setor);
    
    type === 'provincia' 
      ? setSelectedProvincias(allItems) 
      : setSelectedSectores(allItems);
  };

  const handleDeselectAll = (type) => () => {
    type === 'provincia' 
      ? setSelectedProvincias([]) 
      : setSelectedSectores([]);
  };

  const handleProvinciaChange = (event) => {
    setSelectedProvincias(event.target.value);
  };

  const handleSetorChange = (event) => {
    setSelectedSectores(event.target.value);
  };

  const validateForm = () => {
    if (!formData.file && !isDestacarPerfil) {
      showSnackbar('Por favor, selecione uma imagem para o anúncio.', 'error');
      return false;
    }
    if (!formData.days || formData.days < MIN_DAYS || formData.days > MAX_DAYS) {
      showSnackbar('Por favor, selecione uma duração válida (1-30 dias).', 'error');
      return false;
    }
    if (!isDestacarPerfil && !formData.description) {
      showSnackbar('Por favor, insira uma descrição para o anúncio.', 'error');
      return false;
    }
      if (!formData.phoneNumber || !formData.phoneNumber.startsWith('258') || formData.phoneNumber.length !== 12) {
    showSnackbar('Por favor, insira um número de telefone válido no formato 258XXXXXXXXX', 'error');
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

  const saveToDatabase = async (imageUrl) => {
    const anuncioRef = push(ref(db, 'banners'));
    const idAnuncio = anuncioRef.key;
    setCurrentAdId(idAnuncio);

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + formData.days);

    const anuncioData = {
      id: idAnuncio,
      uploadedAt: new Date().toISOString(),
      expireDate: expireDate.toISOString(),
      companyId: user.id,
      days: formData.days,
      totalCost,
      provincias: selectedProvincias,
      sectores: selectedSectores,
      tipoAnuncio: formData.tipoAnuncio,
      phoneNumber: formData.phoneNumber,
      status: 'unpaid'
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
  };

  const handlePublish = async () => {
    if (!validateForm()) return;
    setShowConfirmationDialog(true);
  };

  const handleConfirmPublish = async () => {
    setShowConfirmationDialog(false);
    setUploading(true);

    try {
      let url = '';
      if (formData.file) {
        const fileRef = createStorageRef(storage, `images/${formData.file.name}`);
        await uploadBytes(fileRef, formData.file);
        url = await getDownloadURL(fileRef);
      }
      
      await saveToDatabase(url);
      showSnackbar('Anúncio criado com sucesso! Por favor, efetue o pagamento.', 'success');
      setShowPaymentModal(true);
      
    } catch (error) {
      console.error('Erro ao publicar anúncio:', error);
      showSnackbar('Erro ao publicar o anúncio. Tente novamente.', 'error');
    } finally {
      setUploading(false);
    }
  };

const handlePaymentSubmit = async (e) => {
  e.preventDefault();
  
  if (!user?.id) {
    setPaymentError('Usuário não autenticado. Por favor, faça login novamente.');
    return;
  }

  if (!formData.phoneNumber.startsWith('258') || formData.phoneNumber.length !== 12) {
    setPaymentError('Por favor, verifique o número de telefone (formato 258XXXXXXXXX).');
    return;
  }

  setPaymentLoading(true);
  setPaymentError('');

  try {
    const response = await fetch('https://mpesa-server-bay.vercel.app/pagar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: totalCost.toString(), // Enviar o valor real
        phoneNumber: formData.phoneNumber,
        reference: `Anuncio_${currentAdId}`
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao processar pagamento');
    }

    // Atualizar o status do anúncio no Firebase
    const adRef = ref(db, `banners/${currentAdId}`);
    await set(adRef, { 
      status: 'paid',
      paymentDate: new Date().toISOString(),
      paymentReference: data.reference // Adicionar referência do pagamento
    }, { merge: true });

    setPaymentSuccess(true);
    showSnackbar('Pagamento efetuado com sucesso! Anúncio ativado.', 'success');
    onAdCreated();
    
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    setPaymentError(error.message || 'Ocorreu um erro ao processar o pagamento. Tente novamente mais tarde.');
    
    // Marcar o anúncio como falha no pagamento
    if (currentAdId) {
      const adRef = ref(db, `banners/${currentAdId}`);
      await set(adRef, { status: 'payment_failed' }, { merge: true });
    }
  } finally {
    setPaymentLoading(false);
  }
};

  const resetForm = () => {
    setFormData({
      file: null,
      imageUrl: '',
      description: '',
      link: '',
      days: 1,
      phoneNumber: '',
      tipoAnuncio: 'home',
    });
    setSelectedProvincias(user?.provincia ? [user.provincia] : []);
    setSelectedSectores(user?.sector ? [user.sector] : []);
    setCurrentAdId(null);
    setPaymentSuccess(false);
    setPaymentError('');
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
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
          value={formData.tipoAnuncio}
          onChange={handleInputChange('tipoAnuncio')}
          row>
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
            value={formData.description}
            onChange={handleInputChange('description')}
            inputProps={{ maxLength: 150 }}
            helperText={`${formData.description.length}/150 caracteres`}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Link externo (opcional)"
            variant="outlined"
            fullWidth
            value={formData.link}
            onChange={handleInputChange('link')}
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
          open={openSetorSelect}
          onOpen={() => setOpenSetorSelect(true)}
          onClose={() => setOpenSetorSelect(false)}
          value={selectedSectores}
          onChange={handleSetorChange}
          renderValue={(selected) => selected.join(', ')}
          label="Setores de Atividade *"
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
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
        <Typography>Tempo do anúncio (1 a 30 dias): *</Typography>
        <TextField
          type="number"
          value={formData.days}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              setFormData(prev => ({ ...prev, days: "" }));
            } else {
              const parsed = parseInt(value);
              if (!isNaN(parsed)) {
                const clampedValue = Math.min(Math.max(parsed, MIN_DAYS), MAX_DAYS);
                setFormData(prev => ({ ...prev, days: clampedValue }));
              }
            }
          }}
          inputProps={{ min: MIN_DAYS, max: MAX_DAYS }}
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

      <Dialog
        open={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
      >
        <DialogTitle>Confirmar Publicação</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Seu anúncio será criado, mas só será publicado após o envio e confirmação do comprovativo de pagamento.
            Deseja continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmationDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmPublish} 
            color="primary"
            disabled={uploading}
            autoFocus
          >
            {uploading ? <CircularProgress size={24} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showPaymentModal}
        onClose={handlePaymentClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'flex-start'
          },
          '& .MuiDialog-paper': {
            height: '100%',
            maxHeight: '100vh',
            margin: 0
          }
        }}
      >
        <DialogTitle sx={{ position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          Pagamento do Anúncio
          <Button 
            onClick={handlePaymentClose} 
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            ×
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ 
          padding: 0,
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555'
          }
        }}>
          <Box sx={{ minHeight: 'calc(100% - 64px)' }}>
            <Card sx={{ width: '100%', boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Pagamento do Anúncio
                </Typography>
                
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>ID do Anúncio:</strong> {currentAdId || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Valor a pagar:</strong> {formatPrice(totalCost)} MT
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: 2, pb: 2 }}>
                {!paymentSuccess ? (
                  <Box component="form" onSubmit={handlePaymentSubmit} sx={{ width: '100%' }}>
                    <TextField
                      label="Valor do Anúncio"
                      value={`${formatPrice(totalCost)} MT`}
                      fullWidth
                      margin="normal"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                    
                    <TextField
                      label="Referência"
                      value={`Anúncio ${currentAdId}`}
                      fullWidth
                      margin="normal"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                    <TextField
  label="Telefone M-Pesa *"
  value={formData.phoneNumber}
  onChange={(e) => {
    // Remove tudo que não é dígito
    const rawValue = e.target.value.replace(/\D/g, '');
    
    // Garante que comece com 258 e tenha no máximo 12 caracteres
    let formattedValue = rawValue.startsWith('258') 
      ? rawValue 
      : `258${rawValue}`;
    formattedValue = formattedValue.substring(0, 12);
    
    setFormData(prev => ({ ...prev, phoneNumber: formattedValue }));
  }}
  fullWidth
  margin="normal"
  required
  helperText={
    formData.phoneNumber && !/^258\d{9}$/.test(formData.phoneNumber)
      ? 'Número inválido. Formato correto: 258XXXXXXXXX (12 dígitos no total)'
      : 'Número de telefone registado no M-Pesa'
  }
  error={formData.phoneNumber.length > 0 && !/^258\d{9}$/.test(formData.phoneNumber)}
  InputProps={{
    startAdornment: <InputAdornment position="start">258</InputAdornment>,
  }}
/>
                    {paymentError && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {paymentError}
                      </Alert>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={handlePaymentClose}
                        fullWidth
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={paymentLoading}
                        fullWidth
                      >
                        {paymentLoading ? <CircularProgress size={24} /> : 'Pagar via M-Pesa'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Pagamento processado com sucesso!
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handlePaymentClose}
                      sx={{ mt: 2 }}
                      fullWidth
                    >
                      Fechar
                    </Button>
                  </Alert>
                )}
              </CardActions>
            </Card>
          </Box>
        </DialogContent>
      </Dialog>

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