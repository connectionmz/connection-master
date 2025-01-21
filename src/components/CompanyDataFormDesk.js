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

const steps = ['Informações Básicas', 'Endereço', 'Setor e Capacidade', 'Upload de Logotipo'];

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
    const { name, value, files } = e.target;
    setCompanyData((prevData) => ({
      ...prevData,
      [name]: files ? files[0] : value,
    }));
  };

  const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);
  const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        let logoUrl = '';
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
            status: 'active',
            isverity:'false'
          },
          createdAt: new Date().toISOString(),
        };

        await set(ref(db, `company/${user.uid}`), dataToSave);
        await push(ref(db, `subscriptions/${user.uid}`), { status: 'active' });

        navigate('/success');
      }
    } catch (error) {
      setErrorMessage('Ocorreu um erro ao salvar os dados. Tente novamente.');
      console.error('Erro no handleSubmit:', error);
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
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d{9}$/.test(value) || value === '') { // Verifica se tem exatamente 9 dígitos
      handleChange(e);
    }
  }}
  error={!!companyData.nuit && !/^\d{9}$/.test(companyData.nuit)}
  helperText={
    !!companyData.nuit && !/^\d{9}$/.test(companyData.nuit)
      ? 'NUIT deve ter exatamente 9 dígitos.'
      : ''
  }
  fullWidth
  required
  margin="normal"
/>
<TextField
  label="NUEL"
  name="nuel"
  value={companyData.nuel}
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // Permite apenas dígitos
      setCompanyData((prevData) => ({
        ...prevData,
        nuel: value,
      }));
    }
  }}
  onBlur={() => {
    if (!/^\d{6,10}$/.test(companyData.nuel)) {
      setErrorMessage('Informe número de contribuinte correcto.');
    } else {
      setErrorMessage('');
    }
  }}
  error={!!companyData.nuel && !/^\d{6,10}$/.test(companyData.nuel)}
  helperText={
    !!companyData.nuel && !/^\d{6,10}$/.test(companyData.nuel)
      ? 'Informe NUEL correcto.'
      : ''
  }
  fullWidth
  required
  margin="normal"
/>

<TextField
  label="Número de Contribuinte"
  name="nrContriuinte"
  value={companyData.nrContriuinte}
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCompanyData((prevData) => ({
        ...prevData,
        nrContriuinte: value,
      }));
    }
  }}
  onBlur={() => {
    if (!/^\d{9}$/.test(companyData.nrContriuinte)) {
      setErrorMessage('Informe número de contribuinte correcto.');
    } else {
      setErrorMessage('');
    }
  }}
  error={!!companyData.nrContriuinte && !/^\d{9}$/.test(companyData.nrContriuinte)}
  helperText={
    !!companyData.nrContriuinte && !/^\d{9}$/.test(companyData.nrContriuinte)
      ? 'Informe número de contribuinte correcto.'
      : ''
  }
  fullWidth
  required
  margin="normal"/>
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
            </TextField>
            {sectoresComCapacidade.includes(companyData.sector) && (
              <TextField
                label="Capacidade de Produção"
                name="capacidadeProducao"
                value={companyData.capacidadeProducao}
                onChange={handleChange}
                type="number"
                fullWidth
                required
                margin="normal"
              />
            )}
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
