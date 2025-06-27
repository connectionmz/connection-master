import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';
import { 
  Email, 
  Google, 
  Visibility, 
  VisibilityOff,
  Person as PersonalIcon,
  Business as BusinessIcon,
  ArrowForward as ArrowForwardIcon
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
  Divider
} from '@mui/material';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db, googleProvider } from '../fb';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';
import logo from '../img/bg.png';
import marketing from '../img/marketing.jpg';
import { HomeIcon } from 'lucide-react';

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

const AuthDesk = ({ data }) => {
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
  
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = useTheme();

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
    setCurrentUser(user);

    const companyRef = ref(db, 'company/' + user.uid);
    try {
      const snapshot = await get(companyRef);
      if (!snapshot.exists()) {
        setShowAccountTypeDialog(true);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error.message);
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

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setEmailError(false);
    setPasswordError(false);
    
    if (!email) {
      setEmailError(true);
      setErrorMessage('Por favor, insira seu email');
      setShowSnackbar(true);
      setIsEmailLoading(false);
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError(true);
      setErrorMessage('Por favor, insira um email válido');
      setShowSnackbar(true);
      setIsEmailLoading(false);
      return;
    }
    
    if (!password) {
      setPasswordError(true);
      setErrorMessage('Por favor, insira sua senha');
      setShowSnackbar(true);
      setIsEmailLoading(false);
      return;
    }
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserData(result.user);
      console.log('Usuário autenticado com sucesso:', result.user);
      //navigate("/")
    } catch (error) {
      const userFriendlyMessage = getFirebaseErrorMessage(error.code) || error.message;
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
      await saveUserData(result.user);
    } catch (error) {
      const userFriendlyMessage = getFirebaseErrorMessage(error.code) || error.message;
      setErrorMessage(userFriendlyMessage);
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
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailError}
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
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={togglePasswordVisibility} edge="end">
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
                  disabled={isEmailLoading || isGoogleLoading || isGuestLoading}
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
                    }
                  }}
                >
                  {isEmailLoading ? 'Entrando...' : 'Entrar com Email'}
                </Button>

                <Grid container spacing={2} sx={{ mt: 3, mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={isGoogleLoading || isEmailLoading || isGuestLoading}
                      onClick={handleGoogleSignIn}
                      startIcon={isGoogleLoading ? <CircularProgress size={20} /> : <Google />}
                      sx={{
                        py: 1.5,
                        borderRadius: 1,
                        textTransform: 'none',
                        fontSize: '1rem',
                        backgroundColor: '#d32f2f',
                        color: '#fff',
                        '&:hover': { backgroundColor: '#b71c1c' }
                      }}
                    >
                      {isGoogleLoading ? 'Entrando...' : 'Google'}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      type="button"
                      fullWidth
                      variant="outlined"
                      size="large"
                      disabled={isGuestLoading || isEmailLoading || isGoogleLoading}
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
                          opacity: 0.7,
                          transform: 'none'
                        }
                      }}
                    >
                      {isGuestLoading ? 'Redirecionando...' : 'Visitante'}
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
        PaperProps={{ sx: { borderRadius: 2, p: 0, overflow: 'visible' } }}
      >
        <AccountTypeSelector onSelect={handleAccountTypeSelect} />
      </Dialog>
    </>
  );
};

export default AuthDesk;