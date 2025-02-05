import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import Auth from '../Auth';
import Payment from '../Payment';
import CompanyDataForm from '../CompanyDataForm';
import AuthCreate from '../AuthCreate';
import Checkout from '../checkout';
import { auth } from '../../fb';
import { onAuthStateChanged } from 'firebase/auth';
import StoreDetails from '../StoreDetails';
import ForgetPassword from '../password/ForgetPassword';
import ChangePassword from '../password/ChangePassword';
import AuthDesk from '../AuthDesk';
import AuthCreateDesk from '../AuthCreateDesk';
import ForgetPasswordDesk from '../password/ForgetPasswordDesk';
import CompanyDataFormDesk from '../CompanyDataFormDesk';
import EmailVerification from '../EmailVerification';

const NonSubscriberRoutesDesktop  = ({ userDb }) => {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  const isVerified = userDb;


  return (
    <Routes>
      {user ? (
        <>
          {!userDb ? (
            <Route path="/" element={<CompanyDataFormDesk />} />
          ) : (
            <>
              <Route path="/" element={<Payment user={user} />} />
            </>
          )}
        </>
      ) : (
        <Route path="/" element={<AuthDesk user={user} />} />
      )}
      <Route path="/email-verification" element={<EmailVerification user={user} />} />
      <Route path="/auth" element={<AuthDesk user={user} />} />
      <Route path="/create" element={<AuthCreateDesk user={user} />} />
      <Route path="/setup" element={<CompanyDataFormDesk />} />
      <Route path="/stores/:storeId" element={<StoreDetails />} />
      <Route path="/forget-password" element={<ForgetPasswordDesk />} />
      <Route path="/change-password" element={<ChangePassword user={user} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default NonSubscriberRoutesDesktop ;
