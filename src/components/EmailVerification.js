import React from 'react';
import { Button, Typography, Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { signOut } from 'firebase/auth';
import { auth } from '../fb';

const EmailVerification = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Fazer o logout do Firebase
      await signOut(auth);
      console.log('Usuário deslogado com sucesso.');

      // Redirecionar para a página de login
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout', error);
    }
  };

  return (
    <Container
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        px: 3,
        backgroundColor: '#f4f6f9',
      }}
    >
      <CheckCircleOutlineIcon
        sx={{
          fontSize: 80,
          color: '#4caf50',
          mb: 3,
        }}
      />
<Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }} gutterBottom>
  Conta em Verificação
</Typography>
<Typography 
  variant="body1" 
  sx={{
    color: '#555', 
    mb: 4, 
    fontSize: '1rem', 
    maxWidth: '500px', 
    lineHeight: 1.6, // Melhorar a legibilidade
  }}
>
  Sua conta está em processo de verificação. Em breve, você receberá uma notificação por e-mail no endereço <strong>{user}</strong> assim que a verificação for concluída. 
  Por favor, aguarde.
  <br />
  <br />
  <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#888' }}>
    Em caso de dúvida, entre em contato com o suporte através do e-mail: 
    <a href="mailto:support@connectionmozambique.com" style={{ color: '#1e88e5', textDecoration: 'none' }}>
      support@connectionmozambique.com
    </a>
  </Typography>
</Typography>

      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={handleLogout}
        sx={{
          boxShadow: 3,
          ':hover': {
            boxShadow: 6,
            transform: 'scale(1.05)',
          },
          px: 4,
          py: 1.5,
          fontWeight: 600,
        }}
      >
        Ir para o Login
      </Button>
    </Container>
  );
};

export default EmailVerification;
