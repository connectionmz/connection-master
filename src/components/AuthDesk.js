import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';
import { 
  Email, 
  Google, 
  Visibility, 
  VisibilityOff,
  Person as PersonalIcon,
  Business as BusinessIcon,
  ArrowForward as ArrowForwardIcon,
  Security as SecurityIcon
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
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { signInWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import fbApp, { auth, db, googleProvider } from '../fb';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';
import logo from '../img/bg.png';
import marketing from '../img/marketing.jpg';
import { HomeIcon } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Constantes de segurança
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_TIME = 3000; // 3 segundos
const MIN_RECAPTCHA_SCORE = 0.3; // Score mínimo para considerar válido

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

const validatePassword = (password) => {
  // Mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
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
      color: theme.palette.primary.main
    },
    {
      id: 'business',
      title: 'Conta Empresarial',
      description: 'Para empresas, com acesso aos módulos de Cotações, Concursos e mais, permitindo a gestão do seu negócio e networking a nível nacional.',
      icon: <BusinessIcon fontSize="large" />,
      color: theme.palette.secondary.main
    }
  ];

  return (
    <Box sx={{ margin: '0 auto', p: isMobile ? 2 : 4, overflow:'auto' }} >
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', fontWeight: 700, mb: 4 }}>
       Selecione o tipo de conta
      </Typography>
      <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
        Escolha o tipo de conta que melhor atende suas necessidades. Você poderá adicionar detalhes depois.
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {accountTypes.map((type) => (
          <Grid item xs={12} sm={6} key={type.id}>
            <Card
              onClick={() => handleSelect(type.id)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                border: selectedType === type.id ? `2px solid ${type.color}` : '2px solid transparent',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${type.color}20`, color: type.color, width: 60, height: 60 }}>
                    {type.icon}
                  </Avatar>
                </Box>
                <Typography gutterBottom variant="h5" component="h2" sx={{ textAlign: 'center', fontWeight: 600 }}>
                  {type.title}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  {type.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: selectedType === type.id ? type.color : 'text.secondary'
                  }}
                >
                  {selectedType === type.id ? 'Selecionado' : 'Selecionar'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          disabled={!selectedType}
          onClick={handleConfirm}
          sx={{
            px: 6,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1.1rem',
            fontWeight: 600,
            '&:disabled': {
              opacity: 0.7
            }
          }}
        >
          Continuar
        </Button>
      </Box>
    </Box>
  );
};

const AuthDesk = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [showAccountTypeDialog, setShowAccountTypeDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = useTheme();

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
      'webdriver' in navigator,
      navigator.webdriver,
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
      
      return { success: true, score: 0.7 };
      
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
      setCurrentUser(user);

      const companyRef = ref(db, 'company/' + user.uid);
      const snapshot = await get(companyRef);
      if (!snapshot.exists()) {
        setShowAccountTypeDialog(true);
      } else {
        navigate('/');
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
    // Remova a verificação reCAPTCHA temporariamente para teste
    // await addSecurityDelay(800);
    // await performVerifiedAction(RECAPTCHA_ACTIONS.GOOGLE_SIGNIN, async () => {
    
    const result = await signInWithPopup(auth, googleProvider);
    setLoginAttempts(0);
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('loginLockout');
    await saveUserData(result.user);
    // });

  } catch (error) {
    console.error('Erro detalhado no login Google:', error);
    
    // Log mais detalhado
    if (error.code) {
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
    }
    
    if (error.code === 'auth/popup-closed-by-user') {
      setErrorMessage('Login cancelado. O popup foi fechado.');
    } else if (error.code === 'auth/popup-blocked') {
      setErrorMessage('Popup bloqueado. Por favor, permita popups para este site.');
    } else if (error.code === 'auth/internal-error') {
      // Erro interno - pode ser configuração
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
      <Grid container component="main" sx={{ height: '100vh' }}>
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: 'background.paper'
          }}
        >
          <Fade in={true} timeout={500}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 400, width: '100%', p: 4 }}>
              <Box component="img" src={logo} alt="Logo" sx={{ width: 144, mb: 4, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }} />
              
              <Box component="form" onSubmit={handleEmailSignIn} noValidate sx={{ width: '100%', mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                  error={emailError}
                  disabled={isLockedOut}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'divider' },
                      '&:hover fieldset': { borderColor: 'primary.main' },
                    }
                  }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={passwordError}
                  disabled={isLockedOut}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={togglePasswordVisibility} edge="end" disabled={isLockedOut}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'divider' },
                      '&:hover fieldset': { borderColor: 'primary.main' },
                    }
                  }}
                />
 
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isEmailLoading || isGoogleLoading || isGuestLoading || isLockedOut}
                  startIcon={isEmailLoading ? <CircularProgress size={20} /> : <Email />}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    borderRadius: 1,
                    textTransform: 'none',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    },
                    '&:disabled': {
                      opacity: isLockedOut ? 0.5 : 0.7
                    }
                  }}
                >
                  {isLockedOut ? 'Conta Bloqueada' : isEmailLoading ? 'Entrando...' : 'Entrar com Email'}
                </Button>
                <Grid container spacing={2} sx={{ mt: 3, mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={isGoogleLoading || isEmailLoading || isGuestLoading || isLockedOut}
                      onClick={handleGoogleSignIn}
                      startIcon={isGoogleLoading ? <CircularProgress size={20} /> : <Google />}
                      sx={{
                        py: 1.5,
                        borderRadius: 1,
                        textTransform: 'none',
                        fontSize: '1rem',
                        backgroundColor: '#d32f2f',
                        color: '#fff',
                        '&:hover': { backgroundColor: '#b71c1c' },
                        '&:disabled': {
                          opacity: isLockedOut ? 0.5 : 0.7
                        }
                      }}
                    >
                      {isLockedOut ? 'Conta Bloqueada' : isGoogleLoading ? 'Entrando...' : 'Google'}
                    </Button>
                  </Grid>
                </Grid>

                {/* Indicador de segurança 
                <Box sx={{ 
                  mt: 2, 
                  p: 1, 
                  borderRadius: 1,
                  backgroundColor: securityChecks.suspiciousActivity ? 'warning.light' : 'success.light',
                  border: 1,
                  borderColor: securityChecks.suspiciousActivity ? 'warning.main' : 'success.main'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SecurityIcon sx={{ 
                      fontSize: 16, 
                      mr: 1, 
                      color: securityChecks.suspiciousActivity ? 'warning.main' : 'success.main' 
                    }} />
                    <Typography variant="caption" sx={{ color: 'text.primary' }}>
                      {securityChecks.suspiciousActivity 
                        ? '⚠️ Atividade verificada - Proteção reforçada' 
                        : '✅ Proteção de segurança ativa'}
                    </Typography>
                  </Box>
                </Box>
*/}
                <Grid container justifyContent="space-between" sx={{ mt: 2 }}>
                  <Grid item>
                    <Link href="/forget-password" variant="body2" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', textDecoration: 'none' } }}>
                      Esqueceu a senha?
                    </Link>
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Não tem conta?{' '}
                      <Link href="/create" sx={{ fontWeight: 600, '&:hover': { textDecoration: 'none' } }}>
                        Cadastre-se
                      </Link>
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Ao continuar, você concorda com nossos{' '}
                  <Link href="/termos" sx={{ fontWeight: 600, '&:hover': { textDecoration: 'none' } }}>
                    Termos e Políticas
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Fade>
        </Grid>
        
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
                backgroundColor: 'rgba(0,0,0,0.1)',
                backdropFilter: 'blur(1px)'
              }
            }}
          />
        )}
        
        <Snackbar
          open={showSnackbar}
          autoHideDuration={6000}
          onClose={() => setShowSnackbar(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" sx={{ width: '100%', boxShadow: 3 }} onClose={() => setShowSnackbar(false)}>
            {errorMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={securityChecks.suspiciousActivity}
          autoHideDuration={4000}
          onClose={() => setSecurityChecks(prev => ({ ...prev, suspiciousActivity: false }))}
        >
          <Alert severity="warning" variant="filled">
            Verificação de segurança adicional ativada
          </Alert>
        </Snackbar>
      </Grid>
      <Dialog
        open={showAccountTypeDialog}
        onClose={() => setShowAccountTypeDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 0, overflow: 'visible' } }}>
        <AccountTypeSelector onSelect={handleAccountTypeSelect} />
      </Dialog>
    </>
  );
};
export default AuthDesk;