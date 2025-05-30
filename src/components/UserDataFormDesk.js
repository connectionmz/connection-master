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
  FormControlLabel,
  Checkbox,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { get, ref, set, push } from 'firebase/database';
import { auth, db } from '../fb';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { Close } from '@mui/icons-material';

// Reorganizando os passos para começar com o tipo de entidade
const steps = ['Informações Básicas', 'Endereço & Contacto'];

const UserDataFormDesk = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [subsectores, setSubsectores] = useState([]);
  const [tiposEntidades, setTiposEntidades] = useState([]);
  const [subtiposEntidade, setSubtiposEntidade] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasOptionalFiscalFields, setHasOptionalFiscalFields] = useState(false);
  const [openSubsectorSelect, setOpenSubsectorSelect] = useState(false);

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
    const sectoresRef = ref(db, 'sectores_de_atividade');
    const tipoEntidadeRef = ref(db, 'tipos_entidades');

    Promise.all([
      get(provinciasRef).then(snapshot => setProvincias(snapshot.val() || [])),
      get(sectoresRef).then(snapshot => setSectores(snapshot.val() || [])),
      get(tipoEntidadeRef).then(snapshot => setTiposEntidades(snapshot.val() || []))
    ]).catch(error => {
      console.error("Erro ao carregar dados:", error);
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

  const handleSectorChange = (e) => {
    const selectedSector = e.target.value;
    setCompanyData(prevData => ({
      ...prevData,
      sector: selectedSector,
      subsectores: [],
      capacidadeProducao: '',
    }));

    if (selectedSector === "Outro") {
      setCompanyData(prev => ({ ...prev, customSector: "" }));
    }

    const foundSector = sectores.find(s => s.setor === selectedSector);
    setSubsectores(foundSector ? foundSector.subsectores : []);
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    let newValue = value;

    if (type === "file") {
      newValue = files[0];
    } else if (typeof value === "string" && (name === "nuit" || name === "nuel" || name === "nrContriuinte")) {
      newValue = value.replace(/\D/g, '');
    }

    setCompanyData(prevData => ({
      ...prevData,
      [name]: newValue,
    }));
  };

  const handleNext = () => {

    setErrorMessage("");
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => setActiveStep(prevActiveStep => prevActiveStep - 1);

  const handleSubmit = async () => {
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

        const companyRef = ref(db, "company");
        const snapshot = await get(companyRef);

        let camposDuplicados = [];
        snapshot.forEach(child => {
          const data = child.val();
          if (data.nome === cleanedCompanyData.nome) camposDuplicados.push("Nome da Empresa");
          if (cleanedCompanyData.nuit && data.nuit === cleanedCompanyData.nuit) camposDuplicados.push("NUIT");
          if (cleanedCompanyData.nuel && data.nuel === cleanedCompanyData.nuel) camposDuplicados.push("NUEL");
          if (cleanedCompanyData.nrContriuinte && data.nrContriuinte === cleanedCompanyData.nrContriuinte) camposDuplicados.push("Número de Contribuinte");
          if (data.contacto === cleanedCompanyData.contacto) camposDuplicados.push("Contacto");
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
        if (cleanedCompanyData.logo) {
          const storage = getStorage();
          const fileRef = storageRef(storage, `logos/${user.uid}`);
          await uploadBytes(fileRef, cleanedCompanyData.logo);
          logoUrl = await getDownloadURL(fileRef);
        }

        const dataToSave = {
          ...cleanedCompanyData,
          id: user.uid,
          email: user.email,
          logoUrl: logoUrl || null, 
          hasOptionalFiscalFields,
          subscriptions: {
            status: "active",
            isverify: "true",
          },
          createdAt: new Date().toISOString(),
          subsectores: cleanedSubsectores.length > 0 ? cleanedSubsectores : null, 
        };

        if (hasOptionalFiscalFields) {
          if (!cleanedCompanyData.nuit) delete dataToSave.nuit;
          if (!cleanedCompanyData.nuel) delete dataToSave.nuel;
          if (!cleanedCompanyData.nrContriuinte) delete dataToSave.nrContriuinte;
        }

        if (!dataToSave.sigla) delete dataToSave.sigla;
        if (!dataToSave.customSector) delete dataToSave.customSector;

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

        case 0: // Informações Básicas
          return (
            <Box>
              <TextField
                label="Seu Nome*"
                name="nome"
                value={companyData.nome}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              {/* Campo de Género */}
              <FormControl fullWidth margin="normal">
                <InputLabel id="genero-label">Género*</InputLabel>
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
              label="Endereço *"
              name="endereco"
              value={companyData.endereco}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Contacto *"
              name="contacto"
              value={companyData.contacto || ""}
              onChange={handleChange}
              fullWidth
              margin="normal"
              inputProps={{
                inputMode: 'tel',
              }}
            />
            <TextField
              select
              label="Província *"
              name="provincia"
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
              label="Distrito *"
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