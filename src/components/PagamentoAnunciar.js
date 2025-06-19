import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set, push } from 'firebase/database';
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
import { db } from '../fb';

const PagamentoAnunciar = ({ user, onPaymentSuccess, customAmount, adId, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [existingPayment, setExistingPayment] = useState(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.contacto) {
      const formattedPhone = user.contacto.startsWith('258') 
        ? user.contacto 
        : `258${user.contacto.replace(/^0/, '')}`;
      setPhoneNumber(formattedPhone);
    }
  }, [user]);

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
      // Call to M-Pesa server
      const response = await fetch('http://localhost:5000/pagar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: customAmount,
          phoneNumber,
          reference: `Anuncio`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      setPaymentSuccess(true);

      // Call payment success callback
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
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

  return (
    <Box sx={{ p: 2 }}>
      <Card sx={{ width: '100%', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Pagamento do Anúncio
          </Typography>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>ID do Anúncio:</strong> {adId || 'N/A'}
            </Typography>
            <Typography variant="body2">
              <strong>Valor a pagar:</strong> {customAmount} MT
            </Typography>
          </Box>
        </CardContent>
        <CardActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: 2, pb: 2 }}>
          {!paymentSuccess ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                label="Valor do Anúncio"
                value={`${customAmount} MT`}
                fullWidth
                margin="normal"
                InputProps={{
                  readOnly: true,
                }}
              />
              
              <TextField
                label="Referência"
                value={`Anúncio ${adId}`}
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
              
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={onClose}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'Pagar via M-Pesa'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Alert severity="success" sx={{ mt: 2 }}>
              Pagamento processado com sucesso!
              <Button
                variant="contained"
                color="primary"
                onClick={onClose}
                sx={{ mt: 2 }}
                fullWidth
              >
                Fechar
              </Button>
            </Alert>
          )}
        </CardActions>
      </Card>
      <Dialog
        open={showReplaceDialog}
        onClose={handleCancelReplace}>
        <DialogTitle>Novo pagamento?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você já iniciou um pagamento para este anúncio. Tem certeza que deseja realizar um novo pagamento?
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

export default PagamentoAnunciar;