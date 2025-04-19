import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import { Email, Visibility, VisibilityOff } from '@mui/icons-material';
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
  CircularProgress
} from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from '../fb';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';
import logo from '../img/bg.png';
import marketing from '../img/marketing.jpg';
import { HomeIcon } from 'lucide-react';

const AuthDesk = ({ data }) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');

  // Save user data to database
  const saveUserData = async (user) => {
    const userRef = ref(db, 'users/' + user.uid);
    const userData = {
      displayName: user.displayName || 'Usuário Anônimo',
      uid: user.uid,
      email: user.email || 'anonimo@exemplo.com',
      profilepic: user.photoURL || '',
      provider: user.providerData[0]?.providerId || 'anonymous',
      country: 'Unknown',
      ip: 'Unknown',
      loginDate: new Date().toISOString(),
    };

    await set(userRef, userData);

    const companyRef = ref(db, 'company/' + user.uid);
    try {
      const snapshot = await get(companyRef);
      if (!snapshot.exists()) {
        console.log('Dados da empresa não encontrados.');
      }
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error.message);
    }
  };

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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
      setShowSnackbar(true);
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError(true);
      setErrorMessage('Por favor, insira um email válido');
      setShowSnackbar(true);
      return;
    }
    
    if (!password) {
      setPasswordError(true);
      setErrorMessage('Por favor, insira sua senha');
      setShowSnackbar(true);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserData(result.user);
      navigate('/');
    } catch (error) {
      const userFriendlyMessage = getFirebaseErrorMessage(error.code);
      setErrorMessage(userFriendlyMessage);
      setShowSnackbar(true);
      
      // Highlight problematic fields
      if (error.code.includes('email')) setEmailError(true);
      if (error.code.includes('password')) setPasswordError(true);
    } finally {
      setIsLoading(false);
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
                width: 144, 
                mb: 4,
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }} 
            />
            
            <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
              Acesse sua conta
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
                autoComplete="current-password"
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
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <Email />}
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
                  }
                }}
              >
                {isLoading ? 'Entrando...' : 'Entrar com Email'}
              </Button>
              <Button
  type="button" // Alterado para type="button" já que não está em um formulário
  fullWidth
  variant="outlined"
  size="large"
  disabled={isLoading}
  onClick={() => navigate('/')} // Navega para a rota principal
  startIcon={
    isLoading ? (
      <CircularProgress size={20} color="inherit" />
    ) : (
      <HomeIcon /> // Ícone mais significativo para "home"
    )
  }
  sx={{
    mt: 3,
    mb: 2,
    py: 1.5,
    borderRadius: 2, // Bordas mais arredondadas
    textTransform: 'none',
    fontSize: '1.1rem', // Texto um pouco maior
    fontWeight: 500, // Peso médio para o texto
    letterSpacing: '0.5px', // Pequeno espaçamento entre letras
    transition: 'all 0.3s ease-in-out',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      transform: 'translateY(-3px)', // Efeito mais pronunciado
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      backgroundColor: (theme) => theme.palette.primary.dark // Cor mais escura no hover
    },
    '&:active': {
      transform: 'translateY(0)', // Efeito de clique
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    '&.Mui-disabled': {
      opacity: 0.7, // Estilo melhor para estado desabilitado
      transform: 'none'
    }
  }}
>
  {isLoading ? 'A entrar...' : 'Entrar como visitante'}
</Button>

              
              <Grid container justifyContent="space-between">
                <Grid item>
                  <Link 
                    href="/forget-password" 
                    variant="body2" 
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                        textDecoration: 'none'
                      }
                    }}
                  >
                    Esqueceu a senha?
                  </Link>
                </Grid>
                <Grid item>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Não tem conta?{' '}
                    <Link 
                      href="/create" 
                      sx={{
                        fontWeight: 600,
                        '&:hover': {
                          textDecoration: 'none'
                        }
                      }}
                    >
                      Cadastre-se
                    </Link>
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Ao continuar, você concorda com nossos{' '}
                <Link 
                  href="/termos" 
                  sx={{ 
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'none'
                    }
                  }}
                >
                  Termos e Políticas
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
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%',
            boxShadow: 3
          }}
          onClose={() => setShowSnackbar(false)}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default AuthDesk;