import React, { useState, useEffect } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  TextField,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { get, ref, set, push } from 'firebase/database';
import { auth, db } from '../fb';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import { signOut } from 'firebase/auth';

// Funções de segurança
const validateInput = (name, value) => {
  const validations = {
    nome: /^[a-zA-ZÀ-ÿ\s]{2,100}$/,
    contacto: /^[0-9+]{9,15}$/,
    nuit: /^[0-9]{9}$/,
    nuel: /^[0-9a-zA-Z]{1,20}$/,
    nrContriuinte: /^[0-9a-zA-Z]{1,20}$/,
    endereco: /^[a-zA-Z0-9\s.,À-ÿ-]{5,200}$/,
    sigla: /^[a-zA-Z0-9]{0,10}$/,
    capacidadeProducao: /^[0-9]{0,10}$/,
    customSector: /^[a-zA-ZÀ-ÿ\s]{0,100}$/
  };

  if (validations[name] && value) {
    return validations[name].test(value);
  }
  return true;
};

const sanitizeInput = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>]*)/gi, '')
      .replace(/javascript:/gi, '');
      // Removido .trim() daqui para permitir digitação de espaços em tempo real
  }
  return value;
};

const validateFile = (file) => {
  if (!file) return true;
  
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Apenas imagens JPEG, PNG, GIF e WebP são permitidas');
  }
  
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande (máximo 5MB)');
  }
  
  return true;
};

const checkForSuspiciousPatterns = (data) => {
  const suspiciousPatterns = [
    /<script>/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\.cookie/i,
    /window\.location/i,
    /alert\(/i,
    /prompt\(/i,
    /confirm\(/i
  ];
  
  const dataString = JSON.stringify(data).toLowerCase();
  return suspiciousPatterns.some(pattern => pattern.test(dataString));
};

const sanitizeDataBeforeSave = (data) => {
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]).trim(); // Adicionado .trim() aqui para remover espaços extras apenas antes de salvar
    }
  });
  
  return sanitized;
};

const steps = ['Informações Básicas', 'Endereço & Contacto'];

