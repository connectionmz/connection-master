import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../fb';
import { ref, onValue } from 'firebase/database';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import BackButton from './BackButton';
import PagamentoAccordion from '../according/PagamentoAccordion';
import { useLanguage } from '../context/LanguageContext';

const PagamentoModulo = () => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  
  const { moduleKey } = useParams();
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const numberLocale = language === 'pt' ? 'pt-MZ' : 'en-US';

  useEffect(() => {
    const modulesRef = ref(db, 'modules/modulos');
    const unsubscribe = onValue(modulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const modulesArray = Object.keys(data).map(key => ({
          key,
          ...data[key]
        }));
        setModules(modulesArray);
      }
      setIsLoadingModules(false);
    }, (error) => {
      console.error("Error loading modules:", error);
      setIsLoadingModules(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoadingModules && moduleKey) {
      const foundModule = modules.find((mod) => mod.key === moduleKey);
      setCurrentModule(foundModule || null);
    }
  }, [modules, moduleKey, isLoadingModules]);

  // Função simplificada para formatar o número de telefone
  const handlePhoneNumberChange = (e) => {
    const input = e.target.value;
    
    // Remove tudo que não é dígito
    const digitsOnly = input.replace(/\D/g, '');
    
    // Limita a 9 dígitos (sem o prefixo 258)
    const limitedDigits = digitsOnly.slice(0, 9);
    
    setPhoneNumber(limitedDigits);
  };

  // Função para formatar a exibição do número
  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    
    if (phone.length <= 2) {
      return phone;
    } else if (phone.length <= 5) {
      return `${phone.slice(0, 2)} ${phone.slice(2)}`;
    } else if (phone.length <= 7) {
      return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`;
    } else {
      return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 7)} ${phone.slice(7)}`;
    }
  };

  // Validação do número de telefone
  const validatePhoneNumber = (phone) => {
    if (phone.length !== 9) return false;
    
    const prefix = phone.substring(0, 2);
    return ['82', '83', '84', '85', '86', '87', '88'].includes(prefix);
  };

  // Função para obter o número completo (258 + número)
  const getFullPhoneNumber = () => {
    return `258${phoneNumber}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      if (!BACKEND_URL) {
        setError('payment.error.configuration');
        return;
      }

      if (!currentModule || !validatePhoneNumber(phoneNumber)) {
        setError('payment.error.validation');
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setError('payment.error.authentication');
        return;
      }

      let token;
      try {
        token = await user.getIdToken();
      } catch (tokenError) {
        if (tokenError.code === 'auth/requests-blocked') {
          token = await user.getIdToken(false);
        } else {
          throw tokenError;
        }
      }

      const sanitizedReference = "Modulo" + currentModule.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "");

      const paymentEndpoint = `${BACKEND_URL.replace(/\/$/, '')}/pagar`;
      const response = await fetch(paymentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: currentModule.price,
          phoneNumber: getFullPhoneNumber(),
          reference: sanitizedReference,
          moduleKey: moduleKey,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Falha ao processar pagamento');
      }

      setPaymentSuccess(true);
      
    } catch (err) {
      
      if (err.message.includes('blocked') || err.code === 'auth/requests-blocked') {
        setError('payment.error.connection');
      } else if (err.code?.startsWith('auth/')) {
        setError('payment.error.authentication');
      } else {
        setError('payment.error.generic');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingModules) {
    return (
      <Box sx={{ 
        p: 6, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}>
        <Box sx={{ textAlign: 'center' }} role="status" aria-live="polite">
          <CircularProgress size={48} aria-label={t('payment.loading')} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>{t('payment.loading')}</Typography>
        </Box>
      </Box>
    );
  }

  if (!currentModule && !isLoadingModules) {
    return (
      <Box sx={{ 
        p: 6, 
        bgcolor: 'background.default',
        color: 'text.primary',
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h4" color="error" gutterBottom>
          {t('payment.notFoundTitle')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {t('payment.notFoundDescription')}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('payment.backHome')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 4, md: 6 }, 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%',
      bgcolor: 'background.default',
      color: 'text.primary',
    }}>
      <BackButton sx={{ mb: 2, alignSelf: 'flex-start' }} />

      <Card sx={{ 
        width: '100%', 
        maxWidth: '800px',
        boxShadow: 3,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {currentModule.name}
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {currentModule.description}
          </Typography>
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('payment.validity')}:</strong> {currentModule.validade === 'Anual' ? t('payment.oneYear') : t('payment.oneMonth')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>{t('payment.price')}:</strong> {currentModule.price.toLocaleString(numberLocale)} MT
            </Typography>
          </Box>
          <Box sx={{ mb: 3 }}>
            <PagamentoAccordion data={currentModule} />
          </Box>
        </CardContent>
        
        <CardActions sx={{ 
          flexDirection: 'column', 
          alignItems: 'stretch', 
          px: 3, 
          pb: 3,
          pt: 0
        }}>
          {!paymentSuccess ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                label={t('payment.moduleValue')}
                value={`${currentModule.price.toLocaleString(numberLocale)} MT`}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label={t('payment.reference')}
                value={currentModule.name}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label={t('payment.phone')}
                value={formatPhoneDisplay(phoneNumber)}
                onChange={handlePhoneNumberChange}
                fullWidth
                margin="normal"
                required
                placeholder="84 123 4567"
                helperText={
                  phoneNumber && !validatePhoneNumber(phoneNumber) 
                    ? t('payment.phoneInvalid')
                    : t('payment.phoneHelp')
                }
                error={Boolean(phoneNumber && !validatePhoneNumber(phoneNumber))}
                inputProps={{
                  maxLength: 13,
                  inputMode: 'numeric',
                  autoComplete: 'tel-national',
                }}
                sx={{ mb: 3 }}
              />
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {t(error)}
                </Alert>
              )}
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !phoneNumber || !validatePhoneNumber(phoneNumber)}
                size="large"
                fullWidth
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" aria-label={t('payment.processing')} /> : t('payment.submit')}
              </Button>
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                {t('payment.success')}
              </Alert>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => navigate(moduleKey === 'moduloMarket' ? '/market' : '/app')}
              >
                {t('payment.continue')}
              </Button>
            </Box>
          )}
        </CardActions>
      </Card>
    </Box>
  );
};

export default PagamentoModulo;
