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
  DialogActions,
  Paper,
  Container,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  Avatar,
  Tooltip
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { get, ref, set, push } from 'firebase/database';
import { auth, db, storage } from '../fb';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { 
  Close, 
  CameraAlt, 
  Business, 
  LocationOn, 
  Phone, 
  Badge, 
  Assignment, 
  CheckCircle,
  ArrowBack,
  ArrowForward,
  Save,
  CheckCircleOutline,
  Work,
  Agriculture,
  PrecisionManufacturing,
  LocalShipping,
  Construction,
  Restaurant,
  HealthAndSafety,
  School,
  ShoppingBasket
} from '@mui/icons-material';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useLanguage } from '../context/LanguageContext';

/* ── Design Tokens (mesmos da hero) ───────────────────────────────────── */
const T = {
  navy:     '#08192E',
  navyMid:  '#0E2849',
  navyLight:'#183A63',
  gold:     '#C8903A',
  goldLight:'#E8B96A',
  goldPale: '#FDF3E3',
  cream:    '#FAFAF7',
  white:    '#FFFFFF',
  text:     '#0F1C2D',
  textMid:  '#3D5A7A',
  textSub:  '#6B89A5',
  border:   '#E0E8F0',
  borderMid:'#C5D4E3',
  surface:  '#F4F7FB',
};

