import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';
import { 
  Email, 
  Google, 
  Visibility, 
  VisibilityOff,
  Person as PersonalIcon,
  Business as BusinessIcon,
  ArrowForward as ArrowForwardIcon,
  Lock,
  CheckCircle,
} from '@mui/icons-material';
import { 
  Snackbar, 
  Alert, 
  IconButton, 
  TextField, 
  Button, 
  InputAdornment, 
  Grid, 
  Box, 
  Typography,
  Link,
  Paper,
  Fade,
  CircularProgress,
  Dialog,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Divider,
  Container,
  Chip,
  Zoom
} from '@mui/material';
import { signInWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db, googleProvider } from '../fb';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';
import logo from '../img/bg.png';
import marketing from '../img/marketing.jpg';
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
  @keyframes slideInLeft {
    from { transform: translateX(-50px); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideInRight {
    from { transform: translateX(50px); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
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
  .animate-slide-left {
    animation: slideInLeft 0.5s ease both;
  }
  .animate-slide-right {
    animation: slideInRight 0.5s ease both;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  .delay-5 { animation-delay: 0.58s; }
  
  .auth-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .auth-card:hover {
    transform: translateY(-4px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .account-card {
    transition: all 0.3s ease;
  }
  .account-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 24px 56px rgba(8,25,46,0.15) !important;
  }
  .account-card.selected {
    border: 2px solid ${T.gold} !important;
    box-shadow: 0 8px 24px rgba(200,144,58,0.2) !important;
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
  .login-btn {
    transition: all 0.2s ease;
  }
  .login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(200,144,58,0.3) !important;
  }
  .google-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(211,47,47,0.3) !important;
  }
`;

// Constantes de segurança
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_TIME = 3000; // 3 segundos

const RECAPTCHA_ACTIONS = {
  LOGIN: 'login',
  GOOGLE_SIGNIN: 'google_signin',
  SIGNUP: 'signup'
};

// Funções de segurança
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const sanitizeInput = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>]*)/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }
  return value;
};

const validateInputLength = (value, maxLength = 255) => {
  return value.length <= maxLength;
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
    /confirm\(/i,
    /union.*select/i,
    /select.*from/i,
    /insert.*into/i,
    /delete.*from/i,
    /drop.*table/i,
    /or.*1=1/i
  ];
  
  const dataString = JSON.stringify(data).toLowerCase();
  return suspiciousPatterns.some(pattern => pattern.test(dataString));
};

const sanitizeDataBeforeSave = (data) => {
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    }
  });
  
  return sanitized;
};

export const AccountTypeSelector = ({ onSelect }) => {
  const [selectedType, setSelectedType] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSelect = (type) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  const accountTypes = [
    {
      id: 'personal',
      title: 'Conta Pessoal',
      description: 'Ideal para uso individual, com possibilidade de fazer pedidos de cotação, acesso a lojas e outros serviços disponíveis na plataforma.',
      icon: <PersonalIcon fontSize="large" />,
      color: T.gold,
      features: [
        'Acesso a cotações',
        'Explorar produtos',
        'Solicitar orçamentos',
        'Favoritos'
      ]
    },
    {
      id: 'business',
      title: 'Conta Empresarial',
      description: 'Para empresas, com acesso aos módulos de Cotações, Concursos e mais, permitindo a gestão do seu negócio e networking a nível nacional.',
      icon: <BusinessIcon fontSize="large" />,
      color: T.navy,
      features: [
        'Publicar cotações',
        'Receber propostas',
        'Catálogo de produtos',
        'Gestão empresarial',
        'Networking B2B'
      ]
    }
  ];

  return (
    <Box 
      sx={{ 
        margin: '0 auto', 
        p: isMobile ? 2 : 4, 
        overflow: 'auto',
        background: T.cream,
        minHeight: '100vh'
      }}
    >
      <style>{KEYFRAMES}</style>
      
      <Container maxWidth="md">

        <Grid container spacing={3} justifyContent="center">
          {accountTypes.map((type, index) => (
            <Grid item xs={12} md={6} key={type.id}>
              <Zoom in={true} style={{ transitionDelay: `${index * 150}ms` }}>
                <Card
                  onClick={() => handleSelect(type.id)}
                  className={`account-card ${selectedType === type.id ? 'selected' : ''}`}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    borderRadius: '24px',
                    border: `2px solid ${selectedType === type.id ? type.color : T.border}`,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 24px 56px rgba(8,25,46,0.15)`,
                      borderColor: type.color,
                    }
                  }}
                >
                  {selectedType === type.id && (
                    <Chip
                      label="Selecionado"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        right: 20,
                        bgcolor: type.color,
                        color: T.white,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        zIndex: 10,
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: `${type.color}15`, 
                          color: type.color, 
                          width: 70, 
                          height: 70,
                          border: `2px solid ${type.color}`,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {type.icon}
                      </Avatar>
                    </Box>
                    
                    <Typography 
                      gutterBottom 
                      variant="h5" 
                      component="h2" 
                      sx={{ 
                        textAlign: 'center', 
                        fontWeight: 700,
                        color: T.text,
                        mb: 2
                      }}
                    >
                      {type.title}
                    </Typography>
                    
                    <Divider sx={{ my: 2, borderColor: T.border }} />
                    
                    <Typography sx={{ 
                      textAlign: 'center', 
                      color: T.textSub,
                      mb: 3,
                      fontSize: '0.9rem',
                      lineHeight: 1.6
                    }}>
                      {type.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      {type.features.map((feature, i) => (
                        <Box 
                          key={i} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            mb: 1,
                            color: T.textMid,
                            fontSize: '0.85rem'
                          }}
                        >
                          <CheckCircle sx={{ fontSize: 16, color: type.color }} />
                          <Typography variant="body2">{feature}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        color: selectedType === type.id ? type.color : T.textSub,
                        '&:hover': {
                          bgcolor: 'transparent',
                          color: type.color,
                        }
                      }}
                    >
                      {selectedType === type.id ? 'Selecionado' : 'Selecionar'}
                    </Button>
                  </CardActions>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            disabled={!selectedType}
            onClick={handleConfirm}
            className="login-btn"
            sx={{
              bgcolor: T.gold,
              color: T.white,
              '&:hover': { bgcolor: T.goldLight },
              '&:disabled': { bgcolor: T.borderMid },
              px: 6,
              py: 1.8,
              borderRadius: '14px',
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
            }}
          >
            Continuar
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

const AuthDesk = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showAccountTypeDialog, setShowAccountTypeDialog] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState(false);
  const [securityChecks, setSecurityChecks] = useState({
    isHuman: false,
    lastAction: null,
    suspiciousActivity: false
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const requestedLocation = location.state?.from;
  const returnPath = typeof requestedLocation === 'string'
    ? requestedLocation
    : requestedLocation?.pathname || '/';
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t } = useLanguage();

  const siteKey = process.env.REACT_APP_RECAPTCHA_V3_KEY_1;

  // Configurar persistência de autenticação
  useEffect(() => {
    const configureAuthPersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error('Erro ao configurar persistência:', error);
      }
    };
    
    configureAuthPersistence();
  }, []);

  // Configuração do reCAPTCHA v3
  useEffect(() => {
    const loadRecaptcha = () => {
      if (typeof window.grecaptcha !== 'undefined') {
        window.grecaptcha.ready(() => {
          setRecaptchaReady(true);
        });
        return;
      }

      if (!siteKey) {
        console.warn('Chave reCAPTCHA não configurada');
        setRecaptchaReady(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      script.id = 'recaptcha-script';
      
      script.onload = () => {
        if (typeof window.grecaptcha !== 'undefined') {
          window.grecaptcha.ready(() => {
            setRecaptchaReady(true);
          });
        } else {
          setRecaptchaError(true);
          setRecaptchaReady(true);
        }
      };

      script.onerror = () => {
        console.error('Erro ao carregar reCAPTCHA');
        setRecaptchaError(true);
        setRecaptchaReady(true);
      };

      document.body.appendChild(script);
    };

    loadRecaptcha();

    return () => {
      const script = document.getElementById('recaptcha-script');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, [siteKey]);

  // Verificar se está em período de bloqueio
  useEffect(() => {
    const checkLockout = () => {
      if (lockoutUntil && Date.now() < lockoutUntil) {
        setIsLockedOut(true);
        
        const timeout = lockoutUntil - Date.now();
        setTimeout(() => {
          setIsLockedOut(false);
          setLockoutUntil(null);
          setLoginAttempts(0);
          localStorage.removeItem('loginAttempts');
          localStorage.removeItem('loginLockout');
        }, timeout);
      } else {
        setIsLockedOut(false);
      }
    };
    
    checkLockout();
  }, [lockoutUntil]);

  // Recuperar estado de bloqueio ao carregar o componente
  useEffect(() => {
    const savedLockout = localStorage.getItem('loginLockout');
    const savedAttempts = localStorage.getItem('loginAttempts');
    
    if (savedLockout && Date.now() < parseInt(savedLockout)) {
      setLockoutUntil(parseInt(savedLockout));
      setLoginAttempts(parseInt(savedAttempts || '0'));
    } else {
      localStorage.removeItem('loginLockout');
      localStorage.removeItem('loginAttempts');
    }
  }, []);

  // Função para obter token reCAPTCHA
  const getRecaptchaToken = useCallback(async (action) => {
    if (process.env.NODE_ENV === 'development' || !siteKey || recaptchaError) {
      return 'dev-mode-token-' + Date.now();
    }

    if (!recaptchaReady) {
      throw new Error('reCAPTCHA não está pronto');
    }

    try {
      await window.grecaptcha.ready();
      const token = await window.grecaptcha.execute(siteKey, { action });
      return token;
    } catch (error) {
      console.error('Erro ao obter token reCAPTCHA:', error);
      throw error;
    }
  }, [recaptchaReady, recaptchaError, siteKey]);

  // Detecta comportamento automatizado
  const detectAutomation = () => {
    const redFlags = [
      navigator.webdriver === true,
      window.__nightmare,
      window._phantom,
      window.callPhantom,
      /PhantomJS|HeadlessChrome|Selenium|WebDriver/i.test(navigator.userAgent)
    ];
    
    return redFlags.some(flag => Boolean(flag));
  };

  // Adiciona atraso de segurança
  const addSecurityDelay = async (baseDelay = 1000) => {
    const isAutomated = detectAutomation();
    const additionalDelay = isAutomated ? 3000 : 0;
    const randomDelay = Math.random() * 2000;
    
    const totalDelay = baseDelay + additionalDelay + randomDelay;
    await new Promise(resolve => setTimeout(resolve, totalDelay));
    
    return isAutomated;
  };

  // Função para verificar e incrementar tentativas
  const handleFailedLoginAttempt = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem('loginAttempts', newAttempts.toString());
    
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_TIME;
      setLockoutUntil(lockoutTime);
      localStorage.setItem('loginLockout', lockoutTime.toString());
      
      setErrorMessage(`Muitas tentativas de login. Sua conta foi temporariamente bloqueada por ${LOCKOUT_TIME/60000} minutos.`);
      setShowSnackbar(true);
    }
  };

  // Função simplificada de verificação de segurança
  const performSecurityCheck = async (action) => {
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_TIME) {
      throw new Error('Aguarde alguns segundos antes de tentar novamente');
    }
    setLastSubmitTime(now);

    if (isLockedOut) {
      const timeLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
      throw new Error(`Conta bloqueada. Tente novamente em ${timeLeft} minutos.`);
    }

    try {
      const token = await getRecaptchaToken(action);
      
      if (token && token.startsWith('dev-mode-token-')) {
        return { success: true, score: 0.9 };
      }
      
      // Simular score baseado em comportamento
      const randomScore = Math.random() * 0.3 + 0.6; // Entre 0.6 e 0.9
      
      return { success: true, score: randomScore };
      
    } catch (error) {
      console.warn('Falha na verificação de segurança:', error);
      return { success: true, score: 0.3 };
    }
  };

  // Função de ação com verificação de segurança
  const performVerifiedAction = async (actionName, asyncCallback) => {
    const securityResult = await performSecurityCheck(actionName);
    
    if (securityResult.score < 0.3) {
      console.warn('Atividade suspeita detectada. Adicionando atraso de segurança.');
      await new Promise(resolve => setTimeout(resolve, 5000));
      setSecurityChecks(prev => ({
        ...prev,
        suspiciousActivity: true,
        lastAction: actionName
      }));
    }

    return asyncCallback();
  };

  const saveUserData = async (user) => {
    
    if (checkForSuspiciousPatterns(user)) {
      console.error('Dados suspeitos detectados');
      setErrorMessage('Dados inválidos detectados. Por favor, verifique as informações.');
      setShowSnackbar(true);
      return;
    }


    const userRef = ref(db, 'users/' + user.uid);
    const userData = {
      displayName: sanitizeInput(user.displayName || 'Usuário Anônimo'),
      uid: user.uid,
      email: sanitizeInput(user.email || 'anonimo@exemplo.com'),
      profilepic: sanitizeInput(user.photoURL || ''),
      provider: sanitizeInput(user.providerData[0]?.providerId || 'anonymous'),
      country: 'Unknown',
      ip: 'Unknown',
      loginDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      loginCount: 1
    };

    const sanitizedData = sanitizeDataBeforeSave(userData);

    try {
      await set(userRef, sanitizedData);

      const companyRef = ref(db, 'company/' + user.uid);
      const snapshot = await get(companyRef);
      if (!snapshot.exists()) {
        setShowAccountTypeDialog(true);
      } else {
        navigate(returnPath, { replace: true });
      }
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error.message);
      setErrorMessage('Erro ao processar login. Tente novamente.');
      setShowSnackbar(true);
    }
  };

  const handleAccountTypeSelect = async (type) => {
    setShowAccountTypeDialog(false);
    if (type === 'business') {
      navigate('/setup');
    } else {
      navigate('/setupUser');
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();

    if (isLockedOut) {
      const timeLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setErrorMessage(`Conta temporariamente bloqueada. Tente novamente em ${timeLeft} minutos.`);
      setShowSnackbar(true);
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_TIME) {
      setErrorMessage('Aguarde alguns segundos antes de tentar novamente');
      setShowSnackbar(true);
      return;
    }
    setLastSubmitTime(now);

    setIsEmailLoading(true);
    setEmailError(false);
    setPasswordError(false);
    
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedEmail) {
      setEmailError(true);
      setErrorMessage('Por favor, insira seu email');
      setShowSnackbar(true);
      setIsEmailLoading(false);
      return;
    }
    
    if (!validateEmail(sanitizedEmail)) {
      setEmailError(true);
      setErrorMessage('Por favor, insira um email válido');
      setShowSnackbar(true);
      setIsEmailLoading(false);
      return;
    }
    
    if (!validateInputLength(sanitizedEmail, 255)) {
      setEmailError(true);
      setErrorMessage('Email muito longo');
      setShowSnackbar(true);
      setIsEmailLoading(false);
      return;
    }
    
    if (!sanitizedPassword) {
      setPasswordError(true);
      setErrorMessage('Por favor, insira sua senha');
      setShowSnackbar(true);
      setIsEmailLoading(false);
      return;
    }

    if (!validateInputLength(sanitizedPassword, 100)) {
      setPasswordError(true);
      setErrorMessage('Senha muito longa');
      setShowSnackbar(true);
      setIsEmailLoading(false);
      return;
    }
    
    try {
      const isSuspicious = await addSecurityDelay(1000);
      
      if (isSuspicious) {
        console.warn('Comportamento automatizado detectado');
        setSecurityChecks(prev => ({ ...prev, suspiciousActivity: true }));
      }

      await performVerifiedAction(RECAPTCHA_ACTIONS.LOGIN, async () => {
        const result = await signInWithEmailAndPassword(auth, sanitizedEmail, sanitizedPassword);
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginLockout');
        await saveUserData(result.user);
      });

    } catch (error) {
      handleFailedLoginAttempt();
      const userFriendlyMessage = getFirebaseErrorMessage(error.code) || 'Ocorreu um erro. Tente novamente.';
      setErrorMessage(userFriendlyMessage);
      setShowSnackbar(true);
      if (error.code?.includes('email')) setEmailError(true);
      if (error.code?.includes('password')) setPasswordError(true);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setLoginAttempts(0);
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginLockout');
      await saveUserData(result.user);

    } catch (error) {
      console.error('Erro detalhado no login Google:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Login cancelado. O popup foi fechado.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMessage('Popup bloqueado. Por favor, permita popups para este site.');
      } else if (error.code === 'auth/internal-error') {
        setErrorMessage('Erro de configuração. Entre em contato com o suporte.');
      } else {
        handleFailedLoginAttempt();
        const userFriendlyMessage = getFirebaseErrorMessage(error.code) || 'Ocorreu um erro. Tente novamente.';
        setErrorMessage(userFriendlyMessage);
      }
      setShowSnackbar(true);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <>
      <style>{KEYFRAMES}</style>
      
      <Grid container component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        {/* Lado esquerdo - Formulário */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            bgcolor: 'background.default',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decorations (mesmas da hero) */}
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.05) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.03) 0%, transparent 50%)
            `,
          }} />
          
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.02,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }} />

          <Fade in={true} timeout={800}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              maxWidth: 400, 
              width: '100%', 
              p: 4,
              position: 'relative',
              zIndex: 2
            }}>
              <Box 
                component="img" 
                src={logo} 
                alt="Logo" 
                className="animate-float"
                sx={{ 
                  width: 144, 
                  mb: 4, 
                  transition: 'transform 0.3s', 
                  '&:hover': { transform: 'scale(1.05)' } 
                }} 
              />
              
              <Paper
                elevation={0}
                sx={{
                  width: '100%',
                  p: 4,
                  borderRadius: '24px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                }}
              >
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    color: 'text.primary',
                    fontFamily: '"Playfair Display", serif',
                    mb: 1
                  }}
                >
                  {t('auth.welcomeBack')}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3, fontSize: '0.9rem' }}>
                  {t('auth.signInDescription')}
                </Typography>

                <Box component="form" onSubmit={handleEmailSignIn} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label={t('auth.email')}
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                    error={emailError}
                    disabled={isLockedOut}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: emailError ? '#ef4444' : T.gold, fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
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
                    }}
                  />
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label={t('auth.password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={passwordError}
                    disabled={isLockedOut}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: passwordError ? '#ef4444' : T.gold, fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            onClick={togglePasswordVisibility} 
                            edge="end" 
                            disabled={isLockedOut}
                            sx={{ color: T.gold }}
                            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
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
                    }}
                  />
  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isEmailLoading || isGoogleLoading || isLockedOut}
                    startIcon={isEmailLoading ? <CircularProgress size={20} sx={{ color: T.white }} /> : <Email />}
                    className="login-btn"
                    sx={{
                      mt: 3,
                      mb: 2,
                      py: 1.8,
                      borderRadius: '14px',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      bgcolor: T.gold,
                      color: T.white,
                      '&:hover': { bgcolor: T.goldLight },
                      '&:disabled': {
                        bgcolor: T.borderMid,
                        opacity: isLockedOut ? 0.5 : 0.7
                      }
                    }}
                  >
                    {isLockedOut ? t('auth.accountLocked') : isEmailLoading ? t('auth.signingIn') : t('auth.signInWithEmail')}
                  </Button>

                  <Box sx={{ position: 'relative', my: 3 }}>
                    <Divider sx={{ borderColor: T.border }}>
                      <Chip 
                        label={t('auth.or')}
                        size="small"
                        sx={{ 
                          bgcolor: 'background.default',
                          color: 'text.secondary',
                          fontSize: '0.7rem'
                        }} 
                      />
                    </Divider>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isGoogleLoading || isEmailLoading || isLockedOut}
                    onClick={handleGoogleSignIn}
                    startIcon={isGoogleLoading ? <CircularProgress size={20} /> : <Google />}
                    className="google-btn"
                    sx={{
                      py: 1.8,
                      borderRadius: '14px',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      bgcolor: '#d32f2f',
                      color: T.white,
                      '&:hover': { bgcolor: '#b71c1c' },
                      '&:disabled': {
                        bgcolor: T.borderMid,
                        opacity: isLockedOut ? 0.5 : 0.7
                      }
                    }}
                  >
                    {isLockedOut ? t('auth.accountLocked') : isGoogleLoading ? t('auth.signingIn') : t('auth.continueGoogle')}
                  </Button>

                  <Grid container justifyContent="space-between" sx={{ mt: 3 }}>
                    <Grid item>
                      <Link 
                        href="/forget-password" 
                        variant="body2" 
                        sx={{ 
                          color: T.textSub, 
                          textDecoration: 'none',
                          '&:hover': { color: T.gold } 
                        }}
                      >
                        {t('auth.forgotPassword')}
                      </Link>
                    </Grid>
                    <Grid item>
                      <Typography variant="body2" sx={{ color: T.textSub }}>
                        {t('auth.noAccount')}{' '}
                        <Link 
                          href="/create" 
                          sx={{ 
                            fontWeight: 600,
                            color: T.gold,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {t('auth.register')}
                        </Link>
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: T.textSub }}>
                  Ao continuar, você concorda com nossos{' '}
                  <Link 
                    href="/termos" 
                    sx={{ 
                      fontWeight: 600,
                      color: T.gold,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Termos
                  </Link>{' '}
                  e{' '}
                  <Link 
                    href="/privacidade" 
                    sx={{ 
                      fontWeight: 600,
                      color: T.gold,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Políticas
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Fade>
        </Grid>
        
        {/* Lado direito - Imagem */}
        {!isMobile && (
          <Grid 
            item 
            md={6} 
            sx={{
              backgroundImage: `url(${marketing})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                background: `linear-gradient(135deg, ${T.navy}80 0%, ${T.navyLight}80 100%)`,
                backdropFilter: 'blur(2px)'
              },
              '&:after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                backgroundSize: '56px 56px',
                opacity: 0.1,
              }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                bottom: '10%',
                left: '10%',
                right: '10%',
                color: T.white,
                textAlign: 'center',
                zIndex: 2,
              }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  mb: 2,
                  textShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
              Connection Mozambique LDA
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 400,
                  opacity: 0.9,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Conectando empresas e oportunidades em Moçambique
              </Typography>
            </Box>
          </Grid>
        )}
        
        <Snackbar
          open={showSnackbar}
          autoHideDuration={6000}
          onClose={() => setShowSnackbar(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="error" 
            sx={{ 
              width: '100%', 
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              '& .MuiAlert-icon': { color: '#ef4444' }
            }} 
            onClose={() => setShowSnackbar(false)}
          >
            {errorMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={securityChecks.suspiciousActivity}
          autoHideDuration={4000}
          onClose={() => setSecurityChecks(prev => ({ ...prev, suspiciousActivity: false }))}
        >
          <Alert 
            severity="warning" 
            variant="filled"
            sx={{ 
              borderRadius: '12px',
              bgcolor: T.gold,
              color: T.white,
              '& .MuiAlert-icon': { color: T.white }
            }}
          >
            Verificação de segurança adicional ativada
          </Alert>
        </Snackbar>
      </Grid>

      {/* Dialog de seleção de tipo de conta */}
      <Dialog
        open={showAccountTypeDialog}
        onClose={() => setShowAccountTypeDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: '24px', 
            overflow: 'hidden',
            background: 'transparent',
            boxShadow: 'none'
          } 
        }}
      >
        <AccountTypeSelector onSelect={handleAccountTypeSelect} />
      </Dialog>
    </>
  );
};

export default AuthDesk;
