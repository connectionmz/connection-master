// Crie um novo componente SelectAccountType.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dialog,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Divider,
  Button,
  Alert
} from '@mui/material';
import {
  Person as PersonalIcon,
  Business as BusinessIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { ref, set } from 'firebase/database';
import { db } from '../fb';

const SelectAccountType = () => {
  const [selectedType, setSelectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { message, userId } = location.state || {};

  const handleSelect = (type) => {
    setSelectedType(type);
  };

  const handleConfirm = async () => {
    if (!selectedType) {
      setError('Erro ao processar seleção. Tente novamente.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
    

      // Redirecionar com base no tipo selecionado
      if (selectedType === 'business') {
        navigate('/setup');
      } else {
        navigate('/setupUser');
      }
    } catch (error) {
      console.error('Erro ao salvar tipo de conta:', error);
      setError('Erro ao salvar suas preferências. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const accountTypes = [
    {
      id: 'personal',
      title: 'Conta Pessoal',
      description: 'Ideal para uso individual, com possibilidade de fazer pedidos de cotação, acesso a lojas e outros serviços disponíveis na plataforma.',
      icon: <PersonalIcon fontSize="large" />,
      color: 'primary.main'
    },
    {
      id: 'business',
      title: 'Conta Empresarial',
      description: 'Para empresas, com acesso aos módulos de Cotações, Concursos e mais, permitindo a gestão do seu negócio e networking a nível nacional.',
      icon: <BusinessIcon fontSize="large" />,
      color: 'secondary.main'
    }
  ];

  return (
    <Dialog open={true} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, p: 0 } }}>
      <Box sx={{ p: 4 }}>
        {message && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}
        
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', fontWeight: 700, mb: 2 }}>
          Selecione o tipo de conta
        </Typography>
        
        <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
          Escolha o tipo de conta que melhor atende suas necessidades. Você poderá adicionar detalhes depois.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} justifyContent="center">
          {accountTypes.map((type) => (
            <Grid item xs={12} sm={6} key={type.id}>
              <Card
                onClick={() => handleSelect(type.id)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  border: selectedType === type.id ? `2px solid ${type.color}` : '2px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${type.color}20`, color: type.color, width: 60, height: 60 }}>
                      {type.icon}
                    </Avatar>
                  </Box>
                  <Typography gutterBottom variant="h5" component="h2" sx={{ textAlign: 'center', fontWeight: 600 }}>
                    {type.title}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                    {type.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      color: selectedType === type.id ? type.color : 'text.secondary'
                    }}
                  >
                    {selectedType === type.id ? 'Selecionado' : 'Selecionar'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            disabled={!selectedType || isLoading}
            onClick={handleConfirm}
            sx={{
              px: 6,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
              '&:disabled': {
                opacity: 0.7
              }
            }}
          >
            {isLoading ? 'Processando...' : 'Continuar'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default SelectAccountType;