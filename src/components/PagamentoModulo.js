import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../fb';
import { ref, onValue, push, set, query, orderByChild, equalTo, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getApp } from 'firebase/app';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import BackButton from './BackButton';
import PagamentoAccordion from '../according/PagamentoAccordion';

const PagamentoModulo = ({ user }) => {
  const { moduleKey } = useParams();
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [existingPayment, setExistingPayment] = useState(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(true);
  const navigate = useNavigate();

  const app = getApp();
  const storage = getStorage(app);

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
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (modules.length > 0 && moduleKey) {
      const foundModule = modules.find((mod) => mod.key === moduleKey);
      if (foundModule) {
        setCurrentModule(foundModule);
      }
    }
  }, [modules, moduleKey]);

  useEffect(() => {
    if (user?.contacto) {
      const formattedPhone = user.contacto.startsWith('258') 
        ? user.contacto 
        : `258${user.contacto.replace(/^0/, '')}`;
      setPhoneNumber(formattedPhone);
    }
  }, [user]);

  const calculateSubscriptionEnd = (validade) => {
    const now = Date.now();
    const durationInMs = {
      Mensal: 30 * 24 * 60 * 60 * 1000, 
      Anual: 365 * 24 * 60 * 60 * 1000,
    };
    return now + (durationInMs[validade] || durationInMs.Mensal); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      setError('Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    if (!phoneNumber) {
      setError('Por favor, verifique o número de telefone.');
      return;
    }

    setLoading(true);
    setError('');

    try {

    const sanitizedReference = "Modulo"+currentModule.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "");

      const response = await fetch('https://mpesa-server-bay.vercel.app/pagar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: currentModule.price,
          phoneNumber,
          reference: sanitizedReference
        }),
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      const now = Date.now();
      const subscriptionEnd = calculateSubscriptionEnd(currentModule.validade);

      const paymentData = {
        userId: user.id,
        userName: user.displayName || '',
        userEmail: user.email || '',
        nome: user.nome || '',
        telefone: user.contacto || '',
        moduleKey,
        moduleName: currentModule?.name || '',
        moduleType: currentModule?.type || 'standard',
        amount: currentModule.price,
        reference: currentModule.name,
        status: 'pendente',
        timestamp: existingPayment?.timestamp || now,
        updatedAt: now,
        mpesaResponse: data.data,
        
        // Subscription data
        subscription: {
          isActive: true,
          start: now,
          end: subscriptionEnd,
          durationDays: currentModule.validade === 'Anual' ? 365 : 30,
          moduleKey,
          moduleName: currentModule?.name || '',
          subscriptionType: currentModule.validade.toLowerCase(),
        }
      };

      let paymentRef;
      if (existingPayment) {
        // Update existing payment
        paymentRef = ref(db, `payments/${existingPayment.key}`);
        await set(paymentRef, paymentData);
      } else {
        // Create new payment
        const paymentsRef = ref(db, 'payments');
        paymentRef = push(paymentsRef);
        await set(paymentRef, paymentData);
      }

      const subscriptionRef = ref(db, `subscriptions/${user.id}/${moduleKey}`);
      await set(subscriptionRef, {
        isActive: true,
        start: now,
        end: subscriptionEnd,
        durationDays: currentModule.validade === 'Anual' ? 365 : 30,
        moduleKey,
        moduleName: currentModule?.name || '',
        subscriptionType: currentModule.validade.toLowerCase(),
        paymentId: existingPayment?.key || paymentRef.key,
        validade: currentModule.validade,
      });

      setPaymentSuccess(true);
      setExistingPayment({
        ...(existingPayment || {}),
        ...paymentData,
        key: existingPayment?.key || paymentRef.key
      });
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      setError(err.message || 'Ocorreu um erro ao processar o pagamento. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
      setShowReplaceDialog(false);
    }
  };

  const handleCancelReplace = () => {
    setShowReplaceDialog(false);
  };

  useEffect(() => {
    if (user?.id) {
      const subscriptionsRef = ref(db, `subscriptions/${user.id}`);
      onValue(subscriptionsRef, (snapshot) => {
        const subscriptions = snapshot.val();
        if (subscriptions) {
          const now = Date.now();
          Object.entries(subscriptions).forEach(([key, sub]) => {
            if (sub.end < now && sub.isActive) {
              // Update status to expired
              const subRef = ref(db, `subscriptions/${user.id}/${key}`);
              set(subRef, {
                ...sub,
                isActive: false
              });
            }
          });
        }
      });
    }
  }, [user?.id]);

  if (!currentModule) {
    return (
      <Box sx={{ p: 6, backgroundColor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" color="error">
          Módulo não encontrado
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Voltar para a página inicial
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4, md: 6 }, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <BackButton sx={{ mb: 2, alignSelf: 'flex-start' }} />

      <Card sx={{ width: '100%', maxWidth: 600, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {currentModule.name}
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {currentModule.description}
          </Typography>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Validade:</strong> {currentModule.validade === 'Anual' ? '1 ano' : '1 mês'}
            </Typography>
            <Typography variant="body2">
              <strong>Preço:</strong> {currentModule.price} MT
            </Typography>
          </Box>
          
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
            <PagamentoAccordion data={currentModule} />
          </Box>
        </CardContent>
        <CardActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: 2, pb: 2 }}>
          {!paymentSuccess ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                label="Valor do Módulo"
                value={`${currentModule.price} MT`}
                fullWidth
                margin="normal"
                InputProps={{
                  readOnly: true,
                }}
              />
              
              <TextField
                label="Referência"
                value={currentModule.name}
                fullWidth
                margin="normal"
                InputProps={{
                  readOnly: true,
                }}
              />
              
              <TextField
                label="Telefone M-Pesa"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                fullWidth
                margin="normal"
                required
                helperText="Número de telefone registado no M-Pesa (formato 258XXXXXXXXX)"
              />
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 3 }}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Pagar via M-Pesa'}
              </Button>
            </Box>
          ) : (
            <Alert severity="success" sx={{ mt: 2 }}>
              Pagamento processado com sucesso!
              
              {existingPayment?.mpesaResponse && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Módulo:</strong> {currentModule.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Valor:</strong> {currentModule.price} MT
                  </Typography>
                  <Typography variant="body2">
                    <strong>Validade:</strong> {currentModule.validade === 'Anual' ? '1 ano' : '1 mês'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Transação:</strong> {existingPayment.mpesaResponse.output_TransactionID || 'N/A'}
                  </Typography>
                </Box>
              )}
            </Alert>
          )}
        </CardActions>
      </Card>
      
      <Dialog
        open={showReplaceDialog}
        onClose={handleCancelReplace}
      >
        <DialogTitle>Novo pagamento?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você já iniciou um pagamento para este módulo. Tem certeza que deseja realizar um novo pagamento?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReplace}>Cancelar</Button>
          <Button onClick={handleSubmit} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Confirmar Pagamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PagamentoModulo;