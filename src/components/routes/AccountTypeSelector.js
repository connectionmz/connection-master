import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Avatar,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonalIcon,
  Business as BusinessIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const AccountTypeSelector = ({ onSelect }) => {
  const [selectedType, setSelectedType] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSelect = (type) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  const accountTypes = [
    {
      id: 'personal',
      title: 'Conta Pessoal',
      description: 'Ideal para uso individual, gerenciamento financeiro pessoal e pequenas transações.',
      icon: <PersonalIcon fontSize="large" />,
      color: theme.palette.primary.main
    },
    {
      id: 'business',
      title: 'Conta Empresarial',
      description: 'Para empresas, com recursos avançados como múltiplos usuários, relatórios detalhados e integração contábil.',
      icon: <BusinessIcon fontSize="large" />,
      color: theme.palette.secondary.main
    }
  ];

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: isMobile ? 2 : 4 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          textAlign: 'center',
          fontWeight: 700,
          mb: 4,
          color: theme.palette.text.primary
        }}
      >
        Qual tipo de conta você precisa?
      </Typography>
      
      <Typography 
        variant="subtitle1" 
        sx={{ 
          textAlign: 'center',
          mb: 4,
          color: theme.palette.text.secondary
        }}
      >
        Escolha o tipo de conta que melhor atende suas necessidades. Você poderá adicionar 
        detalhes depois.
      </Typography>
      
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
                  <Avatar
                    sx={{
                      bgcolor: type.color + '20',
                      color: type.color,
                      width: 60,
                      height: 60
                    }}
                  >
                    {type.icon}
                  </Avatar>
                </Box>
                <Typography 
                  gutterBottom 
                  variant="h5" 
                  component="h2"
                  sx={{ 
                    textAlign: 'center',
                    fontWeight: 600,
                    color: theme.palette.text.primary
                  }}
                >
                  {type.title}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography 
                  sx={{ 
                    textAlign: 'center',
                    color: theme.palette.text.secondary
                  }}
                >
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
                    color: selectedType === type.id ? type.color : theme.palette.text.secondary
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
          disabled={!selectedType}
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
          Continuar
        </Button>
        
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 2,
            color: theme.palette.text.secondary
          }}
        >
          Você poderá alterar essa configuração mais tarde nas configurações da conta.
        </Typography>
      </Box>
    </Box>
  );
};

export default AccountTypeSelector;