import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { 
  Box, 
  Typography,
  CssBaseline,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Logout, Refresh } from '@mui/icons-material';
import { auth, db } from './fb';
import { ref, onValue, off } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { SaveLogError } from './utils/SaveLogError';
import DesktopRoutes from './components/routes/DesktopRoutes';

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

const App = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const unsubscribeRef = useRef(null);

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

  const setupRealtimeListener = (userId) => {
    try {
      cleanupRealtimeListener(); // Limpa listener anterior
      setLoading(true);
      
      const userRef = ref(db, `company/${userId}`);
      
      // Configura listener em tempo real
      unsubscribeRef.current = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserData({
            ...data,
            photoURL: data.logoUrl || 'https://via.placeholder.com/150',
            displayName: data.nome || 'Nome da Empresa',
            endereco: data.endereco || 'Endereço não informado',
          });
          showSuccess('Dados carregados com sucesso!');
        } else {
          setUserData(null);
          showError('Nenhum dado encontrado para este usuário.');
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
      showSuccess('Logout realizado com sucesso!');
    } catch (error) {
      SaveLogError('app', error);
      showError('Erro ao fazer logout. Tente novamente.');
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    if (auth.currentUser) {
      setupRealtimeListener(auth.currentUser.uid);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAuthChecking(false);
      if (user) {
        setupRealtimeListener(user.uid);
      } else {
        cleanupRealtimeListener();
        setUserData(null);
        setLoading(false);
      }
    });

    // Cleanup on component unmount
    return () => {
      unsubscribeAuth();
      cleanupRealtimeListener();
    };
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (authChecking) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Backdrop open sx={{ color: '#fff', zIndex: theme.zIndex.drawer + 1, flexDirection: 'column' }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>Verificando autenticação...</Typography>
        </Backdrop>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box className="App" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {userData && (
            <AppBar position="sticky" elevation={2}>
              <Toolbar>
                <Avatar 
                  src={userData.photoURL} 
                  sx={{ mr: 2 }}
                  alt={userData.displayName}
                />
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  {userData.displayName}
                </Typography>
                <IconButton color="inherit" onClick={handleRetry} title="Recarregar dados">
                  <Refresh />
                </IconButton>
                <IconButton color="inherit" onClick={handleLogout} title="Sair">
                  <Logout />
                </IconButton>
              </Toolbar>
            </AppBar>
          )}
          
          <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}>
            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
                <CircularProgress size={60} thickness={4} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Carregando dados, aguarde...
                </Typography>
              </Box>
            ) : error ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" textAlign="center">
                <Typography variant="h5" color="error" gutterBottom>
                  Ocorreu um erro
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                  {error}
                </Typography>
                <Box mt={2}>
                  <IconButton color="primary" onClick={handleRetry} size="large">
                    <Refresh fontSize="large" />
                  </IconButton>
                  <Typography variant="body2">Tentar novamente</Typography>
                </Box>
              </Box>
            ) : (
              <DesktopRoutes user={userData} />
            )}
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
      </Router>
    </ThemeProvider>
  );
};

export default App;