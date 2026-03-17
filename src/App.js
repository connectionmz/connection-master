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
import { ref, onValue, set, serverTimestamp, get } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { SaveLogError } from './utils/SaveLogError';
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

// Cache para controlar acesso por sessão
const accessCache = {
  lastAccessDate: null,
  sessionId: null,
  loggedUsers: new Set()
};

// Gerar ID único para a sessão
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Verificar se já registrou acesso hoje
const hasLoggedAccessToday = (userId) => {
  const today = new Date().toDateString();
  const cacheKey = `${userId}_${today}`;
  return accessCache.loggedUsers.has(cacheKey);
};

// Marcar acesso como registrado
const markAccessAsLogged = (userId) => {
  const today = new Date().toDateString();
  const cacheKey = `${userId}_${today}`;
  accessCache.loggedUsers.add(cacheKey);
};

// Função otimizada para registrar acesso
const logCompanyAccess = async (userId, companyData) => {
  try {
    // Verificar no cache primeiro
    if (hasLoggedAccessToday(userId)) {
      return true;
    }

    const today = new Date().toDateString();
    const accessRef = ref(db, `accessLogs/${userId}/${today}`);
    
    // Verificar se já existe registro para hoje
    const snapshot = await get(accessRef);
    
    if (snapshot.exists()) {
      markAccessAsLogged(userId);
      return true;
    }

    // Registrar novo acesso
    await set(accessRef, {
      timestamp: serverTimestamp(),
      accessedAt: new Date().toISOString(),
      companyName: companyData?.displayName || companyData?.nome || 'N/A',
      userAgent: navigator.userAgent.substring(0, 200),
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      sessionId: accessCache.sessionId,
      firstAccessOfDay: true
    });

    markAccessAsLogged(userId);
    return true;

  } catch (error) {
    SaveLogError('access-log', error);
    return false;
  }
};

const App = () => {
  const [userData, setUserData] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [persistenceReady, setPersistenceReady] = useState(false);
  const unsubscribeRef = useRef(null);
  const accessTimeoutRef = useRef(null);

  // Inicializar sessão
  useEffect(() => {
    accessCache.sessionId = generateSessionId();
    accessCache.lastAccessDate = new Date().toDateString();
    
    // Limpar cache ao fechar a aba/recarregar (opcional)
    const handleBeforeUnload = () => {
      accessCache.loggedUsers.clear();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (accessTimeoutRef.current) {
        clearTimeout(accessTimeoutRef.current);
      }
    };
  }, []);

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
          const userDataWithInfo = {
            ...data,
            photoURL: data.logoUrl || 'https://via.placeholder.com/150',
            displayName: data.nome || 'Nome da Empresa',
            endereco: data.endereco || 'Endereço não informado',
          };
          
          setUserData(userDataWithInfo);
          
          // Registrar acesso com debounce para evitar múltiplas chamadas
          registerAccessWithDebounce(userId, userDataWithInfo);
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

  // Registrar acesso com debounce para evitar múltiplas escritas
  const registerAccessWithDebounce = (userId, companyData) => {
    if (accessTimeoutRef.current) {
      clearTimeout(accessTimeoutRef.current);
    }

    accessTimeoutRef.current = setTimeout(async () => {
      // Verificação adicional no cache local
      if (hasLoggedAccessToday(userId)) {
        return;
      }

      const success = await logCompanyAccess(userId, companyData);
      if (success) {
      }
    }, 2000); // Aguarda 2 segundos antes de registrar (debounce)
  };

  // Limpar cache ao fazer logout
  const handleSignOut = async () => {
    accessCache.loggedUsers.clear();
    if (accessTimeoutRef.current) {
      clearTimeout(accessTimeoutRef.current);
    }
    await signOut(auth);
  };

  // AGUARDAR PERSISTÊNCIA ANTES DE VERIFICAR AUTH
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeAuthPersistence();
        setPersistenceReady(true);
      } catch (error) {
        setPersistenceReady(true); // Continua mesmo com erro
      }
    };

    initializeApp();
  }, []);

  // observar o estado de autenticação (APÓS PERSISTÊNCIA ESTAR PRONTA)
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
        accessCache.loggedUsers.clear(); // Limpar cache ao fazer logout
        cleanupRealtimeListener();
        setLoading(false);
      }
      setAuthChecking(false);
    }, (error) => {
      SaveLogError('auth-state', error);
      setAuthChecking(false);
      setLoading(false);
    });

    // cleanup no unmount
    return () => {
      unsubscribeAuth();
      cleanupRealtimeListener();
      if (accessTimeoutRef.current) {
        clearTimeout(accessTimeoutRef.current);
      }
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
        <Backdrop open sx={{ color: '#fff', zIndex: theme.zIndex.drawer + 1, flexDirection: 'column' }}>
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
    </ThemeProvider>
  );
};

export default App;