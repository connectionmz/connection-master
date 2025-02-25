import React, { useState } from 'react';
import { Button, Typography, Box, TextField, Select, MenuItem } from '@mui/material';

const Checkout = ({ totalCost, onConfirmPayment, onCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState('mpesa');

  const handlePayment = () => {
    onConfirmPayment(paymentMethod);
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
        <Button variant="outlined" onClick={onCancel} fullWidth>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handlePayment} fullWidth>
          Confirmar Pagamento
        </Button>
      </Box>
    </Box>
  )
}

export default Checkout