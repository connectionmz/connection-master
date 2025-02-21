import React, { useState } from 'react';
import { handlePayment } from '../utils/handlePayment';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { saveContentToInbox } from './SaveToInbox';

const calculatePrice = (smsCount) => Math.ceil(smsCount / 25) * 150;

const validatePhoneNumber = (phoneNumber) => {
  const regex = /^[0-9]{9}$/;
  return regex.test(phoneNumber);
};

const PaySMSCheckout = ({ user, onPaymentSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCount, setSmsCount] = useState(25);
  const [error, setError] = useState(null);
  const [pendingTransaction, setPendingTransaction] = useState(false);

  const handlePaymentClick = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Número de telefone inválido. Deve ter 9 dígitos.');
      return;
    }

    if (smsCount % 25 !== 0) {
      setError('A quantidade de SMS deve ser múltipla de 25.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPendingTransaction(true);

    const planPrice = calculatePrice(smsCount);

    const result = await handlePayment({
      phoneNumber,
      paymentMethod,
      user,
      planPrice,
      smsCount,
      onPaymentSuccess,
      setError,
      setIsLoading,
      setPendingTransaction,
    });

    if (result.success) {
      console.log('Pagamento realizado com sucesso!');

      const notification = {
        type: "module_payment_success",
        message: `Efecutou pagamento de ${smsCount} em saldo de Sms no valor de ${planPrice}`,
        fromUserId: '',
        fromUserName: '',
        timestamp: new Date().toISOString(),
        status: "unread",
      };
      saveContentToInbox(user.id, notification);

    } else {
      console.error('Erro no pagamento:', result.error);
    }
  };

  return (
    <Box  sx={{ padding: 4, maxWidth: 400, margin: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Confirmar Pagamento de SMS
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Número de Celular"
        placeholder="Ex: 841234567"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />

      <TextField
        select
        label="Método de Pagamento"
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      >
        <MenuItem value="mpesa">M-Pesa</MenuItem>
        <MenuItem value="emola">e-Mola</MenuItem>
      </TextField>

      <TextField
        label="Quantidade de SMS"
        type="number"
        value={smsCount}
        onChange={(e) => setSmsCount(Math.max(25, parseInt(e.target.value) || 25))}
        fullWidth
        inputProps={{ step: 25, min: 25 }}
        sx={{ mb: 2 }}
      />
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Pacotes de 25 SMS (150 Mt por pacote)
      </Typography>

      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
        Preço Total: {calculatePrice(smsCount)} Mt
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          fullWidth
          disabled={isLoading || pendingTransaction}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handlePaymentClick}
          disabled={isLoading || pendingTransaction}
          fullWidth
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            'Pagar Agora'
          )}
        </Button>
      </Box>

      {pendingTransaction && (
        <Typography variant="body2" color="primary" sx={{ mt: 2, textAlign: 'center' }}>
          Aguarde a confirmação da transação...
        </Typography>
      )}
    </Box>
  );
};

export default PaySMSCheckout;