import React from 'react';
import { Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ label = 'Voltar', variant = 'outlined', sx = {} }) => {
  const navigate = useNavigate();

  return (
    <Button
      variant={variant}
      startIcon={<ArrowBack />}
      onClick={() => navigate(-1)}
      sx={{ ...sx }}>
      {label}
    </Button>
  );
};

export default BackButton;
