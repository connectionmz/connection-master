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
import { ref, onValue } from 'firebase/database';
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
  const unsubscribeRef = useRef(null);

  const showError = (message) => {
    setSnackbar({ open: true, message, severity: 'error' });
  };

  const showSuccess = (message) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };

  // limpar listener do Realtime Database
  const cleanupRealtimeListener = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  };

  // configurar listener em tempo real para os dados da empresa
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
        } else {
          setUserData(null);
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

  // observar o estado de autenticação
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser(user);
        setupRealtimeListener(user.uid);
      } else {
        setAuthUser(null);
        setUserData(null);
        cleanupRealtimeListener();
      }
      setAuthChecking(false);
    });

    // cleanup no unmount
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
          <Typography sx={{ mt: 2 }}>Carregando...</Typography>
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
            onSignOut={() => signOut(auth)}
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
