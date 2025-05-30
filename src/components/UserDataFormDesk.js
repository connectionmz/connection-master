import React, { useState, useEffect } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  TextField,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { get, ref, set } from 'firebase/database';
import { auth, db } from '../fb';
import { signOut } from 'firebase/auth';

// Simplified steps for single user registration
const steps = ['Informações Pessoais', 'Contacto'];

const UserDataFormDesk = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    contacto: '',
    provincia: '',
    cidade: '',
    // Company fields will be empty
    companyData: {
      nome: '',
      sigla: '',
      nuit: '',
      nuel: '',
      nrContriuinte: '',
      contacto: '',
      endereco: '',
      provincia: '',
      distrito: '',
      logo: null,
      sector: '',
      subsectores: [],
      tipoEntidade: '',
      subtipoEntidade: '',
      capacidadeProducao: '',
    }
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/auth');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Informações Pessoais
        return userData.firstName && userData.lastName;
      case 1: // Contacto
        return userData.contacto;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios *.");
      return;
    }
    setErrorMessage("");
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => setActiveStep(prevActiveStep => prevActiveStep - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Prepare data to save
        const dataToSave = {
          ...userData,
          id: user.uid,
          email: user.email,
          type: "single user", // Mark as single user
          subscriptions: {
            status: "active",
            isverify: "false",
          },
          createdAt: new Date().toISOString(),
          // Include empty company data
          companyData: {
            ...userData.companyData,
            // Ensure all array fields are properly initialized
            subsectores: [],
          }
        };

        await set(ref(db, `company/${user.uid}`), dataToSave);
        window.location.reload();
      }
    } catch (error) {
      setErrorMessage("Ocorreu um erro ao salvar os dados. Tente novamente.");
      console.error("Erro no handleSubmit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Informações Pessoais
        return (
          <Box>
            <TextField
              label="Primeiro Nome *"
              name="firstName"
              value={userData.firstName}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Último Nome *"
              name="lastName"
              value={userData.lastName}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </Box>
        );
      case 1: // Contacto
        return (
          <Box>
            <TextField
              label="Contacto *"
              name="contacto"
              value={userData.contacto || ""}
              onChange={handleChange}
              fullWidth
              margin="normal"
              inputProps={{
                inputMode: 'tel',
              }}
            />
            <TextField
              label="Província"
              name="provincia"
              value={userData.provincia}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Cidade"
              name="cidade"
              value={userData.cidade}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </Box>
        );
      default:
        return null;
    }
  };

  const handleLoginRedirect = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Cadastro de Usuário
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={handleLoginRedirect}
        >
          Retornar para Login
        </Button>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ p: 3, border: '1px solid #eee', borderRadius: 2 }}>
        {renderStepContent(activeStep)}
        
        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            color="primary"
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ minWidth: 120 }}
          >
            Voltar
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isLoading}
              sx={{ minWidth: 120 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Finalizar Cadastro'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              sx={{ minWidth: 120 }}
            >
              Próximo
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default UserDataFormDesk;