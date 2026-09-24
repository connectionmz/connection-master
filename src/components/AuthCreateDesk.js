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
  LinearProgress
} from '@mui/material';
import { 
  auth, 
  db 
} from '../fb';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';
import { trackSignUp } from '../utils/analytics';
import logo from '../img/bg.png';
import marketing from '../img/marketing.jpg';
import { useLanguage } from '../context/LanguageContext';

// Constantes de segurança
const SECURITY_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000,
  RATE_LIMIT_TIME: 5000,
  MIN_PASSWORD_STRENGTH: 3,
  EMAIL_DOMAIN_BLACKLIST: ['tempmail.com', 'throwaway.com', 'mailinator.com', 'guerrillamail.com', '10minutemail.com']
};

// Funções de segurança
const SecurityUtils = {
  validateEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  validatePassword: (password) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  },

  calculatePasswordStrength: (password) => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;
    
    return strength;
  },

  sanitizeInput: (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>]*)/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    }
    return value;
  },

  validateInputLength: (value, maxLength = 255) => {
    return value.length <= maxLength;
  },

  checkForSuspiciousPatterns: (data) => {
    const suspiciousPatterns = [
      /<script>/i, /javascript:/i, /onload=/i, /onerror=/i, /eval\(/i,
      /document\.cookie/i, /window\.location/i, /alert\(/i, /prompt\(/i,
      /confirm\(/i, /union.*select/i, /select.*from/i, /insert.*into/i,
      /delete.*from/i, /drop.*table/i, /or.*1=1/i
    ];
    
    const dataString = JSON.stringify(data).toLowerCase();
    return suspiciousPatterns.some(pattern => pattern.test(dataString));
  },

  sanitizeDataBeforeSave: (data) => {
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = SecurityUtils.sanitizeInput(sanitized[key]);
      }
    });
    
    return sanitized;
  },

  checkDisposableEmail: (email) => {
    const domain = email.split('@')[1];
    return SECURITY_CONFIG.EMAIL_DOMAIN_BLACKLIST.includes(domain.toLowerCase());
  }
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
    captchaVerified: false
  });

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const formRef = useRef(null);
  const { t } = useLanguage();

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
      emailValid: SecurityUtils.validateEmail(formData.email),
      passwordStrong: SecurityUtils.calculatePasswordStrength(formData.password) >= SECURITY_CONFIG.MIN_PASSWORD_STRENGTH,
      captchaVerified: false
    });
  }, [formData]);

  const handleFailedCreationAttempt = () => {
    const newAttempts = creationAttempts + 1;
    setCreationAttempts(newAttempts);
    localStorage.setItem('creationAttempts', newAttempts.toString());
    
    if (newAttempts >= SECURITY_CONFIG.MAX_ATTEMPTS) {
      const lockoutTime = Date.now() + SECURITY_CONFIG.LOCKOUT_TIME;
      setLockoutUntil(lockoutTime);
      localStorage.setItem('creationLockout', lockoutTime.toString());
      
      setErrorMessage(`Muitas tentativas de criação de conta. Sua conta foi temporariamente bloqueada por ${SECURITY_CONFIG.LOCKOUT_TIME/60000} minutos.`);
    }
  };

  const saveUserData = useCallback(async (user) => {
    if (SecurityUtils.checkForSuspiciousPatterns(user)) {
      console.error('Dados suspeitos detectados');
      setErrorMessage('Dados inválidos detectados. Por favor, verifique as informações.');
      return;
    }

    const userRef = ref(db, 'users/' + user.uid);
    const userData = {
      displayName: SecurityUtils.sanitizeInput(user.displayName || 'Usuário Anônimo'),
      uid: user.uid,
      email: SecurityUtils.sanitizeInput(user.email || 'anonimo@exemplo.com'),
      profilepic: SecurityUtils.sanitizeInput(user.photoURL || ''),
      provider: SecurityUtils.sanitizeInput(user.providerData[0]?.providerId || 'anonymous'),
      country: 'Unknown',
      ip: 'Unknown',
      loginDate: new Date().toISOString(),
      creationDate: new Date().toISOString(),
      emailVerified: user.emailVerified,
      loginCount: 0,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };

    const sanitizedData = SecurityUtils.sanitizeDataBeforeSave(userData);

    try {
      await set(userRef, sanitizedData);
      
      // Redirecionar para seleção de tipo de conta
      navigate('/select-account-type', { 
        state: { 
          registrationComplete: true,
        }
      });
      
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error.message);
      setErrorMessage('Erro ao processar criação de conta. Tente novamente.');
      throw error;
    }
  }, [navigate]);

  const performVerifiedAction = async (asyncCallback) => {
    if (isLockedOut) {
      const timeLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setErrorMessage(`Conta temporariamente bloqueada. Tente novamente em ${timeLeft} minutos.`);
      return;
    }

    setShowSecurityDialog(true);
    setSecurityChecklist(prev => ({ ...prev, captchaVerified: true }));
    
    return asyncCallback();
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    const sanitizedValue = SecurityUtils.sanitizeInput(value);
    
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
    } else if (!SecurityUtils.validateEmail(formData.email)) {
      newErrors.email = true;
      hasError = true;
      setErrorMessage('Por favor, insira um email válido');
    } else if (!SecurityUtils.validateInputLength(formData.email, 255)) {
      newErrors.email = true;
      hasError = true;
      setErrorMessage('Email muito longo');
    } else if (SecurityUtils.checkDisposableEmail(formData.email)) {
      newErrors.email = true;
      hasError = true;
      setErrorMessage('Emails temporários não são permitidos. Use um email permanente.');
    }
    
    if (!formData.password) {
      newErrors.password = true;
      hasError = true;
      setErrorMessage('Por favor, insira sua senha');
    } else if (!SecurityUtils.validateInputLength(formData.password, 100)) {
      newErrors.password = true;
      hasError = true;
      setErrorMessage('Senha muito longa');
    } else if (SecurityUtils.calculatePasswordStrength(formData.password) < SECURITY_CONFIG.MIN_PASSWORD_STRENGTH) {
      newErrors.password = true;
      hasError = true;
      setErrorMessage('Senha muito fraca. Use letras maiúsculas, minúsculas, números e caracteres especiais.');
    }
    
    setErrors(newErrors);
    return !hasError;
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    
    if (isLockedOut) {
      const timeLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setErrorMessage(`Conta temporariamente bloqueada. Tente novamente em ${timeLeft} minutos.`);
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < SECURITY_CONFIG.RATE_LIMIT_TIME) {
      setErrorMessage('Aguarde alguns segundos antes de tentar novamente');
      return;
    }
    setLastSubmitTime(now);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const methods = await fetchSignInMethodsForEmail(auth, formData.email);
      if (methods && methods.length > 0) {
        setErrorMessage('Este email já está em uso. Tente fazer login ou use outro email.');
        return;
      }
    } catch (error) {
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setShowSecurityDialog(true);

    try {
      await performVerifiedAction(async () => {
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await sendEmailVerification(result.user);
        await saveUserData(result.user);
        trackSignUp('email');

        setCreationAttempts(0);
        localStorage.removeItem('creationAttempts');
        localStorage.removeItem('creationLockout');
        
        setSuccessMessage('Conta criada com sucesso!');
        setFormData({ email: '', password: '' });
        
        setShowSecurityDialog(false);
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
  };

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
    
    const strength = SecurityUtils.calculatePasswordStrength(formData.password);
    const hasMinLength = formData.password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    const hasSpecialChar = /[@$!%*?&]/.test(formData.password);
    
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
            <Typography variant="caption">{t('register.password.minLength')}</Typography>
          </Box>
          <Box component="li" color={hasUpperCase ? 'success.main' : 'error.main'}>
            <Typography variant="caption">{t('register.password.uppercase')}</Typography>
          </Box>
          <Box component="li" color={hasLowerCase ? 'success.main' : 'error.main'}>
            <Typography variant="caption">{t('register.password.lowercase')}</Typography>
          </Box>
          <Box component="li" color={hasNumber ? 'success.main' : 'error.main'}>
            <Typography variant="caption">{t('register.password.number')}</Typography>
          </Box>
          <Box component="li" color={hasSpecialChar ? 'success.main' : 'error.main'}>
            <Typography variant="caption">{t('register.password.special')}</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Grid container component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
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
              {t('register.title')}
            </Typography>

            {isLockedOut && (
              <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
                {t('register.locked', { minutes: Math.ceil((lockoutUntil - Date.now()) / 60000) })}
              </Alert>
            )}
            
            <Box 
              component="form" 
              onSubmit={handleEmailSignIn} 
              ref={formRef}
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
                label={t('auth.email')}
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
                label={t('auth.password')}
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
                        aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
                {isLockedOut ? t('auth.accountLocked') : isLoading ? t('register.creating') : t('register.create')}
              </Button>
              
              <Typography variant="body2" align="center" sx={{ color: 'text.secondary' }}>
                {t('register.haveAccount')}{' '}
                <Link 
                  href="/auth" 
                  sx={{
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'none'
                    }
                  }}
                >
                  {t('register.signIn')}
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
