import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button, CircularProgress, Radio, RadioGroup, FormControlLabel, TextField, Snackbar, Alert } from '@mui/material';
import { auth, db } from '../fb'; // Incluímos o `db` para interagir com o Firebase
import { ref, set, update } from 'firebase/database';

const SmsCheckout = () => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan'); // Obtém o plano selecionado da URL

  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: '' });

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user); // Captura o usuário logado
      }
    });
  }, []);

  const confirmSubscription = async () => {
    if (!user) {
      console.error('Usuário não autenticado');
      window.location = '/login';
      return;
    }

    if (!phoneNumber) {
      setNotification({ open: true, message: 'Por favor, insira o número de celular.', severity: 'warning' });
      return;
    }

    setIsLoading(true);

    const wallet_id = 582314;
    const ENDPOINT_URL = `https://e2payments.explicador.co.mz/v1/c2b/mpesa-payment/${wallet_id}`;

    const payloadC2b = {
      "client_id": "9c8f1179-66ce-44bb-999d-e292f62e1860",
      "amount": getPlanAmount(plan),
      "phone": phoneNumber,
      "reference": "PagamentoDeSMSModule",
    };

    const header = {
      Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5YzhmMTE3OS02NmNlLTQ0YmItOTk5ZC1lMjkyZjYyZTE4NjAiLCJqdGkiOiJjYzc2MzM5YTEzNGQzMDViNjk0NzA0Njk2Y2I1NWUzMDkwNmNhM2ExOGI5ZGQ3NDkxMTY5M2MxNzQ1Y2I0YTAzNDBmMjJmODI3YzRjNWRhMyIsImlhdCI6MTcyMTM5ODM3NS4yNDgzNDMsIm5iZiI6MTcyMTM5ODM3NS4yNDgzNDYsImV4cCI6MTc1MjkzNDM3NS4yNDAzMTMsInN1YiI6IiIsInNjb3BlcyI6W119.y5RB9XRrmiTtdwIX9WMX1G77FJiuzJKQWQv-8kytAnJwhDwrGA5UU6iQ_gMJeJsBo8n5S3ER4zfFwqu7KvIJBdVQnb74P15j3BTkuz5EtvaQJgQuwv3kM8PZQ_79hY7ngkmQms0Mc83PPI-PMx4huLB4I-5OfFfdIW716t4Htxz8T7BmDS-XsPcqBjRrrPapASEol4ZFR3T8pJ4eznTPZBg21-QSKt4w2SseVSFgWEk272kufzSHnbSCddFDnMgawMP3Vu8boAb53tgZuDN-UfKg32xHdpMHozaj31MfPaXX_Reyn7qZuFXf37dJgOuz4ASkWI_ilkH_SdlZBeZPPdOEc-a8x0cN38KjoO4xrhDMrmMd9Z0YtFcVYyRodZv0X2daolNNhSNkUW50ct_KrZ0JApcdFpJUMV9fvADZckcbiPj6l30zw5i8wPiQ9vgCIMGrnTRL3UaAgGqvDpwpRejhZ3djlsEk6dvbDaPsTtgvVazYBJSApI39Bsv1_srFdjgaOs7Rulos31vUZT07oJjTWQo_0jHGMeLnryCjU7YDV0NoW4VjzeEdYctZlufCIleTNReg2-PfvY5OnW5IFpB-0QM7vw5cBSsqn3L7k9V9EnZ-wpMtiFgZDOGH_y1BdHCrb44INlSmwmr2UJbDpTaRz2oQBFpjDsLvNQftf-g",
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(ENDPOINT_URL, payloadC2b, { headers: header });
      console.log(response.data);

      // Atualizar a subscrição de SMS na base de dados
      await updateSubscriptionData(plan, phoneNumber);

      setNotification({ open: true, message: 'Inscrição confirmada com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('A transação falhou', error);
      setNotification({ open: true, message: 'A transação falhou. Por favor, tente novamente.', severity: 'error' });
    } finally {
      setIsLoading(false);
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

  const getPlanAmount = (plan) => {
    switch (plan) {
      case 'basico':
        return '390'; // valor do plano básico
      case 'padrao':
        return '780'; // valor do plano padrão
      case 'avancado':
        return '1560'; // valor do plano avançado
      default:
        return '0'; // valor padrão se o plano não for reconhecido
    }
  };

  const handleClose = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Inscrição no Módulo de SMS</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-lg mb-4">Você está prestes a assinar o plano <strong>{plan === 'basico' ? 'Básico' : plan === 'padrao' ? 'Padrão' : 'Avançado'}</strong> do módulo de SMS.</p>
        <p className="text-lg mb-4">Método de pagamento:</p>
        <RadioGroup
          row
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <FormControlLabel value="mpesa" control={<Radio />} label="MPesa" />
          <FormControlLabel value="emola" control={<Radio />} label="eMola" />
        </RadioGroup>
        <TextField
          label="Número de Celular"
          variant="outlined"
          fullWidth
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="mt-4"
        />
        <div className="flex justify-end mt-4">
          <Button
            onClick={confirmSubscription}
            variant="contained"
            color="primary"
            disabled={isLoading}
            startIcon={isLoading && <CircularProgress size={24} />}
          >
            {isLoading ? 'Processando...' : 'Confirmar Inscrição'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            className="ml-2"
            onClick={() => window.history.back()}
          >
            Cancelar
          </Button>
        </div>
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

export default SmsCheckout;
