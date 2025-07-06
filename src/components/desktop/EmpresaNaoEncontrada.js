import React from 'react';
import { Typography, Box, Button, Paper, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const EmpresaNaoEncontrada = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                <VerifiedIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                    Verificação em Curso
                </Typography>
                
                <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                    Estamos validando as empresas pré-cadastradas para garantir conexões seguras e confiáveis.
                </Typography>
                
                <Box sx={{ 
                    backgroundColor: 'grey.100', 
                    p: 3, 
                    borderRadius: 1,
                    mb: 3,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main'
                }}>
                    <Typography variant="body1" paragraph sx={{ mb: 0 }}>
                        O perfil selecionado está em verificação. Novas empresas estarão disponíveis em breve.
                    </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph sx={{ fontStyle: 'italic' }}>
                    Uma organização | Uma Conexão | Um Futuro
                </Typography>
                
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Suporte Connection Mozambique
                </Typography>
                
                <Button 
                    variant="contained" 
                    onClick={() => navigate('/')}
                    sx={{ mt: 4, px: 4 }}
                    size="medium"
                >
                    Voltar à página inicial
                </Button>
            </Paper>
        </Container>
    );
};

export default EmpresaNaoEncontrada;