import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import './App.css';
import Home from './components/Home'; 
import Auth from './components/Auth';
import Header from './components/Header';
import { ThemeProvider } from './context/ThemeContext';
import Footer from './components/Footer';
import { auth, db } from './fb';
import { ref, get, set, onValue } from 'firebase/database'; 
import ClipLoader from "react-spinners/ClipLoader"; 
import { onAuthStateChanged } from 'firebase/auth';
import { UserProvider } from './context/UserProfileContext';
import UserRoutes from './components/routes/UserRoutes';
import NonSubscriberRoutes from './components/routes/NonSubscriberRoutes';
import { saveContentToInbox } from './components/SaveToInbox';
import { SaveLogError } from './utils/SaveLogError';
import DesktopRoutes from './components/routes/DesktopRoutes';

const App = () => {
  const [userData, setUserData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false); 
  const [isVerified, setIsVerified] = useState(false)
  const [allCompanyData, setAllCompanyData] = useState(null); 
  const [redirected, setRedirected] = useState(false);
  // Função para detectar se o usuário está em mobile ou desktop
  const isMobile = window.innerWidth <= 768; // Ajuste esse valor conforme necessário

  const fetchNewContentAndNotify = (user) => {
    const sections = ['concursos', 'cotacoes', 'publicAnnouncements', 'surveys'];
  
    sections.forEach((section) => {
      const sectionRef = ref(db, `${section}`);
  
      onValue(sectionRef, (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }
  
        const sectionData = snapshot.val();
  
        Object.keys(sectionData).forEach((key) => {
          const data = sectionData[key];
  
          let contentMessage = '';
          let messageTitle = '';
  
          switch (section) {
            case 'concursos':
              contentMessage = `Novo concurso: ${data.titulo || 'Sem título'}`;
              messageTitle = data.titulo || 'Sem título';
              break;
            case 'cotacoes':
              contentMessage = `Novo pedido de cotações: ${data.title || 'Sem título'}`;
              messageTitle = data.title || 'Sem título';
              break;
            case 'publicAnnouncements':
              contentMessage = `Novo anúncio público: ${data.content || 'Conteúdo indisponível'}`;
              messageTitle = data.content || 'Sem título';
              break;
            case 'surveys':
              contentMessage = `Nova pesquisa disponível: ${data.title || 'Sem título'}`;
              messageTitle = data.title || 'Sem título';
              break;
            default:
              contentMessage = data.content || 'Conteúdo indisponível';
              messageTitle = 'Sem título';
          }
  
          if (!contentMessage || !user || !messageTitle) {
            console.error('Parâmetros inválidos detectados:', {
              contentMessage,
              userId: user,
              messageTitle,
            });
            return;
          }
          {/*
            saveContentToInbox(contentMessage, user, messageTitle)
            .then(() => console.log(''))
            .catch((error) =>
              SaveLogError('app', 'Erro ao salvar notificação no inbox: '+ error)
            );
            */}
        });
      });
    });
  };

  const fetchUserDataAndSubscription = async (user) => {
    try {
      const companyRef = ref(db, `company/${user.uid}`);
      const companySnapshot = await get(companyRef);

      if (companySnapshot.exists()) {
        const companyData = companySnapshot.val();

        setIsVerified(companyData.isVerified)

        setUserData({
          ...companyData,
          photoURL: companyData.logoUrl || "https://via.placeholder.com/150",
          coverPhotoURL: companyData.coverUrl || "https://via.placeholder.com/600x200",
          displayName: companyData.nome || 'Nome da Empresa',
          username: companyData.id || 'ID da Empresa',
          endereco: companyData.endereco || 'Endereço da Empresa',
        });

        setSubscriptionActive(companyData.subscriptions.status);

        //await set(ref(db, `company/${user.uid}/lastLogin`), new Date().toISOString());

        fetchNewContentAndNotify(user.uid);
      } else {
        setSubscriptionActive(false);
      }
      const allDataRef = ref(db, 'company'); 
      const allDataSnapshot = await get(allDataRef);
      if (allDataSnapshot.exists()) {
        const allData = allDataSnapshot.val();
        setAllCompanyData(allData); 
      }
    } catch (error) {
      SaveLogError('app', error)
      setSubscriptionActive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserDataAndSubscription(user);
      } else {
        setUserData(null);
        setSubscriptionActive(false);
        setLoading(false);
      }
    });



    return () => unsubscribe();
  }, );


  
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
        {isMobile && <Header />}
        <div className="content">
          {isMobile ? (
            subscriptionActive ? (
              <UserRoutes user={userData} />
            ) : (
              <NonSubscriberRoutes userDb={userData} />
            )
          ) : (
            <DesktopRoutes user={userData} />
          )}
        </div>
        {isMobile && <Footer user={userData} />}
      </div>
    </Router>
  </UserProvider>

  );
};

export default App;
