import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../fb';
import { CircularProgress, Typography, Box, Paper, Alert } from '@mui/material';
import CreateStoreFormDesk from '../market/CreateStoreFormDesk';
import ManageStoreDesk from '../market/ManageStoreDesk';
import BackButton from '../BackButton';

const MarketDesk = ({ user }) => {
  const [storeExists, setStoreExists] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [error, setError] = useState(null);
  const [storeData, setStoreData] = useState(null); // Dados da loja (se existir)

  useEffect(() => {
    const checkStoreExists = async (userId) => {
      try {
        const storeRef = ref(db, `stores/${userId}`);
        const storeSnapshot = await get(storeRef);

        if (storeSnapshot.exists()) {
          setStoreExists(true);
          setStoreData(storeSnapshot.val()); // Armazena os dados da loja
        } else {
          setStoreExists(false);
        }
      } catch (err) {
        console.error('Erro ao verificar loja:', err);
        setError('Ocorreu um erro ao carregar as informações da loja. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStoreId(user.uid);
        checkStoreExists(user.uid);
      } else {
        setStoreId(null);
        setStoreExists(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
        <Typography variant="h6" marginLeft={2}>
          Carregando...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        textAlign="center"
      >
        <Alert severity="error" sx={{ width: '80%', maxWidth: 600 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!storeId) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        textAlign="center"
      >
        <Typography variant="h6" color="textSecondary">
          Por favor, faça login para acessar o Market.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }} display="flex" justifyContent="center" alignItems="center" padding={2}>
      <Paper sx={{ width: '100%', maxWidth: 800, padding: 3 }}>
        <BackButton sx={{ mb: 2 }} />
        {storeExists ? (
          <ManageStoreDesk storeId={storeId} storeData={storeData} />
        ) : (
          <CreateStoreFormDesk storeId={storeId} user={user} />
        )}
      </Paper>
    </Box>
  );
};

export default MarketDesk;