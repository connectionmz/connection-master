import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Card, CardActions, CardContent, Dialog, Divider, useMediaQuery, useTheme } from '@mui/material';
import { ArrowForward, Business, Email, Person, Visibility, VisibilityOff } from '@mui/icons-material';
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
} from '@mui/material';
import { 
  auth, 
  db 
} from '../fb';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';
import logo from '../img/bg.png';
import marketing from '../img/marketing.jpg';

const AccountTypeSelector = ({ onSelect }) => {
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
      icon: <Person fontSize="large" />,
      color: theme.palette.primary.main
    },
    {
      id: 'business',
      title: 'Conta Empresarial',
      description: 'Para empresas, com acesso aos módulos de Cotações, Concursos e mais, permitindo a gestão do seu negócio e networking a nível nacional.',
      icon: <Business fontSize="large" />,
      color: theme.palette.secondary.main
    }
  ];

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: isMobile ? 2 : 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', fontWeight: 700, mb: 4 }}>
        Qual tipo de conta você precisa?
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
                  endIcon={<ArrowForward />}
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

const AuthCreateDesk = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showAccountTypeDialog, setShowAccountTypeDialog] = useState(false);
  
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');

  // Save user data to database
  const saveUserData = async (user) => {
    const userRef = ref(db, 'users/' + user.uid);
    const userData = {
      displayName: user.displayName || '',
      uid: user.uid,
      email: user.email || '',
      profilepic: user.photoURL || '',
      provider: user.providerData[0]?.providerId || 'email',
      country: 'Unknown',
      ip: 'Unknown',
      loginDate: new Date().toISOString(),
      emailVerified: user.emailVerified,
    };

    await set(userRef, userData);
  };

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validate password strength
  const validatePassword = (password) => {
    return password.length >= 6;
  };

  // Handle form submission
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError(false);
    setPasswordError(false);
    
    // Validate inputs
    if (!email) {
      setEmailError(true);
      setErrorMessage('Por favor, insira seu email');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError(true);
      setErrorMessage('Por favor, insira um email válido');
      return;
    }
    
    if (!password) {
      setPasswordError(true);
      setErrorMessage('Por favor, insira sua senha');
      return;
    }
    
    if (!validatePassword(password)) {
      setPasswordError(true);
      setErrorMessage('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (!termsAccepted) {
      setErrorMessage('Você deve aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      await saveUserData(result.user);

      setSuccessMessage('Conta criada com sucesso! Verifique seu email para ativar a conta.');
      setEmail('');
      setPassword('');
      setTermsAccepted(false);
      
      // Show account type selector dialog after successful registration
      setShowAccountTypeDialog(true);
    } catch (error) {
      const userFriendlyMessage = getFirebaseErrorMessage(error.code);
      setErrorMessage(userFriendlyMessage);
      
      // Highlight problematic fields
      if (error.code.includes('email')) setEmailError(true);
      if (error.code.includes('password')) setPasswordError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountTypeSelect = (type) => {
    setShowAccountTypeDialog(false);
    if (type === 'business') {
      navigate('/setup');
    } else {
      navigate('/setupUser');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      {/* Left side - Form */}
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: 400,
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
            
            <Box 
              component="form" 
              onSubmit={handleEmailSignIn} 
              noValidate 
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
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
                label="Senha (mínimo 6 caracteres)"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
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
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={() => setTermsAccepted(!termsAccepted)}
                    name="terms"
                    color="primary"
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
                disabled={isLoading || !termsAccepted}
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
                {isLoading ? 'Criando conta...' : 'Criar conta'}
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
      
      {/* Right side - Marketing image */}
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
      
      {/* Error snackbar */}
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
      
      {/* Account type selector dialog */}
      <Dialog
        open={showAccountTypeDialog}
        onClose={() => setShowAccountTypeDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, p: 0, overflow: 'visible' } }}
      >
        <AccountTypeSelector onSelect={handleAccountTypeSelect} />
      </Dialog>
      
      {/* Success snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            width: '100%',
            boxShadow: 3
          }}
          onClose={() => setSuccessMessage('')}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default AuthCreateDesk;