import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { Button, CircularProgress, Snackbar, Alert, TextField } from '@mui/material';
import { ref, push, update } from 'firebase/database';
import { auth, db } from '../../fb';

const EmolaCheckout = ({ planPrice, userDb }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: '' });

  const planos = {
    basico: {
      name: 'Básico',
      price: 300, 
      modules: {
        moduloFaturacao: { limit: 10 },
        moduloSMS: { limit: 30 }, 
      }
    },
    pro: {
      name: 'Pro',
      price: 600,
      modules: {
        moduloFaturacao: { limit: 40 },
        moduloSMS: { limit: 200 },
        moduloMarket: { limit: 'ilimitado' },
        moduloInquerito: { limit: 20 },
        moduloCallCenter: { limit: 50 },
        moduloLogistica: { limit: 50 }
      }
    },
    premium: {
      name: 'Premium',
      price: 900, 
      modules: {
        moduloFaturacao: { limit: 'ilimitado' },
        moduloSMS: { limit: 'ilimitado' },
        moduloMarket: { limit: 'ilimitado' },
        moduloAnalytics: { limit: 'ilimitado' },
        moduloInquerito: { limit: 'ilimitado' },
        moduloCallCenter: { limit: 'ilimitado' },
        moduloLogistica: { limit: 'ilimitado' }
      }
    },
  };
  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const validatePhoneNumber = (phone) => /^[8-9][0-9]{8}$/.test(phone);

  const confirmSubscription = async () => {
    if (!user) {
      showNotification('Usuário não autenticado.', 'warning');
      Navigate('/login');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      showNotification('Número de celular inválido.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('https://mozpayment.online/api/1.1/wf/pagamentorotativoemola', {
        carteira: '1729146943643x948653281532969000',
        numero: phoneNumber.toString(),
        'quem comprou': user.displayName || user.email,
        valor: planPrice.toString(),
      });

      if (response.data.status === 'success') {
        showNotification(`Pagamento de ${planPrice} confirmado com sucesso!`, 'success');
        
        const paymentData = { amount: planPrice, method: 'Mpesa', transactionId: response.data.transactionId || null };
        await saveSubscriptionData(userDb.id, 'pro', paymentData);
        window.location='/'
      } else {
        throw new Error(response.data.message || 'Erro desconhecido.');
      }
    } catch (error) {
      showNotification('A transação falhou. Por favor, tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSubscriptionData = async (companyId, planKey, paymentData) => {
    const planoSelecionado = planos[planKey];
    const currentDate = new Date();
    const startDate = currentDate.toISOString().split('T')[0];
    const expiryDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1)).toISOString().split('T')[0];

    const subscriptionData = {
      companyId,
      plan: {
        name: planoSelecionado.name,
        price: planoSelecionado.price,
        modules: planoSelecionado.modules,
        duration: '1 mês',
      },
      payment: {
        amount: paymentData.amount,
        method: paymentData.method,
        transactionId: paymentData.transactionId,
        date: new Date().toISOString(),
      },
      status: 'active',
      startDate,
      expiryDate,
      recurring: false,
    };

    try {
      await push(ref(db, 'subscriptions'), subscriptionData);
      await update(ref(db, `company/${companyId}`), {
        status: true,
        subscriptionExpiryDate: expiryDate,
        activeModules: planoSelecionado.modules,
      });
      console.log('Subscrição salva com sucesso:', subscriptionData);
    } catch (error) {
      console.error('Erro ao salvar a subscrição:', error);
      throw new Error('Erro ao processar o pagamento.');
    }
  };

  const handleClose = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <p className="text-xl font-semibold mb-4">Pagamento com Emola</p>

      <TextField
        label="Número de Celular"
        variant="outlined"
        fullWidth
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="mb-4"
      />

      <div className="flex justify-end space-x-2">
        <Button
          onClick={confirmSubscription}
          variant="contained"
          color="primary"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {isLoading ? <CircularProgress size={24} className="text-white" /> : 'Pagar'}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => window.history.back()}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Cancelar
        </Button>
      </div>

      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default EmolaCheckout;
