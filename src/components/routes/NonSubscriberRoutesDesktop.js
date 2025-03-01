import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AuthDesk from '../AuthDesk';
import AuthCreateDesk from '../AuthCreateDesk';
import ForgetPasswordDesk from '../password/ForgetPasswordDesk';
import CompanyDataFormDesk from '../CompanyDataFormDesk';
import ChangePassword from '../password/ChangePassword';
import { auth } from '../../fb';
import { onAuthStateChanged } from 'firebase/auth';
import EmailVerification from '../EmailVerification';

const NonSubscriberRoutesDesktop = ({ userDb }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // Atualiza o estado do usuário
      setLoading(false); // Finaliza o carregamento
    });

    return () => unsubscribe(); // Limpa o listener ao desmontar
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!userDb && user) {
        // Se userDb não existe e o usuário está logado, redirecione para /setup
        navigate('/setup', { replace: true });
      } else if (!user) {
        // Se o usuário não está logado, redirecione para /auth
        navigate('/auth', { replace: true });
      } else if (userDb?.subscriptions?.isverify === 'false') {
        // Se a assinatura não está verificada, redirecione para /email-verification
        navigate('/email-verification', { replace: true });
      }
    }
  }, [loading, userDb, user, navigate]);

  if (loading) {
    return <div>Carregando...</div>; // Exibe um indicador de carregamento
  }

  return (
    <Routes>
      <Route path="/" element={<AuthDesk />} />
      <Route path="/auth" element={<AuthDesk user={user} />} />
      <Route path="/email-verification" element={<EmailVerification user={user?.email} />} />
      <Route path="/create" element={<AuthCreateDesk user={user} />} />
      <Route path="/setup" element={<CompanyDataFormDesk />} />
      <Route path="/forget-password" element={<ForgetPasswordDesk />} />
      <Route path="/change-password" element={<ChangePassword user={user} />} />
    </Routes>
  );
};

export default NonSubscriberRoutesDesktop;