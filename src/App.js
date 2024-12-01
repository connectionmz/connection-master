import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import './App.css';
import Home from './components/Home'; 
import Auth from './components/Auth';
import Header from './components/Header';
import { ThemeProvider } from './context/ThemeContext';
import Footer from './components/Footer';
import { auth, db } from './fb';
import { ref, get, set } from 'firebase/database'; 
import ClipLoader from "react-spinners/ClipLoader"; 
import { onAuthStateChanged } from 'firebase/auth';
import { UserProvider } from './context/UserProfileContext';
import UserRoutes from './components/routes/UserRoutes';
import NonSubscriberRoutes from './components/routes/NonSubscriberRoutes';

const App = () => {
  const [userData, setUserData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false); 
  const [isVerified, setIsVerified] = useState(false)
  const [allCompanyData, setAllCompanyData] = useState(null); // Para armazenar todos os dados da Realtime DB

  const fetchUserDataAndSubscription = async (user) => {
    try {
      const companyRef = ref(db, `company/${user.uid}`);
      const companySnapshot = await get(companyRef);

      if (companySnapshot.exists()) {
        const companyData = companySnapshot.val();

        setIsVerified(companyData.isVerified)

        console.log(isVerified)

        setUserData({
          ...companyData,
          photoURL: companyData.logoUrl || "https://via.placeholder.com/150",
          coverPhotoURL: companyData.coverUrl || "https://via.placeholder.com/600x200",
          displayName: companyData.nome || 'Nome da Empresa',
          username: companyData.id || 'ID da Empresa',
          endereco: companyData.endereco || 'Endereço da Empresa',
        });

        setSubscriptionActive(companyData.subscriptions.status);

        await set(ref(db, `company/${user.uid}/lastLogin`), new Date().toISOString());
      } else {
        setSubscriptionActive(false);
      }
      const allDataRef = ref(db, 'company'); 
      const allDataSnapshot = await get(allDataRef);
      if (allDataSnapshot.exists()) {
        const allData = allDataSnapshot.val();
        setAllCompanyData(allData); 
      } else {
        console.log('Não há dados disponíveis.');
      }

    } catch (error) {
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
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <ClipLoader color="#4A90E2" loading={loading} size={100} />
        <p className="loading-text">Carregando, por favor aguarde...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <div className="App">
            <Header />
            <div className='content'>
              {subscriptionActive ? (
                <UserRoutes user={userData} />
              ) : (
                <NonSubscriberRoutes userDb={userData} />
              )}
            </div>
            <Footer user={userData} />
          </div>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
