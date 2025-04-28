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
  useMediaQuery,
  Stack
} from '@mui/material';
import BackButton from '../BackButton';
import {
  RequestQuote,
  CallReceived,
  Gavel,
  Email,
  Phone
} from '@mui/icons-material';

const CallCenterModuleDesk = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const callTypes = [
    {
      icon: <RequestQuote color="primary" />,
      title: "Pedido de Cotação",
      description: "Solicitações feitas por clientes em busca de informações sobre preços e serviços."
    },
    {
      icon: <CallReceived color="primary" />,
      title: "Resposta a Cotação",
      description: "Retorno das empresas aos clientes que solicitaram cotações."
    },
    {
      icon: <Gavel color="primary" />,
      title: "Concurso",
      description: "Chamadas relacionadas a concursos públicos ou ofertas de serviços."
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
        Call Center - Funcionamento
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
        O módulo de Call Center permite que as empresas recebam chamadas relacionadas a pedidos de 
        cotação, respostas a pedidos de cotação e concursos referentes ao seu setor de atividade. 
        As chamadas são registradas e podem ser atendidas diretamente pela equipe responsável. 
        Este módulo é fundamental para otimizar a comunicação com clientes e garantir um atendimento
        ágil e eficiente.
      </Typography>
      
      <Typography 
        variant="subtitle1" 
        sx={{ 
          fontWeight: 'bold',
          color: 'text.primary',
          mb: 2
        }}
      >
        Os tipos de chamadas incluem:
      </Typography>
      
      <Paper sx={{ 
        p: isMobile ? 2 : 3, 
        mb: 4, 
        backgroundColor: 'background.paper',
        borderRadius: 3,
        borderLeft: `4px solid ${theme.palette.primary.main}`
      }}>
        <List disablePadding>
          {callTypes.map((type, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  {type.icon}
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
                      {type.title}
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
                      {type.description}
                    </Typography>
                  }
                />
              </ListItem>
              {index < callTypes.length - 1 && (
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
          fontSize: '1.1rem',
          lineHeight: 1.6
        }}
      >
        O módulo funciona mediante contrato. As empresas que utilizam este módulo podem gerenciar suas chamadas, garantindo que todas as
        solicitações sejam tratadas com a devida atenção.
      </Typography>
      
      <Typography 
        variant="subtitle1" 
        sx={{ 
          fontWeight: 'bold',
          color: 'text.primary',
          mb: 2,
          textAlign: 'center'
        }}
      >
        Para mais informações, entre em contato:
      </Typography>
      
      <Stack 
        direction={isMobile ? 'column' : 'row'} 
        spacing={2} 
        justifyContent="center"
        sx={{ mt: 3 }}
      >
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
      </Stack>
    </Box>
  );
};

export default CallCenterModuleDesk;