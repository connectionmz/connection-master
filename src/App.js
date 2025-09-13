import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { 
  Box, 
  Typography,
  CssBaseline,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Refresh, Security, Warning } from '@mui/icons-material';
import { auth, db } from './fb';
import { ref, onValue, off, get } from 'firebase/database';
import { onAuthStateChanged, signOut, sendEmailVerification } from 'firebase/auth';
import { SaveLogError } from './utils/SaveLogError';
import DesktopRoutes from './components/routes/DesktopRoutes';
import AuthDesk, { AccountTypeSelector } from './components/AuthDesk';
import AuthCreateDesk from './components/AuthCreateDesk'; // Importar o componente de criação

// Tema customizado para produção
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a73e8',
      light: '#4285f4',
      dark: '#0d47a1',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

// Componente para acesso não autorizado
const UnauthorizedAccess = ({ onRetry, onLogout }) => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      bgcolor="#f5f5f5"
      p={2}
    >
      <Card sx={{ maxWidth: 450, width: '100%', boxShadow: 3 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Security color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" component="h1" gutterBottom color="error">
            Acesso Não Autorizado
          </Typography>
          
          <Alert severity="error" sx={{ mb: 3 }}>
            Você precisa estar logado com uma conta válida para acessar esta página.
          </Alert>
          
          <Typography variant="body1" paragraph>
            Por favor, faça login com uma conta verificada para continuar.
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={onRetry}
              startIcon={<Refresh />}
            >
              Tentar Novamente
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              onClick={onLogout}
            >
              Fazer Logout
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

// Componente para verificação de email pendente
const EmailVerificationRequired = ({ user, onResendVerification, onLogout }) => {
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    try {
      setCooldown(60); // 60 segundos de cooldown
      await sendEmailVerification(user);
      setMessage('Email de verificação reenviado! Verifique sua caixa de entrada.');
      
      // Contador regressivo
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setMessage('Erro ao reenviar email. Tente novamente mais tarde.');
      SaveLogError('app', error);
    }
  };

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      bgcolor="#f5f5f5"
      p={2}
    >
      <Card sx={{ maxWidth: 500, width: '100%', boxShadow: 3 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Warning color="warning" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" component="h1" gutterBottom color="warning.main">
            Verificação de Email Necessária
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            Você precisa verificar seu email antes de acessar a aplicação.
          </Alert>
          
          <Typography variant="body1" paragraph>
            Enviamos um link de verificação para <strong>{user.email}</strong>. 
            Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
          </Typography>
          
          {message && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}
          
          <Box display="flex" flexDirection="column" gap={2}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleResend}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar Email de Verificação'}
            </Button>
            
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              onClick={onLogout}
            >
              Fazer Logout
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

// Componente principal de roteamento
const AppRouter = () => {
  const [userData, setUserData] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [shouldSetup, setShouldSetup] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const unsubscribeRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const showError = (message) => {
    setError(message);
    setSnackbar({ open: true, message, severity: 'error' });
  };

  const showSuccess = (message) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };

  const cleanupRealtimeListener = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  };

  const checkUserSetup = async (userId) => {
    try {
      const userRef = ref(db, `company/${userId}`);
      const snapshot = await get(userRef);
      return snapshot.exists();
    } catch (error) {
      SaveLogError('app', error);
      return false;
    }
  };

  const setupRealtimeListener = (userId) => {
    try {
      cleanupRealtimeListener();
      setLoading(true);
      
      const userRef = ref(db, `company/${userId}`);
      
      unsubscribeRef.current = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserData({
            ...data,
            photoURL: data.logoUrl || 'https://via.placeholder.com/150',
            displayName: data.nome || 'Nome da Empresa',
            endereco: data.endereco || 'Endereço não informado',
          });
          setShouldSetup(false);
          setUnauthorized(false);
          showSuccess('Dados carregados com sucesso!');
        } else {
          setUserData(null);
          setShouldSetup(true);
          setUnauthorized(false);
          if (!location.pathname.includes('/setup')) {
            showError('Nenhum dado encontrado. Por favor, complete o cadastro.');
          }
        }
        setLoading(false);
      }, (error) => {
        SaveLogError('app', error);
        showError('Erro ao carregar dados do usuário. Tente novamente mais tarde.');
        setLoading(false);
      });
    } catch (error) {
      SaveLogError('app', error);
      showError('Erro ao configurar listener. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      setAuthUser(null);
      setShouldSetup(false);
      setUnauthorized(false);
      showSuccess('Logout realizado com sucesso!');
      navigate('/auth');
    } catch (error) {
      SaveLogError('app', error);
      showError('Erro ao fazer logout. Tente novamente.');
    }
  };

  const handleRetry = () => {
    setError(null);
    setUnauthorized(false);
    setLoading(true);
    if (authUser) {
      setupRealtimeListener(authUser.uid);
    } else {
      setLoading(false);
    }
  };

  const handleSetupComplete = () => {
    setShouldSetup(false);
    if (authUser) {
      setupRealtimeListener(authUser.uid);
    }
  };

  const handleAccountTypeSelect = (type) => {
    setShouldSetup(false);
    if (type === 'business') {
      navigate('/setup');
    } else {
      navigate('/setupUser');
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setAuthChecking(false);
      
      if (user) {
        setAuthUser(user);
        
        // Verificar se o email foi verificado
        if (!user.emailVerified) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }
        
        // Verificar se o usuário completou o setup
        const hasSetup = await checkUserSetup(user.uid);
        
        if (hasSetup) {
          setupRealtimeListener(user.uid);
        } else {
          setShouldSetup(true);
          setLoading(false);
        }
      } else {
        cleanupRealtimeListener();
        setUserData(null);
        setAuthUser(null);
        setShouldSetup(false);
        setUnauthorized(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      cleanupRealtimeListener();
    };
  }, [navigate, location]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Verificar se a rota atual é pública (não requer autenticação)
  const isPublicRoute = () => {
    return ['/auth', '/create'].includes(location.pathname);
  };

  // Renderizar loading enquanto verifica autenticação
  if (authChecking && !isPublicRoute()) {
    return (
      <Backdrop open sx={{ color: '#fff', zIndex: theme.zIndex.drawer + 1, flexDirection: 'column' }}>
        <CircularProgress color="inherit" />
        <Typography sx={{ mt: 2 }}>Verificando autenticação...</Typography>
      </Backdrop>
    );
  }

  // Renderizar tela de verificação de email necessária
  if (authUser && !authUser.emailVerified && !isPublicRoute()) {
    return (
      <EmailVerificationRequired 
        user={authUser} 
        onLogout={handleLogout}
      />
    );
  }

  // Permitir acesso às rotas públicas sem autenticação
  if (isPublicRoute()) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthDesk />} />
        <Route path="/create" element={<AuthCreateDesk />} />
      </Routes>
    );
  }

  // Renderizar tela de acesso não autorizado para usuários não autenticados
  if (!authUser && !isPublicRoute()) {
    return (
      <UnauthorizedAccess 
        onRetry={handleRetry}
        onLogout={() => navigate('/auth')}
      />
    );
  }

  // Renderizar conteúdo principal baseado no estado de autenticação
  return (
    <Box className="App" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/setup" element={
            shouldSetup ? (
              <AccountTypeSelector onSelect={handleAccountTypeSelect} />
            ) : (
              <div>Redirecionando...</div>
            )
          } />
          <Route path="/setupUser" element={
            shouldSetup ? (
              <div>Setup de usuário pessoal</div>
            ) : (
              <div>Redirecionando...</div>
            )
          } />
          <Route path="/*" element={
            <DesktopRoutes 
              user={userData} 
              onLogout={handleLogout} 
              onSetupComplete={handleSetupComplete}
              shouldSetup={shouldSetup}
            />
          } />
        </Routes>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Rotas públicas - acessíveis sem autenticação */}
          <Route path="/auth" element={<AuthDesk />} />
          <Route path="/create" element={<AuthCreateDesk />} />
          
          {/* Rotas protegidas */}
          <Route path="/*" element={<AppRouter />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;