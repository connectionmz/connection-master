import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import ClipLoader from 'react-spinners/ClipLoader';
import { LinearProgress, Box, Typography } from '@mui/material';
import { auth, db } from './fb';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { SaveLogError } from './utils/SaveLogError';
import DesktopRoutes from './components/routes/DesktopRoutes';
import NonSubscriberRoutesDesktop from './components/routes/NonSubscriberRoutesDesktop';

const App = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  
  const fetchUserDataOnce = async (user) => {
    try {
      const userRef = ref(db, `company/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData({
          ...data,
          photoURL: data.logoUrl || 'https://via.placeholder.com/150',
          displayName: data.nome || 'Nome da Empresa',
          endereco: data.endereco || 'Endereço não informado',
        });
        setSubscriptionActive(data.subscriptions.isverify);
      } else {
        setSubscriptionActive(false);
      }
    } catch (error) {
      SaveLogError('app', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (!userData) {
          fetchUserDataOnce(user); 
        }
      } else {
        setUserData(null);
        setSubscriptionActive(false);
        setLoading(false);
      }
    });

    return () => unsubscribe(); 
  }, [userData]);

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

  return (
  <Router>
    <div className="App">
      <div className="content">
        {subscriptionActive ? (
          <DesktopRoutes user={userData} />
        ) : (
          <NonSubscriberRoutesDesktop />
        )}
      </div>
    </div>
  </Router>
);
};

export default App;
