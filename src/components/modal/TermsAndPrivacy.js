import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TermsAndPrivacy = ({ onContinue }) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const handleContinue = () => {
    setOpen(false);
    onContinue(); // Chama função de continuação (se necessário)
  };

  const handleViewTerms = () => {
    navigate('/termos');
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>Bem-vindo à Plataforma!</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" gutterBottom>
            Obrigado por se juntar a nós. Para entender melhor os seus direitos e deveres enquanto utiliza esta aplicação,
            recomendamos que leia os nossos{' '}
            <Link onClick={handleViewTerms} sx={{ cursor: 'pointer' }}>
              Termos de Uso e Política de Privacidade
            </Link>.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleContinue} variant="contained" color="primary">
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsAndPrivacy;
