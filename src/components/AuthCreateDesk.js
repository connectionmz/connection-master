import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import { 
  Email, 
  Visibility, 
  VisibilityOff,
  Security as SecurityIcon
} from '@mui/icons-material';
import { 
  Snackbar, 
  Alert, 
  TextField, 
  Button, 
  Checkbox, 
  FormControlLabel, 
  Grid, 
  Box, 
  Typography,
  Link,
  Fade,
  CircularProgress,
  InputAdornment,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  AlertTitle,
  LinearProgress
} from '@mui/material';
import { 
  auth, 
  db 
} from '../fb';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signOut 
} from 'firebase/auth';
import { get, ref, set } from 'firebase/database';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';
import { getFunctions, httpsCallable } from 'firebase/functions';
import fbApp from '../fb';
import logo from '../img/bg.png';
import marketing from '../img/marketing.jpg';

// Constantes de segurança
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_TIME = 5000; // 5 segundos

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

const AuthCreateDesk = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState({
    email: false,
    password: false
  });
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [creationAttempts, setCreationAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [securityChecklist, setSecurityChecklist] = useState({
    emailValid: false,
    passwordStrong: false,
    termsAccepted: false,
    captchaVerified: false
  });

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const siteKey = process.env.REACT_APP_RECAPTCHA_V3_KEY_1;

  console.log('REACT_APP_RECAPTCHA_V3_KEY_1:', siteKey);

  // Carregar script do reCAPTCHA v3 com verificação melhorada
  useEffect(() => {
    if (siteKey && !document.getElementById('recaptcha-script')) {
      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      
      let loaded = false;
      
      script.onload = () => {
        loaded = true;
        console.log('reCAPTCHA script carregado com sucesso');
        
        // Inicializa o grecaptcha após carregamento
        if (window.grecaptcha) {
          try {
            window.grecaptcha.ready(() => {
              console.log('reCAPTCHA pronto para uso');
            });
          } catch (error) {
            console.warn('Erro ao chamar grecaptcha.ready:', error);
          }
        }
      };
      
      script.onerror = (error) => {
        console.error('Erro ao carregar script reCAPTCHA:', error);
        setErrorMessage('Erro de carregamento de segurança. Recarregue a página.');
      };
      
      document.body.appendChild(script);
      
      // Timeout para verificar se o script carregou
      const timeout = setTimeout(() => {
        if (!loaded && !window.grecaptcha) {
          console.warn('reCAPTCHA não carregou dentro do tempo esperado');
        }
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [siteKey]);

  // Verificar bloqueio
  useEffect(() => {
    const checkLockout = () => {
      if (lockoutUntil && Date.now() < lockoutUntil) {
        setIsLockedOut(true);
        
        const timeout = lockoutUntil - Date.now();
        setTimeout(() => {
          setIsLockedOut(false);
          setLockoutUntil(null);
          setCreationAttempts(0);
          localStorage.removeItem('creationAttempts');
          localStorage.removeItem('creationLockout');
        }, timeout);
      } else {
        setIsLockedOut(false);
      }
    };
    
    checkLockout();
  }, [lockoutUntil]);

  // Recuperar estado de bloqueio
  useEffect(() => {
    const savedLockout = localStorage.getItem('creationLockout');
    const savedAttempts = localStorage.getItem('creationAttempts');
    
    if (savedLockout && Date.now() < parseInt(savedLockout)) {
      setLockoutUntil(parseInt(savedLockout));
      setCreationAttempts(parseInt(savedAttempts || '0'));
    } else {
      localStorage.removeItem('creationLockout');
      localStorage.removeItem('creationAttempts');
    }
  }, []);

  // Atualizar checklist de segurança
  useEffect(() => {
    setSecurityChecklist({
      emailValid: validateEmail(formData.email),
      passwordStrong: validatePassword(formData.password),
      termsAccepted: termsAccepted,
      captchaVerified: false // Será definido durante a submissão
    });
  }, [formData, termsAccepted]);

  const handleFailedCreationAttempt = () => {
    const newAttempts = creationAttempts + 1;
    setCreationAttempts(newAttempts);
    localStorage.setItem('creationAttempts', newAttempts.toString());
    
    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_TIME;
      setLockoutUntil(lockoutTime);
      localStorage.setItem('creationLockout', lockoutTime.toString());
      
      setErrorMessage(`Muitas tentativas de criação de conta. Sua conta foi temporariamente bloqueada por ${LOCKOUT_TIME/60000} minutos.`);
    }
  };

  const saveUserData = useCallback(async (user) => {
    if (checkForSuspiciousPatterns(user)) {
      console.error('Dados suspeitos detectados');
      setErrorMessage('Dados inválidos detectados. Por favor, verifique as informações.');
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
      creationDate: new Date().toISOString(),
      emailVerified: user.emailVerified,
      loginCount: 0
    };

    const sanitizedData = sanitizeDataBeforeSave(userData);

    try {
      await set(userRef, sanitizedData);
      console.log('Dados do usuário salvos com sucesso');
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error.message);
      setErrorMessage('Erro ao processar criação de conta. Tente novamente.');
      throw error;
    }
  }, []);

  const performVerifiedAction = async (actionName, asyncCallback) => {
    if (isLockedOut) {
      const timeLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setErrorMessage(`Conta temporariamente bloqueada. Tente novamente em ${timeLeft} minutos.`);
      return;
    }

    // Fallback se o reCAPTCHA não estiver disponível
    if (!siteKey || typeof window.grecaptcha === 'undefined') {
      console.warn('reCAPTCHA não disponível. Procedendo sem verificação.');
      return asyncCallback();
    }

    try {
      // Usando Promise para evitar problemas de callback com ready()
      await new Promise((resolve, reject) => {
        try {
          if (typeof window.grecaptcha.ready === 'function') {
            window.grecaptcha.ready(() => {
              resolve();
            });
          } else {
            resolve(); // Resolve mesmo sem ready()
          }
        } catch (error) {
          console.warn('Erro no grecaptcha.ready, continuando:', error);
          resolve(); // Continua mesmo com erro
        }
      });

      // Tenta executar o reCAPTCHA se disponível
      if (typeof window.grecaptcha.execute === 'function') {
        const token = await window.grecaptcha.execute(siteKey, { action: actionName });
        
        if (token) {
          try {
            const functions = getFunctions(fbApp);
            const verifyRecaptcha = httpsCallable(functions, 'verifyRecaptcha');
            const { data } = await verifyRecaptcha({ 
              recaptchaToken: token, 
              expectedAction: actionName 
            });

            if (data.success && data.score >= 0.5) {
              setSecurityChecklist(prev => ({ ...prev, captchaVerified: true }));
            } else {
              console.warn('Verificação CAPTCHA com score baixo:', data.score);
            }
          } catch (firebaseError) {
            console.error('Erro na verificação Firebase:', firebaseError);
            // Continua mesmo com erro de verificação
          }
        }
      }

      return asyncCallback();
    } catch (error) {
      console.warn('Erro no CAPTCHA, procedendo sem verificação:', error);
      return asyncCallback();
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors = {
      email: false,
      password: false
    };
    
    let hasError = false;
    
    if (!formData.email) {
      newErrors.email = true;
      hasError = true;
      setErrorMessage('Por favor, insira seu email');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = true;
      hasError = true;
      setErrorMessage('Por favor, insira um email válido');
    } else if (!validateInputLength(formData.email, 255)) {
      newErrors.email = true;
      hasError = true;
      setErrorMessage('Email muito longo');
    }
    
    if (!formData.password) {
      newErrors.password = true;
      hasError = true;
      setErrorMessage('Por favor, insira sua senha');
    } else if (!validateInputLength(formData.password, 100)) {
      newErrors.password = true;
      hasError = true;
      setErrorMessage('Senha muito longa');
    } else if (!validatePassword(formData.password)) {
      newErrors.password = true;
      hasError = true;
      setErrorMessage('Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial (@$!%*?&)');
    }
    
    if (!termsAccepted) {
      hasError = true;
      setErrorMessage('Você deve aceitar os Termos de Uso e a Política de Privacidade.');
    }
    
    setErrors(newErrors);
    return !hasError;
  };

  const handleEmailSignIn = useCallback(async (e) => {
    e.preventDefault();
    
    if (isLockedOut) {
      const timeLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setErrorMessage(`Conta temporariamente bloqueada. Tente novamente em ${timeLeft} minutos.`);
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_TIME) {
      setErrorMessage('Aguarde alguns segundos antes de tentar novamente');
      return;
    }
    setLastSubmitTime(now);
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setShowSecurityDialog(true);

    try {
      await performVerifiedAction('signup', async () => {
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await sendEmailVerification(result.user);
        await saveUserData(result.user);
        
        setCreationAttempts(0);
        localStorage.removeItem('creationAttempts');
        localStorage.removeItem('creationLockout');
        
        setSuccessMessage('Conta criada com sucesso! Verifique seu email para ativar a conta.');
        setFormData({ email: '', password: '' });
        setTermsAccepted(false);
        
        // Logout imediato para forçar login após verificação de email
        await signOut(auth);
        
        setShowSecurityDialog(false);
        alert("Sua conta foi criada com sucesso. Verifique seu email e faça login com suas credenciais para continuar.");
        navigate('/auth');
      });
    } catch (error) {
      handleFailedCreationAttempt();
      const userFriendlyMessage = getFirebaseErrorMessage(error.code) || 'Ocorreu um erro. Tente novamente.';
      setErrorMessage(userFriendlyMessage);
      
      const errorFields = { email: false, password: false };
      if (error.code?.includes('email')) errorFields.email = true;
      if (error.code?.includes('password')) errorFields.password = true;
      setErrors(errorFields);
      
      setShowSecurityDialog(false);
    } finally {
      setIsLoading(false);
    }
  }, [formData, termsAccepted, saveUserData, navigate, isLockedOut, lastSubmitTime, lockoutUntil]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const SecurityCheckDialog = () => (
    <Dialog open={showSecurityDialog} maxWidth="sm" fullWidth>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" p={2}>
          <SecurityIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Verificação de Segurança
          </Typography>
          <Typography variant="body2" color="textSecondary" textAlign="center" mb={3}>
            Estamos realizando verificações de segurança para proteger sua conta.
          </Typography>
          
          <Box width="100%" mb={2}>
            <LinearProgress />
          </Box>
          
          <Box width="100%">
            <Typography variant="body2" gutterBottom>
              Verificações em andamento:
            </Typography>
            <Box component="ul" pl={2} mt={1}>
              <Box component="li" color={securityChecklist.emailValid ? 'success.main' : 'text.secondary'}>
                <Typography variant="body2">
                  Email válido: {securityChecklist.emailValid ? '✓' : '...'}
                </Typography>
              </Box>
              <Box component="li" color={securityChecklist.passwordStrong ? 'success.main' : 'text.secondary'}>
                <Typography variant="body2">
                  Senha forte: {securityChecklist.passwordStrong ? '✓' : '...'}
                </Typography>
              </Box>
              <Box component="li" color={securityChecklist.termsAccepted ? 'success.main' : 'text.secondary'}>
                <Typography variant="body2">
                  Termos aceitos: {securityChecklist.termsAccepted ? '✓' : '...'}
                </Typography>
              </Box>
              <Box component="li" color={securityChecklist.captchaVerified ? 'success.main' : 'text.secondary'}>
                <Typography variant="body2">
                  Verificação de segurança: {securityChecklist.captchaVerified ? '✓' : '...'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );

  const PasswordStrengthIndicator = () => {
    if (!formData.password) return null;
    
    const hasMinLength = formData.password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    const hasSpecialChar = /[@$!%*?&]/.test(formData.password);
    
    const strength = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar]
      .filter(Boolean).length;
    
    return (
      <Box mt={1} mb={2}>
        <Typography variant="caption" display="block" gutterBottom>
          Força da senha:
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={strength * 20} 
          color={
            strength <= 2 ? 'error' : 
            strength <= 3 ? 'warning' : 'success'
          }
          sx={{ height: 8, borderRadius: 4, mb: 1 }}
        />
        <Box component="ul" pl={2}>
          <Box component="li" color={hasMinLength ? 'success.main' : 'error.main'}>
            <Typography variant="caption">Mínimo 8 caracteres</Typography>
          </Box>
          <Box component="li" color={hasUpperCase ? 'success.main' : 'error.main'}>
            <Typography variant="caption">Pelo menos uma letra maiúscula</Typography>
          </Box>
          <Box component="li" color={hasLowerCase ? 'success.main' : 'error.main'}>
            <Typography variant="caption">Pelo menos uma letra minúscula</Typography>
          </Box>
          <Box component="li" color={hasNumber ? 'success.main' : 'error.main'}>
            <Typography variant="caption">Pelo menos um número</Typography>
          </Box>
          <Box component="li" color={hasSpecialChar ? 'success.main' : 'error.main'}>
            <Typography variant="caption">Pelo menos um caractere especial (@$!%*?&)</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <Grid 
        item 
        xs={12} 
        md={6} 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: 'background.paper',
          overflow: 'auto'
        }}
      >
        <Fade in={true} timeout={500}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: 450,
              width: '100%',
              p: 4
            }}
          >
            <Box 
              component="img" 
              src={logo} 
              alt="Logo" 
              sx={{ 
                width: 128, 
                mb: 2,
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }} 
            />
            
            <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Criar nova conta
            </Typography>

            {isLockedOut && (
              <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
                <AlertTitle>Conta Temporariamente Bloqueada</AlertTitle>
                Muitas tentativas de criação. Tente novamente em {Math.ceil((lockoutUntil - Date.now()) / 60000)} minutos.
              </Alert>
            )}
            
            <Box 
              component="form" 
              onSubmit={handleEmailSignIn} 
              sx={{ 
                width: '100%',
                mt: 1 
              }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                disabled={isLockedOut}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
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
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                disabled={isLockedOut}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                        disabled={isLockedOut}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
              />

              <PasswordStrengthIndicator />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={() => setTermsAccepted(!termsAccepted)}
                    name="terms"
                    color="primary"
                    disabled={isLockedOut}
                    sx={{
                      '&.Mui-checked': {
                        color: 'primary.main',
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="body2">
                    Eu concordo com os{' '}
                    <Link href="/termos" sx={{ fontWeight: 600 }}>
                      Termos de Uso
                    </Link>{' '}
                    e{' '}
                    <Link href="/politica" sx={{ fontWeight: 600 }}>
                      Política de Privacidade
                    </Link>
                  </Typography>
                }
                sx={{ mb: 2 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || isLockedOut}
                startIcon={isLoading ? <CircularProgress size={20} /> : <Email />}
                sx={{
                  mt: 1,
                  mb: 3,
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
                    backgroundColor: 'action.disabledBackground',
                    color: 'action.disabled'
                  }
                }}
              >
                {isLockedOut ? 'Conta Bloqueada' : isLoading ? 'Criando conta...' : 'Criar conta'}
              </Button>
              
              <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
                Já tem uma conta?{' '}
                <Link 
                  href="/auth" 
                  sx={{
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'none'
                    }
                  }}
                >
                  Entrar agora
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
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%',
            boxShadow: 3
          }}
          onClose={() => setErrorMessage('')}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert 
          severity="success" 
          sx={{ 
            width: '100%',
            boxShadow: 3
          }}
          onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      </Snackbar>
      <SecurityCheckDialog />
    </Grid>
  );
};

export default AuthCreateDesk;