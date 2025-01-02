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
import CreateUsers from '../CreateUsers';

const NonSubscriberRoutes = ({ userDb }) => {
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

  const userExistsInDb = user && userDb?.[user.id];

  return (
    <Routes>
      {user ? (
        userExistsInDb ? (
          <>
            <Route path="/" element={<Payment user={user} />} />
            <Route path="/pricing" element={<Payment user={userDb} />} />
            <Route path="/Checkout/:plan" element={<Checkout user={userDb} />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/setup" replace />} />
        )
      ) : (
        <Route path="*" element={<Navigate to="/auth" replace />} />
      )}
      <Route path="/auth" element={<Auth user={user} />} />
      <Route path="/create" element={<AuthCreate user={user} />} />
      <Route path="/setup" element={<CompanyDataForm />} />
      <Route path="/stores/:storeId" element={<StoreDetails />} />
      <Route path="/forget-password" element={<ForgetPassword />} />
      <Route path="/change-password" element={<ChangePassword user={user} />} />
      <Route path="/createUsers" element={<CreateUsers />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default NonSubscriberRoutes;
