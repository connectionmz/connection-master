import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const PaymentVerification = ({ 
  user, 
  module, 
  onPaymentSuccess, 
  onManualVerification, 
  existingPayment,
  isRejected
}) => {
  const [paymentMethod, setPaymentMethod] = useState(existingPayment?.method || 'bank_transfer');
  const [paymentProof, setPaymentProof] = useState(existingPayment?.proof || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isRejected && existingPayment) {
      setError('You can only submit a new payment proof if your previous payment was rejected.');
      return;
    }
    
    if (!paymentMethod || !paymentProof) {
      setError('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const paymentData = {
        method: paymentMethod,
        proof: paymentProof,
        submittedAt: new Date().toISOString(),
        status: 'processing'
      };

      if (paymentMethod === 'manual_verification') {
        await onManualVerification(true);
      } else {
        await onPaymentSuccess(paymentData);
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      setError('Error submitting payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isRejected && existingPayment && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Your previous payment was rejected. Please submit a new payment proof.
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="payment-method-label">Payment Method</InputLabel>
        <Select
          labelId="payment-method-label"
          value={paymentMethod}
          label="Payment Method"
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
          <MenuItem value="manual_verification">Manual Verification (Admin)</MenuItem>
        </Select>
      </FormControl>

      {paymentMethod === 'bank_transfer' && (
        <>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please upload your payment proof (transaction ID or screenshot)
          </Typography>
          <TextField
            fullWidth
            label="Payment Proof"
            value={paymentProof}
            onChange={(e) => setPaymentProof(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
        </>
      )}

      {paymentMethod === 'manual_verification' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          An admin will verify your payment manually
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isSubmitting}
        fullWidth
        sx={{ mt: 2 }}
      >
        {isSubmitting ? <CircularProgress size={24} /> : 'Submit Payment Proof'}
      </Button>
    </Box>
  );
};

export default PaymentVerification;