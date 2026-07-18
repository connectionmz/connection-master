import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { 
  Box,
  CssBaseline,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
  Typography
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { auth, db, initializeAuthPersistence } from './fb'; 
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import DesktopRoutes from './components/routes/DesktopRoutes';

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
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [persistenceReady, setPersistenceReady] = useState(false);
  const unsubscribeRef = useRef(null);

  const showError = (message) => {
    setSnackbar({ open: true, message, severity: 'error' });
  };

  const showSuccess = (message) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };

  // Limpar listener do Realtime Database
  const cleanupRealtimeListener = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  };

  // Configurar listener em tempo real para os dados da empresa
  const setupRealtimeListener = (userId) => {
    try {
      cleanupRealtimeListener();
      setLoading(true);
      
      const userRef = ref(db, `company/${userId}`);
      
      unsubscribeRef.current = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const userDataWithInfo = {
            ...data,
            photoURL: data.logoUrl || 'https://via.placeholder.com/150',
            displayName: data.nome || 'Nome da Empresa',
            endereco: data.endereco || 'Endereço não informado',
          };
          
          setUserData(userDataWithInfo);
        } else {
          setUserData(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Erro ao carregar dados:", error);
        showError('Erro ao carregar dados do usuário.');
        setLoading(false);
      });
    } catch (error) {
      console.error("Erro ao configurar listener:", error);
      showError('Erro ao configurar listener.');
      setLoading(false);
    }
  };

  // Fazer logout
  const handleSignOut = async () => {
    await signOut(auth);
  };

  // Inicializar persistência
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeAuthPersistence();
        setPersistenceReady(true);
      } catch (error) {
        console.error("Erro na persistência:", error);
        setPersistenceReady(true);
      }
    };

    initializeApp();
  }, []);

  // Observar estado de autenticação
  useEffect(() => {
    if (!persistenceReady) return;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser(user);
        setupRealtimeListener(user.uid);
        showSuccess('Sessão restaurada com sucesso!');
      } else {
        setAuthUser(null);
        setUserData(null);
        cleanupRealtimeListener();
        setLoading(false);
      }
      setAuthChecking(false);
    }, (error) => {
      console.error("Erro na autenticação:", error);
      setAuthChecking(false);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      cleanupRealtimeListener();
    };
  }, [persistenceReady]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Loading enquanto inicializa
  if (!persistenceReady || authChecking) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Backdrop open sx={{ color: '#fff', zIndex: 9999, flexDirection: 'column' }}>
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>
            {!persistenceReady ? 'Inicializando...' : 'Verificando autenticação...'}
          </Typography>
        </Backdrop>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box className="App" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <DesktopRoutes 
            user={userData}
            authUser={authUser}
            onSignOut={handleSignOut}
          />
        </Box>
      </Router>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;