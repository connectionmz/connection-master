import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const EmailVerification = () => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate('/auth'); // Altere a rota caso o login esteja em uma rota diferente
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        px: 3,
        backgroundColor: '#f7f9fc',
      }}
    >
      <CheckCircleOutlineIcon
        sx={{ fontSize: 60, color: 'green', mb: 2 }}
      />
      <Typography variant="h4" gutterBottom>
        Verifique sua Caixa de Email
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Enviamos um link de ativação para o seu email. Por favor, clique no link para ativar sua conta.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={handleLoginRedirect}
      >
        Iniciar Sessão
      </Button>
    </Box>
  );
};

export default EmailVerification;
