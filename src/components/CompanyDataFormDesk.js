import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, onValue, push, ref, set, update } from 'firebase/database';
import { auth, db } from '../fb';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import { TextField, Button, MenuItem, Select, InputLabel, FormControl, CircularProgress, Snackbar, Alert } from '@mui/material';

const CompanyDataFormDesk = () => {
  const navigate = useNavigate();

  const [companyData, setCompanyData] = useState({
    nome: '',
    sigla: '',
    nuit: '',
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
    redesSociais: '',
    dadosBancarios: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [subsectores, setSubsectores] = useState([]);
  const [tiposEntidades, setTiposEntidades] = useState([]);
  const [subtiposEntidade, setSubtiposEntidade] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

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

  const handleChange = (e) => {
    const { name, value, type, files, multiple, options } = e.target;
    const newValue =
      type === 'file'
        ? files[0]
        : multiple
        ? Array.from(options)
            .filter((option) => option.selected)
            .map((option) => option.value)
        : value;

    setCompanyData((prevData) => ({ ...prevData, [name]: newValue }));
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

  const handleNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleBackStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          },
          createdAt: new Date().toISOString(),
        };

        await set(ref(db, `company/${user.uid}`), dataToSave);
        await push(ref(db, `subscriptions/${user.uid}`), { status: 'active' });

        window.location.reload();
      } else {
        throw new Error('Usuário não autenticado');
      }
    } catch (error) {
      setErrorMessage('Ocorreu um erro ao enviar os dados. Tente novamente.');
      console.error('Erro no handleSubmit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xl">
        <h2 className="text-3xl font-semibold mb-6 text-center text-gray-700">Cadastro da Empresa - Etapa {currentStep}</h2>

        {errorMessage && (
          <Snackbar open={true} autoHideDuration={6000}>
            <Alert severity="error" sx={{ width: '100%' }}>
              {errorMessage}
            </Alert>
          </Snackbar>
        )}

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div>
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
                fullWidth
                required
                margin="normal"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <TextField
                label="Contacto"
                name="contacto"
                value={companyData.contacto}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />
              <FormControl fullWidth required margin="normal">
                <InputLabel>Setor</InputLabel>
                <Select
                  name="sector"
                  value={companyData.sector}
                  onChange={handleSectorChange}
                  label="Setor"
                >
                  {sectores.map((s) => (
                    <MenuItem key={s.setor} value={s.setor}>
                      {s.setor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {sectoresComCapacidade.includes(companyData.sector) && (
                <TextField
                  label="Capacidade de Produção"
                  name="capacidadeProducao"
                  value={companyData.capacidadeProducao}
                  onChange={handleChange}
                  fullWidth
                  required
                  margin="normal"
                />
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <TextField
                label="Endereço"
                name="endereco"
                value={companyData.endereco}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />
              <FormControl fullWidth required margin="normal">
                <InputLabel>Província</InputLabel>
                <Select
                  name="provincia"
                  value={companyData.provincia}
                  onChange={handleProvinceChange}
                  label="Província"
                >
                  {provincias.map((prov, index) => (
                    <MenuItem key={index} value={prov.provincia}>
                      {prov.provincia}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required margin="normal">
                <InputLabel>Distrito</InputLabel>
                <Select
                  name="distrito"
                  value={companyData.distrito}
                  onChange={handleChange}
                  label="Distrito"
                >
                  {distritos.map((dist, index) => (
                    <MenuItem key={index} value={dist}>
                      {dist}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              {/* Redes sociais e dados bancários */}
              <TextField
                label="Redes Sociais"
                name="redesSociais"
                value={companyData.redesSociais}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Dados Bancários"
                name="dadosBancarios"
                value={companyData.dadosBancarios}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
            </div>
          )}

          <div className="flex justify-between mt-3">
            {currentStep > 1 && (
              <Button variant="outlined" onClick={handleBackStep}>
                Voltar
              </Button>
            )}
            {currentStep < 4 ? (
              <Button variant="contained" color="primary" onClick={handleNextStep}>
                Próxima Etapa
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Salvar'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyDataFormDesk;
