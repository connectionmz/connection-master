import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../fb';
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

const PagamentoModulo = ({ user }) => {
  const API_KEY = process.env.REACT_APP_API_KEY;
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  
  const { moduleKey } = useParams();
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [existingPayment, setExistingPayment] = useState(null);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const navigate = useNavigate();

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
      
      // Check for existing payment
      if (user?.id) {
        const paymentsRef = ref(db, 'payments');
        onValue(paymentsRef, (snapshot) => {
          const payments = snapshot.val();
          if (payments) {
            const userPayments = Object.entries(payments)
              .filter(([_, payment]) => payment.userId === user.id && payment.moduleKey === moduleKey)
              .map(([key, payment]) => ({ key, ...payment }));
            
            if (userPayments.length > 0) {
              setExistingPayment(userPayments[0]);
            } else {
              setExistingPayment(null);
            }
          }
        });
      }
    }
  }, [modules, moduleKey, isLoadingModules, user?.id]);

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('258') && cleaned.length === 12) {
      const prefix = cleaned.substring(3, 5);
      return ['82', '83', '84', '85', '86', '87', '88'].includes(prefix);
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      setError('Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      setError('Por favor, insira um número de telefone moçambicano válido (formato: 2588XXXXXXXX).');
      return;
    }

    // Verificar se já existe pagamento ativo
    if (existingPayment?.status === 'pago') {
      const now = Date.now();
      if (existingPayment.subscription?.end > now) {
        setError('Você já possui uma assinatura ativa para este módulo.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const sanitizedReference = "Modulo" + currentModule.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "");

      const response = await fetch(`${BACKEND_URL}/pagar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          amount: currentModule.price,
          phoneNumber: phoneNumber,
          reference: sanitizedReference,
          moduleKey: moduleKey,
          userId: user.id
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Falha ao processar pagamento');
      }

      setPaymentSuccess(true);
      
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      setError(err.message || 'Ocorreu um erro ao processar o pagamento. Tente novamente mais tarde.');
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
        backgroundColor: '#f5f5f5'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!currentModule && !isLoadingModules) {
    return (
      <Box sx={{ 
        p: 6, 
        backgroundColor: '#f5f5f5', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h4" color="error" gutterBottom>
          Módulo não encontrado
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          O módulo que você está tentando acessar não existe ou foi removido.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Voltar para a página inicial
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
      backgroundColor: '#f5f5f5'
    }}>
      <BackButton sx={{ mb: 2, alignSelf: 'flex-start' }} />

      <Card sx={{ 
        width: '100%', 
        maxWidth: '800px',
        boxShadow: 3,
        borderRadius: 2
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
              <strong>Validade:</strong> {currentModule.validade === 'Anual' ? '1 ano' : '1 mês'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Preço:</strong> {currentModule.price.toLocaleString('pt-PT')} MT
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
                label="Valor do Módulo"
                value={`${currentModule.price.toLocaleString('pt-PT')} MT`}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Referência"
                value={currentModule.name}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Telefone M-Pesa"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                fullWidth
                margin="normal"
                required
                placeholder="258XXXXXXXXX"
                helperText="Número de telefone registado no M-Pesa (formato 2588XXXXXXXX)"
                error={phoneNumber && !validatePhoneNumber(phoneNumber)}
                sx={{ mb: 3 }}
              />
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Pagar via M-Pesa'}
              </Button>
            </Box>
          ) : (
            <Alert severity="success" sx={{ width: '100%' }}>
              Pagamento processado com sucesso! Sua assinatura foi ativada.
            </Alert>
          )}
        </CardActions>
      </Card>
    </Box>
  );
};

export default PagamentoModulo;