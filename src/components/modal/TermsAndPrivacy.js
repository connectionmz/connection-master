import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const TermsAndPrivacy = ({ onAccept }) => {
  const [open, setOpen] = useState(true);

  const handleAccept = () => {
    localStorage.setItem('acceptedTerms', 'true'); // Armazena a aceitação no localStorage
    setOpen(false);
    onAccept(); // Chama a função de aceitação
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Termos de Uso e Política de Privacidade</DialogTitle>
      <DialogContent>
        <Box sx={{ maxHeight: '400px', overflowY: 'auto', padding: 2 }}>
          <Typography variant="h6" gutterBottom>
            1. Termos de Uso
          </Typography>
          <Typography variant="body1" paragraph>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Typography>
          <Typography variant="h6" gutterBottom>
            2. Política de Privacidade
          </Typography>
          <Typography variant="body1" paragraph>
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAccept} variant="contained" color="primary">
          Aceitar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsAndPrivacy;