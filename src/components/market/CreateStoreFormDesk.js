import React, { useState } from 'react';
import { ref as dbRef, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../fb'; // Importe o storage do Firebase
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Alert,
  IconButton,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';

const CreateStoreFormDesk = ({ storeId, planPrice = 800, user }) => {
  const [store, setStore] = useState({
    name: '',
    description: '',
    company: {
      nome: user?.nome || '',
      provincia: user?.provincia || '',
      distrito: user?.distrito || '',
      logo: user?.logoUrl || '', 
      id:user?.id || ''
    },
  });
  const [logoFile, setLogoFile] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStore({ ...store, [name]: value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setStore({
        ...store,
        company: {
          ...store.company,
          logo: URL.createObjectURL(file), 
        },
      });
    }
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
  
    if (!storeId) {
      alert('ID da loja não definido. Não é possível criar a loja.');
      setIsLoading(false);
      return;
    }
  
    const paymentSuccessful = await handlePayment();
  
    if (paymentSuccessful) {
      try {
        let logoUrl = store.company.logo;
  
        if (logoFile) {
          const logoStorageRef = storageRef(storage, `store-logos/${storeId}/${logoFile.name}`);
          await uploadBytes(logoStorageRef, logoFile);
          logoUrl = await getDownloadURL(logoStorageRef); // Obtém a URL do Firebase Storage
  
          setStore((prevStore) => ({
            ...prevStore,
            company: {
              ...prevStore.company,
              logo: logoUrl, 
            },
          }));
        }
  
        const storeRef = dbRef(db, `stores/${storeId}`);
        await set(storeRef, {
          ...store,
          company: {
            ...store.company,
            logo: logoUrl, 
          },
        });
  
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
      }}>
      <Alert severity="info" sx={{ marginBottom: 2 }}>
        <Typography variant="body2">
          <strong>Nota:</strong> A subscrição de uma loja online requer o pagamento único de{' '}
          <strong>{planPrice} MT</strong>.
        </Typography>
      </Alert>

      <Typography variant="h6" gutterBottom>
        Criar Loja
      </Typography>

      {/* Nome da Loja */}
      <TextField
        fullWidth
        name="name"
        label="Nome da Loja"
        variant="outlined"
        value={store.name}
        onChange={handleInputChange}
        sx={{ marginBottom: 2 }}
        required
      />

      {/* Descrição da Loja (Opcional) */}
      <TextField
        fullWidth
        name="description"
        label="Descrição da Loja (opcional)"
        variant="outlined"
        value={store.description}
        onChange={handleInputChange}
        multiline
        rows={3}
        sx={{ marginBottom: 2 }}/>

      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
        <IconButton
          color="primary"
          component="label"
          sx={{ marginRight: 1 }}>
          <PhotoCamera />
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleLogoChange}
          />
        </IconButton>
        <Typography variant="body2">Upload de Logo (opcional)</Typography>
        {store.company.logo && (
          <Box sx={{ marginLeft: 2 }}>
            <img
              src={store.company.logo}
              alt="Logo Preview"
              style={{ width: '50px', height: '50px', borderRadius: '50%' }}
            />
          </Box>
        )}
      </Box>
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={createStore}
        disabled={isLoading || !store.name}
        startIcon={isLoading && <CircularProgress size={20} color="inherit" />}
      >
        {isLoading ? 'Criando Loja...' : 'Criar Loja'}
      </Button>
    </Box>
  );
};

export default CreateStoreFormDesk;