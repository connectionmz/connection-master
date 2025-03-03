import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const EmpresaNaoEncontrada = () => {
    const navigate = useNavigate();

    return (
        <Box textAlign="center" mt={10}>
            <Typography variant="h4" gutterBottom>
                Empresa não encontrada
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
                A empresa que você está tentando acessar não existe ou foi removida.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/')}>
                Voltar para a página inicial
            </Button>
        </Box>
    );
};

export default EmpresaNaoEncontrada;