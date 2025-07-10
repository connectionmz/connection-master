import React, { useState, useEffect, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { get, ref, set, push } from 'firebase/database';
import { auth, db, storage } from '../fb';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { Close, CameraAlt } from '@mui/icons-material';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Configurações
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Passos do formulário
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
  const [hasOptionalFiscalFields, setHasOptionalFiscalFields] = useState(false);
  const [openSubsectorSelect, setOpenSubsectorSelect] = useState(false);
  const [isCheckingCompany, setIsCheckingCompany] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Estados para edição de imagem
  const [imgSrc, setImgSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef(null);

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
    logoUrl: '',
    sector: '',
    customSector: '',
    subsectores: [],
    tipoEntidade: '',
    subtipoEntidade: '',
    capacidadeProducao: '',
    type: 'empresa',
    createdAt: new Date().toISOString(),
  });

  const optionalFiscalEntities = [
    "Organizações Não Governamentais (ONGs)",
    "Organizações da Sociedade Civil (OSC)",
    "Empresas Públicas e Entidades Parapúblicas",
    "Organizações Religiosas"
  ];

  // Verificar se já existe cadastro
  useEffect(() => {
    const checkExistingCompany = async () => {
      setIsCheckingCompany(true);
      const user = auth.currentUser;
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const companyRef = ref(db, `company/${user.uid}`);
        const snapshot = await get(companyRef);
        
        if (snapshot.exists()) {
          navigate('/');
        }
      } catch (error) {
        console.error("Erro ao verificar empresa existente:", error);
        setErrorMessage("Erro ao verificar dados existentes. Tente recarregar a página.");
      } finally {
        setIsCheckingCompany(false);
      }
    };

    checkExistingCompany();
  }, [navigate]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [provinciasSnapshot, sectoresSnapshot, tipoEntidadeSnapshot] = await Promise.all([
          get(ref(db, 'provincias')),
          get(ref(db, 'sectores_de_atividade')),
          get(ref(db, 'tipos_entidades'))
        ]);

        setProvincias(provinciasSnapshot.val() || []);
        setSectores(sectoresSnapshot.val() || []);
        setTiposEntidades(tipoEntidadeSnapshot.val() || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setErrorMessage("Erro ao carregar dados. Por favor, recarregue a página.");
      }
    };

    loadInitialData();
  }, []);

  // Funções para manipulação de imagens
  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (file) => {
    if (!file) return false;
    
    // Verificar tamanho e tipo
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("A imagem é muito grande (máximo 25MB)");
      return false;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrorMessage("Tipo de arquivo não suportado. Use JPEG, PNG ou WEBP");
      return false;
    }

    try {
      const imageDataUrl = await readFile(file);
      setImgSrc(imageDataUrl);
      setIsCropping(true);
      return true;
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      setErrorMessage("Erro ao processar a imagem");
      return false;
    }
  };

  const applyCrop = async () => {
    if (!completedCrop || !imgRef.current) {
      setIsCropping(false);
      return;
    }

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/webp', 0.7);
      });

      const file = new File([blob], 'logo.webp', { type: 'image/webp' });
      setCompanyData(prev => ({ ...prev, logo: file }));
      
      setIsCropping(false);
      setImgSrc(null);
    } catch (error) {
      console.error("Erro ao aplicar crop:", error);
      setErrorMessage("Erro ao recortar a imagem");
      setIsCropping(false);
    }
  };

  // Handlers de formulário
  const handleEntidadeChange = (e) => {
    const selectedTipoEntidade = e.target.value;
    const isOptionalFiscal = optionalFiscalEntities.includes(selectedTipoEntidade);
    
    setCompanyData(prev => ({
      ...prev,
      tipoEntidade: selectedTipoEntidade,
      subtipoEntidade: '',
      ...(isOptionalFiscal && { nuit: '', nuel: '', nrContriuinte: '' })
    }));
    
    setHasOptionalFiscalFields(isOptionalFiscal);
    
    const foundEntidade = tiposEntidades.find(ent => ent.tipo === selectedTipoEntidade);
    setSubtiposEntidade(foundEntidade ? foundEntidade.subtipos : []);
  };

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setCompanyData(prev => ({
      ...prev,
      provincia: selectedProvince,
      distrito: '',
    }));
    
    const foundProvince = provincias.find(prov => prov.provincia === selectedProvince);
    setDistritos(foundProvince ? foundProvince.distritos : []);
  };

  const handleSectorChange = (e) => {
    const selectedSector = e.target.value;
    setCompanyData(prev => ({
      ...prev,
      sector: selectedSector,
      subsectores: [],
      capacidadeProducao: '',
      customSector: selectedSector === "Outro" ? "" : prev.customSector
    }));

    const foundSector = sectores.find(s => s.setor === selectedSector);
    setSubsectores(foundSector ? foundSector.subsectores : []);
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    let newValue = value;

    if (type === "file" && files && files[0]) {
      handleImageUpload(files[0]);
      return;
    } else if (typeof value === "string" && (name === "nuit" || name === "nuel" || name === "nrContriuinte")) {
      newValue = value.replace(/\D/g, '');
    }

    setCompanyData(prev => ({ ...prev, [name]: newValue }));
  };

  // Validações
  const validateStep = (step) => {
    switch (step) {
      case 0: // Tipo de Entidade
        return companyData.tipoEntidade && companyData.subtipoEntidade;
      case 1: // Informações Básicas
        const fiscalFieldsValid = hasOptionalFiscalFields ? true : (
          companyData.nuit?.length >= 9 &&
          companyData.nuel?.length >= 9 &&
          companyData.nrContriuinte?.length >= 9
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
        return companyData.sector && companyData.subtipoEntidade;
      case 4: // Upload de Logotipo
        return termsAccepted;
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
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setErrorMessage("");
    setActiveStep(prev => prev - 1);
  };

  // Submissão do formulário
  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar duplicados
      const companiesSnapshot = await get(ref(db, "company"));
      let duplicates = [];
      
      companiesSnapshot.forEach(child => {
        const data = child.val();
        if (data.nome === companyData.nome) duplicates.push("Nome da Empresa");
        if (data.nuit === companyData.nuit) duplicates.push("NUIT");
        if (data.nuel === companyData.nuel) duplicates.push("NUEL");
        if (data.nrContriuinte === companyData.nrContriuinte) duplicates.push("Número de Contribuinte");
        if (data.contacto === companyData.contacto) duplicates.push("Contacto");
      });

      if (duplicates.length > 0) {
        throw new Error(
          `Dados já cadastrados: ${duplicates.join(", ")}. ` +
          `Se você é o proprietário, contacte suporte@connectionmozambique.com.`
        );
      }

      // Upload do logo se existir
      let logoUrl = "";
      if (companyData.logo) {
        const fileRef = storageRef(storage, `logos/${user.uid}`);
        await uploadBytes(fileRef, companyData.logo);
        logoUrl = await getDownloadURL(fileRef);
      }

      // Preparar dados para salvar
      const dataToSave = {
        ...companyData,
        id: user.uid,
        email: user.email,
        logoUrl: logoUrl || null,
        hasOptionalFiscalFields,
        subscriptions: { status: "active", isverify: "false" },
        createdAt: new Date().toISOString(),
        subsectores: companyData.subsectores?.filter(Boolean) || null,
      };

      // Remover campos vazios
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === "" || dataToSave[key] === null) {
          delete dataToSave[key];
        }
      });

      await set(ref(db, `company/${user.uid}`), dataToSave);
      await push(ref(db, `subscriptions/${user.uid}`), { status: "active" });

      navigate('/auth');
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setErrorMessage(error.message || "Erro ao cadastrar empresa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Renderização dos passos
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
              error={!companyData.tipoEntidade && activeStep >= 0}
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
                error={!companyData.subtipoEntidade && activeStep >= 0}
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
              error={!companyData.nome && activeStep >= 1}
            />
            
            <TextField
              label="Sigla"
              name="sigla"
              value={companyData.sigla}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />

            {!hasOptionalFiscalFields ? (
              <>
                <TextField
                  label="NUIT *"
                  name="nuit"
                  value={companyData.nuit}
                  onChange={handleChange}
                  error={(!companyData.nuit || companyData.nuit.length < 9) && activeStep >= 1}
                  helperText={(!companyData.nuit || companyData.nuit.length < 9) ? "NUIT deve ter 9 dígitos" : ""}
                  fullWidth
                  margin="normal"
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                />
                <TextField
                  label="NUEL *"
                  name="nuel"
                  value={companyData.nuel}
                  onChange={handleChange}
                  error={(!companyData.nuel || companyData.nuel.length < 9) && activeStep >= 1}
                  helperText={(!companyData.nuel || companyData.nuel.length < 9) ? "NUEL deve ter 9 dígitos" : ""}
                  fullWidth
                  margin="normal"
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                />
                <TextField
                  label="Número de Contribuinte *"
                  name="nrContriuinte"
                  value={companyData.nrContriuinte}
                  onChange={handleChange}
                  error={(!companyData.nrContriuinte || companyData.nrContriuinte.length < 9) && activeStep >= 1}
                  helperText={(!companyData.nrContriuinte || companyData.nrContriuinte.length < 9) ? "Número de contribuinte deve ter 9 dígitos" : ""}
                  fullWidth
                  margin="normal"
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                />
              </>
            ) : (
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
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                />
                <TextField
                  label="NUEL"
                  name="nuel"
                  value={companyData.nuel}
                  onChange={handleChange}
                  helperText="Opcional para este tipo de entidade"
                  fullWidth
                  margin="normal"
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                />
                <TextField
                  label="Número de Contribuinte"
                  name="nrContriuinte"
                  value={companyData.nrContriuinte}
                  onChange={handleChange}
                  helperText="Opcional para este tipo de entidade"
                  fullWidth
                  margin="normal"
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
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
              error={!companyData.endereco && activeStep >= 2}
            />
            
            <TextField
              label="Contacto *"
              name="contacto"
              value={companyData.contacto || ""}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!companyData.contacto && activeStep >= 2}
              inputProps={{ inputMode: 'tel' }}
            />
            
            <TextField
              select
              label="Província *"
              name="provincia"
              value={companyData.provincia}
              onChange={handleProvinceChange}
              fullWidth
              margin="normal"
              error={!companyData.provincia && activeStep >= 2}
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
              error={!companyData.distrito && activeStep >= 2}
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
              error={!companyData.sector && activeStep >= 3}
            >
              <MenuItem value="">Selecione</MenuItem>
              {sectores.map(s => (
                <MenuItem key={s.setor} value={s.setor}>
                  {s.setor}
                </MenuItem>
              ))}
            </TextField>

            {companyData.sector === "Outro" && (
              <TextField
                label="Especifique o Setor *"
                name="customSector"
                value={companyData.customSector}
                onChange={handleChange}
                fullWidth
                margin="normal"
                error={!companyData.customSector && activeStep >= 3}
              />
            )}

            {subsectores.length > 0 && (
              <TextField
                select
                label="Subsetores"
                name="subsectores"
                value={companyData.subsectores}
                onChange={(e) => {
                  if (e.target.value.includes("all")) {
                    handleChange({
                      target: {
                        name: "subsectores",
                        value: companyData.subsectores.length === subsectores.length ? [] : [...subsectores]
                      }
                    });
                  } else {
                    handleChange(e);
                  }
                }}
                fullWidth
                margin="normal"
                SelectProps={{
                  multiple: true,
                  open: openSubsectorSelect,
                  onClose: () => setOpenSubsectorSelect(false),
                  onOpen: () => setOpenSubsectorSelect(true),
                  renderValue: (selected) => selected.join(', '),
                }}
              >
                <MenuItem onClick={() => setOpenSubsectorSelect(false)}>
                  <ListItemIcon><Close fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Fechar" />
                </MenuItem>
                <MenuItem value="all">
                  <ListItemIcon>
                    <Checkbox
                      checked={companyData.subsectores.length === subsectores.length}
                      indeterminate={companyData.subsectores.length > 0 && companyData.subsectores.length < subsectores.length}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Selecionar Todos" />
                </MenuItem>
                <Divider />
                {subsectores.map((sub) => (
                  <MenuItem key={sub} value={sub}>
                    <Checkbox checked={companyData.subsectores.includes(sub)} />
                    <ListItemText primary={sub} />
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
              Logotipo da empresa (opcional, máximo 25MB)
            </Typography>
            
            <Button
              variant="contained"
              component="label"
              startIcon={<CameraAlt />}
              sx={{ mb: 2 }}
            >
              Carregar Logotipo
              <input type="file" hidden accept="image/*" onChange={handleChange} />
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
                <Button
                  size="small"
                  color="error"
                  onClick={() => setCompanyData(prev => ({ ...prev, logo: null }))}
                  sx={{ mt: 1 }}
                >
                  Remover
                </Button>
              </Box>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Eu concordo com os Termos de Serviço e Política de Privacidade
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

  if (isCheckingCompany) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: 800, 
      mx: 'auto', 
      my: 4, 
      p: 3, 
      bgcolor: 'background.paper', 
      borderRadius: 2,
      boxShadow: 3
    }}>
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Cadastro da Empresa
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={handleLoginRedirect}
          sx={{ minWidth: 200 }}
        >
          Retornar para Login
        </Button>
      </Box>

      <Stepper 
        activeStep={activeStep} 
        alternativeLabel 
        sx={{ mb: 4 }}
      >
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ 
        p: 3, 
        border: '1px solid #eee', 
        borderRadius: 2,
        backgroundColor: 'background.paper'
      }}>
        {renderStepContent(activeStep)}
        
        {errorMessage && (
          <Alert 
            severity="error" 
            sx={{ mt: 2 }}
            onClose={() => setErrorMessage('')}
          >
            {errorMessage}
          </Alert>
        )}

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 4,
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Button
            variant="outlined"
            color="primary"
            disabled={activeStep === 0 || isLoading}
            onClick={handleBack}
            sx={{ minWidth: 120, flex: 1 }}
          >
            Voltar
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isLoading || !termsAccepted}
              sx={{ minWidth: 120, flex: 1 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Finalizar Cadastro'
              )}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={isLoading}
              sx={{ minWidth: 120, flex: 1 }}
            >
              Próximo
            </Button>
          )}
        </Box>
      </Box>

      {/* Modal de Edição de Imagem */}
      <Dialog 
        open={isCropping} 
        onClose={() => setIsCropping(false)} 
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Recortar Logotipo</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            pt: 2
          }}>
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                aspect={1}
                minWidth={100}
                minHeight={100}
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                  alt="Imagem para recortar"
                  onLoad={() => {
                    if (imgRef.current) {
                      const width = imgRef.current.width;
                      const height = imgRef.current.height;
                      const size = Math.min(width, height);
                      const initialCrop = {
                        unit: 'px',
                        width: size,
                        height: size,
                        x: (width - size) / 2,
                        y: (height - size) / 2
                      };
                      setCrop(initialCrop);
                      setCompletedCrop(initialCrop);
                    }
                  }}
                />
              </ReactCrop>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCropping(false)}>Cancelar</Button>
          <Button 
            onClick={applyCrop} 
            variant="contained" 
            color="primary"
          >
            Aplicar Recorte
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyDataFormDesk;