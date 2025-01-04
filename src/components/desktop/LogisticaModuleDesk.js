import React, { useState } from 'react';
import { Box, Typography, Button, Paper, List, ListItem, ListItemText } from '@mui/material';

const LogisticaModuleDesk = ({ isAvailable }) => {
  const [pedidos, setPedidos] = useState([
    { id: 1, item: 'Computador', destino: 'Centro da Cidade', status: 'Pendente' },
    { id: 2, item: 'Impressora', destino: 'Distrito Industrial', status: 'Pendente' }
  ]);

  const handleConfirmarEntrega = (id) => {
    setPedidos(pedidos.map(pedido =>
      pedido.id === id ? { ...pedido, status: 'Entregue' } : pedido
    ));
    alert(`Entrega confirmada!`);
  };

  return (
    <Box sx={{ padding: 4, backgroundColor: 'white', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Logística - Pedidos de Entrega
      </Typography>
      {isAvailable ? (
        <List>
          {pedidos.map((pedido) => (
            <ListItem key={pedido.id} sx={{ backgroundColor: 'gray.100', padding: 2, marginBottom: 2, borderRadius: 1 }}>
              <ListItemText
                primary={<Typography variant="body1" sx={{ fontWeight: 'bold' }}>Item: {pedido.item}</Typography>}
                secondary={
                  <>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Destino: {pedido.destino}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Status: {pedido.status}</Typography>
                  </>
                }
              />
              {pedido.status === 'Pendente' && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleConfirmarEntrega(pedido.id)}
                  sx={{ marginTop: 1 }}
                >
                  Confirmar Entrega
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body1" color="error" align="center" sx={{ fontWeight: 'bold' }}>
          Módulo Indisponível
        </Typography>
      )}
    </Box>
  );
};

export default LogisticaModuleDesk;
