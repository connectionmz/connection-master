import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  InputAdornment,
  Grid,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
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

const steps = ['Dados do Anúncio', 'Pagamento', 'Confirmação'];

const CreateAdTab = ({ user, onAdCreated }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    file: null,
    imageUrl: '',
    description: '',
    link: '',
    days: 1,
    phoneNumber: '',
    tipoAnuncio: 'home',
  });
  
  const [selectedProvincias, setSelectedProvincias] = useState(user?.provincia ? [user.provincia] : []);
  const [selectedSectores, setSelectedSectores] = useState(user?.sector ? [user.sector] : []);
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresasAtingidas, setEmpresasAtingidas] = useState(0);
  const [totalCost, setTotalCost] = useState(PRICES.home);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [currentAdId, setCurrentAdId] = useState(null);

  const isDestacarPerfil = formData.tipoAnuncio === 'destacar_perfil';

  // Efeitos para carregar dados
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
    calculateEmpresasAtingidas();
  }, [formData.days, selectedProvincias, selectedSectores, formData.tipoAnuncio, empresas]);

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
    const empresasFiltradas = empresas.filter((empresa) => {
      const matchesProvincia = selectedProvincias.length === 0 || 
        selectedProvincias.includes(empresa.provincia);
      const matchesSetor = selectedSectores.length === 0 || 
        selectedSectores.includes(empresa.sector);
      return matchesProvincia && matchesSetor;
    });
    setEmpresasAtingidas(empresasFiltradas.length);
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateFormStep1()) return;
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateFormStep1 = () => {
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

  const handleProvinciaChange = (event) => {
    setSelectedProvincias(event.target.value);
  };

  const handleSetorChange = (event) => {
    setSelectedSectores(event.target.value);
  };

const handlePayment = async () => {
  setLoading(true);
  setPaymentError('');
  
  try {
    // 1. Validações iniciais
    if (!/^258\d{9}$/.test(formData.phoneNumber)) {
      throw new Error('Número de telefone inválido. Formato: 258XXXXXXXXX (12 dígitos)');
    }

    // 2. Upload da imagem (se houver)
    let imageUrl = '';
    if (formData.file) {
      const fileRef = createStorageRef(storage, `images/${formData.file.name}`);
      await uploadBytes(fileRef, formData.file);
      imageUrl = await getDownloadURL(fileRef);
    }

    // 3. Criar registro no banco de dados (status: unpaid)
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

    if (imageUrl) anuncioData.imageUrl = imageUrl;
    
    if (!isDestacarPerfil) {
      anuncioData.description = formData.description;
      anuncioData.link = formData.link || '#';
    } else {
      anuncioData.description = `Perfil destacado de ${user.nome}`;
      anuncioData.link = `/perfil/${user.id}`;
    }

    await set(anuncioRef, anuncioData);

    // 4. Preparar dados para o pagamento no formato EXATO requerido
    const paymentData = {
      amount: totalCost.toString(), // Convertendo para string
      phoneNumber: formData.phoneNumber, // Já no formato 258XXXXXXXXX
      reference: `AD${Date.now()}`.substring(0, 12) // Referência simples (máx 12 chars)
    };

    console.log('Enviando para M-Pesa:', paymentData); // Para debug

    // 5. Processar pagamento
    const response = await fetch('https://mpesa-server-bay.vercel.app/pagar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData) // Enviando no formato exato
    });

    // 6. Processar resposta
    const responseData = await response.json();

    if (!response.ok) {
      console.error('Detalhes do erro:', responseData);
      throw new Error(responseData.details?.output_ResponseDesc || 
                    responseData.error || 
                    'Erro ao processar pagamento');
    }

    // 7. Atualizar status para pago
    await set(ref(db, `banners/${idAnuncio}/status`), 'paid');
    
    // 8. Sucesso
    setPaymentSuccess(true);
    setCurrentAdId(null);
    handleNext();
    showSnackbar('Pagamento efetuado com sucesso! Anúncio ativado.', 'success');
    onAdCreated();
    
  } catch (error) {
    console.error('Erro no pagamento:', error);
    setPaymentError(error.message);
    showSnackbar(error.message, 'error');
  } finally {
    setLoading(false);
  }
};

  const resetForm = () => {
    setFormData({
      file: null,
      imageUrl: '',
      description: '',
      link: '',
      days: 1,
      phoneNumber:'',
      tipoAnuncio: 'home',
    });
    setSelectedProvincias(user?.provincia ? [user.provincia] : []);
    setSelectedSectores(user?.sector ? [user.sector] : []);
    setActiveStep(0);
    setPaymentSuccess(false);
    setPaymentError('');
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <CardContent>
                  <FormControl component="fieldset" sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Tipo de Anúncio:
                    </Typography>
                    <RadioGroup
                      value={formData.tipoAnuncio}
                      onChange={handleInputChange('tipoAnuncio')}
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
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
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

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Províncias *</InputLabel>
                    <Select
                      multiple
                      value={selectedProvincias}
                      onChange={handleProvinciaChange}
                      renderValue={(selected) => selected.join(', ')}
                      label="Províncias *"
                    >
                      {provincias.map((provincia) => (
                        <MenuItem key={provincia.provincia} value={provincia.provincia}>
                          <Checkbox checked={selectedProvincias.includes(provincia.provincia)} />
                          <ListItemText primary={provincia.provincia} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Setores de Atividade *</InputLabel>
                    <Select
                      multiple
                      value={selectedSectores}
                      onChange={handleSetorChange}
                      renderValue={(selected) => selected.join(', ')}
                      label="Setores de Atividade *"
                    >
                      {sectores.map((setor) => (
                        <MenuItem key={setor.setor} value={setor.setor}>
                          <Checkbox checked={selectedSectores.includes(setor.setor)} />
                          <ListItemText primary={setor.setor} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box mb={3}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Duração do Anúncio (1 a 30 dias): *
                    </Typography>
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
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ position: 'sticky', top: 16 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Resumo do Anúncio
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Tipo:</Typography>
                    <Typography>
                      {formData.tipoAnuncio === 'home' && 'Página Inicial'}
                      {formData.tipoAnuncio === 'concurso' && 'Concurso'}
                      {formData.tipoAnuncio === 'cotacoes' && 'Cotações'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Duração:</Typography>
                    <Typography>{formData.days} dias</Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Províncias selecionadas:</Typography>
                    <Typography>
                      {selectedProvincias.length > 0 
                        ? selectedProvincias.join(', ') 
                        : 'Nenhuma selecionada'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Setores selecionados:</Typography>
                    <Typography>
                      {selectedSectores.length > 0 
                        ? selectedSectores.join(', ') 
                        : 'Nenhum selecionado'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Empresas atingidas:</Typography>
                    <Typography>{empresasAtingidas} empresas</Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Custo Total:
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {formatPrice(totalCost)} MT
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Card variant="outlined" sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Pagamento via M-Pesa
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Valor a pagar:
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {formatPrice(totalCost)} MT
                </Typography>
              </Box>

              <TextField
                label="Telefone M-Pesa *"
                value={formData.phoneNumber}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '');
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
                sx={{ mb: 3 }}
              />

              {paymentError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {paymentError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Pagar Agora'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  Pagamento Concluído!
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ mb: 2 }}>
                Seu anúncio foi criado com sucesso e está ativo.
              </Typography>

              <Typography variant="body1" sx={{ mb: 4 }}>
                ID do Anúncio: <strong>{currentAdId}</strong>
              </Typography>

              <Button
                variant="contained"
                color="primary"
                onClick={resetForm}
                sx={{ mt: 2 }}
              >
                Criar Novo Anúncio
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {renderStepContent(activeStep)}

      {activeStep === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleNext}
            sx={{ ml: 1 }}
          >
            Próximo
          </Button>
        </Box>
      )}

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
    </Paper>
  );
};

export default CreateAdTab;