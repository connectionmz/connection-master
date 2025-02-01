import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Button, Stack } from '@mui/material';
import BackButton from '../BackButton';

const CallCenterModuleDesk = () => {
  return (
    <Box sx={{ padding: 4, backgroundColor: 'white', borderRadius: 2, boxShadow: 3 }}>
      <BackButton sx={{ mb: 2 }} />

      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Call Center - Funcionamento
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', marginBottom: 3 }}>
        O módulo de Call Center permite que as empresas recebam chamadas relacionadas a pedidos de 
        cotação, respostas a pedidos de cotação e concursos referentes ao seu setor de atividade. 
        As chamadas são registradas e podem ser atendidas diretamente pela equipe responsável. 
        Este módulo é fundamental para otimizar a comunicação com clientes e garantir um atendimento
        ágil e eficiente.
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', marginBottom: 2 }}>
        Os tipos de chamadas incluem:
      </Typography>
      <Paper sx={{ padding: 3, marginBottom: 3, backgroundColor: 'background.paper' }}>
        <List>
          <ListItem>
            <ListItemText
              primary={<Typography variant="body1" sx={{ fontWeight: 'bold' }}>Pedido de Cotação:</Typography>}
              secondary="Solicitações feitas por clientes em busca de informações sobre preços e serviços."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<Typography variant="body1" sx={{ fontWeight: 'bold' }}>Resposta a Cotação:</Typography>}
              secondary="Retorno das empresas aos clientes que solicitaram cotações."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<Typography variant="body1" sx={{ fontWeight: 'bold' }}>Concurso:</Typography>}
              secondary="Chamadas relacionadas a concursos públicos ou ofertas de serviços."
            />
          </ListItem>
        </List>
      </Paper>
      <Typography variant="body1" sx={{ color: 'text.secondary', marginBottom: 2 }}>
        O módulo funciona mediante contrato. As empresas que utilizam este módulo podem gerenciar suas chamadas, garantindo que todas as
        solicitações sejam tratadas com a devida atenção.
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', marginBottom: 2 }}>
        Para mais informações, entre em contato por e-mail ou chamada:
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" color="primary" href="mailto:contato@empresa.com">
          Contatar por E-mail
        </Button>
        <Button variant="contained" color="secondary" href="tel:+55123456789">
          Contatar por Chamada
        </Button>
      </Stack>
    </Box>
  );
};

export default CallCenterModuleDesk;
