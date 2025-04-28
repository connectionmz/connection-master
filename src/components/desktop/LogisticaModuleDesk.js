import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import BackButton from '../BackButton';
import {
  Search,
  RequestQuote,
  DeliveryDining,
  Email,
  Phone
} from '@mui/icons-material';

const LogisticaModuleDesk = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const features = [
    {
      icon: <Search color="primary" />,
      title: "Pesquisa Inteligente de Produtos e Serviços",
      description: "Sistema avançado de busca que facilita a identificação de fornecedores e parceiros ideais para cada necessidade."
    },
    {
      icon: <RequestQuote color="primary" />,
      title: "Obtenção Ágil de Orçamentos",
      description: "Processo simplificado e automatizado para cotação rápida e eficiente, garantindo melhores preços e prazos."
    },
    {
      icon: <DeliveryDining color="primary" />,
      title: "Entrega de Soluções Eficientes e Personalizadas",
      description: "Integração de logística avançada para oferecer soluções sob medida que atendem às necessidades específicas de cada cliente."
    }
  ];

  return (
    <Box sx={{ 
      maxWidth: 800, 
      mx: 'auto',
      p: isMobile ? 2 : 4, 
      backgroundColor: 'white', 
      borderRadius: 4,
      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)'
    }}>
      <BackButton sx={{ mb: 3 }} />
      
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold', 
          color: 'primary.main',
          mb: 3
        }}
      >
        Procurement - Soluções Personalizadas
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          color: 'text.secondary', 
          mb: 4,
          fontSize: '1.1rem',
          lineHeight: 1.6
        }}
      >
        Nosso módulo de Procurement oferece uma experiência otimizada para empresas que necessitam de eficiência na busca e entrega de soluções.
      </Typography>
      
      <Paper sx={{ 
        p: isMobile ? 2 : 3, 
        mb: 4, 
        backgroundColor: 'background.paper',
        borderRadius: 3,
        borderLeft: `4px solid ${theme.palette.primary.main}`
      }}>
        <List disablePadding>
          {features.map((feature, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  {feature.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: 'text.primary',
                        mb: 0.5
                      }}
                    >
                      {feature.title}
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        lineHeight: 1.5
                      }}
                    >
                      {feature.description}
                    </Typography>
                  }
                />
              </ListItem>
              {index < features.length - 1 && (
                <Divider variant="inset" component="li" sx={{ ml: 6 }} />
              )}
            </React.Fragment>
          ))}
        </List>
      </Paper>
      
      <Typography 
        variant="body1" 
        sx={{ 
          color: 'text.secondary', 
          mb: 3,
          textAlign: 'center',
          fontSize: '1.1rem'
        }}
      >
        Para mais informações, entre em contato:
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'center',
        gap: 2,
        mt: 3
      }}>
        <Button 
          variant="contained" 
          color="primary" 
          href="mailto:comercial@connectionmozambique.com" 
          startIcon={<Email />}
          sx={{ 
            py: 1.5,
            px: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.15)'
            }
          }}
        >
          Enviar E-mail
        </Button>
        
        <Button 
          variant="outlined" 
          color="primary" 
          href="tel:+258841234567"
          startIcon={<Phone />}
          sx={{ 
            py: 1.5,
            px: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2
            }
          }}
        >
          Ligar Agora
        </Button>
      </Box>
    </Box>
  );
};

export default LogisticaModuleDesk;