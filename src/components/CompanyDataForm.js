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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { get, onValue, push, ref, set, update } from 'firebase/database';
import { auth, db } from '../fb';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';

const steps = ['Info Básicas', 'Contacto', 'Setor', 'Logotipo'];

const CompanyDataForm = () => {
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const sectoresComCapacidade = [
    'Recursos Naturais',
    'Indústria e Comércio',  
    'Agronegócio',
    'Energia',
    'Água e Saneamento',
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

    onValue(provinciasRef, (snapshot) => setProvincias(snapshot.val() || []));
    onValue(sectoresRef, (snapshot) => setSectores(snapshot.val() || []));
    onValue(tipoEntidadeRef, (snapshot) => setTiposEntidades(snapshot.val() || []));
  }, []);

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setCompanyData((prevData) => ({
      ...prevData,
      provincia: selectedProvince,
      distrito: '',
    }));
    const foundProvince = provincias.find((prov) => prov.provincia === selectedProvince);
    setDistritos(foundProvince ? foundProvince.distritos : []);
  };

  const handleEntidadeChange = (e) => {
    const selectedTipoEntidade = e.target.value;
    setCompanyData((prevData) => ({
      ...prevData,
      tipoEntidade: selectedTipoEntidade,
      subtipoEntidade: '',
    }));
    const foundEntidade = tiposEntidades.find((ent) => ent.tipo === selectedTipoEntidade);
    setSubtiposEntidade(foundEntidade ? foundEntidade.subtipos : []);
  };

  const handleSectorChange = (e) => {
    const selectedSector = e.target.value;
    setCompanyData((prevData) => ({
      ...prevData,
      sector: selectedSector,
      subsectores: [],
      capacidadeProducao: '',
    }));

    if (selectedSector === "Outro") {
      setCompanyData((prev) => ({ ...prev, customSector: "" }));
    }

    const foundSector = sectores.find((s) => s.setor === selectedSector);
    setSubsectores(foundSector ? foundSector.subsectores : []);
  };

  const handleCustomSectorChange = (event) => {
    setCompanyData({ ...companyData, customSector: event.target.value });
  };

  const handleAddSector = () => {
    if (companyData.customSector.trim() && !sectores.includes(companyData.customSector)) {
      setSectores([...sectores, companyData.customSector]);
      setCompanyData({ ...companyData, customSector: companyData.customSector });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files, multiple, options } = e.target;
  
    let newValue = value;
  
    if (type === "file") {
      newValue = multiple ? Array.from(files) : files[0];
    } else if (multiple && options) {
      newValue = Array.from(options)
        .filter((option) => option.selected)
        .map((option) => option.value);
    } else if (typeof value === "string" && (name === "nuit" || name === "nuel" || name === "nrContriuinte")) {
      newValue = value.replace(/\D/g, '');
    }
  
    setCompanyData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return (
          companyData.nome &&
          companyData.nuit &&
          companyData.nuit.length >= 9 &&
          companyData.nuel &&
          companyData.nuel.length >= 9 &&
          companyData.nrContriuinte &&
          companyData.nrContriuinte.length >= 9
        );
      case 1:
        return (
          companyData.endereco &&
          companyData.contacto &&
          companyData.provincia &&
          companyData.distrito
        );
      case 2:
        return (
          companyData.sector &&
          companyData.tipoEntidade &&
          (companyData.sector !== "outro" || companyData.customSector)
        );
      case 3:
        return companyData.logo; 
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
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios *.");
      return;
    }
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const companyRef = ref(db, "company");
        const snapshot = await get(companyRef);

        let camposDuplicados = [];

        snapshot.forEach((child) => {
          const data = child.val();
          if (data.nome === companyData.nome) camposDuplicados.push("Nome da Empresa");
          if (data.nuel === companyData.nuel) camposDuplicados.push("NUEL");
          if (data.nuit === companyData.nuit) camposDuplicados.push("NUIT");
          if (data.nrContriuinte === companyData.nrContriuinte) camposDuplicados.push("Número de Contribuinte");
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

        let logoUrl = "";
        if (companyData.logo) {
          const storage = getStorage();
          const fileRef = storageRef(storage, `logos/${user.uid}`);
          await uploadBytes(fileRef, companyData.logo);
          logoUrl = await getDownloadURL(fileRef);
        }

        const dataToSave = {
          ...companyData,
          id: user.uid,
          email: user.email,
          logoUrl,
          subscriptions: {
            status: "active",
            isverify: "false",
          },
          createdAt: new Date().toISOString(),
        };
        await set(ref(db, `company/${user.uid}`), dataToSave);
        await push(ref(db, `subscriptions/${user.uid}`), { status: "active" });

        window.location.reload();
      }else{
        setErrorMessage("Impossivel cadastrar. Tente novamente");
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
              label="Nome da Empresa"
              name="nome"
              value={companyData.nome}
              onChange={handleChange}
              fullWidth
              required
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
            <TextField
  label="NUIT"
  name="nuit"
  value={companyData.nuit}
  onChange={handleChange}
  error={!!companyData.nuit && companyData.nuit.length < 9}
  helperText={
    !!companyData.nuit && companyData.nuit.length < 9
      ? "NUIT deve ter no mínimo 9 dígitos."
      : ""
  }
  fullWidth
  required
  margin="normal"
  inputProps={{
    inputMode: 'numeric', // Define o teclado como numérico em dispositivos móveis
    pattern: '[0-9]*', // Garante que apenas números sejam aceitos
  }}
/>
<TextField
  label="NUEL"
  name="nuel"
  value={companyData.nuel}
  onChange={handleChange}
  error={!!companyData.nuel && companyData.nuel.length < 9}
  helperText={
    !!companyData.nuel && companyData.nuel.length < 9
      ? "NUEL deve ter no mínimo 9 dígitos."
      : ""
  }
  fullWidth
  required
  margin="normal"
  inputProps={{
    inputMode: 'numeric',
    pattern: '[0-9]*',
  }}
/>
<TextField
  label="Número de Contribuinte"
  name="nrContriuinte"
  value={companyData.nrContriuinte}
  onChange={handleChange}
  error={!!companyData.nrContriuinte && companyData.nrContriuinte.length < 9}
  helperText={
    !!companyData.nrContriuinte && companyData.nrContriuinte.length < 9
      ? "Número de contribuinte deve ter no mínimo 9 dígitos."
      : ""
  }
  fullWidth
  required
  margin="normal"
  inputProps={{
    inputMode: 'numeric',
    pattern: '[0-9]*',
  }}
/>
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
              required
              margin="normal"
            />
            <TextField
              label="Contacto"
              name="contacto"
              value={companyData.contacto || ""}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              select
              label="Província"
              name="provincia"
              value={companyData.provincia}
              onChange={handleProvinceChange}
              fullWidth
              required
              margin="normal"
            >
              <MenuItem value="">Selecione</MenuItem>
              {provincias.map((prov) => (
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
              required
              margin="normal"
            >
              <MenuItem value="">Selecione</MenuItem>
              {distritos.map((dist) => (
                <MenuItem key={dist} value={dist}>
                  {dist}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        );
      case 2:
        return (
          <Box>
            <TextField
              select
              label="Setor"
              name="sector"
              value={companyData.sector}
              onChange={handleSectorChange}
              fullWidth
              required
              margin="normal"
            >
              <MenuItem value="">Selecione</MenuItem>
              {sectores.map((s) => (
                <MenuItem key={s.setor} value={s.setor}>
                  {s.setor}
                </MenuItem>
              ))}
              <MenuItem value="outro">Outro</MenuItem>
            </TextField>

            {companyData.sector === "outro" && (
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <TextField
                  label="Novo Setor"
                  value={companyData.customSector}
                  onChange={handleCustomSectorChange}
                  fullWidth
                  margin="normal"
                />
                <button onClick={handleAddSector} style={{ padding: "10px", cursor: "pointer" }}>
                  Adicionar
                </button>
              </div>
            )}

            {subsectores.length > 0 && (
              <TextField
                select
                label="Subsetores"
                name="subsectores"
                value={companyData.subsectores}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                SelectProps={{
                  multiple: true,
                }}
              >
                {subsectores.map((sub) => (
                  <MenuItem key={sub} value={sub}>
                    {sub}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              select
              label="Tipo de Entidade"
              name="tipoEntidade"
              value={companyData.tipoEntidade}
              onChange={handleEntidadeChange}
              fullWidth
              required
              margin="normal"
            >
              <MenuItem value="">Selecione</MenuItem>
              {tiposEntidades.map((ent) => (
                <MenuItem key={ent.tipo} value={ent.tipo}>
                  {ent.tipo}
                </MenuItem>
              ))}
            </TextField>

            {subtiposEntidade.length > 0 && (
              <TextField
                select
                label="Subtipo de Entidade"
                name="subtipoEntidade"
                value={companyData.subtipoEntidade || ""}
                onChange={handleChange}
                required
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
      case 3:
        return (
          <Box>
          <Typography variant="body1" gutterBottom>
            Faça carregamento do logotipo da empresa*
          </Typography>
          <Button variant="contained" component="label">
            Carregar
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
                  maxWidth: '100px',
                  maxHeight: '100px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              />
            </Box>
          )}
        </Box>
        );
      default:
        return null;
    }
  };

  const handleLoginRedirect = () => {
    navigate('/auth'); 
  };

  return (
    <Box sx={{  maxWidth: 400, width: '100%', p: isMobile ? 2 : 0}}>
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={handleLoginRedirect}
      >
        Retornar para Inicio Sessão
      </Button>
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Box sx={{ mt: 4 }}>
        {renderStepContent(activeStep)}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="contained" color="primary" disabled={activeStep === 0} onClick={handleBack}>
            Voltar
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Finalizar'}
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleNext}>
              Próximo
            </Button>
          )}
        </Box>
      </Box>
      {errorMessage && (
        <Typography color="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
};

export default CompanyDataForm;