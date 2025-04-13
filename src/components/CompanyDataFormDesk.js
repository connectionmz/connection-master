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
  Checkbox
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { get, ref, set, push } from 'firebase/database';
import { auth, db } from '../fb';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import { signOut } from 'firebase/auth';

// Reorganizando os passos para começar com o tipo de entidade
const steps = ['Tipo de Entidade', 'Informações Básicas', 'Endereço & Contacto', 'Setor & Capacidade', 'Upload de Logotipo'];

const CompanyDataFormDesk = () => {
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
    sector: '',
    customSector: '',
    subsectores: [],
    tipoEntidade: '',
    subtipoEntidade: '',
    capacidadeProducao: '',
  });

    // Tipos de entidade que têm campos fiscais opcionais
    const optionalFiscalEntities = [
      "Organizações Não Governamentais (ONGs)",
      "Organizações da Sociedade Civil (OSC)",
      "Empresas Públicas e Entidades Parapúblicas",
      "Organizações Religiosas"
    ];

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

    // Usando Promise.all para carregar todos os dados de uma vez
    Promise.all([
      get(provinciasRef).then(snapshot => setProvincias(snapshot.val() || [])),
      get(sectoresRef).then(snapshot => setSectores(snapshot.val() || [])),
      get(tipoEntidadeRef).then(snapshot => setTiposEntidades(snapshot.val() || []))
    ]).catch(error => {
      console.error("Erro ao carregar dados:", error);
      setErrorMessage("Erro ao carregar dados. Por favor, recarregue a página.");
    });
  }, []);


  const handleEntidadeChange = (e) => {
    const selectedTipoEntidade = e.target.value;
    const isOptionalFiscal = optionalFiscalEntities.includes(selectedTipoEntidade);
    
    setCompanyData(prevData => ({
      ...prevData,
      tipoEntidade: selectedTipoEntidade,
      subtipoEntidade: '',
      // Limpa campos fiscais se for entidade com campos opcionais
      ...(isOptionalFiscal && { nuit: '', nuel: '', nrContriuinte: '' })
    }));
    
    setHasOptionalFiscalFields(isOptionalFiscal);
    
    const foundEntidade = tiposEntidades.find(ent => ent.tipo === selectedTipoEntidade);
    setSubtiposEntidade(foundEntidade ? foundEntidade.subtipos : []);
  };

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

  const validateStep = (step) => {
    switch (step) {
      case 0: // Tipo de Entidade
        return companyData.tipoEntidade !== '';
      case 1: // Informações Básicas
        const fiscalFieldsValid = hasOptionalFiscalFields ? true : (
          companyData.nuit && companyData.nuit.length >= 9 &&
          companyData.nuel && companyData.nuel.length >= 9 &&
          companyData.nrContriuinte && companyData.nrContriuinte.length >= 9
        );
        
        return companyData.nome && fiscalFieldsValid;
      case 2: // Endereço & Contacto
        return (
          companyData.endereco &&
          companyData.contacto &&
          companyData.provincia &&
          companyData.distrito
        );
      case 3: // Setor & Capacidade
        return (
          companyData.sector &&
          companyData.subtipoEntidade
        );
      case 4: // Upload de Logotipo
        return companyData.logo && termsAccepted;
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
    if (!validateStep(activeStep)) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios e aceite os termos.");
      return;
    }
    
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Verificação de duplicados apenas para campos preenchidos
        const companyRef = ref(db, "company");
        const snapshot = await get(companyRef);

        let camposDuplicados = [];
        snapshot.forEach(child => {
          const data = child.val();
          if (data.nome === companyData.nome) camposDuplicados.push("Nome da Empresa");
          
          // Verifica apenas campos fiscais que foram preenchidos
          if (companyData.nuit && data.nuit === companyData.nuit) camposDuplicados.push("NUIT");
          if (companyData.nuel && data.nuel === companyData.nuel) camposDuplicados.push("NUEL");
          if (companyData.nrContriuinte && data.nrContriuinte === companyData.nrContriuinte) camposDuplicados.push("Número de Contribuinte");
          
          if (data.contacto === companyData.contacto) camposDuplicados.push("Contacto");
        });

        if (camposDuplicados.length > 0) {
          setErrorMessage(
            `Os seguintes dados já estão cadastrados: ${camposDuplicados.join(", ")}. ` +
            `Se você é o proprietário, contacte suporte@connectionmozambique.com.`
          );
          setIsLoading(false);
          return;
        }

        // Upload do logo
        let logoUrl = "";
        if (companyData.logo) {
          const storage = getStorage();
          const fileRef = storageRef(storage, `logos/${user.uid}`);
          await uploadBytes(fileRef, companyData.logo);
          logoUrl = await getDownloadURL(fileRef);
        }

        // Preparar dados para salvar
        const dataToSave = {
          ...companyData,
          id: user.uid,
          email: user.email,
          logoUrl,
          hasOptionalFiscalFields,
          subscriptions: {
            status: "active",
            isverify: "false",
          },
          createdAt: new Date().toISOString(),
        };

        // Remove campos fiscais vazios para entidades com campos opcionais
        if (hasOptionalFiscalFields) {
          if (!companyData.nuit) delete dataToSave.nuit;
          if (!companyData.nuel) delete dataToSave.nuel;
          if (!companyData.nrContriuinte) delete dataToSave.nrContriuinte;
        }

        await set(ref(db, `company/${user.uid}`), dataToSave);
        await push(ref(db, `subscriptions/${user.uid}`), { status: "active" });

        navigate('/dashboard');
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
      case 0: // Tipo de Entidade
        return (
          <Box>
            <TextField
              select
              label="Tipo de Entidade *"
              name="tipoEntidade"
              value={companyData.tipoEntidade}
              onChange={handleEntidadeChange}
              fullWidth
              margin="normal"
            >
              <MenuItem value="">Selecione o tipo de entidade</MenuItem>
              {tiposEntidades.map(ent => (
                <MenuItem key={ent.tipo} value={ent.tipo}>
                  {ent.tipo}
                </MenuItem>
              ))}
            </TextField>

            {companyData.tipoEntidade && subtiposEntidade.length > 0 && (
              <TextField
                select
                label="Subtipo de Entidade *"
                name="subtipoEntidade"
                value={companyData.subtipoEntidade}
                onChange={handleChange}
                fullWidth
                margin="normal"
              >
                <MenuItem value="">Selecione o subtipo</MenuItem>
                {subtiposEntidade.map((sub, index) => (
                  <MenuItem key={index} value={sub}>
                    {sub}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        );
        case 1: // Informações Básicas
        return (
          <Box>
            <TextField
              label="Nome da Empresa *"
              name="nome"
              value={companyData.nome}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Sigla"
              name="sigla"
              value={companyData.sigla}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />

            {!hasOptionalFiscalFields && (
              <>
                <TextField
                  label="NUIT *"
                  name="nuit"
                  value={companyData.nuit}
                  onChange={handleChange}
                  error={!!companyData.nuit && companyData.nuit.length < 9}
                  helperText={
                    companyData.nuit && companyData.nuit.length < 9
                      ? "NUIT deve ter 9 dígitos"
                      : ""
                  }
                  fullWidth
                  margin="normal"
                  inputProps={{
                    maxLength: 9,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                  }}
                />
                <TextField
                  label="NUEL *"
                  name="nuel"
                  value={companyData.nuel}
                  onChange={handleChange}
                  error={!!companyData.nuel && companyData.nuel.length < 9}
                  helperText={
                    companyData.nuel && companyData.nuel.length < 9
                      ? "NUEL deve ter 9 dígitos"
                      : ""
                  }
                  fullWidth
                  margin="normal"
                  inputProps={{
                    maxLength: 9,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                  }}
                />
                <TextField
                  label="Número de Contribuinte *"
                  name="nrContriuinte"
                  value={companyData.nrContriuinte}
                  onChange={handleChange}
                  error={!!companyData.nrContriuinte && companyData.nrContriuinte.length < 9}
                  helperText={
                    companyData.nrContriuinte && companyData.nrContriuinte.length < 9
                      ? "Número de contribuinte deve ter 9 dígitos"
                      : ""
                  }
                  fullWidth
                  margin="normal"
                  inputProps={{
                    maxLength: 9,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                  }}
                />
              </>
            )}
            
            {hasOptionalFiscalFields && (
              <>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
                  Informações Fiscais (Opcionais)
                </Typography>
                <TextField
                  label="NUIT"
                  name="nuit"
                  value={companyData.nuit}
                  onChange={handleChange}
                  helperText="Opcional para este tipo de entidade"
                  fullWidth
                  margin="normal"
                  inputProps={{
                    maxLength: 9,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                  }}
                />
                <TextField
                  label="NUEL"
                  name="nuel"
                  value={companyData.nuel}
                  onChange={handleChange}
                  helperText="Opcional para este tipo de entidade"
                  fullWidth
                  margin="normal"
                  inputProps={{
                    maxLength: 9,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                  }}
                />
                <TextField
                  label="Número de Contribuinte"
                  name="nrContriuinte"
                  value={companyData.nrContriuinte}
                  onChange={handleChange}
                  helperText="Opcional para este tipo de entidade"
                  fullWidth
                  margin="normal"
                  inputProps={{
                    maxLength: 9,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                  }}
                />
              </>
            )}
          </Box>
        );
      case 2: // Endereço & Contacto
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
      case 3: // Setor & Capacidade
        return (
          <Box>
<TextField
  select
  label="Setor de Atividade *"
  name="sector"
  value={companyData.sector}
  onChange={handleSectorChange}
  fullWidth
  margin="normal"
>
  <MenuItem value="">Selecione</MenuItem>
  {sectores.length > 0 ? (
    sectores.map(s => (
      <MenuItem key={s.setor} value={s.setor}>
        {s.setor}
      </MenuItem>
    ))
  ) : (
    <MenuItem disabled>Carregando setores...</MenuItem>
  )}
</TextField>

            {subsectores.length > 0 && (
              <TextField
                select
                label="Subsetores"
                name="subsectores"
                value={companyData.subsectores}
                onChange={handleChange}
                fullWidth
                margin="normal"
                SelectProps={{
                  multiple: true,
                }}
              >
                {subsectores.map(sub => (
                  <MenuItem key={sub} value={sub}>
                    {sub}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        );
      case 4: // Upload de Logotipo
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              Faça carregamento do logotipo da empresa *
            </Typography>
            <Button variant="contained" component="label" sx={{ mb: 2 }}>
              Carregar Logotipo
              <input
                type="file"
                hidden
                name="logo"
                accept="image/*"
                onChange={handleChange}
                required
              />
            </Button>
            {companyData.logo && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img
                  src={URL.createObjectURL(companyData.logo)}
                  alt="Preview do Logotipo"
                  style={{
                    maxWidth: '150px',
                    maxHeight: '150px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </Box>
            )}
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={termsAccepted}
                  onChange={() => setTermsAccepted(!termsAccepted)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Eu concordo com os{' '}
                  <Link href="/termos" target="_blank" rel="noopener">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link href="/politica" target="_blank" rel="noopener">
                    Política de Privacidade
                  </Link>
                </Typography>
              }
              sx={{ mt: 2 }}
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
          Cadastro da Empresa
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

export default CompanyDataFormDesk;