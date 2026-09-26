import React from 'react';
import { Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ label = 'Voltar', variant = 'outlined', sx = {}, fallback = '/' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // window.history.state.idx só existe quando há navegação prévia dentro do app
    // (react-router v6). Sem isso, navigate(-1) pode levar para fora do site
    // (ex: link direto de email/partilha) — nesse caso usamos a rota de fallback.
    const hasInAppHistory = (window.history.state?.idx ?? 0) > 0;
    navigate(hasInAppHistory ? -1 : fallback);
  };

  return (
    <Button
      variant={variant}
      startIcon={<ArrowBack />}
      onClick={handleClick}
      sx={{ ...sx }}>
      {label}
    </Button>
  );
};

export default BackButton;
