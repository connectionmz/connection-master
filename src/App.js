import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ClipLoader from 'react-spinners/ClipLoader';
import { auth, db } from './fb';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProvider } from './context/UserProfileContext';
import { SaveLogError } from './utils/SaveLogError';
import UserRoutes from './components/routes/UserRoutes';
import NonSubscriberRoutes from './components/routes/NonSubscriberRoutes';
import DesktopRoutes from './components/routes/DesktopRoutes';

const App = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const isMobile = window.innerWidth <= 768; 
  // Função para buscar dados do usuário
  const fetchUserData = async (user) => {
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
        setSubscriptionActive(data.subscriptions?.status || false);
      } else {
        setSubscriptionActive(false); // Caso não haja dados, assume que a subscrição é falsa
      }
    } catch (error) {
      //SaveLogError('app', error);
      setSubscriptionActive(false);
    } finally {
      setLoading(false);
    }
  };

  // Monitorando mudanças no estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user);
      } else {
        setUserData(null);
        setSubscriptionActive(false);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Limpeza do listener
  }, []);

  // Exibição de loading enquanto os dados são carregados
  if (loading) {
    return (
      <div className="loader-container">
        <ClipLoader color="#4A90E2" loading={loading} size={100} />
        <p className="loading-text">Carregando, por favor aguarde...</p>
      </div>
    );
  }

  return (
    <UserProvider>
      <Router>
        <div className="App">
          {isMobile && <Header />} {/* Exibe o Header apenas em Mobile */}
          <div className="content">
            {isMobile ? (
              subscriptionActive ? (
                <UserRoutes user={userData} /> // Redireciona para UserRoutes em Mobile se subscrito
              ) : (
                <NonSubscriberRoutes userDb={userData} /> // Redireciona para NonSubscriberRoutes em Mobile se não subscrito
              )
            ) : (
              subscriptionActive ? (
                <DesktopRoutes user={userData} /> // Redireciona para DesktopRoutes se subscrito
              ) : (
                <NonSubscriberRoutes userDb={userData} /> // Redireciona para NonSubscriberRoutes em Desktop se não subscrito
              )
            )}
          </div>
          {isMobile && <Footer user={userData} />} {/* Exibe o Footer apenas em Mobile */}
        </div>
      </Router>
    </UserProvider>
  );
};

export default App;
