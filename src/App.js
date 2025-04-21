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
import { ref, onValue, remove, set } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { SaveLogError } from './utils/SaveLogError';
import DesktopRoutes from './components/routes/DesktopRoutes';

// Lista de províncias de Moçambique
const PROVINCIAS_MOCAMBIQUE = [
  "Maputo Cidade",
  "Maputo Província",
  "Gaza",
  "Inhambane",
  "Sofala",
  "Manica",
  "Tete",
  "Zambézia",
  "Nampula",
  "Cabo Delgado",
  "Niassa"
];

const App = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitorData, setVisitorData] = useState({
    nome: '',
    email: '',
    contacto: '',
    provincia: ''
  });

  const fetchUserDataRealtime = (user) => {
    try {
      const userRef = ref(db, `company/${user.uid}`);

      // Escuta as alterações em tempo real
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserData({
            ...data,
            photoURL: data.logoUrl || 'https://via.placeholder.com/150',
            displayName: data.nome || 'Nome da Empresa',
            endereco: data.endereco || 'Endereço não informado',
            isAnonymous: user.isAnonymous,
          });
        } else {
          setUserData(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      SaveLogError('app', error);
      setError('Erro ao carregar dados do usuário. Tente novamente mais tarde.');
      setLoading(false);
    }
  };


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const unsubscribeRealtime = fetchUserDataRealtime(user);
        return unsubscribeRealtime;
      } else {
        setUserData(null);
        setLoading(false);
        
        // Verifica se é um visitante (pode ser armazenado no localStorage)
        const isVisitor = localStorage.getItem('isVisitor') === 'true';
        if (!isVisitor) {
          setShowVisitorModal(true);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleVisitorSubmit = async () => {
    try {
      // Validação básica
      if (!visitorData.nome || !visitorData.contacto || !visitorData.provincia) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      // Cria um ID único para o visitante
      const visitorId = `visitor_${Date.now()}`;
      
      // Salva os dados do visitante no Firebase
      await set(ref(db, `visitors/${visitorId}`), {
        ...visitorData,
        timestamp: new Date().toISOString()
      });

      // Marca como visitante no localStorage
      localStorage.setItem('isVisitor', 'true');
      
      // Define os dados mínimos do usuário como visitante
      setUserData({
        id: visitorId,
        displayName: visitorData.nome,
        email: visitorData.email,
        contacto: visitorData.contacto,
        provincia: visitorData.provincia,
        isVisitor: true,
        isAnonymous: true,
        photoURL: 'https://via.placeholder.com/150'
      });

      setShowVisitorModal(false);
    } catch (error) {
      console.error('Erro ao salvar dados do visitante:', error);
      alert('Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVisitorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

        {/* Modal para visitante */}
        <Dialog 
          open={showVisitorModal} 
          onClose={() => setShowVisitorModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Bem-vindo Visitante</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Por favor, forneça algumas informações para continuar:
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Nome Completo *"
                name="nome"
                value={visitorData.nome}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={visitorData.email}
                onChange={handleInputChange}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Contacto *"
                name="contacto"
                value={visitorData.contacto}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Província *</InputLabel>
                <Select
                  name="provincia"
                  value={visitorData.provincia}
                  onChange={handleInputChange}
                  label="Província *"
                >
                  {PROVINCIAS_MOCAMBIQUE.map(provincia => (
                    <MenuItem key={provincia} value={provincia}>
                      {provincia}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                localStorage.setItem('isVisitor', 'true');
                setShowVisitorModal(false);
              }}
              color="secondary"
            >
              Continuar sem salvar
            </Button>
            <Button 
              onClick={handleVisitorSubmit}
              variant="contained"
              color="primary"
            >
              Salvar e Continuar
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Router>
  );
};

export default App;