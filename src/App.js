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
import { auth, db } from './fb';
import { ref, onValue, off, get } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { SaveLogError } from './utils/SaveLogError';
import DesktopRoutes from './components/routes/DesktopRoutes';

// Tema customizado
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
  const [shouldSetup, setShouldSetup] = useState(false);
  const unsubscribeRef = useRef(null);

  const showError = (message) => {
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
          showSuccess('Dados carregados com sucesso!');
        } else {
          setUserData(null);
          setShouldSetup(true);
        }
        setLoading(false);
      }, (error) => {
        SaveLogError('app', error);
        showError('Erro ao carregar dados do usuário.');
        setLoading(false);
      });
    } catch (error) {
      SaveLogError('app', error);
      showError('Erro ao configurar listener.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      setAuthUser(null);
      setShouldSetup(false);
      showSuccess('Logout realizado com sucesso!');
    } catch (error) {
      SaveLogError('app', error);
      showError('Erro ao fazer logout.');
    }
  };

  const handleSetupComplete = () => {
    setShouldSetup(false);
    if (authUser) {
      setupRealtimeListener(authUser.uid);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setAuthChecking(false);
      
      if (user) {
        setAuthUser(user);
        
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
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      cleanupRealtimeListener();
    };
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Renderizar loading enquanto verifica autenticação
  if (authChecking) {
    return (
      <Backdrop open sx={{ color: '#fff', zIndex: theme.zIndex.drawer + 1, flexDirection: 'column' }}>
        <CircularProgress color="inherit" />
        <Typography sx={{ mt: 2 }}>Carregando...</Typography>
      </Backdrop>
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
            loading={loading}
            shouldSetup={shouldSetup}
            onLogout={handleLogout}
            onSetupComplete={handleSetupComplete}
          />
          
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