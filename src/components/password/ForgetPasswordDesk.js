import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Snackbar, Alert, TextField, Button, Box } from '@mui/material';
import { auth } from '../../fb';

const ForgetPasswordDesk = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsDisabled(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('E-mail de redefinição de senha enviado com sucesso!');
      setEmail('');
      window.location = '/auth';
    } catch (error) {
      setMessage('Erro ao enviar e-mail de redefinição: ' + error.message);
    } finally {
      setIsDisabled(false);
      setShowSnackbar(true);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: '#f7f7f7' }}
    >
      <Box
        component="form"
        onSubmit={handleResetPassword}
        sx={{
          backgroundColor: 'white',
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Esqueceu sua senha?</h2>
        <TextField
          label="Email"
          variant="outlined"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isDisabled}
          sx={{ marginBottom: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isDisabled}
          sx={{
            backgroundColor: isDisabled ? 'gray' : '#1976d2',
            '&:hover': {
              backgroundColor: isDisabled ? 'gray' : '#115293',
            },
          }}
        >
          {isDisabled ? 'Enviando...' : 'Enviar e-mail de redefinição'}
        </Button>
      </Box>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          severity={message.includes('sucesso') ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ForgetPasswordDesk;
