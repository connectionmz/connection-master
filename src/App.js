import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import ClipLoader from 'react-spinners/ClipLoader';
import { 
  LinearProgress, 
  Box, 
  Typography,
  Modal,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { auth, db } from './fb';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { SaveLogError } from './utils/SaveLogError';
import DesktopRoutes from './components/routes/DesktopRoutes';


const App = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setupRealtimeListener = (userId) => {
    try {
      setLoading(true);
      
      const userRef = ref(db, `company/${userId}`);
      
      // Set up real-time listener
      const unsubscribe = onValue(userRef, (snapshot) => {
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
        setError('Erro ao carregar dados do usuário. Tente novamente mais tarde.');
        setLoading(false);
      });

      // Return cleanup function
      return () => unsubscribe();
    } catch (error) {
      SaveLogError('app', error);
      setError('Erro ao configurar listener. Tente novamente mais tarde.');
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Clean up any previous listener before setting up a new one
        const cleanup = setupRealtimeListener(user.uid);
        
        // Return cleanup function for auth state change
        return () => {
          if (cleanup) cleanup();
        };
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  if (loading) {
    return (
      <Box className="loader-container" textAlign="center" padding={2}>
        <ClipLoader color="#4A90E2" loading={loading} size={80} />
        <Typography className="loading-text" marginY={2}>
          Carregando, por favor aguarde...
        </Typography>
        <Box width="80%" mx="auto">
          <LinearProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="error-container" textAlign="center" padding={2}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Router>
      <div className="App">
        <div className="content">
          <DesktopRoutes user={userData} />
        </div>
      </div>
    </Router>
  );
};

export default App;