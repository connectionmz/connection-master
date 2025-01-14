import React, { useState } from 'react';
import { ref, set } from 'firebase/database';
import { db } from '../../fb';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Alert,
} from '@mui/material';

const CreateStoreFormDesk = ({ storeId, planPrice = 800, user }) => {
  const [store, setStore] = useState({ 
    name: '', 
    company: {
      nome: user.nome,
      provincia: user.provincia,
      distrito: user.distrito,
      logo:user.logoUrl
    } || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setStore({ ...store, [e.target.name]: e.target.value });
  };

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      return true;
    } catch (error) {
      alert('A transação falhou. Por favor, tente novamente.');
      console.error('Erro no pagamento:', error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createStore = async () => {
    setIsLoading(true);

    if (!user) {
      alert('Usuário não definido. Não é possível criar a loja.');
      setIsLoading(false);
      return;
    }

    const paymentSuccessful = await handlePayment();

    if (paymentSuccessful) {
      try {
        const storeRef = ref(db, `stores/${storeId}`);
        await set(storeRef, store);
        alert('Loja criada com sucesso!');
        window.location.reload();
      } catch (error) {
        alert('Erro ao criar a loja.');
        console.error('Erro:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#fff',
        boxShadow: 3,
        borderRadius: 2,
      }}
    >
      <Alert severity="info" sx={{ marginBottom: 2 }}>
        <Typography variant="body2">
          <strong>Nota:</strong> A subscrição de uma loja online requer o pagamento único de <strong>{planPrice} MT</strong>.
        </Typography>
      </Alert>

      <Typography variant="h6" gutterBottom>
        Criar Loja
      </Typography>

      <TextField
        fullWidth
        name="name"
        label="Nome da Loja"
        variant="outlined"
        value={store.name}
        onChange={handleInputChange}
        sx={{ marginBottom: 2 }}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={createStore}
        disabled={isLoading}
        startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
      >
        {isLoading ? 'Criando Loja...' : 'Criar Loja'}
      </Button>
    </Box>
  );
};

export default CreateStoreFormDesk;
