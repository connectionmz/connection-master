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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { get, onValue, push, ref, set, update } from 'firebase/database';
import { auth, db } from '../fb';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';

const steps = ['Informações Básicas', 'Endereço & Contacto', 'Setor & Capacidade', 'Upload de Logotipo'];

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

  const [companyData, setCompanyData] = useState({
    nome: '',
    sigla: '',
    nuit: '',
    nuel:'',
    nrContriuinte:'',
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
  });

  const sectoresComCapacidade = [
    'Recursos Naturais',
    'Indústria e Comércio',
    'Agronegócio',
    'Energia',
    'Água e Saneamento',
  ];

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
    const foundSector = sectores.find((s) => s.setor === selectedSector);
    setSubsectores(foundSector ? foundSector.subsectores : []);
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
    }
  
    setCompanyData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));
  };
  
  const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);
  const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);
 
  const handleSubmit = async () => {
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
              required
              margin="normal"
            />
<TextField
  label="NUIT"
  name="nuit"
  value={companyData.nuit}
  onChange={handleChange}
  error={!!companyData.nuit && companyData.nuit.length < 9} // Apenas mostra erro se for menor que 9
  helperText={
    !!companyData.nuit && companyData.nuit.length < 9
      ? "NUIT deve ter no mínimo 9 dígitos."
      : ""
  }
  fullWidth
  required
  margin="normal"
/>

<TextField
  label="NUEL"
  name="nuel"
  value={companyData.nuel}
  onChange={handleChange}
  error={!!companyData.nuel && companyData.nuel.length < 6}
  helperText={
    !!companyData.nuel && companyData.nuel.length < 6
      ? "NUEL deve ter no mínimo 6 dígitos."
      : ""
  }
  fullWidth
  required
  margin="normal"
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
              margin="normal"/>
      <TextField
  label="Contacto"
  name="contacto" // Certifique-se de que está em minúsculas e corresponde ao estado
  value={companyData.contacto || ""} // Evita valores undefined
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
              margin="normal">
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
            </TextField>
              {/*
                          {sectoresComCapacidade.includes(companyData.sector) && (
              <TextField
                label="Capacidade de Produção"
                name="capacidadeProducao"
                value={companyData.capacidadeProducao}
                onChange={handleChange}
                type="text"
                fullWidth
                required
                margin="normal"
              />
            )}*/}
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
              margin="normal">
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
              Faça upload do logotipo da empresa:
            </Typography>
            <Button variant="contained" component="label">
              Upload
              <input
                type="file"
                hidden
                name="logo"
                accept="image/*"
                onChange={handleChange}
              />
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };

  const handleLoginRedirect = () => {
    navigate('/auth'); // Altere a rota caso o login esteja em uma rota diferente
  };


  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
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
          <Button disabled={activeStep === 0} onClick={handleBack}>
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

export default CompanyDataFormDesk;
