import React from 'react';
import { Box, Typography, Button, Alert, Stack } from '@mui/material';
import { CheckCircleOutline, ContactSupportOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const CompanyVerificationNotice = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogin = async () => {
    navigate('/auth'); // Redireciona para a rota /auth após o login
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        px: 4,
        backgroundColor: '#f5f5f5',
      }}
    >
      <CheckCircleOutline color="success" sx={{ fontSize: 60, mb: 2 }} />
      <Stack spacing={2} sx={{ width: '100%', maxWidth: 400 }}>
        <Alert
          severity="info"
          icon={<ContactSupportOutlined />}
          sx={{ fontSize: '0.875rem' }}
        >
          <Typography
            variant="body1"
            color="textSecondary"
            textAlign="center"
            sx={{ mb: 4 }}
          >
            Os dados da sua empresa estão sendo verificados. Você será notificado
          </Typography>
        </Alert>
      </Stack>
    </Box>
  );
};

export default CompanyVerificationNotice;
