import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';

const PayModuleCheckout = ({ user, planPrice, onPaymentSuccess, validade }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa'); // Método de pagamento padrão
  const [phoneNumber, setPhoneNumber] = useState(''); // Estado para o número de celular
  const [error, setError] = useState(null); // Estado para mensagens de erro
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Estado para controlar o Snackbar
  const [timeoutId, setTimeoutId] = useState(null); // Estado para armazenar o ID do temporizador

  // Função para calcular a data de expiração
  const calculateExpirationDate = (validityPeriod) => {
    const currentDate = new Date();
    switch (validityPeriod) {
      case 'mensal':
        return new Date(currentDate.setMonth(currentDate.getMonth() + 1));
      case 'anual':
        return new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
      default:
        return new Date();
    }
  };

  // Função para iniciar o temporizador de 1 minuto
  const startTimeout = () => {
    const id = setTimeout(() => {
      setError('Tempo esgotado. A página será recarregada para evitar cobranças repetidas.');
      setSnackbarOpen(true);
      setTimeout(() => window.location.reload(), 3000); // Recarrega a página após 3 segundos
    }, 60000); // 60.000 milissegundos = 1 minuto
    setTimeoutId(id);
  };

  // Função para limpar o temporizador
  const clearTimeout = () => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  useEffect(() => {
    return () => {
      // Limpa o temporizador ao desmontar o componente
      clearTimeout();
    };
  }, []);

  const handlePayment = async () => {
    // Verifica se o valor do plano é válido
    if (planPrice <= 0) {
      setError('O valor do plano deve ser maior que zero.');
      setSnackbarOpen(true);
      return;
    }

    if (!phoneNumber) {
      setError('Por favor, insira o número de celular.');
      setSnackbarOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Inicia o temporizador de 1 minuto
    startTimeout();

    const paymentData = {
      carteira: '1729146943643x948653281532969000',
      numero: phoneNumber,
      'quem comprou': user.displayName || 'Cliente Anônimo',
      valor: planPrice.toString(),
    };

    const endpoint =
      paymentMethod === 'mpesa'
        ? 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativompesa'
        : 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativoemola';

    try {
      const response = await axios.post(endpoint, paymentData);
      const { data } = response;
      const { status, response: apiResponse, message } = data;
      const statusCode = response.status;

      if (statusCode === 200 && status === 'success' && apiResponse.success === true) {
        // Calcular a data de expiração (exemplo: 1 mês)
        const dataQueExpira = calculateExpirationDate(validade);

        // Passar a data de expiração para onPaymentSuccess
        onPaymentSuccess({
          amount: planPrice,
          method: paymentMethod.toUpperCase(),
          dataQueExpira, // Adicionando a data de expiração
        });

        setSnackbarOpen(true);
        clearTimeout(); // Limpa o temporizador após o sucesso
        return { success: true };
      } else if (statusCode === 200 && status === 'success' && apiResponse.success === false) {
        setError('Erro na transação. Tente novamente.');
        setSnackbarOpen(true);
        clearTimeout(); // Limpa o temporizador em caso de erro
        return { success: false, error: 'Erro na transação' };
      } else if (statusCode === 422) {
        setError('Saldo insuficiente. Verifique seu saldo e tente novamente.');
        setSnackbarOpen(true);
        clearTimeout(); // Limpa o temporizador em caso de erro
        return { success: false, error: 'Saldo insuficiente' };
      } else if (statusCode === 400) {
        setError('PIN incorreto. Tente novamente.');
        setSnackbarOpen(true);
        clearTimeout(); // Limpa o temporizador em caso de erro
        return { success: false, error: 'PIN incorreto' };
      } else {
        setError(message || 'Erro desconhecido durante o pagamento. Tente novamente');
        setSnackbarOpen(true);
        clearTimeout(); // Limpa o temporizador em caso de erro
        return { success: false, error: message || 'Erro desconhecido' };
      }
    } catch (error) {
      console.error('Erro no pagamento:', error.message);
      setError('A transação falhou. Por favor, tente novamente.');
      setSnackbarOpen(true);
      clearTimeout(); // Limpa o temporizador em caso de erro
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 400, margin: 'auto', padding: 3, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        Confirmar Pagamento
      </Typography>

      {/* Informação sobre a cobrança */}
      <Typography variant="body1" sx={{ mb: 3 }}>
        A cobrança será feita no número <strong>{phoneNumber}</strong>. Certifique-se de que o número está correto.
      </Typography>

      {/* Input para o número de celular */}
      <TextField
        fullWidth
        label="Número de Celular"
        placeholder="XXXXXXXXX"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* Seleção do método de pagamento */}
      <Select
        fullWidth
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        sx={{ mb: 3 }}
      >
        <MenuItem value="mpesa">M-Pesa</MenuItem>
        <MenuItem value="emola">e-Mola</MenuItem>
      </Select>

      {/* Botão de pagamento */}
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handlePayment}
        disabled={isLoading || !phoneNumber || planPrice <= 0}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Pagar Agora'}
      </Button>

      {/* Snackbar para exibir mensagens de erro/sucesso */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={error ? 'error' : 'success'}>
          {error || 'Pagamento realizado com sucesso!'}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PayModuleCheckout;