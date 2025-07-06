import React, { useState } from 'react';
import { ref as dbRef, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../fb';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Alert,
  IconButton,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { PhotoCamera, Info } from '@mui/icons-material';

const CreateStoreFormDesk = ({ storeId, planPrice = 800, user }) => {
  const [store, setStore] = useState({
    name: '',
    description: '',
    company: {
      nome: user?.nome || '',
      provincia: user?.provincia || '',
      distrito: user?.distrito || '',
      logo: user?.logoUrl || '', 
      id: user?.id || '',
      paysIVA: false, 
    },
  });
  const [logoFile, setLogoFile] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStore({ ...store, [name]: value });
  };

  const handleCompanyInputChange = (e) => {
    const { name, value } = e.target;
    setStore({ 
      ...store, 
      company: {
        ...store.company,
        [name]: value 
      } 
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setStore({ 
      ...store, 
      company: {
        ...store.company,
        [name]: checked 
      } 
    });
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
    setProgress(10);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(50);
      return true;
    } catch (error) {
      setError('A transação falhou. Por favor, tente novamente.');
      console.error('Erro no pagamento:', error.message);
      return false;
    }
  };

  const createStore = async () => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
  
    if (!user) {
      setError('Usuário não definido. Não é possível criar a loja.');
      setIsLoading(false);
      return;
    }
  
    if (!storeId) {
      setError('ID da loja não definido. Não é possível criar a loja.');
      setIsLoading(false);
      return;
    }
  
    try {
      // Step 1: Process payment
      setProgress(10);
      const paymentSuccessful = await handlePayment();
      
      if (!paymentSuccessful) {
        setProgress(0);
        return;
      }

      // Step 2: Upload logo if exists
      let logoUrl = store.company.logo;
      if (logoFile) {
        setProgress(30);
        const logoStorageRef = storageRef(storage, `store-logos/${storeId}/${logoFile.name}`);
        const uploadTask = uploadBytes(logoStorageRef, logoFile);
        
        // Listen for upload progress
        uploadTask.then(async (snapshot) => {
          setProgress(60);
          logoUrl = await getDownloadURL(snapshot.ref);
          
          // Step 3: Save store data
          setProgress(80);
          const storeRef = dbRef(db, `stores/${storeId}`);
          await set(storeRef, {
            ...store,
            company: {
              ...store.company,
              logo: logoUrl, 
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          setProgress(100);
          alert('Loja criada com sucesso!');
          window.location.reload();
        }).catch(error => {
          setError('Erro ao fazer upload do logo.');
          console.error('Erro no upload:', error);
        });
      } else {
        // No logo to upload, just save store data
        setProgress(60);
        const storeRef = dbRef(db, `stores/${storeId}`);
        await set(storeRef, {
          ...store,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        setProgress(100);
        alert('Loja criada com sucesso!');
        window.location.reload();
      }
    } catch (error) {
      setError('Erro ao criar a loja. Por favor, tente novamente.');
      console.error('Erro:', error);
    } finally {
      if (error) {
        setIsLoading(false);
        setProgress(0);
      }
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

      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        Criar Loja
      </Typography>

      {isLoading && (
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ marginBottom: 2 }}
        />
      )}

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
        disabled={isLoading}
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
        sx={{ marginBottom: 2 }}
        disabled={isLoading}
      />

      {/* Paga IVA */}
      <FormGroup sx={{ marginBottom: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={store.company.paysIVA}
              onChange={handleCheckboxChange}
              name="paysIVA"
              disabled={isLoading}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <span>Esta loja paga IVA</span>
              <Tooltip title="Esta informação não poderá ser alterada posteriormente">
                <Info color="action" sx={{ fontSize: 16, marginLeft: 1 }} />
              </Tooltip>
            </Box>
          }
        />
      </FormGroup>

      {/* Upload de Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
        <IconButton
          color="primary"
          component="label"
          sx={{ marginRight: 1 }}
          disabled={isLoading}>
          <PhotoCamera />
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleLogoChange}
            disabled={isLoading}
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
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {isLoading ? `Criando Loja (${progress}%)` : 'Criar Loja'}
      </Button>
    </Box>
  );
};

export default CreateStoreFormDesk;