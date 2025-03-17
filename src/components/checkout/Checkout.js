import React, { useState } from 'react';
import { Button, Typography, Box, TextField, Select, MenuItem, CircularProgress } from '@mui/material';

const Checkout = ({ totalCost, onConfirmPayment, onCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [isLoading, setIsLoading] = useState(false); // Estado para controlar o loader

  const handlePayment = async () => {
    setIsLoading(true); // Ativa o loader
    try {
      await onConfirmPayment(paymentMethod); // Chama a função de confirmação de pagamento
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
    } finally {
      setIsLoading(false); // Desativa o loader, independentemente do resultado
    }
  };
  return (
    <Box sx={{ padding: 4, maxWidth: 400, margin: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Confirmar Pagamento
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Valor total: <strong>{totalCost} MT</strong>
      </Typography>

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

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handlePayment}
          fullWidth
          disabled={isLoading} // Desabilita o botão durante o carregamento
        >
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} /> // Exibe o loader
          ) : (
            'Confirmar Pagamento'
          )}
        </Button>

        {/* Botão de Cancelar */}
        <Button
          variant="outlined"
          onClick={onCancel} // Chama a função onCancel ao clicar
          fullWidth
          disabled={isLoading} // Desabilita o botão durante o carregamento
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );
};

export default Checkout;