/* ── Keyframes (mesmos da hero) ───────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-gold {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(0.98); }
  }
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease both;
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  .delay-5 { animation-delay: 0.58s; }
  .delay-6 { animation-delay: 0.70s; }
  
  .form-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .form-card:hover {
    transform: translateY(-2px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .step-indicator {
    transition: all 0.2s ease;
  }
  .step-indicator:hover {
    transform: scale(1.05);
  }
  .input-field {
    transition: all 0.2s ease;
  }
  .input-field:hover {
    border-color: ${T.gold} !important;
  }
  .input-field:focus-within {
    border-color: ${T.gold} !important;
    box-shadow: 0 0 0 3px ${T.goldPale} !important;
  }
  .submit-btn {
    transition: all 0.2s ease;
  }
  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(200,144,58,0.3) !important;
  }
`;

// Configurações
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Passos do formulário
const steps = [
  { 
    label: 'Tipo de Entidade', 
    icon: <Business />, 
    description: 'Selecione o tipo de pessoa jurídica' 
  },
  { 
    label: 'Informações Básicas', 
    icon: <Assignment />, 
    description: 'Dados cadastrais da empresa' 
  },
  { 
    label: 'Endereço & Contacto', 
    icon: <LocationOn />, 
    description: 'Localização e formas de contato' 
  },
  { 
    label: 'Setor & Capacidade', 
    icon: <Work />, 
    description: 'Área de atuação e produção' 
  },
  { 
    label: 'Upload de Logotipo', 
    icon: <CameraAlt />, 
    description: 'Imagem da empresa (opcional)' 
  }
];

// Função para gerar slug a partir do nome da empresa
const generateSlug = (nome) => {
  if (!nome) return '';
  
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Função para verificar se o slug já existe
const checkSlugExists = async (slug, currentId = null) => {
  try {
    const companiesSnapshot = await get(ref(db, "company"));
    let exists = false;
    
    companiesSnapshot.forEach(child => {
      const data = child.val();
      if (currentId && child.key === currentId) return;
      if (data.slug === slug) {
        exists = true;
      }
    });
    
    return exists;
  } catch (error) {
    console.error("Erro ao verificar slug:", error);
    return false;
  }
};

// Função para gerar slug único
const generateUniqueSlug = async (nome, currentId = null) => {
  let baseSlug = generateSlug(nome);
  if (!baseSlug) return '';
  
  let slug = baseSlug;
  let counter = 1;
  
  while (await checkSlugExists(slug, currentId)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

// Componente de campo de input estilizado
const StyledTextField = ({ label, name, value, onChange, error, helperText, icon, required = false, ...props }) => (
  <TextField
    label={label}
    name={name}
    value={value || ''}
    onChange={onChange}
    error={error}
    helperText={helperText}
    fullWidth
    margin="normal"
    variant="outlined"
    required={required}
    InputProps={{
      startAdornment: icon ? (
        <InputAdornment position="start">
          {icon}
        </InputAdornment>
      ) : null,
    }}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        backgroundColor: T.white,
        transition: 'all 0.2s ease',
        '&:hover fieldset': {
          borderColor: T.gold,
        },
        '&.Mui-focused fieldset': {
          borderColor: T.gold,
          borderWidth: '2px',
        },
      },
      '& .MuiInputLabel-root': {
        color: T.textSub,
        '&.Mui-focused': {
          color: T.gold,
        },
      },
      '& .MuiFormHelperText-root': {
        marginLeft: 0,
        color: error ? '#d32f2f' : T.textSub,
      },
    }}
    {...props}
  />
);

const CompanyDataFormDesk = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
  const [slug, setSlug] = useState('');
  const [, setIsGeneratingSlug] = useState(false);
  
  // Estados para edição de imagem
  const [imgSrc, setImgSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef(null);

  // Estado para controlar animações
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Ativar conteúdo após montagem
    setShowContent(true);
  }, []);

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

  // Ícones para setores
  const getSectorIcon = (sector) => {
    const icons = {
      'Construção': <Construction />,
      'Tecnologia': <PrecisionManufacturing />,
      'Saúde': <HealthAndSafety />,
      'Educação': <School />,
      'Alimentação': <Restaurant />,
      'Logística': <LocalShipping />,
      'Agricultura': <Agriculture />,
      'Comércio': <ShoppingBasket />,
      'Serviços': <Work />,
      'Indústria': <PrecisionManufacturing />,
    };
    return icons[sector] || <Business />;
  };

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

  // Gerar slug quando o nome da empresa mudar
  useEffect(() => {
    const updateSlug = async () => {
      if (companyData.nome && companyData.nome.length >= 3) {
        setIsGeneratingSlug(true);
        const user = auth.currentUser;
        const newSlug = await generateUniqueSlug(companyData.nome, user?.uid);
        setSlug(newSlug);
        setIsGeneratingSlug(false);
      } else {
        setSlug('');
      }
    };

    updateSlug();
  }, [companyData.nome]);

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
      case 0:
        return companyData.tipoEntidade && companyData.subtipoEntidade;
      case 1:
        const fiscalFieldsValid = hasOptionalFiscalFields ? true : (
          companyData.nuit?.length >= 9 &&
          companyData.nuel?.length >= 9 &&
          companyData.nrContriuinte?.length >= 9
        );
        return companyData.nome && fiscalFieldsValid;
      case 2:
        return (
          companyData.endereco &&
          companyData.contacto &&
          companyData.provincia &&
          companyData.distrito
        );
      case 3:
        return companyData.sector && companyData.sector !== '' && (
          companyData.sector !== "Outro" || companyData.customSector
        );
      case 4:
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

      const companiesSnapshot = await get(ref(db, "company"));
      let duplicates = [];
      
      companiesSnapshot.forEach(child => {
        const data = child.val();
        if (data.nome === companyData.nome) duplicates.push("Nome da Empresa");
        if (data.nuit === companyData.nuit && companyData.nuit) duplicates.push("NUIT");
        if (data.nuel === companyData.nuel && companyData.nuel) duplicates.push("NUEL");
        if (data.nrContriuinte === companyData.nrContriuinte && companyData.nrContriuinte) duplicates.push("Número de Contribuinte");
        if (data.contacto === companyData.contacto) duplicates.push("Contacto");
      });

      if (duplicates.length > 0) {
        throw new Error(
          `Dados já cadastrados: ${duplicates.join(", ")}. ` +
          `Se você é o proprietário, contacte suporte@connectionmozambique.com.`
        );
      }

      let logoUrl = "";
      if (companyData.logo) {
        const fileRef = storageRef(storage, `logos/${user.uid}`);
        await uploadBytes(fileRef, companyData.logo);
        logoUrl = await getDownloadURL(fileRef);
      }

      const finalSlug = slug || generateSlug(companyData.nome);

      const dataToSave = {
        ...companyData,
        id: user.uid,
        email: user.email,
        logoUrl: logoUrl || null,
        slug: finalSlug,
        hasOptionalFiscalFields,
        subscriptions: { status: "active", isverify: "false" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subsectores: companyData.subsectores?.filter(Boolean) || null,
      };

      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === "" || dataToSave[key] === null || dataToSave[key] === undefined) {
          delete dataToSave[key];
        }
      });

      await set(ref(db, `company/${user.uid}`), dataToSave);
      await push(ref(db, `subscriptions/${user.uid}`), { 
        status: "active",
        createdAt: new Date().toISOString() 
      });

      setSuccessMessage("Cadastro realizado com sucesso! Redirecionando...");
      
      setTimeout(() => {
        navigate('/app/verification', { replace: true });
      }, 2000);
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setErrorMessage(error.message || "Erro ao cadastrar empresa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Renderização dos passos sem animações problemáticas
  const renderStepContent = (step) => {
    if (!showContent) return null;

    switch (step) {
      case 0:
        return (
          <Box>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: T.gold, width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <Business sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: T.text, fontWeight: 600 }}>
                Tipo de Pessoa Jurídica
              </Typography>
              <Typography variant="body2" sx={{ color: T.textSub }}>
                Selecione a categoria que melhor descreve sua organização
              </Typography>
            </Box>

            <StyledTextField
              select
              label="Tipo de Entidade *"
              name="tipoEntidade"
              value={companyData.tipoEntidade}
              onChange={handleEntidadeChange}
              error={!companyData.tipoEntidade && activeStep >= 0}
              icon={<Business sx={{ color: T.gold }} />}
            >
              <MenuItem value="">Selecione o tipo de entidade</MenuItem>
              {tiposEntidades.map(ent => (
                <MenuItem key={ent.tipo} value={ent.tipo}>
                  {ent.tipo}
                </MenuItem>
              ))}
            </StyledTextField>

            {companyData.tipoEntidade && subtiposEntidade.length > 0 && (
              <StyledTextField
                select
                label="Subtipo de Entidade *"
                name="subtipoEntidade"
                value={companyData.subtipoEntidade}
                onChange={handleChange}
                error={!companyData.subtipoEntidade && activeStep >= 0}
                icon={<Business sx={{ color: T.gold }} />}
              >
                <MenuItem value="">Selecione o subtipo</MenuItem>
                {subtiposEntidade.map((sub, index) => (
                  <MenuItem key={index} value={sub}>
                    {sub}
                  </MenuItem>
                ))}
              </StyledTextField>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: T.gold, width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <Assignment sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: T.text, fontWeight: 600 }}>
                Dados Cadastrais
              </Typography>
              <Typography variant="body2" sx={{ color: T.textSub }}>
                Informe os dados oficiais da sua empresa
              </Typography>
            </Box>

            <StyledTextField
              label="Nome da Empresa *"
              name="nome"
              value={companyData.nome}
              onChange={handleChange}
              error={!companyData.nome && activeStep >= 1}
              icon={<Business sx={{ color: T.gold }} />}
            />

    

            <StyledTextField
              label="Sigla"
              name="sigla"
              value={companyData.sigla}
              onChange={handleChange}
              icon={<Badge sx={{ color: T.gold }} />}
            />

            {!hasOptionalFiscalFields ? (
              <>
                <StyledTextField
                  label="NUIT *"
                  name="nuit"
                  value={companyData.nuit}
                  onChange={handleChange}
                  error={(!companyData.nuit || companyData.nuit.length < 9) && activeStep >= 1}
                  helperText={(!companyData.nuit || companyData.nuit.length < 9) ? "NUIT deve ter 9 dígitos" : ""}
                  icon={<Badge sx={{ color: T.gold }} />}
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                />
                <StyledTextField
                  label="NUEL *"
                  name="nuel"
                  value={companyData.nuel}
                  onChange={handleChange}
                  error={(!companyData.nuel || companyData.nuel.length < 9) && activeStep >= 1}
                  helperText={(!companyData.nuel || companyData.nuel.length < 9) ? "NUEL deve ter 9 dígitos" : ""}
                  icon={<Badge sx={{ color: T.gold }} />}
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                />
                <StyledTextField
                  label="Número de Contribuinte *"
                  name="nrContriuinte"
                  value={companyData.nrContriuinte}
                  onChange={handleChange}
                  error={(!companyData.nrContriuinte || companyData.nrContriuinte.length < 9) && activeStep >= 1}
                  helperText={(!companyData.nrContriuinte || companyData.nrContriuinte.length < 9) ? "Número de contribuinte deve ter 9 dígitos" : ""}
                  icon={<Badge sx={{ color: T.gold }} />}
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                />
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: T.textSub, mt: 2, mb: 1, fontStyle: 'italic' }}>
                  Informações Fiscais (Opcionais para este tipo de entidade)
                </Typography>
                <StyledTextField
                  label="NUIT"
                  name="nuit"
                  value={companyData.nuit}
                  onChange={handleChange}
                  helperText="Opcional"
                  icon={<Badge sx={{ color: T.gold }} />}
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                />
                <StyledTextField
                  label="NUEL"
                  name="nuel"
                  value={companyData.nuel}
                  onChange={handleChange}
                  helperText="Opcional"
                  icon={<Badge sx={{ color: T.gold }} />}
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                />
                <StyledTextField
                  label="Número de Contribuinte"
                  name="nrContriuinte"
                  value={companyData.nrContriuinte}
                  onChange={handleChange}
                  helperText="Opcional"
                  icon={<Badge sx={{ color: T.gold }} />}
                  inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                />
              </>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: T.gold, width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <LocationOn sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: T.text, fontWeight: 600 }}>
                Localização e Contato
              </Typography>
              <Typography variant="body2" sx={{ color: T.textSub }}>
                Onde sua empresa está localizada e como podemos contatá-la
              </Typography>
            </Box>

            <StyledTextField
              label="Endereço *"
              name="endereco"
              value={companyData.endereco}
              onChange={handleChange}
              error={!companyData.endereco && activeStep >= 2}
              icon={<LocationOn sx={{ color: T.gold }} />}
            />

            <StyledTextField
              label="Contacto *"
              name="contacto"
              value={companyData.contacto || ""}
              onChange={handleChange}
              error={!companyData.contacto && activeStep >= 2}
              icon={<Phone sx={{ color: T.gold }} />}
              inputProps={{ inputMode: 'tel' }}
            />

            <StyledTextField
              select
              label="Província *"
              name="provincia"
              value={companyData.provincia}
              onChange={handleProvinceChange}
              error={!companyData.provincia && activeStep >= 2}
              icon={<LocationOn sx={{ color: T.gold }} />}
            >
              <MenuItem value="">Selecione</MenuItem>
              {provincias.map(prov => (
                <MenuItem key={prov.provincia} value={prov.provincia}>
                  {prov.provincia}
                </MenuItem>
              ))}
            </StyledTextField>

            <StyledTextField
              select
              label="Distrito *"
              name="distrito"
              value={companyData.distrito}
              onChange={handleChange}
              fullWidth
              margin="normal"
              disabled={!companyData.provincia}
              error={!companyData.distrito && activeStep >= 2}
              icon={<LocationOn sx={{ color: T.gold }} />}
            >
              <MenuItem value="">Selecione</MenuItem>
              {distritos.map(dist => (
                <MenuItem key={dist} value={dist}>
                  {dist}
                </MenuItem>
              ))}
            </StyledTextField>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: T.gold, width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <Work sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: T.text, fontWeight: 600 }}>
                Área de Atuação
              </Typography>
              <Typography variant="body2" sx={{ color: T.textSub }}>
                Defina o setor e capacidade produtiva da empresa
              </Typography>
            </Box>

            <StyledTextField
              select
              label="Setor de Atividade *"
              name="sector"
              value={companyData.sector}
              onChange={handleSectorChange}
              error={!companyData.sector && activeStep >= 3}
              icon={<Work sx={{ color: T.gold }} />}
            >
              <MenuItem value="">Selecione</MenuItem>
              {sectores.map(s => (
                <MenuItem key={s.setor} value={s.setor}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getSectorIcon(s.setor)}
                    {s.setor}
                  </Box>
                </MenuItem>
              ))}
            </StyledTextField>

            {companyData.sector === "Outro" && (
              <StyledTextField
                label="Especifique o Setor *"
                name="customSector"
                value={companyData.customSector}
                onChange={handleChange}
                error={!companyData.customSector && activeStep >= 3}
                icon={<Work sx={{ color: T.gold }} />}
              />
            )}

            {subsectores.length > 0 && (
              <TextField
                select
                label="Subsetores (opcional)"
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
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

      case 4:
        return (
          <Box>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: T.gold, width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <CameraAlt sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: T.text, fontWeight: 600 }}>
                Logotipo da Empresa
              </Typography>
              <Typography variant="body2" sx={{ color: T.textSub }}>
                Adicione uma imagem para personalizar seu perfil (opcional, máximo 25MB)
              </Typography>
            </Box>

            <Card 
              sx={{ 
                mb: 3,
                borderRadius: '16px',
                border: `1px dashed ${companyData.logo ? T.gold : T.borderMid}`,
                bgcolor: companyData.logo ? T.goldPale : T.surface,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: T.gold,
                  bgcolor: T.goldPale,
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="logo-upload"
                  type="file"
                  onChange={handleChange}
                />
                <label htmlFor="logo-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CameraAlt />}
                    sx={{
                      bgcolor: T.gold,
                      color: T.white,
                      '&:hover': { bgcolor: T.goldLight },
                      borderRadius: '12px',
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      mb: 2
                    }}
                  >
                    Selecionar Logotipo
                  </Button>
                </label>

                {companyData.logo && (
                  <Box sx={{ mt: 2 }}>
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-block',
                      }}
                    >
                      <Avatar
                        src={URL.createObjectURL(companyData.logo)}
                        alt="Logo Preview"
                        sx={{
                          width: 120,
                          height: 120,
                          mx: 'auto',
                          border: `3px solid ${T.gold}`,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Tooltip title="Remover imagem">
                        <IconButton
                          size="small"
                          onClick={() => setCompanyData(prev => ({ ...prev, logo: null }))}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: '#ef4444',
                            color: T.white,
                            '&:hover': { bgcolor: '#dc2626' },
                            width: 24,
                            height: 24,
                          }}
                        >
                          <Close sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="caption" sx={{ color: T.gold, display: 'block', mt: 1 }}>
                      Logotipo selecionado
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Paper
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${T.border}`,
                bgcolor: T.surface,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: T.text, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutline sx={{ color: T.gold }} /> Termos e Condições
              </Typography>
              
              <Typography variant="body2" sx={{ color: T.textSub, mb: 2 }}>
                Ao cadastrar sua empresa na plataforma BizMoz, você concorda com nossos 
                termos de serviço e política de privacidade. Seus dados serão tratados 
                de acordo com a legislação vigente.
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    sx={{
                      color: T.gold,
                      '&.Mui-checked': {
                        color: T.gold,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: T.text }}>
                    Eu li e concordo com os <Link to="/termos" style={{ color: T.gold, textDecoration: 'none', fontWeight: 600 }}>Termos de Serviço</Link> e{' '}
                    <Link to="/privacidade" style={{ color: T.gold, textDecoration: 'none', fontWeight: 600 }}>Política de Privacidade</Link>
                  </Typography>
                }
              />
            </Paper>
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
      <Box 
        sx={{ 
          minHeight: '100vh', 
          bgcolor: 'background.default',
          color: 'text.primary',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: '"Plus Jakarta Sans", sans-serif'
        }}
      >
        <style>{KEYFRAMES}</style>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 48, height: 48,
              borderRadius: '50%',
              border: `3px solid ${T.border}`,
              borderTopColor: T.gold,
              animation: 'fadeUp 0.8s infinite linear',
              mx: 'auto',
              mb: 2
            }}
          />
          <Typography color="text.secondary">{t('onboarding.loadingExisting')}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        bgcolor: 'background.default',
        color: 'text.primary',
        minHeight: '100vh',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        py: 4
      }}
    >
      <style>{KEYFRAMES}</style>
      
      <Container maxWidth="lg">
        <Paper
          className="animate-fade-up"
          sx={{
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            borderRadius: '24px',
            p: { xs: 3, md: 4 },
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.07) 0%, transparent 50%)
            `,
          }} />
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }} />

          <Box sx={{ 
            position: 'relative', 
            zIndex: 1, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 800, 
                  color: T.white,
                  fontFamily: '"Playfair Display", serif',
                  mb: 1
                }}
              >
                {t('onboarding.companyTitle')}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Preencha os dados para registrar sua empresa na plataforma
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={handleLoginRedirect}
              className="outline-btn"
              startIcon={<ArrowBack />}
              sx={{
                borderColor: 'rgba(255,255,255,0.25)',
                color: T.white,
                '&:hover': { 
                  borderColor: T.gold, 
                  bgcolor: 'rgba(200,144,58,0.1)' 
                },
                borderRadius: '12px',
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {t('onboarding.backLogin')}
            </Button>
          </Box>
        </Paper>

        <Paper
          className="animate-fade-up delay-1"
          sx={{
            p: 4,
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel
              sx={{
                '& .MuiStepLabel-root .Mui-completed': {
                  color: T.gold,
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: T.gold,
                },
                '& .MuiStepIcon-root': {
                  color: T.borderMid,
                  '&.Mui-completed': {
                    color: T.gold,
                  },
                  '&.Mui-active': {
                    color: T.gold,
                  },
                },
                '& .MuiStepLabel-label': {
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontSize: '0.9rem',
                  '&.Mui-active': {
                    color: T.gold,
                    fontWeight: 600,
                  },
                  '&.Mui-completed': {
                    color: T.text,
                  },
                },
              }}
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepLabel StepIconComponent={() => (
                    <Avatar
                      className="step-indicator"
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: activeStep > index 
                          ? T.gold 
                          : activeStep === index 
                            ? T.gold 
                            : T.borderMid,
                        color: activeStep >= index ? T.white : T.textSub,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {step.icon}
                    </Avatar>
                  )}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: T.text }}>
                        {step.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: T.textSub, display: { xs: 'none', md: 'block' } }}>
                        {step.description}
                      </Typography>
                    </Box>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Box sx={{ minHeight: 400 }}>
            {showContent && renderStepContent(activeStep)}
            
            {errorMessage && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2,
                  borderRadius: '12px',
                  '& .MuiAlert-icon': { color: '#ef4444' }
                }}
                onClose={() => setErrorMessage('')}
              >
                {errorMessage}
              </Alert>
            )}

            {successMessage && (
              <Alert 
                severity="success" 
                sx={{ 
                  mt: 2,
                  borderRadius: '12px',
                  '& .MuiAlert-icon': { color: T.gold }
                }}
                icon={<CheckCircle sx={{ color: T.gold }} />}
              >
                {successMessage}
              </Alert>
            )}
          </Box>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 4,
            gap: 2,
            flexWrap: 'wrap'
          }}>
            <Button
              variant="outlined"
              disabled={activeStep === 0 || isLoading}
              onClick={handleBack}
              startIcon={<ArrowBack />}
              sx={{
                borderColor: T.borderMid,
                color: T.textMid,
                '&:hover': { borderColor: T.gold, color: T.gold },
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 120,
                flex: 1
              }}
            >
              Voltar
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isLoading || !termsAccepted}
                className="submit-btn"
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                sx={{
                  bgcolor: T.gold,
                  color: T.white,
                  '&:hover': { bgcolor: T.goldLight },
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 120,
                  flex: 1
                }}
              >
                {isLoading ? t('onboarding.processing') : t('onboarding.finish')}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isLoading}
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: T.gold,
                  color: T.white,
                  '&:hover': { bgcolor: T.goldLight },
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 120,
                  flex: 1
                }}
              >
                {t('onboarding.next')}
              </Button>
            )}
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: T.textSub }}>
              {t('onboarding.step', { current: activeStep + 1, total: steps.length })}
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 4,
                bgcolor: T.border,
                borderRadius: 2,
                mt: 1,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${((activeStep + 1) / steps.length) * 100}%`,
                  bgcolor: T.gold,
                  borderRadius: 2,
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Box>
        </Paper>
      </Container>

      <Dialog 
        open={isCropping} 
        onClose={() => setIsCropping(false)} 
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: `1px solid ${T.border}`,
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: T.text }}>
          Recortar Logotipo
        </DialogTitle>
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
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setIsCropping(false)}
            sx={{
              color: T.textSub,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={applyCrop} 
            variant="contained"
            sx={{
              bgcolor: T.gold,
              color: T.white,
              '&:hover': { bgcolor: T.goldLight },
              borderRadius: '10px',
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Aplicar Recorte
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyDataFormDesk;
