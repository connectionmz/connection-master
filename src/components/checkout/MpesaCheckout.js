import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button, CircularProgress, Snackbar, Alert, TextField } from '@mui/material';
import { ref, set } from 'firebase/database';
import { auth, db } from '../../fb';
import SavePaymentData from './SavePaymentData';

const MpesaCheckout = () => {
  const [searchParams] = useSearchParams();
  const plan = 250;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: '' });

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user); 
      }
    });
  }, []);

  const confirmSubscription = async () => {
    if (!user) {
      console.error('Usuário não autenticado');
      window.location = '/auth';
      return;
    }
    if (!phoneNumber) {
      setNotification({ open: true, message: 'Por favor, insira o número de celular.', severity: 'warning' });
      return;
    }
    setIsLoading(true);
  
    try {
      await processMpesaPayment();
  
      const paymentData = {
        amount: plan,
        method: 'Mpesa',
        transactionId: null,
      };
  
      await SavePaymentData({
        companyId: user.uid,
        plan: { name: 'Básico', price: 250, modules: { moduloFaturacao: { limit: 10 }, moduloSMS: { limit: 25 } } },
        paymentData,
      });
  
      setNotification({ open: true, message: 'Inscrição confirmada com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('A transação falhou', error);
      setNotification({ open: true, message: 'A transação falhou. Por favor, tente novamente.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const processMpesaPayment = async () => {
    const paymentData = {
      carteira: '1729146943643x948653281532969000', 
      numero: phoneNumber,
      'quem comprou': user.displayName || 'Cliente Anônimo', 
      valor: plan, 
    };

    try {
      const response = await axios.post('https://mozpayment.online/api/1.1/wf/pagamentorotativompesa', paymentData);
      if (response.data.success) {
        console.log('Pagamento realizado com sucesso:', response.data);
      } else {
        throw new Error('Erro no pagamento: ' + response.data.message);
      }
    } catch (error) {
      throw new Error('Erro ao processar o pagamento com M-Pesa: ' + error.message);
    }
  };

  const updateSubscriptionData = async (plan, phoneNumber) => {
    const companyRef = ref(db, `company/${user.uid}/smsSubscription`);
    const subscriptionData = {
      plan,
      phoneNumber,
      startDate: new Date().toISOString(),
      active: true,
    };

    try {
      await set(companyRef, subscriptionData);
      console.log("Subscrição de SMS atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar subscrição de SMS:", error);
    }
  };

  const handleClose = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <p className="text-xl font-semibold mb-4">Pagamento com Mpesa</p>
      
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
          {isLoading ? (
            <CircularProgress size={24} className="text-white" />
          ) : 'Pagar'}
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

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MpesaCheckout;
