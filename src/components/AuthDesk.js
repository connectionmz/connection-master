import React, { useState, useEffect } from 'react';
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
  const [securityStep, setSecurityStep] = useState(0); // 0: login, 1: verificação adicional
  
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

  // Carregar script do reCAPTCHA v3
  useEffect(() => {
    if (siteKey && !document.getElementById('recaptcha-script')) {
      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [siteKey]);

  // Verificar se está em período de bloqueio
  useEffect(() => {
    const checkLockout = () => {
      if (lockoutUntil && Date.now() < lockoutUntil) {
        setIsLockedOut(true);
        
        // Timer para liberar automaticamente
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
      // Limpar dados antigos
      localStorage.removeItem('loginLockout');
      localStorage.removeItem('loginAttempts');
    }
  }, []);

  // Adicione este useEffect para debug
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const functions = getFunctions(fbApp);
        
        // Verifique se o reCAPTCHA está carregado
        if (typeof window.grecaptcha !== 'undefined') {
        } else {
          console.warn('reCAPTCHA não está carregado');
        }
      } catch (error) {
        console.error('Erro ao verificar configuração:', error);
      }
    };

    checkAuthState();
  }, []);

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
      loginCount: 1 // Será incrementado em login subsequentes
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

const performVerifiedAction = async (actionName, asyncCallback, isGoogle = false) => {
  if (isLockedOut) {
    const timeLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
    setErrorMessage(`Conta temporariamente bloqueada. Tente novamente em ${timeLeft} minutos.`);
    setShowSnackbar(true);
    throw new Error('Account locked');
  }

  // Em desenvolvimento, pule a verificação reCAPTCHA
  if (process.env.NODE_ENV === 'development') {
    return asyncCallback();
  }

  if (!siteKey) {
    console.warn('reCAPTCHA não configurado. Procedendo sem verificação.');
    return asyncCallback();
  }

  if (typeof window.grecaptcha === 'undefined') {
    console.error('reCAPTCHA não carregado');
    setErrorMessage('Sistema de segurança não carregado. Recarregue a página.');
    setShowSnackbar(true);
    throw new Error('reCAPTCHA not loaded');
  }

  try {
    await window.grecaptcha.ready();
    const token = await window.grecaptcha.execute(siteKey, { 
      action: actionName 
    });

    if (!token) {
      console.warn('Não foi possível gerar token reCAPTCHA, continuando...');
      return asyncCallback();
    }

    const functions = getFunctions(fbApp);
    const verifyRecaptcha = httpsCallable(functions, 'verifyRecaptcha');
    
    const { data } = await verifyRecaptcha({ 
      recaptchaToken: token, 
      expectedAction: actionName 
    });

    if (!data.success) {
      console.warn('Verificação CAPTCHA falhou, mas continuando...', data);
    }

    // IMPORTANTE: Retornar o resultado da callback
    return asyncCallback();
    
  } catch (error) {
    console.error('Erro no CAPTCHA, mas continuando:', error);
    return asyncCallback();
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

    // Removida a validação de força da senha no login (mantenha apenas para cadastro)
    
    try {
      await performVerifiedAction('email_login', async () => {
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
      // Tente primeiro sem App Check (modo direto)
      
      // Em desenvolvimento, use signInWithPopup diretamente
      if (process.env.NODE_ENV === 'development') {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          setLoginAttempts(0);
          localStorage.removeItem('loginAttempts');
          localStorage.removeItem('loginLockout');
          await saveUserData(result.user);
          setIsGoogleLoading(false);
          return;
        } catch (error) {
          console.error('Erro no login Google (dev):', error);
          
          // Se falhar, tente com redirecionamento como fallback
          if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
            setErrorMessage('Popup bloqueado. Por favor, permita popups para este site e tente novamente.');
            setShowSnackbar(true);
          } else {
            handleFailedLoginAttempt();
            const userFriendlyMessage = getFirebaseErrorMessage(error.code) || 'Ocorreu um erro. Tente novamente.';
            setErrorMessage(userFriendlyMessage);
            setShowSnackbar(true);
          }
          setIsGoogleLoading(false);
          return;
        }
      }

      // Em produção, tente com verificação
      const result = await performVerifiedAction('google_login', async () => {
        return await signInWithPopup(auth, googleProvider);
      }, true);
      
      setLoginAttempts(0);
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginLockout');
      await saveUserData(result.user);
      
    } catch (error) {
      console.error('Erro no login Google:', error);
      
      // Tratamento específico para erros de popup
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Login cancelado. O popup foi fechado.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMessage('Popup bloqueado. Por favor, permita popups para este site.');
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
                  <Grid item xs={12} sm={6}>
                    <Button
                      type="button"
                      fullWidth
                      variant="outlined"
                      size="large"
                      disabled={isGuestLoading || isEmailLoading || isGoogleLoading || isLockedOut}
                      onClick={() => navigate('/')}
                      startIcon={isGuestLoading ? <CircularProgress size={20} /> : <HomeIcon />}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        letterSpacing: '0.5px',
                        transition: 'all 0.3s ease-in-out',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:active': {
                          transform: 'translateY(0)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        },
                        '&.Mui-disabled': {
                          opacity: isLockedOut ? 0.5 : 0.7,
                          transform: 'none'
                        }
                      }}
                    >
                      {isLockedOut ? 'Conta Bloqueada' : isGuestLoading ? 'Redirecionando...' : 'Visitante'}
                    </Button>
                  </Grid>
                </Grid>

                <Grid container justifyContent="space-between">
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