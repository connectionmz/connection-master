import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import ClipLoader from 'react-spinners/ClipLoader';
import { LinearProgress, Box, Typography } from '@mui/material';
import { auth, db } from './fb';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { SaveLogError } from './utils/SaveLogError';
import DesktopRoutes from './components/routes/DesktopRoutes';
import NonSubscriberRoutesDesktop from './components/routes/NonSubscriberRoutesDesktop';
import PublicRoutes from './components/routes/PublicRoutes'; // Importe as rotas públicas

const App = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar dados do usuário em tempo real
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
            isAnonymous: user.isAnonymous, // Adiciona a propriedade isAnonymous ao userData
          });
          console.log(data)
        } else {
          setUserData(null); // Caso o usuário não exista no banco de dados
        }
        setLoading(false); // Finaliza o carregamento
      });

      // Retorna a função de limpeza para remover o listener ao desmontar
      return unsubscribe;
    } catch (error) {
      SaveLogError('app', error);
      setError('Erro ao carregar dados do usuário. Tente novamente mais tarde.');
      setLoading(false); // Finaliza o carregamento em caso de erro
    }
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    // Você pode usar o savedLanguage aqui, se necessário
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const unsubscribeRealtime = fetchUserDataRealtime(user); // Busca dados em tempo real
        return unsubscribeRealtime; // Limpa o listener ao desmontar
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth(); // Limpa o listener de autenticação ao desmontar
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
          {/* Verifica se o usuário é anônimo */}
          {userData?.isAnonymous ? (
            <PublicRoutes /> // Rotas públicas para usuários anônimos
          ) : userData?.subscriptions?.status === 'active' ? (
            <DesktopRoutes user={userData} /> // Rotas para usuários autenticados e verificados
          ) : (
            <NonSubscriberRoutesDesktop userDb={userData} /> // Rotas para usuários não verificados
          )}
        </div>
      </div>
    </Router>
  );
};

export default App;