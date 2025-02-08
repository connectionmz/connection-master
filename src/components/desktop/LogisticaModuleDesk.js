import React, { useState } from 'react';
import { Box, Typography, Button, Paper, List, ListItem, ListItemText } from '@mui/material';
import BackButton from '../BackButton';

const LogisticaModuleDesk = () => {
  return (
    <Box sx={{ padding: 4, backgroundColor: 'white', borderRadius: 2, boxShadow: 3 }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Procurement - Soluções Personalizadas
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', marginBottom: 3 }}>
        Nosso módulo de Procurement oferece uma experiência otimizada para empresas que necessitam de eficiência na busca e entrega de soluções.
      </Typography>
      <Paper sx={{ padding: 3, marginBottom: 3, backgroundColor: 'background.paper' }}>
        <List>
          <ListItem>
            <ListItemText
              primary={<Typography variant="body1" sx={{ fontWeight: 'bold' }}>Pesquisa Inteligente de Produtos e Serviços:</Typography>}
              secondary="Sistema avançado de busca que facilita a identificação de fornecedores e parceiros ideais para cada necessidade."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<Typography variant="body1" sx={{ fontWeight: 'bold' }}>Obtenção Ágil de Orçamentos:</Typography>}
              secondary="Processo simplificado e automatizado para cotação rápida e eficiente, garantindo melhores preços e prazos."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<Typography variant="body1" sx={{ fontWeight: 'bold' }}>Entrega de Soluções Eficientes e Personalizadas:</Typography>}
              secondary="Integração de logística avançada para oferecer soluções sob medida que atendem às necessidades específicas de cada cliente."
            />
          </ListItem>
        </List>
      </Paper>
      <Typography variant="body1" sx={{ color: 'text.secondary', marginBottom: 2 }}>
        Para mais informações, entre em contato por e-mail ou chamada:
      </Typography>
      <Button variant="contained" color="primary" href="mailto:contato@empresa.com" sx={{ marginRight: 2 }}>
        Contatar por E-mail
      </Button>
      <Button variant="contained" color="secondary" href="tel:+55123456789">
        Contatar por Chamada
      </Button>
    </Box>
  );
};
export default LogisticaModuleDesk;