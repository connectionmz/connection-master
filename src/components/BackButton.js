import React from 'react';
import { Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ label = 'Voltar', variant = 'outlined', sx = {}, fallback = '/' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Sempre tenta voltar, e se falhar, vai para o fallback
    navigate(-1); // Tenta voltar
    
    // Fallback opcional se -1 não funcionar (pode ser redundante em alguns casos)
    setTimeout(() => {
      if (window.location.pathname === fallback) return;
      navigate(fallback);
    }, 100); // Pequeno delay para garantir
  };

  return (
    <Button
      variant={variant}
      startIcon={<ArrowBack />}
      onClick={handleBack}
      sx={{ ...sx }}
    >
      {label}
    </Button>
  );
};

export default BackButton;