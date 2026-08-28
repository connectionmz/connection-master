import React, { useState, useCallback, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Fade,
  InputAdornment,
  Snackbar,
  Grid,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Email,
  ArrowBack,
  Security as SecurityIcon
} from '@mui/icons-material';
import { auth } from '../../fb';
import { useNavigate } from 'react-router-dom';
import logo from '../../img/bg.png';
import marketing from '../../img/marketing.jpg';
import { useLanguage } from '../../context/LanguageContext';

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; 
const RATE_LIMIT_TIME = 3000; 

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

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [resetAttempts, setResetAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [isLockedOut, setIsLockedOut] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useLanguage();

  // Verificar se está em período de bloqueio
  useEffect(() => {
    const checkLockout = () => {
      if (lockoutUntil && Date.now() < lockoutUntil) {
        setIsLockedOut(true);
        
        const timeout = lockoutUntil - Date.now();
        setTimeout(() => {
          setIsLockedOut(false);
          setLockoutUntil(null);
          setResetAttempts(0);
          localStorage.removeItem('resetAttempts');
          localStorage.removeItem('resetLockout');
        }, timeout);
      } else {
        setIsLockedOut(false);
      }
    };
    
    checkLockout();
  }, [lockoutUntil]);

  // Recuperar estado de bloqueio
  useEffect(() => {
    const savedLockout = localStorage.getItem('resetLockout');
    const savedAttempts = localStorage.getItem('resetAttempts');
    
    if (savedLockout && Date.now() < parseInt(savedLockout)) {
      setLockoutUntil(parseInt(savedLockout));
      setResetAttempts(parseInt(savedAttempts || '0'));
    } else {
      localStorage.removeItem('resetLockout');
      localStorage.removeItem('resetAttempts');
    }
  }, []);

  const handleFailedResetAttempt = useCallback(() => {
    const newAttempts = resetAttempts + 1;
    setResetAttempts(newAttempts);
    localStorage.setItem('resetAttempts', newAttempts.toString());
    
    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_TIME;
      setLockoutUntil(lockoutTime);
      localStorage.setItem('resetLockout', lockoutTime.toString());
      
      setErrorMessage(t('password.error.locked', { minutes: LOCKOUT_TIME / 60000 }));
      setShowSnackbar(true);
    }
  }, [resetAttempts, t]);

  const handleResetPassword = useCallback(async (e) => {
    e.preventDefault();
    
    if (isLockedOut) {
      const timeLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
      setErrorMessage(t('password.error.locked', { minutes: timeLeft }));
      setShowSnackbar(true);
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_TIME) {
      setErrorMessage(t('password.error.rateLimit'));
      setShowSnackbar(true);
      return;
    }
    setLastSubmitTime(now);

    const sanitizedEmail = sanitizeInput(email);
    
    if (!sanitizedEmail) {
      setErrorMessage(t('password.error.requiredEmail'));
      setShowSnackbar(true);
      return;
    }
    
    if (!validateEmail(sanitizedEmail)) {
      setErrorMessage(t('password.error.invalidEmail'));
      setShowSnackbar(true);
      return;
    }
    
    if (!validateInputLength(sanitizedEmail, 255)) {
      setErrorMessage(t('password.error.longEmail'));
      setShowSnackbar(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Adicionar atraso de segurança para prevenir ataques de força bruta
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      await sendPasswordResetEmail(auth, sanitizedEmail);
      
      setResetAttempts(0);
      localStorage.removeItem('resetAttempts');
      localStorage.removeItem('resetLockout');
      
      setSuccessMessage(t('password.resetSent'));
      setEmail('');
      
    } catch (error) {
      handleFailedResetAttempt();
      
      let userFriendlyMessage = t('password.error.resetGeneric');
      switch (error.code) {
        case 'auth/user-not-found':
          userFriendlyMessage = t('password.error.notFound');
          break;
        case 'auth/invalid-email':
          userFriendlyMessage = t('password.error.invalidEmail');
          break;
        case 'auth/too-many-requests':
          userFriendlyMessage = t('password.error.tooMany');
          break;
        default:
          userFriendlyMessage = t('password.error.resetGeneric');
      }
      
      setErrorMessage(userFriendlyMessage);
    } finally {
      setIsLoading(false);
      setShowSnackbar(true);
    }
  }, [email, handleFailedResetAttempt, isLockedOut, lockoutUntil, lastSubmitTime, t]);

  const handleBackToLogin = () => {
    navigate('/auth');
  };

  const handleInputChange = useCallback((e) => {
    setEmail(sanitizeInput(e.target.value));
  }, []);

  return (
    <Grid container component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
              {t('password.recoverTitle')}
            </Typography>
            {isLockedOut && (
              <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
                {t('password.error.locked', { minutes: Math.ceil((lockoutUntil - Date.now()) / 60000) })}
              </Alert>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              {t('password.recoverDescription')}
            </Typography>
            
            <Box 
              component="form" 
              onSubmit={handleResetPassword} 
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
                value={email}
                onChange={handleInputChange}
                disabled={isLockedOut || isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
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
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || isLockedOut || !email}
                startIcon={isLoading ? <CircularProgress size={20} /> : <SecurityIcon />}
                sx={{
                  mt: 1,
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
                {isLockedOut ? t('auth.accountLocked') : isLoading ? t('password.sending') : t('password.sendLink')}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleBackToLogin}
                disabled={isLoading}
                startIcon={<ArrowBack />}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'primary.light',
                    color: 'primary.dark',
                  }
                }}
              >
                {t('password.backToLogin')}
              </Button>
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('password.didNotReceive')}{' '}
                <Button
                  variant="text"
                  size="small"
                  onClick={handleResetPassword}
                  disabled={isLoading || isLockedOut}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'primary.main'
                  }}
                >
                  {t('password.resend')}
                </Button>
              </Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                {t('password.checkSpam')}
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
        <Alert 
          severity={errorMessage ? 'error' : 'success'} 
          sx={{ 
            width: '100%',
            boxShadow: 3
          }}
          onClose={() => setShowSnackbar(false)}
        >
          {errorMessage || successMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default ForgetPassword;