const UserDataFormDesk = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [csrfToken] = useState(() => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  });

  const [companyData, setCompanyData] = useState({
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
    genero: '',
    sector: '',
    customSector: '',
    subsectores: [],
    tipoEntidade: '',
    subtipoEntidade: '',
    capacidadeProducao: '',
    type: 'singular',
    createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/auth');
    }
  }, [navigate]);

  useEffect(() => {
    const provinciasRef = ref(db, 'provincias');
    get(provinciasRef).then(snapshot => setProvincias(snapshot.val() || []))
    .catch(error => {
      console.error("Erro ao carregar províncias:", error);
      setErrorMessage("Erro ao carregar dados. Por favor, recarregue a página.");
    });
  }, []);

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setCompanyData(prevData => ({
      ...prevData,
      provincia: selectedProvince,
      distrito: '',
    }));
    const foundProvince = provincias.find(prov => prov.provincia === selectedProvince);
    setDistritos(foundProvince ? foundProvince.distritos : []);
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    let newValue = value;

    setErrorMessage('');

    if (type === "file") {
      try {
        validateFile(files[0]);
        newValue = files[0];
      } catch (error) {
        setErrorMessage(error.message);
        return;
      }
    } else if (typeof value === "string") {
      newValue = sanitizeInput(value);
      
      // Filtros específicos para campos que não permitem caracteres inválidos durante a digitação
      if (name === "nuit") {
        newValue = newValue.replace(/[^0-9]/g, '');
      } else if (name === "nuel" || name === "nrContriuinte") {
        newValue = newValue.replace(/[^0-9a-zA-Z]/g, ''); // Permite letras e números, sem espaços ou outros
      } else if (name === "contacto") {
        newValue = newValue.replace(/[^0-9+]/g, ''); // Apenas dígitos e +, sem espaços
      } else if (name === "sigla") {
        newValue = newValue.replace(/[^a-zA-Z0-9]/g, ''); // Sem espaços
      } else if (name === "capacidadeProducao") {
        newValue = newValue.replace(/[^0-9]/g, '');
      }
      // Para nome, endereco, customSector: sem filtro, permite espaços
    }

    setCompanyData(prevData => ({
      ...prevData,
      [name]: newValue,
    }));
  };

  const handleNext = () => {
    let isValid = true;
    let errorMsg = '';

    // Trim temporário para validação, sem alterar o estado
    const trimmedNome = companyData.nome.trim();
    const trimmedEndereco = companyData.endereco.trim();
    const trimmedContacto = companyData.contacto.trim();

    if (activeStep === 0) {
      if (!trimmedNome || !companyData.genero) {
        isValid = false;
        errorMsg = 'Por favor, preencha todos os campos obrigatórios';
      } else if (!validateInput('nome', trimmedNome)) {
        isValid = false;
        errorMsg = 'Nome inválido. Use apenas letras e espaços (mínimo 2 caracteres)';
      }
    } else if (activeStep === 1) {
      if (!trimmedContacto || !companyData.provincia || !companyData.distrito) {
        isValid = false;
        errorMsg = 'Por favor, preencha todos os campos obrigatórios';
      } else if (!validateInput('contacto', trimmedContacto)) {
        isValid = false;
        errorMsg = 'Contacto inválido. Deve conter entre 9 e 15 dígitos ou + (ex: +258841234567), sem espaços';
      } else if (companyData.endereco && !validateInput('endereco', trimmedEndereco)) {
        isValid = false;
        errorMsg = 'Endereço inválido. Use caracteres alfanuméricos, espaços e pontuação (mínimo 5 caracteres)';
      }
    }

    if (!isValid) {
      setErrorMessage(errorMsg);
      return;
    }

    setErrorMessage("");
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => setActiveStep(prevActiveStep => prevActiveStep - 1);

  const handleSubmit = async () => {
    const now = Date.now();
    if (now - lastSubmitTime < 3000) {
      setErrorMessage('Aguarde alguns segundos antes de tentar novamente');
      return;
    }
    setLastSubmitTime(now);

    if (checkForSuspiciousPatterns(companyData)) {
      setErrorMessage('Dados inválidos detectados. Por favor, verifique as informações.');
      return;
    }

    // Validação final antes de submeter (campos opcionais se preenchidos), usando trim
    const trimmedNuit = companyData.nuit.trim();
    const trimmedNuel = companyData.nuel.trim();
    const trimmedNrContriuinte = companyData.nrContriuinte.trim();
    const trimmedSigla = companyData.sigla.trim();
    const trimmedCapacidadeProducao = companyData.capacidadeProducao.trim();
    const trimmedCustomSector = companyData.customSector.trim();

    if (trimmedNuit && !validateInput('nuit', trimmedNuit)) {
      setErrorMessage('NUIT inválido. Deve conter exatamente 9 dígitos.');
      return;
    }
    if (trimmedNuel && !validateInput('nuel', trimmedNuel)) {
      setErrorMessage('NUEL inválido.');
      return;
    }
    if (trimmedNrContriuinte && !validateInput('nrContriuinte', trimmedNrContriuinte)) {
      setErrorMessage('Número de Contribuinte inválido.');
      return;
    }
    if (trimmedSigla && !validateInput('sigla', trimmedSigla)) {
      setErrorMessage('Sigla inválida.');
      return;
    }
    if (trimmedCapacidadeProducao && !validateInput('capacidadeProducao', trimmedCapacidadeProducao)) {
      setErrorMessage('Capacidade de Produção inválida.');
      return;
    }
    if (trimmedCustomSector && !validateInput('customSector', trimmedCustomSector)) {
      setErrorMessage('Setor personalizado inválido.');
      return;
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const cleanedSubsectores = companyData.subsectores
          ? companyData.subsectores.filter(sub => sub && sub.trim() !== '')
          : [];

        const cleanedCompanyData = {
          ...companyData,
          subsectores: cleanedSubsectores,
          sector: companyData.sector || '',
          customSector: companyData.customSector || '',
          tipoEntidade: companyData.tipoEntidade || '',
          subtipoEntidade: companyData.subtipoEntidade || '',
        };

        const sanitizedData = sanitizeDataBeforeSave(cleanedCompanyData);

        const companyRef = ref(db, "company");
        const snapshot = await get(companyRef);

        let camposDuplicados = [];
        snapshot.forEach(child => {
          const data = child.val();
          if (data.nome === sanitizedData.nome) camposDuplicados.push("Nome da Empresa");
          if (sanitizedData.nuit && data.nuit === sanitizedData.nuit) camposDuplicados.push("NUIT");
          if (sanitizedData.nuel && data.nuel === sanitizedData.nuel) camposDuplicados.push("NUEL");
          if (sanitizedData.nrContriuinte && data.nrContriuinte === sanitizedData.nrContriuinte) camposDuplicados.push("Número de Contribuinte");
          if (data.contacto === sanitizedData.contacto) camposDuplicados.push("Contacto");
        });

        if (camposDuplicados.length > 0) {
          setErrorMessage(
            `Os seguintes dados já estão cadastrados: ${camposDuplicados.join(", ")}. ` +
            `Se você é o proprietário, contacte suporte@connectionmozambique.com.`
          );
          setIsLoading(false);
          return;
        }

        let logoUrl = "";
        if (sanitizedData.logo) {
          const storage = getStorage();
          const fileRef = storageRef(storage, `logos/${user.uid}`);
          await uploadBytes(fileRef, sanitizedData.logo);
          logoUrl = await getDownloadURL(fileRef);
        }

        const dataToSave = {
          ...sanitizedData,
          id: user.uid,
          email: user.email,
          logoUrl: logoUrl || null, 
          subscriptions: {
            status: "active",
            isverify: "true",
          },
          createdAt: new Date().toISOString(),
          subsectores: cleanedSubsectores.length > 0 ? cleanedSubsectores : null,
          csrfToken,
        };

        await set(ref(db, `company/${user.uid}`), dataToSave);
        await push(ref(db, `subscriptions/${user.uid}`), { status: "active" });
        window.location='/'
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
      case 0:
        return (
          <Box>
            <TextField
              label="Seu Nome"
              name="nome"
              value={companyData.nome}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              inputProps={{ maxLength: 100 }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="genero-label">Género</InputLabel>
              <Select
                labelId="genero-label"
                name="genero"
                value={companyData.genero}
                onChange={handleChange}
                required>
                <MenuItem value="">Selecione</MenuItem>
                <MenuItem value="Masculino">Masculino</MenuItem>
                <MenuItem value="Feminino">Feminino</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      case 1: 
        return (
          <Box>
            <TextField
              label="Endereço"
              name="endereco"
              value={companyData.endereco}
              onChange={handleChange}
              fullWidth
              margin="normal"
              inputProps={{ maxLength: 200 }}
            />
            <TextField
              label="Contacto"
              name="contacto"
              required
              value={companyData.contacto || ""}
              onChange={handleChange}
              fullWidth
              margin="normal"
              inputProps={{
                inputMode: 'tel',
                maxLength: 15,
              }}
            />
            <TextField
              select
              label="Província"
              name="provincia"
              required
              value={companyData.provincia}
              onChange={handleProvinceChange}
              fullWidth
              margin="normal"
            >
              <MenuItem value="">Selecione</MenuItem>
              {provincias.map(prov => (
                <MenuItem key={prov.provincia} value={prov.provincia}>
                  {prov.provincia}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Distrito"
              name="distrito"
              value={companyData.distrito}
              onChange={handleChange}
              fullWidth
              margin="normal"
              disabled={!companyData.provincia}
            >
              <MenuItem value="">Selecione</MenuItem>
              {distritos.map(dist => (
                <MenuItem key={dist} value={dist}>
                  {dist}
                </MenuItem>
              ))}
            </TextField>
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
        <Typography variant="h4" component="h1">Cadastrar</Typography>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={handleLoginRedirect}>
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
            sx={{ minWidth: 120 }}>
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