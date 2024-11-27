import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom'; 
import Auth from '../Auth';
import Payment from '../Payment';
import CompanyDataForm from '../CompanyDataForm';
import AuthCreate from '../AuthCreate';
import Checkout from '../checkout';
import { auth } from '../../fb';
import { onAuthStateChanged } from 'firebase/auth';
import StoreDetails from '../StoreDetails';
import CreateUsers from '../CreateUsers';
import ForgetPassword from '../password/ForgetPassword';
import ChangePassword from '../password/ChangePassword';

const NonSubscriberRoutes = ({userDb}) => {
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
  return (
    <Routes>
      {user ? (
        <>
          {!userDb ? (
            <Route path="/" element={<CompanyDataForm />} />
          ) : (
            <>
              {userDb.status === false ? (
                <Route path="/" element={<Payment user={user} />} />
              ) : (
                <Route path="/" element={<Payment user={user} />} />
              )}
            </>
          )}
        </>
      ) : (
        <Route path="/" element={<Auth user={user} />} />
      )}
      <Route path="/auth" element={<Auth user={user} />} />
      <Route path="/create" element={<AuthCreate user={user} />} />
      <Route path="/setup" element={<CompanyDataForm />} />
      <Route path="/pricing" element={<Payment user={userDb} />} />
      <Route path="/Checkout/:plan" element={<Checkout user={userDb} />} />
      <Route path="/stores/:storeId" element={<StoreDetails />} />
      <Route path="/forget-password" element={<ForgetPassword />} />
      <Route path="/change-password" element={<ChangePassword user={user} />} />

      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
}


export default NonSubscriberRoutes;